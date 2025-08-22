import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface DataFormatTransformerConfig {
  sourceFormat: 'json' | 'yaml' | 'csv' | 'xml' | 'toml' | 'ini' | 'properties';
  targetFormat: 'json' | 'yaml' | 'csv' | 'xml' | 'toml' | 'ini' | 'properties';
  preserveComments: boolean;
  prettyPrint: boolean;
  indentSize: number;
  csvDelimiter: string;
  csvHasHeaders: boolean;
  csvQuoteChar: string;
  csvEscapeChar: string;
  xmlRootElement: string;
  xmlIndentation: boolean;
  arrayHandling: 'flatten' | 'preserve' | 'convert';
  nullHandling: 'preserve' | 'empty' | 'omit';
  dateFormat: 'iso' | 'timestamp' | 'locale' | 'custom';
  customDateFormat: string;
  validateInput: boolean;
  strictMode: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: TransformationMetadata;
  warnings?: string[];
}

interface TransformationMetadata {
  sourceFormat: string;
  targetFormat: string;
  sourceSize: number;
  targetSize: number;
  recordCount: number;
  fieldCount: number;
  transformationTime: number;
  dataTypes: Record<string, string>;
  structure: StructureInfo;
}

interface StructureInfo {
  depth: number;
  hasArrays: boolean;
  hasObjects: boolean;
  hasNulls: boolean;
  fieldNames: string[];
  arrayFields: string[];
}

// Format detection patterns
const FORMAT_PATTERNS = {
  json: /^\s*[\{\[]/,
  yaml: /^[\s]*[-\w]+\s*:\s*.+$/m,
  xml: /^\s*<\?xml|^\s*<[a-zA-Z]/,
  csv: /^[^,\n]*,[^,\n]*(?:,[^,\n]*)*$/m,
  toml: /^\s*\[[^\]]+\]|^\s*\w+\s*=/m,
  ini: /^\s*\[[^\]]+\]|^\s*\w+\s*=/m,
  properties: /^\s*[a-zA-Z_][\w.]*\s*[=:]/m
};

function detectFormat(input: string): string {
  const trimmed = input.trim();
  
  for (const [format, pattern] of Object.entries(FORMAT_PATTERNS)) {
    if (pattern.test(trimmed)) {
      return format;
    }
  }
  
  return 'unknown';
}

function parseJSON(input: string): any {
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
  }
}

function parseYAML(input: string): any {
  // Simplified YAML parser - use a proper YAML library in production
  const lines = input.split('\n');
  const result: any = {};
  let currentKey = '';
  let indentLevel = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (line.includes(':')) {
      const [key, value] = line.split(':', 2);
      const cleanKey = key.trim();
      const cleanValue = value?.trim() || '';
      
      if (cleanValue) {
        // Try to parse as JSON value
        try {
          result[cleanKey] = JSON.parse(cleanValue);
        } catch {
          // String value
          result[cleanKey] = cleanValue;
        }
      } else {
        currentKey = cleanKey;
        result[cleanKey] = {};
      }
    } else if (trimmed.startsWith('-')) {
      // Array item
      if (!result[currentKey]) result[currentKey] = [];
      const item = trimmed.substring(1).trim();
      try {
        result[currentKey].push(JSON.parse(item));
      } catch {
        result[currentKey].push(item);
      }
    }
  }
  
  return result;
}

function parseCSV(input: string, config: DataFormatTransformerConfig): any[] {
  const lines = input.trim().split('\n');
  if (lines.length === 0) return [];
  
  const delimiter = config.csvDelimiter;
  const quote = config.csvQuoteChar;
  const escape = config.csvEscapeChar;
  
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === escape && i + 1 < line.length) {
        current += line[i + 1];
        i += 2;
      } else if (char === quote) {
        inQuotes = !inQuotes;
        i++;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result;
  };
  
  const headers = config.csvHasHeaders ? parseCSVLine(lines[0]) : null;
  const startRow = config.csvHasHeaders ? 1 : 0;
  const data: any[] = [];
  
  for (let i = startRow; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (headers) {
      const obj: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Try to parse as number or boolean
        if (value === 'true') obj[header] = true;
        else if (value === 'false') obj[header] = false;
        else if (/^\d+$/.test(value)) obj[header] = parseInt(value);
        else if (/^\d*\.\d+$/.test(value)) obj[header] = parseFloat(value);
        else obj[header] = value;
      });
      data.push(obj);
    } else {
      data.push(values);
    }
  }
  
  return data;
}

