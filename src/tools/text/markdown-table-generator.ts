import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface MarkdownTableGeneratorConfig {
  inputFormat: 'manual' | 'csv' | 'json' | 'tsv';
  alignment: 'left' | 'center' | 'right' | 'mixed';
  includeHeaders: boolean;
  sortColumn: number;
  sortDirection: 'asc' | 'desc' | 'none';
  escapeHtml: boolean;
  compactMode: boolean;
  addRowNumbers: boolean;
  maxColumnWidth: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  tableData?: TableData;
  stats?: TableStats;
}

interface TableData {
  headers: string[];
  rows: string[][];
  columnCount: number;
  rowCount: number;
}

interface TableStats {
  totalCells: number;
  columnCount: number;
  rowCount: number;
  emptyColumns: number;
  emptyRows: number;
  avgRowLength: number;
}

function parseCSV(csvText: string): { headers: string[], rows: string[][] } {
  const lines = csvText.trim().split('\n');
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current.trim());
    result.push(row);
  }
  
  const headers = result.length > 0 ? result[0] : [];
  const rows = result.slice(1);
  
  return { headers, rows };
}

function parseTSV(tsvText: string): { headers: string[], rows: string[][] } {
  const lines = tsvText.trim().split('\n');
  const result = lines.map(line => line.split('\t'));
  
  const headers = result.length > 0 ? result[0] : [];
  const rows = result.slice(1);
  
  return { headers, rows };
}

function parseJSON(jsonText: string): { headers: string[], rows: string[][] } {
  try {
    const data = JSON.parse(jsonText);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of objects');
    }
    
    if (data.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // Extract headers from first object
    const firstItem = data[0];
    const headers = Object.keys(firstItem);
    
    // Convert objects to rows
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        return value !== null && value !== undefined ? String(value) : '';
      })
    );
    
    return { headers, rows };
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function escapeMarkdownTableCell(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '');
}

function generateAlignment(alignment: string, columnCount: number): string[] {
  const alignments: string[] = [];
  
  for (let i = 0; i < columnCount; i++) {
    switch (alignment) {
      case 'left':
        alignments.push(':--');
        break;
      case 'center':
        alignments.push(':-:');
        break;
      case 'right':
        alignments.push('--:');
        break;
      case 'mixed':
        // Alternate between left, center, right
        const patterns = [':--', ':-:', '--:'];
        alignments.push(patterns[i % patterns.length]);
        break;
      default:
        alignments.push('---');
    }
  }
  
  return alignments;
}

function sortTable(headers: string[], rows: string[][], sortColumn: number, direction: 'asc' | 'desc'): string[][] {
  if (sortColumn < 0 || sortColumn >= headers.length) {
    return rows;
  }
  
  return rows.slice().sort((a, b) => {
    const aValue = a[sortColumn] || '';
    const bValue = b[sortColumn] || '';
    
    // Try to parse as numbers for numeric sorting
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);
    
    let comparison = 0;
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      comparison = aNum - bNum;
    } else {
      comparison = aValue.localeCompare(bValue);
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });
}

function padColumns(headers: string[], rows: string[][], maxColumnWidth: number): { headers: string[], rows: string[][] } {
  const columnCount = Math.max(headers.length, ...rows.map(row => row.length));
  
  // Pad headers
  const paddedHeaders = [...headers];
  while (paddedHeaders.length < columnCount) {
    paddedHeaders.push(`Column ${paddedHeaders.length + 1}`);
  }
  
  // Pad rows
  const paddedRows = rows.map(row => {
    const paddedRow = [...row];
    while (paddedRow.length < columnCount) {
      paddedRow.push('');
    }
    return paddedRow;
  });
  
  // Truncate cells if they exceed max width
  if (maxColumnWidth > 0) {
    const truncateCell = (cell: string) => 
      cell.length > maxColumnWidth ? cell.substring(0, maxColumnWidth - 3) + '...' : cell;
    
    paddedHeaders.forEach((header, i) => {
      paddedHeaders[i] = truncateCell(header);
    });
    
    paddedRows.forEach(row => {
      row.forEach((cell, i) => {
        row[i] = truncateCell(cell);
      });
    });
  }
  
  return { headers: paddedHeaders, rows: paddedRows };
}

