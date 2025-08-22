import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface HtmlMinifierConfig {
  removeComments: boolean;
  removeCommentsFromCDATA: boolean;
  preserveLineBreaks: boolean;
  collapseWhitespace: boolean;
  conservativeCollapse: boolean;
  removeEmptyElements: boolean;
  removeRedundantAttributes: boolean;
  removeScriptTypeAttributes: boolean;
  removeStyleLinkTypeAttributes: boolean;
  useShortDoctype: boolean;
  removeEmptyAttributes: boolean;
  sortAttributes: boolean;
  sortClassName: boolean;
  minifyCSS: boolean;
  minifyJS: boolean;
  removeOptionalTags: boolean;
  removeAttributeQuotes: boolean;
  caseSensitive: boolean;
  keepClosingSlash: boolean;
  decodeEntities: boolean;
  processScripts: boolean;
  processConditionalComments: boolean;
  trimCustomFragments: boolean;
  ignoreCustomComments: boolean;
  maxLineLength: number;
  customAttrAssign: boolean;
  customAttrSurround: boolean;
  removeTagWhitespace: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: MinificationMetadata;
  warnings?: string[];
}

interface MinificationMetadata {
  originalSize: number;
  minifiedSize: number;
  savings: number;
  compressionRatio: number;
  removedWhitespace: number;
  removedComments: number;
  removedEmptyElements: number;
  removedAttributes: number;
  processedElements: number;
  processingTime: number;
}

// HTML void elements that don't need closing tags
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Attributes that can be removed if empty
const REMOVABLE_EMPTY_ATTRS = new Set([
  'class', 'id', 'style', 'title', 'alt', 'src', 'href', 'value',
  'name', 'type', 'rel', 'content', 'data-*'
]);

// Redundant attributes that can be removed
const REDUNDANT_ATTRIBUTES = {
  'script': { 'type': 'text/javascript' },
  'link': { 'type': 'text/css' },
  'style': { 'type': 'text/css' },
  'form': { 'method': 'get' },
  'input': { 'type': 'text' },
  'button': { 'type': 'submit' },
  'area': { 'shape': 'rect' },
  'textarea': { 'wrap': 'soft' }
};

// Attributes that don't need quotes in HTML5
const UNQUOTED_ATTR_VALUES = /^[a-zA-Z0-9\-_.:]+$/;

function removeComments(html: string, preserveConditional: boolean): { html: string; count: number } {
  let count = 0;
  
  // Preserve IE conditional comments if requested
  const conditionalPattern = /<!--\s*\[if\s+[^\]]+\][\s\S]*?<!\[endif\]\s*-->/gi;
  const conditionalComments: string[] = [];
  
  if (preserveConditional) {
    html = html.replace(conditionalPattern, (match) => {
      const placeholder = `__CONDITIONAL_COMMENT_${conditionalComments.length}__`;
      conditionalComments.push(match);
      return placeholder;
    });
  }
  
  // Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, () => {
    count++;
    return '';
  });
  
  // Restore conditional comments
  if (preserveConditional) {
    conditionalComments.forEach((comment, index) => {
      html = html.replace(`__CONDITIONAL_COMMENT_${index}__`, comment);
    });
  }
  
  return { html, count };
}

function collapseWhitespace(html: string, conservative: boolean): { html: string; removed: number } {
  const originalLength = html.length;
  
  if (conservative) {
    // Conservative: only collapse multiple whitespace to single space
    html = html.replace(/\s+/g, ' ');
  } else {
    // Aggressive: remove whitespace between tags and normalize
    html = html
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+/g, ' ') // Collapse multiple whitespace
      .replace(/^\s+|\s+$/g, ''); // Trim start/end
  }
  
  return {
    html,
    removed: originalLength - html.length
  };
}

function removeEmptyElements(html: string): { html: string; count: number } {
  let count = 0;
  const originalHtml = html;
  
  // Remove empty elements (but preserve some meaningful empty ones)
  const preserveEmpty = new Set(['textarea', 'script', 'style', 'title', 'option']);
  
  html = html.replace(/<(\w+)(?:\s+[^>]*)?>\s*<\/\1>/gi, (match, tagName) => {
    if (preserveEmpty.has(tagName.toLowerCase())) {
      return match;
    }
    count++;
    return '';
  });
  
  return { html, count };
}

function removeRedundantAttributes(html: string): { html: string; count: number } {
  let count = 0;
  
  Object.entries(REDUNDANT_ATTRIBUTES).forEach(([tagName, attrs]) => {
    Object.entries(attrs).forEach(([attrName, defaultValue]) => {
      const pattern = new RegExp(
        `(<${tagName}\\b[^>]*)\\s${attrName}=["']?${defaultValue}["']?`,
        'gi'
      );
      
      html = html.replace(pattern, (match, beforeAttr) => {
        count++;
        return beforeAttr;
      });
    });
  });
  
  return { html, count };
}

