import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface CsvToJsonConfig {
  delimiter: string;
  customDelimiter: string;
  hasHeaders: boolean;
  skipEmptyLines: boolean;
  trimWhitespace: boolean;
  quoteChar: string;
  escapeChar: string;
  outputFormat: 'array' | 'object' | 'records';
  parseNumbers: boolean;
  parseBooleans: boolean;
  parseDates: boolean;
  nullValues: string[];
  customHeaders: string;
  encoding: 'utf-8' | 'latin1' | 'ascii';
  strictMode: boolean;
  includeLineNumbers: boolean;
  flattenArrays: boolean;
  maxRows: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: ConversionMetadata;
  warnings?: string[];
}

interface ConversionMetadata {
  rowCount: number;
  columnCount: number;
  detectedColumns: string[];
  dataTypes: Record<string, string>;
  nullCount: number;
  emptyRowsSkipped: number;
  processingTime: number;
  outputSize: number;
  errors: ParseError[];
}

interface ParseError {
  line: number;
  column?: string;
  error: string;
  value?: string;
}

interface ParsedRow {
  [key: string]: any;
  __line?: number;
}

// Common CSV delimiters
const DELIMITERS = {
  comma: ',',
  semicolon: ';',
  tab: '\t',
  pipe: '|',
  space: ' ',
  custom: ''
};

// Common null value representations
const DEFAULT_NULL_VALUES = ['', 'null', 'NULL', 'nil', 'NIL', 'undefined', 'N/A', 'n/a', 'NA', 'na'];

// Date format patterns for detection
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
  /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
  /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or M/D/YYYY
];

// Boolean value representations
const BOOLEAN_VALUES = {
  true: ['true', 'TRUE', 'yes', 'YES', 'y', 'Y', '1', 'on', 'ON'],
  false: ['false', 'FALSE', 'no', 'NO', 'n', 'N', '0', 'off', 'OFF']
};

function detectDelimiter(csvText: string): string {
  const sample = csvText.split('\n').slice(0, 5).join('\n');
  const delimiters = [',', ';', '\t', '|'];
  const counts: Record<string, number> = {};
  
  delimiters.forEach(delimiter => {
    const matches = sample.split(delimiter).length - 1;
    counts[delimiter] = matches;
  });
  
  const maxCount = Math.max(...Object.values(counts));
  return Object.keys(counts).find(key => counts[key] === maxCount) || ',';
}

function parseCSVLine(line: string, delimiter: string, quoteChar: string, escapeChar: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === escapeChar && i + 1 < line.length) {
      current += line[i + 1];
      i += 2;
    } else if (char === quoteChar) {
      if (inQuotes && i + 1 < line.length && line[i + 1] === quoteChar) {
        // Escaped quote
        current += quoteChar;
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current);
  return result;
}

