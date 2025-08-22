import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface YamlFormatterConfig extends ToolConfig {
  mode: 'format' | 'validate' | 'convert-to-json' | 'convert-from-json';
  indent: number;
  sortKeys: boolean;
  removeComments: boolean;
  quotingType: 'single' | 'double' | 'minimal' | 'preserve';
  lineWidth: number;
}

export const YAML_FORMATTER_TOOL: Tool = {
  id: 'yaml-formatter',
  name: 'YAML Formatter & Validator',
  description: 'Format, validate, and convert YAML data with syntax checking, JSON conversion, and beautification options.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'json-formatting')!,
  slug: 'yaml-formatter',
  icon: '📄',
  keywords: ['yaml', 'yml', 'format', 'validate', 'beautify', 'convert', 'json', 'parser', 'config'],
  seoTitle: 'Free YAML Formatter & Validator Online - Format & Validate YAML',
  seoDescription: 'Format, validate, and convert YAML data instantly. Free online YAML formatter with JSON conversion, syntax validation, and beautification. Privacy-first.',
  examples: [
    {
      title: 'Basic YAML Formatting',
      input: 'name: John\nage: 30\nemail: john@example.com',
      output: 'name: John\nage: 30\nemail: john@example.com',
      description: 'Format simple YAML structure'
    },
    {
      title: 'Nested YAML Structure',
      input: 'user:\n  profile:\n    name: Jane\n    settings:\n      theme: dark\n      notifications: true',
      output: 'user:\n  profile:\n    name: Jane\n    settings:\n      theme: dark\n      notifications: true',
      description: 'Format nested YAML objects'
    },
    {
      title: 'YAML Array Formatting',
      input: 'items:\n- id: 1\n  name: Item 1\n- id: 2\n  name: Item 2',
      output: 'items:\n  - id: 1\n    name: Item 1\n  - id: 2\n    name: Item 2',
      description: 'Format YAML arrays with proper indentation'
    }
  ],
  useCases: [
    'Format configuration files for applications',
    'Validate YAML syntax before deployment',
    'Convert between YAML and JSON formats',
    'Debug YAML structure and indentation issues',
    'Beautify messy YAML configuration files',
    'Prepare YAML for documentation or sharing'
  ],
  commonErrors: [
    'Incorrect indentation - YAML is whitespace sensitive',
    'Mixing tabs and spaces - use spaces only',
    'Missing quotes around special characters',
    'Invalid YAML syntax in nested structures',
    'Inconsistent array formatting',
    'Reserved words used without proper quoting'
  ],
  faq: [
    {
      question: 'What is YAML?',
      answer: 'YAML (YAML Ain\'t Markup Language) is a human-readable data serialization standard commonly used for configuration files and data exchange.'
    },
    {
      question: 'Should I use tabs or spaces in YAML?',
      answer: 'Always use spaces, never tabs. YAML specification requires spaces for indentation. Most editors can be configured to show whitespace.'
    },
    {
      question: 'How do I handle special characters in YAML?',
      answer: 'Use quotes around strings containing special characters like colons, brackets, or quotes. Single quotes preserve literal content, double quotes allow escape sequences.'
    },
    {
      question: 'What\'s the difference between YAML and JSON?',
      answer: 'YAML is more human-readable with significant whitespace and supports comments. JSON is more compact and widely supported. Both represent the same data structures.'
    },
    {
      question: 'Can YAML contain comments?',
      answer: 'Yes, YAML supports comments using the # symbol. Comments can be on their own line or at the end of a line with data.'
    }
  ],
  relatedTools: [
    'json-formatter',
    'xml-formatter',
    'config-validator',
    'text-formatter',
    'base64-encoder'
  ]
};

