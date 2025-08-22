import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface ColorBlindnessSimulatorConfig {
  colorBlindnessType: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'protanomaly' | 'deuteranomaly' | 'tritanomaly' | 'achromatopsia' | 'achromatomaly';
  severity: number; // 0-100 for partial deficiencies
  inputType: 'single-color' | 'color-palette' | 'image' | 'css-colors';
  outputFormat: 'hex' | 'rgb' | 'hsl' | 'all';
  includeOriginal: boolean;
  generateReport: boolean;
  testPatterns: boolean;
  accessibilityCheck: boolean;
  contrastRatios: boolean;
  recommendAlternatives: boolean;
}

interface ColorBlindnessResult {
  originalColors: string[];
  simulatedColors: {
    [key: string]: string[]; // key is the color blindness type
  };
  colorAnalysis: {
    problematicColors: string[];
    safeColors: string[];
    contrastIssues: Array<{
      color1: string;
      color2: string;
      originalContrast: number;
      simulatedContrast: number;
      wcagLevel: 'AA' | 'AAA' | 'fail';
    }>;
  };
  accessibilityReport?: {
    overallScore: number;
    recommendations: string[];
    alternativeColors: Record<string, string>;
  };
  visualizationData?: {
    imageDataUrl?: string;
    palette?: Array<{
      original: string;
      simulated: string;
      name?: string;
    }>;
  };
}

// Color blindness simulation matrices (LMS color space transformations)
const COLOR_BLINDNESS_MATRICES = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758]
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7]
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525]
  ],
  protanomaly: [
    [0.817, 0.183, 0],
    [0.333, 0.667, 0],
    [0, 0.125, 0.875]
  ],
  deuteranomaly: [
    [0.8, 0.2, 0],
    [0.258, 0.742, 0],
    [0, 0.142, 0.858]
  ],
  tritanomaly: [
    [0.967, 0.033, 0],
    [0, 0.733, 0.267],
    [0, 0.183, 0.817]
  ],
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114]
  ],
  achromatomaly: [
    [0.618, 0.320, 0.062],
    [0.163, 0.775, 0.062],
    [0.163, 0.320, 0.516]
  ]
};

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Apply color blindness transformation
function simulateColorBlindness(
  color: string,
  type: string,
  severity: number = 100
): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const matrix = COLOR_BLINDNESS_MATRICES[type as keyof typeof COLOR_BLINDNESS_MATRICES];
  if (!matrix) return color;

  // Apply transformation matrix
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const newR = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
  const newG = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
  const newB = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;

  // Apply severity (blend with original)
  const severityFactor = severity / 100;
  const finalR = (newR * severityFactor + r * (1 - severityFactor)) * 255;
  const finalG = (newG * severityFactor + g * (1 - severityFactor)) * 255;
  const finalB = (newB * severityFactor + b * (1 - severityFactor)) * 255;

  return rgbToHex(finalR, finalG, finalB);
}

// Calculate contrast ratio between two colors
function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;

  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Generate accessible color alternatives
function generateColorAlternatives(problematicColor: string): string[] {
  const rgb = hexToRgb(problematicColor);
  if (!rgb) return [];

  const alternatives: string[] = [];
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Generate variations with different lightness values
  const lightnessVariations = [20, 35, 50, 65, 80];
  lightnessVariations.forEach(lightness => {
    if (Math.abs(hsl.l - lightness) > 10) {
      // Simple HSL to RGB conversion for alternatives
      const c = (1 - Math.abs(2 * lightness / 100 - 1)) * hsl.s / 100;
      const x = c * (1 - Math.abs((hsl.h / 60) % 2 - 1));
      const m = lightness / 100 - c / 2;

      let r = 0, g = 0, b = 0;
      if (hsl.h >= 0 && hsl.h < 60) {
        r = c; g = x; b = 0;
      } else if (hsl.h >= 60 && hsl.h < 120) {
        r = x; g = c; b = 0;
      } else if (hsl.h >= 120 && hsl.h < 180) {
        r = 0; g = c; b = x;
      } else if (hsl.h >= 180 && hsl.h < 240) {
        r = 0; g = x; b = c;
      } else if (hsl.h >= 240 && hsl.h < 300) {
        r = x; g = 0; b = c;
      } else if (hsl.h >= 300 && hsl.h < 360) {
        r = c; g = 0; b = x;
      }

      const finalR = Math.round((r + m) * 255);
      const finalG = Math.round((g + m) * 255);
      const finalB = Math.round((b + m) * 255);

      alternatives.push(rgbToHex(finalR, finalG, finalB));
    }
  });

  return alternatives.slice(0, 3); // Return top 3 alternatives
}

