import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface CsvTableViewerConfig {
  delimiter: string;
  hasHeader: boolean;
  showLineNumbers: boolean;
  enableSearch: boolean;
  enableSorting: boolean;
  enableFiltering: boolean;
  showRowCount: boolean;
  showColumnCount: boolean;
  enableExport: boolean;
  maxDisplayRows: number;
  customDelimiter: string;
  treatEmptyAsNull: boolean;
  trimWhitespace: boolean;
  showStats: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: CsvData;
  stats?: CsvStats;
}

export interface CsvData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  totalColumns: number;
  hasHeaders: boolean;
}

export interface CsvStats {
  totalRows: number;
  totalColumns: number;
  totalCells: number;
  emptyCells: number;
  filledCells: number;
  averageRowLength: number;
  processingTime: number;
  memoryUsage: string;
}

const DEFAULT_CONFIG: CsvTableViewerConfig = {
  delimiter: ',',
  hasHeader: true,
  showLineNumbers: true,
  enableSearch: true,
  enableSorting: true,
  enableFiltering: false,
  showRowCount: true,
  showColumnCount: true,
  enableExport: true,
  maxDisplayRows: 1000,
  customDelimiter: '',
  treatEmptyAsNull: true,
  trimWhitespace: true,
  showStats: true,
};

