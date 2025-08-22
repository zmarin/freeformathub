import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JsonFormatterConfig extends ToolConfig {
  indent: number;
  sortKeys: boolean;
  removeComments: boolean;
  validateOnly: boolean;
}

export const JSON_FORMATTER_TOOL: Tool = {
  id: 'json-formatter',
  name: 'JSON Formatter & Validator',
  description: 'Format, validate, and beautify JSON data with syntax highlighting and error detection.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'json-formatting')!,
  slug: 'json-formatter',
  icon: '{}',
  keywords: ['json', 'format', 'beautify', 'validate', 'pretty print', 'minify', 'parser'],
  seoTitle: 'Free JSON Formatter & Validator Online - Format & Beautify JSON',
  seoDescription: 'Format, validate, and beautify JSON data instantly. Free online JSON formatter with syntax highlighting, error detection, and minification. No data upload required.',
  examples: [
    {
      title: 'Basic JSON Formatting',
      input: '{"name":"John","age":30,"city":"New York"}',
      output: '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}',
      description: 'Format compact JSON into readable structure'
    },
    {
      title: 'Nested Object Formatting',
      input: '{"user":{"profile":{"name":"Jane","settings":{"theme":"dark","notifications":true}}}}',
      output: '{\n  "user": {\n    "profile": {\n      "name": "Jane",\n      "settings": {\n        "theme": "dark",\n        "notifications": true\n      }\n    }\n  }\n}',
      description: 'Handle complex nested structures'
    },
    {
      title: 'Array Formatting',
      input: '[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]',
      output: '[\n  {\n    "id": 1,\n    "name": "Item 1"\n  },\n  {\n    "id": 2,\n    "name": "Item 2"\n  }\n]',
      description: 'Format arrays with proper indentation'
    }
  ],
  useCases: [
    'Format API responses for better readability',
    'Validate JSON syntax before using in applications',
    'Debug JSON structure and find syntax errors',
    'Beautify minified JSON configuration files',
    'Compare JSON objects by normalizing format',
    'Prepare JSON for documentation or presentations'
  ],
  commonErrors: [
    'Missing quotes around property names - use double quotes',
    'Trailing commas are not allowed in standard JSON',
    'Single quotes not supported - use double quotes only',
    'Undefined, functions, and comments are not valid JSON',
    'Check for unescaped special characters in strings',
    'Ensure proper nesting and bracket matching'
  ],
  faq: [
    {
      question: 'What is the difference between JSON formatting and validation?',
      answer: 'JSON formatting makes the structure readable with proper indentation, while validation checks if the syntax follows JSON standards. This tool does both simultaneously.'
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
      question: 'What JSON features are supported?',
      answer: 'Standard JSON including strings, numbers, booleans, null, objects, and arrays. Comments and trailing commas are automatically removed if present.'
    },
    {
      question: 'Can I minify JSON as well as format it?',
      answer: 'Yes, set the indent to 0 to create minified (compact) JSON output.'
    }
  ],
  relatedTools: [
    'xml-formatter',
    'yaml-formatter',
    'json-to-yaml',
    'json-validator',
    'json-minifier'
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
    // Remove comments if requested
    let cleanInput = input;
    if (config.removeComments) {
      // Remove single-line comments
      cleanInput = cleanInput.replace(/\/\/.*$/gm, '');
      // Remove multi-line comments
      cleanInput = cleanInput.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // Remove trailing commas (common in JavaScript but invalid in JSON)
    cleanInput = cleanInput.replace(/,(\s*[}\]])/g, '$1');

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
          keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0
        }
      };
    }

    // Sort keys if requested
    const sortedJson = config.sortKeys ? sortJsonKeys(parsed) : parsed;

    // Format with specified indentation
    const formatted = JSON.stringify(
      sortedJson, 
      null, 
      config.indent > 0 ? config.indent : undefined
    );

    return {
      success: true,
      output: formatted,
      metadata: {
        valid: true,
        originalSize: input.length,
        formattedSize: formatted.length,
        compressionRatio: ((input.length - formatted.length) / input.length * 100).toFixed(1),
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
        depth: calculateDepth(parsed)
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
    
    // Try to provide more helpful error messages
    let helpfulMessage = errorMessage;
    if (errorMessage.includes('Unexpected token')) {
      const match = errorMessage.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        const context = input.substring(Math.max(0, position - 20), position + 20);
        helpfulMessage += `\n\nNear: "${context}"`;
      }
    }

    // Common JSON errors with suggestions
    if (input.includes("'")) {
      helpfulMessage += '\n\nTip: Use double quotes (") instead of single quotes (\')';
    }
    if (input.match(/,\s*[}\]]/)) {
      helpfulMessage += '\n\nTip: Remove trailing commas before closing brackets';
    }
    if (input.includes('undefined') || input.includes('function')) {
      helpfulMessage += '\n\nTip: undefined and functions are not valid in JSON';
    }

    return {
      success: false,
      error: helpfulMessage
    };
  }
}

function sortJsonKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sorted: any = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortJsonKeys(obj[key]);
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