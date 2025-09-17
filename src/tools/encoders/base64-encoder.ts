import type { Tool, ToolResult, ToolConfig } from '../../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface Base64EncoderConfig extends ToolConfig {
  mode: 'encode' | 'decode';
  lineBreaks: boolean;
  urlSafe: boolean;
}

export const BASE64_ENCODER_TOOL: Tool = {
  id: 'base64-encoder',
  name: 'Base64 Encoder & Decoder',
  description: 'Encode, decode, and inspect Base64 payloads with URL-safe mode, line-break control, drag-and-drop input, and instant validation — all in your browser.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'base-encoding')!,
  slug: 'base64-encoder',
  icon: '🔒',
  keywords: ['base64', 'encode', 'decode', 'encoding', 'decoding', 'binary', 'text'],
  seoTitle: 'Free Base64 Encoder & Decoder Online - Encode & Decode Base64',
  seoDescription: 'Convert text, JSON, or binary data with the Base64 encoder & decoder. Supports URL-safe mode, line breaks, drag & drop files, and real-time validation — private, client-side processing.',
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
  ],
  howItWorks: [
    {
      title: "Input Text or Base64 Data",
      icon: "📝",
      description: "Paste text to encode or Base64 string to decode into our online Base64 encoder. Support for large text files, binary data, JSON objects, API keys, and any text content. Our Base64 tool handles both standard and URL-safe encoding formats for maximum compatibility.",
      keywords: ["paste text", "Base64 input", "encode text", "decode Base64", "binary data", "API keys"]
    },
    {
      title: "Configure Base64 Options",
      icon: "⚙️",
      description: "Choose between encode or decode mode, enable URL-safe Base64 encoding for URLs and filenames, add line breaks for better readability, and customize padding options. Our Base64 encoder offers both standard RFC 3548 and URL-safe RFC 4648 encoding variants.",
      keywords: ["URL-safe Base64", "Base64 options", "line breaks", "Base64 padding", "RFC 3548", "RFC 4648"]
    },
    {
      title: "Encode or Decode Instantly",
      icon: "🔄",
      description: "Click 'Encode' to convert text to Base64 or 'Decode' to convert Base64 back to text. Our Base64 converter processes data locally in your browser with no server uploads required. Get instant results with real-time conversion and error detection.",
      keywords: ["encode Base64", "decode Base64", "Base64 converter", "Base64 online", "text to Base64"]
    },
    {
      title: "Copy or Download Results",
      icon: "💾",
      description: "Copy encoded/decoded results to clipboard with one click, download as text files, or share Base64 strings directly. Perfect for data URIs, embedding images in CSS/HTML, API authentication tokens, and secure data transmission over text protocols.",
      keywords: ["copy Base64", "download Base64", "data URI", "embed images", "authentication tokens", "Base64 file"]
    }
  ],
  problemsSolved: [
    {
      problem: 'Manual Base64 conversion is error-prone, especially when working with long payloads, binary files, or JSON blobs that need reliable encoding before transmission.',
      solution: 'Encode large payloads instantly with drag-and-drop file support, automatic size reporting, and line-break options. The tool processes everything locally so sensitive data never leaves your browser.',
      icon: '⚡',
      keywords: ['Base64 encoder', 'binary to Base64', 'line breaks', 'drag and drop', 'local processing']
    },
    {
      problem: 'Decoding Base64 strings that arrive malformed or URL-safe encoded can lead to confusing errors and unreadable output.',
      solution: 'Automatic cleanup converts URL-safe characters, repairs padding, and flags invalid characters with clear validation errors so you can correct issues before consuming the data.',
      icon: '🛡️',
      keywords: ['Base64 validation', 'padding errors', 'URL-safe Base64', 'decode Base64', 'error handling']
    },
    {
      problem: 'Developers often need insight into payload sizes and encoding behavior to meet platform limits or diagnose downstream failures.',
      solution: 'Detailed metadata shows original vs. encoded length, compression overhead, padding usage, and encoding mode so you can document or troubleshoot integrations quickly.',
      icon: '📊',
      keywords: ['payload size', 'metadata', 'encoding analytics', 'developer tooling', 'Base64 stats']
    }
  ],
  whyChoose: [
    {
      title: 'Privacy-First Conversion',
      description: 'All encoding and decoding happens in the browser — no uploads, no logging. Safely process API keys, credentials, or binary blobs without leaving your machine.',
      icon: '🔒',
      keywords: ['client-side', 'secure Base64', 'no server', 'private encoding']
    },
    {
      title: 'Flexible Encoding Controls',
      description: 'Toggle URL-safe mode, add line breaks, or switch between encode/decode workflows instantly. The tool respects RFC 4648 defaults while giving you precise control over output.',
      icon: '🧰',
      keywords: ['URL-safe Base64', 'line breaks', 'encoding options', 'RFC 4648']
    },
    {
      title: 'Developer-Centric UX',
      description: 'Paste, drag files, copy results, download text, or store past runs in tool history. The streamlined interface keeps repetitive encoding tasks fast for busy engineers.',
      icon: '👩‍💻',
      keywords: ['drag and drop', 'copy to clipboard', 'download results', 'tool history']
    }
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
