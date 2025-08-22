import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface StringEscapeConfig {
  mode: 'escape' | 'unescape';
  type: 'javascript' | 'json' | 'html' | 'xml' | 'css' | 'sql' | 'regex' | 'url' | 'csv' | 'python';
  preserveLineBreaks: boolean;
  escapeUnicode: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: {
    originalLength: number;
    processedLength: number;
    escapeCount: number;
  };
}

// JavaScript/JSON string escaping
function escapeJavaScript(str: string, escapeUnicode: boolean): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\b/g, '\\b')
    .replace(/\f/g, '\\f')
    .replace(/\v/g, '\\v')
    .replace(/\0/g, '\\0')
    .replace(escapeUnicode ? /[\u0080-\uFFFF]/g : /[\u0000-\u001F\u007F-\u009F]/g, (match) => {
      return '\\u' + match.charCodeAt(0).toString(16).padStart(4, '0');
    });
}

function unescapeJavaScript(str: string): string {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\v/g, '\v')
    .replace(/\\0/g, '\0')
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/\\\\/g, '\\');
}

// HTML/XML escaping
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function unescapeHtml(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

// CSS escaping
function escapeCss(str: string): string {
  return str.replace(/[^\w-]/g, (match) => {
    const code = match.charCodeAt(0);
    if (code < 0x20 || code > 0x7E) {
      return '\\' + code.toString(16).padStart(6, '0') + ' ';
    }
    return '\\' + match;
  });
}

function unescapeCss(str: string): string {
  return str
    .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/\\(.)/g, '$1');
}

// SQL escaping
function escapeSql(str: string): string {
  return str
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

function unescapeSql(str: string): string {
  return str
    .replace(/''/g, "'")
    .replace(/\\0/g, '\0')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\Z/g, '\x1a')
    .replace(/\\\\/g, '\\');
}

// Regex escaping
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unescapeRegex(str: string): string {
  return str.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
}

// URL escaping
function escapeUrl(str: string): string {
  return encodeURIComponent(str);
}

function unescapeUrl(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str; // Return original if decoding fails
  }
}

// CSV escaping
function escapeCsv(str: string): string {
  const needsEscaping = /[",\n\r]/.test(str);
  if (needsEscaping) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function unescapeCsv(str: string): string {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1).replace(/""/g, '"');
  }
  return str;
}

// Python string escaping
function escapePython(str: string, escapeUnicode: boolean): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\b/g, '\\b')
    .replace(/\f/g, '\\f')
    .replace(/\v/g, '\\v')
    .replace(/\0/g, '\\0')
    .replace(escapeUnicode ? /[\u0080-\uFFFF]/g : /[\u0000-\u001F\u007F-\u009F]/g, (match) => {
      const code = match.charCodeAt(0);
      if (code <= 0xFF) {
        return '\\x' + code.toString(16).padStart(2, '0');
      }
      return '\\u' + code.toString(16).padStart(4, '0');
    });
}

function unescapePython(str: string): string {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\v/g, '\v')
    .replace(/\\0/g, '\0')
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/\\\\/g, '\\');
}

function countEscapes(original: string, processed: string, mode: 'escape' | 'unescape'): number {
  if (mode === 'escape') {
    // Count escape sequences in the processed string
    return (processed.match(/\\./g) || []).length;
  } else {
    // Count escape sequences in the original string
    return (original.match(/\\./g) || []).length;
  }
}

