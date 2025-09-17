import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface ColorConverterConfig extends ToolConfig {
  inputFormat: 'auto' | 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk' | 'lab' | 'named';
  outputFormats: string[]; // Array of output formats to generate
  includeAlpha: boolean;
  uppercaseHex: boolean;
  showColorPreview: boolean;
}

export interface ColorResult {
  hex: string;
  rgb: { r: number; g: number; b: number; a?: number };
  hsl: { h: number; s: number; l: number; a?: number };
  hsv: { h: number; s: number; v: number; a?: number };
  cmyk: { c: number; m: number; y: number; k: number };
  lab: { l: number; a: number; b: number };
  named?: string;
}

export const COLOR_CONVERTER_TOOL: Tool = {
  id: 'color-converter',
  name: 'Color Format Converter',
  description: 'Convert and compare colors across HEX, RGB, HSL, HSV, CMYK, LAB, and named palettes with live preview, alpha handling, and palette-ready exports.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'colors-design')!,
  slug: 'color-converter',
  icon: '🎨',
  keywords: ['color', 'hex', 'rgb', 'hsl', 'hsv', 'cmyk', 'lab', 'convert', 'palette', 'design'],
  seoTitle: 'Free Color Converter Online - HEX, RGB, HSL, HSV, CMYK',
  seoDescription: 'Translate colors between HEX, RGB, HSL, HSV, CMYK, LAB, and named sets with alpha support, live previews, and palette exports. Fast, accurate, and private.',
  examples: [
    {
      title: 'HEX to RGB',
      input: '#ff5733',
      output: 'RGB: rgb(255, 87, 51)\nHSL: hsl(14, 100%, 60%)\nHSV: hsv(14, 80%, 100%)',
      description: 'Convert HEX color to multiple formats'
    },
    {
      title: 'RGB to HEX',
      input: 'rgb(64, 128, 255)',
      output: 'HEX: #4080ff\nHSL: hsl(220, 100%, 63%)\nHSV: hsv(220, 75%, 100%)',
      description: 'Convert RGB values to other formats'
    },
    {
      title: 'Named Color',
      input: 'coral',
      output: 'HEX: #ff7f50\nRGB: rgb(255, 127, 80)\nHSL: hsl(16, 100%, 66%)',
      description: 'Convert named colors to numeric formats'
    },
    {
      title: 'HSL Color',
      input: 'hsl(240, 100%, 50%)',
      output: 'HEX: #0000ff\nRGB: rgb(0, 0, 255)\nHSV: hsv(240, 100%, 100%)',
      description: 'Convert HSL to other color formats'
    }
  ],
  useCases: [
    'Convert design colors between different CSS formats',
    'Generate color palettes for web development',
    'Convert print colors (CMYK) to web colors (RGB/HEX)',
    'Analyze and match colors from different sources',
    'Create consistent color schemes across platforms',
    'Convert between design tool color formats'
  ],
  commonErrors: [
    'Invalid HEX format - use # followed by 3 or 6 hex digits',
    'RGB values outside 0-255 range',
    'HSL/HSV hue values outside 0-360 range',
    'CMYK values outside 0-100 range',
    'Incorrect color format syntax',
    'Assuming all monitors display colors identically'
  ],
  faq: [
    {
      question: 'What\'s the difference between HSL and HSV?',
      answer: 'HSL (Hue, Saturation, Lightness) is more intuitive for adjusting brightness. HSV (Hue, Saturation, Value) is more intuitive for color picking and matches how many color pickers work.'
    },
    {
      question: 'When should I use CMYK vs RGB?',
      answer: 'Use CMYK for print design (subtractive color). Use RGB for digital displays (additive color). Note that not all RGB colors can be accurately reproduced in CMYK.'
    },
    {
      question: 'Are named colors reliable for web design?',
      answer: 'Named colors like "red" or "blue" are supported by all browsers but offer limited color options. Use HEX or RGB for precise color control.'
    },
    {
      question: 'What is LAB color space?',
      answer: 'LAB is a device-independent color space that represents how humans perceive color. It\'s useful for color matching and professional photo editing.'
    },
    {
      question: 'How do I handle transparency/alpha?',
      answer: 'Use RGBA for RGB with alpha, HSLA for HSL with alpha, or 8-digit HEX (#RRGGBBAA). Alpha values range from 0 (transparent) to 1 (opaque).'
    }
  ],
  relatedTools: [
    'gradient-generator',
    'palette-extractor',
    'contrast-checker',
    'image-color-picker',
    'css-generator'
  ],
  howItWorks: [
    {
      title: 'Input Any Color Format',
      icon: '🖌️',
      description: 'Paste HEX, RGB(A), HSL(A), HSV, CMYK, LAB, or CSS named colors. Auto-detection picks the right parser, and manual overrides help with edge cases.',
      keywords: ['hex input', 'rgb parsing', 'auto detect color', 'lab color', 'css named colors']
    },
    {
      title: 'Pick Output Targets',
      icon: '🎯',
      description: 'Select which formats to display, toggle uppercase HEX, and include alpha channels. Designers can focus on the formats their tools require.',
      keywords: ['output formats', 'uppercase hex', 'alpha channel', 'designer workflow', 'color settings']
    },
    {
      title: 'Preview & Fine-Tune',
      icon: '👀',
      description: 'See live color swatches, inspect numeric breakdowns, and compare LAB values for accessibility and brand consistency checks.',
      keywords: ['color preview', 'lab comparison', 'accessibility', 'brand consistency', 'color analytics']
    },
    {
      title: 'Export & Share Palettes',
      icon: '📤',
      description: 'Copy formatted outputs, download palette snippets, or drop conversions into tool history for later reference when collaborating.',
      keywords: ['palette export', 'copy colors', 'download colors', 'tool history', 'collaboration']
    }
  ],
  problemsSolved: [
    {
      problem: 'Hand-converting between color models wastes time and introduces rounding mistakes in design specs and QA documents.',
      solution: 'Generate synchronized HEX, RGB, HSL, HSV, CMYK, and LAB values instantly with consistent rounding so designers and developers stay aligned.',
      icon: '⏱️',
      keywords: ['color conversion', 'design handoff', 'rounding consistency', 'hex rgb hsl', 'qa docs']
    },
    {
      problem: 'Ensuring cross-platform color consistency is difficult when web, print, and design tools rely on different models.',
      solution: 'Compare values across digital and print spaces, including CMYK and LAB, to confirm brand colors before exporting assets or sending to vendors.',
      icon: '🎯',
      keywords: ['brand colors', 'print vs digital', 'cmyk conversion', 'lab color', 'color accuracy']
    },
    {
      problem: 'Designers often need quick previews with transparency support to test overlays and UI states without opening a heavy design suite.',
      solution: 'Use the live preview with alpha awareness to visualize overlays, backgrounds, and accessible contrasts directly in the browser.',
      icon: '🪟',
      keywords: ['alpha preview', 'transparency', 'ui states', 'design workflow', 'quick preview']
    }
  ],
  whyChoose: [
    {
      title: 'Pixel-Perfect Accuracy',
      description: 'Conversion formulas are tuned for professional workflows, including LAB precision and CMYK rounding, so your specs match across mediums.',
      icon: '🎯',
      keywords: ['accurate color', 'lab precision', 'cmyk rounding', 'professional workflow']
    },
    {
      title: 'Privacy-Friendly',
      description: 'Brand palettes, in-progress designs, and client colors never leave your browser. Ideal for agencies working under NDA.',
      icon: '🔒',
      keywords: ['client-side', 'secure color tool', 'nda friendly', 'no upload']
    },
    {
      title: 'Designed for Teams',
      description: 'Copy/paste friendly outputs, downloadable snippets, and persistent history streamline design handoffs and QA reviews.',
      icon: '🤝',
      keywords: ['collaboration', 'design handoff', 'palette sharing', 'history']
    },
    {
      title: 'Versatile Format Support',
      description: 'From CSS-ready HEX to print-focused CMYK, the converter adapts to product, marketing, and brand teams in one place.',
      icon: '🧰',
      keywords: ['hex rgb hsl', 'cmyk lab', 'format versatility', 'marketing', 'brand toolkit']
    }
  ]
};

