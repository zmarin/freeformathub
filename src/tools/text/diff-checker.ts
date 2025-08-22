import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface DiffCheckerConfig {
  diffType: 'unified' | 'split' | 'inline';
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  showLineNumbers: boolean;
  contextLines: number;
  highlightWords: boolean;
  compareMode: 'text' | 'json' | 'code';
  showStats: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  diffData?: DiffData;
  stats?: DiffStats;
}

interface DiffData {
  changes: DiffChange[];
  additions: number;
  deletions: number;
  modifications: number;
  unchanged: number;
}

interface DiffChange {
  type: 'add' | 'remove' | 'modify' | 'unchanged';
  oldLine?: number;
  newLine?: number;
  content: string;
  oldContent?: string;
  newContent?: string;
}

interface DiffStats {
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  linesUnchanged: number;
  totalLines: number;
  similarity: number;
}

// Simple diff algorithm implementation
function computeLineDiff(oldLines: string[], newLines: string[], config: DiffCheckerConfig): DiffChange[] {
  const changes: DiffChange[] = [];
  
  // Preprocessing for options
  const processLine = (line: string): string => {
    let processed = line;
    if (config.ignoreWhitespace) {
      processed = processed.replace(/\s+/g, ' ').trim();
    }
    if (config.ignoreCase) {
      processed = processed.toLowerCase();
    }
    return processed;
  };
  
  const processedOldLines = oldLines.map(processLine);
  const processedNewLines = newLines.map(processLine);
  
  // Simple LCS-based diff algorithm
  const lcs = computeLCS(processedOldLines, processedNewLines);
  
  let oldIndex = 0;
  let newIndex = 0;
  let lcsIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (lcsIndex < lcs.length && 
        oldIndex < oldLines.length && 
        newIndex < newLines.length &&
        processedOldLines[oldIndex] === lcs[lcsIndex] &&
        processedNewLines[newIndex] === lcs[lcsIndex]) {
      // Unchanged line
      changes.push({
        type: 'unchanged',
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
        content: oldLines[oldIndex]
      });
      oldIndex++;
      newIndex++;
      lcsIndex++;
    } else if (oldIndex < oldLines.length && 
               (lcsIndex >= lcs.length || processedOldLines[oldIndex] !== lcs[lcsIndex])) {
      // Line was deleted
      changes.push({
        type: 'remove',
        oldLine: oldIndex + 1,
        content: oldLines[oldIndex]
      });
      oldIndex++;
    } else if (newIndex < newLines.length && 
               (lcsIndex >= lcs.length || processedNewLines[newIndex] !== lcs[lcsIndex])) {
      // Line was added
      changes.push({
        type: 'add',
        newLine: newIndex + 1,
        content: newLines[newIndex]
      });
      newIndex++;
    }
  }
  
  return changes;
}

// Longest Common Subsequence algorithm
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Build DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Reconstruct LCS
  const lcs: string[] = [];
  let i = m, j = n;
  
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

function generateUnifiedDiff(changes: DiffChange[], config: DiffCheckerConfig): string {
  let output = '';
  let contextBuffer: DiffChange[] = [];
  let hasChangesInGroup = false;
  let oldLineNum = 1;
  let newLineNum = 1;
  
  const flushContext = () => {
    if (hasChangesInGroup && contextBuffer.length > 0) {
      // Add context lines before changes
      const beforeContext = contextBuffer.slice(-config.contextLines);
      beforeContext.forEach(change => {
        output += ` ${change.content}\n`;
      });
      contextBuffer = [];
      hasChangesInGroup = false;
    }
  };
  
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    
    if (change.type === 'unchanged') {
      contextBuffer.push(change);
      
      // If we have too much context, flush old context
      if (contextBuffer.length > config.contextLines * 2) {
        if (hasChangesInGroup) {
          // Add context after previous changes
          const afterContext = contextBuffer.slice(0, config.contextLines);
          afterContext.forEach(ctx => {
            output += ` ${ctx.content}\n`;
          });
          output += '...\n';
        }
        contextBuffer = contextBuffer.slice(-config.contextLines);
        hasChangesInGroup = false;
      }
    } else {
      // Flush context before changes
      flushContext();
      hasChangesInGroup = true;
      
      if (change.type === 'add') {
        output += `+ ${change.content}\n`;
      } else if (change.type === 'remove') {
        output += `- ${change.content}\n`;
      }
      
      contextBuffer = [];
    }
  }
  
  // Flush remaining context
  if (hasChangesInGroup && contextBuffer.length > 0) {
    const afterContext = contextBuffer.slice(0, config.contextLines);
    afterContext.forEach(change => {
      output += ` ${change.content}\n`;
    });
  }
  
  return output;
}

