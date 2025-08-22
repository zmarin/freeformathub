import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface DataUriConverterConfig {
  mode: 'encode' | 'decode';
  mimeType: string;
  encoding: 'base64' | 'percent';
  includeCharset: boolean;
  charset: string;
  validateInput: boolean;
  preserveLineBreaks: boolean;
  autoDetectMime: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  info?: DataUriInfo;
}

interface DataUriInfo {
  originalSize: number;
  encodedSize: number;
  mimeType: string;
  encoding: string;
  charset?: string;
  compressionRatio: number;
  isValid: boolean;
}

// Common MIME types for quick selection
export const COMMON_MIME_TYPES = [
  { value: 'text/plain', label: 'Plain Text', category: 'Text' },
  { value: 'text/html', label: 'HTML', category: 'Text' },
  { value: 'text/css', label: 'CSS', category: 'Text' },
  { value: 'text/javascript', label: 'JavaScript', category: 'Text' },
  { value: 'application/json', label: 'JSON', category: 'Data' },
  { value: 'application/xml', label: 'XML', category: 'Data' },
  { value: 'image/png', label: 'PNG Image', category: 'Image' },
  { value: 'image/jpeg', label: 'JPEG Image', category: 'Image' },
  { value: 'image/gif', label: 'GIF Image', category: 'Image' },
  { value: 'image/svg+xml', label: 'SVG Image', category: 'Image' },
  { value: 'image/webp', label: 'WebP Image', category: 'Image' },
  { value: 'audio/mpeg', label: 'MP3 Audio', category: 'Audio' },
  { value: 'audio/wav', label: 'WAV Audio', category: 'Audio' },
  { value: 'video/mp4', label: 'MP4 Video', category: 'Video' },
  { value: 'application/pdf', label: 'PDF Document', category: 'Document' },
  { value: 'application/zip', label: 'ZIP Archive', category: 'Archive' },
];

export const CHARSET_OPTIONS = [
  'UTF-8',
  'UTF-16',
  'ISO-8859-1',
  'ASCII',
  'Windows-1252'
];

function isValidBase64(str: string): boolean {
  try {
    // Remove whitespace and check if it's valid base64
    const cleaned = str.replace(/\s/g, '');
    return /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) && cleaned.length % 4 === 0;
  } catch {
    return false;
  }
}

function isValidDataUri(uri: string): boolean {
  const dataUriRegex = /^data:([a-zA-Z0-9][a-zA-Z0-9\/+\-]*)?(?:;charset=([a-zA-Z0-9\-]+))?(?:;(base64))?,(.*)$/;
  return dataUriRegex.test(uri);
}

function parseDataUri(uri: string): { mimeType: string; charset?: string; encoding: string; data: string } | null {
  const match = uri.match(/^data:([a-zA-Z0-9][a-zA-Z0-9\/+\-]*)?(?:;charset=([a-zA-Z0-9\-]+))?(?:;(base64))?,(.*)$/);
  
  if (!match) return null;
  
  const [, mimeType = 'text/plain', charset, encoding, data] = match;
  
  return {
    mimeType,
    charset,
    encoding: encoding || 'percent',
    data
  };
}

function detectMimeType(content: string): string {
  // Try to detect content type based on content patterns
  const trimmed = content.trim();
  
  // JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'application/json';
    } catch {
      // Not valid JSON
    }
  }
  
  // HTML
  if (trimmed.startsWith('<') && (trimmed.includes('<html') || trimmed.includes('<!DOCTYPE'))) {
    return 'text/html';
  }
  
  // XML/SVG
  if (trimmed.startsWith('<') && (trimmed.includes('<?xml') || trimmed.includes('<svg'))) {
    return trimmed.includes('<svg') ? 'image/svg+xml' : 'application/xml';
  }
  
  // CSS
  if (trimmed.includes('{') && trimmed.includes('}') && 
      (trimmed.includes(':') || trimmed.includes('@'))) {
    return 'text/css';
  }
  
  // JavaScript
  if (trimmed.includes('function') || trimmed.includes('=>') || 
      trimmed.includes('var ') || trimmed.includes('let ') || 
      trimmed.includes('const ')) {
    return 'text/javascript';
  }
  
  // Base64 encoded data (could be image)
  if (isValidBase64(trimmed)) {
    // Try to detect image headers in base64
    try {
      const decoded = atob(trimmed.substring(0, 20));
      if (decoded.startsWith('\x89PNG')) return 'image/png';
      if (decoded.startsWith('\xFF\xD8\xFF')) return 'image/jpeg';
      if (decoded.startsWith('GIF8')) return 'image/gif';
    } catch {
      // Not valid base64 or not an image
    }
  }
  
  return 'text/plain';
}

function encodeToDataUri(content: string, config: DataUriConverterConfig): string {
  let mimeType = config.mimeType;
  
  if (config.autoDetectMime) {
    mimeType = detectMimeType(content);
  }
  
  let dataUri = `data:${mimeType}`;
  
  if (config.includeCharset && config.charset) {
    dataUri += `;charset=${config.charset}`;
  }
  
  let encodedContent: string;
  
  if (config.encoding === 'base64') {
    dataUri += ';base64';
    try {
      // Handle line breaks if needed
      const contentToEncode = config.preserveLineBreaks ? content : content.replace(/\r?\n/g, '');
      encodedContent = btoa(unescape(encodeURIComponent(contentToEncode)));
    } catch (error) {
      throw new Error('Failed to base64 encode content. Content may contain invalid characters.');
    }
  } else {
    // Percent encoding
    encodedContent = encodeURIComponent(content);
  }
  
  return `${dataUri},${encodedContent}`;
}

