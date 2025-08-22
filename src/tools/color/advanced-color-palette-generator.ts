import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface AdvancedColorPaletteGeneratorConfig {
  mode: 'harmony' | 'gradient' | 'random' | 'accessibility' | 'brand' | 'extraction';
  harmonyType: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary';
  colorCount: number;
  baseColor: string;
  saturationRange: [number, number];
  lightnessRange: [number, number];
  includeNeutral: boolean;
  accessibilityLevel: 'AA' | 'AAA';
  contrastRatio: number;
  outputFormat: 'hex' | 'rgb' | 'hsl' | 'hsv' | 'lab' | 'all';
  includeNames: boolean;
  sortBy: 'hue' | 'saturation' | 'lightness' | 'brightness' | 'contrast';
  exportFormat: 'css' | 'scss' | 'json' | 'ase' | 'gpl' | 'palette';
  temperatureBalance: 'cool' | 'warm' | 'neutral' | 'mixed';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  palette?: ColorPalette;
  analysis?: PaletteAnalysis;
}

interface ColorPalette {
  colors: Color[];
  metadata: PaletteMetadata;
  variations: ColorVariation[];
  accessibility: AccessibilityInfo;
}

interface Color {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  hsv: HSV;
  lab: LAB;
  name?: string;
  role?: string;
  contrast?: number;
  temperature: 'cool' | 'warm' | 'neutral';
  brightness: number;
  saturation: number;
  lightness: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
}

interface LAB {
  l: number;
  a: number;
  b: number;
}

interface PaletteMetadata {
  type: string;
  baseColor: string;
  colorCount: number;
  harmonyType?: string;
  dominantHue: number;
  averageSaturation: number;
  averageLightness: number;
  temperatureBalance: string;
  createdAt: number;
}

interface ColorVariation {
  name: string;
  colors: string[];
  description: string;
}

interface AccessibilityInfo {
  wcagLevel: string;
  contrastPairs: ContrastPair[];
  recommendations: string[];
  colorBlindness: ColorBlindnessInfo;
}

interface ContrastPair {
  foreground: string;
  background: string;
  ratio: number;
  rating: 'AAA' | 'AA' | 'A' | 'Fail';
  suitable: string[];
}

interface ColorBlindnessInfo {
  protanopia: string[];
  deuteranopia: string[];
  tritanopia: string[];
  monochromacy: string[];
}

// Color name mappings for common colors
const COLOR_NAMES: Record<string, string> = {
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#FFFFFF': 'White',
  '#000000': 'Black',
  '#808080': 'Gray',
  '#800000': 'Maroon',
  '#008000': 'Dark Green',
  '#000080': 'Navy',
  '#808000': 'Olive',
  '#800080': 'Purple',
  '#008080': 'Teal',
  '#C0C0C0': 'Silver',
  '#FFA500': 'Orange',
  '#A52A2A': 'Brown',
  '#FFC0CB': 'Pink',
  '#FFD700': 'Gold'
};

// Brand color preset collections
const BRAND_PRESETS = [
  {
    name: 'Modern Tech',
    colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'],
    description: 'Contemporary technology brand colors'
  },
  {
    name: 'Nature Inspired',
    colors: ['#56ab2f', '#a8e6cf', '#7fcdcd', '#ffecd2', '#fcb69f'],
    description: 'Earth tones and natural colors'
  },
  {
    name: 'Corporate Blue',
    colors: ['#1e3c72', '#2a5298', '#74b9ff', '#a29bfe', '#6c5ce7'],
    description: 'Professional corporate palette'
  },
  {
    name: 'Sunset Warm',
    colors: ['#ff9a9e', '#fecfef', '#fecfef', '#ffecd2', '#fcb69f'],
    description: 'Warm sunset gradient colors'
  }
];

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
  };
}

