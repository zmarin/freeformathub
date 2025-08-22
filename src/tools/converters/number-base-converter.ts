import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface NumberBaseConverterConfig {
  inputBase: number;
  outputBases: number[];
  showAllBases: boolean;
  groupDigits: boolean;
  showPrefix: boolean;
  uppercase: boolean;
  batchConversion: boolean;
  validateInput: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  conversions?: BaseConversion[];
  error?: string;
  stats?: {
    inputCount: number;
    successCount: number;
    errorCount: number;
    inputBase: number;
    outputBases: number[];
  };
}

export interface BaseConversion {
  input: string;
  inputBase: number;
  decimal: number;
  conversions: {
    [base: number]: string;
  };
  error?: string;
}

const BASE_NAMES: { [key: number]: string } = {
  2: 'Binary',
  8: 'Octal',
  10: 'Decimal',
  16: 'Hexadecimal',
  3: 'Ternary',
  4: 'Quaternary',
  5: 'Quinary',
  6: 'Senary',
  7: 'Septenary',
  9: 'Nonary',
  11: 'Undecimal',
  12: 'Duodecimal',
  13: 'Tridecimal',
  14: 'Tetradecimal',
  15: 'Pentadecimal',
  17: 'Heptadecimal',
  18: 'Octodecimal',
  19: 'Enneadecimal',
  20: 'Vigesimal',
  32: 'Base32',
  36: 'Base36',
  64: 'Base64'
};

const COMMON_BASES = [2, 8, 10, 16];
const ALL_SUPPORTED_BASES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];

function getBasePrefix(base: number): string {
  switch (base) {
    case 2: return '0b';
    case 8: return '0o';
    case 16: return '0x';
    default: return `${base}r`;
  }
}

function isValidDigitForBase(digit: string, base: number): boolean {
  const digitValue = getDigitValue(digit);
  return digitValue >= 0 && digitValue < base;
}

function getDigitValue(digit: string): number {
  if (digit >= '0' && digit <= '9') {
    return parseInt(digit);
  } else if (digit >= 'a' && digit <= 'z') {
    return digit.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
  } else if (digit >= 'A' && digit <= 'Z') {
    return digit.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  }
  return -1;
}

function getDigitCharacter(value: number, uppercase: boolean = false): string {
  if (value < 10) {
    return value.toString();
  } else {
    const char = String.fromCharCode('a'.charCodeAt(0) + value - 10);
    return uppercase ? char.toUpperCase() : char;
  }
}

function removePrefix(input: string): { value: string; detectedBase: number | null } {
  const trimmed = input.trim().toLowerCase();
  
  if (trimmed.startsWith('0b')) {
    return { value: trimmed.slice(2), detectedBase: 2 };
  } else if (trimmed.startsWith('0o')) {
    return { value: trimmed.slice(2), detectedBase: 8 };
  } else if (trimmed.startsWith('0x')) {
    return { value: trimmed.slice(2), detectedBase: 16 };
  }
  
  // Check for base prefix format like "16r" or "2r"
  const baseMatch = trimmed.match(/^(\d+)r(.*)$/);
  if (baseMatch) {
    const base = parseInt(baseMatch[1]);
    if (base >= 2 && base <= 36) {
      return { value: baseMatch[2], detectedBase: base };
    }
  }
  
  return { value: trimmed, detectedBase: null };
}

function validateNumber(input: string, base: number): boolean {
  if (!input || input.length === 0) {
    return false;
  }
  
  // Remove any spaces or separators
  const cleanInput = input.replace(/[\s_-]/g, '');
  
  for (const digit of cleanInput) {
    if (!isValidDigitForBase(digit, base)) {
      return false;
    }
  }
  
  return true;
}

function convertFromBaseToDecimal(input: string, base: number): number {
  const cleanInput = input.replace(/[\s_-]/g, '');
  let result = 0;
  const length = cleanInput.length;
  
  for (let i = 0; i < length; i++) {
    const digit = cleanInput[i];
    const digitValue = getDigitValue(digit);
    const position = length - 1 - i;
    result += digitValue * Math.pow(base, position);
  }
  
  return result;
}

