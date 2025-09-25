import type { Tool, ToolResult, ToolConfig } from '../../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JsonFormatterConfig extends ToolConfig {
  indent: number;
  sortKeys: boolean;
  removeComments: boolean;
  validateOnly: boolean;
  // New advanced options (all optional for backward compatibility)
  useTabs?: boolean;
  sortKeysCaseInsensitive?: boolean;
  allowSingleQuotes?: boolean;
  quoteUnquotedKeys?: boolean;
  replaceSpecialNumbers?: 'none' | 'null' | 'string';
  inlineShortArrays?: boolean;
  inlineArrayMaxLength?: number; // default 5
  inlineArrayMaxLineLength?: number; // default 80
  escapeUnicode?: boolean;
  ensureFinalNewline?: boolean;
  detectDuplicateKeys?: boolean;
}

export const JSON_FORMATTER_TOOL: Tool = {
  id: 'json-formatter',
  name: 'JSON Formatter, Parser & Validator - Get, Search & Extract JSON Data',
  description: 'Get instant results from JSON data! Search through nested objects, extract specific values, and parse any JSON format. Advanced formatter with key sorting, inline arrays, duplicate key detection, and rich error details—all processed locally.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'json-formatting')!,
  slug: 'json-formatter',
  icon: '{}',
  keywords: ['json get values', 'json get data', 'json search keys', 'json search nested objects', 'json extract data', 'json parsing online', 'JSON file format validator', 'json get array elements', 'json formatter online', 'json validator', 'json beautifier', 'json minifier', 'jsonc formatter', 'json pretty print', 'validate json online', 'json parser', 'json viewer', 'json editor', 'format json free', 'json get specific values', 'json search through data', 'json extract nested values'],
  seoTitle: 'Free JSON Formatter, Parser & Validator - Get, Search & Extract JSON Data Online',
  seoDescription: 'Quickly get JSON values, search through nested objects, extract specific data, and parse JSON files with our advanced formatter. Get instant results from complex JSON structures. Format, validate, beautify, and extract data from JSON/JSONC files. 100% private - all processing happens locally in your browser.',
  examples: [
    {
      title: 'Get Clean JSON Output from Raw Data',
      input: '{"name":"John","age":30,"city":"New York"}',
      output: '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}',
      description: 'Get perfectly formatted JSON from compact raw data'
    },
    {
      title: 'Search Through Nested JSON Objects',
      input: '{"user":{"profile":{"name":"Jane","settings":{"theme":"dark","notifications":true}}}}',
      output: '{\n  "user": {\n    "profile": {\n      "name": "Jane",\n      "settings": {\n        "theme": "dark",\n        "notifications": true\n      }\n    }\n  }\n}',
      description: 'Get readable format to easily search through complex nested structures'
    },
    {
      title: 'Extract and Format JSON Array Elements',
      input: '[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]',
      output: '[\n  {\n    "id": 1,\n    "name": "Item 1"\n  },\n  {\n    "id": 2,\n    "name": "Item 2"\n  }\n]',
      description: 'Get individual array elements formatted for easy data extraction'
    },
    {
      title: 'JSONC with Comments & Single Quotes',
      input: `{
  // User information (JSONC)
  'name': 'John',
  age: 30, /* trailing comma allowed below */
  languages: ['en', 'es',],
  rating: NaN, // special number
}`,
      output: '{\n  "name": "John",\n  "age": 30,\n  "languages": ["en", "es"],\n  "rating": null\n}',
      description: 'Safely strip comments, convert single quotes, fix trailing commas, and coerce NaN'
    }
  ],
  useCases: [
    'Get API response data quickly and parse complex structures',
    'Search large JSON files for specific values or keys',
    'Extract configuration settings from JSON files',
    'Parse JSON logs for debugging and error analysis',
    'Get clean JSON output from minified configuration files',
    'Search through nested objects to find specific data points',
    'Extract data from JSONC files (comments, trailing commas) for processing',
    'Get readable format to compare JSON objects and identify differences',
    'Parse and extract data for documentation or presentations'
  ],
  commonErrors: [
    'Missing quotes around property names - use double quotes',
    'Trailing commas are not allowed in standard JSON',
    'Single quotes not supported - use double quotes only',
    'Undefined, functions, and comments are not valid JSON',
    'Check for unescaped special characters in strings',
    'Ensure proper nesting and bracket matching',
    'Duplicate keys in objects are allowed by parsers but cause data loss (last wins)'
  ],
  faq: [
    {
      question: 'How to get specific values from JSON?',
      answer: 'Use our JSON formatter to make your data readable, then easily locate and extract the values you need. The formatted structure makes it simple to navigate through nested objects and arrays to get exactly what you\'re looking for.'
    },
    {
      question: 'How to search through JSON data?',
      answer: 'Format your JSON first to create a readable structure. This makes it easy to search for specific keys, values, or patterns in your data. Use browser search (Ctrl+F) on the formatted output to quickly find what you need.'
    },
    {
      question: 'How to extract nested JSON objects?',
      answer: 'Our formatter reveals the complete structure of nested JSON objects with proper indentation. This makes it easy to identify and extract specific nested data, whether it\'s user profiles, configuration settings, or API response data.'
    },
    {
      question: 'What is JSON parsing and how does it work?',
      answer: 'JSON parsing converts JSON text into a structured format your applications can understand. Our tool parses JSON/JSONC input, validates the syntax, and outputs clean, properly formatted JSON that\'s ready for use in any application.'
    },
    {
      question: 'Understanding JSON file format structure',
      answer: 'JSON (JavaScript Object Notation) uses key-value pairs, arrays, and nested objects. Our formatter shows the exact structure with proper indentation, making it easy to understand the hierarchy and relationships in your JSON data.'
    },
    {
      question: 'Is my JSON data secure when using this tool?',
      answer: 'Yes, all processing happens locally in your browser. No data is sent to any server or stored anywhere.'
    },
    {
      question: 'Can I format large JSON files?',
      answer: 'Yes, but very large files (>10MB) might slow down your browser. Consider breaking them into smaller chunks if needed.'
    },
    {
      question: 'Can I minify JSON as well as format it?',
      answer: 'Yes, set the indent to 0 to create minified (compact) JSON output.'
    },
    {
      question: 'How do I pretty print JSON online?',
      answer: 'Simply paste your JSON into the formatter and click "Format JSON". The tool will automatically pretty print your JSON with proper indentation, making it readable and well-structured.'
    },
    {
      question: 'Can I validate JSON syntax errors online?',
      answer: 'Yes, our JSON validator automatically detects syntax errors, missing quotes, unclosed brackets, trailing commas, and other common JSON formatting issues with detailed error messages and line numbers.'
    },
    {
      question: 'How do I fix "Unexpected token" JSON errors?',
      answer: 'Unexpected token errors usually mean missing quotes around strings, extra commas, or invalid characters. Our validator highlights the exact location and suggests fixes for these common JSON syntax problems.'
    },
    {
      question: 'Can I convert minified JSON to readable format?',
      answer: 'Absolutely! Paste your minified (compressed) JSON and our formatter will expand it into a readable, properly indented format with clear structure and hierarchy.'
    },
    {
      question: 'Does this tool work with JSON API responses?',
      answer: 'Yes, perfect for formatting API responses from REST APIs, GraphQL, or any web service. Copy API response JSON directly from your browser network tab or API client and format it instantly.'
    },
    {
      question: 'How do I sort JSON keys alphabetically?',
      answer: 'Enable the "Sort keys alphabetically" option in the formatting settings. This will reorganize all object properties in alphabetical order, making JSON data easier to compare and analyze.'
    },
    {
      question: 'Can I remove comments from JSONC files?',
      answer: 'Yes, the tool automatically removes both single-line (//) and multi-line (/* */) comments from JSONC (JSON with Comments) files, converting them to valid JSON format.'
    },
    {
      question: 'What\'s the maximum JSON file size supported?',
      answer: 'The tool can handle JSON files up to 10MB efficiently. Larger files may work but could slow down your browser. For very large datasets, consider splitting them into smaller files.'
    },
    {
      question: 'How do I download formatted JSON?',
      answer: 'After formatting your JSON, click the "Download" button to save the formatted result as a .json file, or use "Copy" to copy the formatted JSON to your clipboard for pasting elsewhere.'
    }
  ],
  relatedTools: [
    'xml-formatter',
    'yaml-formatter',
    'json-to-yaml',
    'json-validator',
    'json-minifier'
  ],
  howItWorks: [
    {
      title: "Paste or Upload JSON Data",
      icon: "📋",
      description: "Input your JSON, JSONC, or JSON5 data directly into our online JSON formatter. Support for large JSON files up to 10MB. Drag and drop JSON files or paste from clipboard. Our JSON validator instantly detects syntax errors, missing quotes, and trailing commas for accurate JSON formatting.",
      keywords: ["paste JSON", "upload JSON file", "JSON input", "JSONC", "JSON5", "JSON validator"]
    },
    {
      title: "Configure JSON Formatting Options",
      icon: "⚙️",
      description: "Customize indentation (2, 4 spaces or tabs), enable alphabetical key sorting, remove comments from JSONC, handle special numbers (NaN, Infinity), and detect duplicate keys. Our JSON beautifier offers real-time preview with syntax highlighting and comprehensive formatting control.",
      keywords: ["JSON indentation", "sort JSON keys", "JSON beautifier options", "JSONC comments", "JSON formatting"]
    },
    {
      title: "Validate and Format JSON Instantly",
      icon: "✨",
      description: "Click 'Format JSON' to beautify, validate, and fix your JSON data. Our JSON formatter processes data locally in your browser - no server uploads required. Get instant error messages with line numbers and suggestions for fixing invalid JSON syntax and structure.",
      keywords: ["format JSON online", "validate JSON", "beautify JSON", "JSON syntax checker", "JSON parser"]
    },
    {
      title: "Export Formatted JSON Results",
      icon: "💾",
      description: "Download formatted JSON files, copy to clipboard with one click, or view in interactive tree mode. Export minified JSON for production, or pretty-printed JSON for debugging. Share formatted JSON via direct link or open in new window for enhanced workflow.",
      keywords: ["download JSON", "copy JSON", "export JSON", "minify JSON", "JSON tree view", "JSON download"]
    }
  ],
  problemsSolved: [
    {
      problem: "Debugging minified or compact JSON data becomes nearly impossible when structures are condensed into single lines, making it difficult to identify issues, understand data hierarchy, or locate specific values in API responses and configuration files.",
      solution: "Our JSON formatter instantly beautifies compressed JSON with proper indentation, line breaks, and visual structure. Advanced features include syntax highlighting, collapsible sections, and tree view mode for easy navigation through complex nested objects.",
      icon: "🔍",
      keywords: ["debug JSON", "minified JSON", "JSON structure", "beautify JSON", "JSON readability"]
    },
    {
      problem: "Invalid JSON syntax errors are cryptic and hard to troubleshoot, especially with missing quotes, trailing commas, or incorrect nesting. Development workflows get blocked by syntax errors that are difficult to locate in large JSON files.",
      solution: "Comprehensive JSON validation with detailed error messages, exact line and column numbers, visual error highlighting, and helpful suggestions for fixing common JSON syntax issues. Supports JSONC with automatic comment removal.",
      icon: "⚠️",
      keywords: ["JSON validation", "syntax errors", "JSON debugging", "invalid JSON", "JSON parser error"]
    },
    {
      problem: "Managing JSON data across different systems requires various formats - sometimes minified for production, sometimes formatted for development, with different key sorting requirements and encoding standards for API compatibility.",
      solution: "Flexible JSON processing with multiple output formats: minified for production, formatted for debugging, sorted keys for consistency, UTF-8 encoding support, and batch processing capabilities for handling multiple JSON files efficiently.",
      icon: "🔄",
      keywords: ["JSON conversion", "multiple formats", "JSON minifier", "sort JSON keys", "batch JSON processing"]
    }
  ],
  whyChoose: [
    {
      title: "100% Privacy & Security",
      description: "All JSON processing happens locally in your browser with zero data transmission to servers. No uploads, no logging, no data retention. Your sensitive JSON data, API responses, and configuration files remain completely private and secure.",
      icon: "🔒",
      keywords: ["private JSON formatter", "secure JSON tool", "no data upload", "local JSON processing"]
    },
    {
      title: "Advanced JSON Features",
      description: "Beyond basic formatting - supports JSONC comments, trailing commas, single quotes, duplicate key detection, special number handling, and interactive tree view. Perfect for modern development workflows with comprehensive JSON dialect support.",
      icon: "⚡",
      keywords: ["JSONC support", "advanced JSON", "JSON tree view", "duplicate keys", "JSON5 features"]
    },
    {
      title: "Developer-Friendly Tools",
      description: "Built for developers by developers. Keyboard shortcuts, auto-formatting, real-time validation, syntax highlighting, line numbers, path navigation, search functionality, and direct integration with popular development workflows.",
      icon: "👨‍💻",
      keywords: ["developer tools", "keyboard shortcuts", "real-time validation", "JSON development", "programming tools"]
    },
    {
      title: "Lightning Fast Performance",
      description: "Instant processing of large JSON files up to 10MB with optimized parsing algorithms. No waiting, no timeouts, no browser crashes. Handles complex nested structures and large arrays with consistent performance across all devices.",
      icon: "⚡",
      keywords: ["fast JSON formatter", "large JSON files", "JSON performance", "instant processing", "optimized JSON parser"]
    }
  ]
};

