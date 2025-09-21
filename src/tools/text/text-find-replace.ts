import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface FindReplaceConfig {
  caseSensitive: boolean;
  wholeWords: boolean;
  useRegex: boolean;
  replaceAll: boolean;
  preserveCase: boolean;
  multiline: boolean;
  globalSearch: boolean;
  showStats: boolean;
  highlightMatches: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: FindReplaceStats;
  matches?: MatchInfo[];
}

export interface FindReplaceStats {
  totalMatches: number;
  replacements: number;
  searchPattern: string;
  replacePattern: string;
  processingTime: number;
  linesAffected: number;
}

export interface MatchInfo {
  line: number;
  column: number;
  match: string;
  context: string;
  replaced?: boolean;
}

const DEFAULT_CONFIG: FindReplaceConfig = {
  caseSensitive: false,
  wholeWords: false,
  useRegex: false,
  replaceAll: true,
  preserveCase: false,
  multiline: false,
  globalSearch: true,
  showStats: true,
  highlightMatches: false,
};

export function findAndReplace(
  input: string,
  findPattern: string,
  replacePattern: string,
  config: FindReplaceConfig = DEFAULT_CONFIG
): ToolResult {
  const startTime = performance.now();

  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'No input text provided'
      };
    }

    if (!findPattern) {
      return {
        success: false,
        error: 'No search pattern provided'
      };
    }

    const stats: FindReplaceStats = {
      totalMatches: 0,
      replacements: 0,
      searchPattern: findPattern,
      replacePattern: replacePattern,
      processingTime: 0,
      linesAffected: 0
    };

    const matches: MatchInfo[] = [];
    let result = input;

    // Build regex pattern based on configuration
    let pattern: RegExp;

    try {
      if (config.useRegex) {
        // User provided regex pattern
        let flags = '';
        if (!config.caseSensitive) flags += 'i';
        if (config.globalSearch) flags += 'g';
        if (config.multiline) flags += 'm';

        pattern = new RegExp(findPattern, flags);
      } else {
        // Escape special regex characters for literal search
        let escapedPattern = findPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Add word boundaries if whole words only
        if (config.wholeWords) {
          escapedPattern = `\\b${escapedPattern}\\b`;
        }

        let flags = '';
        if (!config.caseSensitive) flags += 'i';
        if (config.globalSearch) flags += 'g';
        if (config.multiline) flags += 'm';

        pattern = new RegExp(escapedPattern, flags);
      }
    } catch (regexError) {
      return {
        success: false,
        error: `Invalid regular expression: ${regexError instanceof Error ? regexError.message : 'Unknown regex error'}`
      };
    }

    // Find all matches first for statistics
    const lines = input.split('\n');
    const affectedLines = new Set<number>();

    lines.forEach((line, lineIndex) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(line)) !== null) {
        stats.totalMatches++;
        affectedLines.add(lineIndex);

        // Get context around match (20 chars before and after)
        const start = Math.max(0, match.index - 20);
        const end = Math.min(line.length, match.index + match[0].length + 20);
        const context = line.substring(start, end);

        matches.push({
          line: lineIndex + 1,
          column: match.index + 1,
          match: match[0],
          context: context,
          replaced: false
        });

        // Prevent infinite loop with zero-width matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    });

    stats.linesAffected = affectedLines.size;

    // Perform replacement if replacePattern is provided
    if (replacePattern !== undefined && replacePattern !== null) {
      if (config.replaceAll) {
        // Replace all occurrences
        if (config.preserveCase && !config.useRegex) {
          // Preserve case for simple text replacement
          result = result.replace(pattern, (match) => {
            return preserveCaseReplacement(match, replacePattern);
          });
        } else {
          result = result.replace(pattern, replacePattern);
        }
        stats.replacements = stats.totalMatches;

        // Mark all matches as replaced
        matches.forEach(match => {
          match.replaced = true;
        });
      } else {
        // Replace only first occurrence
        if (config.preserveCase && !config.useRegex) {
          result = result.replace(pattern, (match) => {
            return preserveCaseReplacement(match, replacePattern);
          });
        } else {
          result = result.replace(pattern, replacePattern);
        }
        stats.replacements = stats.totalMatches > 0 ? 1 : 0;

        // Mark only first match as replaced
        if (matches.length > 0) {
          matches[0].replaced = true;
        }
      }
    }

    const endTime = performance.now();
    stats.processingTime = endTime - startTime;

    // Generate output with optional statistics
    let output = result;

    if (config.showStats) {
      const statsText = `
Find & Replace Results:
- Search pattern: "${stats.searchPattern}"
- Replace pattern: "${stats.replacePattern}"
- Total matches found: ${stats.totalMatches.toLocaleString()}
- Replacements made: ${stats.replacements.toLocaleString()}
- Lines affected: ${stats.linesAffected.toLocaleString()}
- Processing time: ${stats.processingTime.toFixed(2)}ms

--- Processed Text ---
`;
      output = statsText + result;
    }

    return {
      success: true,
      output,
      stats,
      matches
    };

  } catch (error) {
    return {
      success: false,
      error: `Find and replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Utility function to preserve case in replacement
function preserveCaseReplacement(original: string, replacement: string): string {
  if (original.length === 0) return replacement;

  let result = '';
  for (let i = 0; i < replacement.length; i++) {
    const originalChar = i < original.length ? original[i] : original[original.length - 1];
    const replaceChar = replacement[i];

    if (originalChar === originalChar.toUpperCase()) {
      result += replaceChar.toUpperCase();
    } else {
      result += replaceChar.toLowerCase();
    }
  }

  return result;
}

export const TEXT_FIND_REPLACE_TOOL: Tool = {
  id: 'text-find-replace',
  name: 'Text Find & Replace - Search and Replace Text Online',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-processing')!,
  slug: 'text-find-replace',
  icon: '🔍',
  keywords: ['text find replace', 'search and replace', 'find and replace online', 'text search', 'replace text', 'regex replace', 'bulk text replace', 'free find replace', 'text editor'],
  seoTitle: 'Free Text Find & Replace Online - Search and Replace Text Tool',
  seoDescription: 'Find and replace text instantly with our free online text search and replace tool. Supports regex, case sensitivity, whole words, and bulk replacements. Works offline and privacy-first.',
  description: 'Free online text find and replace tool that searches and replaces text patterns with advanced options. Supports regular expressions, case sensitivity, whole word matching, and detailed statistics for efficient text processing.',

  examples: [
    {
      title: 'Simple Text Replacement',
      input: `The quick brown fox jumps over the lazy dog.
The quick brown fox is very quick.`,
      output: `The fast brown fox jumps over the lazy dog.
The fast brown fox is very fast.`,
      description: 'Replace all instances of "quick" with "fast"'
    },
    {
      title: 'Email Domain Update',
      input: `Contact us at:
- support@oldcompany.com
- sales@oldcompany.com
- info@oldcompany.com`,
      output: `Contact us at:
- support@newcompany.com
- sales@newcompany.com
- info@newcompany.com`,
      description: 'Update email domains across multiple addresses'
    },
    {
      title: 'Regex Pattern Replacement',
      input: `Phone: (555) 123-4567
Phone: (555) 987-6543
Phone: (555) 246-8135`,
      output: `Phone: 555-123-4567
Phone: 555-987-6543
Phone: 555-246-8135`,
      description: 'Remove parentheses from phone numbers using regex: \\((\\d{3})\\) → $1-'
    }
  ],

  howItWorks: [
    {
      title: "Enter Your Text Data",
      icon: "📝",
      description: "Paste or enter text that needs find and replace operations. Supports any text format including documents, code, CSV data, or configuration files. Processing happens entirely in your browser.",
      keywords: ["text input", "find replace", "text search", "secure text processing"]
    },
    {
      title: "Configure Search Options",
      icon: "⚙️",
      description: "Set search pattern and replacement text. Choose case sensitivity, whole word matching, regex support, and whether to replace all occurrences or just the first match.",
      keywords: ["search options", "regex support", "case sensitivity", "whole word matching"]
    },
    {
      title: "Execute Find & Replace",
      icon: "⚡",
      description: "Click 'Find & Replace' to process your text. The tool highlights matches, performs replacements, and provides detailed statistics about the operation including lines affected.",
      keywords: ["instant replacement", "text processing", "match statistics", "bulk replace"]
    },
    {
      title: "Download Results",
      icon: "💾",
      description: "Copy the processed text or download as a file. Perfect for document editing, code refactoring, data cleaning, and content management tasks.",
      keywords: ["download results", "text processing", "document editing", "code refactoring"]
    }
  ],

  useCases: [
    'Document editing and content management',
    'Code refactoring and variable renaming',
    'Data cleaning and formatting tasks',
    'Email template and form letter updates',
    'Configuration file modifications',
    'URL and link updating across documents',
    'Translation and localization text replacement',
    'Log file analysis and pattern extraction',
    'CSV and data file column updates',
    'Markdown and documentation maintenance'
  ],

  faq: [
    {
      question: 'Is this text find and replace tool free to use?',
      answer: 'Yes, this text find and replace tool is completely free with no limits on text size or number of operations. No registration required, and no watermarks added to processed text.'
    },
    {
      question: 'Is my text data uploaded to your servers?',
      answer: 'No, all text processing happens locally in your browser. Your data never leaves your computer, ensuring complete privacy and security for sensitive documents and information.'
    },
    {
      question: 'Does the tool support regular expressions?',
      answer: 'Yes, you can enable regex mode to use powerful pattern matching with capture groups, character classes, quantifiers, and other advanced regex features for complex find and replace operations.'
    },
    {
      question: 'Can I replace all occurrences or just the first match?',
      answer: 'You can choose to replace all occurrences of the pattern or just the first match. The "Replace All" option is enabled by default for bulk operations, but can be disabled for selective replacement.'
    },
    {
      question: 'How does case sensitivity work?',
      answer: 'When case sensitivity is disabled, "Hello" and "hello" are treated as the same pattern. You can also enable "Preserve Case" to maintain the original capitalization in replacements.'
    },
    {
      question: 'What is whole word matching?',
      answer: 'Whole word matching ensures that the pattern only matches complete words. For example, searching for "cat" with whole words enabled won\'t match "catalog" or "concatenate".'
    },
    {
      question: 'How large files can I process?',
      answer: 'The tool can handle large text files efficiently in your browser. Processing time depends on text size and complexity of patterns, but typical documents process in milliseconds.'
    },
    {
      question: 'Can I see statistics about the replacement operation?',
      answer: 'Yes, the tool provides detailed statistics including total matches found, number of replacements made, lines affected, and processing time to help you understand the operation results.'
    }
  ],

  commonErrors: [
    'Invalid regular expression syntax - check regex pattern for errors',
    'No matches found - verify search pattern and case sensitivity settings',
    'Zero-width regex matches may cause infinite loops - add appropriate quantifiers',
    'Special characters in literal search need escaping when using regex mode',
    'Large files may slow down browser performance - consider processing in smaller chunks'
  ],

  relatedTools: ['line-deduplicator', 'regex-tester', 'text-diff', 'text-statistics']
};