function parseValue(value: string, config: CsvToJsonConfig): any {
  if (config.trimWhitespace) {
    value = value.trim();
  }
  
  // Remove surrounding quotes
  if (value.startsWith(config.quoteChar) && value.endsWith(config.quoteChar)) {
    value = value.slice(1, -1);
  }
  
  // Check for null values
  if (config.nullValues.includes(value)) {
    return null;
  }
  
  // Parse booleans
  if (config.parseBooleans) {
    if (BOOLEAN_VALUES.true.includes(value)) {
      return true;
    }
    if (BOOLEAN_VALUES.false.includes(value)) {
      return false;
    }
  }
  
  // Parse numbers
  if (config.parseNumbers) {
    // Integer
    if (/^-?\d+$/.test(value)) {
      const num = parseInt(value, 10);
      if (!isNaN(num)) return num;
    }
    
    // Float
    if (/^-?\d*\.\d+$/.test(value)) {
      const num = parseFloat(value);
      if (!isNaN(num)) return num;
    }
    
    // Scientific notation
    if (/^-?\d*\.?\d+e[+-]?\d+$/i.test(value)) {
      const num = parseFloat(value);
      if (!isNaN(num)) return num;
    }
  }
  
  // Parse dates
  if (config.parseDates) {
    for (const pattern of DATE_PATTERNS) {
      if (pattern.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
  }
  
  return value;
}

function detectDataTypes(data: ParsedRow[]): Record<string, string> {
  if (data.length === 0) return {};
  
  const types: Record<string, Set<string>> = {};
  const sampleSize = Math.min(data.length, 100);
  
  for (let i = 0; i < sampleSize; i++) {
    const row = data[i];
    for (const [key, value] of Object.entries(row)) {
      if (key === '__line') continue;
      
      if (!types[key]) {
        types[key] = new Set();
      }
      
      if (value === null || value === undefined) {
        types[key].add('null');
      } else if (typeof value === 'boolean') {
        types[key].add('boolean');
      } else if (typeof value === 'number') {
        types[key].add(Number.isInteger(value) ? 'integer' : 'number');
      } else if (typeof value === 'string') {
        // Check if it looks like a date
        if (DATE_PATTERNS.some(pattern => pattern.test(value))) {
          types[key].add('date');
        } else {
          types[key].add('string');
        }
      } else {
        types[key].add(typeof value);
      }
    }
  }
  
  const result: Record<string, string> = {};
  for (const [key, typeSet] of Object.entries(types)) {
    const typeArray = Array.from(typeSet).filter(t => t !== 'null');
    if (typeArray.length === 0) {
      result[key] = 'null';
    } else if (typeArray.length === 1) {
      result[key] = typeArray[0];
    } else if (typeArray.includes('string')) {
      result[key] = 'mixed (string)';
    } else {
      result[key] = `mixed (${typeArray.join(', ')})`;
    }
  }
  
  return result;
}

function generateHeaders(columnCount: number, customHeaders?: string): string[] {
  if (customHeaders) {
    return customHeaders.split(',').map(h => h.trim());
  }
  
  return Array.from({ length: columnCount }, (_, i) => `column_${i + 1}`);
}

export function processCsvToJson(input: string, config: CsvToJsonConfig): ToolResult {
  const startTime = performance.now();
  
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'CSV input is required'
      };
    }
    
    const warnings: string[] = [];
    const parseErrors: ParseError[] = [];
    let emptyRowsSkipped = 0;
    
    // Determine delimiter
    const delimiter = config.delimiter === 'custom' ? config.customDelimiter : 
                     DELIMITERS[config.delimiter as keyof typeof DELIMITERS] || ',';
    
    if (!delimiter) {
      return {
        success: false,
        error: 'Invalid delimiter specified'
      };
    }
    
    // Split into lines
    const lines = input.split(/\r?\n/);
    const dataLines: string[] = [];
    
    // Filter out empty lines if requested
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (config.skipEmptyLines && !line.trim()) {
        emptyRowsSkipped++;
        continue;
      }
      dataLines.push(line);
      
      if (config.maxRows > 0 && dataLines.length >= config.maxRows + (config.hasHeaders ? 1 : 0)) {
        warnings.push(`Limited to ${config.maxRows} rows as requested`);
        break;
      }
    }
    
    if (dataLines.length === 0) {
      return {
        success: false,
        error: 'No data rows found'
      };
    }
    
    // Parse first line to determine column count
    const firstLine = parseCSVLine(dataLines[0], delimiter, config.quoteChar, config.escapeChar);
    const columnCount = firstLine.length;
    
    // Determine headers
    let headers: string[];
    let dataStartIndex = 0;
    
    if (config.hasHeaders) {
      headers = firstLine.map(h => config.trimWhitespace ? h.trim() : h);
      dataStartIndex = 1;
      
      // Remove quotes from headers
      headers = headers.map(h => {
        if (h.startsWith(config.quoteChar) && h.endsWith(config.quoteChar)) {
          return h.slice(1, -1);
        }
        return h;
      });
    } else {
      headers = generateHeaders(columnCount, config.customHeaders);
    }
    
    // Check for duplicate headers
    const headerCounts: Record<string, number> = {};
    headers.forEach(h => {
      headerCounts[h] = (headerCounts[h] || 0) + 1;
    });
    
    const duplicates = Object.entries(headerCounts).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate headers detected: ${duplicates.map(([h]) => h).join(', ')}`);
      
      // Make headers unique
      const seen: Set<string> = new Set();
      headers = headers.map(h => {
        if (seen.has(h)) {
          let counter = 2;
          let uniqueHeader = `${h}_${counter}`;
          while (seen.has(uniqueHeader)) {
            counter++;
            uniqueHeader = `${h}_${counter}`;
          }
          seen.add(uniqueHeader);
          return uniqueHeader;
        }
        seen.add(h);
        return h;
      });
    }
    
    // Parse data rows
    const data: ParsedRow[] = [];
    let nullCount = 0;
    
    for (let i = dataStartIndex; i < dataLines.length; i++) {
      const line = dataLines[i];
      const lineNumber = i + 1;
      
      if (config.skipEmptyLines && !line.trim()) {
        continue;
      }
      
      try {
        const values = parseCSVLine(line, delimiter, config.quoteChar, config.escapeChar);
        
        // Handle column count mismatch
        if (values.length !== columnCount) {
          if (config.strictMode) {
            parseErrors.push({
              line: lineNumber,
              error: `Expected ${columnCount} columns, got ${values.length}`,
              value: line.substring(0, 50) + (line.length > 50 ? '...' : '')
            });
            continue;
          } else {
            warnings.push(`Line ${lineNumber}: Column count mismatch (${values.length} vs ${columnCount})`);
            // Pad with nulls or truncate
            while (values.length < columnCount) {
              values.push('');
            }
            values.splice(columnCount);
          }
        }
        
        const row: ParsedRow = {};
        
        if (config.includeLineNumbers) {
          row.__line = lineNumber;
        }
        
        for (let j = 0; j < headers.length; j++) {
          const rawValue = values[j] || '';
          const parsedValue = parseValue(rawValue, config);
          row[headers[j]] = parsedValue;
          
          if (parsedValue === null) {
            nullCount++;
          }
        }
        
        data.push(row);
        
      } catch (error) {
        parseErrors.push({
          line: lineNumber,
          error: error instanceof Error ? error.message : 'Parse error',
          value: line.substring(0, 50) + (line.length > 50 ? '...' : '')
        });
        
        if (config.strictMode) {
          continue;
        }
      }
    }
    
    if (data.length === 0) {
      return {
        success: false,
        error: 'No valid data rows could be parsed'
      };
    }
    
    // Generate output based on format
    let output: any;
    
    switch (config.outputFormat) {
      case 'array':
        // Array of arrays (including headers if requested)
        output = config.hasHeaders ? [headers, ...data.map(row => headers.map(h => row[h]))] :
                 data.map(row => headers.map(h => row[h]));
        break;
        
      case 'object':
        // Single object with arrays as values
        output = {};
        headers.forEach(header => {
          output[header] = data.map(row => row[header]);
        });
        break;
        
      case 'records':
      default:
        // Array of objects (records)
        output = data;
        break;
    }
    
    const outputString = JSON.stringify(output, null, 2);
    const processingTime = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Detect data types
    const dataTypes = detectDataTypes(data);
    
    // Add performance warnings
    if (data.length > 10000) {
      warnings.push('Large dataset - consider processing in chunks for better performance');
    }
    
    if (parseErrors.length > 0) {
      warnings.push(`${parseErrors.length} rows had parsing errors`);
    }
    
    if (emptyRowsSkipped > 0) {
      warnings.push(`Skipped ${emptyRowsSkipped} empty rows`);
    }
    
    const metadata: ConversionMetadata = {
      rowCount: data.length,
      columnCount: headers.length,
      detectedColumns: headers,
      dataTypes,
      nullCount,
      emptyRowsSkipped,
      processingTime,
      outputSize: outputString.length,
      errors: parseErrors.slice(0, 10) // Limit to first 10 errors
    };
    
    return {
      success: true,
      output: outputString,
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

export const CSV_TO_JSON_TOOL: Tool = {
  id: 'csv-to-json',
  name: 'CSV to JSON Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'data-formats')!,
  slug: 'csv-to-json',
  icon: '📊',
  keywords: ['csv', 'json', 'convert', 'parse', 'data', 'spreadsheet', 'table', 'transform'],
  seoTitle: 'CSV to JSON Converter - Transform CSV Data to JSON Format | FreeFormatHub',
  seoDescription: 'Convert CSV files to JSON format with customizable parsing options. Handle headers, delimiters, data types, and output formats.',
  description: 'Convert CSV (Comma Separated Values) files to JSON format with advanced parsing options, data type detection, and flexible output structures.',

  examples: [
    {
      title: 'CSV with Headers to JSON Objects',
      input: `name,age,city,active
