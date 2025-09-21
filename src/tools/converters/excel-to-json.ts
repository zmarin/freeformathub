import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ExcelToJsonConfig {
  includeEmptyRows: boolean;
  includeEmptyColumns: boolean;
  trimWhitespace: boolean;
  firstRowAsHeader: boolean;
  sheetSelection: 'all' | 'first' | 'specific';
  specificSheetName?: string;
  outputFormat: 'array' | 'object' | 'nested';
  dateFormat: 'iso' | 'original' | 'timestamp';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: ExcelMetadata;
}

export interface ExcelMetadata {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet?: string;
  rowCount: number;
  columnCount: number;
  hasHeaders: boolean;
}

const DEFAULT_CONFIG: ExcelToJsonConfig = {
  includeEmptyRows: false,
  includeEmptyColumns: false,
  trimWhitespace: true,
  firstRowAsHeader: true,
  sheetSelection: 'first',
  outputFormat: 'object',
  dateFormat: 'iso',
};

export async function convertExcelToJson(file: File, config: ExcelToJsonConfig = DEFAULT_CONFIG): Promise<ToolResult> {
  try {
    if (!file) {
      return {
        success: false,
        error: 'No Excel file provided'
      };
    }

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.oasis.opendocument.spreadsheet' // .ods
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|ods)$/i)) {
      return {
        success: false,
        error: 'File must be an Excel file (.xlsx, .xls) or OpenDocument Spreadsheet (.ods)'
      };
    }

    // Check file size (limit to 25MB for client-side processing)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `Excel file too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Load SheetJS dynamically
    const XLSX = await loadSheetJS();

    // Read the file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      cellStyles: false
    });

    const metadata: ExcelMetadata = {
      fileName: file.name,
      fileSize: file.size,
      sheetNames: workbook.SheetNames,
      rowCount: 0,
      columnCount: 0,
      hasHeaders: config.firstRowAsHeader
    };

    // Determine which sheet(s) to process
    let sheetsToProcess: string[] = [];

    switch (config.sheetSelection) {
      case 'all':
        sheetsToProcess = workbook.SheetNames;
        break;
      case 'first':
        sheetsToProcess = workbook.SheetNames.slice(0, 1);
        break;
      case 'specific':
        if (config.specificSheetName && workbook.SheetNames.includes(config.specificSheetName)) {
          sheetsToProcess = [config.specificSheetName];
        } else {
          return {
            success: false,
            error: `Sheet "${config.specificSheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`
          };
        }
        break;
    }

    const results: any = {};

    for (const sheetName of sheetsToProcess) {
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) continue;

      // Convert sheet to JSON
      let jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        header: config.firstRowAsHeader ? 1 : undefined,
        defval: config.includeEmptyColumns ? '' : undefined,
        blankrows: config.includeEmptyRows,
        raw: false,
        dateNF: config.dateFormat === 'iso' ? 'yyyy-mm-dd' : undefined
      });

      // Process the data based on configuration
      if (config.trimWhitespace) {
        jsonData = jsonData.map(row => {
          const cleanRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            cleanRow[typeof key === 'string' ? key.trim() : key] =
              typeof value === 'string' ? value.trim() : value;
          }
          return cleanRow;
        });
      }

      // Handle date formatting
      if (config.dateFormat === 'timestamp') {
        jsonData = jsonData.map(row => {
          const convertedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            if (value instanceof Date) {
              convertedRow[key] = value.getTime();
            } else {
              convertedRow[key] = value;
            }
          }
          return convertedRow;
        });
      }

      // Filter empty rows if not included
      if (!config.includeEmptyRows) {
        jsonData = jsonData.filter(row => {
          return Object.values(row).some(value =>
            value !== null && value !== undefined && value !== ''
          );
        });
      }

      // Update metadata
      if (jsonData.length > 0) {
        metadata.rowCount = Math.max(metadata.rowCount, jsonData.length);
        metadata.columnCount = Math.max(metadata.columnCount, Object.keys(jsonData[0]).length);
      }

      // Store results based on output format
      switch (config.outputFormat) {
        case 'array':
          if (sheetsToProcess.length === 1) {
            results.data = jsonData;
          } else {
            results[sheetName] = jsonData;
          }
          break;
        case 'nested':
          results[sheetName] = {
            metadata: {
              sheetName,
              rowCount: jsonData.length,
              columnCount: jsonData.length > 0 ? Object.keys(jsonData[0]).length : 0
            },
            data: jsonData
          };
          break;
        default: // object
          if (sheetsToProcess.length === 1) {
            Object.assign(results, { data: jsonData });
          } else {
            results[sheetName] = jsonData;
          }
          break;
      }
    }

    // Set selected sheet for metadata
    if (sheetsToProcess.length === 1) {
      metadata.selectedSheet = sheetsToProcess[0];
    }

    // Format final output
    let formattedOutput = '';

    if (config.outputFormat === 'nested' || sheetsToProcess.length > 1) {
      formattedOutput = JSON.stringify({
        metadata: {
          fileName: metadata.fileName,
          convertedAt: new Date().toISOString(),
          totalSheets: sheetsToProcess.length,
          configuration: config
        },
        sheets: results
      }, null, 2);
    } else {
      formattedOutput = JSON.stringify(results.data || results, null, 2);
    }

    if (!formattedOutput || formattedOutput === '[]' || formattedOutput === '{}') {
      return {
        success: true,
        output: 'No data found in the Excel file. The file might be empty or contain only formatting.',
        metadata
      };
    }

    return {
      success: true,
      output: formattedOutput,
      metadata
    };

  } catch (error) {
    return {
      success: false,
      error: `Excel to JSON conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Utility function to load SheetJS dynamically
async function loadSheetJS() {
  try {
    // Try to load from CDN
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

export const EXCEL_TO_JSON_TOOL: Tool = {
  id: 'excel-to-json',
  name: 'Excel to JSON Converter - Convert XLSX XLS to JSON Online',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'data-conversion')!,
  slug: 'excel-to-json',
  icon: '📊',
  keywords: ['excel to json', 'xlsx to json', 'xls to json', 'spreadsheet converter', 'excel converter', 'json converter', 'data conversion', 'free excel to json', 'online excel converter'],
  seoTitle: 'Free Excel to JSON Converter Online - Convert XLSX XLS to JSON',
  seoDescription: 'Convert Excel spreadsheets (XLSX, XLS) to JSON format instantly. Free online Excel to JSON converter with support for multiple sheets, headers, and custom formatting options.',
  description: 'Free online Excel to JSON converter that safely converts Excel spreadsheets (.xlsx, .xls) to JSON format in your browser. No files uploaded to servers, works offline, supports multiple sheets and custom formatting options.',

  examples: [
    {
      title: 'Employee Data Conversion',
      input: 'employees.xlsx (3 columns: Name, Department, Salary)',
      output: `[
  {
    "Name": "John Smith",
    "Department": "Engineering",
    "Salary": 75000
  },
  {
    "Name": "Sarah Johnson",
    "Department": "Marketing",
    "Salary": 65000
  },
  {
    "Name": "Mike Wilson",
    "Department": "Sales",
    "Salary": 70000
  }
]`,
      description: 'Convert employee data from Excel to JSON with automatic header detection'
    },
    {
      title: 'Multi-Sheet Workbook',
      input: 'quarterly-report.xlsx (3 sheets: Q1, Q2, Q3)',
      output: `{
  "metadata": {
    "fileName": "quarterly-report.xlsx",
    "convertedAt": "2024-01-20T15:30:00Z",
    "totalSheets": 3
  },
  "sheets": {
    "Q1": [
      {"Month": "January", "Revenue": 50000, "Expenses": 30000},
      {"Month": "February", "Revenue": 55000, "Expenses": 32000}
    ],
    "Q2": [
      {"Month": "April", "Revenue": 60000, "Expenses": 35000}
    ]
  }
}`,
      description: 'Convert multi-sheet Excel workbooks with metadata preservation'
    },
    {
      title: 'Product Inventory Export',
      input: 'inventory.xlsx (Product ID, Name, Quantity, Price)',
      output: `[
  {
    "Product ID": "SKU001",
    "Name": "Wireless Headphones",
    "Quantity": 150,
    "Price": 99.99
  },
  {
    "Product ID": "SKU002",
    "Name": "Bluetooth Speaker",
    "Quantity": 75,
    "Price": 149.99
  }
]`,
      description: 'Convert product inventory data for API integration'
    }
  ],

  howItWorks: [
    {
      title: "Upload Your Excel File",
      icon: "📁",
      description: "Select an Excel file (.xlsx, .xls) or OpenDocument Spreadsheet (.ods) from your computer (up to 25MB). The file is processed entirely in your browser - no upload to servers required.",
      keywords: ["upload excel", "excel file input", "xlsx converter", "secure excel processing"]
    },
    {
      title: "Configure Conversion Options",
      icon: "⚙️",
      description: "Choose conversion settings: include/exclude empty rows and columns, use first row as headers, select specific sheets, and pick output format (array, object, or nested with metadata).",
      keywords: ["excel conversion options", "json formatting", "sheet selection", "header detection"]
    },
    {
      title: "Convert to JSON Instantly",
      icon: "⚡",
      description: "Click 'Convert to JSON' to process your Excel file using SheetJS technology. Data is converted with type preservation, date formatting, and whitespace trimming as configured.",
      keywords: ["instant excel conversion", "sheetjs", "json conversion", "excel processing"]
    },
    {
      title: "Download or Copy Results",
      icon: "💾",
      description: "Copy JSON data to clipboard or download as a .json file. Perfect for API development, data migration, database imports, and web application integration.",
      keywords: ["download json", "copy json data", "api integration", "data migration"]
    }
  ],

  useCases: [
    'API development and testing with Excel data',
    'Database migration from spreadsheets to NoSQL',
    'Web application data import from Excel files',
    'Business reporting automation and data pipeline',
    'E-commerce product catalog conversion',
    'Financial data processing and analysis',
    'Customer data migration and CRM integration',
    'Inventory management system data import',
    'Survey and form response data processing',
    'Academic research data conversion and analysis'
  ],

  faq: [
    {
      question: 'Is this Excel to JSON converter free to use?',
      answer: 'Yes, this Excel to JSON converter is completely free with no limits on the number of files you can convert. No registration required, and no watermarks added to converted data.'
    },
    {
      question: 'Are my Excel files uploaded to your servers?',
      answer: 'No, all Excel processing happens locally in your browser using SheetJS technology. Your files never leave your computer, ensuring complete privacy and security for sensitive business data.'
    },
    {
      question: 'What Excel file formats are supported?',
      answer: 'Supports Excel files (.xlsx, .xls) and OpenDocument Spreadsheets (.ods). Maximum file size is 25MB to ensure optimal browser performance during conversion.'
    },
    {
      question: 'Can I convert multiple sheets from one Excel file?',
      answer: 'Yes, you can convert all sheets, just the first sheet, or a specific sheet by name. Multi-sheet conversions include metadata about each sheet and its structure.'
    },
    {
      question: 'How are Excel data types handled in JSON?',
      answer: 'Numbers remain as numbers, text as strings, dates can be converted to ISO format or timestamps, and formulas are converted to their calculated values. Empty cells can be included or excluded based on your settings.'
    },
    {
      question: 'What if my Excel file has merged cells or complex formatting?',
      answer: 'The converter focuses on data extraction and may not preserve complex formatting or merged cell structures. It works best with tabular data where each row represents a record.'
    },
    {
      question: 'Can I use the first row as column headers?',
      answer: 'Yes, you can enable "First row as headers" to use the first row values as JSON object keys. If disabled, columns will be named automatically (A, B, C, etc.).'
    },
    {
      question: 'What output formats are available?',
      answer: 'Choose from Array (simple JSON array), Object (JSON objects with headers), or Nested (includes metadata about sheets, rows, and conversion settings). Pick the format that best fits your use case.'
    }
  ],

  commonErrors: [
    'Excel file is password protected - remove password protection first',
    'File contains only formatting without data - ensure there is actual data to convert',
    'Complex formulas may not convert correctly - consider using calculated values',
    'Large files may slow down browser - try splitting into smaller files',
    'Merged cells can cause data alignment issues - unmerge cells for best results'
  ],

  relatedTools: ['json-to-excel', 'csv-to-json', 'json-formatter', 'data-format-transformer']
};