export function formatJson(input: string, config: JsonFormatterConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide JSON data to format.'
    };
  }

  try {
    const start = performance.now?.() ?? Date.now();

    // Normalize/clean input safely (JSONC-like handling)
    const cleaned = cleanJsonInput(input, {
      removeComments: !!config.removeComments,
      allowSingleQuotes: config.allowSingleQuotes !== false, // default true
      quoteUnquotedKeys: config.quoteUnquotedKeys !== false, // default true
      replaceSpecialNumbers: config.replaceSpecialNumbers ?? 'none',
    });

    const cleanInput = cleaned.text;

    // Optionally detect duplicate keys on cleaned input (pre-parse)
    const duplicateInfo = (config.detectDuplicateKeys ?? true)
      ? detectDuplicateKeys(cleanInput)
      : { duplicates: [], count: 0 };

    // Parse the JSON
    const parsed = JSON.parse(cleanInput);

    // If validation only, return success without formatting
    if (config.validateOnly) {
      return {
        success: true,
        output: 'Valid JSON ✓',
        metadata: {
          valid: true,
          type: Array.isArray(parsed) ? 'array' : typeof parsed,
          keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0,
          duplicates: duplicateInfo.duplicates,
          duplicateCount: duplicateInfo.count,
          processingTimeMs: (performance.now?.() ?? Date.now()) - start,
        }
      };
    }

    // Sort keys if requested
    const sortedJson = config.sortKeys
      ? sortJsonKeys(parsed, !!config.sortKeysCaseInsensitive)
      : parsed;

    // Format with specified indentation
    const indentSize = Math.max(0, Number(config.indent ?? 2));
    const indentStr = indentSize > 0
      ? (config.useTabs ? '\t'.repeat(Math.max(1, indentSize)) : ' '.repeat(indentSize))
      : '';

    let formatted = prettyStringify(sortedJson, {
      indentStr,
      sortKeys: !!config.sortKeys,
      sortKeysCaseInsensitive: !!config.sortKeysCaseInsensitive,
      inlineShortArrays: config.inlineShortArrays ?? true,
      inlineArrayMaxLength: config.inlineArrayMaxLength ?? 5,
      inlineArrayMaxLineLength: config.inlineArrayMaxLineLength ?? 80,
      escapeUnicode: !!config.escapeUnicode,
      minify: indentSize === 0,
    });

    if (config.ensureFinalNewline) {
      if (!formatted.endsWith('\n')) formatted += '\n';
    }

    const valueType = Array.isArray(parsed) ? 'array' : typeof parsed;
    const topLevelKeys = valueType === 'object' && parsed !== null ? Object.keys(parsed).length : undefined;
    const topLevelLength = Array.isArray(parsed) ? parsed.length : undefined;

    return {
      success: true,
      output: formatted,
      metadata: {
        valid: true,
        originalSize: input.length,
        formattedSize: formatted.length,
        compressionRatio: ((input.length - formatted.length) / input.length * 100).toFixed(1),
        type: valueType,
        depth: calculateDepth(parsed),
        topLevelKeys,
        topLevelLength,
        duplicates: duplicateInfo.duplicates,
        duplicateCount: duplicateInfo.count,
        processingTimeMs: (performance.now?.() ?? Date.now()) - start,
        cleaning: cleaned.transforms,
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';

    // Try to provide more helpful error messages
    let helpfulMessage = errorMessage;

    // When available, compute error location against the actually parsed source (cleanInput)
    // Fallback to the original input if preprocessing failed before producing cleanInput
    const sourceForError = typeof cleanInput === 'string' ? cleanInput : input;

    // Extract position from error and compute line/column and caret
    const match = ('' + errorMessage).match(/position\s+(\d+)/i);
    if (match) {
      const pos = parseInt(match[1]);
      const loc = indexToLineCol(sourceForError, pos);
      const lineText = getLineText(sourceForError, loc.line);
      const caret = ' '.repeat(Math.max(0, loc.column - 1)) + '↑';
      helpfulMessage += `\n\nAt line ${loc.line}, column ${loc.column}`;
      helpfulMessage += `\n${lineText}\n${caret}`;
    }

    // Common JSON errors with suggestions (check the same source used for location)
    if (sourceForError.includes("'")) {
      helpfulMessage += '\n\nTip: Use double quotes (") instead of single quotes (\')';
    }
    if (sourceForError.match(/,\s*[}\]]/)) {
      helpfulMessage += '\n\nTip: Remove trailing commas before closing brackets';
    }
    if (sourceForError.includes('undefined') || sourceForError.includes('function')) {
      helpfulMessage += '\n\nTip: undefined and functions are not valid in JSON';
    }
    if (/^\uFEFF/.test(sourceForError)) {
      helpfulMessage += '\n\nTip: Remove BOM (\uFEFF) at the start of the file';
    }

    // If preprocessing was applied, surface that fact for clarity
    try {
      if (typeof cleaned === 'object' && cleaned && cleaned.transforms) {
        const keys = Object.keys(cleaned.transforms);
        if (keys.length > 0) {
          helpfulMessage += `\n\nPre-processing applied: ${keys.join(', ')}`;
        }
      }
    } catch {}

    return {
      success: false,
      error: helpfulMessage
    };
  }
}

