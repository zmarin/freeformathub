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
  description: 'For query strings, webhooks, and callback URLs, this URL encoder and decoder prevents the classic “why did that space break my request?” moment. Choose full URL vs component mode, pick + or %20 for spaces, and keep percent‑encoding RFC‑compliant while you debug APIs and redirects — all locally in your browser.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'url-encoding')!,
  slug: 'url-encoder',
  icon: '🔗',
  keywords: ['url encoder online', 'url decoder free', 'percent encoding tool', 'uri encoder', 'url encode decode', 'query string encoder', 'web url tool', 'encode url parameters', 'decode percent encoding'],
  seoTitle: 'Free URL Encoder & Decoder Online - Encode & Decode URLs',
  seoDescription: 'Free online URL encoder and decoder tool. Encode or decode URLs, query strings, and URI components with percent encoding. Features full URL and component modes, space handling options (+/%20), and reserved character control. Perfect for web developers working with APIs and query parameters.',
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
    },
    {
      question: 'How do I encode URLs online safely?',
      answer: 'Use our URL encoder tool to safely encode URLs and query parameters. All encoding happens in your browser - no URLs are sent to servers, ensuring privacy for sensitive links and API endpoints.'
    },
    {
      question: 'What characters need to be URL encoded?',
      answer: 'Special characters like spaces, &, =, ?, #, %, +, and non-ASCII characters must be URL encoded. Our tool automatically identifies and encodes these characters with their percent-encoded equivalents.'
    },
    {
      question: 'How do I decode URL encoded strings?',
      answer: 'Switch to "Decode" mode and paste your URL-encoded string. The tool will convert percent-encoded characters (%20, %21, etc.) back to their original form, making URLs human-readable.'
    },
    {
      question: 'Why do I see %20 instead of spaces in URLs?',
      answer: '%20 is the URL-encoded representation of a space character. URLs cannot contain literal spaces, so they must be encoded as %20 or sometimes + in query parameters.'
    },
    {
      question: 'Can I encode query parameters separately?',
      answer: 'Yes, use the "Component" mode to encode individual query parameters or URL components. This is essential when parameter values contain special characters like &, =, or #.'
    },
    {
      question: 'What\'s the difference between URL encoding and HTML encoding?',
      answer: 'URL encoding uses percent signs (%) for web addresses and HTTP requests. HTML encoding uses ampersand entities (&amp;) for displaying content in web pages. Use the appropriate encoding for your context.'
    },
    {
      question: 'How do I fix "Invalid URL" errors?',
      answer: 'Invalid URL errors often occur due to unencoded special characters. Use our URL encoder to properly encode your URLs, especially query parameters and path components with special characters.'
    },
    {
      question: 'Can I encode non-English characters in URLs?',
      answer: 'Yes, the tool supports UTF-8 encoding for international characters, emojis, and symbols. Non-ASCII characters are automatically converted to their percent-encoded form for URL compatibility.'
    },
    {
      question: 'What are common URL encoding mistakes?',
      answer: 'Common mistakes include: not encoding query parameters, double-encoding URLs, using + for spaces in paths (should be %20), and not encoding special characters in form data.'
    },
    {
      question: 'How do I encode URLs for API requests?',
      answer: 'For API requests, encode query parameters using "Component" mode to ensure special characters don\'t break the URL structure. This is crucial for search queries, user input, and dynamic parameters.'
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
  ],
  problemsSolved: [
    {
      problem: 'Mis-encoded query strings break APIs and analytics tracking when reserved characters or spaces slip through unescaped.',
      solution: 'Switch between URI and component encoding to preserve structure while percent-encoding only what is required. Choose + or %20 for spaces to meet platform-specific expectations.',
      icon: '🧩',
      keywords: ['query string', 'percent encoding', 'reserved characters', 'space encoding', 'URI vs component']
    },
    {
      problem: 'Troubleshooting encoded URLs is frustrating when % sequences are invalid or double-encoded, producing unreadable text.',
      solution: 'Decode mode cleans up + characters, verifies percent sequences, and surfaces errors when the payload is malformed so you can fix upstream logic quickly.',
      icon: '🩺',
      keywords: ['decode URL', 'invalid percent', 'double encoding', 'URL debugging', 'error handling']
    },
    {
      problem: 'Front-end and backend teams often need to share canonical examples of encoded URLs for documentation and onboarding.',
      solution: 'Generate consistent, standards-compliant URLs with metadata on encoded characters and lengths to drop directly into docs, tests, or Postman collections.',
      icon: '📘',
      keywords: ['API documentation', 'encoded examples', 'Postman', 'developer onboarding', 'reference URLs']
    }
  ],
  whyChoose: [
    {
      title: 'Accurate by Default',
      description: 'The tool honors RFC 3986 rules, automatically correcting space handling and reserved characters so you can trust every encoded output.',
      icon: '📐',
      keywords: ['RFC 3986', 'standards compliant', 'accurate encoding', 'URL safety']
    },
    {
      title: 'Built for Developers',
      description: 'Toggle modes, inspect metadata, copy outputs, and download payloads without leaving the page. Tool history keeps past conversions handy during debugging sessions.',
      icon: '👨‍💻',
      keywords: ['developer tools', 'tool history', 'copy results', 'download URLs']
    },
    {
      title: 'Secure Local Processing',
      description: 'No networking and no logging — the encoder runs entirely in your browser, keeping production URLs, tokens, and PII safe.',
      icon: '🔒',
      keywords: ['client-side', 'secure URL encoder', 'no upload', 'private data']
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
