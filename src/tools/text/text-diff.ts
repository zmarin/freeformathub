import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface TextDiffConfig {
  mode: 'line' | 'word' | 'character';
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  showContext: boolean;
  contextLines: number;
}

export interface DiffResult {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  lineNumber?: {
    left?: number;
    right?: number;
  };
}

export interface ToolResult {
  success: boolean;
  output?: string;
  diff?: DiffResult[];
  error?: string;
  stats?: {
    additions: number;
    deletions: number;
    modifications: number;
    unchanged: number;
  };
}

function normalizeText(text: string, config: TextDiffConfig): string {
  let normalized = text;
  
  if (config.ignoreCase) {
    normalized = normalized.toLowerCase();
  }
  
  if (config.ignoreWhitespace) {
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }
  
  return normalized;
}

function splitText(text: string, mode: 'line' | 'word' | 'character'): string[] {
  switch (mode) {
    case 'line':
      return text.split(/\r?\n/);
    case 'word':
      return text.split(/\s+/).filter(word => word.length > 0);
    case 'character':
      return text.split('');
    default:
      return text.split(/\r?\n/);
  }
}

function computeLCS(arr1: string[], arr2: string[]): number[][] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  return dp;
}

function generateDiff(left: string, right: string, config: TextDiffConfig): DiffResult[] {
  const leftNormalized = normalizeText(left, config);
  const rightNormalized = normalizeText(right, config);
  
  const leftLines = splitText(leftNormalized, config.mode);
  const rightLines = splitText(rightNormalized, config.mode);
  const originalLeftLines = splitText(left, config.mode);
  const originalRightLines = splitText(right, config.mode);
  
  const lcs = computeLCS(leftLines, rightLines);
  const diff: DiffResult[] = [];
  
  let i = leftLines.length;
  let j = rightLines.length;
  let leftLineNum = originalLeftLines.length;
  let rightLineNum = originalRightLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      diff.unshift({
        type: 'unchanged',
        content: originalLeftLines[i - 1],
        lineNumber: { left: leftLineNum, right: rightLineNum }
      });
      i--;
      j--;
      leftLineNum--;
      rightLineNum--;
    } else if (i > 0 && (j === 0 || lcs[i - 1][j] >= lcs[i][j - 1])) {
      diff.unshift({
        type: 'removed',
        content: originalLeftLines[i - 1],
        lineNumber: { left: leftLineNum }
      });
      i--;
      leftLineNum--;
    } else {
      diff.unshift({
        type: 'added',
        content: originalRightLines[j - 1],
        lineNumber: { right: rightLineNum }
      });
      j--;
      rightLineNum--;
    }
  }
  
  return diff;
}

function formatDiffOutput(diff: DiffResult[], config: TextDiffConfig): string {
  const lines: string[] = [];
  
  diff.forEach((item, index) => {
    let prefix = '';
    let line = '';
    
    switch (item.type) {
      case 'added':
        prefix = '+ ';
        if (config.mode === 'line') {
          line = `${prefix}${item.content}`;
        } else {
          line = `${prefix}${item.content}`;
        }
        break;
      case 'removed':
        prefix = '- ';
        if (config.mode === 'line') {
          line = `${prefix}${item.content}`;
        } else {
          line = `${prefix}${item.content}`;
        }
        break;
      case 'unchanged':
        if (config.showContext) {
          prefix = '  ';
          line = `${prefix}${item.content}`;
        } else {
          // Skip unchanged lines unless we're showing context
          const prevItem = diff[index - 1];
          const nextItem = diff[index + 1];
          
          if (prevItem && (prevItem.type === 'added' || prevItem.type === 'removed') ||
              nextItem && (nextItem.type === 'added' || nextItem.type === 'removed')) {
            prefix = '  ';
            line = `${prefix}${item.content}`;
          }
        }
        break;
      case 'modified':
        prefix = '~ ';
        line = `${prefix}${item.content}`;
        break;
    }
    
    if (line) {
      if (config.mode === 'line' && item.lineNumber) {
        const leftNum = item.lineNumber.left ? item.lineNumber.left.toString().padStart(4) : '    ';
        const rightNum = item.lineNumber.right ? item.lineNumber.right.toString().padStart(4) : '    ';
        lines.push(`${leftNum} ${rightNum} ${line}`);
      } else {
        lines.push(line);
      }
    }
  });
  
  return lines.join('\n');
}

