import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface RegexTesterConfig {
  flags: {
    global: boolean;
    ignoreCase: boolean;
    multiline: boolean;
    dotAll: boolean;
    unicode: boolean;
    sticky: boolean;
  };
  mode: 'test' | 'match' | 'replace' | 'split';
  replacement?: string;
  showGroups: boolean;
  showExplanation: boolean;
  highlightMatches: boolean;
  outputFormat: 'detailed' | 'simple' | 'json';
  testMultipleInputs: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  results?: RegexResult[];
}

interface RegexResult {
  input: string;
  pattern: string;
  flags: string;
  mode: string;
  matches: RegexMatch[];
  isValid: boolean;
  error?: string;
  explanation?: string;
  performance: {
    executionTime: number;
    matchCount: number;
  };
}

interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
  namedGroups: { [key: string]: string };
  fullMatch: string;
}

function buildRegex(pattern: string, flags: RegexTesterConfig['flags']): RegExp {
  let flagString = '';
  if (flags.global) flagString += 'g';
  if (flags.ignoreCase) flagString += 'i';
  if (flags.multiline) flagString += 'm';
  if (flags.dotAll) flagString += 's';
  if (flags.unicode) flagString += 'u';
  if (flags.sticky) flagString += 'y';
  
  return new RegExp(pattern, flagString);
}

function validateRegexPattern(pattern: string): { isValid: boolean; error?: string } {
  try {
    new RegExp(pattern);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid regex pattern'
    };
  }
}

function explainRegexPattern(pattern: string): string {
  let explanation = 'Regex Pattern Breakdown:\n\n';
  
  const components = [];
  
  if (pattern.includes('^')) components.push('^ - Start of string/line');
  if (pattern.includes('$')) components.push('$ - End of string/line');
  if (pattern.includes('\\d')) components.push('\\d - Any digit (0-9)');
  if (pattern.includes('\\w')) components.push('\\w - Any word character (a-z, A-Z, 0-9, _)');
  if (pattern.includes('\\s')) components.push('\\s - Any whitespace character');
  if (pattern.includes('.')) components.push('. - Any character (except newline)');
  if (pattern.includes('*')) components.push('* - Zero or more of the preceding element');
  if (pattern.includes('+')) components.push('+ - One or more of the preceding element');
  if (pattern.includes('?')) components.push('? - Zero or one of the preceding element');
  if (pattern.includes('[')) components.push('[...] - Character class (any one of the characters)');
  if (pattern.includes('(')) components.push('(...) - Capturing group');
  if (pattern.includes('(?:')) components.push('(?:...) - Non-capturing group');
  if (pattern.includes('(?=')) components.push('(?=...) - Positive lookahead');
  if (pattern.includes('(?!')) components.push('(?!...) - Negative lookahead');
  if (pattern.includes('|')) components.push('| - OR operator (alternation)');
  if (pattern.includes('{')) components.push('{n,m} - Between n and m repetitions');
  
  if (components.length > 0) {
    explanation += components.join('\n') + '\n\n';
  }
  
  return explanation;
}