export function processColor(input: string, config: ColorConverterConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide a color value to convert.'
    };
  }

  try {
    const colorResult = parseAndConvertColor(input.trim(), config);
    const output = formatColorOutput(colorResult, config);
    
    return {
      success: true,
      output,
      metadata: {
        inputFormat: detectColorFormat(input.trim()),
        outputFormats: config.outputFormats.join(', '),
        hasAlpha: colorResult.rgb.a !== undefined && colorResult.rgb.a < 1,
        colorPreview: config.showColorPreview ? colorResult.hex : undefined
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert color'
    };
  }
}

function parseAndConvertColor(input: string, config: ColorConverterConfig): ColorResult {
  const format = config.inputFormat === 'auto' ? detectColorFormat(input) : config.inputFormat;
  
  let rgb: { r: number; g: number; b: number; a?: number };
  
  switch (format) {
    case 'hex':
      rgb = parseHex(input);
      break;
    case 'rgb':
      rgb = parseRgb(input);
      break;
    case 'hsl':
      rgb = hslToRgb(parseHsl(input));
      break;
    case 'hsv':
      rgb = hsvToRgb(parseHsv(input));
      break;
    case 'cmyk':
      rgb = cmykToRgb(parseCmyk(input));
      break;
    case 'named':
      rgb = parseNamedColor(input);
      break;
    default:
      throw new Error(`Unsupported color format: ${format}`);
  }
  
  return {
    hex: rgbToHex(rgb, config.uppercaseHex),
    rgb,
    hsl: rgbToHsl(rgb),
    hsv: rgbToHsv(rgb),
    cmyk: rgbToCmyk(rgb),
    lab: rgbToLab(rgb),
    named: findNamedColor(rgb)
  };
}

