import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JsonToCsvConfig extends ToolConfig {
  delimiter: string;
  includeHeaders: boolean;
  flattenObjects: boolean;
  arrayHandling: 'stringify' | 'separate' | 'ignore';
  nullHandling: 'empty' | 'null' | 'skip';
  escapeQuotes: boolean;
}

export const JSON_TO_CSV_TOOL: Tool = {
  id: 'json-to-csv',
  name: 'JSON to CSV Converter - Get Table Data from JSON',
  description: 'Get structured table data from JSON instantly! Extract JSON array elements and convert to CSV/Excel format. Perfect for getting spreadsheet data from API responses, databases, and JSON files.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'data-formats')!,
  slug: 'json-to-csv',
  icon: '📊',
  keywords: ['json get table data', 'json extract to csv', 'json parsing to spreadsheet', 'json get array data', 'json search and export', 'json', 'csv', 'convert', 'excel', 'spreadsheet', 'table', 'data', 'export', 'json to excel data', 'get json data as table'],
  seoTitle: 'Free JSON to CSV Converter - Get Table Data from JSON Arrays Online',
  seoDescription: 'Get structured table data from JSON arrays instantly. Extract and convert JSON data to CSV/Excel format. Search through JSON objects and get exactly the spreadsheet data you need. Works with nested objects, custom delimiters, and Excel compatibility.',
  examples: [
    {
      title: 'Simple Array Conversion',
      input: '[{"name":"John","age":30,"city":"New York"},{"name":"Jane","age":25,"city":"Boston"}]',
      output: 'name,age,city\nJohn,30,New York\nJane,25,Boston',
      description: 'Basic JSON array to CSV with headers'
    },
    {
      title: 'Nested Object Flattening',
      input: '[{"user":{"name":"John","profile":{"age":30}},"active":true}]',
      output: 'user.name,user.profile.age,active\nJohn,30,true',
      description: 'Flatten nested objects using dot notation'
    },
    {
      title: 'Array Handling',
      input: '[{"name":"John","skills":["JavaScript","Python","React"],"age":30}]',
      output: 'name,skills,age\nJohn,"[""JavaScript"",""Python"",""React""]",30',
      description: 'Handle arrays within objects'
    },
    {
      title: 'Custom Delimiter',
      input: '[{"name":"John","age":30},{"name":"Jane","age":25}]',
      output: 'name;age\nJohn;30\nJane;25',
      description: 'Use semicolon as delimiter (common in European locales)'
    }
  ],
  useCases: [
    'Export JSON API responses to Excel or Google Sheets',
    'Convert NoSQL database exports to CSV for analysis',
    'Transform JavaScript objects for data visualization tools',
    'Prepare JSON data for business intelligence platforms',
    'Create CSV files for email marketing tools',
    'Convert web scraping results to spreadsheet format'
  ],
  commonErrors: [
    'Invalid JSON format - ensure proper quotes and brackets',
    'Mixed data types in arrays - CSV works best with consistent structure',
    'Deeply nested objects - consider flattening or preprocessing',
    'Large arrays may cause memory issues in browsers',
    'Special characters in data may need proper escaping',
    'Null/undefined values need consistent handling strategy'
  ],
  faq: [
    {
      question: 'Can I convert nested JSON objects to CSV?',
      answer: 'Yes! Enable "Flatten Objects" to convert nested structures like {"user":{"name":"John"}} to columns like "user.name". This makes complex JSON data spreadsheet-friendly.'
    },
    {
      question: 'How are arrays within JSON objects handled?',
      answer: 'You can choose to stringify arrays (convert to text), separate them into multiple columns, or ignore them entirely. Stringify is most common for preserving data.'
    },
    {
      question: 'What delimiters are supported?',
      answer: 'Common delimiters include comma (,), semicolon (;), tab (\\t), and pipe (|). Choose based on your target application and locale preferences.'
    },
    {
      question: 'Can I import the CSV into Excel?',
      answer: 'Yes! The generated CSV is Excel-compatible. Use semicolon delimiter for European Excel versions that expect this format by default.'
    },
    {
      question: 'How are null and undefined values handled?',
      answer: 'You can choose to leave empty cells, explicitly write "null", or skip null values entirely. Empty cells are most common for spreadsheet compatibility.'
    }
  ],
  relatedTools: [
    'csv-to-json',
    'json-formatter',
    'csv-formatter',
    'data-format-transformer',
    'json-path-extractor'
  ]
};

