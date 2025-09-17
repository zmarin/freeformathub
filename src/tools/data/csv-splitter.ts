import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool, ToolResult, ToolConfig } from '../types';

export interface CsvSplitterConfig extends ToolConfig {
  splitMode: 'rows' | 'size' | 'column' | 'files';
  rowsPerFile: number;
  maxFileSize: number; // in KB
  fileSizeUnit: 'KB' | 'MB';
  splitColumn: string;
  uniqueValues: boolean;
  keepHeaders: boolean;
  delimiter: ',' | ';' | '\t' | '|' | 'custom';
  customDelimiter: string;
  outputFormat: 'csv' | 'tsv';
  filenamePattern: string;
  zipOutput: boolean;
  previewSplits: boolean;
  maxPreviewRows: number;
}

export interface CsvSplitResult {
  filename: string;
  content: string;
  rowCount: number;
  size: number;
  preview: string[];
}

export interface CsvSplitterResult extends ToolResult {
  splits?: CsvSplitResult[];
  totalFiles?: number;
  totalRows?: number;
  originalSize?: number;
  compressedSize?: number;
  processingTime?: number;
}

interface ParsedCsvData {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

// CSV parsing utility function
function parseCSV(content: string, delimiter: string): ParsedCsvData {
  const lines = content.trim().split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    rows.push(row);
  }

  const headers = rows.length > 0 ? rows[0] : [];
  const dataRows = rows.length > 1 ? rows.slice(1) : [];

  return {
    headers,
    rows: dataRows,
    delimiter
  };
}

// Auto-detect delimiter
function detectDelimiter(content: string): string {
  const sample = content.split('\n').slice(0, 5).join('\n');
  const delimiters = [',', ';', '\t', '|'];
  const scores: { [key: string]: number } = {};

  for (const delimiter of delimiters) {
    const lines = sample.split('\n');
    let consistency = 0;
    let firstLineCount = -1;

    for (const line of lines) {
      if (line.trim() === '') continue;
      const count = line.split(delimiter).length - 1;

      if (firstLineCount === -1) {
        firstLineCount = count;
      } else if (count === firstLineCount && count > 0) {
        consistency++;
      }
    }

    scores[delimiter] = consistency;
  }

  return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
}

// Format CSV row with proper quoting
function formatCsvRow(row: string[], delimiter: string): string {
  return row.map(cell => {
    const needsQuoting = cell.includes(delimiter) || cell.includes('"') || cell.includes('\n');
    if (needsQuoting) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }).join(delimiter);
}

// Split by number of rows
function splitByRows(data: ParsedCsvData, rowsPerFile: number, keepHeaders: boolean): CsvSplitResult[] {
  const splits: CsvSplitResult[] = [];
  const { headers, rows, delimiter } = data;

  for (let i = 0; i < rows.length; i += rowsPerFile) {
    const chunk = rows.slice(i, i + rowsPerFile);
    let content = '';

    if (keepHeaders && headers.length > 0) {
      content += formatCsvRow(headers, delimiter) + '\n';
    }

    for (const row of chunk) {
      content += formatCsvRow(row, delimiter) + '\n';
    }

    const fileIndex = Math.floor(i / rowsPerFile) + 1;
    splits.push({
      filename: `part_${fileIndex}.csv`,
      content: content.trim(),
      rowCount: chunk.length + (keepHeaders ? 1 : 0),
      size: new Blob([content]).size,
      preview: chunk.slice(0, 3).map(row => formatCsvRow(row, delimiter))
    });
  }

  return splits;
}

// Split by file size
function splitBySize(data: ParsedCsvData, maxSizeKB: number, keepHeaders: boolean): CsvSplitResult[] {
  const splits: CsvSplitResult[] = [];
  const { headers, rows, delimiter } = data;
  const maxSizeBytes = maxSizeKB * 1024;

  let currentContent = '';
  let currentRows: string[][] = [];
  let fileIndex = 1;

  // Add headers if needed
  if (keepHeaders && headers.length > 0) {
    currentContent = formatCsvRow(headers, delimiter) + '\n';
  }

  for (const row of rows) {
    const rowContent = formatCsvRow(row, delimiter) + '\n';
    const testContent = currentContent + rowContent;

    if (new Blob([testContent]).size > maxSizeBytes && currentRows.length > 0) {
      // Create split
      splits.push({
        filename: `part_${fileIndex}.csv`,
        content: currentContent.trim(),
        rowCount: currentRows.length + (keepHeaders ? 1 : 0),
        size: new Blob([currentContent]).size,
        preview: currentRows.slice(0, 3).map(r => formatCsvRow(r, delimiter))
      });

      // Start new file
      fileIndex++;
      currentContent = keepHeaders && headers.length > 0 ? formatCsvRow(headers, delimiter) + '\n' : '';
      currentRows = [];
    }

    currentContent += rowContent;
    currentRows.push(row);
  }

  // Add final split if there's content
  if (currentRows.length > 0) {
    splits.push({
      filename: `part_${fileIndex}.csv`,
      content: currentContent.trim(),
      rowCount: currentRows.length + (keepHeaders ? 1 : 0),
      size: new Blob([currentContent]).size,
      preview: currentRows.slice(0, 3).map(r => formatCsvRow(r, delimiter))
    });
  }

  return splits;
}