function convertFromDecimalToBase(decimal: number, base: number, uppercase: boolean = false): string {
  if (decimal === 0) {
    return '0';
  }
  
  if (decimal < 0) {
    return '-' + convertFromDecimalToBase(-decimal, base, uppercase);
  }
  
  let result = '';
  while (decimal > 0) {
    const remainder = decimal % base;
    result = getDigitCharacter(remainder, uppercase) + result;
    decimal = Math.floor(decimal / base);
  }
  
  return result;
}

function groupDigits(value: string, base: number): string {
  // Group digits for better readability
  const groupSize = base === 2 ? 4 : base === 8 ? 3 : base === 16 ? 4 : 3;
  
  const reversed = value.split('').reverse();
  const groups = [];
  
  for (let i = 0; i < reversed.length; i += groupSize) {
    const group = reversed.slice(i, i + groupSize).reverse().join('');
    groups.unshift(group);
  }
  
  return groups.join(' ');
}

function formatOutput(value: string, base: number, config: NumberBaseConverterConfig): string {
  let formatted = config.uppercase ? value.toUpperCase() : value.toLowerCase();
  
  if (config.groupDigits && formatted.length > 4) {
    formatted = groupDigits(formatted, base);
  }
  
  if (config.showPrefix) {
    const prefix = getBasePrefix(base);
    formatted = prefix + formatted.replace(/\s/g, '');
  }
  
  return formatted;
}

function convertSingleNumber(input: string, config: NumberBaseConverterConfig): BaseConversion {
  const { value, detectedBase } = removePrefix(input);
  const inputBase = detectedBase || config.inputBase;
  
  // Validate input
  if (config.validateInput && !validateNumber(value, inputBase)) {
    return {
      input,
      inputBase,
      decimal: 0,
      conversions: {},
      error: `Invalid number for base ${inputBase}: contains invalid digits`
    };
  }
  
  try {
    // Convert to decimal first
    const decimal = convertFromBaseToDecimal(value, inputBase);
    
    // Check for overflow
    if (!Number.isFinite(decimal) || decimal > Number.MAX_SAFE_INTEGER) {
      return {
        input,
        inputBase,
        decimal: 0,
        conversions: {},
        error: 'Number too large to convert accurately'
      };
    }
    
    // Convert to target bases
    const conversions: { [base: number]: string } = {};
    const targetBases = config.showAllBases ? COMMON_BASES : config.outputBases;
    
    for (const base of targetBases) {
      if (base !== inputBase) {
        const converted = convertFromDecimalToBase(decimal, base, config.uppercase);
        conversions[base] = formatOutput(converted, base, config);
      }
    }
    
    return {
      input,
      inputBase,
      decimal,
      conversions
    };
    
  } catch (error) {
    return {
      input,
      inputBase,
      decimal: 0,
      conversions: {},
      error: error instanceof Error ? error.message : 'Conversion failed'
    };
  }
}

export function processNumberBaseConverter(input: string, config: NumberBaseConverterConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide a number to convert'
      };
    }
    
    const inputs = config.batchConversion ? 
      input.split('\n').filter(line => line.trim().length > 0) : 
      [input.trim()];
    
    const conversions: BaseConversion[] = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const inputLine of inputs) {
      const conversion = convertSingleNumber(inputLine.trim(), config);
      conversions.push(conversion);
      
      if (conversion.error) {
        errorCount++;
      } else {
        successCount++;
      }
    }
    
    // Generate output
    let output = '';
    
    if (config.showAllBases) {
      // Show all common bases
      for (const conv of conversions) {
        if (conv.error) {
          output += `Input: ${conv.input}\nError: ${conv.error}\n\n`;
        } else {
          output += `Input: ${conv.input} (Base ${conv.inputBase})\n`;
          output += `Decimal: ${conv.decimal}\n`;
          
          for (const base of COMMON_BASES.sort((a, b) => a - b)) {
            if (base !== conv.inputBase) {
              const baseName = BASE_NAMES[base] || `Base ${base}`;
              output += `${baseName}: ${conv.conversions[base]}\n`;
            }
          }
          output += '\n';
        }
      }
    } else {
      // Show specific bases
      for (const conv of conversions) {
        if (conv.error) {
          output += `Error: ${conv.error}\n`;
        } else {
          if (config.outputBases.length === 1) {
            // Single output base
            const targetBase = config.outputBases[0];
            output += `${conv.conversions[targetBase]}\n`;
          } else {
            // Multiple output bases
            output += `Input: ${conv.input} (Base ${conv.inputBase})\n`;
            for (const base of config.outputBases.sort((a, b) => a - b)) {
              if (base !== conv.inputBase) {
                const baseName = BASE_NAMES[base] || `Base ${base}`;
                output += `${baseName}: ${conv.conversions[base]}\n`;
              }
            }
            output += '\n';
          }
        }
      }
    }
    
    return {
      success: true,
      output: output.trim(),
      conversions,
      stats: {
        inputCount: inputs.length,
        successCount,
        errorCount,
        inputBase: config.inputBase,
        outputBases: config.showAllBases ? COMMON_BASES : config.outputBases
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert number'
    };
  }
}

