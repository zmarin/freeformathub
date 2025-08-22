import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface CsvFormatterConfig {
  mode: 'format' | 'validate' | 'convert';
  delimiter: ',' | ';' | '\t' | '|' | 'custom';
  customDelimiter: string;
  quoteChar: '"' | "'" | 'auto';
  escapeChar: '\\' | '"' | 'auto';
  hasHeader: boolean;
  strictValidation: boolean;
  trimWhitespace: boolean;
  handleEmptyRows: 'keep' | 'remove' | 'error';
  outputFormat: 'csv' | 'tsv' | 'json' | 'table';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filterColumn: string;
  filterValue: string;
  addRowNumbers: boolean;
  detectTypes: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: {
    rowCount: number;
    columnCount: number;
    headerCount: number;
    emptyRows: number;
    totalCells: number;
    validCells: number;
    invalidCells: number;
    dataTypes: { [column: string]: string };
    duplicateRows: number;
    originalSize: number;
    processedSize: number;
  };
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  row: number;
  column: number;
  columnName?: string;
  message: string;
  value?: string;
  expectedType?: string;
  severity: 'error' | 'warning';
}

interface CsvRow {
  [key: string]: string;
}

interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
  rawRows: string[][];
}

function detectDelimiter(content: string): string {
  const sample = content.split('\n').slice(0, 10).join('\n');
  const delimiters = [',', ';', '\t', '|'];
  const counts: { [key: string]: number } = {};
  
  for (const delimiter of delimiters) {
    const lines = sample.split('\n');
    let consistentCount = 0;
    let firstLineCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const count = lines[i].split(delimiter).length - 1;
      if (i === 0) {
        firstLineCount = count;
      } else if (count === firstLineCount && count > 0) {
        consistentCount++;
      }
    }
    
    counts[delimiter] = firstLineCount > 0 ? consistentCount : 0;
  }
  
  // Return delimiter with highest consistency score
  return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
}

function detectQuoteChar(content: string, delimiter: string): string {
  const quotes = ['"', "'"];
  const sample = content.split('\n').slice(0, 5).join('\n');
  
  for (const quote of quotes) {
    if (sample.includes(quote + delimiter) || sample.includes(delimiter + quote)) {
      return quote;
    }
  }
  
  return '"'; // Default
}

function parseCsvLine(line: string, delimiter: string, quoteChar: string, escapeChar: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (!inQuotes && char === quoteChar) {
      // Start quoted field
      inQuotes = true;
    } else if (inQuotes && char === quoteChar) {
      if (nextChar === quoteChar) {
        // Escaped quote
        current += quoteChar;
        i++; // Skip next character
      } else {
        // End quoted field
        inQuotes = false;
      }
    } else if (inQuotes && char === escapeChar && nextChar) {
      // Escaped character
      current += nextChar;
      i++; // Skip next character
    } else if (!inQuotes && char === delimiter) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  result.push(current);
  return result;
}

function parseCsv(content: string, config: CsvFormatterConfig): ParsedCsv {
  const lines = content.split('\n');
  const delimiter = config.delimiter === 'custom' ? config.customDelimiter : config.delimiter;
  const quoteChar = config.quoteChar === 'auto' ? detectQuoteChar(content, delimiter) : config.quoteChar;
  const escapeChar = config.escapeChar === 'auto' ? quoteChar : config.escapeChar;
  
  const rawRows: string[][] = [];
  const processedLines: string[] = [];
  
  // Filter out empty rows if needed
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (config.handleEmptyRows === 'keep') {
        processedLines.push(line);
      } else if (config.handleEmptyRows === 'error') {
        // Will be handled in validation
        processedLines.push(line);
      }
      // 'remove' option just skips the line
    } else {
      processedLines.push(line);
    }
  }
  
  // Parse each line
  for (const line of processedLines) {
    if (line.trim().length === 0 && config.handleEmptyRows === 'remove') {
      continue;
    }
    
    const fields = parseCsvLine(line, delimiter, quoteChar, escapeChar);
    
    if (config.trimWhitespace) {
      rawRows.push(fields.map(field => field.trim()));
    } else {
      rawRows.push(fields);
    }
  }
  
  // Extract headers and data rows
  const headers: string[] = config.hasHeader && rawRows.length > 0 ? rawRows[0] : [];
  const dataRows = config.hasHeader ? rawRows.slice(1) : rawRows;
  
  // Create object representation
  const rows: CsvRow[] = [];
  for (const row of dataRows) {
    const rowObj: CsvRow = {};
    
    if (config.hasHeader && headers.length > 0) {
      // Use headers as keys
      for (let i = 0; i < Math.max(headers.length, row.length); i++) {
        const key = headers[i] || `Column${i + 1}`;
        rowObj[key] = row[i] || '';
      }
    } else {
      // Use generic column names
      for (let i = 0; i < row.length; i++) {
        rowObj[`Column${i + 1}`] = row[i] || '';
      }
    }
    
    rows.push(rowObj);
  }
  
  return {
    headers: config.hasHeader ? headers : Object.keys(rows[0] || {}),
    rows,
    rawRows
  };
}