function sortJsonKeys(obj: any, caseInsensitive: boolean): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => sortJsonKeys(v, caseInsensitive));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sorted: any = {};
    const keys = Object.keys(obj).sort((a, b) => {
      if (caseInsensitive) return a.toLowerCase().localeCompare(b.toLowerCase());
      return a.localeCompare(b);
    });
    keys.forEach(key => {
      sorted[key] = sortJsonKeys(obj[key], caseInsensitive);
    });
    return sorted;
  }
  
  return obj;
}

function calculateDepth(obj: any, currentDepth: number = 0): number {
  if (obj === null || typeof obj !== 'object') {
    return currentDepth;
  }
  
  if (Array.isArray(obj)) {
    return obj.reduce((maxDepth, item) => 
      Math.max(maxDepth, calculateDepth(item, currentDepth + 1)), currentDepth
    );
  }
  
  return Object.values(obj).reduce((maxDepth, value) => 
    Math.max(maxDepth, calculateDepth(value, currentDepth + 1)), currentDepth
  );
}

// Utilities
type CleanOptions = {
  removeComments: boolean;
  allowSingleQuotes: boolean;
  quoteUnquotedKeys: boolean;
  replaceSpecialNumbers: 'none' | 'null' | 'string';
};

function cleanJsonInput(text: string, opts: CleanOptions): { text: string; transforms: Record<string, any> } {
  let src = text;
  const transforms: Record<string, any> = {};

  // Remove BOM
  if (src.charCodeAt(0) === 0xFEFF) {
    src = src.slice(1);
    transforms.removedBOM = true;
  }

  // Remove comments safely
  if (opts.removeComments) {
    const removed = stripComments(src);
    if (removed.modified) transforms.removedComments = true;
    src = removed.text;
  }

  // Remove trailing commas safely
  const noTrailing = stripTrailingCommas(src);
  if (noTrailing.modified) transforms.removedTrailingCommas = true;
  src = noTrailing.text;

  // Convert single-quoted strings to double-quoted
  if (opts.allowSingleQuotes) {
    const conv = convertSingleQuotedStrings(src);
    if (conv.modified) transforms.convertedSingleQuotes = true;
    src = conv.text;
  }

  // Quote unquoted object keys (JSONC style) safely when in key position
  if (opts.quoteUnquotedKeys) {
    const quoted = quoteUnquotedKeys(src);
    if (quoted.modified) transforms.quotedUnquotedKeys = true;
    src = quoted.text;
  }

  // Replace special numbers outside strings/comments
  if (opts.replaceSpecialNumbers !== 'none') {
    const rep = replaceSpecialNumbers(src, opts.replaceSpecialNumbers);
    if (rep.modified) transforms.replacedSpecialNumbers = opts.replaceSpecialNumbers;
    src = rep.text;
  }

  return { text: src, transforms };
}