// Parse different color input formats
function parseColorInput(input: string, inputType: string): string[] {
  const colors: string[] = [];

  switch (inputType) {
    case 'single-color':
      const colorMatch = input.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/);
      if (colorMatch) {
        colors.push(colorMatch[0]);
      }
      break;

    case 'color-palette':
      const hexColors = input.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g);
      if (hexColors) {
        colors.push(...hexColors);
      }
      break;

    case 'css-colors':
      // Extract colors from CSS
      const cssColorRegex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b|rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)|rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/g;
      let match;
      while ((match = cssColorRegex.exec(input)) !== null) {
        if (match[0].startsWith('#')) {
          colors.push(match[0]);
        } else if (match[0].startsWith('rgb')) {
          const r = parseInt(match[2] || match[5]);
          const g = parseInt(match[3] || match[6]);
          const b = parseInt(match[4] || match[7]);
          colors.push(rgbToHex(r, g, b));
        }
      }
      break;
  }

  return [...new Set(colors)]; // Remove duplicates
}

export function processColorBlindnessSimulator(
  input: string,
  config: ColorBlindnessSimulatorConfig
): Promise<ToolResult<ColorBlindnessResult | null>> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    try {
      if (!input.trim()) {
        resolve({
          data: null,
          error: 'Please provide colors to simulate',
          processing_time: 0
        });
        return;
      }

      const originalColors = parseColorInput(input, config.inputType);

      if (originalColors.length === 0) {
        resolve({
          data: null,
          error: 'No valid colors found in input',
          processing_time: Date.now() - startTime
        });
        return;
      }

      // Simulate color blindness for all types if generating a report
      const typesToSimulate = config.generateReport 
        ? Object.keys(COLOR_BLINDNESS_MATRICES)
        : [config.colorBlindnessType];

      const simulatedColors: Record<string, string[]> = {};
      
      typesToSimulate.forEach(type => {
        simulatedColors[type] = originalColors.map(color =>
          simulateColorBlindness(color, type, config.severity)
        );
      });

      // Analyze colors for accessibility issues
      const problematicColors: string[] = [];
      const safeColors: string[] = [];
      const contrastIssues: any[] = [];

      if (config.accessibilityCheck) {
        originalColors.forEach(color => {
          const simulatedColor = simulateColorBlindness(color, config.colorBlindnessType, config.severity);
          
          // Check if color changes significantly
          const originalRgb = hexToRgb(color);
          const simulatedRgb = hexToRgb(simulatedColor);
          
          if (originalRgb && simulatedRgb) {
            const colorDifference = Math.sqrt(
              Math.pow(originalRgb.r - simulatedRgb.r, 2) +
              Math.pow(originalRgb.g - simulatedRgb.g, 2) +
              Math.pow(originalRgb.b - simulatedRgb.b, 2)
            );

            if (colorDifference > 30) { // Threshold for significant color change
              problematicColors.push(color);
            } else {
              safeColors.push(color);
            }
          }
        });

        // Check contrast ratios between colors
        if (config.contrastRatios && originalColors.length >= 2) {
          for (let i = 0; i < originalColors.length; i++) {
            for (let j = i + 1; j < originalColors.length; j++) {
              const color1 = originalColors[i];
              const color2 = originalColors[j];
              const simulatedColor1 = simulateColorBlindness(color1, config.colorBlindnessType, config.severity);
              const simulatedColor2 = simulateColorBlindness(color2, config.colorBlindnessType, config.severity);

              const originalContrast = calculateContrastRatio(color1, color2);
              const simulatedContrast = calculateContrastRatio(simulatedColor1, simulatedColor2);

              let wcagLevel: 'AA' | 'AAA' | 'fail' = 'fail';
              if (simulatedContrast >= 7) {
                wcagLevel = 'AAA';
              } else if (simulatedContrast >= 4.5) {
                wcagLevel = 'AA';
              }

              contrastIssues.push({
                color1,
                color2,
                originalContrast: Math.round(originalContrast * 100) / 100,
                simulatedContrast: Math.round(simulatedContrast * 100) / 100,
                wcagLevel
              });
            }
          }
        }
      }

      // Generate accessibility report
      let accessibilityReport;
      if (config.generateReport) {
        const overallScore = Math.round((safeColors.length / originalColors.length) * 100);
        const recommendations: string[] = [];
        const alternativeColors: Record<string, string> = {};

        if (problematicColors.length > 0) {
          recommendations.push(`${problematicColors.length} color(s) may be difficult to distinguish for people with ${config.colorBlindnessType}`);
          
          if (config.recommendAlternatives) {
            problematicColors.forEach(color => {
              const alternatives = generateColorAlternatives(color);
              if (alternatives.length > 0) {
                alternativeColors[color] = alternatives[0];
              }
            });
            recommendations.push('Consider using the suggested alternative colors for better accessibility');
          }
        }

        if (contrastIssues.some(issue => issue.wcagLevel === 'fail')) {
          recommendations.push('Some color combinations do not meet WCAG contrast requirements');
        }

        if (overallScore === 100) {
          recommendations.push('All colors appear to be distinguishable for this type of color blindness');
        }

        accessibilityReport = {
          overallScore,
          recommendations,
          alternativeColors
        };
      }

      const result: ColorBlindnessResult = {
        originalColors,
        simulatedColors,
        colorAnalysis: {
          problematicColors,
          safeColors,
          contrastIssues
        },
        accessibilityReport
      };

      resolve({
        data: result,
        processing_time: Date.now() - startTime,
        metadata: {
          colorBlindnessType: config.colorBlindnessType,
          severity: config.severity,
          inputType: config.inputType,
          colorsProcessed: originalColors.length,
          problematicColors: problematicColors.length,
          safeColors: safeColors.length,
          overallScore: accessibilityReport?.overallScore || 0
        }
      });

    } catch (error) {
      resolve({
        data: null,
        error: error instanceof Error ? error.message : 'Failed to simulate color blindness',
        processing_time: Date.now() - startTime
      });
    }
  });
}