function detectDataTypes(rows: CsvRow[], headers: string[]): { [column: string]: string } {
  const types: { [column: string]: string } = {};
  
  for (const header of headers) {
    const values = rows.map(row => row[header]).filter(val => val && val.trim().length > 0);
    
    if (values.length === 0) {
      types[header] = 'empty';
      continue;
    }
    
    const sampleSize = Math.min(values.length, 100);
    const sample = values.slice(0, sampleSize);
    
    let isNumber = true;
    let isInteger = true;
    let isDate = true;
    let isBoolean = true;
    let isEmail = true;
    let isUrl = true;
    
    for (const value of sample) {
      const trimmed = value.trim();
      
      // Check number
      if (isNumber && (isNaN(Number(trimmed)) || trimmed === '')) {
        isNumber = false;
      }
      
      // Check integer
      if (isInteger && (!isNumber || !Number.isInteger(Number(trimmed)))) {
        isInteger = false;
      }
      
      // Check date
      if (isDate && isNaN(Date.parse(trimmed))) {
        isDate = false;
      }
      
      // Check boolean
      if (isBoolean && !['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(trimmed.toLowerCase())) {
        isBoolean = false;
      }
      
      // Check email
      if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        isEmail = false;
      }
      
      // Check URL
      if (isUrl && !/^https?:\/\/[^\s]+$/.test(trimmed)) {
        isUrl = false;
      }
    }
    
    if (isInteger) {
      types[header] = 'integer';
    } else if (isNumber) {
      types[header] = 'number';
    } else if (isDate) {
      types[header] = 'date';
    } else if (isBoolean) {
      types[header] = 'boolean';
    } else if (isEmail) {
      types[header] = 'email';
    } else if (isUrl) {
      types[header] = 'url';
    } else {
      types[header] = 'text';
    }
  }
  
  return types;
}

function validateCsv(parsed: ParsedCsv, config: CsvFormatterConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  const { headers, rows, rawRows } = parsed;
  
  // Check for consistent column count
  if (config.strictValidation) {
    const expectedColumnCount = headers.length;
    
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowIndex = config.hasHeader ? i : i + 1;
      
      if (row.length !== expectedColumnCount) {
        errors.push({
          row: rowIndex,
          column: -1,
          message: `Row has ${row.length} columns, expected ${expectedColumnCount}`,
          severity: 'error'
        });
      }
    }
  }
  
  // Check for empty rows
  if (config.handleEmptyRows === 'error') {
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (row.every(cell => !cell || cell.trim().length === 0)) {
        errors.push({
          row: i + 1,
          column: -1,
          message: 'Empty row detected',
          severity: 'warning'
        });
      }
    }
  }
  
  // Type validation if enabled
  if (config.detectTypes && config.strictValidation) {
    const dataTypes = detectDataTypes(rows, headers);
    
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      
      for (const [columnName, expectedType] of Object.entries(dataTypes)) {
        const value = row[columnName];
        
        if (!value || value.trim().length === 0) continue;
        
        let isValid = true;
        
        switch (expectedType) {
          case 'integer':
            isValid = !isNaN(Number(value)) && Number.isInteger(Number(value));
            break;
          case 'number':
            isValid = !isNaN(Number(value));
            break;
          case 'date':
            isValid = !isNaN(Date.parse(value));
            break;
          case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            break;
          case 'url':
            isValid = /^https?:\/\/[^\s]+$/.test(value);
            break;
          case 'boolean':
            isValid = ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(value.toLowerCase());
            break;
        }
        
        if (!isValid) {
          const columnIndex = headers.indexOf(columnName);
          errors.push({
            row: rowIndex + (config.hasHeader ? 2 : 1),
            column: columnIndex + 1,
            columnName,
            message: `Invalid ${expectedType} value`,
            value,
            expectedType,
            severity: 'warning'
          });
        }
      }
    }
  }
  
  return errors;
}

