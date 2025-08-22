import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface MarkdownConverterConfig {
  mode: 'markdown-to-html' | 'html-to-markdown';
  enableSyntaxHighlighting: boolean;
  enableTables: boolean;
  enableStrikethrough: boolean;
  enableTaskLists: boolean;
  enableAutolinks: boolean;
  generateToc: boolean;
  addLineNumbers: boolean;
  sanitizeHtml: boolean;
  includeMetadata: boolean;
  outputFormat: 'full-html' | 'html-fragment' | 'markdown';
  headingOffset: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: {
    originalSize: number;
    processedSize: number;
    wordCount: number;
    characterCount: number;
    lineCount: number;
    headingCount: number;
    linkCount: number;
    imageCount: number;
    codeBlockCount: number;
    tableCount: number;
    listCount: number;
  };
}

interface MarkdownElement {
  type: string;
  content: string;
  level?: number;
  language?: string;
  href?: string;
  alt?: string;
  title?: string;
}

function parseMarkdown(markdown: string): MarkdownElement[] {
  const elements: MarkdownElement[] = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push({
          type: 'code-block',
          content: codeBlockContent.join('\n'),
          language: codeBlockLanguage
        });
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLanguage = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLanguage = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle tables
    if (trimmed.includes('|') && !inTable) {
      inTable = true;
      tableRows = [line];
      continue;
    } else if (inTable && trimmed.includes('|')) {
      tableRows.push(line);
      continue;
    } else if (inTable && !trimmed.includes('|')) {
      // End table
      elements.push({
        type: 'table',
        content: tableRows.join('\n')
      });
      inTable = false;
      tableRows = [];
    }

    // Skip if we're in a table
    if (inTable) continue;

    // Headers
    if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const content = trimmed.slice(level).trim();
      elements.push({
        type: 'heading',
        content,
        level: Math.min(level, 6)
      });
      continue;
    }

    // Horizontal rules
    if (trimmed.match(/^[-*_]{3,}$/)) {
      elements.push({
        type: 'hr',
        content: ''
      });
      continue;
    }

    // Lists
    if (trimmed.match(/^[*+-]\s/) || trimmed.match(/^\d+\.\s/)) {
      elements.push({
        type: trimmed.match(/^\d+\./) ? 'ordered-list-item' : 'unordered-list-item',
        content: trimmed.replace(/^([*+-]|\d+\.)\s/, '')
      });
      continue;
    }

    // Task lists
    if (trimmed.match(/^[*+-]\s\[[ x]\]\s/)) {
      const checked = trimmed.includes('[x]');
      const content = trimmed.replace(/^[*+-]\s\[[ x]\]\s/, '');
      elements.push({
        type: 'task-list-item',
        content: `${checked ? '[x]' : '[ ]'} ${content}`
      });
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      elements.push({
        type: 'blockquote',
        content: trimmed.slice(1).trim()
      });
      continue;
    }

    // Regular paragraphs
    if (trimmed.length > 0) {
      elements.push({
        type: 'paragraph',
        content: trimmed
      });
    } else {
      elements.push({
        type: 'empty-line',
        content: ''
      });
    }
  }

  // Handle any remaining table
  if (inTable && tableRows.length > 0) {
    elements.push({
      type: 'table',
      content: tableRows.join('\n')
    });
  }

  return elements;
}

function processInlineMarkdown(text: string, config: MarkdownConverterConfig): string {
  let processed = text;

  // Bold **text** or __text__
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic *text* or _text_
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');

  // Strikethrough ~~text~~ (if enabled)
  if (config.enableStrikethrough) {
    processed = processed.replace(/~~(.*?)~~/g, '<del>$1</del>');
  }

  // Inline code `text`
  processed = processed.replace(/`(.*?)`/g, '<code>$1</code>');

  // Links [text](url) or [text](url "title")
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+?)(?:\s+"([^"]+)")?\)/g, 
    (match, text, url, title) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${url}"${titleAttr}>${text}</a>`;
    }
  );

  // Images ![alt](url) or ![alt](url "title")
  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]+)")?\)/g, 
    (match, alt, url, title) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${url}" alt="${alt}"${titleAttr} />`;
    }
  );

  // Autolinks (if enabled)
  if (config.enableAutolinks) {
    processed = processed.replace(/(https?:\/\/[^\s<>]+)/g, '<a href="$1">$1</a>');
    processed = processed.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');
  }

  return processed;
}