function parseXML(input: string): any {
  // Simplified XML parser - use a proper XML library in production
  const result: any = {};
  
  // Remove XML declaration and DOCTYPE
  let xml = input.replace(/<\?xml[^>]*\?>/, '').replace(/<!DOCTYPE[^>]*>/, '').trim();
  
  // Simple parsing for basic XML structures
  const tagRegex = /<(\w+)(?:\s+[^>]*)?>([^<]*)<\/\1>/g;
  let match;
  
  while ((match = tagRegex.exec(xml)) !== null) {
    const [, tagName, content] = match;
    
    // Try to parse content as number or boolean
    let value: any = content.trim();
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (/^\d+$/.test(value)) value = parseInt(value);
    else if (/^\d*\.\d+$/.test(value)) value = parseFloat(value);
    
    if (result[tagName]) {
      // Convert to array if multiple elements with same name
      if (!Array.isArray(result[tagName])) {
        result[tagName] = [result[tagName]];
      }
      result[tagName].push(value);
    } else {
      result[tagName] = value;
    }
  }
  
  return result;
}

function parseProperties(input: string): any {
  const result: any = {};
  const lines = input.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
    
    const separatorMatch = trimmed.match(/^([^=:]+)[=:](.*)$/);
    if (separatorMatch) {
      const key = separatorMatch[1].trim();
      let value = separatorMatch[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Try to parse as number or boolean
      if (value === 'true') result[key] = true;
      else if (value === 'false') result[key] = false;
      else if (/^\d+$/.test(value)) result[key] = parseInt(value);
      else if (/^\d*\.\d+$/.test(value)) result[key] = parseFloat(value);
      else result[key] = value;
    }
  }
  
  return result;
}

function formatJSON(data: any, config: DataFormatTransformerConfig): string {
  const indent = config.prettyPrint ? config.indentSize : 0;
  return JSON.stringify(data, null, indent);
}

function formatYAML(data: any, config: DataFormatTransformerConfig): string {
  const indent = ' '.repeat(config.indentSize);
  
  const formatValue = (value: any, level: number = 0): string => {
    const currentIndent = indent.repeat(level);
    
    if (value === null || value === undefined) {
      return config.nullHandling === 'preserve' ? 'null' : '';
    }
    
    if (typeof value === 'string') {
      return value.includes('\n') ? `|\n${value.split('\n').map(line => currentIndent + '  ' + line).join('\n')}` : value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return '\n' + value.map(item => `${currentIndent}- ${formatValue(item, level)}`).join('\n');
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      
      return entries.map(([key, val]) => {
        const formattedValue = formatValue(val, level + 1);
        return `${currentIndent}${key}:${formattedValue.startsWith('\n') ? formattedValue : ' ' + formattedValue}`;
      }).join('\n');
    }
    
    return String(value);
  };
  
  if (Array.isArray(data)) {
    return data.map(item => `- ${formatValue(item)}`).join('\n');
  }
  
  return formatValue(data);
}

function formatCSV(data: any, config: DataFormatTransformerConfig): string {
  const delimiter = config.csvDelimiter;
  const quote = config.csvQuoteChar;
  
  const escapeCSVValue = (value: any): string => {
    const str = String(value ?? '');
    if (str.includes(delimiter) || str.includes(quote) || str.includes('\n')) {
      return quote + str.replace(new RegExp(quote, 'g'), quote + quote) + quote;
    }
    return str;
  };
  
  if (!Array.isArray(data)) {
    // Convert object to array of key-value pairs
    data = Object.entries(data).map(([key, value]) => ({ key, value }));
  }
  
  if (data.length === 0) return '';
  
  const firstItem = data[0];
  const isObjectArray = typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem);
  
  const lines: string[] = [];
  
  if (isObjectArray) {
    // Object array with headers
    const headers = Object.keys(firstItem);
    if (config.csvHasHeaders) {
      lines.push(headers.map(escapeCSVValue).join(delimiter));
    }
    
    data.forEach((item: any) => {
      const values = headers.map(header => item[header]);
      lines.push(values.map(escapeCSVValue).join(delimiter));
    });
  } else {
    // Simple array
    data.forEach((item: any) => {
      if (Array.isArray(item)) {
        lines.push(item.map(escapeCSVValue).join(delimiter));
      } else {
        lines.push(escapeCSVValue(item));
      }
    });
  }
  
  return lines.join('\n');
}