export const NUMBER_BASE_CONVERTER_TOOL: Tool = {
  id: 'number-base-converter',
  name: 'Number Base Converter',
  description: 'Convert numbers between different bases (binary, octal, decimal, hexadecimal, and more). Supports bases 2-36 with validation, digit grouping, and batch processing.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'numbers-units')!,
  slug: 'number-base-converter',
  icon: 'Calculator',
  tags: ['number', 'base', 'convert', 'binary', 'hex', 'octal', 'decimal'],
  complexity: 'intermediate',
  keywords: ['number', 'base', 'convert', 'binary', 'hex', 'hexadecimal', 'octal', 'decimal', 'programming'],
  
  examples: [
    {
      title: 'Decimal to Binary, Octal, Hex',
      input: '255',
      output: 'Binary: 11111111\nOctal: 377\nHexadecimal: FF',
      description: 'Convert decimal number to common bases'
    },
    {
      title: 'Hexadecimal Input',
      input: '0xFF',
      output: 'Decimal: 255\nBinary: 11111111\nOctal: 377',
      description: 'Convert hex number with prefix to other bases'
    },
    {
      title: 'Batch Conversion',
      input: `42
0b1010
0xFF
0o777`,
      output: `42 (Base 10) -> Binary: 101010, Octal: 52, Hex: 2A\n10 (Base 2) -> Decimal: 10, Octal: 12, Hex: A\n255 (Base 16) -> Decimal: 255, Binary: 11111111, Octal: 377\n511 (Base 8) -> Decimal: 511, Binary: 111111111, Hex: 1FF`,
      description: 'Convert multiple numbers with different input formats'
    }
  ],
  
  useCases: [
    'Programming and software development',
    'Computer science education and learning',
    'Digital circuit design and analysis',
    'Debugging and troubleshooting numeric issues',
    'Data analysis and binary operations'
  ],
  
  faq: [
    {
      question: 'What number bases are supported?',
      answer: 'The tool supports all bases from 2 (binary) to 36 (using digits 0-9 and letters A-Z). Common bases include binary (2), octal (8), decimal (10), and hexadecimal (16).'
    },
    {
      question: 'How do I specify the input base?',
      answer: 'Use standard prefixes like 0b for binary, 0x for hex, 0o for octal, or the format "base r value" (e.g., "2r1010"). You can also set the input base in options.'
    },
    {
      question: 'What is digit grouping?',
      answer: 'Digit grouping adds spaces to make long numbers more readable, like "1010 1010" for binary or "FF FF" for hex. This is especially useful for large numbers.'
    },
    {
      question: 'Can I convert negative numbers?',
      answer: 'Yes, the tool handles negative numbers by converting the absolute value and preserving the negative sign in all output bases.'
    },
    {
      question: 'What\'s the maximum number size?',
      answer: 'The tool can handle numbers up to JavaScript\'s MAX_SAFE_INTEGER (2^53 - 1) for accurate conversion. Larger numbers may lose precision.'
    }
  ],
  
  commonErrors: [
    'Invalid digits for base',
    'Number too large',
    'Invalid base prefix'
  ],
  
  relatedTools: ['binary-calculator', 'hex-editor', 'bit-converter'],
  seoTitle: 'Number Base Converter - Binary, Hex, Octal, Decimal Converter',
  seoDescription: 'Convert numbers between binary, hexadecimal, octal, decimal, and other bases. Supports all bases from 2-36 with validation.'
};