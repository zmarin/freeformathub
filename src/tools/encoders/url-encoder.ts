import type { Tool, ToolResult, ToolConfig } from '../../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface UrlEncoderConfig extends ToolConfig {
  mode: 'encode' | 'decode';
  encodeSpaces: 'plus' | 'percent'; // + or %20
  encodeReserved: boolean; // encode reserved characters like : / ? # [ ] @
  component: boolean; // use encodeURIComponent vs encodeURI
}

export const URL_ENCODER_TOOL: Tool = {
  id: 'url-encoder',
  name: 'URL Encoder & Decoder',
  description: 'Encode and decode URLs and URI components safely with various encoding options for web development.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'url-encoding')!,
  slug: 'url-encoder',
  icon: '🔗',
  keywords: ['url', 'uri', 'encode', 'decode', 'percent', 'encoding', 'web', 'query', 'parameters'],
  seoTitle: 'Free URL Encoder & Decoder Online - Encode & Decode URLs',
  seoDescription: 'Encode and decode URLs and URI components instantly. Free online URL encoder with support for query parameters, special characters, and reserved characters. Privacy-first.',
  examples: [
    {
      title: 'Basic URL Encoding',
      input: 'https://example.com/search?q=hello world',
      output: 'https%3A//example.com/search%3Fq%3Dhello%20world',
      description: 'Full URL encoding with percent encoding'
    },
    {
      title: 'Query Parameter Encoding',
      input: 'user name & email',
      output: 'user%20name%20%26%20email',
      description: 'Encode special characters in query parameters'
    },
    {
      title: 'Component Encoding',
      input: 'file name with spaces.txt',
      output: 'file%20name%20with%20spaces.txt',
      description: 'Encode URI component preserving structure'
    }
  ],
  useCases: [
    'Encode query parameters for safe URL transmission',
    'Prepare filenames and paths for use in URLs',
    'Encode form data for GET requests',
    'Process user input for web applications',
    'Create safe links with special characters',
    'Debug URL encoding issues in web development'
  ],
  commonErrors: [
    'Double encoding - encoding already encoded URLs',
    'Not encoding reserved characters in query parameters',
    'Using wrong encoding type (URI vs Component)',
    'Mixing + and %20 for space encoding',
    'Not handling Unicode characters properly',
    'Encoding entire URLs when only components need encoding'
  ],
  faq: [
    {
      question: 'What is URL encoding?',
      answer: 'URL encoding (percent encoding) converts characters into a format that can be safely transmitted over the internet by replacing unsafe characters with % followed by hex codes.'
    },
    {
      question: 'When should I use encodeURI vs encodeURIComponent?',
      answer: 'Use encodeURI for complete URLs to preserve the URL structure. Use encodeURIComponent for individual parameters or components that may contain reserved characters.'
    },
    {
      question: 'Should spaces be encoded as + or %20?',
      answer: 'In query parameters, spaces can be + or %20. In URL paths and most other contexts, use %20. The + encoding is specific to application/x-www-form-urlencoded format.'
    },
    {
      question: 'Are there characters that don\'t need encoding?',
      answer: 'Yes, unreserved characters (A-Z, a-z, 0-9, -, ., _, ~) don\'t need encoding. Reserved characters (: / ? # [ ] @ ! $ & \' ( ) * + , ; =) may need encoding depending on context.'
    }
  ],
  relatedTools: [
    'base64-encoder',
    'html-encoder',
    'jwt-decoder',
    'query-string-parser',
    'form-data-encoder'
  ],
  howItWorks: [
    {
      title: "Input URL or Text Data",
      icon: "🔗",
      description: "Paste URLs, query parameters, file paths, or any text containing special characters into our online URL encoder. Support for complete URLs, URI components, form data, file names, and international characters. Our URL tool handles both encoding and decoding operations.",
      keywords: ["paste URL", "URL input", "query parameters", "URI components", "file paths", "special characters"]
    },
    {
      title: "Configure URL Encoding Options",
      icon: "⚙️",
      description: "Choose between encode or decode mode, select space encoding (+ or %20), enable component-level encoding with encodeURIComponent, handle reserved characters (: / ? # [ ] @), and customize encoding behavior for different URL parts and web standards.",
      keywords: ["URL encoding options", "encodeURIComponent", "percent encoding", "space encoding", "reserved characters"]
    },
    {
      title: "Encode or Decode URLs Instantly",
      icon: "⚡",
      description: "Click 'Encode' to convert text to URL-safe format or 'Decode' to convert encoded URLs back to readable text. Our URL encoder processes data locally with no server uploads. Get instant results with proper percent encoding and RFC 3986 compliance.",
      keywords: ["encode URL", "decode URL", "URL encoder online", "percent encoding", "RFC 3986", "URL-safe"]
    },
    {
      title: "Copy or Use Encoded URLs",
      icon: "📋",
      description: "Copy encoded URLs to clipboard, download as text files, or use directly in web applications, forms, and APIs. Perfect for query string parameters, GET requests, REST API endpoints, file uploads, and creating safe links with special characters.",
      keywords: ["copy URL", "download URL", "query string", "GET requests", "REST API", "URL parameters"]
    }
  ]
};