export function processYaml(input: string, config: YamlFormatterConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide YAML content to process.'
    };
  }

  try {
    switch (config.mode) {
      case 'format':
        return formatYaml(input, config);
      case 'validate':
        return validateYaml(input, config);
      case 'convert-to-json':
        return convertYamlToJson(input, config);
      case 'convert-from-json':
        return convertJsonToYaml(input, config);
      default:
        throw new Error(`Unsupported mode: ${config.mode}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process YAML data'
    };
  }
}

function formatYaml(input: string, config: YamlFormatterConfig): ToolResult {
  try {
    // Parse YAML to validate and normalize
    const parsed = parseYaml(input);
    
    // Convert back to formatted YAML
    const formatted = stringifyYaml(parsed, config);
    
    return {
      success: true,
      output: formatted,
      metadata: {
        originalLines: input.split('\n').length,
        formattedLines: formatted.split('\n').length,
        indent: config.indent,
        sortKeys: config.sortKeys,
        quotingType: config.quotingType
      }
    };
  } catch (error) {
    throw new Error(`YAML formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateYaml(input: string, config: YamlFormatterConfig): ToolResult {
  try {
    const parsed = parseYaml(input);
    
    // Validate structure
    const validation = validateYamlStructure(parsed, input);
    
    return {
      success: true,
      output: validation.isValid ? 'YAML is valid ✓' : `YAML validation failed:\n${validation.errors.join('\n')}`,
      metadata: {
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        lineCount: input.split('\n').length,
        hasComments: input.includes('#'),
        estimatedSize: new Blob([input]).size
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `YAML validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function convertYamlToJson(input: string, config: YamlFormatterConfig): ToolResult {
  try {
    const parsed = parseYaml(input);
    const json = JSON.stringify(parsed, null, config.indent);
    
    return {
      success: true,
      output: json,
      metadata: {
        originalFormat: 'YAML',
        convertedFormat: 'JSON',
        originalSize: input.length,
        convertedSize: json.length,
        compressionRatio: ((json.length - input.length) / input.length * 100).toFixed(1)
      }
    };
  } catch (error) {
    throw new Error(`YAML to JSON conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function convertJsonToYaml(input: string, config: YamlFormatterConfig): ToolResult {
  try {
    // Parse JSON first
    const parsed = JSON.parse(input);
    
    // Convert to YAML
    const yaml = stringifyYaml(parsed, config);
    
    return {
      success: true,
      output: yaml,
      metadata: {
        originalFormat: 'JSON',
        convertedFormat: 'YAML',
        originalSize: input.length,
        convertedSize: yaml.length,
        compressionRatio: ((yaml.length - input.length) / input.length * 100).toFixed(1)
      }
    };
  } catch (error) {
    throw new Error(`JSON to YAML conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Simple YAML parser (basic implementation for common cases)
function parseYaml(yamlString: string): any {
  const lines = yamlString.split('\n');
  const result: any = {};
  const stack: any[] = [{ obj: result, indent: -1 }];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.length - line.trimStart().length;
    
    // Handle arrays
    if (trimmed.startsWith('- ')) {
      const value = trimmed.substring(2).trim();
      const current = getCurrentLevel(stack, indent);
      
      if (!Array.isArray(current.obj)) {
        // Convert to array if needed
        current.obj = [];
      }
      
      if (value.includes(':')) {
        // Array of objects
        const obj = parseKeyValue(value);
        current.obj.push(obj);
      } else {
        // Simple array
        current.obj.push(parseValue(value));
      }
      continue;
    }
    
    // Handle key-value pairs
    if (trimmed.includes(':')) {
      const current = getCurrentLevel(stack, indent);
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      
      if (value === '' || value === '|' || value === '>') {
        // Nested object or multiline string
        const newObj = {};
        current.obj[key.trim()] = newObj;
        stack.push({ obj: newObj, indent });
      } else {
        current.obj[key.trim()] = parseValue(value);
      }
    }
  }
  
  return result;
}

function getCurrentLevel(stack: any[], indent: number): any {
  // Pop levels that are at higher indentation
  while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
    stack.pop();
  }
  return stack[stack.length - 1];
}

function parseKeyValue(str: string): any {
  const obj: any = {};
  const [key, ...valueParts] = str.split(':');
  const value = valueParts.join(':').trim();
  obj[key.trim()] = parseValue(value);
  return obj;
}

function parseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === '') return '';
  
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }
  
  return value;
}

function stringifyYaml(obj: any, config: YamlFormatterConfig, indent = 0): string {
  const spaces = ' '.repeat(indent * config.indent);
  
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') {
    return needsQuotes(obj) ? `"${obj}"` : obj;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const itemStr = stringifyYaml(item, config, indent + 1);
      return `${spaces}- ${itemStr}`;
    }).join('\n');
  }
  
  if (typeof obj === 'object') {
    const keys = config.sortKeys ? Object.keys(obj).sort() : Object.keys(obj);
    if (keys.length === 0) return '{}';
    
    return keys.map(key => {
      const value = obj[key];
      const valueStr = stringifyYaml(value, config, indent + 1);
      
      if (typeof value === 'object' && value !== null) {
        return `${spaces}${key}:\n${valueStr}`;
      } else {
        return `${spaces}${key}: ${valueStr}`;
      }
    }).join('\n');
  }
  
  return String(obj);
}

function needsQuotes(str: string): boolean {
  // Check if string needs quotes
  return /[:\[\]{}|>@`!%&*#?]/.test(str) || 
         str.trim() !== str ||
         ['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(str.toLowerCase());
}

function validateYamlStructure(parsed: any, original: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for common issues
  const lines = original.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for tab characters
    if (line.includes('\t')) {
      errors.push(`Line ${lineNum}: Contains tab characters (use spaces only)`);
    }
    
    // Check for inconsistent indentation
    if (line.trim() && !line.startsWith('#')) {
      const indent = line.length - line.trimStart().length;
      if (indent % 2 !== 0) {
        errors.push(`Line ${lineNum}: Inconsistent indentation (use even number of spaces)`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}