function generateSplitDiff(changes: DiffChange[], config: DiffCheckerConfig): string {
  let output = '```diff\n';
  output += 'OLD (Left) | NEW (Right)\n';
  output += '----------------------------------------\n';
  
  let oldLineNum = 1;
  let newLineNum = 1;
  
  for (const change of changes) {
    const lineNumPrefix = config.showLineNumbers 
      ? `${String(change.oldLine || '').padStart(4)} | ${String(change.newLine || '').padStart(4)} | `
      : '';
    
    switch (change.type) {
      case 'unchanged':
        output += `${lineNumPrefix}  ${change.content}\n`;
        break;
      case 'add':
        output += `${lineNumPrefix}+ ${change.content}\n`;
        break;
      case 'remove':
        output += `${lineNumPrefix}- ${change.content}\n`;
        break;
    }
  }
  
  output += '```';
  return output;
}

function generateInlineDiff(changes: DiffChange[], config: DiffCheckerConfig): string {
  let output = '';
  
  for (const change of changes) {
    const linePrefix = config.showLineNumbers && change.oldLine 
      ? `${change.oldLine.toString().padStart(4)}: `
      : '';
    
    switch (change.type) {
      case 'unchanged':
        output += `${linePrefix}  ${change.content}\n`;
        break;
      case 'add':
        output += `${linePrefix}+ ${change.content}\n`;
        break;
      case 'remove':
        output += `${linePrefix}- ${change.content}\n`;
        break;
    }
  }
  
  return output;
}

function calculateSimilarity(changes: DiffChange[]): number {
  const unchanged = changes.filter(c => c.type === 'unchanged').length;
  const total = changes.length;
  return total > 0 ? Math.round((unchanged / total) * 100) : 100;
}

function generateDiffStats(changes: DiffChange[]): DiffStats {
  const linesAdded = changes.filter(c => c.type === 'add').length;
  const linesDeleted = changes.filter(c => c.type === 'remove').length;
  const linesModified = Math.min(linesAdded, linesDeleted); // Approximation
  const linesUnchanged = changes.filter(c => c.type === 'unchanged').length;
  const totalLines = changes.length;
  const similarity = calculateSimilarity(changes);
  
  return {
    linesAdded,
    linesDeleted,
    linesModified,
    linesUnchanged,
    totalLines,
    similarity
  };
}

function compareJSON(oldText: string, newText: string): string {
  try {
    const oldObj = JSON.parse(oldText);
    const newObj = JSON.parse(newText);
    
    // Format both objects for comparison
    const oldFormatted = JSON.stringify(oldObj, null, 2);
    const newFormatted = JSON.stringify(newObj, null, 2);
    
    return `JSON Comparison:
OLD JSON:
${oldFormatted}

NEW JSON:
${newFormatted}

Structural Differences:
${compareObjectStructure(oldObj, newObj, '')}`;
  } catch (error) {
    return 'Invalid JSON format in one or both inputs';
  }
}

function compareObjectStructure(obj1: any, obj2: any, path: string): string {
  let differences = '';
  
  if (typeof obj1 !== typeof obj2) {
    differences += `${path}: Type changed from ${typeof obj1} to ${typeof obj2}\n`;
    return differences;
  }
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      differences += `${path}: Array length changed from ${obj1.length} to ${obj2.length}\n`;
    }
    const maxLength = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLength; i++) {
      const newPath = `${path}[${i}]`;
      if (i >= obj1.length) {
        differences += `${newPath}: Added\n`;
      } else if (i >= obj2.length) {
        differences += `${newPath}: Removed\n`;
      } else if (typeof obj1[i] === 'object' && typeof obj2[i] === 'object') {
        differences += compareObjectStructure(obj1[i], obj2[i], newPath);
      } else if (obj1[i] !== obj2[i]) {
        differences += `${newPath}: Changed from ${JSON.stringify(obj1[i])} to ${JSON.stringify(obj2[i])}\n`;
      }
    }
  } else if (obj1 && obj2 && typeof obj1 === 'object' && typeof obj2 === 'object') {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      if (!(key in obj1)) {
        differences += `${newPath}: Added\n`;
      } else if (!(key in obj2)) {
        differences += `${newPath}: Removed\n`;
      } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        differences += compareObjectStructure(obj1[key], obj2[key], newPath);
      } else if (obj1[key] !== obj2[key]) {
        differences += `${newPath}: Changed from ${JSON.stringify(obj1[key])} to ${JSON.stringify(obj2[key])}\n`;
      }
    }
  } else if (obj1 !== obj2) {
    differences += `${path}: Changed from ${JSON.stringify(obj1)} to ${JSON.stringify(obj2)}\n`;
  }
  
  return differences;
}