function performRegexTest(input: string, regex: RegExp, mode: string, replacement?: string): {
  matches: RegexMatch[];
  result?: any;
  error?: string;
} {
  try {
    const matches: RegexMatch[] = [];
    let result: any;
    
    switch (mode) {
      case 'test':
        result = regex.test(input);
        if (result && regex.global) {
          const displayRegex = new RegExp(regex.source, regex.flags);
          let match;
          while ((match = displayRegex.exec(input)) !== null) {
            matches.push({
              match: match[0],
              index: match.index,
              groups: Array.from(match).slice(1),
              namedGroups: match.groups || {},
              fullMatch: match[0],
            });
            if (!regex.global) break;
          }
        }
        break;
        
      case 'match':
        if (regex.global) {
          const allMatches = input.matchAll(regex);
          for (const match of allMatches) {
            matches.push({
              match: match[0],
              index: match.index || 0,
              groups: Array.from(match).slice(1),
              namedGroups: match.groups || {},
              fullMatch: match[0],
            });
          }
          result = matches.map(m => m.match);
        } else {
          const match = input.match(regex);
          if (match) {
            matches.push({
              match: match[0],
              index: match.index || 0,
              groups: Array.from(match).slice(1),
              namedGroups: match.groups || {},
              fullMatch: match[0],
            });
            result = match;
          } else {
            result = null;
          }
        }
        break;
        
      case 'replace':
        result = input.replace(regex, replacement || '');
        if (regex.global) {
          const displayRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
          let match;
          let lastIndex = 0;
          while ((match = displayRegex.exec(input)) !== null && lastIndex < input.length) {
            matches.push({
              match: match[0],
              index: match.index,
              groups: Array.from(match).slice(1),
              namedGroups: match.groups || {},
              fullMatch: match[0],
            });
            lastIndex = match.index + match[0].length;
            displayRegex.lastIndex = lastIndex;
          }
        }
        break;
        
      case 'split':
        result = input.split(regex);
        let match;
        const tempRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
        while ((match = tempRegex.exec(input)) !== null) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: Array.from(match).slice(1),
            namedGroups: match.groups || {},
            fullMatch: match[0],
          });
        }
        break;
        
      default:
        throw new Error(`Unsupported mode: ${mode}`);
    }
    
    return { matches, result };
  } catch (error) {
    return {
      matches: [],
      error: error instanceof Error ? error.message : 'Regex execution failed'
    };
  }
}

function highlightMatches(input: string, matches: RegexMatch[]): string {
  if (matches.length === 0) return input;
  
  let highlighted = input;
  let offset = 0;
  
  const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
  
  for (const match of sortedMatches) {
    const start = match.index + offset;
    const end = start + match.match.length;
    
    const before = highlighted.substring(0, start);
    const matchText = highlighted.substring(start, end);
    const after = highlighted.substring(end);
    
    highlighted = `${before}**${matchText}**${after}`;
    offset += 4;
  }
  
  return highlighted;
}

function formatOutput(results: RegexResult[], config: RegexTesterConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(results, null, 2);
  }
  
  if (config.outputFormat === 'simple') {
    return formatSimpleOutput(results, config);
  }
  
  return formatDetailedOutput(results, config);
}

function formatSimpleOutput(results: RegexResult[], config: RegexTesterConfig): string {
  let output = '';
  
  for (const result of results) {
    if (!result.isValid) {
      output += `❌ Error: ${result.error}\n\n`;
      continue;
    }
    
    if (config.mode === 'test') {
      const hasMatches = result.matches.length > 0;
      output += `${hasMatches ? '✅' : '❌'} Match: ${hasMatches ? 'Yes' : 'No'}\n`;
      if (hasMatches) {
        output += `Found ${result.matches.length} match(es)\n`;
      }
    } else if (config.mode === 'match') {
      output += `Found ${result.matches.length} match(es):\n`;
      for (const match of result.matches) {
        output += `- "${match.match}" at position ${match.index}\n`;
      }
    }
    
    output += '\n';
  }
  
  return output.trim();
}

