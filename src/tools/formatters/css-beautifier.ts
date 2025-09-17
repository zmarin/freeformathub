import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface CssBeautifierConfig {
  mode: 'beautify' | 'minify';
  indentSize: number;
  indentType: 'spaces' | 'tabs';
  insertNewLineBeforeOpeningBrace: boolean;
  insertNewLineAfterOpeningBrace: boolean;
  insertNewLineBeforeClosingBrace: boolean;
  insertNewLineAfterRule: boolean;
  insertNewLineAfterComma: boolean;
  preserveComments: boolean;
  removeEmptyRules: boolean;
  sortProperties: boolean;
  insertSpaceAfterColon: boolean;
  insertSpaceAfterComma: boolean;
  insertSpaceBeforeOpeningBrace: boolean;
  autoprefixer: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: {
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    lineCount: number;
    ruleCount: number;
    propertyCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
  };
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: 'error' | 'warning';
  code: string;
}

interface CssToken {
  type: 'selector' | 'property' | 'value' | 'comment' | 'at-rule' | 'media-query' | 'whitespace' | 'punctuation';
  value: string;
  line: number;
  column: number;
}

interface CssRule {
  type: 'rule' | 'at-rule' | 'comment';
  selector?: string;
  properties: Array<{ property: string; value: string; important: boolean }>;
  rules?: CssRule[];
  atRule?: string;
  content?: string;
  line: number;
  column: number;
}