function formatXML(data: any, config: DataFormatTransformerConfig): string {
  const indent = config.xmlIndentation ? ' '.repeat(config.indentSize) : '';
  const rootElement = config.xmlRootElement || 'root';
  
  const formatXMLValue = (key: string, value: any, level: number = 0): string => {
    const currentIndent = config.xmlIndentation ? indent.repeat(level) : '';
    
    if (value === null || value === undefined) {
      return config.nullHandling === 'preserve' ? `${currentIndent}<${key}>null</${key}>` : '';
    }
    
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return `${currentIndent}<${key}>${String(value)}</${key}>`;
    }
    
    if (Array.isArray(value)) {
      return value.map(item => formatXMLValue(key, item, level)).join(config.xmlIndentation ? '\n' : '');
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      const content = entries.map(([k, v]) => formatXMLValue(k, v, level + 1)).join(config.xmlIndentation ? '\n' : '');
      return `${currentIndent}<${key}>${config.xmlIndentation ? '\n' : ''}${content}${config.xmlIndentation ? '\n' + currentIndent : ''}</${key}>`;
    }
    
    return `${currentIndent}<${key}>${String(value)}</${key}>`;
  };
  
  let result = '<?xml version="1.0" encoding="UTF-8"?>';
  if (config.xmlIndentation) result += '\n';
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data);
    const content = entries.map(([key, value]) => formatXMLValue(key, value, 1)).join(config.xmlIndentation ? '\n' : '');
    result += `<${rootElement}>${config.xmlIndentation ? '\n' : ''}${content}${config.xmlIndentation ? '\n' : ''}</${rootElement}>`;
  } else {
    result += formatXMLValue(rootElement, data, 0);
  }
  
  return result;
}

function formatProperties(data: any): string {
  const lines: string[] = [];
  
  const formatPropertiesValue = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        formatPropertiesValue(`${key}.${nestedKey}`, nestedValue);
      });
    } else {
      const valueStr = Array.isArray(value) ? value.join(',') : String(value);
      lines.push(`${key}=${valueStr}`);
    }
  };
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    Object.entries(data).forEach(([key, value]) => {
      formatPropertiesValue(key, value);
    });
  } else {
    lines.push(`data=${String(data)}`);
  }
  
  return lines.join('\n');
}

function analyzeStructure(data: any): StructureInfo {
  const info: StructureInfo = {
    depth: 0,
    hasArrays: false,
    hasObjects: false,
    hasNulls: false,
    fieldNames: [],
    arrayFields: []
  };
  
  const analyze = (obj: any, currentDepth: number = 0): void => {
    info.depth = Math.max(info.depth, currentDepth);
    
    if (obj === null || obj === undefined) {
      info.hasNulls = true;
      return;
    }
    
    if (Array.isArray(obj)) {
      info.hasArrays = true;
      obj.forEach(item => analyze(item, currentDepth + 1));
    } else if (typeof obj === 'object') {
      info.hasObjects = true;
      Object.entries(obj).forEach(([key, value]) => {
        if (!info.fieldNames.includes(key)) {
          info.fieldNames.push(key);
        }
        if (Array.isArray(value) && !info.arrayFields.includes(key)) {
          info.arrayFields.push(key);
        }
        analyze(value, currentDepth + 1);
      });
    }
  };
  
  analyze(data);
  return info;
}