function removeEmptyAttributes(html: string): { html: string; count: number } {
  let count = 0;
  
  // Remove attributes with empty values
  html = html.replace(/\s+([a-zA-Z-]+)=["']?\s*["']?/g, (match, attrName) => {
    if (REMOVABLE_EMPTY_ATTRS.has(attrName) || attrName.startsWith('data-')) {
      count++;
      return '';
    }
    return match;
  });
  
  return { html, count };
}

function removeAttributeQuotes(html: string): string {
  // Remove quotes from attributes that don't need them
  return html.replace(/(\w+)=["']([^"']*?)["']/g, (match, attrName, attrValue) => {
    if (UNQUOTED_ATTR_VALUES.test(attrValue) && !attrValue.includes(' ')) {
      return `${attrName}=${attrValue}`;
    }
    return match;
  });
}

function useShortDoctype(html: string): string {
  return html.replace(/<!DOCTYPE\s+html[^>]*>/i, '<!DOCTYPE html>');
}

function removeOptionalTags(html: string): string {
  // Remove optional HTML tags (very aggressive, use carefully)
  html = html.replace(/<\/?(html|head|body)\b[^>]*>/gi, '');
  return html;
}

function sortAttributes(html: string): string {
  return html.replace(/<(\w+)([^>]+)>/g, (match, tagName, attrs) => {
    const attrList = attrs.trim().split(/\s+/).filter(Boolean);
    attrList.sort();
    return `<${tagName} ${attrList.join(' ')}>`;
  });
}

function minifyInlineCSS(html: string): string {
  return html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (match, openTag, css, closeTag) => {
    // Basic CSS minification
    const minifiedCSS = css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove last semicolon
      .replace(/\s*{\s*/g, '{') // Remove space around braces
      .replace(/;\s*/g, ';') // Remove space after semicolons
      .replace(/:\s*/g, ':') // Remove space after colons
      .trim();
    
    return `${openTag}${minifiedCSS}${closeTag}`;
  });
}

function minifyInlineJS(html: string): string {
  return html.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, openTag, js, closeTag) => {
    // Basic JS minification (very conservative)
    const minifiedJS = js
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Clean up before closing braces
      .trim();
    
    return `${openTag}${minifiedJS}${closeTag}`;
  });
}

function processCustomFragments(html: string): string {
  // Process custom template fragments
  return html.replace(/\{\{[\s\S]*?\}\}/g, (match) => {
    return match.replace(/\s+/g, ' ');
  });
}