function formatDetailedOutput(results: RegexResult[], config: RegexTesterConfig): string {
  let output = '# Regular Expression Test Results\n\n';
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    
    if (results.length > 1) {
      output += `## Test Case #${i + 1}\n\n`;
    }
    
    output += '### 🔍 Pattern Information\n\n';
    output += `**Pattern**: \`${result.pattern}\`\n`;
    output += `**Flags**: ${result.flags || 'none'}\n`;
    output += `**Mode**: ${result.mode}\n`;
    output += `**Execution Time**: ${result.performance.executionTime}ms\n\n`;
    
    if (config.showExplanation) {
      output += '### 📝 Pattern Explanation\n\n';
      output += '```\n';
      output += result.explanation || 'No explanation available';
      output += '\n```\n\n';
    }
    
    if (!result.isValid) {
      output += '### ❌ Error\n\n';
      output += `**Error**: ${result.error}\n\n`;
      continue;
    }
    
    switch (result.mode) {
      case 'test':
        output += '### ✅ Test Result\n\n';
        const hasMatches = result.matches.length > 0;
        output += `**Match Found**: ${hasMatches ? 'Yes ✅' : 'No ❌'}\n`;
        output += `**Match Count**: ${result.matches.length}\n\n`;
        break;
      case 'match':
        output += '### 🎯 Match Results\n\n';
        output += `**Total Matches**: ${result.matches.length}\n\n`;
        break;
      case 'replace':
        output += '### 🔄 Replace Result\n\n';
        output += `**Replacements Made**: ${result.matches.length}\n\n`;
        break;
      case 'split':
        output += '### ✂️ Split Result\n\n';
        output += `**Separators Found**: ${result.matches.length}\n\n`;
        break;
    }
    
    if (result.matches.length > 0) {
      output += '### 📋 Match Details\n\n';
      
      if (config.highlightMatches) {
        output += '**Input with Matches Highlighted:**\n';
        output += '```\n';
        output += highlightMatches(result.input, result.matches);
        output += '\n```\n\n';
      }
      
      output += '| # | Match | Position | Length |\n';
      output += '|---|--------|----------|--------|\n';
      
      result.matches.forEach((match, index) => {
        output += `| ${index + 1} | \`${match.match}\` | ${match.index} | ${match.match.length} |\n`;
      });
      output += '\n';
      
      if (config.showGroups) {
        const hasGroups = result.matches.some(m => m.groups.length > 0 || Object.keys(m.namedGroups).length > 0);
        
        if (hasGroups) {
          output += '#### 🎯 Capture Groups\n\n';
          
          result.matches.forEach((match, index) => {
            if (match.groups.length > 0 || Object.keys(match.namedGroups).length > 0) {
              output += `**Match ${index + 1} Groups:**\n`;
              
              if (match.groups.length > 0) {
                match.groups.forEach((group, groupIndex) => {
                  output += `- Group ${groupIndex + 1}: \`${group || '(empty)'}\`\n`;
                });
              }
              
              if (Object.keys(match.namedGroups).length > 0) {
                for (const [name, value] of Object.entries(match.namedGroups)) {
                  output += `- ${name}: \`${value || '(empty)'}\`\n`;
                }
              }
              
              output += '\n';
            }
          });
        }
      }
    } else {
      output += '**No matches found**\n\n';
    }
    
    output += '### ⚡ Performance\n\n';
    output += `**Execution Time**: ${result.performance.executionTime}ms\n`;
    output += `**Match Count**: ${result.performance.matchCount}\n\n`;
    
    if (i < results.length - 1) {
      output += '---\n\n';
    }
  }
  
  output += '---\n*Regular expression testing powered by FreeFormatHub*';
  
  return output;
}