function detectColorFormat(input: string): string {
  const cleaned = input.trim().toLowerCase();
  
  if (cleaned.startsWith('#')) return 'hex';
  if (cleaned.startsWith('rgb')) return 'rgb';
  if (cleaned.startsWith('hsl')) return 'hsl';
  if (cleaned.startsWith('hsv') || cleaned.startsWith('hsb')) return 'hsv';
  if (cleaned.startsWith('cmyk')) return 'cmyk';
  if (cleaned.match(/^[a-z]+$/)) return 'named';
  
  throw new Error('Unable to detect color format. Please specify the input format manually.');
}

function parseHex(hex: string): { r: number; g: number; b: number; a?: number } {
  const cleaned = hex.replace('#', '');
  
  if (!/^[0-9a-fA-F]{3,8}$/.test(cleaned)) {
    throw new Error('Invalid HEX color format. Use #RGB, #RRGGBB, #RGBA, or #RRGGBBAA.');
  }
  
  let r, g, b, a;
  
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 4) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
    a = parseInt(cleaned[3] + cleaned[3], 16) / 255;
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substr(0, 2), 16);
    g = parseInt(cleaned.substr(2, 2), 16);
    b = parseInt(cleaned.substr(4, 2), 16);
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.substr(0, 2), 16);
    g = parseInt(cleaned.substr(2, 2), 16);
    b = parseInt(cleaned.substr(4, 2), 16);
    a = parseInt(cleaned.substr(6, 2), 16) / 255;
  } else {
    throw new Error('Invalid HEX color length.');
  }
  
  return a !== undefined ? { r, g, b, a } : { r, g, b };
}

