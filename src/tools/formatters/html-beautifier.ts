import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface HtmlBeautifierConfig {
  mode: 'beautify' | 'minify';
  indentSize: number;
  indentType: 'spaces' | 'tabs';
  maxLineLength: number;
  preserveComments: boolean;
  preserveEmptyLines: boolean;
  sortAttributes: boolean;
  removeTrailingSpaces: boolean;
  selfCloseTags: boolean;
  validateHtml: boolean;
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

const SELF_CLOSING_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const BLOCK_ELEMENTS = new Set([
  'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div',
  'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main',
  'nav', 'noscript', 'ol', 'p', 'pre', 'section', 'table', 'tfoot',
  'ul', 'video'
]);

const INLINE_ELEMENTS = new Set([
  'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'button', 'cite',
  'code', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map',
  'object', 'q', 'samp', 'script', 'select', 'small', 'span', 'strong',
  'sub', 'sup', 'textarea', 'time', 'tt', 'var'
]);

interface ParsedTag {
  type: 'opening' | 'closing' | 'self-closing' | 'text' | 'comment' | 'doctype';
  name?: string;
  attributes?: Array<{ name: string; value: string | null }>;
  content: string;
  original: string;
  line: number;
  column: number;
}

function parseHtml(html: string): ParsedTag[] {
  const tokens: ParsedTag[] = [];
  let position = 0;
  let line = 1;
  let column = 1;

  while (position < html.length) {
    const char = html[position];
    
    if (char === '<') {
      // Find the end of the tag
      let tagEnd = position + 1;
      let inQuotes = false;
      let quoteChar = '';
      
      while (tagEnd < html.length) {
        const c = html[tagEnd];
        if (!inQuotes && (c === '"' || c === "'")) {
          inQuotes = true;
          quoteChar = c;
        } else if (inQuotes && c === quoteChar) {
          inQuotes = false;
        } else if (!inQuotes && c === '>') {
          break;
        }
        tagEnd++;
      }
      
      if (tagEnd < html.length) {
        const tagContent = html.slice(position, tagEnd + 1);
        const tag = parseTag(tagContent, line, column);
        tokens.push(tag);
        
        // Update position
        const lines = tagContent.split('\n');
        if (lines.length > 1) {
          line += lines.length - 1;
          column = lines[lines.length - 1].length + 1;
        } else {
          column += tagContent.length;
        }
        position = tagEnd + 1;
      } else {
        // Unclosed tag, treat as text
        const textContent = html.slice(position, position + 1);
        tokens.push({
          type: 'text',
          content: textContent,
          original: textContent,
          line,
          column
        });
        position++;
        column++;
      }
    } else {
      // Text content
      let textEnd = position;
      while (textEnd < html.length && html[textEnd] !== '<') {
        textEnd++;
      }
      
      const textContent = html.slice(position, textEnd);
      if (textContent.trim() || textContent.includes('\n')) {
        tokens.push({
          type: 'text',
          content: textContent,
          original: textContent,
          line,
          column
        });
      }
      
      // Update position
      const lines = textContent.split('\n');
      if (lines.length > 1) {
        line += lines.length - 1;
        column = lines[lines.length - 1].length + 1;
      } else {
        column += textContent.length;
      }
      position = textEnd;
    }
  }

  return tokens;
}

function parseTag(tagString: string, line: number, column: number): ParsedTag {
  const content = tagString.slice(1, -1).trim();
  
  // Check for comment
  if (content.startsWith('!--')) {
    return {
      type: 'comment',
      content: content,
      original: tagString,
      line,
      column
    };
  }
  
  // Check for doctype
  if (content.toLowerCase().startsWith('!doctype')) {
    return {
      type: 'doctype',
      content: content,
      original: tagString,
      line,
      column
    };
  }
  
  // Check for closing tag
  if (content.startsWith('/')) {
    const tagName = content.slice(1).toLowerCase();
    return {
      type: 'closing',
      name: tagName,
      content: content,
      original: tagString,
      line,
      column
    };
  }
  
  // Parse opening or self-closing tag
  const spaceIndex = content.indexOf(' ');
  const tagName = (spaceIndex === -1 ? content : content.slice(0, spaceIndex)).toLowerCase();
  const attributeString = spaceIndex === -1 ? '' : content.slice(spaceIndex + 1);
  
  const attributes = parseAttributes(attributeString);
  const isSelfClosing = content.endsWith('/') || SELF_CLOSING_TAGS.has(tagName);
  
  return {
    type: isSelfClosing ? 'self-closing' : 'opening',
    name: tagName,
    attributes,
    content: content,
    original: tagString,
    line,
    column
  };
}

function parseAttributes(attributeString: string): Array<{ name: string; value: string | null }> {
  const attributes: Array<{ name: string; value: string | null }> = [];
  const attrRegex = /([a-zA-Z-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  
  let match;
  while ((match = attrRegex.exec(attributeString)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : 
                 match[3] !== undefined ? match[3] : 
                 match[4] !== undefined ? match[4] : null;
    
    attributes.push({ name, value });
  }
  
  return attributes;
}

function validateHtml(tokens: ParsedTag[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const tagStack: Array<{ name: string; line: number; column: number }> = [];
  
  for (const token of tokens) {
    if (token.type === 'opening') {
      tagStack.push({ name: token.name!, line: token.line, column: token.column });
    } else if (token.type === 'closing') {
      if (tagStack.length === 0) {
        errors.push({
          line: token.line,
          column: token.column,
          message: `Unexpected closing tag </${token.name}>`,
          type: 'error',
          code: 'unexpected-closing-tag'
        });
      } else {
        const lastTag = tagStack.pop()!;
        if (lastTag.name !== token.name) {
          errors.push({
            line: token.line,
            column: token.column,
            message: `Mismatched tag: expected </${lastTag.name}> but found </${token.name}>`,
            type: 'error',
            code: 'mismatched-tag'
          });
        }
      }
    }
    
    // Check for invalid attributes
    if (token.attributes) {
      for (const attr of token.attributes) {
        if (attr.name.includes(' ')) {
          errors.push({
            line: token.line,
            column: token.column,
            message: `Invalid attribute name: "${attr.name}"`,
            type: 'error',
            code: 'invalid-attribute-name'
          });
        }
      }
    }
  }
  
  // Check for unclosed tags
  for (const tag of tagStack) {
    errors.push({
      line: tag.line,
      column: tag.column,
      message: `Unclosed tag <${tag.name}>`,
      type: 'error',
      code: 'unclosed-tag'
    });
  }
  
  return errors;
}

function beautifyHtml(tokens: ParsedTag[], config: HtmlBeautifierConfig): string {
  const lines: string[] = [];
  let currentIndent = 0;
  const indentStr = config.indentType === 'tabs' ? '\t' : ' '.repeat(config.indentSize);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    
    switch (token.type) {
      case 'doctype':
        lines.push(`<!${token.content}>`);
        break;
        
      case 'comment':
        if (config.preserveComments) {
          lines.push(indentStr.repeat(currentIndent) + `<!--${token.content.slice(3)}-->`);
        }
        break;
        
      case 'opening':
        const openingTag = formatTag(token, config);
        if (BLOCK_ELEMENTS.has(token.name!)) {
          lines.push(indentStr.repeat(currentIndent) + openingTag);
          currentIndent++;
        } else {
          // Inline element
          if (lines.length === 0 || lines[lines.length - 1].trim() === '') {
            lines.push(indentStr.repeat(currentIndent) + openingTag);
          } else {
            lines[lines.length - 1] += openingTag;
          }
        }
        break;
        
      case 'closing':
        if (BLOCK_ELEMENTS.has(token.name!)) {
          currentIndent = Math.max(0, currentIndent - 1);
          lines.push(indentStr.repeat(currentIndent) + `</${token.name}>`);
        } else {
          // Inline element
          lines[lines.length - 1] += `</${token.name}>`;
        }
        break;
        
      case 'self-closing':
        const selfClosingTag = formatTag(token, config);
        if (BLOCK_ELEMENTS.has(token.name!)) {
          lines.push(indentStr.repeat(currentIndent) + selfClosingTag);
        } else {
          if (lines.length === 0 || lines[lines.length - 1].trim() === '') {
            lines.push(indentStr.repeat(currentIndent) + selfClosingTag);
          } else {
            lines[lines.length - 1] += selfClosingTag;
          }
        }
        break;
        
      case 'text':
        const text = token.content.trim();
        if (text) {
          if (lines.length === 0 || lines[lines.length - 1].trim() === '') {
            lines.push(indentStr.repeat(currentIndent) + text);
          } else {
            lines[lines.length - 1] += text;
          }
        }
        break;
    }
  }
  
  // Remove trailing spaces and empty lines based on config
  let result = lines.join('\n');
  
  if (config.removeTrailingSpaces) {
    result = result.replace(/[ \t]+$/gm, '');
  }
  
  if (!config.preserveEmptyLines) {
    result = result.replace(/\n\s*\n/g, '\n');
  }
  
  return result;
}

function formatTag(token: ParsedTag, config: HtmlBeautifierConfig): string {
  let result = `<${token.name}`;
  
  if (token.attributes && token.attributes.length > 0) {
    let attributes = [...token.attributes];
    
    if (config.sortAttributes) {
      attributes.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    for (const attr of attributes) {
      result += ` ${attr.name}`;
      if (attr.value !== null) {
        result += `="${attr.value}"`;
      }
    }
  }
  
  if (token.type === 'self-closing' && config.selfCloseTags) {
    result += ' /';
  }
  
  result += '>';
  return result;
}

function minifyHtml(tokens: ParsedTag[], config: HtmlBeautifierConfig): string {
  let result = '';
  
  for (const token of tokens) {
    switch (token.type) {
      case 'doctype':
        result += `<!${token.content}>`;
        break;
        
      case 'comment':
        if (config.preserveComments) {
          result += `<!--${token.content.slice(3)}-->`;
        }
        break;
        
      case 'opening':
      case 'self-closing':
        result += formatTag(token, config);
        break;
        
      case 'closing':
        result += `</${token.name}>`;
        break;
        
      case 'text':
        // Preserve spaces in pre tags and between inline elements
        const text = token.content.replace(/\s+/g, ' ').trim();
        if (text) {
          result += text;
        }
        break;
    }
  }
  
  return result;
}

export function processHtmlBeautifier(input: string, config: HtmlBeautifierConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide HTML content to process'
      };
    }
    
    const originalSize = input.length;
    const tokens = parseHtml(input);
    
    let output = '';
    let errors: ValidationError[] = [];
    let warnings: ValidationError[] = [];
    
    if (config.validateHtml) {
      const validationErrors = validateHtml(tokens);
      errors = validationErrors.filter(e => e.type === 'error');
      warnings = validationErrors.filter(e => e.type === 'warning');
    }
    
    if (config.mode === 'beautify') {
      output = beautifyHtml(tokens, config);
    } else {
      output = minifyHtml(tokens, config);
    }
    
    const processedSize = output.length;
    const compressionRatio = originalSize > 0 ? processedSize / originalSize : 1;
    const lineCount = output.split('\n').length;
    
    return {
      success: true,
      output,
      stats: {
        originalSize,
        processedSize,
        compressionRatio,
        lineCount,
        errors,
        warnings
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process HTML'
    };
  }
}

export const HTML_BEAUTIFIER_TOOL: Tool = {
  id: 'html-beautifier',
  name: 'HTML Beautifier & Minifier',
  description: 'Beautify, validate, and minify HTML5 with intelligent indentation, attribute sorting, linting insights, and production-ready minification — powered entirely in the browser.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'code-formatting')!,
  slug: 'html-beautifier',
  icon: 'Code',
  tags: ['html', 'beautify', 'minify', 'format', 'validate', 'web'],
  complexity: 'beginner',
  keywords: ['html', 'beautify', 'minify', 'format', 'validate', 'web', 'indentation', 'optimization'],
  
  examples: [
    {
      title: 'Beautify Minified HTML',
      input: `<!DOCTYPE html><html><head><title>Example</title></head><body><div class="container"><h1>Hello World</h1><p>This is a paragraph.</p></div></body></html>`,
      output: `<!DOCTYPE html>
<html>
  <head>
    <title>Example</title>
  </head>
  <body>
    <div class="container">
      <h1>Hello World</h1>
      <p>This is a paragraph.</p>
    </div>
  </body>
</html>`,
      description: 'Format compact HTML with proper indentation and line breaks'
    },
    {
      title: 'Minify Formatted HTML',
      input: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>My Page</title>
  </head>
  <body>
    <header>
      <h1>Welcome</h1>
    </header>
    <main>
      <p>Content here</p>
    </main>
  </body>
</html>`,
      output: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>My Page</title></head><body><header><h1>Welcome</h1></header><main><p>Content here</p></main></body></html>`,
      description: 'Compress HTML by removing unnecessary whitespace'
    },
    {
      title: 'Validate HTML Structure',
      input: `<div>
  <p>Paragraph without closing div
  <span>Nested content</span>
</div>`,
      output: `Error: Unclosed tag <p> at line 2`,
      description: 'Check for HTML validation errors and warnings'
    }
  ],
  
  useCases: [
    'Code formatting and beautification',
    'HTML minification for production',
    'Code validation and error detection',
    'Converting between indentation styles',
    'Optimizing HTML for web performance'
  ],
  
  faq: [
    {
      question: 'What\'s the difference between beautify and minify?',
      answer: 'Beautify adds proper indentation, line breaks, and formatting for readability. Minify removes unnecessary whitespace and formatting to reduce file size.'
    },
    {
      question: 'Does this tool validate HTML syntax?',
      answer: 'Yes, when validation is enabled, it checks for common HTML errors like unclosed tags, mismatched tags, and invalid attributes.'
    },
    {
      question: 'Can I customize the indentation style?',
      answer: 'Yes, you can choose between spaces or tabs, and set the number of spaces for indentation (2, 4, 8 spaces).'
    },
    {
      question: 'Are comments preserved during processing?',
      answer: 'You can choose whether to preserve or remove HTML comments using the "Preserve Comments" option.'
    },
    {
      question: 'What about self-closing tags?',
      answer: 'The tool can automatically format self-closing tags (like <img>, <br>) with or without the trailing slash based on your preference.'
    }
  ],
  
  commonErrors: [
    'Unclosed tags detected',
    'Mismatched tag pairs',
    'Invalid attribute names'
  ],
  
  relatedTools: ['xml-formatter', 'css-beautifier', 'js-beautifier'],
  seoTitle: 'HTML Beautifier & Minifier - Free HTML Formatter and Validator',
  seoDescription: 'Clean up HTML instantly: beautify markup, validate structure, sort attributes, and minify for production. Privacy-first editor with drag & drop, copy, and download.',
  howItWorks: [
    {
      title: 'Load Your Markup',
      icon: '🧾',
      description: 'Paste snippets, drag-and-drop HTML files, or use built-in examples. The editor supports long documents, inline scripts, and component templates without network calls.',
      keywords: ['paste HTML', 'drag and drop', 'html snippets', 'component templates', 'offline editor']
    },
    {
      title: 'Choose Formatting Mode',
      icon: '⚙️',
      description: 'Pick beautify or minify, adjust indentation (spaces/tabs), sort attributes, trim whitespace, and decide whether to preserve comments or empty lines.',
      keywords: ['beautify html', 'minify html', 'indentation', 'attribute sorting', 'html options']
    },
    {
      title: 'Validate & Inspect',
      icon: '🔍',
      description: 'Enable validation to flag unclosed tags, mismatched nesting, or invalid attributes with precise line and column details before shipping changes.',
      keywords: ['html validation', 'unclosed tags', 'linting', 'error detection', 'line numbers']
    },
    {
      title: 'Export Production Output',
      icon: '📤',
      description: 'Copy results, download formatted files, or send minified HTML straight to your build pipeline. Tool history keeps earlier runs for quick comparisons.',
      keywords: ['download html', 'copy markup', 'minified html', 'tool history', 'build pipeline']
    }
  ],
  problemsSolved: [
    {
      problem: 'Large HTML templates written collaboratively often end up with inconsistent indentation and stray whitespace that makes reviews difficult.',
      solution: 'Beautify mode normalizes spacing, applies consistent indentation, and sorts attributes so teams can focus on logic instead of formatting debates.',
      icon: '🪄',
      keywords: ['html beautifier', 'indentation cleanup', 'attribute sorting', 'code review', 'team workflows']
    },
    {
      problem: 'Broken markup from missing closing tags or improper nesting ships to production when editors lack immediate validation feedback.',
      solution: 'Real-time validation highlights structural issues with actionable error messages, preventing regressions before you commit or deploy.',
      icon: '🚨',
      keywords: ['html validation', 'unclosed tags', 'error reporting', 'quality assurance', 'bug prevention']
    },
    {
      problem: 'Manual minification is tedious and risky, yet production builds demand compact HTML to optimize performance metrics.',
      solution: 'Minify mode strips redundant whitespace while respecting inline scripts/styles, giving you production-ready markup in one click.',
      icon: '⚡',
      keywords: ['html minifier', 'performance optimization', 'whitespace removal', 'page speed', 'production build']
    }
  ],
  whyChoose: [
    {
      title: 'Browser-Only Processing',
      description: 'Sensitive landing pages, customer templates, or CMS exports never leave your machine. Everything runs client-side for privacy and compliance.',
      icon: '🔒',
      keywords: ['client-side html', 'secure formatter', 'no upload', 'privacy']
    },
    {
      title: 'Advanced Formatting Controls',
      description: 'Tweak indentation, line length, attribute order, comment handling, and self-closing tag behavior to match your team’s coding standards.',
      icon: '🎛️',
      keywords: ['indentation control', 'attribute sorting', 'comment handling', 'self closing tags']
    },
    {
      title: 'Developer-Friendly UI',
      description: 'Auto-processing, diff-friendly output, keyboard shortcuts, and copy/download buttons speed up repetitive cleanup during refactors.',
      icon: '🧑‍💻',
      keywords: ['auto formatting', 'keyboard shortcuts', 'copy html', 'download html', 'developer productivity']
    },
    {
      title: 'Integrated Validation Insights',
      description: 'Highlight warnings and errors inline with codes and locations so QA teams can document issues or share fixes with designers and content authors.',
      icon: '📋',
      keywords: ['validation insights', 'error codes', 'qa tooling', 'collaboration']
    }
  ]
};