function tokenizeCss(css: string): CssToken[] {
  const tokens: CssToken[] = [];
  let position = 0;
  let line = 1;
  let column = 1;

  while (position < css.length) {
    const char = css[position];
    
    // Comments
    if (char === '/' && css[position + 1] === '*') {
      let commentEnd = position + 2;
      while (commentEnd < css.length - 1) {
        if (css[commentEnd] === '*' && css[commentEnd + 1] === '/') {
          break;
        }
        if (css[commentEnd] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        commentEnd++;
      }
      
      const commentContent = css.slice(position, commentEnd + 2);
      tokens.push({
        type: 'comment',
        value: commentContent,
        line,
        column: column - commentContent.length
      });
      
      position = commentEnd + 2;
      column += 2;
      continue;
    }
    
    // Whitespace
    if (/\s/.test(char)) {
      let whitespaceEnd = position;
      while (whitespaceEnd < css.length && /\s/.test(css[whitespaceEnd])) {
        if (css[whitespaceEnd] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        whitespaceEnd++;
      }
      
      tokens.push({
        type: 'whitespace',
        value: css.slice(position, whitespaceEnd),
        line,
        column: column - (whitespaceEnd - position)
      });
      
      position = whitespaceEnd;
      continue;
    }
    
    // Punctuation
    if ('{}:;,()[]'.includes(char)) {
      tokens.push({
        type: 'punctuation',
        value: char,
        line,
        column
      });
      position++;
      column++;
      continue;
    }
    
    // Other content (selectors, properties, values)
    let contentEnd = position;
    while (contentEnd < css.length && 
           !'{};:,/*'.includes(css[contentEnd]) && 
           !/\s/.test(css[contentEnd])) {
      contentEnd++;
    }
    
    if (contentEnd > position) {
      const content = css.slice(position, contentEnd);
      tokens.push({
        type: 'selector', // Will be refined during parsing
        value: content,
        line,
        column
      });
      
      column += content.length;
      position = contentEnd;
    } else {
      // Single character we don't recognize
      tokens.push({
        type: 'selector',
        value: char,
        line,
        column
      });
      position++;
      column++;
    }
  }
  
  return tokens;
}

function parseCss(tokens: CssToken[]): CssRule[] {
  const rules: CssRule[] = [];
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (token.type === 'comment') {
      rules.push({
        type: 'comment',
        properties: [],
        content: token.value,
        line: token.line,
        column: token.column
      });
      i++;
      continue;
    }
    
    if (token.type === 'whitespace') {
      i++;
      continue;
    }
    
    // Look for at-rules (@media, @import, etc.)
    if (token.value.startsWith('@')) {
      const atRule: CssRule = {
        type: 'at-rule',
        atRule: token.value,
        properties: [],
        line: token.line,
        column: token.column
      };
      
      i++;
      
      // Collect the at-rule content until we hit a semicolon or opening brace
      let atRuleContent = '';
      while (i < tokens.length && tokens[i].value !== ';' && tokens[i].value !== '{') {
        if (tokens[i].type !== 'whitespace' || atRuleContent.length > 0) {
          atRuleContent += tokens[i].value;
        }
        i++;
      }
      
      atRule.content = atRuleContent.trim();
      
      if (i < tokens.length && tokens[i].value === '{') {
        // At-rule with block (like @media)
        i++; // Skip opening brace
        const nestedRules = parseRuleBlock(tokens, i);
        atRule.rules = nestedRules.rules;
        i = nestedRules.nextIndex;
      } else if (i < tokens.length && tokens[i].value === ';') {
        // Simple at-rule (like @import)
        i++; // Skip semicolon
      }
      
      rules.push(atRule);
      continue;
    }
    
    // Regular CSS rule
    let selector = '';
    
    // Collect selector until we hit opening brace
    while (i < tokens.length && tokens[i].value !== '{') {
      if (tokens[i].type === 'whitespace') {
        if (selector.trim().length > 0) {
          selector += ' ';
        }
      } else {
        selector += tokens[i].value;
      }
      i++;
    }
    
    if (i >= tokens.length) break;
    
    // Skip opening brace
    i++;
    
    const rule: CssRule = {
      type: 'rule',
      selector: selector.trim(),
      properties: [],
      line: token.line,
      column: token.column
    };
    
    const ruleBlock = parseRuleBlock(tokens, i);
    rule.properties = ruleBlock.properties;
    i = ruleBlock.nextIndex;
    
    if (rule.selector.length > 0 || rule.properties.length > 0) {
      rules.push(rule);
    }
  }
  
  return rules;
}

function parseRuleBlock(tokens: CssToken[], startIndex: number): {
  properties: Array<{ property: string; value: string; important: boolean }>;
  rules: CssRule[];
  nextIndex: number;
} {
  const properties: Array<{ property: string; value: string; important: boolean }> = [];
  const rules: CssRule[] = [];
  let i = startIndex;
  
  while (i < tokens.length && tokens[i].value !== '}') {
    if (tokens[i].type === 'whitespace' || tokens[i].type === 'comment') {
      i++;
      continue;
    }
    
    // Check for nested rules (for @media, etc.)
    if (tokens[i].value.match(/^[.#a-zA-Z]/) || tokens[i].value === '&') {
      // This looks like a selector, parse as nested rule
      const nestedStartIndex = i;
      let nestedSelector = '';
      
      while (i < tokens.length && tokens[i].value !== '{') {
        if (tokens[i].type !== 'whitespace' || nestedSelector.length > 0) {
          nestedSelector += tokens[i].value;
        }
        i++;
      }
      
      if (i < tokens.length && tokens[i].value === '{') {
        i++; // Skip opening brace
        const nestedRule: CssRule = {
          type: 'rule',
          selector: nestedSelector.trim(),
          properties: [],
          line: tokens[nestedStartIndex].line,
          column: tokens[nestedStartIndex].column
        };
        
        const nestedBlock = parseRuleBlock(tokens, i);
        nestedRule.properties = nestedBlock.properties;
        i = nestedBlock.nextIndex;
        
        rules.push(nestedRule);
      }
      continue;
    }
    
    // Parse property: value
    let property = '';
    
    // Collect property name until colon
    while (i < tokens.length && tokens[i].value !== ':' && tokens[i].value !== '}') {
      if (tokens[i].type !== 'whitespace') {
        property += tokens[i].value;
      }
      i++;
    }
    
    if (i >= tokens.length || tokens[i].value === '}') break;
    
    // Skip colon
    i++;
    
    let value = '';
    let important = false;
    
    // Collect value until semicolon or closing brace
    while (i < tokens.length && tokens[i].value !== ';' && tokens[i].value !== '}') {
      if (tokens[i].type === 'whitespace') {
        if (value.trim().length > 0) {
          value += ' ';
        }
      } else {
        value += tokens[i].value;
      }
      i++;
    }
    
    // Check for !important
    if (value.includes('!important')) {
      important = true;
      value = value.replace('!important', '').trim();
    }
    
    if (property.trim().length > 0) {
      properties.push({
        property: property.trim(),
        value: value.trim(),
        important
      });
    }
    
    // Skip semicolon if present
    if (i < tokens.length && tokens[i].value === ';') {
      i++;
    }
  }
  
  // Skip closing brace
  if (i < tokens.length && tokens[i].value === '}') {
    i++;
  }
  
  return { properties, rules, nextIndex: i };
}

function validateCss(rules: CssRule[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const rule of rules) {
    if (rule.type === 'rule') {
      // Check for empty selectors
      if (!rule.selector || rule.selector.trim().length === 0) {
        errors.push({
          line: rule.line,
          column: rule.column,
          message: 'Empty selector',
          type: 'warning',
          code: 'empty-selector'
        });
      }
      
      // Check properties
      for (const prop of rule.properties) {
        // Check for empty property names
        if (!prop.property.trim()) {
          errors.push({
            line: rule.line,
            column: rule.column,
            message: 'Empty property name',
            type: 'error',
            code: 'empty-property'
          });
        }
        
        // Check for empty values
        if (!prop.value.trim()) {
          errors.push({
            line: rule.line,
            column: rule.column,
            message: `Empty value for property '${prop.property}'`,
            type: 'warning',
            code: 'empty-value'
          });
        }
        
        // Check for unknown properties (basic check)
        if (prop.property.includes(' ')) {
          errors.push({
            line: rule.line,
            column: rule.column,
            message: `Invalid property name '${prop.property}' (contains spaces)`,
            type: 'error',
            code: 'invalid-property'
          });
        }
      }
    }
  }
  
  return errors;
}

function beautifyCss(rules: CssRule[], config: CssBeautifierConfig): string {
  const lines: string[] = [];
  const indent = config.indentType === 'tabs' ? '\t' : ' '.repeat(config.indentSize);
  
  function formatRule(rule: CssRule, level: number = 0): void {
    const currentIndent = indent.repeat(level);
    
    if (rule.type === 'comment') {
      if (config.preserveComments && rule.content) {
        lines.push(currentIndent + rule.content);
      }
      return;
    }
    
    if (rule.type === 'at-rule') {
      if (rule.rules && rule.rules.length > 0) {
        // At-rule with block (@media, etc.)
        const openBrace = config.insertSpaceBeforeOpeningBrace ? ' {' : '{';
        lines.push(currentIndent + rule.atRule + (rule.content ? ' ' + rule.content : '') + openBrace);
        
        if (config.insertNewLineAfterOpeningBrace) {
          lines.push('');
        }
        
        for (const nestedRule of rule.rules) {
          formatRule(nestedRule, level + 1);
        }
        
        if (config.insertNewLineBeforeClosingBrace && lines[lines.length - 1] !== '') {
          lines.push('');
        }
        
        lines.push(currentIndent + '}');
      } else {
        // Simple at-rule (@import, etc.)
        lines.push(currentIndent + rule.atRule + (rule.content ? ' ' + rule.content : '') + ';');
      }
      
      if (config.insertNewLineAfterRule) {
        lines.push('');
      }
      return;
    }
    
    if (rule.type === 'rule') {
      // Skip empty rules if configured
      if (config.removeEmptyRules && rule.properties.length === 0) {
        return;
      }
      
      // Format selector
      if (rule.selector) {
        const openBrace = config.insertSpaceBeforeOpeningBrace ? ' {' : '{';
        if (config.insertNewLineBeforeOpeningBrace) {
          lines.push(currentIndent + rule.selector);
          lines.push(currentIndent + '{');
        } else {
          lines.push(currentIndent + rule.selector + openBrace);
        }
        
        if (config.insertNewLineAfterOpeningBrace && rule.properties.length > 0) {
          lines.push('');
        }
      }
      
      // Format properties
      let properties = [...rule.properties];
      if (config.sortProperties) {
        properties.sort((a, b) => a.property.localeCompare(b.property));
      }
      
      for (const prop of properties) {
        const colonSpace = config.insertSpaceAfterColon ? ': ' : ':';
        const important = prop.important ? ' !important' : '';
        lines.push(currentIndent + indent + prop.property + colonSpace + prop.value + important + ';');
      }
      
      if (config.insertNewLineBeforeClosingBrace && rule.properties.length > 0) {
        lines.push('');
      }
      
      if (rule.selector) {
        lines.push(currentIndent + '}');
        
        if (config.insertNewLineAfterRule) {
          lines.push('');
        }
      }
    }
  }
  
  for (const rule of rules) {
    formatRule(rule);
  }
  
  // Clean up multiple empty lines
  return lines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

function minifyCss(rules: CssRule[], config: CssBeautifierConfig): string {
  let result = '';
  
  function formatRule(rule: CssRule): void {
    if (rule.type === 'comment') {
      if (config.preserveComments && rule.content) {
        result += rule.content;
      }
      return;
    }
    
    if (rule.type === 'at-rule') {
      if (rule.rules && rule.rules.length > 0) {
        result += rule.atRule + (rule.content ? ' ' + rule.content : '') + '{';
        for (const nestedRule of rule.rules) {
          formatRule(nestedRule);
        }
        result += '}';
      } else {
        result += rule.atRule + (rule.content ? ' ' + rule.content : '') + ';';
      }
      return;
    }
    
    if (rule.type === 'rule') {
      if (config.removeEmptyRules && rule.properties.length === 0) {
        return;
      }
      
      if (rule.selector) {
        result += rule.selector + '{';
      }
      
      let properties = [...rule.properties];
      if (config.sortProperties) {
        properties.sort((a, b) => a.property.localeCompare(b.property));
      }
      
      for (const prop of properties) {
        const important = prop.important ? '!important' : '';
        result += prop.property + ':' + prop.value + important + ';';
      }
      
      if (rule.selector) {
        result += '}';
      }
    }
  }
  
  for (const rule of rules) {
    formatRule(rule);
  }
  
  return result;
}

export function processCssBeautifier(input: string, config: CssBeautifierConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide CSS content to process'
      };
    }
    
    const originalSize = input.length;
    const tokens = tokenizeCss(input);
    const rules = parseCss(tokens);
    
    const errors = validateCss(rules);
    const validationErrors = errors.filter(e => e.type === 'error');
    const warnings = errors.filter(e => e.type === 'warning');
    
    let output = '';
    if (config.mode === 'beautify') {
      output = beautifyCss(rules, config);
    } else {
      output = minifyCss(rules, config);
    }
    
    const processedSize = output.length;
    const compressionRatio = originalSize > 0 ? processedSize / originalSize : 1;
    const lineCount = output.split('\n').length;
    const ruleCount = rules.filter(r => r.type === 'rule').length;
    const propertyCount = rules.reduce((count, rule) => count + (rule.properties?.length || 0), 0);
    
    return {
      success: true,
      output,
      stats: {
        originalSize,
        processedSize,
        compressionRatio,
        lineCount,
        ruleCount,
        propertyCount,
        errors: validationErrors,
        warnings
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CSS'
    };
  }
}

export const CSS_BEAUTIFIER_TOOL: Tool = {
  id: 'css-beautifier',
  name: 'CSS Beautifier & Minifier',
  description: 'Format, beautify, and minify CSS code with proper indentation, validation, and optimization. Supports CSS3, media queries, and nested rules with comprehensive formatting options.',
  icon: '✨',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'css-formatting')!,
  tags: ['css', 'beautifier', 'minifier', 'formatter', 'web', 'stylesheet', 'validation'],
  complexity: 'intermediate',
  examples: [
    {
      title: 'Beautify Minified CSS',
      input: `.container{width:100%;margin:0 auto;padding:20px}.header{background-color:#333;color:white;padding:10px}.header h1{margin:0;font-size:24px}@media (max-width:768px){.container{padding:10px}}`,
      description: 'Format compact CSS with proper indentation and line breaks'
    },
    {
      title: 'Minify Formatted CSS',
      input: `.container {
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background-color: #333;
  color: white;
  padding: 10px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
}`,
      description: 'Compress CSS by removing unnecessary whitespace'
    },
    {
      title: 'CSS with Variables and Functions',
      input: `:root{--primary-color:#007bff;--secondary-color:#6c757d}body{font-family:Arial,sans-serif;color:var(--primary-color)}h1{color:var(--secondary-color);transform:rotate(45deg)}`,
      description: 'Format modern CSS with custom properties and functions'
    }
  ],
  
  useCases: [
    'CSS code formatting and beautification',
    'CSS minification for production builds',
    'Code validation and error detection',
    'Converting between indentation styles',
    'Optimizing CSS for web performance'
  ],
  
  faqs: [
    {
      question: 'What\'s the difference between beautify and minify modes?',
      answer: 'Beautify adds proper indentation, line breaks, and spacing for readability. Minify removes all unnecessary whitespace and formatting to reduce file size for production.'
    },
    {
      question: 'Does this tool support modern CSS features?',
      answer: 'Yes, it handles CSS3 features including custom properties (CSS variables), media queries, flexbox, grid, and modern selectors.'
    },
    {
      question: 'Can I customize the formatting style?',
      answer: 'Yes, you can configure indentation type (spaces/tabs), spacing around braces and colons, property sorting, and comment preservation.'
    },
    {
      question: 'Does it validate CSS syntax?',
      answer: 'The tool performs basic syntax validation, checking for common errors like empty selectors, malformed properties, and structural issues.'
    },
    {
      question: 'What about browser prefixes?',
      answer: 'The tool preserves existing prefixes but doesn\'t automatically add them. For comprehensive autoprefixing, use dedicated tools like Autoprefixer.'
    }
  ],
  relatedTools: ['js-beautifier', 'html-beautifier', 'json-formatter', 'xml-formatter', 'code-formatter']
};