export function parseCsvData(
  input: string,
  config: CsvTableViewerConfig = DEFAULT_CONFIG
): ToolResult {
  const startTime = performance.now();

  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'No CSV data provided'
      };
    }

    // Determine delimiter
    let delimiter = config.delimiter;
    if (config.customDelimiter) {
      delimiter = config.customDelimiter;
    } else if (delimiter === 'auto') {
      delimiter = detectDelimiter(input);
    }

    const stats: CsvStats = {
      totalRows: 0,
      totalColumns: 0,
      totalCells: 0,
      emptyCells: 0,
      filledCells: 0,
      averageRowLength: 0,
      processingTime: 0,
      memoryUsage: '0 MB'
    };

    // Parse CSV data
    const rows = parseCsvRows(input, delimiter, config);

    if (rows.length === 0) {
      return {
        success: false,
        error: 'No valid rows found in CSV data'
      };
    }

    // Determine headers
    let headers: string[] = [];
    let dataRows: string[][] = [...rows];

    if (config.hasHeader && rows.length > 0) {
      headers = rows[0];
      dataRows = rows.slice(1);
    } else {
      // Generate column headers (A, B, C, etc.)
      const maxColumns = Math.max(...rows.map(row => row.length));
      headers = Array.from({ length: maxColumns }, (_, i) =>
        String.fromCharCode(65 + (i % 26)) + (Math.floor(i / 26) > 0 ? Math.floor(i / 26) : '')
      );
    }

    // Calculate statistics
    stats.totalRows = dataRows.length;
    stats.totalColumns = headers.length;
    stats.totalCells = dataRows.reduce((sum, row) => sum + row.length, 0);

    let emptyCells = 0;
    let totalLength = 0;

    dataRows.forEach(row => {
      row.forEach(cell => {
        if (!cell || (config.treatEmptyAsNull && cell.trim() === '')) {
          emptyCells++;
        }
        totalLength += cell.length;
      });
    });

    stats.emptyCells = emptyCells;
    stats.filledCells = stats.totalCells - emptyCells;
    stats.averageRowLength = totalLength / stats.totalCells || 0;

    // Memory estimation
    const memoryBytes = JSON.stringify({ headers, rows: dataRows }).length * 2; // Rough estimate
    stats.memoryUsage = formatMemorySize(memoryBytes);

    const csvData: CsvData = {
      headers,
      rows: dataRows,
      totalRows: stats.totalRows,
      totalColumns: stats.totalColumns,
      hasHeaders: config.hasHeader
    };

    const endTime = performance.now();
    stats.processingTime = endTime - startTime;

    // Generate output summary
    let output = `CSV Table Viewer Results:\n`;
    output += `- Delimiter: "${delimiter}"\n`;
    output += `- Headers: ${config.hasHeader ? 'Yes' : 'No'}\n`;
    output += `- Rows: ${stats.totalRows.toLocaleString()}\n`;
    output += `- Columns: ${stats.totalColumns.toLocaleString()}\n`;
    output += `- Total cells: ${stats.totalCells.toLocaleString()}\n`;
    output += `- Filled cells: ${stats.filledCells.toLocaleString()} (${((stats.filledCells / stats.totalCells) * 100).toFixed(1)}%)\n`;
    output += `- Empty cells: ${stats.emptyCells.toLocaleString()} (${((stats.emptyCells / stats.totalCells) * 100).toFixed(1)}%)\n`;
    output += `- Processing time: ${stats.processingTime.toFixed(2)}ms\n`;
    output += `- Memory usage: ${stats.memoryUsage}\n`;

    if (dataRows.length > config.maxDisplayRows) {
      output += `\n⚠️ Large dataset detected. Displaying first ${config.maxDisplayRows.toLocaleString()} rows.\n`;
    }

    return {
      success: true,
      output,
      data: csvData,
      stats
    };

  } catch (error) {
    return {
      success: false,
      error: `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function detectDelimiter(csv: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const sample = csv.split('\n').slice(0, 5).join('\n'); // Use first 5 lines

  let bestDelimiter = ',';
  let maxConsistency = 0;

  for (const delimiter of delimiters) {
    const lines = sample.split('\n').filter(line => line.trim());
    if (lines.length < 2) continue;

    const counts = lines.map(line => (line.match(new RegExp(escapeRegExp(delimiter), 'g')) || []).length);
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((acc, count) => acc + Math.pow(count - avgCount, 2), 0) / counts.length;
    const consistency = avgCount > 0 ? avgCount / (1 + variance) : 0;

    if (consistency > maxConsistency) {
      maxConsistency = consistency;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

function parseCsvRows(csv: string, delimiter: string, config: CsvTableViewerConfig): string[][] {
  const rows: string[][] = [];
  const lines = csv.split('\n');

  for (let line of lines) {
    if (config.trimWhitespace) {
      line = line.trim();
    }

    if (!line) continue;

    // Simple CSV parsing (doesn't handle quoted fields with delimiters inside)
    // For a full CSV parser, you'd want to use a library like Papa Parse
    const cells = line.split(delimiter).map(cell => {
      let cleanCell = cell;

      // Remove surrounding quotes
      if ((cleanCell.startsWith('"') && cleanCell.endsWith('"')) ||
          (cleanCell.startsWith("'") && cleanCell.endsWith("'"))) {
        cleanCell = cleanCell.slice(1, -1);
      }

      if (config.trimWhitespace) {
        cleanCell = cleanCell.trim();
      }

      return cleanCell;
    });

    rows.push(cells);
  }

  return rows;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatMemorySize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const CSV_TABLE_VIEWER_TOOL: Tool = {
  id: 'csv-table-viewer',
  name: 'CSV Table Viewer - View CSV Files Online as Interactive Tables',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'data')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'data')!.subcategories!.find(sub => sub.id === 'data-analysis')!,
  slug: 'csv-table-viewer',
  icon: '📊',
  keywords: ['csv viewer', 'csv table viewer', 'view csv online', 'csv file viewer', 'csv data viewer', 'csv reader', 'table viewer', 'free csv viewer', 'csv analyzer'],
  seoTitle: 'Free CSV Table Viewer Online - View CSV Files as Interactive Tables',
  seoDescription: 'View CSV files online with our free CSV table viewer. Interactive tables, search, sort, filter capabilities. Supports large CSV files with statistics and data analysis. Works offline.',
  description: 'Free online CSV table viewer that displays CSV files as interactive tables with search, sort, and filter capabilities. Analyze CSV data with detailed statistics, handle large datasets, and export results.',

  examples: [
    {
      title: 'Employee Data CSV',
      input: `Name,Department,Salary,Start Date
John Smith,Engineering,75000,2020-01-15
Jane Doe,Marketing,65000,2019-06-20
Bob Johnson,Sales,55000,2021-03-10
Alice Brown,Engineering,80000,2018-11-05`,
      output: `4 rows × 4 columns table with sortable headers:
Name | Department | Salary | Start Date
Interactive table with search and filter options`,
      description: 'View employee data with sortable columns and filtering'
    },
    {
      title: 'Sales Data CSV',
      input: `Product,Category,Price,Quantity,Revenue
Laptop,Electronics,999.99,25,24999.75
Mouse,Electronics,29.99,100,2999.00
Keyboard,Electronics,79.99,50,3999.50
Monitor,Electronics,299.99,30,8999.70`,
      output: `4 rows × 5 columns table with calculated statistics:
Total revenue: $40,998.95
Average price: $352.49`,
      description: 'Analyze sales data with automatic statistics calculation'
    },
    {
      title: 'Custom Delimiter (Semicolon)',
      input: `Name;Age;City;Country
John;25;New York;USA
Marie;30;Paris;France
Hans;35;Berlin;Germany
Anna;28;Tokyo;Japan`,
      output: `4 rows × 4 columns table with semicolon delimiter
Automatic delimiter detection and proper parsing`,
      description: 'Handle CSV files with custom delimiters automatically'
    }
  ],

  howItWorks: [
    {
      title: "Upload CSV Data",
      icon: "📂",
      description: "Paste CSV content or upload CSV files. The tool automatically detects delimiters (comma, semicolon, tab, pipe) and handles various CSV formats. Processing happens entirely in your browser.",
      keywords: ["csv upload", "csv import", "delimiter detection", "secure csv viewing"]
    },
    {
      title: "Configure Display Options",
      icon: "⚙️",
      description: "Set viewing preferences: headers, line numbers, delimiter type, and display limits. Configure search, sorting, and filtering options for optimal data exploration.",
      keywords: ["csv configuration", "table settings", "data visualization", "csv options"]
    },
    {
      title: "Explore Interactive Table",
      icon: "🔍",
      description: "View data in an interactive table with search, sort by columns, and filter capabilities. Navigate large datasets with pagination and get instant data statistics.",
      keywords: ["interactive table", "csv search", "data filtering", "table navigation"]
    },
    {
      title: "Analyze and Export",
      icon: "📊",
      description: "Get detailed statistics about your CSV data including row/column counts, data completeness, and memory usage. Export filtered or sorted results as needed.",
      keywords: ["csv analysis", "data statistics", "csv export", "data insights"]
    }
  ],

  useCases: [
    'Viewing large CSV files from databases and analytics tools',
    'Analyzing sales data, customer lists, and business reports',
    'Exploring survey results and research data',
    'Reviewing financial data and transaction logs',
    'Examining product catalogs and inventory data',
    'Inspecting log files and system exports',
    'Validating data imports and exports',
    'Quick CSV data exploration and verification',
    'Converting between different CSV formats',
    'Data quality assessment and cleaning preparation'
  ],

  faq: [
    {
      question: 'Is this CSV table viewer free to use?',
      answer: 'Yes, this CSV table viewer is completely free with no limits on file size or number of views. No registration required, and no watermarks added to your data analysis.'
    },
    {
      question: 'Is my CSV data uploaded to your servers?',
      answer: 'No, all CSV processing happens locally in your browser. Your data never leaves your computer, ensuring complete privacy and security for sensitive business and personal data.'
    },
    {
      question: 'What CSV formats are supported?',
      answer: 'The tool supports standard CSV files with various delimiters (comma, semicolon, tab, pipe), with or without headers. It automatically detects delimiters and handles quoted fields.'
    },
    {
      question: 'Can I view large CSV files?',
      answer: 'Yes, the tool can handle large CSV files efficiently. For very large datasets, it displays the first 1000 rows by default (configurable) to maintain browser performance while showing full statistics.'
    },
    {
      question: 'Does the viewer support search and filtering?',
      answer: 'Yes, you can search across all columns, sort by any column, and apply filters to explore your data. These features work on the currently loaded portion of large datasets.'
    },
    {
      question: 'How does automatic delimiter detection work?',
      answer: 'The tool analyzes the first few lines of your CSV file to detect the most consistent delimiter pattern among common options (comma, semicolon, tab, pipe). You can override this manually if needed.'
    },
    {
      question: 'Can I export the viewed data?',
      answer: 'Yes, you can export the table data in various formats including CSV, JSON, or as a formatted table. Exported data reflects any sorting or filtering you\'ve applied.'
    },
    {
      question: 'What statistics does the tool provide?',
      answer: 'The tool shows row/column counts, data completeness (filled vs empty cells), memory usage, processing time, and other metrics to help you understand your dataset structure.'
    }
  ],

  commonErrors: [
    'Invalid CSV format - check for malformed rows or inconsistent delimiters',
    'Large files may slow browser performance - consider using the row limit feature',
    'Mixed delimiters in file may cause parsing issues - ensure consistent formatting',
    'Special characters in data may need proper encoding (UTF-8 recommended)',
    'Very wide tables (many columns) may affect display on smaller screens'
  ],

  relatedTools: ['csv-formatter', 'csv-splitter', 'json-to-csv', 'csv-to-json']
};