export function processDataFormatTransformer(input: string, config: DataFormatTransformerConfig): ToolResult {
  const startTime = performance.now();
  
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Input data is required'
      };
    }
    
    // Auto-detect source format if not specified
    let sourceFormat = config.sourceFormat;
    if (sourceFormat === config.targetFormat) {
      // Auto-detect when formats are the same (which might be a mistake)
      const detectedFormat = detectFormat(input);
      if (detectedFormat !== 'unknown') {
        sourceFormat = detectedFormat as any;
      }
    }
    
    // Parse input data based on source format
    let parsedData: any;
    
    switch (sourceFormat) {
      case 'json':
        parsedData = parseJSON(input);
        break;
      case 'yaml':
        parsedData = parseYAML(input);
        break;
      case 'csv':
        parsedData = parseCSV(input, config);
        break;
      case 'xml':
        parsedData = parseXML(input);
        break;
      case 'properties':
      case 'ini':
        parsedData = parseProperties(input);
        break;
      case 'toml':
        // Simplified TOML parsing - use proper library in production
        parsedData = parseProperties(input.replace(/\[.*?\]/g, '')); // Remove sections for now
        break;
      default:
        return {
          success: false,
          error: `Unsupported source format: ${sourceFormat}`
        };
    }
    
    // Apply transformations based on config
    if (config.nullHandling === 'omit') {
      const removeNulls = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(removeNulls).filter(item => item !== null && item !== undefined);
        } else if (typeof obj === 'object' && obj !== null) {
          const result: any = {};
          Object.entries(obj).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              result[key] = removeNulls(value);
            }
          });
          return result;
        }
        return obj;
      };
      parsedData = removeNulls(parsedData);
    }
    
    // Format output data based on target format
    let output: string;
    
    switch (config.targetFormat) {
      case 'json':
        output = formatJSON(parsedData, config);
        break;
      case 'yaml':
        output = formatYAML(parsedData, config);
        break;
      case 'csv':
        output = formatCSV(parsedData, config);
        break;
      case 'xml':
        output = formatXML(parsedData, config);
        break;
      case 'properties':
      case 'ini':
        output = formatProperties(parsedData);
        break;
      case 'toml':
        // Basic TOML formatting
        output = formatProperties(parsedData);
        break;
      default:
        return {
          success: false,
          error: `Unsupported target format: ${config.targetFormat}`
        };
    }
    
    // Generate metadata
    const structure = analyzeStructure(parsedData);
    const transformationTime = performance.now() - startTime;
    
    const metadata: TransformationMetadata = {
      sourceFormat,
      targetFormat: config.targetFormat,
      sourceSize: input.length,
      targetSize: output.length,
      recordCount: Array.isArray(parsedData) ? parsedData.length : 1,
      fieldCount: structure.fieldNames.length,
      transformationTime: Math.round(transformationTime * 100) / 100,
      dataTypes: {},
      structure
    };
    
    // Analyze data types
    if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
      Object.entries(parsedData).forEach(([key, value]) => {
        metadata.dataTypes[key] = Array.isArray(value) ? 'array' : typeof value;
      });
    }
    
    const warnings: string[] = [];
    
    // Add warnings for potential data loss
    if (config.targetFormat === 'csv' && structure.hasObjects) {
      warnings.push('Converting nested objects to CSV may result in data loss');
    }
    
    if (config.nullHandling === 'omit' && structure.hasNulls) {
      warnings.push('Null values have been removed from the output');
    }
    
    if (sourceFormat === 'csv' && config.targetFormat !== 'csv' && !config.csvHasHeaders) {
      warnings.push('CSV data without headers converted to generic array structure');
    }
    
    return {
      success: true,
      output,
      metadata,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const DATA_FORMAT_TRANSFORMER_TOOL: Tool = {
  id: 'data-format-transformer',
  name: 'Data Format Transformer',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'data-formats')!,
  slug: 'data-format-transformer',
  icon: '🔄',
  keywords: ['data', 'format', 'transform', 'json', 'yaml', 'csv', 'xml', 'convert', 'parser'],
  seoTitle: 'Data Format Transformer - Convert JSON, YAML, CSV, XML | FreeFormatHub',
  seoDescription: 'Transform data between JSON, YAML, CSV, XML, TOML, INI, and Properties formats. Preserves structure with advanced conversion options.',
  description: 'Transform data between multiple formats including JSON, YAML, CSV, XML, TOML, INI, and Properties with structure preservation and advanced options.',

  examples: [
    {
      title: 'JSON to YAML',
      input: '{"name": "John", "age": 30, "skills": ["JavaScript", "Python"]}',
      output: `name: John
age: 30
skills:
  - JavaScript
  - Python`,
      description: 'Convert JSON object to YAML format'
    },
    {
      title: 'CSV to JSON',
      input: `name,age,city
John,30,New York
Jane,25,Los Angeles`,
      output: `[
  {"name": "John", "age": 30, "city": "New York"},
  {"name": "Jane", "age": 25, "city": "Los Angeles"}
]`,
      description: 'Transform CSV with headers to JSON array'
    },
    {
      title: 'YAML to XML',
      input: `person:
  name: John
  age: 30`,
      output: `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person>
    <name>John</name>
    <age>30</age>
  </person>
</root>`,
      description: 'Convert YAML to structured XML'
    }
  ],

  useCases: [
    'Converting configuration files between different formats',
    'Transforming API responses from one format to another',
    'Migrating data between systems with different format requirements',
    'Converting spreadsheet data (CSV) to structured formats (JSON/YAML)',
    'Preparing data for different tools and applications',
    'Batch processing configuration files across environments',
    'Converting legacy data formats to modern standards',
    'Preparing data for import/export operations'
  ],

  faq: [
    {
      question: 'What data formats are supported?',
      answer: 'Supports JSON, YAML, CSV, XML, TOML, INI, and Properties formats with bidirectional conversion between most format pairs.'
    },
    {
      question: 'How does the tool handle nested data structures?',
      answer: 'Preserves nested objects and arrays when converting between formats that support them. Flattens or converts structures appropriately for simpler formats like CSV.'
    },
    {
      question: 'Can I customize CSV parsing and generation?',
      answer: 'Yes, configure delimiters, quote characters, header handling, and escape characters for precise CSV processing and generation.'
    },
    {
      question: 'What happens to data types during conversion?',
      answer: 'The tool preserves data types where possible, automatically detecting numbers, booleans, and strings. Some formats may require type coercion.'
    },
    {
      question: 'How are comments and metadata handled?',
      answer: 'Comments are preserved when supported by both source and target formats. Metadata like structure information is provided in the transformation report.'
    }
  ],

  commonErrors: [
    'Invalid JSON, YAML, or XML syntax in input data',
    'CSV parsing errors due to malformed delimiters or quotes',
    'Data structure incompatibilities between source and target formats',
    'Character encoding issues with special characters',
    'Memory limitations with very large data files'
  ],

  relatedTools: ['json-formatter', 'yaml-validator', 'csv-parser', 'xml-formatter', 'data-validator']
};