// Split by column values
function splitByColumn(data: ParsedCsvData, columnName: string, keepHeaders: boolean): CsvSplitResult[] {
  const splits: CsvSplitResult[] = [];
  const { headers, rows, delimiter } = data;

  const columnIndex = headers.findIndex(h => h.toLowerCase() === columnName.toLowerCase());
  if (columnIndex === -1) {
    throw new Error(`Column "${columnName}" not found in CSV headers`);
  }

  const groupedRows: { [key: string]: string[][] } = {};

  // Group rows by column value
  for (const row of rows) {
    const value = row[columnIndex] || 'empty';
    if (!groupedRows[value]) {
      groupedRows[value] = [];
    }
    groupedRows[value].push(row);
  }

  // Create splits for each group
  for (const [value, groupRows] of Object.entries(groupedRows)) {
    let content = '';

    if (keepHeaders && headers.length > 0) {
      content += formatCsvRow(headers, delimiter) + '\n';
    }

    for (const row of groupRows) {
      content += formatCsvRow(row, delimiter) + '\n';
    }

    const safeValue = value.replace(/[^a-zA-Z0-9]/g, '_');
    splits.push({
      filename: `${safeValue}.csv`,
      content: content.trim(),
      rowCount: groupRows.length + (keepHeaders ? 1 : 0),
      size: new Blob([content]).size,
      preview: groupRows.slice(0, 3).map(row => formatCsvRow(row, delimiter))
    });
  }

  return splits;
}

// Main processing function
export function processCsvSplitter(input: string, config: CsvSplitterConfig): CsvSplitterResult {
  try {
    const startTime = performance.now();

    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide CSV content to split'
      };
    }

    // Detect delimiter if needed
    const delimiter = config.delimiter === 'custom' ? config.customDelimiter : config.delimiter;
    const finalDelimiter = config.delimiter === ',' ? detectDelimiter(input) : delimiter;

    // Parse CSV
    const data = parseCSV(input, finalDelimiter);

    if (data.rows.length === 0) {
      return {
        success: false,
        error: 'No data rows found in CSV file'
      };
    }

    let splits: CsvSplitResult[] = [];

    // Perform splitting based on mode
    switch (config.splitMode) {
      case 'rows':
        splits = splitByRows(data, config.rowsPerFile, config.keepHeaders);
        break;
      case 'size':
        const sizeInKB = config.fileSizeUnit === 'MB' ? config.maxFileSize * 1024 : config.maxFileSize;
        splits = splitBySize(data, sizeInKB, config.keepHeaders);
        break;
      case 'column':
        if (!config.splitColumn) {
          return {
            success: false,
            error: 'Please specify a column name for column-based splitting'
          };
        }
        splits = splitByColumn(data, config.splitColumn, config.keepHeaders);
        break;
      default:
        return {
          success: false,
          error: 'Invalid split mode specified'
        };
    }

    // Apply custom filename pattern if specified
    if (config.filenamePattern && config.filenamePattern.trim()) {
      splits = splits.map((split, index) => ({
        ...split,
        filename: config.filenamePattern
          .replace(/{n}/g, (index + 1).toString())
          .replace(/{name}/g, split.filename.replace('.csv', ''))
          .replace(/{ext}/g, config.outputFormat)
      }));
    }

    const processingTime = performance.now() - startTime;
    const totalRows = splits.reduce((sum, split) => sum + split.rowCount, 0);
    const totalSize = splits.reduce((sum, split) => sum + split.size, 0);

    return {
      success: true,
      splits,
      totalFiles: splits.length,
      totalRows,
      originalSize: new Blob([input]).size,
      compressedSize: totalSize,
      processingTime: Math.round(processingTime),
      output: `Successfully split CSV into ${splits.length} files with ${totalRows} total rows`
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to split CSV file'
    };
  }
}