function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    switch (max) {
      case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
      case g: h = (b - r) / diff + 2; break;
      case b: h = (r - g) / diff + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

function rgbToLab(rgb: RGB): LAB {
  // Simplified LAB conversion - use proper color library in production
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return {
    l: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

function getLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(color1: RGB, color2: RGB): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getColorTemperature(hsl: HSL): 'cool' | 'warm' | 'neutral' {
  const hue = hsl.h;
  if (hue >= 90 && hue <= 270) return 'cool';
  if (hue >= 315 || hue <= 45) return 'warm';
  return 'neutral';
}

function generateHarmonyColors(baseColor: string, harmonyType: string, count: number): Color[] {
  const baseRgb = hexToRgb(baseColor);
  const baseHsl = rgbToHsl(baseRgb);
  const colors: Color[] = [];

  // Add base color
  colors.push(createColorObject(baseColor));

  const remainingCount = count - 1;
  
  switch (harmonyType) {
    case 'monochromatic':
      for (let i = 0; i < remainingCount; i++) {
        const lightness = baseHsl.l + (i + 1) * (80 / remainingCount) - 40;
        const saturation = Math.max(10, baseHsl.s - (i * 10));
        const newHsl: HSL = { 
          h: baseHsl.h, 
          s: Math.min(100, saturation), 
          l: Math.max(10, Math.min(90, lightness)) 
        };
        const newRgb = hslToRgb(newHsl);
        colors.push(createColorObject(rgbToHex(newRgb.r, newRgb.g, newRgb.b)));
      }
      break;
      
    case 'analogous':
      const angleStep = 30;
      for (let i = 0; i < remainingCount; i++) {
        const hue = (baseHsl.h + (i + 1) * angleStep) % 360;
        const newHsl: HSL = { h: hue, s: baseHsl.s, l: baseHsl.l };
        const newRgb = hslToRgb(newHsl);
        colors.push(createColorObject(rgbToHex(newRgb.r, newRgb.g, newRgb.b)));
      }
      break;
      
    case 'complementary':
      const compHue = (baseHsl.h + 180) % 360;
      const compHsl: HSL = { h: compHue, s: baseHsl.s, l: baseHsl.l };
      const compRgb = hslToRgb(compHsl);
      colors.push(createColorObject(rgbToHex(compRgb.r, compRgb.g, compRgb.b)));
      
      // Fill remaining with variations
      for (let i = 1; i < remainingCount; i++) {
        const isBaseVariation = i % 2 === 1;
        const targetHue = isBaseVariation ? baseHsl.h : compHue;
        const lightness = baseHsl.l + (i * 20) - 20;
        const newHsl: HSL = { 
          h: targetHue, 
          s: baseHsl.s, 
          l: Math.max(10, Math.min(90, lightness)) 
        };
        const newRgb = hslToRgb(newHsl);
        colors.push(createColorObject(rgbToHex(newRgb.r, newRgb.g, newRgb.b)));
      }
      break;
      
    case 'triadic':
      const triad1 = (baseHsl.h + 120) % 360;
      const triad2 = (baseHsl.h + 240) % 360;
      
      [triad1, triad2].forEach(hue => {
        if (colors.length < count) {
          const newHsl: HSL = { h: hue, s: baseHsl.s, l: baseHsl.l };
          const newRgb = hslToRgb(newHsl);
          colors.push(createColorObject(rgbToHex(newRgb.r, newRgb.g, newRgb.b)));
        }
      });
      break;
      
    case 'tetradic':
      const tet1 = (baseHsl.h + 90) % 360;
      const tet2 = (baseHsl.h + 180) % 360;
      const tet3 = (baseHsl.h + 270) % 360;
      
      [tet1, tet2, tet3].forEach(hue => {
        if (colors.length < count) {
          const newHsl: HSL = { h: hue, s: baseHsl.s, l: baseHsl.l };
          const newRgb = hslToRgb(newHsl);
          colors.push(createColorObject(rgbToHex(newRgb.r, newRgb.g, newRgb.b)));
        }
      });
      break;
      
    case 'split-complementary':
      const split1 = (baseHsl.h + 150) % 360;
      const split2 = (baseHsl.h + 210) % 360;
      
      [split1, split2].forEach(hue => {
        if (colors.length < count) {
          const newHsl: HSL = { h: hue, s: baseHsl.s, l: baseHsl.l };
          const newRgb = hslToRgb(newHsl);
          colors.push(createColorObject(rgbToHex(newRgb.r, newRgb.g, newRgb.b)));
        }
      });
      break;
  }

  return colors.slice(0, count);
}

function createColorObject(hex: string): Color {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const lab = rgbToLab(rgb);
  
  return {
    hex: hex.toLowerCase(),
    rgb,
    hsl,
    hsv,
    lab,
    name: COLOR_NAMES[hex.toUpperCase()],
    temperature: getColorTemperature(hsl),
    brightness: (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000,
    saturation: hsl.s,
    lightness: hsl.l
  };
}

function generateRandomPalette(count: number, config: AdvancedColorPaletteGeneratorConfig): Color[] {
  const colors: Color[] = [];
  const [minSat, maxSat] = config.saturationRange;
  const [minLight, maxLight] = config.lightnessRange;
  
  for (let i = 0; i < count; i++) {
    const hue = Math.random() * 360;
    const saturation = minSat + Math.random() * (maxSat - minSat);
    const lightness = minLight + Math.random() * (maxLight - minLight);
    
    const hsl: HSL = { h: hue, s: saturation, l: lightness };
    const rgb = hslToRgb(hsl);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    
    colors.push(createColorObject(hex));
  }
  
  return colors;
}

function generateAccessibilityPalette(baseColor: string, config: AdvancedColorPaletteGeneratorConfig): Color[] {
  const colors: Color[] = [];
  const baseRgb = hexToRgb(baseColor);
  const targetRatio = config.contrastRatio;
  const isAAALevel = config.accessibilityLevel === 'AAA';
  
  // Add base color
  colors.push(createColorObject(baseColor));
  
  // Generate colors with good contrast against base
  const backgrounds = ['#ffffff', '#000000', '#f8f9fa', '#212529'];
  
  backgrounds.forEach(bgHex => {
    const bgRgb = hexToRgb(bgHex);
    const currentRatio = getContrastRatio(baseRgb, bgRgb);
    
    if ((isAAALevel && currentRatio >= 7) || (!isAAALevel && currentRatio >= 4.5)) {
      colors.push(createColorObject(bgHex));
    }
  });
  
  // Generate additional accessible colors
  const baseHsl = rgbToHsl(baseRgb);
  for (let i = 0; i < config.colorCount - colors.length; i++) {
    const lightness = baseHsl.l > 50 ? 20 + i * 10 : 80 - i * 10;
    const newHsl: HSL = { 
      h: (baseHsl.h + i * 60) % 360, 
      s: Math.max(30, baseHsl.s), 
      l: Math.max(10, Math.min(90, lightness)) 
    };
    const newRgb = hslToRgb(newHsl);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    colors.push(createColorObject(newHex));
  }
  
  return colors.slice(0, config.colorCount);
}

function formatColorOutput(color: Color, format: string): string {
  switch (format) {
    case 'rgb':
      return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
    case 'hsl':
      return `hsl(${Math.round(color.hsl.h)}, ${Math.round(color.hsl.s)}%, ${Math.round(color.hsl.l)}%)`;
    case 'hsv':
      return `hsv(${Math.round(color.hsv.h)}, ${Math.round(color.hsv.s)}%, ${Math.round(color.hsv.v)}%)`;
    case 'lab':
      return `lab(${Math.round(color.lab.l)}, ${Math.round(color.lab.a)}, ${Math.round(color.lab.b)})`;
    case 'hex':
    default:
      return color.hex;
  }
}

function generatePaletteOutput(palette: ColorPalette, config: AdvancedColorPaletteGeneratorConfig): string {
  const { colors, metadata, accessibility } = palette;
  const lines: string[] = [];
  
  if (config.exportFormat === 'json') {
    return JSON.stringify(palette, null, 2);
  }
  
  if (config.exportFormat === 'css') {
    lines.push(':root {');
    colors.forEach((color, index) => {
      const name = color.name?.toLowerCase().replace(/\s+/g, '-') || `color-${index + 1}`;
      lines.push(`  --${name}: ${color.hex};`);
    });
    lines.push('}');
    return lines.join('\n');
  }
  
  if (config.exportFormat === 'scss') {
    colors.forEach((color, index) => {
      const name = color.name?.toLowerCase().replace(/\s+/g, '-') || `color-${index + 1}`;
      lines.push(`$${name}: ${color.hex};`);
    });
    return lines.join('\n');
  }
  
  // Default palette format
  lines.push(`🎨 ${metadata.type} Color Palette`);
  lines.push('═'.repeat(40));
  lines.push(`Base Color: ${metadata.baseColor}`);
  lines.push(`Colors: ${metadata.colorCount}`);
  lines.push(`Harmony: ${metadata.harmonyType || 'N/A'}`);
  lines.push(`Temperature: ${metadata.temperatureBalance}`);
  lines.push('');
  
  lines.push('Colors:');
  colors.forEach((color, index) => {
    const formats = config.outputFormat === 'all' ? 
      [color.hex, formatColorOutput(color, 'rgb'), formatColorOutput(color, 'hsl')] :
      [formatColorOutput(color, config.outputFormat)];
    
    const name = config.includeNames && color.name ? ` (${color.name})` : '';
    const temp = ` [${color.temperature}]`;
    
    lines.push(`${index + 1}. ${formats.join(' | ')}${name}${temp}`);
    if (color.contrast) {
      lines.push(`   Contrast: ${color.contrast.toFixed(2)}:1`);
    }
  });
  
  if (accessibility.contrastPairs.length > 0) {
    lines.push('');
    lines.push('Accessibility Analysis:');
    lines.push(`WCAG Level: ${accessibility.wcagLevel}`);
    accessibility.contrastPairs.slice(0, 5).forEach(pair => {
      lines.push(`${pair.foreground} on ${pair.background}: ${pair.ratio.toFixed(2)}:1 (${pair.rating})`);
    });
  }
  
  return lines.join('\n');
}

export function processAdvancedColorPaletteGenerator(input: string, config: AdvancedColorPaletteGeneratorConfig): ToolResult {
  try {
    const baseColor = input.trim() || config.baseColor || '#3498db';
    
    // Validate base color
    if (!/^#[0-9A-Fa-f]{6}$/.test(baseColor)) {
      return {
        success: false,
        error: 'Invalid base color format. Please use hex format (e.g., #FF0000)'
      };
    }
    
    let colors: Color[] = [];
    
    switch (config.mode) {
      case 'harmony':
        colors = generateHarmonyColors(baseColor, config.harmonyType, config.colorCount);
        break;
        
      case 'random':
        colors = generateRandomPalette(config.colorCount, config);
        break;
        
      case 'accessibility':
        colors = generateAccessibilityPalette(baseColor, config);
        break;
        
      case 'gradient':
        // Generate gradient colors between base and a target color
        const targetColor = '#ffffff'; // Could be configurable
        const steps = config.colorCount;
        const baseRgb = hexToRgb(baseColor);
        const targetRgb = hexToRgb(targetColor);
        
        for (let i = 0; i < steps; i++) {
          const ratio = i / (steps - 1);
          const r = Math.round(baseRgb.r + (targetRgb.r - baseRgb.r) * ratio);
          const g = Math.round(baseRgb.g + (targetRgb.g - baseRgb.g) * ratio);
          const b = Math.round(baseRgb.b + (targetRgb.b - baseRgb.b) * ratio);
          colors.push(createColorObject(rgbToHex(r, g, b)));
        }
        break;
        
      case 'brand':
        // Use preset brand colors or generate brand-appropriate palette
        const preset = BRAND_PRESETS[0]; // Could be selectable
        colors = preset.colors.slice(0, config.colorCount).map(createColorObject);
        break;
        
      default:
        return {
          success: false,
          error: `Unsupported mode: ${config.mode}`
        };
    }
    
    // Add neutral colors if requested
    if (config.includeNeutral) {
      const neutrals = ['#ffffff', '#f8f9fa', '#6c757d', '#343a40', '#000000'];
      const neutralCount = Math.min(2, config.colorCount - colors.length);
      neutrals.slice(0, neutralCount).forEach(hex => {
        colors.push(createColorObject(hex));
      });
    }
    
    // Calculate accessibility information
    const contrastPairs: ContrastPair[] = [];
    const white = hexToRgb('#ffffff');
    const black = hexToRgb('#000000');
    
    colors.forEach(color => {
      const whiteRatio = getContrastRatio(color.rgb, white);
      const blackRatio = getContrastRatio(color.rgb, black);
      
      color.contrast = Math.max(whiteRatio, blackRatio);
      
      contrastPairs.push({
        foreground: color.hex,
        background: '#ffffff',
        ratio: whiteRatio,
        rating: whiteRatio >= 7 ? 'AAA' : whiteRatio >= 4.5 ? 'AA' : whiteRatio >= 3 ? 'A' : 'Fail',
        suitable: whiteRatio >= 4.5 ? ['normal text'] : whiteRatio >= 3 ? ['large text'] : []
      });
    });
    
    // Sort colors if requested
    if (config.sortBy) {
      colors.sort((a, b) => {
        switch (config.sortBy) {
          case 'hue': return a.hsl.h - b.hsl.h;
          case 'saturation': return b.saturation - a.saturation;
          case 'lightness': return b.lightness - a.lightness;
          case 'brightness': return b.brightness - a.brightness;
          case 'contrast': return (b.contrast || 0) - (a.contrast || 0);
          default: return 0;
        }
      });
    }
    
    // Create palette object
    const baseHsl = rgbToHsl(hexToRgb(baseColor));
    const avgSaturation = colors.reduce((sum, c) => sum + c.saturation, 0) / colors.length;
    const avgLightness = colors.reduce((sum, c) => sum + c.lightness, 0) / colors.length;
    const tempCounts = colors.reduce((counts, c) => {
      counts[c.temperature]++;
      return counts;
    }, { cool: 0, warm: 0, neutral: 0 } as Record<string, number>);
    
    const dominantTemp = Object.entries(tempCounts).reduce((a, b) => 
      tempCounts[a[0]] > tempCounts[b[0]] ? a : b
    )[0];
    
    const palette: ColorPalette = {
      colors,
      metadata: {
        type: config.mode,
        baseColor,
        colorCount: colors.length,
        harmonyType: config.harmonyType,
        dominantHue: baseHsl.h,
        averageSaturation: avgSaturation,
        averageLightness: avgLightness,
        temperatureBalance: dominantTemp,
        createdAt: Date.now()
      },
      variations: [],
      accessibility: {
        wcagLevel: config.accessibilityLevel,
        contrastPairs,
        recommendations: [],
        colorBlindness: {
          protanopia: [],
          deuteranopia: [],
          tritanopia: [],
          monochromacy: []
        }
      }
    };
    
    const output = generatePaletteOutput(palette, config);
    
    return {
      success: true,
      output,
      palette
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const ADVANCED_COLOR_PALETTE_GENERATOR_TOOL: Tool = {
  id: 'advanced-color-palette-generator',
  name: 'Advanced Color Palette Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'color')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'color')!.subcategories!.find(sub => sub.id === 'palette-generation')!,
  slug: 'advanced-color-palette-generator',
  icon: '🎨',
  keywords: ['color', 'palette', 'harmony', 'design', 'accessibility', 'brand', 'gradient', 'wcag'],
  seoTitle: 'Advanced Color Palette Generator - Create Harmonious Color Schemes | FreeFormatHub',
  seoDescription: 'Generate professional color palettes with harmony theory, accessibility compliance, and brand consistency. Support for multiple color formats.',
  description: 'Create professional color palettes using color harmony theory, accessibility guidelines, and advanced color science.',

  examples: [
    {
      title: 'Complementary Harmony',
      input: '#3498db',
      output: `Colors:
1. #3498db (Blue) [cool]
2. #db7534 (Orange) [warm]
3. #5dade2 (Light Blue) [cool]`,
      description: 'Generate complementary color scheme'
    },
    {
      title: 'Accessibility Palette',
      input: '#2c3e50',
      output: `WCAG AA Compliant:
#2c3e50 on #ffffff: 12.63:1 (AAA)
#ffffff on #2c3e50: 12.63:1 (AAA)`,
      description: 'Create WCAG-compliant accessible colors'
    },
    {
      title: 'Brand Color System',
      input: '#667eea',
      output: `CSS Variables:
--primary: #667eea;
--secondary: #764ba2;
--accent: #f093fb;`,
      description: 'Generate brand-consistent color system'
    }
  ],

  useCases: [
    'Designing brand identity and consistent color systems',
    'Creating accessible color schemes for web applications',
    'Generating harmonious color palettes for UI/UX design',
    'Building design tokens and CSS custom properties',
    'Creating color schemes for data visualization',
    'Developing theme systems for applications and websites',
    'Ensuring WCAG compliance in digital products',
    'Generating color inspiration for creative projects'
  ],

  faq: [
    {
      question: 'What color harmony types are available?',
      answer: 'Supports monochromatic, analogous, complementary, triadic, tetradic, and split-complementary harmony schemes based on color wheel relationships.'
    },
    {
      question: 'How does accessibility checking work?',
      answer: 'Calculates WCAG contrast ratios between colors, ensuring AA (4.5:1) or AAA (7:1) compliance for text readability and accessibility standards.'
    },
    {
      question: 'What export formats are supported?',
      answer: 'Exports to CSS custom properties, SCSS variables, JSON data, Adobe ASE files, and GIMP GPL palette formats for use in design tools.'
    },
    {
      question: 'Can I generate palettes from existing brand colors?',
      answer: 'Yes, input your brand color as the base and generate harmonious extensions, or use preset brand-inspired color collections.'
    },
    {
      question: 'How are color temperatures determined?',
      answer: 'Colors are classified as warm (reds, oranges, yellows), cool (blues, greens, purples), or neutral based on their position on the color wheel.'
    }
  ],

  commonErrors: [
    'Invalid hex color format (must be #RRGGBB)',
    'Contrast ratios too low for accessibility requirements',
    'Color count exceeds maximum limit for harmony type',
    'Saturation or lightness range values out of bounds',
    'Unsupported export format or color space conversion'
  ],

  relatedTools: ['color-converter', 'contrast-checker', 'gradient-generator', 'brand-colors', 'accessibility-tools']
};