function calculateTableStats(headers: string[], rows: string[][]): TableStats {
  const columnCount = headers.length;
  const rowCount = rows.length;
  const totalCells = columnCount * rowCount;
  
  let emptyCells = 0;
  let totalRowLength = 0;
  
  rows.forEach(row => {
    row.forEach(cell => {
      if (!cell || cell.trim() === '') {
        emptyCells++;
      }
      totalRowLength += cell.length;
    });
  });
  
  const emptyColumns = headers.reduce((count, _, colIndex) => {
    const isEmpty = rows.every(row => !row[colIndex] || row[colIndex].trim() === '');
    return count + (isEmpty ? 1 : 0);
  }, 0);
  
  const emptyRows = rows.reduce((count, row) => {
    const isEmpty = row.every(cell => !cell || cell.trim() === '');
    return count + (isEmpty ? 1 : 0);
  }, 0);
  
  const avgRowLength = rowCount > 0 ? Math.round(totalRowLength / rowCount) : 0;
  
  return {
    totalCells,
    columnCount,
    rowCount,
    emptyColumns,
    emptyRows,
    avgRowLength
  };
}

export function processMarkdownTableGenerator(input: string, config: MarkdownTableGeneratorConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide data to convert to a markdown table'
      };
    }

    let headers: string[] = [];
    let rows: string[][] = [];

    // Parse input based on format
    switch (config.inputFormat) {
      case 'csv':
        const csvResult = parseCSV(input);
        headers = csvResult.headers;
        rows = csvResult.rows;
        break;
        
      case 'tsv':
        const tsvResult = parseTSV(input);
        headers = tsvResult.headers;
        rows = tsvResult.rows;
        break;
        
      case 'json':
        const jsonResult = parseJSON(input);
        headers = jsonResult.headers;
        rows = jsonResult.rows;
        break;
        
      case 'manual':
        // Parse manual input (assume pipe-separated or line-separated)
        const lines = input.trim().split('\n');
        if (lines.length === 0) {
          return { success: false, error: 'No data provided' };
        }
        
        // Check if first line looks like headers (contains |)
        if (lines[0].includes('|')) {
          headers = lines[0].split('|').map(h => h.trim());
          rows = lines.slice(1)
            .filter(line => line.trim() && !line.match(/^[\s\-\|:]+$/)) // Skip separator lines
            .map(line => line.split('|').map(c => c.trim()));
        } else {
          // Treat as simple text, create single column
          headers = ['Content'];
          rows = lines.map(line => [line.trim()]).filter(row => row[0]);
        }
        break;
        
      default:
        return { success: false, error: 'Invalid input format' };
    }

    // Validate data
    if (headers.length === 0 && rows.length === 0) {
      return { success: false, error: 'No table data found' };
    }

    // If no headers but we have rows, create default headers
    if (headers.length === 0 && rows.length > 0) {
      const maxColumns = Math.max(...rows.map(row => row.length));
      headers = Array.from({ length: maxColumns }, (_, i) => `Column ${i + 1}`);
    }

    // Pad columns to ensure consistent width
    const { headers: paddedHeaders, rows: paddedRows } = padColumns(headers, rows, config.maxColumnWidth);

    // Sort if requested
    let sortedRows = paddedRows;
    if (config.sortColumn >= 0 && config.sortDirection !== 'none') {
      sortedRows = sortTable(paddedHeaders, paddedRows, config.sortColumn, config.sortDirection);
    }

    // Add row numbers if requested
    let finalHeaders = paddedHeaders;
    let finalRows = sortedRows;
    
    if (config.addRowNumbers) {
      finalHeaders = ['#', ...paddedHeaders];
      finalRows = sortedRows.map((row, index) => [(index + 1).toString(), ...row]);
    }

    // Generate markdown table
    let output = '';
    
    // Headers
    if (config.includeHeaders) {
      const escapedHeaders = finalHeaders.map(h => escapeMarkdownTableCell(h));
      output += `| ${escapedHeaders.join(' | ')} |\n`;
      
      // Alignment row
      const alignments = generateAlignment(config.alignment, finalHeaders.length);
      output += `|${alignments.map(a => `${a}`).join('|')}|\n`;
    }
    
    // Data rows
    for (const row of finalRows) {
      const escapedRow = row.map(cell => 
        config.escapeHtml ? escapeMarkdownTableCell(cell) : cell
      );
      
      if (config.compactMode) {
        output += `|${escapedRow.join('|')}|\n`;
      } else {
        output += `| ${escapedRow.join(' | ')} |\n`;
      }
    }

    // Generate table data and stats
    const tableData: TableData = {
      headers: finalHeaders,
      rows: finalRows,
      columnCount: finalHeaders.length,
      rowCount: finalRows.length
    };
    
    const stats = calculateTableStats(finalHeaders, finalRows);

    return {
      success: true,
      output: output.trim(),
      tableData,
      stats
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate markdown table'
    };
  }
}