export function processRegexTest(input: string, config: RegexTesterConfig, pattern: string): ToolResult {
  const startTime = Date.now();
  
  try {
    if (!pattern.trim()) {
      return {
        success: false,
        error: 'Please provide a regular expression pattern to test'
      };
    }

    if (!input.trim() && config.mode !== 'test') {
      return {
        success: false,
        error: 'Please provide input text to test the pattern against'
      };
    }

    const validation = validateRegexPattern(pattern);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid regex pattern: ${validation.error}`
      };
    }

    const inputs = config.testMultipleInputs 
      ? input.split('\n').filter(line => line.trim())
      : [input];

    if (inputs.length === 0) {
      inputs.push('');
    }

    const results: RegexResult[] = [];

    for (const testInput of inputs) {
      try {
        const regex = buildRegex(pattern, config.flags);
        const flagString = Object.entries(config.flags)
          .filter(([_, enabled]) => enabled)
          .map(([flag, _]) => flag.charAt(0))
          .join('');

        const testResult = performRegexTest(testInput, regex, config.mode, config.replacement);
        const explanation = config.showExplanation ? explainRegexPattern(pattern) : undefined;
        const endTime = Date.now();

        results.push({
          input: testInput,
          pattern,
          flags: flagString,
          mode: config.mode,
          matches: testResult.matches,
          isValid: !testResult.error,
          error: testResult.error,
          explanation,
          performance: {
            executionTime: endTime - startTime,
            matchCount: testResult.matches.length,
          },
        });

      } catch (error) {
        results.push({
          input: testInput,
          pattern,
          flags: '',
          mode: config.mode,
          matches: [],
          isValid: false,
          error: error instanceof Error ? error.message : 'Regex test failed',
          performance: {
            executionTime: Date.now() - startTime,
            matchCount: 0,
          },
        });
      }
    }

    const output = formatOutput(results, config);

    return {
      success: true,
      output,
      results
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process regex test'
    };
  }
}

export const REGEX_TESTER_TOOL: Tool = {
  id: 'regex-tester',
  name: 'Regular Expression Tester',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'regex-tools')!,
  slug: 'regex-tester',
  icon: '🔍',
  keywords: ['regex', 'regexp', 'regular', 'expression', 'pattern', 'match', 'test', 'validation', 'search'],
  seoTitle: 'Regex Tester - Test Regular Expressions Online | FreeFormatHub',
  seoDescription: 'Test and debug regular expressions with real-time matching, group capture, pattern explanation, and multiple test modes. Support for all JavaScript regex features.',
  description: 'Test and debug regular expressions with real-time pattern matching, group capture analysis, and comprehensive pattern explanations. Supports all JavaScript regex features and flags.',
  
  examples: [
    {
      title: 'Email Validation',
      input: `user@example.com
invalid-email
test.email@domain.co.uk`,
      output: `# Regular Expression Test Results

### 🔍 Pattern Information

**Pattern**: \`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\`
**Flags**: m
**Mode**: test

### ✅ Test Result

**Match Found**: Yes ✅
**Match Count**: 2

### 📋 Match Details

| # | Match | Position | Length |
|---|--------|----------|--------|
| 1 | \`user@example.com\` | 0 | 16 |
| 2 | \`test.email@domain.co.uk\` | 32 | 23 |

---
*Regular expression testing powered by FreeFormatHub*`,
      description: 'Test email validation pattern against multiple inputs'
    },
    {
      title: 'Extract Numbers',
      input: 'Price: $29.99, Tax: $2.40, Total: $32.39',
      output: `# Regular Expression Test Results

### 🔍 Pattern Information

**Pattern**: \`\\d+\\.\\d+\`
**Flags**: g
**Mode**: match

### 🎯 Match Results

**Total Matches**: 3

### 📋 Match Details

| # | Match | Position | Length |
|---|--------|----------|--------|
| 1 | \`29.99\` | 8 | 5 |
| 2 | \`2.40\` | 21 | 4 |
| 3 | \`32.39\` | 34 | 5 |

---
*Regular expression testing powered by FreeFormatHub*`,
      description: 'Extract decimal numbers from text'
    }
  ],
  
  useCases: [
    'Form validation and input sanitization',
    'Data extraction from text files',
    'Search and replace operations',
    'Log file parsing and analysis',
    'URL and email validation',
    'Pattern matching in code editors'
  ],
  
  faq: [
    {
      question: 'What regex flags are supported?',
      answer: 'All JavaScript regex flags: global (g), ignore case (i), multiline (m), dotAll (s), unicode (u), and sticky (y). Each flag can be toggled individually.'
    },
    {
      question: 'How do I test against multiple inputs?',
      answer: 'Enable "Test Multiple Inputs" and enter each test string on a separate line. The tool will test your pattern against all inputs and show results for each.'
    },
    {
      question: 'Can I see capture groups?',
      answer: 'Yes! Enable "Show Groups" to see both numbered capture groups and named groups. The tool displays the content of each group for every match.'
    },
    {
      question: 'What test modes are available?',
      answer: 'Four modes: Test (boolean match), Match (find matches), Replace (substitute text), and Split (divide text). Each mode provides different output and functionality.'
    },
    {
      question: 'How does pattern explanation work?',
      answer: 'The tool analyzes your regex pattern and explains common components like anchors, quantifiers, character classes, and other regex elements.'
    }
  ],
  
  commonErrors: [
    'Unescaped special characters - use backslash to escape . + * ? ^ $ { } ( ) | [ ]',
    'Unmatched brackets or parentheses - ensure all groups are properly closed',
    'Invalid character class - check square bracket syntax [a-z]',
    'Quantifier without target - quantifiers must follow a character or group',
    'Catastrophic backtracking - avoid nested quantifiers in complex patterns'
  ],

  relatedTools: ['text-diff', 'string-escape', 'mock-data-generator', 'text-statistics']
};