function formatCsvOutput(parsed: ParsedCsv, config: CsvFormatterConfig): string {
  const { headers, rows } = parsed;
  const delimiter = config.delimiter === 'custom' ? config.customDelimiter : config.delimiter;
  
  if (config.outputFormat === 'json') {
    if (config.hasHeader) {
      return JSON.stringify(rows, null, 2);
    } else {
      return JSON.stringify(parsed.rawRows, null, 2);
    }
  }
  
  if (config.outputFormat === 'table') {
    // ASCII table format
    const maxWidths: { [key: string]: number } = {};
    
    // Calculate max width for each column
    for (const header of headers) {
      maxWidths[header] = header.length;
      for (const row of rows) {
        const cellLength = (row[header] || '').toString().length;
        maxWidths[header] = Math.max(maxWidths[header], cellLength);
      }
    }
    
    let output = '';
    
    // Header row
    const headerRow = headers.map(h => h.padEnd(maxWidths[h])).join(' | ');
    output += '| ' + headerRow + ' |\n';
    
    // Separator row
    const separatorRow = headers.map(h => '-'.repeat(maxWidths[h])).join('-|-');
    output += '|-' + separatorRow + '-|\n';
    
    // Data rows
    for (const row of rows) {
      const dataRow = headers.map(h => (row[h] || '').padEnd(maxWidths[h])).join(' | ');
      output += '| ' + dataRow + ' |\n';
    }
    
    return output;
  }
  
  // CSV/TSV output
  const outputDelimiter = config.outputFormat === 'tsv' ? '\t' : delimiter;
  const quoteChar = config.quoteChar === 'auto' ? '"' : config.quoteChar;
  
  let output = '';
  
  // Add row numbers if requested
  const actualHeaders = config.addRowNumbers ? ['Row', ...headers] : headers;
  
  // Header row
  if (config.hasHeader) {
    const formattedHeaders = actualHeaders.map(h => needsQuoting(h, outputDelimiter) ? `${quoteChar}${h}${quoteChar}` : h);
    output += formattedHeaders.join(outputDelimiter) + '\n';
  }
  
  // Data rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let rowData = headers.map(h => row[h] || '');
    
    if (config.addRowNumbers) {
      rowData = [(i + 1).toString(), ...rowData];
    }
    
    const formattedRow = rowData.map(cell => {
      const cellStr = cell.toString();
      return needsQuoting(cellStr, outputDelimiter) ? `${quoteChar}${cellStr}${quoteChar}` : cellStr;
    });
    
    output += formattedRow.join(outputDelimiter) + '\n';
  }
  
  return output;
}

function needsQuoting(value: string, delimiter: string): boolean {
  return value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r');
}

function filterAndSort(parsed: ParsedCsv, config: CsvFormatterConfig): ParsedCsv {
  let { headers, rows, rawRows } = parsed;
  
  // Apply filter
  if (config.filterColumn && config.filterValue) {
    rows = rows.filter(row => {
      const cellValue = row[config.filterColumn];
      return cellValue && cellValue.toLowerCase().includes(config.filterValue.toLowerCase());
    });
  }
  
  // Apply sort
  if (config.sortBy) {
    rows.sort((a, b) => {
      const aVal = a[config.sortBy] || '';
      const bVal = b[config.sortBy] || '';
      
      // Try numeric sort first
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return config.sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String sort
      const comparison = aVal.localeCompare(bVal);
      return config.sortOrder === 'asc' ? comparison : -comparison;
    });
  }
  
  return { headers, rows, rawRows };
}

function calculateStats(original: string, processed: string, parsed: ParsedCsv, errors: ValidationError[]): any {
  const { headers, rows, rawRows } = parsed;
  
  // Count duplicates
  const rowHashes = new Set();
  let duplicateRows = 0;
  
  for (const row of rawRows) {
    const hash = row.join('|');
    if (rowHashes.has(hash)) {
      duplicateRows++;
    } else {
      rowHashes.add(hash);
    }
  }
  
  const totalCells = rawRows.reduce((sum, row) => sum + row.length, 0);
  const invalidCells = errors.filter(e => e.column > 0).length;
  const validCells = totalCells - invalidCells;
  
  const dataTypes = detectDataTypes(rows, headers);
  
  return {
    rowCount: rawRows.length,
    columnCount: headers.length,
    headerCount: headers.length,
    emptyRows: rawRows.filter(row => row.every(cell => !cell || cell.trim().length === 0)).length,
    totalCells,
    validCells,
    invalidCells,
    dataTypes,
    duplicateRows,
    originalSize: original.length,
    processedSize: processed.length
  };
}

