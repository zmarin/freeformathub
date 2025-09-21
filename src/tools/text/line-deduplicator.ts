import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface LineDeduplicatorConfig {
  caseSensitive: boolean;
  trimWhitespace: boolean;
  removeEmptyLines: boolean;
  sortOutput: boolean;
  sortOrder: 'ascending' | 'descending' | 'original';
  preserveOrder: boolean;
  onlyDuplicates: boolean;
  onlyUnique: boolean;
  showStats: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: DeduplicationStats;
}

export interface DeduplicationStats {
  totalLines: number;
  uniqueLines: number;
  duplicateLines: number;
  removedLines: number;
  emptyLinesRemoved: number;
  processingTime: number;
}

const DEFAULT_CONFIG: LineDeduplicatorConfig = {
  caseSensitive: true,
  trimWhitespace: true,
  removeEmptyLines: true,
  sortOutput: false,
  sortOrder: 'original',
  preserveOrder: true,
  onlyDuplicates: false,
  onlyUnique: false,
  showStats: true,
};

export function deduplicateLines(input: string, config: LineDeduplicatorConfig = DEFAULT_CONFIG): ToolResult {
  const startTime = performance.now();

  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'No input text provided'
      };
    }

    // Split into lines
    let lines = input.split(/\r?\n/);

    const stats: DeduplicationStats = {
      totalLines: lines.length,
      uniqueLines: 0,
      duplicateLines: 0,
      removedLines: 0,
      emptyLinesRemoved: 0,
      processingTime: 0
    };

    // Process lines based on configuration
    if (config.trimWhitespace) {
      lines = lines.map(line => line.trim());
    }

    // Count and optionally remove empty lines
    const emptyLines = lines.filter(line => line === '').length;
    stats.emptyLinesRemoved = emptyLines;

    if (config.removeEmptyLines) {
      lines = lines.filter(line => line !== '');
    }

    // Track line occurrences and first appearance index
    const lineMap = new Map<string, { count: number; firstIndex: number; allIndices: number[] }>();

    lines.forEach((line, index) => {
      const key = config.caseSensitive ? line : line.toLowerCase();

      if (!lineMap.has(key)) {
        lineMap.set(key, { count: 1, firstIndex: index, allIndices: [index] });
      } else {
        const entry = lineMap.get(key)!;
        entry.count++;
        entry.allIndices.push(index);
        lineMap.set(key, entry);
      }
    });

    // Calculate statistics
    const uniqueEntries = Array.from(lineMap.values()).filter(entry => entry.count === 1);
    const duplicateEntries = Array.from(lineMap.values()).filter(entry => entry.count > 1);

    stats.uniqueLines = uniqueEntries.length;
    stats.duplicateLines = duplicateEntries.reduce((sum, entry) => sum + entry.count, 0);
    stats.removedLines = stats.duplicateLines - duplicateEntries.length;

    // Generate output based on configuration
    let resultLines: string[] = [];

    if (config.onlyDuplicates) {
      // Show only lines that appear more than once
      duplicateEntries.forEach(entry => {
        const originalLine = lines[entry.firstIndex];
        resultLines.push(originalLine);
      });
    } else if (config.onlyUnique) {
      // Show only lines that appear exactly once
      uniqueEntries.forEach(entry => {
        const originalLine = lines[entry.firstIndex];
        resultLines.push(originalLine);
      });
    } else {
      // Normal deduplication - keep first occurrence of each line
      if (config.preserveOrder) {
        // Maintain original order of first occurrences
        const seenKeys = new Set<string>();
        lines.forEach(line => {
          const key = config.caseSensitive ? line : line.toLowerCase();
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            resultLines.push(line);
          }
        });
      } else {
        // Use map order (which preserves insertion order)
        lineMap.forEach((entry, key) => {
          const originalLine = lines[entry.firstIndex];
          resultLines.push(originalLine);
        });
      }
    }

    // Apply sorting if requested
    if (config.sortOutput && config.sortOrder !== 'original') {
      resultLines.sort((a, b) => {
        const compareA = config.caseSensitive ? a : a.toLowerCase();
        const compareB = config.caseSensitive ? b : b.toLowerCase();

        if (config.sortOrder === 'ascending') {
          return compareA.localeCompare(compareB);
        } else {
          return compareB.localeCompare(compareA);
        }
      });
    }

    const endTime = performance.now();
    stats.processingTime = endTime - startTime;

    // Generate output with optional statistics
    let output = resultLines.join('\n');

    if (config.showStats) {
      const statsText = `
Statistics:
- Total lines processed: ${stats.totalLines.toLocaleString()}
- Unique lines: ${stats.uniqueLines.toLocaleString()}
- Duplicate lines found: ${stats.duplicateLines.toLocaleString()}
- Lines removed: ${stats.removedLines.toLocaleString()}
- Empty lines removed: ${stats.emptyLinesRemoved.toLocaleString()}
- Processing time: ${stats.processingTime.toFixed(2)}ms
- Final line count: ${resultLines.length.toLocaleString()}

--- Processed Text ---
`;
      output = statsText + output;
    }

    return {
      success: true,
      output,
      stats
    };

  } catch (error) {
    return {
      success: false,
      error: `Line deduplication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const LINE_DEDUPLICATOR_TOOL: Tool = {
  id: 'line-deduplicator',
  name: 'Line Deduplicator - Remove Duplicate Lines from Text Online',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-processing')!,
  slug: 'line-deduplicator',
  icon: '🔄',
  keywords: ['line deduplicator', 'remove duplicate lines', 'unique lines', 'text deduplication', 'duplicate line remover', 'line cleaner', 'text cleanup', 'free line deduplicator', 'online duplicate remover'],
  seoTitle: 'Free Line Deduplicator Online - Remove Duplicate Lines from Text',
  seoDescription: 'Remove duplicate lines from text instantly with our free online line deduplicator. Sort, clean, and process text data with advanced filtering options. Works offline and privacy-first.',
  description: 'Free online line deduplicator that removes duplicate lines from text data while preserving formatting and order. Perfect for cleaning up lists, logs, data files, and text documents with advanced sorting and filtering options.',

  examples: [
    {
      title: 'Email List Cleanup',
      input: `john@example.com
jane@example.com
john@example.com
bob@example.com
jane@example.com
alice@example.com`,
      output: `john@example.com
jane@example.com
bob@example.com
alice@example.com`,
      description: 'Remove duplicate email addresses from mailing lists'
    },
    {
      title: 'Log File Deduplication',
      input: `ERROR: Database connection failed
INFO: User login successful
ERROR: Database connection failed
WARNING: Low disk space
INFO: User login successful
ERROR: Invalid credentials`,
      output: `ERROR: Database connection failed
INFO: User login successful
WARNING: Low disk space
ERROR: Invalid credentials`,
      description: 'Clean up duplicate entries in log files for analysis'
    },
    {
      title: 'Data List Processing',
      input: `Apple
Banana
apple
Orange
Banana
Cherry
APPLE`,
      output: `Apple
Banana
Orange
Cherry
apple
APPLE`,
      description: 'Process data lists with case-sensitive or case-insensitive deduplication'
    }
  ],

  howItWorks: [
    {
      title: "Paste Your Text Data",
      icon: "📝",
      description: "Enter or paste text containing duplicate lines - supports lists, logs, CSV data, or any line-based text format. Processing happens entirely in your browser with no data uploads.",
      keywords: ["text input", "line processing", "data cleanup", "secure text processing"]
    },
    {
      title: "Configure Deduplication Options",
      icon: "⚙️",
      description: "Choose case sensitivity, whitespace trimming, empty line removal, sorting options, and whether to show only duplicates or unique lines. Customize the processing to match your needs.",
      keywords: ["deduplication options", "text filtering", "line sorting", "case sensitivity"]
    },
    {
      title: "Process Lines Instantly",
      icon: "⚡",
      description: "Click 'Remove Duplicates' to process your text. The tool identifies duplicate lines, preserves original order (optional), and provides detailed statistics about the cleanup process.",
      keywords: ["instant processing", "duplicate detection", "line analysis", "text statistics"]
    },
    {
      title: "Download Clean Results",
      icon: "💾",
      description: "Copy cleaned text to clipboard or download as a text file. Perfect for data preparation, list management, log analysis, and content deduplication workflows.",
      keywords: ["download results", "clean text", "data preparation", "list management"]
    }
  ],

  useCases: [
    'Email and contact list deduplication',
    'Log file analysis and cleanup',
    'Data preparation for databases and spreadsheets',
    'Removing duplicate entries from surveys and forms',
    'Cleaning up imported data from various sources',
    'Processing word lists and dictionaries',
    'Deduplicating URLs and link collections',
    'Cleaning up code snippets and configuration files',
    'Processing research data and survey responses',
    'Preparing data for analysis and reporting tools'
  ],

  faq: [
    {
      question: 'Is this line deduplicator free to use?',
      answer: 'Yes, this line deduplicator is completely free with no limits on the amount of text you can process. No registration required, and no watermarks added to processed text.'
    },
    {
      question: 'Is my text data uploaded to your servers?',
      answer: 'No, all text processing happens locally in your browser. Your data never leaves your computer, ensuring complete privacy and security for sensitive information.'
    },
    {
      question: 'How does case sensitivity work?',
      answer: 'When case-sensitive mode is enabled, "Apple" and "apple" are treated as different lines. When disabled, they are considered duplicates and only one will be kept in the output.'
    },
    {
      question: 'Can I preserve the original order of lines?',
      answer: 'Yes, by default the tool preserves the original order by keeping the first occurrence of each unique line. You can also sort the output alphabetically if preferred.'
    },
    {
      question: 'What happens to empty lines?',
      answer: 'Empty lines are counted and can be automatically removed if desired. The statistics will show how many empty lines were found and removed during processing.'
    },
    {
      question: 'Can I see only the duplicate lines?',
      answer: 'Yes, you can configure the tool to show only lines that appear more than once, or only lines that appear exactly once (unique lines). This is useful for analysis purposes.'
    },
    {
      question: 'How large files can I process?',
      answer: 'The tool can handle large text files efficiently in your browser. Processing time depends on your device performance, but typical files with thousands of lines process in milliseconds.'
    },
    {
      question: 'Does whitespace trimming affect the comparison?',
      answer: 'When whitespace trimming is enabled, leading and trailing spaces are removed before comparison. This helps identify lines that are essentially the same but have different spacing.'
    }
  ],

  commonErrors: [
    'Very large files may slow down browser performance - consider splitting into smaller chunks',
    'Different line ending formats (Windows vs Unix) are automatically handled',
    'Unicode characters are fully supported and preserved during processing',
    'Memory usage scales with file size - extremely large files may need desktop tools',
    'Case sensitivity setting affects duplicate detection - choose based on your data type'
  ],

  relatedTools: ['text-find-replace', 'list-sorter', 'text-diff', 'text-statistics']
};