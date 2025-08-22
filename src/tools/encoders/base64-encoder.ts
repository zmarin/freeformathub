import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface Base64EncoderConfig extends ToolConfig {
  mode: 'encode' | 'decode';
  lineBreaks: boolean;
  urlSafe: boolean;
}

export const BASE64_ENCODER_TOOL: Tool = {
  id: 'base64-encoder',
  name: 'Base64 Encoder & Decoder',
  description: 'Encode and decode Base64 strings safely and efficiently with support for URL-safe encoding.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'base-encoding')!,
  slug: 'base64-encoder',
  icon: '🔒',
  keywords: ['base64', 'encode', 'decode', 'encoding', 'decoding', 'binary', 'text'],
  seoTitle: 'Free Base64 Encoder & Decoder Online - Encode & Decode Base64',
  seoDescription: 'Encode and decode Base64 strings instantly. Free online Base64 encoder with URL-safe support and line break options. Privacy-first, no data upload.',
  examples: [
    {
      title: 'Basic Text Encoding',
      input: 'Hello, World!',
      output: 'SGVsbG8sIFdvcmxkIQ==',
      description: 'Simple text to Base64 encoding'
    },
    {
      title: 'URL-Safe Encoding',
      input: 'user@example.com',
      output: 'dXNlckBleGFtcGxlLmNvbQ',
      description: 'URL-safe Base64 encoding without padding'
    },
    {
      title: 'JSON Object Encoding',
      input: '{"name":"John","age":30}',
      output: 'eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9',
      description: 'Encode JSON data as Base64'
    }
  ],
  useCases: [
    'Encode binary data for transmission over text protocols',
    'Store binary data in JSON or XML documents',
    'Encode images or files for embedding in HTML/CSS',
    'Create data URIs for web development',
    'Safely transmit sensitive data in URLs',
    'Encode API keys and tokens for configuration files'
  ],
  commonErrors: [
    'Invalid Base64 padding - ensure proper padding with = characters',
    'Non-Base64 characters in input - only A-Z, a-z, 0-9, +, / allowed',
    'URL-unsafe characters in URLs - use URL-safe Base64 encoding',
    'Line breaks in Base64 can cause parsing issues in some systems',
    'Empty input produces empty output',
    'Binary data may not display correctly after decoding'
  ],
  faq: [
    {
      question: 'What is Base64 encoding?',
      answer: 'Base64 is a binary-to-text encoding scheme that represents binary data in ASCII string format by translating it into a radix-64 representation.'
    },
    {
      question: 'When should I use URL-safe Base64?',
      answer: 'Use URL-safe Base64 when the encoded string will be used in URLs or filenames. It replaces + with - and / with _, and removes padding.'
    },
    {
      question: 'Is Base64 encryption?',
      answer: 'No, Base64 is encoding, not encryption. It\'s easily reversible and provides no security. Use proper encryption for sensitive data.'
    },
    {
      question: 'Why is my Base64 string longer than the original?',
      answer: 'Base64 encoding increases size by approximately 33% because it uses more characters to represent the same data.'
    }
  ],
  relatedTools: [
    'url-encoder',
    'hex-encoder',
    'jwt-decoder',
    'html-encoder',
    'unicode-encoder'
  ]
};

export function processBase64(input: string, config: Base64EncoderConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide text to encode or Base64 string to decode.'
    };
  }

  try {
    if (config.mode === 'encode') {
      return encodeBase64(input, config);
    } else {
      return decodeBase64(input, config);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process Base64 data'
    };
  }
}

function encodeBase64(input: string, config: Base64EncoderConfig): ToolResult {
  try {
    // Convert string to base64
    let encoded = btoa(unescape(encodeURIComponent(input)));
    
    // Apply URL-safe encoding if requested
    if (config.urlSafe) {
      encoded = encoded
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, ''); // Remove padding
    }
    
    // Add line breaks if requested (every 64 characters)
    if (config.lineBreaks && !config.urlSafe) {
      encoded = encoded.replace(/(.{64})/g, '$1\n');
    }
    
    return {
      success: true,
      output: encoded,
      metadata: {
        originalLength: input.length,
        encodedLength: encoded.length,
        compressionRatio: (((encoded.length - input.length) / input.length) * 100).toFixed(1),
        encoding: config.urlSafe ? 'URL-safe Base64' : 'Standard Base64',
        lineBreaks: config.lineBreaks
      }
    };
  } catch (error) {
    throw new Error('Failed to encode Base64. The input may contain invalid characters.');
  }
}

function decodeBase64(input: string, config: Base64EncoderConfig): ToolResult {
  try {
    // Clean input - remove whitespace and line breaks
    let cleanInput = input.replace(/\s/g, '');
    
    // Convert URL-safe back to standard Base64 if needed
    if (config.urlSafe || cleanInput.includes('-') || cleanInput.includes('_')) {
      cleanInput = cleanInput
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed
      while (cleanInput.length % 4) {
        cleanInput += '=';
      }
    }
    
    // Validate Base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanInput)) {
      throw new Error('Invalid Base64 format. Only A-Z, a-z, 0-9, +, /, and = characters are allowed.');
    }
    
    // Decode
    const decoded = decodeURIComponent(escape(atob(cleanInput)));
    
    return {
      success: true,
      output: decoded,
      metadata: {
        originalLength: input.length,
        decodedLength: decoded.length,
        encoding: config.urlSafe ? 'URL-safe Base64' : 'Standard Base64',
        hadPadding: cleanInput.endsWith('=') || cleanInput.endsWith('==')
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid character')) {
      throw new Error('Invalid Base64 string. Check for invalid characters or corrupted data.');
    }
    throw new Error('Failed to decode Base64. Please ensure the input is valid Base64 encoded data.');
  }
}