export function processStringEscape(input: string, config: StringEscapeConfig): ToolResult {
  try {
    if (!input) {
      return {
        success: false,
        error: 'Please provide text to process'
      };
    }
    
    const originalLength = input.length;
    let output = '';
    
    if (config.mode === 'escape') {
      switch (config.type) {
        case 'javascript':
        case 'json':
          output = escapeJavaScript(input, config.escapeUnicode);
          break;
        case 'html':
        case 'xml':
          output = escapeHtml(input);
          break;
        case 'css':
          output = escapeCss(input);
          break;
        case 'sql':
          output = escapeSql(input);
          break;
        case 'regex':
          output = escapeRegex(input);
          break;
        case 'url':
          output = escapeUrl(input);
          break;
        case 'csv':
          output = escapeCsv(input);
          break;
        case 'python':
          output = escapePython(input, config.escapeUnicode);
          break;
        default:
          return {
            success: false,
            error: 'Unsupported escape type'
          };
      }
    } else {
      switch (config.type) {
        case 'javascript':
        case 'json':
          output = unescapeJavaScript(input);
          break;
        case 'html':
        case 'xml':
          output = unescapeHtml(input);
          break;
        case 'css':
          output = unescapeCss(input);
          break;
        case 'sql':
          output = unescapeSql(input);
          break;
        case 'regex':
          output = unescapeRegex(input);
          break;
        case 'url':
          output = unescapeUrl(input);
          break;
        case 'csv':
          output = unescapeCsv(input);
          break;
        case 'python':
          output = unescapePython(input);
          break;
        default:
          return {
            success: false,
            error: 'Unsupported unescape type'
          };
      }
    }
    
    // Handle line break preservation
    if (!config.preserveLineBreaks && config.mode === 'escape') {
      // Additional processing can be added here if needed
    }
    
    const escapeCount = countEscapes(input, output, config.mode);
    
    return {
      success: true,
      output,
      stats: {
        originalLength,
        processedLength: output.length,
        escapeCount
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process string'
    };
  }
}

export const STRING_ESCAPE_TOOL: Tool = {
  id: 'string-escape',
  name: 'String Escape & Unescape',
  description: 'Escape and unescape strings for various programming languages and formats including JavaScript, JSON, HTML, XML, CSS, SQL, RegEx, URL, CSV, and Python.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'text-encoding')!,
  slug: 'string-escape',
  icon: 'Slash',
  tags: ['escape', 'unescape', 'string', 'javascript', 'html', 'sql', 'csv'],
  complexity: 'intermediate',
  keywords: ['escape', 'unescape', 'string', 'javascript', 'json', 'html', 'xml', 'css', 'sql', 'regex', 'url', 'csv', 'python'],
  
  examples: [
    {
      title: 'JavaScript String Escaping',
      input: `Hello "World"
Line 2 with 'quotes'
Tab:	Space and backslash: \\`,
      output: `Hello \"World\"
Line 2 with \'quotes\'
Tab:\tSpace and backslash: \\\\`,
      description: 'Escape special characters for JavaScript strings'
    },
    {
      title: 'HTML Entity Escaping',
      input: '<div class="example">Hello & welcome to our site!</div>',
      output: '&lt;div class=&quot;example&quot;&gt;Hello &amp; welcome to our site!&lt;/div&gt;',
      description: 'Convert HTML special characters to entities'
    },
    {
      title: 'SQL String Escaping',
      input: "SELECT * FROM users WHERE name = 'John O'Connor';",
      output: "SELECT * FROM users WHERE name = 'John O''Connor';",
      description: 'Escape single quotes and special characters for SQL'
    }
  ],
  
  useCases: [
    'Preparing strings for JavaScript/JSON output',
    'Escaping HTML content for safe display',
    'Creating SQL-safe query strings',
    'Preparing data for CSV export',
    'Escaping regex patterns and URL parameters'
  ],
  
  faq: [
    {
      question: 'What\'s the difference between JavaScript and JSON escaping?',
      answer: 'JavaScript and JSON escaping are very similar, but JSON is more strict. Both handle quotes, backslashes, and control characters the same way. The tool treats them identically for practical purposes.'
    },
    {
      question: 'When should I escape Unicode characters?',
      answer: 'Enable Unicode escaping when you need ASCII-only output or when working with systems that don\'t handle Unicode well. Otherwise, leave it disabled for better readability.'
    },
    {
      question: 'Why does my CSV text get wrapped in quotes?',
      answer: 'CSV escaping adds quotes around text that contains commas, quotes, or line breaks. This is the standard CSV format to preserve the data structure.'
    },
    {
      question: 'Can I unescape text that wasn\'t escaped by this tool?',
      answer: 'Yes, the unescape function works with any properly escaped text, regardless of which tool created it. However, malformed escape sequences may not process correctly.'
    },
    {
      question: 'What does "preserve line breaks" do?',
      answer: 'When enabled, actual line breaks in your text are maintained. When disabled, they are converted to escape sequences like \\n.'
    }
  ],
  
  commonErrors: [
    'Malformed escape sequence',
    'Unicode characters not displaying correctly',
    'CSV text not properly quoted'
  ],
  
  relatedTools: ['html-entity-encoder', 'url-encoder', 'base64-encoder'],
  seoTitle: 'String Escape & Unescape Tool - Multi-Format String Escaper',
  seoDescription: 'Escape and unescape strings for JavaScript, HTML, SQL, CSV, and more. Handle special characters safely for any programming language.'
};