function stripComments(src: string): { text: string; modified: boolean } {
  let out = '';
  let i = 0;
  let modified = false;
  let inString: false | 'single' | 'double' = false;
  let escaped = false;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (inString) {
      out += ch;
      if (!escaped && ((inString === 'double' && ch === '"') || (inString === 'single' && ch === "'"))) {
        inString = false;
      }
      escaped = !escaped && ch === '\\';
      i++;
      continue;
    }

    // Enter string
    if (ch === '"') { inString = 'double'; out += ch; i++; escaped = false; continue; }
    if (ch === "'") { inString = 'single'; out += ch; i++; escaped = false; continue; }

    // Line comment //...
    if (ch === '/' && next === '/') {
      modified = true;
      i += 2;
      while (i < src.length && src[i] !== '\n') i++;
      continue; // skip until newline (drop comment)
    }

    // Block comment /* ... */
    if (ch === '/' && next === '*') {
      modified = true;
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2; // skip closing */
      continue;
    }

    out += ch;
    i++;
  }
  return { text: out, modified };
}

function stripTrailingCommas(src: string): { text: string; modified: boolean } {
  let out = '';
  let i = 0;
  let modified = false;
  let inString: false | 'single' | 'double' = false;
  let escaped = false;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (inString) {
      out += ch;
      if (!escaped && ((inString === 'double' && ch === '"') || (inString === 'single' && ch === "'"))) {
        inString = false;
      }
      escaped = !escaped && ch === '\\';
      i++;
      continue;
    }

    // Enter string
    if (ch === '"') { inString = 'double'; out += ch; i++; escaped = false; continue; }
    if (ch === "'") { inString = 'single'; out += ch; i++; escaped = false; continue; }

    if (ch === ',') {
      // Lookahead to see if the next non-whitespace/comment char is } or ]
      let j = i + 1;
      // Skip whitespace and comments
      while (j < src.length) {
        const cj = src[j];
        if (cj === ' ' || cj === '\t' || cj === '\n' || cj === '\r') { j++; continue; }
        if (cj === '/' && src[j + 1] === '/') { j += 2; while (j < src.length && src[j] !== '\n') j++; continue; }
        if (cj === '/' && src[j + 1] === '*') { j += 2; while (j < src.length && !(src[j] === '*' && src[j + 1] === '/')) j++; j += 2; continue; }
        break;
      }
      const endCh = src[j];
      if (endCh === '}' || endCh === ']') {
        // Skip this comma
        modified = true;
        i++; // do not append
        continue;
      }
    }

    out += ch;
    i++;
  }
  return { text: out, modified };
}

