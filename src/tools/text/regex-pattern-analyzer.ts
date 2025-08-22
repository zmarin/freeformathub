import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface RegexPatternAnalyzerConfig {
  mode: 'analyze' | 'extract' | 'test' | 'explain';
  flags: string;
  outputFormat: 'matches' | 'groups' | 'positions' | 'all';
  caseSensitive: boolean;
  multiline: boolean;
  dotAll: boolean;
  global: boolean;
  unicode: boolean;
  sticky: boolean;
  showExplanation: boolean;
  highlightMatches: boolean;
  maxMatches: number;
  groupNames: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  analysis?: RegexAnalysis;
  matches?: RegexMatch[];
  explanation?: RegexExplanation;
}

interface RegexAnalysis {
  pattern: string;
  flags: string;
  isValid: boolean;
  complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  features: string[];
  warnings: string[];
  suggestions: string[];
  performance: RegexPerformance;
}

interface RegexMatch {
  fullMatch: string;
  groups: (string | undefined)[];
  namedGroups: Record<string, string>;
  index: number;
  lastIndex: number;
  input: string;
  length: number;
}

interface RegexExplanation {
  pattern: string;
  breakdown: ExplanationPart[];
  summary: string;
  examples: string[];
}

interface ExplanationPart {
  part: string;
  description: string;
  type: 'literal' | 'quantifier' | 'group' | 'class' | 'anchor' | 'assertion' | 'flag';
  position: number;
}

interface RegexPerformance {
  backtrackingRisk: 'low' | 'medium' | 'high';
  timeComplexity: string;
  optimizationSuggestions: string[];
}

// Common regex patterns with explanations
export const REGEX_PATTERNS = [
  {
    id: 'email',
    name: 'Email Address',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    description: 'Validates email addresses',
    flags: 'i',
    examples: ['user@example.com', 'test.email+tag@domain.co.uk']
  },
  {
    id: 'phone-us',
    name: 'US Phone Number',
    pattern: '^(?:\\+?1[-. ]?)?\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$',
    description: 'Matches US phone numbers in various formats',
    flags: '',
    examples: ['(555) 123-4567', '+1-555-123-4567', '555.123.4567']
  },
  {
    id: 'url',
    name: 'URL/URI',
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    description: 'Matches HTTP and HTTPS URLs',
    flags: 'i',
    examples: ['https://example.com', 'http://www.site.org/path?query=1']
  },
  {
    id: 'ip-address',
    name: 'IP Address',
    pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
    description: 'Validates IPv4 addresses',
    flags: '',
    examples: ['192.168.1.1', '10.0.0.1', '255.255.255.255']
  },
  {
    id: 'credit-card',
    name: 'Credit Card',
    pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$',
    description: 'Validates major credit card formats',
    flags: '',
    examples: ['4111111111111111', '5555555555554444']
  },
  {
    id: 'hex-color',
    name: 'Hex Color',
    pattern: '^#(?:[0-9a-fA-F]{3}){1,2}$',
    description: 'Matches hex color codes',
    flags: '',
    examples: ['#FF0000', '#f00', '#123ABC']
  },
  {
    id: 'uuid',
    name: 'UUID',
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    description: 'Matches UUID/GUID format',
    flags: 'i',
    examples: ['550e8400-e29b-41d4-a716-446655440000']
  }
];

// Regex explanation patterns
const REGEX_EXPLANATIONS: Record<string, string> = {
  '^': 'Start of string/line anchor',
  '$': 'End of string/line anchor',
  '.': 'Any character except newline',
  '*': 'Zero or more of the preceding element',
  '+': 'One or more of the preceding element',
  '?': 'Zero or one of the preceding element',
  '{n}': 'Exactly n occurrences',
  '{n,}': 'n or more occurrences',
  '{n,m}': 'Between n and m occurrences',
  '[]': 'Character class (any one character)',
  '[^]': 'Negated character class',
  '()': 'Capturing group',
  '(?:)': 'Non-capturing group',
  '(?=)': 'Positive lookahead',
  '(?!)': 'Negative lookahead',
  '(?<=)': 'Positive lookbehind',
  '(?<!)': 'Negative lookbehind',
  '\\d': 'Any digit character (0-9)',
  '\\D': 'Any non-digit character',
  '\\w': 'Any word character (a-z, A-Z, 0-9, _)',
  '\\W': 'Any non-word character',
  '\\s': 'Any whitespace character',
  '\\S': 'Any non-whitespace character',
  '|': 'Alternation (OR operator)'
};