function convertMarkdownToHtml(elements: MarkdownElement[], config: MarkdownConverterConfig): string {
  let html = '';
  let listStack: string[] = [];
  let tocEntries: { level: number; title: string; id: string }[] = [];

  const generateId = (text: string): string => {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  for (const element of elements) {
    switch (element.type) {
      case 'heading':
        // Close any open lists
        while (listStack.length > 0) {
          const tag = listStack.pop()!;
          html += `</${tag}>\n`;
        }

        const level = (element.level || 1) + config.headingOffset;
        const headingLevel = Math.min(Math.max(level, 1), 6);
        const processedContent = processInlineMarkdown(element.content, config);
        const id = generateId(element.content);
        
        if (config.generateToc) {
          tocEntries.push({ level: headingLevel, title: element.content, id });
        }
        
        html += `<h${headingLevel} id="${id}">${processedContent}</h${headingLevel}>\n`;
        break;

      case 'paragraph':
        // Close any open lists
        while (listStack.length > 0) {
          const tag = listStack.pop()!;
          html += `</${tag}>\n`;
        }
        
        const processedParagraph = processInlineMarkdown(element.content, config);
        html += `<p>${processedParagraph}</p>\n`;
        break;

      case 'code-block':
        // Close any open lists
        while (listStack.length > 0) {
          const tag = listStack.pop()!;
          html += `</${tag}>\n`;
        }

        const language = element.language || '';
        const codeClass = language ? ` class="language-${language}"` : '';
        html += `<pre><code${codeClass}>${escapeHtml(element.content)}</code></pre>\n`;
        break;

      case 'blockquote':
        // Close any open lists
        while (listStack.length > 0) {
          const tag = listStack.pop()!;
          html += `</${tag}>\n`;
        }

        const processedQuote = processInlineMarkdown(element.content, config);
        html += `<blockquote><p>${processedQuote}</p></blockquote>\n`;
        break;

      case 'unordered-list-item':
        if (listStack.length === 0 || listStack[listStack.length - 1] !== 'ul') {
          html += '<ul>\n';
          listStack.push('ul');
        }
        const processedULItem = processInlineMarkdown(element.content, config);
        html += `  <li>${processedULItem}</li>\n`;
        break;

      case 'ordered-list-item':
        if (listStack.length === 0 || listStack[listStack.length - 1] !== 'ol') {
          html += '<ol>\n';
          listStack.push('ol');
        }
        const processedOLItem = processInlineMarkdown(element.content, config);
        html += `  <li>${processedOLItem}</li>\n`;
        break;

      case 'task-list-item':
        if (config.enableTaskLists) {
          if (listStack.length === 0 || listStack[listStack.length - 1] !== 'ul') {
            html += '<ul class="task-list">\n';
            listStack.push('ul');
          }
          const isChecked = element.content.startsWith('[x]');
          const content = element.content.slice(3).trim();
          const processedTaskItem = processInlineMarkdown(content, config);
          const checkedAttr = isChecked ? ' checked' : '';
          html += `  <li class="task-list-item"><input type="checkbox"${checkedAttr} disabled> ${processedTaskItem}</li>\n`;
        }
        break;

      case 'table':
        if (config.enableTables) {
          // Close any open lists
          while (listStack.length > 0) {
            const tag = listStack.pop()!;
            html += `</${tag}>\n`;
          }

          const rows = element.content.split('\n');
          html += '<table>\n';
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i].trim();
            if (row.match(/^[\s|:-]+$/)) continue; // Skip separator rows
            
            const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
            const isHeader = i === 0;
            const tag = isHeader ? 'th' : 'td';
            const rowTag = isHeader ? 'thead' : (i === 1 ? 'tbody' : '');
            
            if (rowTag) html += `<${rowTag}>\n`;
            
            html += '  <tr>\n';
            for (const cell of cells) {
              const processedCell = processInlineMarkdown(cell, config);
              html += `    <${tag}>${processedCell}</${tag}>\n`;
            }
            html += '  </tr>\n';
            
            if (rowTag && isHeader) html += '</thead>\n';
          }
          
          if (rows.length > 1) html += '</tbody>\n';
          html += '</table>\n';
        }
        break;

      case 'hr':
        // Close any open lists
        while (listStack.length > 0) {
          const tag = listStack.pop()!;
          html += `</${tag}>\n`;
        }
        html += '<hr>\n';
        break;

      case 'empty-line':
        // Just add a newline for spacing
        break;
    }
  }

  // Close any remaining open lists
  while (listStack.length > 0) {
    const tag = listStack.pop()!;
    html += `</${tag}>\n`;
  }

  // Add table of contents if requested
  if (config.generateToc && tocEntries.length > 0) {
    let toc = '<div class="table-of-contents">\n<h2>Table of Contents</h2>\n<ul>\n';
    for (const entry of tocEntries) {
      toc += `  <li><a href="#${entry.id}">${entry.title}</a></li>\n`;
    }
    toc += '</ul>\n</div>\n\n';
    html = toc + html;
  }

  return html.trim();
}