export function convertJsonToCsv(input: string, config: JsonToCsvConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide JSON data to convert to CSV.'
    };
  }

  try {
    // Parse the JSON input
    const jsonData = JSON.parse(input.trim());

    // Handle different JSON structures
    let dataArray: any[];
    
    if (Array.isArray(jsonData)) {
      dataArray = jsonData;
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      // If it's a single object, wrap it in an array
      dataArray = [jsonData];
    } else {
      return {
        success: false,
        error: 'JSON must be an array of objects or a single object to convert to CSV.'
      };
    }

    if (dataArray.length === 0) {
      return {
        success: false,
        error: 'JSON array is empty. Cannot generate CSV from empty data.'
      };
    }

    // Flatten objects if requested
    if (config.flattenObjects) {
      dataArray = dataArray.map(item => flattenObject(item));
    }

    // Get all unique keys from all objects
    const allKeys = new Set<string>();
    dataArray.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    const headers = Array.from(allKeys).sort();

    if (headers.length === 0) {
      return {
        success: false,
        error: 'No valid object properties found to convert to CSV columns.'
      };
    }

    // Generate CSV content
    let csvContent = '';

    // Add headers if requested
    if (config.includeHeaders) {
      csvContent += headers.map(header => escapeValue(header, config)).join(config.delimiter) + '\n';
    }

    // Process each row
    dataArray.forEach(item => {
      const row = headers.map(header => {
        let value = item && typeof item === 'object' ? item[header] : '';
        return processValue(value, config);
      });
      csvContent += row.join(config.delimiter) + '\n';
    });

    // Remove trailing newline
    csvContent = csvContent.slice(0, -1);

    return {
      success: true,
      output: csvContent,
      metadata: {
        rows: dataArray.length,
        columns: headers.length,
        headers: headers,
        size: csvContent.length,
        delimiter: config.delimiter,
        hasHeaders: config.includeHeaders,
        flattened: config.flattenObjects
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to convert JSON to CSV';
    
    // Provide helpful error messages
    if (errorMessage.includes('Unexpected token')) {
      return {
        success: false,
        error: `Invalid JSON format: ${errorMessage}\n\nPlease check your JSON syntax - ensure proper quotes, brackets, and commas.`
      };
    }
    
    return {
      success: false,
      error: `Conversion failed: ${errorMessage}`
    };
  }
}

function flattenObject(obj: any, prefix: string = ''): any {
  const flattened: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
  }
  
  return flattened;
}

function processValue(value: any, config: JsonToCsvConfig): string {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    switch (config.nullHandling) {
      case 'null':
        return 'null';
      case 'skip':
      case 'empty':
      default:
        return '';
    }
  }

  // Handle arrays
  if (Array.isArray(value)) {
    switch (config.arrayHandling) {
      case 'stringify':
        return escapeValue(JSON.stringify(value), config);
      case 'separate':
        return escapeValue(value.join(' | '), config);
      case 'ignore':
      default:
        return '';
    }
  }

  // Handle objects (should be rare if flattening is enabled)
  if (typeof value === 'object') {
    return escapeValue(JSON.stringify(value), config);
  }

  // Convert to string and escape
  return escapeValue(String(value), config);
}

function escapeValue(value: string, config: JsonToCsvConfig): string {
  if (!value && value !== '0') return '';

  let escaped = value;

  // Always wrap values containing delimiter, newlines, or quotes
  const needsQuoting = (
    escaped.includes(config.delimiter) ||
    escaped.includes('\n') ||
    escaped.includes('\r') ||
    escaped.includes('"')
  );

  if (config.escapeQuotes || needsQuoting) {
    // Escape existing quotes by doubling them
    escaped = escaped.replace(/"/g, '""');
    // Wrap in quotes
    escaped = `"${escaped}"`;
  }

  return escaped;
}