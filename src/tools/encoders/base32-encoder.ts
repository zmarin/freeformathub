import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface Base32EncoderOptions {
  operation: 'encode' | 'decode';
  variant: 'standard' | 'extended-hex' | 'z-base32' | 'crockford';
  padding: boolean;
  lowercase: boolean;
  chunkSize?: number;
  lineBreaks: boolean;
  removeWhitespace: boolean;
}

export interface Base32EncoderInput {
  content: string;
  options: Base32EncoderOptions;
}

export interface Base32EncoderResult extends ToolResult {
  result?: string;
  originalSize?: number;
  resultSize?: number;
  compressionRatio?: number;
  chunks?: number;
  variant?: string;
  encoding?: 'UTF-8' | 'Binary';
}

export function processBase32Encoder(input: Base32EncoderInput): Base32EncoderResult {
  try {
    const { content, options } = input;

    if (!content && options.operation === 'encode') {
      return {
        success: true,
        result: '',
        originalSize: 0,
        resultSize: 0,
        compressionRatio: 0,
        chunks: 0,
        variant: options.variant,
        encoding: 'UTF-8'
      };
    }

    if (!content && options.operation === 'decode') {
      return {
        success: false,
        error: 'Please provide Base32 encoded content to decode'
      };
    }

    const originalSize = new TextEncoder().encode(content).length;

    if (options.operation === 'encode') {
      const encoded = encodeBase32(content, options);
      const resultSize = encoded.length;
      const compressionRatio = originalSize > 0 ? ((resultSize - originalSize) / originalSize) * 100 : 0;
      const chunks = options.chunkSize && options.lineBreaks ? Math.ceil(encoded.replace(/\s/g, '').length / options.chunkSize) : 0;

      return {
        success: true,
        result: encoded,
        originalSize,
        resultSize,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        chunks,
        variant: options.variant,
        encoding: 'UTF-8'
      };
    } else {
      const decoded = decodeBase32(content, options);
      const resultSize = new TextEncoder().encode(decoded).length;
      const compressionRatio = originalSize > 0 ? ((resultSize - originalSize) / originalSize) * 100 : 0;

      return {
        success: true,
        result: decoded,
        originalSize,
        resultSize,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        chunks: 0,
        variant: options.variant,
        encoding: 'UTF-8'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    };
  }
}

function encodeBase32(input: string, options: Base32EncoderOptions): string {
  const alphabet = getAlphabet(options.variant);
  const bytes = new TextEncoder().encode(input);
  let result = '';
  
  // Convert bytes to Base32
  for (let i = 0; i < bytes.length; i += 5) {
    const group = bytes.slice(i, i + 5);
    const padded = new Uint8Array(5);
    padded.set(group);
    
    // Convert 5 bytes (40 bits) to 8 Base32 characters
    let value = 0;
    for (let j = 0; j < 5; j++) {
      value = (value << 8) | padded[j];
    }
    
    const chars = [];
    for (let j = 0; j < 8; j++) {
      chars.unshift(alphabet[value & 0x1F]);
      value >>>= 5;
    }
    
    result += chars.join('');
  }
  
  // Apply padding
  if (options.padding) {
    const inputLength = bytes.length;
    const remainder = inputLength % 5;
    if (remainder !== 0) {
      const paddingLength = [0, 6, 4, 3, 1][remainder];
      result = result.slice(0, -paddingLength) + '='.repeat(paddingLength);
    }
  } else {
    // Remove any padding that might have been added
    result = result.replace(/=+$/, '');
  }
  
  // Apply case transformation
  if (options.lowercase && options.variant === 'standard') {
    result = result.toLowerCase();
  }
  
  // Apply chunking and line breaks
  if (options.chunkSize && options.lineBreaks && options.chunkSize > 0) {
    const chunks = [];
    for (let i = 0; i < result.length; i += options.chunkSize) {
      chunks.push(result.slice(i, i + options.chunkSize));
    }
    result = chunks.join('\n');
  }
  
  return result;
}

function decodeBase32(input: string, options: Base32EncoderOptions): string {
  let cleanInput = input;
  
  // Remove whitespace if requested
  if (options.removeWhitespace) {
    cleanInput = cleanInput.replace(/\s/g, '');
  }
  
  // Handle case sensitivity
  if (options.variant === 'standard') {
    cleanInput = cleanInput.toUpperCase();
  }
  
  const alphabet = getAlphabet(options.variant);
  const reverseAlphabet = createReverseAlphabet(alphabet);
  
  // Remove padding
  cleanInput = cleanInput.replace(/=+$/, '');
  
  // Validate input
  const validChars = new Set([...alphabet, '=']);
  for (const char of cleanInput) {
    if (!validChars.has(char)) {
      throw new Error(`Invalid character '${char}' found in Base32 input`);
    }
  }
  
  const bytes: number[] = [];
  
  // Process input in groups of 8 characters
  for (let i = 0; i < cleanInput.length; i += 8) {
    const group = cleanInput.slice(i, i + 8).padEnd(8, 'A');
    let value = 0;
    
    // Convert 8 Base32 characters to 40-bit value
    for (let j = 0; j < 8; j++) {
      const char = group[j];
      if (char in reverseAlphabet) {
        value = (value << 5) | reverseAlphabet[char];
      }
    }
    
    // Extract 5 bytes from the 40-bit value
    for (let j = 4; j >= 0; j--) {
      if (i + Math.floor((7 - j * 8/5)) < cleanInput.length) {
        bytes.push((value >>> (j * 8)) & 0xFF);
      }
    }
  }
  
  // Convert bytes back to string
  const uint8Array = new Uint8Array(bytes);
  return new TextDecoder().decode(uint8Array);
}

function getAlphabet(variant: string): string {
  switch (variant) {
    case 'standard':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    case 'extended-hex':
      return '0123456789ABCDEFGHIJKLMNOPQRSTUV';
    case 'z-base32':
      return 'ybndrfg8ejkmcpqxot1uwisza345h769';
    case 'crockford':
      return '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    default:
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  }
}

function createReverseAlphabet(alphabet: string): Record<string, number> {
  const reverse: Record<string, number> = {};
  for (let i = 0; i < alphabet.length; i++) {
    reverse[alphabet[i]] = i;
    // Handle case insensitive mapping for Crockford
    if (alphabet === '0123456789ABCDEFGHJKMNPQRSTVWXYZ') {
      const lower = alphabet[i].toLowerCase();
      if (lower !== alphabet[i]) {
        reverse[lower] = i;
      }
      // Crockford substitutions
      if (alphabet[i] === 'O') reverse['0'] = i;
      if (alphabet[i] === 'I') reverse['1'] = i;
      if (alphabet[i] === 'L') reverse['1'] = i;
    }
  }
  return reverse;
}

export const BASE32_ENCODER_TOOL: Tool = {
  id: 'base32-encoder',
  name: 'Base32 Encoder/Decoder',
  description: 'Encode and decode text using Base32 with support for multiple variants and formatting options',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'base-encoding')!,
  slug: 'base32-encoder',
  icon: 'Binary',
  tags: ['base32', 'encode', 'decode', 'binary', 'rfc4648', 'crockford'],
  complexity: 'intermediate',
  keywords: ['base32', 'encode', 'decode', 'binary', 'text', 'conversion', 'rfc4648', 'crockford'],
  
  examples: [
    {
      title: 'Basic Base32 Encoding',
      input: 'Hello World!',
      output: 'JBSWY3DPEBLW64TMMQQQ====',
      description: 'Encode text to Base32 with standard RFC 4648 format'
    },
    {
      title: 'Crockford Base32 Encoding',
      input: 'Hello World!',
      output: '91IMOR3F41BMUSJCCGGG',
      description: 'Use Crockford variant for case-insensitive encoding'
    },
    {
      title: 'Base32 Decoding',
      input: 'JBSWY3DPEBLW64TMMQQQ====',
      output: 'Hello World!',
      description: 'Decode Base32 strings back to original text'
    }
  ],
  
  useCases: [
    'Encode binary data for safe transmission over text protocols',
    'Create human-readable representations of binary data',
    'Generate case-insensitive encoded strings (Crockford variant)',
    'Encode data for URLs and filenames with extended hex variant',
    'Convert text to Base32 for storage systems that prefer it over Base64',
    'Decode Base32 encoded configuration files and tokens',
    'Process data with systems that use Z-Base32 variant'
  ],
  
  faq: [
    {
      question: 'What Base32 variants are supported?',
      answer: 'Standard RFC 4648, Extended Hex (base32hex), Z-Base32, and Crockford Base32 variants are supported.'
    },
    {
      question: 'When should I use Base32 instead of Base64?',
      answer: 'Use Base32 when you need case-insensitive encoding, human-readable strings, or compatibility with systems that prefer Base32.'
    },
    {
      question: 'What is the difference between variants?',
      answer: 'Standard uses A-Z and 2-7, Extended Hex uses 0-9 and A-V, Crockford excludes ambiguous characters, and Z-Base32 uses a different alphabet.'
    },
    {
      question: 'Why is Base32 output longer than Base64?',
      answer: 'Base32 uses 32 characters vs Base64\'s 64, so it needs more characters to represent the same data (about 60% longer).'
    }
  ],
  
  commonErrors: [
    'Invalid characters in Base32 input',
    'Incorrect padding for decoding',
    'Wrong variant selected for input'
  ],
  
  relatedTools: ['base64-encoder', 'url-encoder', 'string-escape'],
  seoTitle: 'Base32 Encoder/Decoder - Multi-Variant Base32 Converter',
  seoDescription: 'Encode and decode Base32 text with RFC 4648, Crockford, and other variants. Perfect for data transmission and storage.'
};