function convertSingleQuotedStrings(src: string): { text: string; modified: boolean } {
  let out = '';
  let i = 0;
  let modified = false;
  let inDouble = false;
  let inSingle = false;
  let escaped = false;
  while (i < src.length) {
    const ch = src[i];
    if (inDouble) {
      out += ch;
      if (!escaped && ch === '"') inDouble = false;
      escaped = !escaped && ch === '\\';
      i++;
      continue;
    }
    if (inSingle) {
      // Convert content into a double-quoted string
      let content = '';
      let esc = false;
      while (i < src.length) {
        const c = src[i++];
        if (!esc && c === "'") {
          break; // end of single-quoted string
        }
        if (!esc && c === '\\') {
          esc = true;
          continue;
        }
        if (esc) {
          // Special case: \' should become '
          if (c === "'") {
            content += "'"; // drop the backslash
          } else {
            content += '\\' + c;
          }
          esc = false;
          continue;
        }
        if (c === '"') {
          content += '\\"';
        } else if (c === '\n') {
          content += '\\n';
        } else if (c === '\r') {
          content += '\\r';
        } else {
          content += c;
        }
      }
      out += '"' + content + '"';
      inSingle = false;
      modified = true;
      continue;
    }

    if (ch === '"') { inDouble = true; out += ch; i++; escaped = false; continue; }
    if (ch === "'") { inSingle = true; i++; continue; }
    out += ch;
    i++;
  }
  return { text: out, modified };
}