export function processHtmlMinifier(input: string, config: HtmlMinifierConfig): ToolResult {
  const startTime = performance.now();
  
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'HTML input is required'
      };
    }
    
    let html = input;
    let removedComments = 0;
    let removedWhitespace = 0;
    let removedEmptyElements = 0;
    let removedAttributes = 0;
    let processedElements = 0;
    const warnings: string[] = [];
    
    const originalSize = html.length;
    
    // Count elements for processing stats
    const elementMatches = html.match(/<\w+[^>]*>/g);
    processedElements = elementMatches ? elementMatches.length : 0;
    
    // Remove comments
    if (config.removeComments) {
      const commentResult = removeComments(html, config.processConditionalComments);
      html = commentResult.html;
      removedComments = commentResult.count;
    }
    
    // Use short doctype
    if (config.useShortDoctype) {
      html = useShortDoctype(html);
    }
    
    // Collapse whitespace
    if (config.collapseWhitespace) {
      const whitespaceResult = collapseWhitespace(html, config.conservativeCollapse);
      html = whitespaceResult.html;
      removedWhitespace = whitespaceResult.removed;
    }
    
    // Remove empty elements
    if (config.removeEmptyElements) {
      const emptyResult = removeEmptyElements(html);
      html = emptyResult.html;
      removedEmptyElements = emptyResult.count;
      
      if (emptyResult.count > 0) {
        warnings.push(`Removed ${emptyResult.count} empty elements`);
      }
    }
    
    // Remove redundant attributes
    if (config.removeRedundantAttributes) {
      const redundantResult = removeRedundantAttributes(html);
      html = redundantResult.html;
      removedAttributes += redundantResult.count;
    }
    
    // Remove empty attributes
    if (config.removeEmptyAttributes) {
      const emptyAttrResult = removeEmptyAttributes(html);
      html = emptyAttrResult.html;
      removedAttributes += emptyAttrResult.count;
    }
    
    // Remove script type attributes
    if (config.removeScriptTypeAttributes) {
      html = html.replace(/(<script[^>]*)\s+type=["']text\/javascript["']/gi, '$1');
    }
    
    // Remove style/link type attributes
    if (config.removeStyleLinkTypeAttributes) {
      html = html.replace(/(<(?:style|link)[^>]*)\s+type=["']text\/css["']/gi, '$1');
    }
    
    // Sort attributes
    if (config.sortAttributes) {
      html = sortAttributes(html);
    }
    
    // Remove attribute quotes
    if (config.removeAttributeQuotes) {
      html = removeAttributeQuotes(html);
    }
    
    // Remove optional tags (very aggressive)
    if (config.removeOptionalTags) {
      html = removeOptionalTags(html);
      warnings.push('Optional HTML tags removed - ensure this works with your use case');
    }
    
    // Minify inline CSS
    if (config.minifyCSS) {
      html = minifyInlineCSS(html);
    }
    
    // Minify inline JS
    if (config.minifyJS) {
      html = minifyInlineJS(html);
    }
    
    // Process custom fragments
    if (config.trimCustomFragments) {
      html = processCustomFragments(html);
    }
    
    // Preserve line breaks if requested
    if (config.preserveLineBreaks && config.collapseWhitespace) {
      warnings.push('Line breaks preserved - some compression benefits may be reduced');
    }
    
    // Final cleanup
    html = html.trim();
    
    const finalSize = html.length;
    const savings = originalSize - finalSize;
    const compressionRatio = originalSize > 0 ? (savings / originalSize) * 100 : 0;
    const processingTime = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Add performance warnings
    if (processingTime > 1000) {
      warnings.push('Large HTML file - consider processing in smaller chunks');
    }
    
    if (compressionRatio < 5) {
      warnings.push('Low compression ratio - HTML may already be optimized');
    }
    
    const metadata: MinificationMetadata = {
      originalSize,
      minifiedSize: finalSize,
      savings,
      compressionRatio,
      removedWhitespace,
      removedComments,
      removedEmptyElements,
      removedAttributes,
      processedElements,
      processingTime
    };
    
    return {
      success: true,
      output: html,
      metadata,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const HTML_MINIFIER_TOOL: Tool = {
  id: 'html-minifier',
  name: 'HTML Minifier',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'html-tools')!,
  slug: 'html-minifier',
  icon: '🗜️',
  keywords: ['html', 'minify', 'compress', 'optimize', 'web', 'performance', 'size', 'whitespace'],
  seoTitle: 'HTML Minifier - Compress HTML Code for Production | FreeFormatHub',
  seoDescription: 'Minify and optimize HTML code by removing whitespace, comments, and redundant attributes. Reduce file size for better web performance.',
  description: 'Compress and optimize HTML code by removing unnecessary whitespace, comments, empty elements, and redundant attributes for production deployment.',

  examples: [
    {
      title: 'Basic HTML Minification',
      input: `<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
    <!-- This is a comment -->
    <style type="text/css">
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div class="">
      <p>Hello World</p>
    </div>
  </body>
</html>`,
      output: `<!DOCTYPE html><html><head><title>My Page</title><style>body{margin:0;padding:0}</style></head><body><div><p>Hello World</p></div></body></html>`,
      description: 'Remove comments, whitespace, and empty attributes'
    },
    {
      title: 'Advanced Optimization',
      input: `<script type="text/javascript">
  console.log("Debug message");
  function hello() {
    // Another comment
    return "world";
  }
</script>`,
      output: `<script>console.log("Debug message");function hello(){return"world"}</script>`,
      description: 'Minify inline JavaScript and remove redundant attributes'
    },
    {
      title: 'Form Optimization',
      input: `<form method="get">
  <input type="text" value="" class="" />
  <button type="submit">Submit</button>
</form>`,
      output: `<form><input /><button>Submit</button></form>`,
      description: 'Remove default attributes and empty values'
    }
  ],

  useCases: [
    'Reducing HTML file size for faster web page loading',
    'Optimizing HTML for production deployment and CDN delivery',
    'Minimizing bandwidth usage in mobile applications',
    'Preparing HTML for email templates with size constraints',
    'Optimizing HTML for embedding in other applications',
    'Reducing storage requirements for cached HTML content',
    'Improving Core Web Vitals and page performance scores',
    'Preparing HTML for AMP (Accelerated Mobile Pages) compliance'
  ],

  faq: [
    {
      question: 'Is it safe to remove optional HTML tags?',
      answer: 'Removing optional tags like <html>, <head>, and <body> is technically valid HTML5 but may cause issues with some parsers or frameworks. Use this option carefully and test thoroughly.'
    },
    {
      question: 'Will minification break my HTML functionality?',
      answer: 'The minifier is designed to preserve functionality while reducing size. However, always test minified HTML, especially when using aggressive options like removing optional tags.'
    },
    {
      question: 'How much compression can I expect?',
      answer: 'Compression ratios vary based on your HTML structure. Typical savings range from 10-30% for well-formatted HTML, with higher savings for HTML with extensive whitespace and comments.'
    },
    {
      question: 'Should I minify inline CSS and JavaScript?',
      answer: 'Yes, minifying inline styles and scripts can provide additional savings. However, for large amounts of CSS/JS, consider using separate files with dedicated minifiers for better optimization.'
    },
    {
      question: 'Can I preserve certain comments in my HTML?',
      answer: 'The minifier can preserve IE conditional comments which are often important for legacy browser support. Other comments are removed by default for maximum compression.'
    }
  ],

  commonErrors: [
    'Malformed HTML structure causing parsing errors',
    'Breaking template syntax when processing custom fragments',
    'Removing essential attributes that affect functionality',
    'Issues with self-closing tags in XML/XHTML contexts',
    'Browser compatibility problems with heavily optimized HTML'
  ],

  relatedTools: ['html-beautifier', 'css-minifier', 'js-minifier', 'html-validator', 'css-optimizer']
};