function buildRegexFlags(config: RegexPatternAnalyzerConfig): string {
  let flags = config.flags || '';
  
  // Remove duplicates and build from config
  const flagSet = new Set(flags.split(''));
  
  if (config.global && !flagSet.has('g')) flagSet.add('g');
  if (!config.caseSensitive && !flagSet.has('i')) flagSet.add('i');
  if (config.multiline && !flagSet.has('m')) flagSet.add('m');
  if (config.dotAll && !flagSet.has('s')) flagSet.add('s');
  if (config.unicode && !flagSet.has('u')) flagSet.add('u');
  if (config.sticky && !flagSet.has('y')) flagSet.add('y');
  
  return Array.from(flagSet).sort().join('');
}

function analyzeRegexPattern(pattern: string, flags: string): RegexAnalysis {
  const analysis: RegexAnalysis = {
    pattern,
    flags,
    isValid: true,
    complexity: 'simple',
    features: [],
    warnings: [],
    suggestions: [],
    performance: {
      backtrackingRisk: 'low',
      timeComplexity: 'O(n)',
      optimizationSuggestions: []
    }
  };
  
  try {
    // Test if regex is valid
    new RegExp(pattern, flags);
  } catch (error) {
    analysis.isValid = false;
    analysis.warnings.push(`Invalid regex: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return analysis;
  }
  
  let complexityScore = 0;
  
  // Detect features and calculate complexity
  const featurePatterns = [
    { pattern: /\^|\$/, feature: 'Anchors', weight: 1 },
    { pattern: /\[.*?\]/, feature: 'Character classes', weight: 2 },
    { pattern: /\(.*?\)/, feature: 'Groups', weight: 2 },
    { pattern: /\*|\+|\?|\{.*?\}/, feature: 'Quantifiers', weight: 2 },
    { pattern: /\|/, feature: 'Alternation', weight: 3 },
    { pattern: /\(\?\=|\(\?\!|\(\?\<\=|\(\?\<\!/, feature: 'Lookarounds', weight: 4 },
    { pattern: /\\[dwsWDS]/, feature: 'Character escapes', weight: 1 },
    { pattern: /\(\?\:/, feature: 'Non-capturing groups', weight: 1 },
    { pattern: /\(\?\<\w+\>/, feature: 'Named groups', weight: 2 }
  ];
  
  featurePatterns.forEach(({ pattern: featurePattern, feature, weight }) => {
    const matches = pattern.match(new RegExp(featurePattern.source, 'g'));
    if (matches) {
      analysis.features.push(feature);
      complexityScore += matches.length * weight;
    }
  });
  
  // Determine complexity level
  if (complexityScore <= 5) analysis.complexity = 'simple';
  else if (complexityScore <= 15) analysis.complexity = 'moderate';
  else if (complexityScore <= 30) analysis.complexity = 'complex';
  else analysis.complexity = 'very-complex';
  
  // Performance analysis
  if (pattern.includes('.*.*') || pattern.includes('.+.+')) {
    analysis.performance.backtrackingRisk = 'high';
    analysis.performance.timeComplexity = 'O(2^n)';
    analysis.warnings.push('Potential catastrophic backtracking detected');
    analysis.performance.optimizationSuggestions.push('Use atomic groups or possessive quantifiers');
  }
  
  if (pattern.includes('(.*)*') || pattern.includes('(.+)+')) {
    analysis.performance.backtrackingRisk = 'high';
    analysis.warnings.push('Nested quantifiers can cause exponential time complexity');
  }
  
  // Suggestions
  if (!pattern.includes('^') && !pattern.includes('$')) {
    analysis.suggestions.push('Consider adding anchors (^ $) for exact matching');
  }
  
  if (pattern.includes('[0-9]') && !pattern.includes('\\d')) {
    analysis.suggestions.push('Use \\d instead of [0-9] for better readability');
  }
  
  return analysis;
}

function explainRegexPattern(pattern: string): RegexExplanation {
  const breakdown: ExplanationPart[] = [];
  const tokens = tokenizeRegex(pattern);
  
  tokens.forEach(token => {
    let description = REGEX_EXPLANATIONS[token.value] || '';
    let type: ExplanationPart['type'] = 'literal';
    
    if (token.value.match(/[\*\+\?\{.*?\}]/)) {
      type = 'quantifier';
    } else if (token.value.match(/[\(\)]/)) {
      type = 'group';
    } else if (token.value.match(/[\[\]]/)) {
      type = 'class';
    } else if (token.value.match(/[\^\$]/)) {
      type = 'anchor';
    } else if (token.value.match(/\(\?\=/)) {
      type = 'assertion';
    }
    
    if (!description) {
      if (token.value.match(/[a-zA-Z0-9]/)) {
        description = `Literal character "${token.value}"`;
      } else if (token.value.length > 1 && token.value.startsWith('\\')) {
        description = `Escape sequence: ${token.value}`;
      } else {
        description = `Special character: ${token.value}`;
      }
    }
    
    breakdown.push({
      part: token.value,
      description,
      type,
      position: token.position
    });
  });
  
  const summary = generatePatternSummary(pattern);
  const examples = generateExamples(pattern);
  
  return {
    pattern,
    breakdown,
    summary,
    examples
  };
}

function tokenizeRegex(pattern: string): { value: string; position: number }[] {
  const tokens: { value: string; position: number }[] = [];
  let i = 0;
  
  while (i < pattern.length) {
    const char = pattern[i];
    
    if (char === '\\' && i + 1 < pattern.length) {
      // Escape sequence
      tokens.push({ value: pattern.slice(i, i + 2), position: i });
      i += 2;
    } else if (char === '[') {
      // Character class
      let j = i + 1;
      let depth = 1;
      while (j < pattern.length && depth > 0) {
        if (pattern[j] === '[' && pattern[j - 1] !== '\\') depth++;
        if (pattern[j] === ']' && pattern[j - 1] !== '\\') depth--;
        j++;
      }
      tokens.push({ value: pattern.slice(i, j), position: i });
      i = j;
    } else if (char === '(' && pattern[i + 1] === '?') {
      // Special group
      let j = i + 2;
      while (j < pattern.length && pattern[j] !== ')') j++;
      if (j < pattern.length) j++; // Include closing )
      tokens.push({ value: pattern.slice(i, j), position: i });
      i = j;
    } else if (char === '{') {
      // Quantifier
      let j = i + 1;
      while (j < pattern.length && pattern[j] !== '}') j++;
      if (j < pattern.length) j++; // Include closing }
      tokens.push({ value: pattern.slice(i, j), position: i });
      i = j;
    } else {
      // Single character
      tokens.push({ value: char, position: i });
      i++;
    }
  }
  
  return tokens;
}

function generatePatternSummary(pattern: string): string {
  // Simple summary generation
  if (pattern.includes('@') && pattern.includes('\\.')) {
    return 'Email address validation pattern';
  } else if (pattern.includes('https?')) {
    return 'URL matching pattern';
  } else if (pattern.includes('\\d') && pattern.includes('{')) {
    return 'Numeric format validation pattern';
  } else if (pattern.includes('^') && pattern.includes('$')) {
    return 'Full string matching pattern';
  } else {
    return 'Custom regex pattern for text matching';
  }
}

function generateExamples(pattern: string): string[] {
  // Generate simple examples based on pattern analysis
  const examples: string[] = [];
  
  // This is a simplified example generation
  if (pattern.includes('\\d+')) {
    examples.push('123', '456789');
  }
  if (pattern.includes('[a-zA-Z]+')) {
    examples.push('Hello', 'World');
  }
  if (pattern.includes('@') && pattern.includes('\\.')) {
    examples.push('user@example.com', 'test@domain.org');
  }
  
  return examples.length > 0 ? examples : ['Sample text that would match this pattern'];
}

function extractMatches(text: string, pattern: string, flags: string, maxMatches: number): RegexMatch[] {
  const matches: RegexMatch[] = [];
  
  try {
    const regex = new RegExp(pattern, flags);
    const globalRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
    
    let match;
    let count = 0;
    
    while ((match = globalRegex.exec(text)) !== null && count < maxMatches) {
      const namedGroups: Record<string, string> = {};
      
      // Extract named groups if available
      if (match.groups) {
        Object.assign(namedGroups, match.groups);
      }
      
      matches.push({
        fullMatch: match[0],
        groups: Array.from(match).slice(1) as string[],
        namedGroups,
        index: match.index,
        lastIndex: globalRegex.lastIndex,
        input: text,
        length: match[0].length
      });
      
      count++;
      
      // Prevent infinite loop on empty matches
      if (match[0] === '') {
        globalRegex.lastIndex++;
      }
    }
  } catch (error) {
    throw new Error(`Regex execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return matches;
}

function formatOutput(matches: RegexMatch[], analysis: RegexAnalysis, explanation: RegexExplanation, config: RegexPatternAnalyzerConfig): string {
  const lines: string[] = [];
  
  if (config.mode === 'analyze') {
    lines.push('🔍 Regex Pattern Analysis');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Pattern: ${analysis.pattern}`);
    lines.push(`Flags: ${analysis.flags || 'none'}`);
    lines.push(`Valid: ${analysis.isValid ? '✅' : '❌'}`);
    lines.push(`Complexity: ${analysis.complexity}`);
    lines.push(`Features: ${analysis.features.join(', ')}`);
    lines.push('');
    
    if (analysis.warnings.length > 0) {
      lines.push('⚠️ Warnings:');
      analysis.warnings.forEach(warning => lines.push(`  • ${warning}`));
      lines.push('');
    }
    
    if (analysis.suggestions.length > 0) {
      lines.push('💡 Suggestions:');
      analysis.suggestions.forEach(suggestion => lines.push(`  • ${suggestion}`));
      lines.push('');
    }
    
    lines.push('🚀 Performance:');
    lines.push(`  • Backtracking Risk: ${analysis.performance.backtrackingRisk}`);
    lines.push(`  • Time Complexity: ${analysis.performance.timeComplexity}`);
    
    if (analysis.performance.optimizationSuggestions.length > 0) {
      lines.push('  • Optimizations:');
      analysis.performance.optimizationSuggestions.forEach(opt => 
        lines.push(`    - ${opt}`)
      );
    }
  } else if (config.mode === 'explain') {
    lines.push('📚 Regex Pattern Explanation');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Pattern: ${explanation.pattern}`);
    lines.push(`Summary: ${explanation.summary}`);
    lines.push('');
    lines.push('🔧 Pattern Breakdown:');
    explanation.breakdown.forEach(part => {
      lines.push(`  "${part.part}" → ${part.description}`);
    });
    lines.push('');
    lines.push('📝 Example matches:');
    explanation.examples.forEach(example => lines.push(`  • ${example}`));
  } else {
    // Extract/test mode
    if (matches.length === 0) {
      lines.push('No matches found.');
    } else {
      lines.push(`Found ${matches.length} match${matches.length === 1 ? '' : 'es'}:`);
      lines.push('');
      
      matches.forEach((match, index) => {
        lines.push(`Match ${index + 1}:`);
        lines.push(`  Full match: "${match.fullMatch}"`);
        lines.push(`  Position: ${match.index}-${match.index + match.length}`);
        
        if (config.outputFormat === 'groups' || config.outputFormat === 'all') {
          if (match.groups.length > 0) {
            lines.push(`  Groups:`);
            match.groups.forEach((group, groupIndex) => {
              lines.push(`    Group ${groupIndex + 1}: "${group || '(no match)'}"`);
            });
          }
          
          if (Object.keys(match.namedGroups).length > 0) {
            lines.push(`  Named groups:`);
            Object.entries(match.namedGroups).forEach(([name, value]) => {
              lines.push(`    ${name}: "${value}"`);
            });
          }
        }
        
        lines.push('');
      });
    }
  }
  
  return lines.join('\n');
}

export function processRegexPatternAnalyzer(pattern: string, text: string, config: RegexPatternAnalyzerConfig): ToolResult {
  try {
    if (!pattern.trim()) {
      return {
        success: false,
        error: 'Regex pattern is required'
      };
    }
    
    const flags = buildRegexFlags(config);
    const analysis = analyzeRegexPattern(pattern, flags);
    
    if (!analysis.isValid) {
      return {
        success: false,
        error: analysis.warnings.join('; '),
        analysis
      };
    }
    
    const explanation = explainRegexPattern(pattern);
    let matches: RegexMatch[] = [];
    
    if ((config.mode === 'extract' || config.mode === 'test') && text.trim()) {
      matches = extractMatches(text, pattern, flags, config.maxMatches);
    }
    
    const output = formatOutput(matches, analysis, explanation, config);
    
    return {
      success: true,
      output,
      analysis,
      matches,
      explanation
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const REGEX_PATTERN_ANALYZER_TOOL: Tool = {
  id: 'regex-pattern-analyzer',
  name: 'Regex Pattern Analyzer',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'regex-tools')!,
  slug: 'regex-pattern-analyzer',
  icon: '🔍',
  keywords: ['regex', 'regexp', 'pattern', 'analyze', 'explain', 'extract', 'match', 'test'],
  seoTitle: 'Regex Pattern Analyzer - Test, Explain & Extract with Regular Expressions | FreeFormatHub',
  seoDescription: 'Advanced regex pattern analyzer with explanation, testing, extraction, and performance analysis. Support for all JavaScript regex features.',
  description: 'Comprehensive regex pattern analyzer with explanation, testing, match extraction, and performance analysis capabilities.',

  examples: [
    {
      title: 'Email Pattern Analysis',
      input: 'Pattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      output: 'Valid email validation pattern with anchors, character classes, and quantifiers',
      description: 'Analyze email regex pattern complexity and features'
    },
    {
      title: 'Pattern Explanation',
      input: '\\d{3}-\\d{3}-\\d{4}',
      output: '\\d{3} → Three digit characters\n- → Literal character "-"\n\\d{3} → Three digit characters',
      description: 'Break down regex pattern into understandable parts'
    },
    {
      title: 'Text Extraction',
      input: 'Pattern: \\b\\w+@\\w+\\.\\w+\\b\nText: Contact us at hello@example.com or support@test.org',
      output: 'Match 1: "hello@example.com"\nMatch 2: "support@test.org"',
      description: 'Extract all matches from text using regex pattern'
    }
  ],

  useCases: [
    'Testing and debugging regular expression patterns',
    'Learning regex syntax through detailed pattern explanations',
    'Extracting structured data from unstructured text',
    'Validating input formats like emails, phone numbers, URLs',
    'Analyzing regex performance and potential bottlenecks',
    'Converting between different regex flavors and optimizing patterns',
    'Building and testing data parsing rules for log files',
    'Creating validation rules for form inputs and APIs'
  ],

  faq: [
    {
      question: 'What regex features and flags are supported?',
      answer: 'Supports all JavaScript regex features including lookarounds, named groups, unicode flag, sticky flag, and all standard quantifiers, anchors, and character classes.'
    },
    {
      question: 'How does the pattern complexity analysis work?',
      answer: 'Complexity is calculated based on the number and type of regex features used. Simple patterns use basic matching, while complex patterns use advanced features like lookarounds and nested quantifiers.'
    },
    {
      question: 'What performance issues does the tool detect?',
      answer: 'Detects catastrophic backtracking, nested quantifiers, and other patterns that can cause exponential time complexity. Provides optimization suggestions for better performance.'
    },
    {
      question: 'Can I test patterns against multiple text samples?',
      answer: 'Yes, enter multiple lines of text to test your pattern against different inputs. The tool will show all matches with their positions and captured groups.'
    },
    {
      question: 'How accurate is the regex explanation feature?',
      answer: 'The explanation breaks down patterns into component parts with descriptions for each element. While comprehensive, complex patterns may require additional context for full understanding.'
    }
  ],

  commonErrors: [
    'Invalid regex syntax causing compilation errors',
    'Catastrophic backtracking in complex patterns',
    'Unescaped special characters in literal matching',
    'Incorrect quantifier usage leading to unexpected matches',
    'Missing anchors causing partial matches instead of full validation'
  ],

  relatedTools: ['text-search', 'pattern-matcher', 'data-extractor', 'string-validator', 'log-analyzer']
};