John,30,New York,true
Jane,25,Los Angeles,false
Bob,35,Chicago,true`,
      output: `[
  {
    "name": "John",
    "age": 30,
    "city": "New York",
    "active": true
  },
  {
    "name": "Jane",
    "age": 25,
    "city": "Los Angeles",
    "active": false
  },
  {
    "name": "Bob",
    "age": 35,
    "city": "Chicago",
    "active": true
  }
]`,
      description: 'Convert CSV with headers to array of JSON objects'
    },
    {
      title: 'Semicolon-Separated Values',
      input: `Product;Price;Stock;Available
Laptop;999.99;15;yes
Mouse;29.99;50;yes
Keyboard;79.99;0;no`,
      output: `[
  {
    "Product": "Laptop",
    "Price": 999.99,
    "Stock": 15,
    "Available": true
  },
  {
    "Product": "Mouse",
    "Price": 29.99,
    "Stock": 50,
    "Available": true
  },
  {
    "Product": "Keyboard",
    "Price": 79.99,
    "Stock": 0,
    "Available": false
  }
]`,
      description: 'Handle different delimiters and data type parsing'
    },
    {
      title: 'CSV to Column Arrays',
      input: `date,temperature,humidity
2023-01-01,22.5,65
2023-01-02,18.3,72
2023-01-03,25.1,58`,
      output: `{
  "date": ["2023-01-01", "2023-01-02", "2023-01-03"],
  "temperature": [22.5, 18.3, 25.1],
  "humidity": [65, 72, 58]
}`,
      description: 'Convert to object with column arrays'
    }
  ],

  useCases: [
    'Converting spreadsheet exports to JSON for web applications',
    'Transforming CSV data for API consumption and integration',
    'Processing CSV files for data analysis and visualization',
    'Importing CSV data into NoSQL databases like MongoDB',
    'Converting legacy CSV reports to modern JSON format',
    'Preparing CSV data for JavaScript applications and frameworks',
    'Transforming CSV exports from CRM and ERP systems',
    'Converting survey or form data from CSV to JSON'
  ],

  faq: [
    {
      question: 'How does the tool handle different CSV delimiters?',
      answer: 'Supports comma, semicolon, tab, pipe, and custom delimiters. The tool can also auto-detect the most likely delimiter from your data.'
    },
    {
      question: 'Can it automatically detect and convert data types?',
      answer: 'Yes, the tool can parse numbers, booleans, dates, and null values automatically. You can control which types to parse in the options.'
    },
    {
      question: 'What output formats are available?',
      answer: 'Three formats: Records (array of objects), Array (2D array), and Object (columns as arrays). Records format is most commonly used.'
    },
    {
      question: 'How does it handle CSV files without headers?',
      answer: 'When headers are disabled, the tool generates column names (column_1, column_2, etc.) or you can provide custom header names.'
    },
    {
      question: 'Can it handle large CSV files?',
      answer: 'The tool processes files client-side and can handle reasonably large files. For very large datasets, consider using the row limit option to process in chunks.'
    }
  ],

  commonErrors: [
    'Inconsistent number of columns across rows',
    'Unescaped quotes or special characters in CSV data',
    'Mixed data types in columns causing parsing issues',
    'Invalid or malformed CSV structure',
    'Memory limitations with very large CSV files'
  ],

  relatedTools: ['json-to-csv', 'csv-formatter', 'json-formatter', 'data-validator', 'spreadsheet-converter']
};