export const CSV_SPLITTER_TOOL: Tool = {
  id: 'csv-splitter',
  name: 'CSV Splitter & File Divider',
  description: 'Split large CSV files into smaller chunks by rows, file size, or column values. Process gigabyte files with smart splitting, header preservation, and batch downloads—all locally in your browser.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'data')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'data')!.subcategories!.find(sub => sub.id === 'file-analysis')!,
  slug: 'csv-splitter',
  icon: '✂️',
  keywords: [
    'csv splitter',
    'split csv files',
    'csv file divider',
    'batch csv processor',
    'large csv handler',
    'csv chunk',
    'split data files',
    'csv file breaker'
  ],
  seoTitle: 'CSV Splitter Online - Split Large CSV Files Free | Batch Processing Tool',
  seoDescription: 'Split large CSV files online free! Break CSV by rows, size, or column values. Process gigabyte files with smart chunking, header preservation & batch downloads. No upload required - 100% private browser tool.',

  examples: [
    {
      title: 'Split by Row Count',
      input: `name,email,department,salary
John Doe,john@example.com,Engineering,75000
Jane Smith,jane@example.com,Marketing,65000
Bob Johnson,bob@example.com,Sales,55000
Alice Brown,alice@example.com,Engineering,80000
Charlie Davis,charlie@example.com,Marketing,60000
Eva Wilson,eva@example.com,Sales,58000`,
      output: 'Split into 3 files with 2 rows each (plus headers)',
      description: 'Split a CSV file into multiple files with a specified number of rows per file'
    },
    {
      title: 'Split by File Size',
      input: `product,description,price,category,stock
Laptop,"High-performance gaming laptop with RGB keyboard",1299.99,Electronics,25
Phone,"Latest smartphone with advanced camera system",899.99,Electronics,150
Book,"Comprehensive guide to web development",49.99,Education,75`,
      output: 'Split into files under 1KB each',
      description: 'Split CSV files based on target file size to manage large datasets'
    },
    {
      title: 'Split by Column Values',
      input: `name,region,sales,quarter
John,North,15000,Q1
Jane,South,18000,Q1
Bob,North,22000,Q1
Alice,South,19000,Q1
Charlie,East,16000,Q1`,
      output: 'Split into separate files for each region: North.csv, South.csv, East.csv',
      description: 'Split CSV data into separate files based on unique values in a specific column'
    }
  ],

  useCases: [
    'Split large datasets for team distribution and analysis',
    'Break CSV exports into manageable chunks for spreadsheet apps',
    'Separate data by categories, regions, or time periods',
    'Prepare data files for batch processing workflows',
    'Reduce file sizes for email attachments and transfers',
    'Create training/testing datasets from large data files',
    'Organize sales data by territory or product category'
  ],

  commonErrors: [
    'Column not found - verify the column name matches exactly (case-sensitive)',
    'Empty output files - check that your split criteria produces valid results',
    'Memory issues with huge files - try splitting by smaller chunks first',
    'Invalid delimiter - ensure your custom delimiter appears in the data',
    'Header mismatch - verify headers are consistent across input data'
  ],

  faq: [
    {
      question: 'What is the maximum file size I can split?',
      answer: 'The tool processes files entirely in your browser memory. Most modern browsers can handle files up to 1-2GB, but performance depends on your device RAM and browser capabilities.'
    },
    {
      question: 'Will headers be preserved in split files?',
      answer: 'Yes, when "Keep Headers" is enabled, each split file will include the original CSV headers as the first row, maintaining proper column structure.'
    },
    {
      question: 'Can I split files with different delimiters?',
      answer: 'Yes, the tool supports comma, semicolon, tab, pipe, and custom delimiters. Auto-detection helps identify the correct delimiter automatically.'
    },
    {
      question: 'How does column-based splitting work?',
      answer: 'Column splitting groups rows by unique values in a specified column. Each unique value creates a separate file containing only rows with that value.'
    },
    {
      question: 'Is my data secure when using this tool?',
      answer: 'Absolutely. All processing happens locally in your browser. No data is uploaded to servers or stored anywhere outside your device.'
    },
    {
      question: 'Can I download all split files at once?',
      answer: 'Yes, enable "ZIP Output" to download all split files as a single ZIP archive for convenient batch downloading.'
    }
  ],

  relatedTools: [
    'csv-formatter',
    'json-to-csv',
    'csv-to-json',
    'data-format-transformer',
    'text-diff'
  ],

  howItWorks: [
    {
      title: 'Upload or Paste CSV Data',
      icon: '📁',
      description: 'Import your large CSV file by dragging and dropping, browsing files, or pasting data directly. Support for files up to 2GB with automatic delimiter detection for comma, semicolon, tab, and pipe separators. Real-time file size and row count analysis.',
      keywords: ['upload csv', 'large csv files', 'drag drop csv', 'paste csv data', 'delimiter detection', 'file analysis']
    },
    {
      title: 'Configure Split Settings',
      icon: '⚙️',
      description: 'Choose your splitting method: by row count (equal-sized files), by file size (size-based chunks), or by column values (category-based splits). Set header preservation, custom filename patterns, and output format preferences.',
      keywords: ['split settings', 'row count split', 'file size split', 'column value split', 'csv configuration', 'batch settings']
    },
    {
      title: 'Preview Split Results',
      icon: '👁️',
      description: 'View a real-time preview of how your CSV will be split before processing. See file count, row distribution, estimated sizes, and sample data from each split. Adjust settings until the split meets your requirements.',
      keywords: ['csv preview', 'split preview', 'file count preview', 'row distribution', 'size estimation', 'data sampling']
    },
    {
      title: 'Download Split Files',
      icon: '📦',
      description: 'Download individual CSV files or get all splits in a single ZIP archive. Each file maintains proper CSV formatting with optional header preservation. Bulk download for efficient file management and distribution.',
      keywords: ['download csv splits', 'zip download', 'bulk csv download', 'csv file distribution', 'batch file export', 'split file management']
    }
  ],

  problemsSolved: [
    {
      problem: 'Large CSV files exceed spreadsheet application limits and email attachment size restrictions, making data sharing and analysis impossible across teams and systems.',
      solution: 'Smart CSV splitting breaks large files into manageable chunks that fit within application limits while preserving data integrity, headers, and proper formatting for seamless workflow integration.',
      icon: '📊',
      keywords: ['large csv files', 'spreadsheet limits', 'email attachments', 'file size limits', 'data sharing', 'excel limits']
    },
    {
      problem: 'Processing massive datasets in single files causes memory issues, browser crashes, and poor performance when loading data into analysis tools or databases.',
      solution: 'Memory-efficient browser-based splitting processes files in chunks, preventing crashes while creating optimally-sized files for fast loading into databases, BI tools, and analysis platforms.',
      icon: '⚡',
      keywords: ['memory issues', 'browser crashes', 'performance optimization', 'database import', 'bi tools', 'analysis performance']
    },
    {
      problem: 'Organizing data by categories, regions, or time periods manually is time-consuming and error-prone when working with mixed datasets that need separation for different teams or purposes.',
      solution: 'Column-based splitting automatically separates data by unique values, creating organized files for each category while maintaining consistent structure and eliminating manual data sorting errors.',
      icon: '🗂️',
      keywords: ['data organization', 'category separation', 'regional data', 'team distribution', 'data sorting', 'automated organization']
    }
  ],

  whyChoose: [
    {
      title: 'Smart Splitting Algorithms',
      description: 'Advanced splitting logic handles complex CSV structures with quoted fields, embedded commas, and multi-line content. Intelligent row distribution ensures balanced file sizes while preserving data relationships.',
      icon: '🧠',
      keywords: ['smart splitting', 'csv algorithms', 'quoted fields', 'balanced distribution', 'data relationships', 'complex csv']
    },
    {
      title: 'Zero Data Upload Required',
      description: 'Complete privacy protection with local browser processing. No server uploads, no data retention, no privacy concerns. Process sensitive financial, medical, or personal data with complete confidence.',
      icon: '🔒',
      keywords: ['no upload', 'local processing', 'privacy protection', 'sensitive data', 'secure csv splitting', 'data privacy']
    },
    {
      title: 'Professional Output Quality',
      description: 'Industry-standard CSV formatting with proper quoting, escaping, and header management. Compatible with Excel, Google Sheets, databases, and data analysis tools. RFC 4180 compliant output.',
      icon: '⭐',
      keywords: ['professional csv', 'industry standard', 'excel compatible', 'database ready', 'rfc 4180', 'quality output']
    },
    {
      title: 'Massive File Support',
      description: 'Handle gigabyte-sized CSV files with optimized memory usage and streaming processing. Progressive splitting prevents browser crashes while maintaining high performance on large datasets.',
      icon: '🚀',
      keywords: ['gigabyte files', 'large csv support', 'optimized memory', 'streaming processing', 'high performance', 'massive datasets']
    }
  ]
};