function replaceSpecialNumbers(src: string, mode: 'null' | 'string'): { text: string; modified: boolean } {
  let out = '';
  let i = 0;
  let modified = false;
  let inString: false | 'single' | 'double' = false;
  let escaped = false;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (inString) {
      out += ch;
      if (!escaped && ((inString === 'double' && ch === '"') || (inString === 'single' && ch === "'"))) {
        inString = false;
      }
      escaped = !escaped && ch === '\\';
      i++;
      continue;
    }
    if (ch === '"') { inString = 'double'; out += ch; i++; escaped = false; continue; }
    if (ch === "'") { inString = 'single'; out += ch; i++; escaped = false; continue; }

    // Handle -Infinity first
    if (ch === '-' && src.slice(i + 1, i + 9) === 'Infinity') {
      modified = true;
      out += mode === 'null' ? 'null' : '"-Infinity"';
      i += 9;
      continue;
    }
    // Infinity
    if (src.slice(i, i + 8) === 'Infinity') {
      modified = true;
      out += mode === 'null' ? 'null' : '"Infinity"';
      i += 8;
      continue;
    }
    // NaN
    if (src.slice(i, i + 3) === 'NaN') {
      modified = true;
      out += mode === 'null' ? 'null' : '"NaN"';
      i += 3;
      continue;
    }

    out += ch;
    i++;
  }
  return { text: out, modified };
}

function indexToLineCol(text: string, index: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') { line++; col = 1; } else { col++; }
  }
  return { line, column: col };
}

function getLineText(text: string, line: number): string {
  const lines = text.split(/\r?\n/);
  return lines[Math.max(0, Math.min(lines.length - 1, line - 1))] ?? '';
}

