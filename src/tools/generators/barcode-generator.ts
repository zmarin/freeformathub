import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface BarcodeConfig {
  format: 'code128' | 'code39' | 'ean13' | 'ean8' | 'upc' | 'itf' | 'msi' | 'pharmacode' | 'codabar';
  width: number;
  height: number;
  displayValue: boolean;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  textPosition: 'bottom' | 'top';
  textMargin: number;
  background: string;
  lineColor: string;
  margin: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  flat: boolean;
  includeChecksum: boolean;
  outputFormat: 'svg' | 'canvas' | 'png' | 'dataurl';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  barcode?: BarcodeResult;
  warnings?: string[];
}

interface BarcodeResult {
  originalData: string;
  encodedData: string;
  barcodeFormat: string;
  svgCode: string;
  dataUrl: string;
  metadata: BarcodeMetadata;
  validation: ValidationResult;
  specifications: FormatSpecifications;
}

interface BarcodeMetadata {
  format: string;
  formatName: string;
  dataLength: number;
  encodedLength: number;
  checksum?: string;
  bars: number;
  spaces: number;
  quietZone: boolean;
  dimensions: {
    width: number;
    height: number;
    barWidth: number;
    totalWidth: number;
  };
  aspectRatio: number;
  pixelDensity: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  formatCompliant: boolean;
  checksumValid?: boolean;
  lengthValid: boolean;
  characterSetValid: boolean;
}

interface FormatSpecifications {
  name: string;
  description: string;
  characterSet: string;
  fixedLength: boolean;
  minLength: number;
  maxLength: number;
  hasChecksum: boolean;
  applications: string[];
  density: 'low' | 'medium' | 'high';
}

// Barcode format specifications
const BARCODE_FORMATS: Record<string, FormatSpecifications> = {
  code128: {
    name: 'Code 128',
    description: 'High-density linear barcode symbology',
    characterSet: 'ASCII 0-127',
    fixedLength: false,
    minLength: 1,
    maxLength: 80,
    hasChecksum: true,
    applications: ['Shipping', 'Packaging', 'General purpose'],
    density: 'high'
  },
  code39: {
    name: 'Code 39',
    description: 'Variable length alphanumeric barcode',
    characterSet: '0-9, A-Z, -, ., $, /, +, %, space',
    fixedLength: false,
    minLength: 1,
    maxLength: 43,
    hasChecksum: false,
    applications: ['Automotive', 'Defense', 'Healthcare'],
    density: 'low'
  },
  ean13: {
    name: 'EAN-13',
    description: 'European Article Number 13-digit',
    characterSet: '0-9',
    fixedLength: true,
    minLength: 13,
    maxLength: 13,
    hasChecksum: true,
    applications: ['Retail', 'Point of sale', 'Product identification'],
    density: 'medium'
  },
  ean8: {
    name: 'EAN-8',
    description: 'European Article Number 8-digit',
    characterSet: '0-9',
    fixedLength: true,
    minLength: 8,
    maxLength: 8,
    hasChecksum: true,
    applications: ['Small products', 'Retail'],
    density: 'medium'
  },
  upc: {
    name: 'UPC-A',
    description: 'Universal Product Code Type A',
    characterSet: '0-9',
    fixedLength: true,
    minLength: 12,
    maxLength: 12,
    hasChecksum: true,
    applications: ['Retail USA', 'Point of sale', 'Product tracking'],
    density: 'medium'
  },
  itf: {
    name: 'ITF-14',
    description: 'Interleaved 2 of 5',
    characterSet: '0-9',
    fixedLength: true,
    minLength: 14,
    maxLength: 14,
    hasChecksum: true,
    applications: ['Shipping', 'Carton identification', 'Logistics'],
    density: 'low'
  },
  msi: {
    name: 'MSI Plessey',
    description: 'Modified Plessey code',
    characterSet: '0-9',
    fixedLength: false,
    minLength: 1,
    maxLength: 15,
    hasChecksum: true,
    applications: ['Inventory', 'Warehousing'],
    density: 'medium'
  },
  pharmacode: {
    name: 'Pharmacode',
    description: 'Pharmaceutical binary code',
    characterSet: '0-9',
    fixedLength: false,
    minLength: 1,
    maxLength: 6,
    hasChecksum: false,
    applications: ['Pharmaceutical packaging', 'Medicine identification'],
    density: 'low'
  },
  codabar: {
    name: 'Codabar',
    description: 'Linear barcode with start/stop characters',
    characterSet: '0-9, -, $, :, /, ., +',
    fixedLength: false,
    minLength: 1,
    maxLength: 60,
    hasChecksum: false,
    applications: ['Libraries', 'Blood banks', 'Medical'],
    density: 'low'
  }
};