function decodeFromDataUri(dataUri: string): { content: string; info: Partial<DataUriInfo> } {
  if (!isValidDataUri(dataUri)) {
    throw new Error('Invalid Data URI format. Expected format: data:[<mediatype>][;base64],<data>');
  }
  
  const parsed = parseDataUri(dataUri);
  if (!parsed) {
    throw new Error('Failed to parse Data URI');
  }
  
  let content: string;
  
  try {
    if (parsed.encoding === 'base64') {
      if (!isValidBase64(parsed.data)) {
        throw new Error('Invalid base64 data in Data URI');
      }
      const decodedBytes = atob(parsed.data);
      content = decodeURIComponent(escape(decodedBytes));
    } else {
      content = decodeURIComponent(parsed.data);
    }
  } catch (error) {
    throw new Error(`Failed to decode Data URI content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    content,
    info: {
      mimeType: parsed.mimeType,
      encoding: parsed.encoding,
      charset: parsed.charset,
      originalSize: dataUri.length,
      encodedSize: content.length,
      compressionRatio: content.length > 0 ? Math.round((dataUri.length / content.length) * 100) / 100 : 0
    }
  };
}

export function processDataUriConverter(input: string, config: DataUriConverterConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Input is required'
      };
    }
    
    if (config.mode === 'encode') {
      const output = encodeToDataUri(input, config);
      const info: DataUriInfo = {
        originalSize: input.length,
        encodedSize: output.length,
        mimeType: config.autoDetectMime ? detectMimeType(input) : config.mimeType,
        encoding: config.encoding,
        charset: config.includeCharset ? config.charset : undefined,
        compressionRatio: Math.round((output.length / input.length) * 100) / 100,
        isValid: true
      };
      
      return {
        success: true,
        output,
        info
      };
    } else {
      // Decode mode
      if (config.validateInput && !isValidDataUri(input)) {
        return {
          success: false,
          error: 'Input is not a valid Data URI. Expected format: data:[<mediatype>][;base64],<data>'
        };
      }
      
      const { content, info } = decodeFromDataUri(input);
      
      return {
        success: true,
        output: content,
        info: {
          ...info,
          isValid: true
        } as DataUriInfo
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const DATA_URI_CONVERTER_TOOL: Tool = {
  id: 'data-uri-converter',
  name: 'Data URI Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'documents')!,
  slug: 'data-uri-converter',
  icon: '🔗',
  keywords: ['data', 'uri', 'base64', 'encode', 'decode', 'mime', 'url', 'embed', 'inline'],
  seoTitle: 'Data URI Converter - Encode/Decode Base64 Data URLs | FreeFormatHub',
  seoDescription: 'Convert text, images, and files to Data URIs for inline embedding. Base64 encoding, MIME type detection, and comprehensive format support.',
  description: 'Convert text, images, and other content to/from Data URIs for inline embedding in HTML, CSS, and JavaScript.',

  examples: [
    {
      title: 'Text to Data URI (Base64)',
      input: 'Hello, World!',
      output: 'data:text/plain;charset=UTF-8;base64,SGVsbG8sIFdvcmxkIQ==',
      description: 'Convert plain text to base64 Data URI'
    },
    {
      title: 'JSON to Data URI',
      input: '{"name": "test", "value": 123}',
      output: 'data:application/json;base64,eyJuYW1lIjogInRlc3QiLCAidmFsdWUiOiAxMjN9',
      description: 'Auto-detect JSON and create appropriate Data URI'
    },
    {
      title: 'Data URI Decoding',
      input: 'data:text/plain;charset=UTF-8;base64,SGVsbG8sIFdvcmxkIQ==',
      output: 'Hello, World!',
      description: 'Decode Data URI back to original content'
    }
  ],

  useCases: [
    'Embedding small images directly in CSS or HTML without separate files',
    'Inlining fonts, icons, and other assets for single-file distributions',
    'Creating self-contained HTML emails with embedded images',
    'Storing configuration data or small files as inline URLs',
    'Converting files for use in data attributes or JavaScript',
    'Creating bookmarklets and browser tools with embedded resources',
    'Generating inline SVG or other vector graphics for web use',
    'Converting API responses or JSON data for URL transmission'
  ],

  faq: [
    {
      question: 'What is a Data URI and when should I use it?',
      answer: 'A Data URI embeds file content directly in a URL using the data: scheme. Use it for small files (< 10KB) to reduce HTTP requests, create self-contained documents, or embed resources inline.'
    },
    {
      question: 'What\'s the difference between base64 and percent encoding?',
      answer: 'Base64 is more compact for binary data and images, while percent encoding is human-readable for text. Base64 increases size by ~33%, while percent encoding varies based on special characters.'
    },
    {
      question: 'Why does my Data URI make the file larger?',
      answer: 'Data URIs have encoding overhead. Base64 adds ~33% size, plus MIME type headers. For small files, this is acceptable to avoid HTTP requests, but large files should use separate URLs.'
    },
    {
      question: 'How does MIME type auto-detection work?',
      answer: 'The tool analyzes content patterns: JSON structure, HTML/XML tags, CSS syntax, JavaScript keywords, and binary signatures for images. Manual override is available for accuracy.'
    },
    {
      question: 'Are there size limits for Data URIs?',
      answer: 'Browsers typically support 2-32MB Data URIs, but performance degrades significantly above 100KB. Keep Data URIs small (< 10KB) for best practices and avoid them for large media files.'
    }
  ],

  commonErrors: [
    'Invalid base64 encoding in input data',
    'Malformed Data URI format or missing components',
    'MIME type mismatch causing display issues',
    'Character encoding problems with special characters',
    'Data URI too large for browser or email client limits'
  ],

  relatedTools: ['base64-encoder', 'url-encoder', 'image-converter', 'file-encoder', 'mime-detector']
};