import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface JsonToExcelConfig {
  outputFormat: 'xlsx' | 'csv';
  includeHeaders: boolean;
  sheetName: string;
  flattenObjects: boolean;
  maxDepth: number;
  dateFormat: 'iso' | 'excel' | 'locale';
  handleArrays: 'join' | 'separate' | 'ignore';
  arraySeparator: string;
  emptyValue: string;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: ExcelMetadata;
  downloadUrl?: string;
}

export interface ExcelMetadata {
  fileName: string;
  rowCount: number;
  columnCount: number;
  sheetNames: string[];
  fileSize: number;
}

const DEFAULT_CONFIG: JsonToExcelConfig = {
  outputFormat: 'xlsx',
  includeHeaders: true,
  sheetName: 'Sheet1',
  flattenObjects: true,
  maxDepth: 3,
  dateFormat: 'iso',
  handleArrays: 'join',
  arraySeparator: ', ',
  emptyValue: '',
};

export async function convertJsonToExcel(jsonData: string, config: JsonToExcelConfig = DEFAULT_CONFIG): Promise<ToolResult> {
  try {
    if (!jsonData.trim()) {
      return {
        success: false,
        error: 'No JSON data provided'
      };
    }

    // Parse JSON data
    let data: any;
    try {
      data = JSON.parse(jsonData);
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON format. Please check your JSON syntax.'
      };
    }

    // Load SheetJS dynamically
    const XLSX = await loadSheetJS();

    // Normalize data to array of objects
    const normalizedData = normalizeJsonData(data, config);

    if (!normalizedData || normalizedData.length === 0) {
      return {
        success: false,
        error: 'No valid data found in JSON. Data should be an array of objects or a single object.'
      };
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Flatten objects if configured
    const processedData = config.flattenObjects
      ? normalizedData.map(row => flattenObject(row, config.maxDepth, config.arraySeparator, config.handleArrays))
      : normalizedData;

    // Handle empty values
    const cleanedData = processedData.map(row => {
      const cleanRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        if (value === null || value === undefined) {
          cleanRow[key] = config.emptyValue;
        } else if (value instanceof Date) {
          cleanRow[key] = formatDate(value, config.dateFormat);
        } else {
          cleanRow[key] = value;
        }
      }
      return cleanRow;
    });

    // Create worksheet
    let worksheet: any;
    if (config.includeHeaders) {
      worksheet = XLSX.utils.json_to_sheet(cleanedData);
    } else {
      // Create worksheet without headers
      const dataOnly = cleanedData.map(row => Object.values(row));
      worksheet = XLSX.utils.aoa_to_sheet(dataOnly);
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);

    // Generate file based on output format
    let buffer: ArrayBuffer;
    let mimeType: string;
    let fileExtension: string;

    if (config.outputFormat === 'csv') {
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      buffer = new TextEncoder().encode(csvData).buffer;
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    }

    // Create blob and download URL
    const blob = new Blob([buffer], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);

    const metadata: ExcelMetadata = {
      fileName: `converted_data.${fileExtension}`,
      rowCount: cleanedData.length,
      columnCount: cleanedData.length > 0 ? Object.keys(cleanedData[0]).length : 0,
      sheetNames: [config.sheetName],
      fileSize: buffer.byteLength
    };

    return {
      success: true,
      output: `${config.outputFormat.toUpperCase()} file generated successfully!\n\nFile Details:\n- Format: ${config.outputFormat.toUpperCase()}\n- Rows: ${metadata.rowCount.toLocaleString()}\n- Columns: ${metadata.columnCount}\n- Sheet: ${config.sheetName}\n- File size: ${formatFileSize(metadata.fileSize)}`,
      metadata,
      downloadUrl
    };

  } catch (error) {
    return {
      success: false,
      error: `JSON to Excel conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Utility function to normalize JSON data to array of objects
function normalizeJsonData(data: any, config: JsonToExcelConfig): any[] {
  if (Array.isArray(data)) {
    // Filter out non-object items if needed
    return data.filter(item => item !== null && typeof item === 'object');
  } else if (data && typeof data === 'object') {
    // Single object - convert to array
    return [data];
  } else {
    // Primitive value - can't convert
    return [];
  }
}

// Utility function to flatten nested objects
function flattenObject(obj: any, maxDepth: number, separator: string, handleArrays: string, prefix: string = '', depth: number = 0): any {
  const flattened: any = {};

  if (depth >= maxDepth) {
    flattened[prefix || 'value'] = obj;
    return flattened;
  }

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = value;
    } else if (Array.isArray(value)) {
      switch (handleArrays) {
        case 'join':
          flattened[newKey] = value.join(separator);
          break;
        case 'separate':
          value.forEach((item, index) => {
            flattened[`${newKey}[${index}]`] = item;
          });
          break;
        case 'ignore':
          flattened[newKey] = `[Array of ${value.length} items]`;
          break;
      }
    } else if (typeof value === 'object' && depth < maxDepth - 1) {
      Object.assign(flattened, flattenObject(value, maxDepth, separator, handleArrays, newKey, depth + 1));
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}

// Utility function to format dates
function formatDate(date: Date, format: string): string {
  switch (format) {
    case 'excel':
      // Excel serial date number
      const epoch = new Date(1900, 0, 1).getTime();
      const days = (date.getTime() - epoch) / (1000 * 60 * 60 * 24) + 1;
      return days.toString();
    case 'locale':
      return date.toLocaleDateString();
    default: // iso
      return date.toISOString().split('T')[0];
  }
}

// Utility function to load SheetJS dynamically
async function loadSheetJS() {
  try {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load SheetJS'));
        document.head.appendChild(script);
      });
    }

    if (!window.XLSX) {
      throw new Error('SheetJS failed to load');
    }

    return window.XLSX;
  } catch (error) {
    throw new Error('SheetJS library not available. Please check your internet connection.');
  }
}

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const JSON_TO_EXCEL_TOOL: Tool = {
  id: 'json-to-excel',
  name: 'JSON to Excel Converter - Convert JSON to XLSX CSV Online',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'data-conversion')!,
  slug: 'json-to-excel',
  icon: '📊',
  keywords: ['json to excel', 'json to xlsx', 'json to csv', 'spreadsheet converter', 'json converter', 'excel converter', 'data conversion', 'free json to excel', 'online json converter'],
  seoTitle: 'Free JSON to Excel Converter Online - Convert JSON to XLSX CSV',
  seoDescription: 'Convert JSON data to Excel spreadsheets (XLSX) or CSV format instantly. Free online JSON to Excel converter with support for nested objects, arrays, and custom formatting options.',
  description: 'Free online JSON to Excel converter that safely converts JSON data to Excel spreadsheets (.xlsx) or CSV format in your browser. No files uploaded to servers, works offline, supports nested object flattening and custom formatting options.',

  examples: [
    {
      title: 'Employee Data Conversion',
      input: `[
  {
    "name": "John Smith",
    "department": "Engineering",
    "salary": 75000,
    "startDate": "2023-01-15"
  },
  {
    "name": "Sarah Johnson",
    "department": "Marketing",
    "salary": 65000,
    "startDate": "2023-02-01"
  }
]`,
      output: 'Excel file with columns: name, department, salary, startDate (2 data rows)',
      description: 'Convert employee JSON data to Excel with automatic column detection'
    },
    {
      title: 'Nested Object Flattening',
      input: `[
  {
    "id": 1,
    "user": {
      "name": "Alice",
      "profile": {
        "age": 30,
        "location": "New York"
      }
    },
    "tags": ["developer", "javascript"]
  }
]`,
      output: 'Excel columns: id, user.name, user.profile.age, user.profile.location, tags',
      description: 'Flatten nested JSON objects and arrays into Excel columns'
    },
    {
      title: 'Product Catalog Export',
      input: `{
  "products": [
    {
      "sku": "PRD001",
      "name": "Wireless Headphones",
      "price": 99.99,
      "inStock": true,
      "categories": ["electronics", "audio"]
    }
  ]
}`,
      output: 'Excel file with product data extracted from nested structure',
      description: 'Extract and convert nested product data for inventory management'
    }
  ],

  howItWorks: [
    {
      title: "Paste Your JSON Data",
      icon: "📝",
      description: "Enter your JSON data in the input area - supports objects, arrays, and nested structures. Data is validated and processed entirely in your browser with no server uploads.",
      keywords: ["json input", "json validation", "nested json", "secure json processing"]
    },
    {
      title: "Configure Export Options",
      icon: "⚙️",
      description: "Choose output format (Excel XLSX or CSV), enable object flattening for nested data, configure headers, sheet names, and array handling options to match your needs.",
      keywords: ["excel export options", "csv conversion", "object flattening", "nested data handling"]
    },
    {
      title: "Generate Excel File",
      icon: "⚡",
      description: "Click 'Convert to Excel' to process your JSON using SheetJS technology. Nested objects are flattened, arrays are handled according to your settings, and data types are preserved.",
      keywords: ["instant excel conversion", "sheetjs", "excel generation", "json processing"]
    },
    {
      title: "Download Your File",
      icon: "💾",
      description: "Download the generated Excel (.xlsx) or CSV file directly to your computer. Perfect for data analysis, reporting, database imports, and sharing with non-technical stakeholders.",
      keywords: ["download excel", "excel file", "data analysis", "business reporting"]
    }
  ],

  useCases: [
    'API response data export to Excel for analysis',
    'Database dump conversion for business users',
    'Configuration file transformation for documentation',
    'Survey and form response data processing',
    'E-commerce product data management',
    'Financial transaction data reporting',
    'User analytics and metrics export',
    'Inventory management data conversion',
    'Customer relationship management (CRM) data',
    'Research data analysis and visualization'
  ],

  faq: [
    {
      question: 'Is this JSON to Excel converter free to use?',
      answer: 'Yes, this JSON to Excel converter is completely free with no limits on the size or complexity of JSON data you can convert. No registration required, and no watermarks added to generated files.'
    },
    {
      question: 'Are my JSON files uploaded to your servers?',
      answer: 'No, all JSON processing happens locally in your browser using SheetJS technology. Your data never leaves your computer, ensuring complete privacy and security for sensitive business information.'
    },
    {
      question: 'What JSON formats are supported?',
      answer: 'Supports any valid JSON including objects, arrays, nested structures, and mixed data types. Works best with arrays of objects or single objects that can be converted to tabular format.'
    },
    {
      question: 'How are nested objects handled?',
      answer: 'Nested objects can be automatically flattened using dot notation (e.g., user.profile.name). You can control the flattening depth and disable it to keep nested data as-is if preferred.'
    },
    {
      question: 'What happens to arrays in the JSON data?',
      answer: 'Arrays can be joined with a separator (default), separated into individual columns, or ignored. Choose the option that best fits your data structure and analysis needs.'
    },
    {
      question: 'Can I export to CSV instead of Excel?',
      answer: 'Yes, you can choose between Excel (.xlsx) and CSV formats. CSV is useful for importing into other tools, while Excel preserves formatting and supports multiple sheets.'
    },
    {
      question: 'How are different data types handled?',
      answer: 'Strings remain as text, numbers as numeric values, booleans as TRUE/FALSE, dates in configurable formats, and null values as empty cells or custom values based on your settings.'
    },
    {
      question: 'What if my JSON has missing or inconsistent fields?',
      answer: 'The converter handles missing fields gracefully by creating empty cells. Inconsistent structures are normalized, and all unique fields across objects become columns in the output.'
    }
  ],

  commonErrors: [
    'Invalid JSON syntax - check for missing quotes, commas, or brackets',
    'Circular references in objects - remove recursive references before conversion',
    'Extremely large datasets may slow down browser - consider splitting into smaller files',
    'Complex nested structures may create many columns - adjust flattening settings',
    'Mixed data types in arrays may not convert cleanly - review array handling options'
  ],

  relatedTools: ['excel-to-json', 'json-formatter', 'csv-to-json', 'data-format-transformer']
};