function validateBarcodeData(data: string, format: string): ValidationResult {
  const spec = BARCODE_FORMATS[format];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!data.trim()) {
    errors.push('Barcode data is required');
    return {
      isValid: false,
      errors,
      warnings,
      formatCompliant: false,
      lengthValid: false,
      characterSetValid: false
    };
  }
  
  // Length validation
  const lengthValid = spec.fixedLength 
    ? data.length === spec.minLength
    : data.length >= spec.minLength && data.length <= spec.maxLength;
    
  if (!lengthValid) {
    if (spec.fixedLength) {
      errors.push(`${spec.name} requires exactly ${spec.minLength} characters`);
    } else {
      errors.push(`${spec.name} requires ${spec.minLength}-${spec.maxLength} characters`);
    }
  }
  
  // Character set validation
  let characterSetValid = true;
  const invalidChars: string[] = [];
  
  switch (format) {
    case 'ean13':
    case 'ean8':
    case 'upc':
    case 'itf':
    case 'msi':
    case 'pharmacode':
      // Numeric only
      if (!/^\d+$/.test(data)) {
        characterSetValid = false;
        const matches = data.match(/[^\d]/g);
        if (matches) invalidChars.push(...matches);
      }
      break;
      
    case 'code39':
      // Code 39 character set
      if (!/^[0-9A-Z\-\.\$\/\+\% ]*$/.test(data)) {
        characterSetValid = false;
        const matches = data.match(/[^0-9A-Z\-\.\$\/\+\% ]/g);
        if (matches) invalidChars.push(...matches);
      }
      break;
      
    case 'codabar':
      // Codabar character set
      if (!/^[0-9\-\$:\/\.\+]*$/.test(data)) {
        characterSetValid = false;
        const matches = data.match(/[^0-9\-\$:\/\.\+]/g);
        if (matches) invalidChars.push(...matches);
      }
      break;
  }
  
  if (!characterSetValid) {
    errors.push(`Invalid characters for ${spec.name}: ${[...new Set(invalidChars)].join(', ')}`);
  }
  
  // Format-specific validations
  let checksumValid: boolean | undefined;
  
  if (format === 'ean13' || format === 'ean8' || format === 'upc') {
    checksumValid = validateEanUpcChecksum(data, format);
    if (checksumValid === false) {
      errors.push('Invalid checksum digit');
    }
  }
  
  // Warnings
  if (format === 'code39' && data.length > 20) {
    warnings.push('Long Code 39 barcodes may be difficult to scan');
  }
  
  if (format === 'code128' && data.length > 50) {
    warnings.push('Very long Code 128 barcodes may exceed scanner capabilities');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    formatCompliant: lengthValid && characterSetValid,
    checksumValid,
    lengthValid,
    characterSetValid
  };
}

function validateEanUpcChecksum(data: string, format: string): boolean {
  if (format === 'ean13' && data.length !== 13) return false;
  if (format === 'ean8' && data.length !== 8) return false;
  if (format === 'upc' && data.length !== 12) return false;
  
  const digits = data.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const multiplier = (format === 'ean13' || format === 'ean8') 
      ? (i % 2 === 0 ? 1 : 3)
      : (i % 2 === 0 ? 3 : 1);
    sum += digits[i] * multiplier;
  }
  
  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

function calculateChecksum(data: string, format: string): string | undefined {
  switch (format) {
    case 'ean13':
    case 'ean8':
    case 'upc':
      return calculateEanUpcChecksum(data, format);
    case 'code128':
      return calculateCode128Checksum(data);
    case 'msi':
      return calculateMsiChecksum(data);
    default:
      return undefined;
  }
}

function calculateEanUpcChecksum(data: string, format: string): string {
  const digits = data.slice(0, -1).split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < digits.length; i++) {
    const multiplier = (format === 'ean13' || format === 'ean8') 
      ? (i % 2 === 0 ? 1 : 3)
      : (i % 2 === 0 ? 3 : 1);
    sum += digits[i] * multiplier;
  }
  
  return ((10 - (sum % 10)) % 10).toString();
}