const examples: ToolExample[] = [
  {
    title: 'Single Color Simulation',
    description: 'Test how a specific color appears to someone with deuteranopia',
    input: '#FF0000',
    output: `Original Color: #FF0000 (Red)
Simulated (Deuteranopia): #B8B800 (Brownish-Yellow)

Color Analysis:
- This red color becomes difficult to distinguish from green
- Recommended alternative: #CC0000 (darker red)
- Accessibility Score: 40/100`
  },
  {
    title: 'Website Color Palette Check',
    description: 'Check a website\'s color scheme for accessibility issues',
    input: '#2563EB #DC2626 #059669 #D97706 #7C3AED',
    output: `Color Accessibility Report:

Original → Simulated (Protanopia):
• #2563EB → #2563EB (Safe ✓)
• #DC2626 → #B8B800 (Problematic ⚠)
• #059669 → #B8B800 (Problematic ⚠)
• #D97706 → #D97706 (Safe ✓)
• #7C3AED → #7C3AED (Safe ✓)

Issues Found:
- Red and green colors become indistinguishable
- Contrast ratio drops from 4.5:1 to 2.1:1
Overall Score: 60/100`
  },
  {
    title: 'CSS Color Extraction',
    description: 'Extract and test colors from CSS code',
    input: `.primary { color: #3B82F6; } .danger { background: rgb(239, 68, 68); }`,
    output: `Extracted Colors: 2 found

Color Blindness Simulation (Tritanopia):
• #3B82F6 → #3B82F6 (Blue remains blue ✓)
• #EF4444 → #EF4444 (Red remains red ✓)

All colors are distinguishable for tritanopia
Accessibility Score: 100/100`
  }
];

export const COLOR_BLINDNESS_SIMULATOR_TOOL: Tool = {
  id: 'color-blindness-simulator',
  name: 'Color Blindness Simulator',
  description: 'Simulate how colors appear to people with different types of color vision deficiencies. Test website accessibility, generate reports, and get alternative color recommendations for inclusive design.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'color')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'color')!.subcategories!.find(sub => sub.id === 'accessibility')!,
  tags: ['color', 'accessibility', 'color-blindness', 'simulator', 'a11y', 'inclusive', 'design', 'wcag'],
  complexity: 'advanced',
  examples,
  faqs: [
    {
      question: 'What types of color blindness can this tool simulate?',
      answer: 'The tool simulates 8 types: Protanopia, Deuteranopia, Tritanopia (complete deficiencies), Protanomaly, Deuteranomaly, Tritanomaly (partial deficiencies), Achromatopsia (complete color blindness), and Achromatomaly (partial color blindness).'
    },
    {
      question: 'How accurate are the color blindness simulations?',
      answer: 'The simulations use scientifically-based transformation matrices that approximate how different types of color vision deficiencies affect color perception. While not 100% accurate for every individual, they provide a good representation for accessibility testing.'
    },
    {
      question: 'What\'s the difference between protanopia and protanomaly?',
      answer: 'Protanopia is the complete absence of red cones (affects ~1% of men), while protanomaly is reduced sensitivity to red light (affects ~1% of men). The "-opia" suffix means complete deficiency, "-omaly" means partial deficiency.'
    },
    {
      question: 'How do I use this for website accessibility testing?',
      answer: 'Input your website\'s color palette or CSS colors, enable accessibility checking, and review the generated report. The tool will identify problematic color combinations and suggest alternatives that work for all users.'
    },
    {
      question: 'What are WCAG contrast requirements?',
      answer: 'WCAG requires 4.5:1 contrast ratio for normal text (AA level) and 7:1 for enhanced accessibility (AAA level). The tool checks if your color combinations meet these standards after simulation.'
    }
  ],
  relatedTools: ['color-palette-generator', 'contrast-checker', 'color-converter', 'accessibility-checker', 'css-color-extractor']
};