export function processUrl(input: string, config: UrlEncoderConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide a URL or text to encode/decode.'
    };
  }

  try {
    if (config.mode === 'encode') {
      return encodeUrl(input, config);
    } else {
      return decodeUrl(input, config);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process URL data'
    };
  }
}

function encodeUrl(input: string, config: UrlEncoderConfig): ToolResult {
  try {
    let encoded: string;
    
    if (config.component) {
      // Use encodeURIComponent for individual components
      encoded = encodeURIComponent(input);
    } else {
      // Use encodeURI for complete URLs (preserves structure)
      encoded = encodeURI(input);
      
      // If encodeReserved is true, encode additional reserved characters
      if (config.encodeReserved) {
        encoded = encoded.replace(/[!'()*]/g, (c) => {
          return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
      }
    }
    
    // Handle space encoding preference
    if (config.encodeSpaces === 'plus') {
      encoded = encoded.replace(/%20/g, '+');
    }
    
    // Calculate statistics
    const originalChars = input.length;
    const encodedChars = encoded.length;
    const encodedPercent = encoded.match(/%[0-9A-F]{2}/g) || [];
    
    return {
      success: true,
      output: encoded,
      metadata: {
        originalLength: originalChars,
        encodedLength: encodedChars,
        encodedCharacters: encodedPercent.length,
        encodingType: config.component ? 'Component' : 'URI',
        spaceEncoding: config.encodeSpaces === 'plus' ? 'Plus (+)' : 'Percent (%20)',
        reservedEncoded: config.encodeReserved
      }
    };
  } catch (error) {
    throw new Error('Failed to encode URL. The input may contain characters that cannot be encoded.');
  }
}

function decodeUrl(input: string, config: UrlEncoderConfig): ToolResult {
  try {
    let cleanInput = input.trim();
    
    // Handle plus encoding for spaces if specified
    if (config.encodeSpaces === 'plus') {
      cleanInput = cleanInput.replace(/\+/g, '%20');
    }
    
    // Validate percent encoding format
    const invalidPercent = cleanInput.match(/%(?![0-9A-Fa-f]{2})/g);
    if (invalidPercent) {
      throw new Error('Invalid percent encoding. Found incomplete % sequences.');
    }
    
    // Decode the URL
    const decoded = decodeURIComponent(cleanInput);
    
    // Calculate statistics
    const encodedPercent = cleanInput.match(/%[0-9A-Fa-f]{2}/g) || [];
    const plusChars = input.match(/\+/g) || [];
    
    return {
      success: true,
      output: decoded,
      metadata: {
        originalLength: input.length,
        decodedLength: decoded.length,
        decodedCharacters: encodedPercent.length,
        plusCharacters: plusChars.length,
        spaceDecoding: config.encodeSpaces === 'plus' ? 'Plus to space' : 'Percent to space',
        hadEncoding: encodedPercent.length > 0 || plusChars.length > 0
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('URI malformed')) {
      throw new Error('Invalid URL encoding. Check for malformed percent sequences or invalid characters.');
    }
    throw new Error('Failed to decode URL. Please ensure the input is valid URL encoded data.');
  }
}