export function processDiffChecker(oldText: string, newText: string, config: DiffCheckerConfig): ToolResult {
  try {
    if (!oldText && !newText) {
      return {
        success: false,
        error: 'Please provide both old and new text to compare'
      };
    }

    // Handle JSON comparison mode
    if (config.compareMode === 'json') {
      const jsonDiff = compareJSON(oldText, newText);
      return {
        success: true,
        output: jsonDiff
      };
    }

    // Split texts into lines
    const oldLines = oldText.split(/\r?\n/);
    const newLines = newText.split(/\r?\n/);
    
    // Compute diff
    const changes = computeLineDiff(oldLines, newLines, config);
    
    // Generate output based on diff type
    let output = '';
    
    switch (config.diffType) {
      case 'unified':
        output = generateUnifiedDiff(changes, config);
        break;
      case 'split':
        output = generateSplitDiff(changes, config);
        break;
      case 'inline':
        output = generateInlineDiff(changes, config);
        break;
    }
    
    // Generate statistics
    const stats = generateDiffStats(changes);
    
    // Add header with file info
    const header = `Diff Comparison (${config.diffType})\n${'='.repeat(50)}\n`;
    output = header + output;
    
    // Add statistics if enabled
    if (config.showStats) {
      const statsOutput = `\n\nStatistics:\n${'='.repeat(20)}\n`;
      output += statsOutput;
      output += `Lines Added: ${stats.linesAdded}\n`;
      output += `Lines Deleted: ${stats.linesDeleted}\n`;
      output += `Lines Modified: ${stats.linesModified}\n`;
      output += `Lines Unchanged: ${stats.linesUnchanged}\n`;
      output += `Similarity: ${stats.similarity}%\n`;
    }
    
    const diffData: DiffData = {
      changes,
      additions: stats.linesAdded,
      deletions: stats.linesDeleted,
      modifications: stats.linesModified,
      unchanged: stats.linesUnchanged
    };

    return {
      success: true,
      output,
      diffData,
      stats: config.showStats ? stats : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compute diff'
    };
  }
}

export const DIFF_CHECKER_TOOL: Tool = {
  id: 'diff-checker',
  name: 'Diff Checker',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-comparison')!,
  slug: 'diff-checker',
  icon: "📄",
  keywords: ['diff', 'compare', 'text', 'code', 'changes', 'version', 'git', 'merge'],
  seoTitle: 'Diff Checker - Compare Text & Code Changes | FreeFormatHub',
  seoDescription: 'Compare text and code files to see differences. Generate unified, split, or inline diffs with statistics. Perfect for code reviews and version control.',
  description: 'Compare two texts or code files to identify differences. Generate professional diff outputs in multiple formats with detailed statistics and analysis.',

  examples: [
    {
      title: 'Simple Text Comparison',
      input: `OLD TEXT:
Hello World
This is line 2
This is line 3

NEW TEXT:
Hello Universe
This is line 2
This is line 3 modified
Line 4 added`,
      output: `Diff Comparison (unified)
==================================================
- Hello World
+ Hello Universe
  This is line 2
- This is line 3
+ This is line 3 modified
+ Line 4 added

Statistics:
====================
Lines Added: 3
Lines Deleted: 2
Lines Modified: 2
Lines Unchanged: 1
Similarity: 25%`,
      description: 'Basic text comparison showing additions, deletions, and modifications'
    },
    {
      title: 'JSON Structure Comparison',
      input: `OLD JSON:
{
  "name": "John",
  "age": 30,
  "city": "New York"
}

NEW JSON:
{
  "name": "John",
  "age": 31,
  "city": "Los Angeles",
  "email": "john@example.com"
}`,
      output: `JSON Comparison:
Structural Differences:
age: Changed from 30 to 31
city: Changed from "New York" to "Los Angeles"  
email: Added`,
      description: 'JSON-aware comparison highlighting structural changes'
    }
  ],

  useCases: [
    'Code review and pull request analysis',
    'Comparing configuration files and settings',
    'Version control diff visualization',
    'Document revision tracking and comparison',
    'API response comparison and validation',
    'Database schema change detection',
    'Merge conflict resolution assistance',
    'Template and boilerplate code comparison'
  ],

  faq: [
    {
      question: 'What\'s the difference between unified, split, and inline diffs?',
      answer: 'Unified shows changes in a single column with +/- prefixes (like Git). Split shows old and new side-by-side. Inline shows changes in sequence with clear indicators.'
    },
    {
      question: 'How does the similarity percentage work?',
      answer: 'Similarity is calculated as the percentage of unchanged lines compared to total lines. Higher percentages indicate more similar content.'
    },
    {
      question: 'Can it ignore whitespace and case differences?',
      answer: 'Yes, enable "Ignore Whitespace" to treat spacing changes as identical, and "Ignore Case" for case-insensitive comparison. Useful for comparing code with different formatting.'
    },
    {
      question: 'What is JSON comparison mode?',
      answer: 'JSON mode parses both inputs as JSON and compares the structure, showing added/removed/changed properties rather than line-by-line text differences.'
    },
    {
      question: 'How do context lines work in unified diff?',
      answer: 'Context lines show unchanged content around changes to provide context. More context lines help understand the change location but create longer output.'
    }
  ],

  commonErrors: [
    'One or both inputs are empty (both are required for comparison)',
    'Invalid JSON when using JSON comparison mode',
    'Very large files may cause performance issues',
    'Binary or non-text content may not display correctly',
    'Extremely long lines may be truncated in display'
  ],

  relatedTools: ['text-diff', 'json-formatter', 'file-merger', 'version-compare', 'git-diff']
};