function detectDuplicateKeys(src: string): { duplicates: Array<{ path: string; key: string; line: number; column: number }>; count: number } {
  type Frame = { type: 'object' | 'array'; keys?: Record<string, true>; path: (string | number)[]; index?: number };
  const stack: Frame[] = [];
  const dups: Array<{ path: string; key: string; line: number; column: number }> = [];

  let i = 0;
  let line = 1;
  let col = 1;
  let inString: false | 'single' | 'double' = false;
  let escaped = false;
  let pendingChildKey: string | undefined;
  let keyStartLine = 1;
  let keyStartCol = 1;

  const formatPath = (parts: (string | number)[]) => {
    const out: string[] = ['$'];
    for (const p of parts) out.push(typeof p === 'number' ? `[${p}]` : `.${p}`);
    return out.join('');
  };

  const pushObj = () => {
    const parent = stack.at(-1);
    const path = parent ? [...parent.path] : [];
    if (parent?.type === 'object' && pendingChildKey !== undefined) {
      path.push(pendingChildKey);
      pendingChildKey = undefined;
    } else if (parent?.type === 'array') {
      const idx = parent.index ?? 0;
      path.push(idx);
    }
    stack.push({ type: 'object', keys: {}, path });
  };
  const pushArr = () => {
    const parent = stack.at(-1);
    const path = parent ? [...parent.path] : [];
    if (parent?.type === 'object' && pendingChildKey !== undefined) {
      path.push(pendingChildKey);
      pendingChildKey = undefined;
    } else if (parent?.type === 'array') {
      const idx = parent.index ?? 0;
      path.push(idx);
    }
    stack.push({ type: 'array', path, index: 0 });
  };

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    const advance = (n = 1) => {
      for (let k = 0; k < n; k++) {
        const c = src[i++];
        if (c === '\n') { line++; col = 1; } else { col++; }
      }
    };

    if (inString) {
      if (!escaped && ((inString === 'double' && ch === '"') || (inString === 'single' && ch === "'"))) {
        inString = false; advance(); continue;
      }
      escaped = !escaped && ch === '\\';
      advance();
      continue;
    }

    // Detect keys in objects: "key" :
    if (ch === '"' && stack.at(-1)?.type === 'object') {
      // read string key
      const keyTokenStart = i;
      keyStartLine = line;
      keyStartCol = col;
      advance();
      let esc = false;
      while (i < src.length) {
        const c = src[i];
        if (!esc && c === '"') { advance(); break; }
        if (!esc && c === '\\') { esc = true; advance(); continue; }
        if (esc) { esc = false; advance(); continue; }
        advance();
      }
      const keyTokenEnd = i;
      const keyLiteral = src.slice(keyTokenStart, keyTokenEnd);
      let key: string;
      try {
        key = JSON.parse(keyLiteral);
      } catch {
        key = keyLiteral.slice(1, -1);
      }
      // skip whitespace/comments
      while (i < src.length) {
        const c = src[i];
        if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { advance(); continue; }
        if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') advance(); continue; }
        if (c === '/' && src[i + 1] === '*') { advance(2); while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) advance(); advance(2); continue; }
        break;
      }
      if (src[i] === ':') {
        const frame = stack.at(-1);
        if (frame && frame.type === 'object' && frame.keys) {
          if (Object.prototype.hasOwnProperty.call(frame.keys, key)) {
            dups.push({ path: formatPath(frame.path), key, line: keyStartLine, column: keyStartCol });
          } else {
            frame.keys[key] = true;
          }
        }
        // Remember this key for child path if next token opens an object/array
        pendingChildKey = key;
      }
      continue;
    }

    if (ch === '"') { inString = 'double'; advance(); continue; }
    if (ch === "'") { inString = 'single'; advance(); continue; }

    // skip whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') { advance(); continue; }

    // skip comments
    if (ch === '/' && next === '/') { while (i < src.length && src[i] !== '\n') advance(); continue; }
    if (ch === '/' && next === '*') { advance(2); while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) advance(); advance(2); continue; }

    if (ch === '{') { pushObj(); advance(); continue; }
    if (ch === '[') { pushArr(); advance(); continue; }
    if (ch === '}' || ch === ']') { stack.pop(); advance(); continue; }

    // Track array element index increments on commas at array level
    if (ch === ',' && stack.at(-1)?.type === 'array') {
      const arr = stack.at(-1)!;
      arr.index = (arr.index ?? 0) + 1;
      advance();
      continue;
    }

    // Track path using keys only on parse side; here we keep simple
    advance();
  }
  return { duplicates: dups, count: dups.length };
}

type PrettyOptions = {
  indentStr: string;
  sortKeys: boolean;
  sortKeysCaseInsensitive: boolean;
  inlineShortArrays: boolean;
  inlineArrayMaxLength: number;
  inlineArrayMaxLineLength: number;
  escapeUnicode: boolean;
  minify: boolean;
};