function calculateStats(diff: DiffResult[]): ToolResult['stats'] {
  const stats = {
    additions: 0,
    deletions: 0,
    modifications: 0,
    unchanged: 0
  };
  
  diff.forEach(item => {
    switch (item.type) {
      case 'added':
        stats.additions++;
        break;
      case 'removed':
        stats.deletions++;
        break;
      case 'modified':
        stats.modifications++;
        break;
      case 'unchanged':
        stats.unchanged++;
        break;
    }
  });
  
  return stats;
}

export function processTextDiff(input: string, config: TextDiffConfig): ToolResult {
  try {
    // Parse input - expect format like "===LEFT===\ntext1\n===RIGHT===\ntext2"
    const parts = input.split(/===\s*(LEFT|RIGHT)\s*===/i);
    
    if (parts.length < 4) {
      return {
        success: false,
        error: 'Please provide text in format: ===LEFT===\\ntext1\\n===RIGHT===\\ntext2'
      };
    }
    
    const leftText = parts[2].trim();
    const rightText = parts[4].trim();
    
    if (!leftText && !rightText) {
      return {
        success: false,
        error: 'Please provide text content to compare'
      };
    }
    
    const diff = generateDiff(leftText, rightText, config);
    const output = formatDiffOutput(diff, config);
    const stats = calculateStats(diff);
    
    return {
      success: true,
      output,
      diff,
      stats
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare text'
    };
  }
}

export const TEXT_DIFF_TOOL: Tool = {
  id: 'text-diff',
  name: 'Text Diff & Compare',
  description: 'Compare two pieces of text and highlight differences with line-by-line, word-by-word, or character-by-character comparison.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-comparison')!,
  slug: 'text-diff',
  icon: 'GitCompare',
  tags: ['diff', 'compare', 'text', 'merge', 'changes', 'version'],
  complexity: 'intermediate',
  keywords: ['diff', 'compare', 'text', 'merge', 'changes', 'version', 'git', 'patch'],
  
  examples: [
    {
      title: 'Basic Text Comparison',
      input: `===LEFT===
Hello World
This is line 2
===RIGHT===
Hello Universe
This is line 2
New line added`,
      output: `- Hello World
+ Hello Universe
  This is line 2
+ New line added`,
      description: 'Compare two text blocks to see differences'
    },
    {
      title: 'Code Comparison',
      input: `===LEFT===
function hello() {
  console.log("Hello");
  return true;
}
===RIGHT===
function hello() {
  console.log("Hello World");
  return false;
}`,
      output: `  function hello() {
-   console.log("Hello");
+   console.log("Hello World");
-   return true;
+   return false;
  }`,
      description: 'Compare code snippets to see changes'
    },
    {
      title: 'Configuration Files',
      input: `===LEFT===
server.port=8080
server.host=localhost
debug=true
===RIGHT===
server.port=3000
server.host=0.0.0.0
debug=false
ssl.enabled=true`,
      output: `- server.port=8080
+ server.port=3000
- server.host=localhost
+ server.host=0.0.0.0
- debug=true
+ debug=false
+ ssl.enabled=true`,
      description: 'Compare configuration files'
    }
  ],
  
  useCases: [
    'Code review and version comparison',
    'Document revision tracking',
    'Configuration file changes',
    'Text editing verification',
    'Content migration validation'
  ],
  
  faq: [
    {
      question: 'How do I format the input for comparison?',
      answer: 'Use ===LEFT=== to mark the original text and ===RIGHT=== to mark the modified text. Each section should be on a new line.'
    },
    {
      question: 'What diff modes are available?',
      answer: 'You can compare by lines (default), words, or individual characters. Line mode is best for code and documents, word mode for content changes, and character mode for precise edits.'
    },
    {
      question: 'Can I ignore whitespace differences?',
      answer: 'Yes, enable "Ignore Whitespace" to focus on content changes rather than formatting differences.'
    },
    {
      question: 'What do the symbols mean?',
      answer: '+ indicates added content, - indicates removed content, and unchanged lines are shown with context when enabled.'
    },
    {
      question: 'How accurate is the diff algorithm?',
      answer: 'We use the Longest Common Subsequence (LCS) algorithm, which is the same method used by professional diff tools like Git.'
    }
  ],
  
  commonErrors: [
    'Missing LEFT or RIGHT markers',
    'Empty comparison',
    'Very large files are slow'
  ],
  
  relatedTools: ['text-statistics', 'string-escape', 'lorem-ipsum'],
  seoTitle: 'Text Diff & Compare Tool - Free Online Text Comparison',
  seoDescription: 'Compare and diff text files online. See differences line-by-line, word-by-word, or character-by-character with visual highlighting.'
};