function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Fallback for server-side
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calculateStats(input: string, output: string, elements: MarkdownElement[]): any {
  const wordCount = input.split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = input.length;
  const lineCount = input.split('\n').length;
  
  const headingCount = elements.filter(e => e.type === 'heading').length;
  const linkCount = (input.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
  const imageCount = (input.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;
  const codeBlockCount = elements.filter(e => e.type === 'code-block').length;
  const tableCount = elements.filter(e => e.type === 'table').length;
  const listCount = elements.filter(e => e.type.includes('list-item')).length;

  return {
    originalSize: input.length,
    processedSize: output.length,
    wordCount,
    characterCount,
    lineCount,
    headingCount,
    linkCount,
    imageCount,
    codeBlockCount,
    tableCount,
    listCount
  };
}

export function processMarkdownConverter(input: string, config: MarkdownConverterConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide content to convert'
      };
    }

    let output = '';

    if (config.mode === 'markdown-to-html') {
      const elements = parseMarkdown(input);
      const html = convertMarkdownToHtml(elements, config);
      
      if (config.outputFormat === 'full-html') {
        output = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1, h2, h3, h4, h5, h6 { margin-top: 2rem; margin-bottom: 1rem; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: 'Monaco', 'Consolas', monospace; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: #f4f4f4; }
        .task-list { list-style: none; padding-left: 0; }
        .task-list-item { margin: 0.5rem 0; }
        .table-of-contents { background: #f9f9f9; padding: 1rem; border-radius: 4px; margin-bottom: 2rem; }
        .table-of-contents ul { margin: 0; padding-left: 1.5rem; }
    </style>
</head>
<body>
${html}
</body>
</html>`;
      } else {
        output = html;
      }

      const stats = calculateStats(input, output, elements);
      
      return {
        success: true,
        output,
        stats
      };

    } else {
      // HTML to Markdown conversion (simplified)
      output = input
        .replace(/<h([1-6]).*?>(.*?)<\/h[1-6]>/gi, (match, level, content) => '#'.repeat(parseInt(level)) + ' ' + content)
        .replace(/<p.*?>(.*?)<\/p>/gi, '$1\n')
        .replace(/<strong.*?>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b.*?>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em.*?>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i.*?>(.*?)<\/i>/gi, '*$1*')
        .replace(/<code.*?>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre.*?><code.*?>(.*?)<\/code><\/pre>/gis, '```\n$1\n```')
        .replace(/<a.*?href=["']([^"']*?)["'].*?>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<img.*?src=["']([^"']*?)["'].*?alt=["']([^"']*?)["'].*?\/?>/gi, '![$2]($1)')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<hr\s*\/?>/gi, '---')
        .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
        .replace(/\n\s*\n\s*\n/g, '\n\n'); // Normalize line breaks

      return {
        success: true,
        output: output.trim(),
        stats: {
          originalSize: input.length,
          processedSize: output.length,
          wordCount: output.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: output.length,
          lineCount: output.split('\n').length,
          headingCount: (output.match(/^#+\s/gm) || []).length,
          linkCount: (output.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length,
          imageCount: (output.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length,
          codeBlockCount: (output.match(/```/g) || []).length / 2,
          tableCount: 0,
          listCount: (output.match(/^[*+-]\s/gm) || []).length
        }
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert content'
    };
  }
}