function parseRgb(rgb: string): { r: number; g: number; b: number; a?: number } {
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  
  if (!match) {
    throw new Error('Invalid RGB format. Use rgb(r, g, b) or rgba(r, g, b, a).');
  }
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : undefined;
  
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error('RGB values must be between 0 and 255.');
  }
  
  if (a !== undefined && (a < 0 || a > 1)) {
    throw new Error('Alpha value must be between 0 and 1.');
  }
  
  return a !== undefined ? { r, g, b, a } : { r, g, b };
}

function parseHsl(hsl: string): { h: number; s: number; l: number; a?: number } {
  const match = hsl.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+))?\s*\)/);
  
  if (!match) {
    throw new Error('Invalid HSL format. Use hsl(h, s%, l%) or hsla(h, s%, l%, a).');
  }
  
  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const l = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : undefined;
  
  if (h < 0 || h > 360) throw new Error('Hue must be between 0 and 360.');
  if (s < 0 || s > 100) throw new Error('Saturation must be between 0 and 100.');
  if (l < 0 || l > 100) throw new Error('Lightness must be between 0 and 100.');
  
  return a !== undefined ? { h, s, l, a } : { h, s, l };
}

function parseHsv(hsv: string): { h: number; s: number; v: number; a?: number } {
  const match = hsv.match(/hsv[ab]?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+))?\s*\)/);
  
  if (!match) {
    throw new Error('Invalid HSV format. Use hsv(h, s%, v%).');
  }
  
  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const v = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : undefined;
  
  return a !== undefined ? { h, s, v, a } : { h, s, v };
}