export function processCsvFormatter(input: string, config: CsvFormatterConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide CSV content to process'
      };
    }
    
    // Auto-detect delimiter if not specified
    let finalConfig = { ...config };
    if (config.delimiter === ',' && !input.includes(',')) {
      const detected = detectDelimiter(input);
      if (detected !== ',') {
        finalConfig.delimiter = detected as any;
      }
    }
    
    // Parse CSV
    const parsed = parseCsv(input, finalConfig);
    
    // Apply filtering and sorting
    const processedParsed = filterAndSort(parsed, finalConfig);
    
    // Validate if requested
    let validationErrors: ValidationError[] = [];
    if (config.mode === 'validate' || config.strictValidation) {
      validationErrors = validateCsv(processedParsed, finalConfig);
    }
    
    // Format output
    let output = '';
    if (config.mode === 'validate') {
      if (validationErrors.length === 0) {
        output = 'CSV validation passed! No errors found.';
      } else {
        output = `Validation found ${validationErrors.length} issue(s):\n\n`;
        for (const error of validationErrors) {
          const location = error.column > 0 ? 
            `Row ${error.row}, Column ${error.column}${error.columnName ? ` (${error.columnName})` : ''}` : 
            `Row ${error.row}`;
          output += `${error.severity.toUpperCase()}: ${location} - ${error.message}`;
          if (error.value) {
            output += ` (value: "${error.value}")`;
          }
          output += '\n';
        }
      }
    } else {
      output = formatCsvOutput(processedParsed, finalConfig);
    }
    
    const stats = calculateStats(input, output, processedParsed, validationErrors);
    
    return {
      success: true,
      output,
      stats,
      validationErrors
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CSV'
    };
  }
}

export const CSV_FORMATTER_TOOL: Tool = {
  id: 'csv-formatter',
  name: 'CSV Formatter & Validator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'json-formatting')!,
  slug: 'csv-formatter',
  icon: '📊',
  keywords: ['csv', 'formatter', 'validator', 'data', 'convert'],
  seoTitle: 'CSV Formatter & Validator - Format, Validate & Convert CSV Data | FreeFormatHub',
  seoDescription: 'Format, validate, and convert CSV data with support for different delimiters, data type detection, sorting, filtering, and conversion to JSON or table format.',
  description: 'Format, validate, and convert CSV data with support for different delimiters, data type detection, sorting, filtering, and conversion to JSON or table format.',
  
  examples: [
    {
      title: 'Basic CSV Formatting',
      input: `name,age,city
John Doe,25,New York
Jane Smith,30,London
Bob Johnson,35,Paris`,
      output: `name,age,city
John Doe,25,New York
Jane Smith,30,London
Bob Johnson,35,Paris`,
      description: 'Format and validate a basic CSV file with headers'
    },
    {
      title: 'CSV with Custom Delimiter',
      input: `name;age;city;country
"Smith, John";25;"New York, NY";USA
"Johnson, Jane";30;"London, UK";UK`,
      output: `name,age,city,country
"Smith, John",25,"New York, NY",USA
"Johnson, Jane",30,"London, UK",UK`,
      description: 'Handle CSV with semicolon delimiter and quoted fields'
    },
    {
      title: 'Convert to JSON',
      input: `product,price,category,in_stock
Laptop,999.99,Electronics,true
Book,19.99,Education,false
Phone,699.99,Electronics,true`,
      output: `[
  {
    "product": "Laptop",
    "price": "999.99",
    "category": "Electronics",
    "in_stock": "true"
  },
  {
    "product": "Book",
    "price": "19.99",
    "category": "Education",
    "in_stock": "false"
  },
  {
    "product": "Phone",
    "price": "699.99",
    "category": "Electronics",
    "in_stock": "true"
  }
]`,
      description: 'Convert CSV data to JSON format with type detection'
    }
  ],
  
  useCases: [
    'Data cleaning and preprocessing',
    'CSV file validation and error detection',
    'Format conversion between CSV, TSV, and JSON',
    'Data analysis and spreadsheet preparation',
    'Database import/export operations'
  ],
  
  faq: [
    {
      question: 'What delimiters are supported?',
      answer: 'The tool supports comma, semicolon, tab, pipe, and custom delimiters. It can auto-detect the most likely delimiter from your data.'
    },
    {
      question: 'How does data type detection work?',
      answer: 'The tool analyzes column values to detect integers, numbers, dates, booleans, emails, URLs, and text. This helps with validation and proper data handling.'
    },
    {
      question: 'Can I sort and filter CSV data?',
      answer: 'Yes, you can sort by any column in ascending or descending order, and filter rows by column values using substring matching.'
    },
    {
      question: 'What validation features are available?',
      answer: 'Validation includes checking column consistency, detecting empty rows, data type validation, and identifying malformed records with detailed error reporting.'
    },
    {
      question: 'How are quoted fields handled?',
      answer: 'The tool properly handles quoted fields with embedded delimiters, newlines, and escaped quotes according to RFC 4180 CSV standards.'
    }
  ],
  
  commonErrors: [
    'Inconsistent number of columns - check that all rows have the same number of fields',
    'Malformed quoted fields - ensure quotes are properly paired and escaped',
    'Invalid data types - review data type validation errors and correct values',
    'Custom delimiter not recognized - verify the custom delimiter setting'
  ],

  relatedTools: ['json-formatter', 'xml-formatter', 'text-statistics']
};