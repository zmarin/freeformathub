import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ListSorterConfig {
  sortOrder: 'ascending' | 'descending' | 'random' | 'reverse';
  caseSensitive: boolean;
  ignoreArticles: boolean;
  trimWhitespace: boolean;
  removeEmptyLines: boolean;
  removeDuplicates: boolean;
  sortBy: 'alphabetical' | 'length' | 'numerical' | 'custom';
  customSeparator: string;
  preserveCase: boolean;
  naturalSort: boolean;
  showStats: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: SortingStats;
}

export interface SortingStats {
  totalLines: number;
  sortedLines: number;
  removedLines: number;
  duplicatesRemoved: number;
  emptyLinesRemoved: number;
  sortMethod: string;
  processingTime: number;
}

const DEFAULT_CONFIG: ListSorterConfig = {
  sortOrder: 'ascending',
  caseSensitive: false,
  ignoreArticles: false,
  trimWhitespace: true,
  removeEmptyLines: true,
  removeDuplicates: false,
  sortBy: 'alphabetical',
  customSeparator: '\n',
  preserveCase: false,
  naturalSort: true,
  showStats: true,
};

const ARTICLES = ['a', 'an', 'the'];

export function sortList(
  input: string,
  config: ListSorterConfig = DEFAULT_CONFIG
): ToolResult {
  const startTime = performance.now();

  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'No input text provided'
      };
    }

    const stats: SortingStats = {
      totalLines: 0,
      sortedLines: 0,
      removedLines: 0,
      duplicatesRemoved: 0,
      emptyLinesRemoved: 0,
      sortMethod: '',
      processingTime: 0
    };

    // Split input into lines based on custom separator
    let lines = input.split(config.customSeparator);
    stats.totalLines = lines.length;

    // Track removed lines
    let removedCount = 0;

    // Trim whitespace if enabled
    if (config.trimWhitespace) {
      lines = lines.map(line => line.trim());
    }

    // Remove empty lines if enabled
    if (config.removeEmptyLines) {
      const originalLength = lines.length;
      lines = lines.filter(line => line.length > 0);
      stats.emptyLinesRemoved = originalLength - lines.length;
      removedCount += stats.emptyLinesRemoved;
    }

    // Remove duplicates if enabled
    if (config.removeDuplicates) {
      const originalLength = lines.length;
      const seen = new Set<string>();
      lines = lines.filter(line => {
        const key = config.caseSensitive ? line : line.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      stats.duplicatesRemoved = originalLength - lines.length;
      removedCount += stats.duplicatesRemoved;
    }

    stats.removedLines = removedCount;

    // Sort based on configuration
    let sortedLines: string[] = [];

    switch (config.sortOrder) {
      case 'random':
        sortedLines = shuffleArray([...lines]);
        stats.sortMethod = 'Random shuffle';
        break;

      case 'reverse':
        sortedLines = [...lines].reverse();
        stats.sortMethod = 'Reverse order';
        break;

      case 'ascending':
      case 'descending':
        sortedLines = sortLinesByMethod(lines, config);
        stats.sortMethod = `${config.sortBy} (${config.sortOrder})`;
        break;

      default:
        sortedLines = [...lines];
        stats.sortMethod = 'No sorting';
    }

    stats.sortedLines = sortedLines.length;

    const endTime = performance.now();
    stats.processingTime = endTime - startTime;

    // Generate output
    let output = sortedLines.join(config.customSeparator);

    if (config.showStats) {
      const statsText = `
List Sorting Results:
- Sort method: ${stats.sortMethod}
- Original lines: ${stats.totalLines.toLocaleString()}
- Final lines: ${stats.sortedLines.toLocaleString()}
- Removed lines: ${stats.removedLines.toLocaleString()}
- Duplicates removed: ${stats.duplicatesRemoved.toLocaleString()}
- Empty lines removed: ${stats.emptyLinesRemoved.toLocaleString()}
- Processing time: ${stats.processingTime.toFixed(2)}ms

--- Sorted List ---
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
      error: `List sorting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function sortLinesByMethod(lines: string[], config: ListSorterConfig): string[] {
  const sortedLines = [...lines];

  switch (config.sortBy) {
    case 'alphabetical':
      sortedLines.sort((a, b) => {
        let aStr = a;
        let bStr = b;

        // Remove articles if enabled
        if (config.ignoreArticles) {
          aStr = removeArticles(aStr);
          bStr = removeArticles(bStr);
        }

        // Case sensitivity
        if (!config.caseSensitive) {
          aStr = aStr.toLowerCase();
          bStr = bStr.toLowerCase();
        }

        // Natural sorting (handles numbers within text)
        if (config.naturalSort) {
          return naturalCompare(aStr, bStr);
        }

        return aStr.localeCompare(bStr);
      });
      break;

    case 'length':
      sortedLines.sort((a, b) => a.length - b.length);
      break;

    case 'numerical':
      sortedLines.sort((a, b) => {
        const numA = parseFloat(a.replace(/[^\d.-]/g, '')) || 0;
        const numB = parseFloat(b.replace(/[^\d.-]/g, '')) || 0;
        return numA - numB;
      });
      break;

    case 'custom':
      // Custom sorting could be implemented here
      // For now, falls back to alphabetical
      sortedLines.sort((a, b) => a.localeCompare(b));
      break;
  }

  // Reverse if descending
  if (config.sortOrder === 'descending') {
    sortedLines.reverse();
  }

  return sortedLines;
}

function removeArticles(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length > 1 && ARTICLES.includes(words[0].toLowerCase())) {
    return words.slice(1).join(' ');
  }
  return text;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function naturalCompare(a: string, b: string): number {
  const regex = /(\d+|\D+)/g;
  const aParts = a.match(regex) || [];
  const bParts = b.match(regex) || [];

  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] || '';
    const bPart = bParts[i] || '';

    const aIsNum = /^\d+$/.test(aPart);
    const bIsNum = /^\d+$/.test(bPart);

    if (aIsNum && bIsNum) {
      const numA = parseInt(aPart, 10);
      const numB = parseInt(bPart, 10);
      if (numA !== numB) {
        return numA - numB;
      }
    } else {
      const comparison = aPart.localeCompare(bPart);
      if (comparison !== 0) {
        return comparison;
      }
    }
  }

  return 0;
}

export const LIST_SORTER_TOOL: Tool = {
  id: 'list-sorter',
  name: 'List Sorter - Sort Lists Online Alphabetically or Numerically',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-processing')!,
  slug: 'list-sorter',
  icon: '📋',
  keywords: ['list sorter', 'sort list online', 'alphabetical sort', 'numerical sort', 'sort names', 'sort text', 'list organizer', 'free list sorter', 'sort alphabetically'],
  seoTitle: 'Free List Sorter Online - Sort Lists Alphabetically & Numerically',
  seoDescription: 'Sort lists instantly with our free online list sorter. Supports alphabetical, numerical, length-based, and random sorting. Remove duplicates, ignore articles, and customize sorting options.',
  description: 'Free online list sorting tool that organizes text lists alphabetically, numerically, by length, or randomly. Features advanced options like duplicate removal, article ignoring, and natural sorting for efficient list management.',

  examples: [
    {
      title: 'Alphabetical Name Sorting',
      input: `John Smith
Alice Johnson
Bob Wilson
Carol Davis
David Brown`,
      output: `Alice Johnson
Bob Wilson
Carol Davis
David Brown
John Smith`,
      description: 'Sort a list of names alphabetically in ascending order'
    },
    {
      title: 'Numerical List Sorting',
      input: `Item 10
Item 2
Item 1
Item 20
Item 3`,
      output: `Item 1
Item 2
Item 3
Item 10
Item 20`,
      description: 'Sort items with numbers using natural sorting'
    },
    {
      title: 'Movie Titles (Ignore Articles)',
      input: `The Matrix
A Beautiful Mind
An American Tale
Batman
The Godfather`,
      output: `An American Tale
Batman
A Beautiful Mind
The Godfather
The Matrix`,
      description: 'Sort movie titles while ignoring articles (a, an, the)'
    }
  ],

  howItWorks: [
    {
      title: "Enter Your List Items",
      icon: "📝",
      description: "Paste or type your list items, one per line. The tool supports any text format including names, titles, numbers, or mixed content. Processing happens entirely in your browser for privacy.",
      keywords: ["list input", "text sorting", "list organizer", "secure sorting"]
    },
    {
      title: "Choose Sorting Method",
      icon: "⚙️",
      description: "Select your preferred sorting method: alphabetical, numerical, by length, or random. Configure options like case sensitivity, article ignoring, and duplicate removal.",
      keywords: ["sorting options", "alphabetical sort", "numerical sort", "custom sorting"]
    },
    {
      title: "Apply Advanced Options",
      icon: "🔧",
      description: "Enable natural sorting for mixed text and numbers, remove duplicates, trim whitespace, and choose ascending or descending order for precise list organization.",
      keywords: ["advanced sorting", "natural sort", "duplicate removal", "list optimization"]
    },
    {
      title: "Get Sorted Results",
      icon: "📊",
      description: "Instantly view your sorted list with detailed statistics. Copy results or download as a file. Perfect for organizing contact lists, inventories, or any text data.",
      keywords: ["sorted results", "list statistics", "download sorted list", "list management"]
    }
  ],

  useCases: [
    'Organizing contact lists and address books',
    'Sorting product catalogs and inventories',
    'Alphabetizing student or employee rosters',
    'Arranging bibliography and reference lists',
    'Organizing file and folder listings',
    'Sorting survey responses and feedback',
    'Arranging menu items and categories',
    'Organizing task lists and to-do items',
    'Sorting email lists and mailing addresses',
    'Arranging library catalogs and book lists'
  ],

  faq: [
    {
      question: 'Is this list sorter tool free to use?',
      answer: 'Yes, this list sorting tool is completely free with no limits on list size or number of sorting operations. No registration required, and no watermarks added to sorted lists.'
    },
    {
      question: 'Is my list data uploaded to your servers?',
      answer: 'No, all list sorting happens locally in your browser. Your data never leaves your computer, ensuring complete privacy and security for sensitive lists and personal information.'
    },
    {
      question: 'What sorting methods are supported?',
      answer: 'The tool supports alphabetical sorting (A-Z or Z-A), numerical sorting, sorting by text length, random shuffling, and reverse order. Natural sorting handles mixed text and numbers intelligently.'
    },
    {
      question: 'Can I remove duplicates while sorting?',
      answer: 'Yes, you can enable duplicate removal to automatically eliminate identical entries while sorting. The tool also provides statistics showing how many duplicates were removed.'
    },
    {
      question: 'How does article ignoring work?',
      answer: 'When enabled, the tool ignores common articles (a, an, the) at the beginning of list items when sorting. For example, "The Matrix" would be sorted under "M" instead of "T".'
    },
    {
      question: 'What is natural sorting?',
      answer: 'Natural sorting intelligently handles numbers within text, so "Item 2" comes before "Item 10" instead of "Item 10" coming first alphabetically. This creates more intuitive sorting for mixed content.'
    },
    {
      question: 'Can I sort large lists?',
      answer: 'Yes, the tool can handle large lists efficiently in your browser. Performance depends on list size and complexity, but typical lists with thousands of items sort in milliseconds.'
    },
    {
      question: 'Can I customize the separator between list items?',
      answer: 'Yes, you can specify custom separators like commas, semicolons, or tabs instead of line breaks. This allows sorting of comma-separated values or other formatted lists.'
    }
  ],

  commonErrors: [
    'Empty input - ensure your list contains items to sort',
    'Mixed separators may cause unexpected results - use consistent formatting',
    'Very large lists may slow down browser performance - consider processing in smaller batches',
    'Special characters may affect natural sorting - review sorted output carefully',
    'Whitespace differences may prevent proper duplicate detection - enable trimming'
  ],

  relatedTools: ['line-deduplicator', 'text-find-replace', 'text-statistics', 'csv-formatter']
};