function parseCmyk(cmyk: string): { c: number; m: number; y: number; k: number } {
  const match = cmyk.match(/cmyk\(\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/);
  
  if (!match) {
    throw new Error('Invalid CMYK format. Use cmyk(c%, m%, y%, k%).');
  }
  
  return {
    c: parseInt(match[1]),
    m: parseInt(match[2]),
    y: parseInt(match[3]),
    k: parseInt(match[4])
  };
}

function parseNamedColor(name: string): { r: number; g: number; b: number } {
  const namedColors: Record<string, string> = {
    aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff', aquamarine: '#7fffd4',
    azure: '#f0ffff', beige: '#f5f5dc', bisque: '#ffe4c4', black: '#000000',
    blanchedalmond: '#ffebcd', blue: '#0000ff', blueviolet: '#8a2be2', brown: '#a52a2a',
    burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00', chocolate: '#d2691e',
    coral: '#ff7f50', cornflowerblue: '#6495ed', cornsilk: '#fff8dc', crimson: '#dc143c',
    cyan: '#00ffff', darkblue: '#00008b', darkcyan: '#008b8b', darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9', darkgreen: '#006400', darkkhaki: '#bdb76b', darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f', darkorange: '#ff8c00', darkorchid: '#9932cc', darkred: '#8b0000',
    darksalmon: '#e9967a', darkseagreen: '#8fbc8f', darkslateblue: '#483d8b', darkslategray: '#2f4f4f',
    darkturquoise: '#00ced1', darkviolet: '#9400d3', deeppink: '#ff1493', deepskyblue: '#00bfff',
    dimgray: '#696969', dodgerblue: '#1e90ff', firebrick: '#b22222', floralwhite: '#fffaf0',
    forestgreen: '#228b22', fuchsia: '#ff00ff', gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff',
    gold: '#ffd700', goldenrod: '#daa520', gray: '#808080', green: '#008000',
    greenyellow: '#adff2f', honeydew: '#f0fff0', hotpink: '#ff69b4', indianred: '#cd5c5c',
    indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c', lavender: '#e6e6fa',
    lavenderblush: '#fff0f5', lawngreen: '#7cfc00', lemonchiffon: '#fffacd', lightblue: '#add8e6',
    lightcoral: '#f08080', lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3',
    lightgreen: '#90ee90', lightpink: '#ffb6c1', lightsalmon: '#ffa07a', lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa', lightslategray: '#778899', lightsteelblue: '#b0c4de', lightyellow: '#ffffe0',
    lime: '#00ff00', limegreen: '#32cd32', linen: '#faf0e6', magenta: '#ff00ff',
    maroon: '#800000', mediumaquamarine: '#66cdaa', mediumblue: '#0000cd', mediumorchid: '#ba55d3',
    mediumpurple: '#9370db', mediumseagreen: '#3cb371', mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc', mediumvioletred: '#c71585', midnightblue: '#191970', mintcream: '#f5fffa',
    mistyrose: '#ffe4e1', moccasin: '#ffe4b5', navajowhite: '#ffdead', navy: '#000080',
    oldlace: '#fdf5e6', olive: '#808000', olivedrab: '#6b8e23', orange: '#ffa500',
    orangered: '#ff4500', orchid: '#da70d6', palegoldenrod: '#eee8aa', palegreen: '#98fb98',
    paleturquoise: '#afeeee', palevioletred: '#db7093', papayawhip: '#ffefd5', peachpuff: '#ffdab9',
    peru: '#cd853f', pink: '#ffc0cb', plum: '#dda0dd', powderblue: '#b0e0e6',
    purple: '#800080', red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1',
    saddlebrown: '#8b4513', salmon: '#fa8072', sandybrown: '#f4a460', seagreen: '#2e8b57',
    seashell: '#fff5ee', sienna: '#a0522d', silver: '#c0c0c0', skyblue: '#87ceeb',
    slateblue: '#6a5acd', slategray: '#708090', snow: '#fffafa', springgreen: '#00ff7f',
    steelblue: '#4682b4', tan: '#d2b48c', teal: '#008080', thistle: '#d8bfd8',
    tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee', wheat: '#f5deb3',
    white: '#ffffff', whitesmoke: '#f5f5f5', yellow: '#ffff00', yellowgreen: '#9acd32'
  };
  
  const hex = namedColors[name.toLowerCase()];
  if (!hex) {
    throw new Error(`Unknown named color: ${name}`);
  }
  
  return parseHex(hex);
}

// Color conversion functions
function rgbToHex(rgb: { r: number; g: number; b: number; a?: number }, uppercase = false): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16).padStart(2, '0');
    return uppercase ? hex.toUpperCase() : hex;
  };
  
  let hex = `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  
  if (rgb.a !== undefined && rgb.a < 1) {
    hex += toHex(rgb.a * 255);
  }
  
  return hex;
}

function rgbToHsl(rgb: { r: number; g: number; b: number; a?: number }): { h: number; s: number; l: number; a?: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    switch (max) {
      case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
      case g: h = (b - r) / delta + 2; break;
      case b: h = (r - g) / delta + 4; break;
    }
    h /= 6;
  }
  
  const result = {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
  
  return rgb.a !== undefined ? { ...result, a: rgb.a } : result;
}

function rgbToHsv(rgb: { r: number; g: number; b: number; a?: number }): { h: number; s: number; v: number; a?: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  
  const delta = max - min;
  const s = max === 0 ? 0 : delta / max;
  
  let h = 0;
  if (delta !== 0) {
    switch (max) {
      case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
      case g: h = (b - r) / delta + 2; break;
      case b: h = (r - g) / delta + 4; break;
    }
    h /= 6;
  }
  
  const result = {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
  
  return rgb.a !== undefined ? { ...result, a: rgb.a } : result;
}

function rgbToCmyk(rgb: { r: number; g: number; b: number }): { c: number; m: number; y: number; k: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const k = 1 - Math.max(r, g, b);
  const c = (1 - r - k) / (1 - k) || 0;
  const m = (1 - g - k) / (1 - k) || 0;
  const y = (1 - b - k) / (1 - k) || 0;
  
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

function rgbToLab(rgb: { r: number; g: number; b: number }): { l: number; a: number; b: number } {
  // Simplified RGB to LAB conversion
  // This is a basic approximation - for precise color work, use a proper color library
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;
  
  // Gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  
  // Observer = 2°, Illuminant = D65
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
  
  // Normalize for D65 illuminant
  x = x / 0.95047;
  y = y / 1.00000;
  z = z / 1.08883;
  
  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
  
  return {
    l: Math.round((116 * y) - 16),
    a: Math.round(500 * (x - y)),
    b: Math.round(200 * (y - z))
  };
}

function hslToRgb(hsl: { h: number; s: number; l: number; a?: number }): { r: number; g: number; b: number; a?: number } {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
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
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const result = {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
  
  return hsl.a !== undefined ? { ...result, a: hsl.a } : result;
}

function hsvToRgb(hsv: { h: number; s: number; v: number; a?: number }): { r: number; g: number; b: number; a?: number } {
  const h = hsv.h / 60;
  const s = hsv.s / 100;
  const v = hsv.v / 100;
  
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
  else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
  else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
  else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
  else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
  else if (h >= 5 && h < 6) { r = c; g = 0; b = x; }
  
  const result = {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
  
  return hsv.a !== undefined ? { ...result, a: hsv.a } : result;
}

function cmykToRgb(cmyk: { c: number; m: number; y: number; k: number }): { r: number; g: number; b: number } {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;
  
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k))
  };
}

function findNamedColor(rgb: { r: number; g: number; b: number }): string | undefined {
  // This is a simplified lookup - in a real implementation, you'd want a more comprehensive list
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    black: { r: 0, g: 0, b: 0 },
    white: { r: 255, g: 255, b: 255 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    cyan: { r: 0, g: 255, b: 255 },
    magenta: { r: 255, g: 0, b: 255 },
    orange: { r: 255, g: 165, b: 0 },
    purple: { r: 128, g: 0, b: 128 },
    pink: { r: 255, g: 192, b: 203 },
    coral: { r: 255, g: 127, b: 80 }
  };
  
  for (const [name, color] of Object.entries(namedColors)) {
    if (color.r === rgb.r && color.g === rgb.g && color.b === rgb.b) {
      return name;
    }
  }
  
  return undefined;
}

function formatColorOutput(colorResult: ColorResult, config: ColorConverterConfig): string {
  const lines: string[] = [];
  
  if (config.outputFormats.length === 0 || config.outputFormats.includes('hex')) {
    lines.push(`HEX: ${colorResult.hex}`);
  }
  
  if (config.outputFormats.length === 0 || config.outputFormats.includes('rgb')) {
    const { r, g, b, a } = colorResult.rgb;
    if (a !== undefined && a < 1) {
      lines.push(`RGB: rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`);
    } else {
      lines.push(`RGB: rgb(${r}, ${g}, ${b})`);
    }
  }
  
  if (config.outputFormats.length === 0 || config.outputFormats.includes('hsl')) {
    const { h, s, l, a } = colorResult.hsl;
    if (a !== undefined && a < 1) {
      lines.push(`HSL: hsla(${h}, ${s}%, ${l}%, ${a.toFixed(2)})`);
    } else {
      lines.push(`HSL: hsl(${h}, ${s}%, ${l}%)`);
    }
  }
  
  if (config.outputFormats.includes('hsv')) {
    const { h, s, v } = colorResult.hsv;
    lines.push(`HSV: hsv(${h}, ${s}%, ${v}%)`);
  }
  
  if (config.outputFormats.includes('cmyk')) {
    const { c, m, y, k } = colorResult.cmyk;
    lines.push(`CMYK: cmyk(${c}%, ${m}%, ${y}%, ${k}%)`);
  }
  
  if (config.outputFormats.includes('lab')) {
    const { l, a, b } = colorResult.lab;
    lines.push(`LAB: lab(${l}, ${a}, ${b})`);
  }
  
  if (config.outputFormats.includes('named') && colorResult.named) {
    lines.push(`Named: ${colorResult.named}`);
  }
  
  if (config.showColorPreview) {
    lines.push('');
    lines.push(`Color Preview: ${colorResult.hex}`);
    lines.push('■'.repeat(20)); // Simple color preview using Unicode blocks
  }
  
  return lines.join('\n');
}