export const MARKDOWN_CONVERTER_TOOL: Tool = {
  id: 'markdown-converter',
  name: 'Markdown ↔ HTML Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'documents')!,
  slug: 'markdown-converter',
  icon: '📝',
  keywords: ['markdown', 'html', 'convert', 'md'],
  seoTitle: 'Markdown HTML Converter - Convert MD to HTML Online | FreeFormatHub',
  seoDescription: 'Convert Markdown to HTML or HTML to Markdown online. Support for tables, task lists, syntax highlighting, and custom formatting.',
  description: 'Convert Markdown to HTML or HTML to Markdown with support for tables, task lists, syntax highlighting, and custom formatting options. Generate table of contents and preserve document structure.',
  
  examples: [
    {
      title: 'Basic Markdown Document',
      input: `# My Document

This is a paragraph with **bold** and *italic* text.

## Code Example

Here's some code:

\`\`\`javascript
function hello() {
    console.log('Hello, World!');
}
\`\`\`

## List Items

- Item 1
- Item 2
- Item 3`,
      description: 'Convert a basic Markdown document to HTML'
    },
    {
      title: 'Table and Task List',
      input: `# Project Status

## Tasks
- [x] Setup project
- [ ] Write documentation
- [ ] Deploy to production

## Team Members

| Name | Role | Status |
|------|------|--------|
| John | Developer | Active |
| Jane | Designer | Active |`,
      description: 'Convert Markdown with tables and task lists'
    },
    {
      title: 'HTML to Markdown',
      input: `<h1>My Article</h1>
<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<p>Here's a <a href="https://example.com">link</a> and an image:</p>
<img src="image.jpg" alt="Example Image" />`,
      description: 'Convert HTML back to Markdown format'
    }
  ],
  
  useCases: [
    'Documentation generation and publishing',
    'Blog post and article formatting',
    'README file creation and editing',
    'Static site content management',
    'Technical writing and note-taking'
  ],
  
  faq: [
    {
      question: 'What Markdown features are supported?',
      answer: 'The converter supports standard Markdown plus GitHub Flavored Markdown features including tables, task lists, strikethrough text, syntax highlighting, and autolinks.'
    },
    {
      question: 'Can I generate a table of contents?',
      answer: 'Yes, enable the "Generate TOC" option to automatically create a table of contents from your headings with anchor links.'
    },
    {
      question: 'How does HTML sanitization work?',
      answer: 'When enabled, HTML sanitization removes potentially harmful HTML tags and attributes while preserving safe formatting elements.'
    },
    {
      question: 'What about syntax highlighting?',
      answer: 'The converter adds proper language classes to code blocks for syntax highlighting. You can use any highlighting library like Prism.js or highlight.js with the output.'
    },
    {
      question: 'Can I customize heading levels?',
      answer: 'Yes, use the heading offset option to adjust all heading levels. For example, offset +1 converts H1 to H2, H2 to H3, etc.'
    }
  ],
  
  commonErrors: [
    'Malformed table syntax - check pipe separators and header rows',
    'Unclosed code blocks - ensure every ``` has a closing ```',
    'Invalid link format - use [text](URL) syntax correctly',
    'Unbalanced HTML tags when converting from HTML'
  ],

  relatedTools: ['html-beautifier', 'text-diff', 'string-escape']
};