export const MARKDOWN_TABLE_GENERATOR_TOOL: Tool = {
  id: 'markdown-table-generator',
  name: 'Markdown Table Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-generation')!,
  slug: 'markdown-table-generator',
  icon: '=�',
  keywords: ['markdown', 'table', 'csv', 'json', 'generator', 'format', 'tsv', 'data'],
  seoTitle: 'Markdown Table Generator - Convert CSV/JSON to Markdown | FreeFormatHub',
  seoDescription: 'Generate markdown tables from CSV, JSON, TSV data. Support for sorting, alignment, row numbers, and formatting options. Perfect for documentation.',
  description: 'Convert CSV, JSON, TSV, or manual data into beautifully formatted markdown tables. Support for sorting, alignment, and customization options.',

  examples: [
    {
      title: 'CSV to Markdown Table',
      input: `Name,Age,City,Occupation
John Doe,28,New York,Developer
Jane Smith,32,San Francisco,Designer
Bob Johnson,25,Chicago,Analyst`,
      output: `| Name | Age | City | Occupation |
|:--|:--|:--|:--|
| John Doe | 28 | New York | Developer |
| Jane Smith | 32 | San Francisco | Designer |
| Bob Johnson | 25 | Chicago | Analyst |`,
      description: 'Convert CSV data to a formatted markdown table'
    },
    {
      title: 'JSON Array to Table',
      input: `[
  {
    "product": "Laptop",
    "price": 999,
    "stock": 15,
    "category": "Electronics"
  },
  {
    "product": "Mouse",
    "price": 25,
    "stock": 150,
    "category": "Accessories"
  }
]`,
      output: `| product | price | stock | category |
|:--|:--|:--|:--|
| Laptop | 999 | 15 | Electronics |
| Mouse | 25 | 150 | Accessories |`,
      description: 'Generate table from JSON array of objects'
    },
    {
      title: 'Manual Data with Pipes',
      input: `Feature | Status | Priority | Assignee
Authentication | Complete | High | John
Dashboard | In Progress | Medium | Sarah
API Integration | Pending | High | Mike`,
      output: `| Feature | Status | Priority | Assignee |
|:--|:--|:--|:--|
| Authentication | Complete | High | John |
| Dashboard | In Progress | Medium | Sarah |
| API Integration | Pending | High | Mike |`,
      description: 'Create table from pipe-separated manual input'
    }
  ],

  useCases: [
    'Creating documentation tables for README files and wikis',
    'Converting spreadsheet data to markdown for GitHub/GitLab',
    'Generating tables for blog posts and technical articles',
    'Creating comparison tables and feature matrices',
    'Converting API response data to readable tables',
    'Building tables for project status and tracking',
    'Creating formatted tables for technical specifications',
    'Converting database query results to documentation'
  ],

  faq: [
    {
      question: 'What input formats are supported?',
      answer: 'Supports CSV (comma-separated), TSV (tab-separated), JSON arrays of objects, and manual pipe-separated input. Each format is automatically parsed and converted to markdown.'
    },
    {
      question: 'How do I control column alignment?',
      answer: 'Choose from left (:--), center (:-:), right (--:), or mixed alignment. Mixed alternates between all three for variety. Alignment affects how content displays in markdown renderers.'
    },
    {
      question: 'Can I sort the table data?',
      answer: 'Yes, select any column number to sort by (0-based index) and choose ascending or descending order. Numeric values are sorted numerically, text values alphabetically.'
    },
    {
      question: 'What happens to special characters?',
      answer: 'Pipe characters (|) are automatically escaped to \\| to prevent table breaking. Line breaks become <br> tags. HTML escaping can be enabled for additional safety.'
    },
    {
      question: 'How do I handle missing data or empty cells?',
      answer: 'Empty cells are preserved as blank table cells. The tool shows statistics about empty columns and rows. You can set max column width to handle very long content.'
    }
  ],

  commonErrors: [
    'Invalid JSON format when using JSON input mode',
    'Inconsistent column counts in CSV/TSV data',
    'Sort column index out of range (must be valid column number)',
    'Empty input data with no parseable content',
    'Special characters not properly escaped in manual input'
  ],

  relatedTools: ['csv-formatter', 'json-formatter', 'markdown-converter', 'table-formatter', 'data-converter']
};