function prettyStringify(value: any, opts: PrettyOptions, level = 0): string {
  const indent = opts.minify ? '' : opts.indentStr.repeat(level);
  const nextIndent = opts.minify ? '' : opts.indentStr.repeat(level + 1);

  const stringifyString = (s: string) => {
    const json = JSON.stringify(s);
    if (!opts.escapeUnicode) return json;
    // Escape non-ASCII
    return json.replace(/[\u0080-\uFFFF]/g, (ch) => {
      const code = ch.charCodeAt(0);
      return '\\u' + code.toString(16).padStart(4, '0');
    });
  };

  const stringifyPrimitive = (v: any) => {
    if (v === null) return 'null';
    switch (typeof v) {
      case 'string':
        return stringifyString(v);
      case 'number':
        return Number.isFinite(v) ? String(v) : 'null';
      case 'boolean':
        return v ? 'true' : 'false';
      default:
        return JSON.stringify(v);
    }
  };

  if (value === null || typeof value !== 'object') {
    return stringifyPrimitive(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';

    if (opts.minify) {
      const parts = value.map(v => prettyStringify(v, opts, level + 1));
      return `[${parts.join(',')}]`;
    }

    const allPrimitive = value.every(v => v === null || typeof v !== 'object');
    if (opts.inlineShortArrays && allPrimitive && value.length <= opts.inlineArrayMaxLength) {
      const parts = value.map(v => stringifyPrimitive(v));
      const oneLine = `[${parts.join(', ')}]`;
      if (oneLine.length <= opts.inlineArrayMaxLineLength) {
        return oneLine;
      }
    }

    const lines = value.map(v => `${nextIndent}${prettyStringify(v, opts, level + 1)}`);
    return `[\n${lines.join(',\n')}\n${indent}]`;
  }

  // Object
  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  const keys = entries.map(([k]) => k);
  if (opts.sortKeys) {
    keys.sort((a, b) => opts.sortKeysCaseInsensitive
      ? a.toLowerCase().localeCompare(b.toLowerCase())
      : a.localeCompare(b)
    );
  }
  if (opts.minify) {
    const parts = keys.map((k) => `${stringifyString(k)}:${prettyStringify((value as any)[k], opts, level + 1)}`);
    return `{${parts.join(',')}}`;
  }

  const lines = keys.map((k) => {
    const v = (value as any)[k];
    return `${nextIndent}${stringifyString(k)}: ${prettyStringify(v, opts, level + 1)}`;
  });
  return `{\n${lines.join(',\n')}\n${indent}}`;
}

// Quote unquoted object keys in JSONC-like input safely.
function quoteUnquotedKeys(src: string): { text: string; modified: boolean } {
  let out = '';
  let i = 0;
  let modified = false;
  type Frame = { type: 'object' | 'array'; expectKey?: boolean; depth: number };
  const stack: Frame[] = [];
  let inString: false | 'single' | 'double' = false;
  let escaped = false;

  const isIdentStart = (c: string) => /[A-Za-z_$]/.test(c);
  const isIdent = (c: string) => /[A-Za-z0-9_\-$]/.test(c);

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    // Inside string: just copy
    if (inString) {
      out += ch;
      if (!escaped && ((inString === 'double' && ch === '"') || (inString === 'single' && ch === "'"))) {
        inString = false;
      }
      escaped = !escaped && ch === '\\';
      i++;
      continue;
    }

    if (ch === '"') { inString = 'double'; out += ch; i++; escaped = false; continue; }
    if (ch === "'") { inString = 'single'; out += ch; i++; escaped = false; continue; }

    // Maintain stack
    if (ch === '{') { stack.push({ type: 'object', expectKey: true, depth: stack.length + 1 }); out += ch; i++; continue; }
    if (ch === '[') { stack.push({ type: 'array', depth: stack.length + 1 }); out += ch; i++; continue; }
    if (ch === '}') { stack.pop(); out += ch; i++; continue; }
    if (ch === ']') { stack.pop(); out += ch; i++; continue; }

    // Track object key/value separators
    if (ch === ':' && stack.at(-1)?.type === 'object') {
      // after colon, we expect value, not key
      stack.at(-1)!.expectKey = false;
      out += ch; i++;
      continue;
    }
    if (ch === ',' && stack.at(-1)?.type === 'object') {
      // after comma in object, expect next key
      stack.at(-1)!.expectKey = true;
      out += ch; i++;
      continue;
    }

    // When inside object expecting a key, allow bare identifiers and numbers before ':'
    if (stack.at(-1)?.type === 'object' && stack.at(-1)?.expectKey) {
      // Skip whitespace
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') { out += ch; i++; continue; }

      // If we have an unquoted identifier or number
      if (isIdentStart(ch) || /[0-9]/.test(ch)) {
        let j = i;
        let key = '';
        while (j < src.length && isIdent(src[j])) {
          key += src[j++];
        }
        // skip whitespace
        let k = j;
        while (k < src.length && /[ \t\r\n]/.test(src[k])) k++;
        if (src[k] === ':') {
          // It's a key; quote it
          out += '"' + key.replace(/"/g, '\\"') + '"';
          i = j;
          modified = true;
          stack.at(-1)!.expectKey = false; // the ':' handler will run next
          continue;
        }
      }
    }

    out += ch;
    i++;
  }

  return { text: out, modified };
}