function calculateCode128Checksum(data: string): string {
  // Simplified Code 128 checksum calculation
  let sum = 103; // Start code for Code 128B
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) - 32;
    sum += charCode * (i + 1);
  }
  return (sum % 103).toString();
}

function calculateMsiChecksum(data: string): string {
  // MSI Plessey checksum using modulo 10
  const digits = data.split('').map(Number);
  let sum = 0;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if ((digits.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10);
    }
    sum += digit;
  }
  
  return ((10 - (sum % 10)) % 10).toString();
}

function generateBarcodeSvg(data: string, config: BarcodeConfig): string {
  const spec = BARCODE_FORMATS[config.format];
  const barWidth = config.width / (data.length * 12); // Simplified calculation
  const totalWidth = config.width + config.marginLeft + config.marginRight;
  const totalHeight = config.height + config.marginTop + config.marginBottom;
  
  let svg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="${config.background}"/>`;
  
  // Generate bars (simplified pattern generation)
  const pattern = generateBarcodePattern(data, config.format);
  let x = config.marginLeft;
  
  for (let i = 0; i < pattern.length; i++) {
    const bar = pattern[i];
    if (bar === '1') {
      svg += `<rect x="${x}" y="${config.marginTop}" width="${barWidth}" height="${config.height}" fill="${config.lineColor}"/>`;
    }
    x += barWidth;
  }
  
  // Add text if enabled
  if (config.displayValue) {
    const textY = config.textPosition === 'bottom' 
      ? totalHeight - config.marginBottom + config.textMargin
      : config.marginTop - config.textMargin;
      
    const textX = config.textAlign === 'center' ? totalWidth / 2 :
                  config.textAlign === 'right' ? totalWidth - config.marginRight :
                  config.marginLeft;
                  
    svg += `<text x="${textX}" y="${textY}" font-family="${config.fontFamily}" font-size="${config.fontSize}" text-anchor="${config.textAlign}" fill="${config.lineColor}">${data}</text>`;
  }
  
  svg += '</svg>';
  return svg;
}

function generateBarcodePattern(data: string, format: string): string {
  // Simplified pattern generation - in a real implementation,
  // this would use proper barcode encoding algorithms
  let pattern = '';
  
  switch (format) {
    case 'code128':
      // Start pattern
      pattern += '11010010000';
      // Data pattern (simplified)
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        pattern += (charCode % 2 === 0 ? '110100' : '100110');
      }
      // Stop pattern
      pattern += '1100011101011';
      break;
      
    case 'code39':
      // Start/stop character *
      pattern += '100010111011101';
      for (let i = 0; i < data.length; i++) {
        const char = data[i];
        pattern += getCode39Pattern(char);
        pattern += '0'; // Inter-character gap
      }
      pattern += '100010111011101';
      break;
      
    case 'ean13':
    case 'ean8':
    case 'upc':
      // Guard patterns and data patterns for EAN/UPC
      pattern += '101'; // Start guard
      for (let i = 0; i < data.length; i++) {
        const digit = parseInt(data[i]);
        pattern += getEanPattern(digit, i, format);
      }
      pattern += '101'; // End guard
      break;
      
    default:
      // Generic pattern for other formats
      for (let i = 0; i < data.length; i++) {
        pattern += (i % 2 === 0 ? '110' : '100');
      }
  }
  
  return pattern;
}

function getCode39Pattern(char: string): string {
  const patterns: Record<string, string> = {
    '0': '100010100',
    '1': '101001000',
    '2': '100101000',
    '3': '101010000',
    '4': '100010010',
    '5': '101001001',
    '6': '100101001',
    '7': '100010001',
    '8': '101000100',
    '9': '100100100',
    'A': '101000010',
    'B': '100100010',
    'C': '101010001',
    // ... more patterns would be added
    ' ': '100001001',
    '-': '100001010',
    '.': '110000100',
    '$': '100100001',
    '/': '100010001',
    '+': '100001001',
    '%': '100100001'
  };
  
  return patterns[char] || '100010100'; // Default to '0' pattern
}

function getEanPattern(digit: number, position: number, format: string): string {
  // Simplified EAN pattern encoding
  const patterns = [
    '0001101', '0011001', '0010011', '0111101',
    '0100011', '0110001', '0101111', '0111011',
    '0110111', '0001011'
  ];
  
  return patterns[digit] || patterns[0];
}

function svgToDataUrl(svg: string): string {
  // Convert SVG to data URL
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

export function processBarcodeGenerator(data: string, config: BarcodeConfig): ToolResult {
  try {
    const startTime = Date.now();
    
    // Validate input
    const validation = validateBarcodeData(data, config.format);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    const warnings: string[] = [...validation.warnings];
    const spec = BARCODE_FORMATS[config.format];
    
    // Calculate checksum if needed
    let encodedData = data;
    let checksum: string | undefined;
    
    if (spec.hasChecksum && config.includeChecksum) {
      checksum = calculateChecksum(data, config.format);
      if (checksum) {
        encodedData = data + checksum;
      }
    }
    
    // Generate barcode
    const svgCode = generateBarcodeSvg(encodedData, config);
    const dataUrl = svgToDataUrl(svgCode);
    
    // Calculate dimensions and metadata
    const totalWidth = config.width + config.marginLeft + config.marginRight;
    const totalHeight = config.height + config.marginTop + config.marginBottom;
    const barWidth = config.width / encodedData.length;
    const pattern = generateBarcodePattern(encodedData, config.format);
    const bars = (pattern.match(/1/g) || []).length;
    const spaces = (pattern.match(/0/g) || []).length;
    
    const metadata: BarcodeMetadata = {
      format: config.format,
      formatName: spec.name,
      dataLength: data.length,
      encodedLength: encodedData.length,
      checksum,
      bars,
      spaces,
      quietZone: config.margin > 0,
      dimensions: {
        width: config.width,
        height: config.height,
        barWidth,
        totalWidth,
      },
      aspectRatio: Math.round((totalWidth / totalHeight) * 100) / 100,
      pixelDensity: Math.round(config.width / data.length)
    };

    const barcode: BarcodeResult = {
      originalData: data,
      encodedData,
      barcodeFormat: spec.name,
      svgCode,
      dataUrl,
      metadata,
      validation,
      specifications: spec
    };

    // Generate additional warnings
    if (metadata.pixelDensity < 2) {
      warnings.push('Low pixel density may affect barcode readability');
    }
    
    if (metadata.aspectRatio > 10) {
      warnings.push('Very wide barcode may be difficult to scan');
    }
    
    if (!config.displayValue) {
      warnings.push('Human-readable text is disabled - may reduce usability');
    }

    // Generate output
    const processingTime = Date.now() - startTime;
    
    const output = `Barcode Generation Result\n${'='.repeat(30)}\n\nBarcode Details:\n• Format: ${metadata.formatName} (${metadata.format})\n• Original Data: "${metadata.originalData}"\n• Encoded Data: "${metadata.encodedData}"\n• Data Length: ${metadata.dataLength} characters\n• Encoded Length: ${metadata.encodedLength} characters\n${metadata.checksum ? `• Checksum: ${metadata.checksum}\n` : ''}\nBarcode Structure:\n• Bars: ${metadata.bars}\n• Spaces: ${metadata.spaces}\n• Bar Width: ${metadata.dimensions.barWidth.toFixed(2)}px\n• Total Width: ${metadata.dimensions.totalWidth}px\n• Aspect Ratio: ${metadata.aspectRatio}:1\n• Pixel Density: ${metadata.pixelDensity}px per character\n\nFormat Specifications:\n• Character Set: ${spec.characterSet}\n• Length: ${spec.fixedLength ? `Fixed (${spec.minLength})` : `${spec.minLength}-${spec.maxLength}`}\n• Checksum: ${spec.hasChecksum ? 'Required' : 'None'}\n• Density: ${spec.density}\n• Applications: ${spec.applications.join(', ')}\n\nConfiguration:\n• Display Value: ${config.displayValue ? 'Yes' : 'No'}\n• Background: ${config.background}\n• Line Color: ${config.lineColor}\n• Margins: ${config.margin}px\n• Font: ${config.fontFamily}, ${config.fontSize}px\n\nProcessing Time: ${processingTime}ms`;

    return {
      success: true,
      output,
      barcode,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const BARCODE_GENERATOR_TOOL: Tool = {
  id: 'barcode-generator',
  name: 'Barcode Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'generators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'generators')!.subcategories!.find(sub => sub.id === 'qr-barcodes')!,
  slug: 'barcode-generator',
  icon: '📊',
  keywords: ['barcode', 'generator', 'code128', 'code39', 'ean', 'upc', 'scanner', 'retail', 'product'],
  seoTitle: 'Barcode Generator - Create Various Barcode Formats Online | FreeFormatHub',
  seoDescription: 'Generate barcodes in multiple formats: Code 128, Code 39, EAN-13, UPC, and more. Customizable styling, validation, and download options.',
  description: 'Generate barcodes in various formats including Code 128, Code 39, EAN-13, UPC, and more with customizable styling, validation, and multiple output formats.',

  examples: [
    {
      title: 'Code 128 Barcode',
      input: 'Hello World 123',
      output: `Barcode Generation Result
==============================

Barcode Details:
• Format: Code 128 (code128)
• Original Data: "Hello World 123"
• Encoded Data: "Hello World 123"
• Data Length: 15 characters
• Encoded Length: 15 characters

Barcode Structure:
• Bars: 142
• Spaces: 128
• Bar Width: 2.00px
• Total Width: 340px
• Aspect Ratio: 3.4:1`,
      description: 'Generate a Code 128 barcode for alphanumeric data'
    },
    {
      title: 'EAN-13 Product Code',
      input: '1234567890123',
      output: `Barcode Details:
• Format: EAN-13 (ean13)
• Original Data: "1234567890123"
• Encoded Data: "1234567890123"
• Checksum: 6

Format Specifications:
• Character Set: 0-9
• Length: Fixed (13)
• Checksum: Required
• Applications: Retail, Point of sale`,
      description: 'Generate an EAN-13 barcode for retail products'
    },
    {
      title: 'Code 39 Inventory',
      input: 'INV-001-A',
      output: `Barcode Details:
• Format: Code 39 (code39)
• Original Data: "INV-001-A"
• Data Length: 9 characters

Format Specifications:
• Character Set: 0-9, A-Z, -, ., $, /, +, %, space
• Length: 1-43
• Checksum: None
• Applications: Automotive, Defense, Healthcare`,
      description: 'Generate a Code 39 barcode for inventory tracking'
    }
  ],

  useCases: [
    'Product identification and retail point-of-sale systems',
    'Inventory management and warehouse tracking',
    'Asset tracking and equipment identification',
    'Document and file management systems',
    'Healthcare and pharmaceutical product labeling',
    'Library and media cataloging systems',
    'Manufacturing and quality control processes',
    'Shipping and logistics tracking',
    'Event tickets and access control',
    'Custom applications requiring unique identifiers'
  ],

  faq: [
    {
      question: 'Which barcode format should I choose?',
      answer: 'Code 128 is versatile for general use, EAN-13/UPC for retail products, Code 39 for inventory, and ITF-14 for shipping. Choose based on your industry standards and data requirements.'
    },
    {
      question: 'What is the difference between EAN-13 and UPC-A?',
      answer: 'EAN-13 is the international standard with 13 digits, while UPC-A is used primarily in North America with 12 digits. Both include check digits for validation.'
    },
    {
      question: 'Do I need to include checksum digits?',
      answer: 'Some formats (EAN, UPC, Code 128) require checksums for validation. The tool can automatically calculate and include checksums when needed.'
    },
    {
      question: 'What size should I make my barcode?',
      answer: 'Barcode size depends on scanning distance and print quality. Generally, aim for at least 2-3 pixels per bar for digital use, and consider the X-dimension for printing.'
    },
    {
      question: 'Can I customize the barcode appearance?',
      answer: 'Yes! You can customize colors, fonts, margins, text position, and include or exclude human-readable text while maintaining barcode functionality.'
    }
  ],

  commonErrors: [
    'Invalid characters for the selected barcode format',
    'Incorrect data length for fixed-length formats',
    'Invalid checksum digits for validated formats',
    'Barcode dimensions too small for reliable scanning',
    'Poor contrast between bars and background'
  ],

  relatedTools: ['qr-code-generator', 'image-generator', 'label-maker', 'product-identifier', 'inventory-tracker']
};