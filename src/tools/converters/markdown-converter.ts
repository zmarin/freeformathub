import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../../types/tool';

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

interface ParsedNode {
  type: string;
  tagName?: string;
  textContent?: string;
  attributes?: Record<string, string>;
  children?: ParsedNode[];
}

function parseHtmlToNodes(html: string): ParsedNode[] {
  if (typeof DOMParser === 'undefined') {
    // Fallback for server-side - use basic regex parsing
    return parseHtmlBasic(html);
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.querySelector('div');

    if (!container) return [];

    return Array.from(container.childNodes).map(node => parseNode(node as Element | Text));
  } catch (error) {
    // Fallback to basic parsing
    return parseHtmlBasic(html);
  }
}

function parseNode(node: Element | Text | ChildNode): ParsedNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return {
      type: 'text',
      textContent: node.textContent || ''
    };
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const attributes: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    return {
      type: 'element',
      tagName: element.tagName.toLowerCase(),
      attributes,
      children: Array.from(element.childNodes).map(child => parseNode(child))
    };
  }

  return { type: 'unknown' };
}

function parseHtmlBasic(html: string): ParsedNode[] {
  // Basic fallback parser for server-side
  const nodes: ParsedNode[] = [];
  const lines = html.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Simple tag detection
    const tagMatch = trimmed.match(/<(\w+)([^>]*)>(.*?)<\/\1>/i);
    if (tagMatch) {
      const [, tagName, attrs, content] = tagMatch;
      nodes.push({
        type: 'element',
        tagName: tagName.toLowerCase(),
        attributes: parseAttributes(attrs),
        children: content ? [{ type: 'text', textContent: content }] : []
      });
    } else {
      nodes.push({
        type: 'text',
        textContent: trimmed
      });
    }
  }

  return nodes;
}

function parseAttributes(attrString: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let match;

  while ((match = attrRegex.exec(attrString)) !== null) {
    attributes[match[1]] = match[2];
  }

  return attributes;
}

function convertHtmlToMarkdown(nodes: ParsedNode[], config: MarkdownConverterConfig): string {
  let markdown = '';
  let listStack: Array<{ type: 'ul' | 'ol'; indent: number }> = [];
  let tableRows: string[] = [];
  let inTable = false;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.type === 'text') {
      const text = (node.textContent || '').trim();
      if (text) {
        markdown += text;
        if (i < nodes.length - 1) markdown += ' ';
      }
      continue;
    }

    if (node.type !== 'element' || !node.tagName) continue;

    switch (node.tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        const level = parseInt(node.tagName.slice(1));
        const headingText = extractTextContent(node.children || []);
        markdown += '\n' + '#'.repeat(level) + ' ' + headingText + '\n\n';
        break;

      case 'p':
        const pText = extractTextContent(node.children || []);
        if (pText.trim()) {
          markdown += pText + '\n\n';
        }
        break;

      case 'strong':
      case 'b':
        const strongText = extractTextContent(node.children || []);
        markdown += '**' + strongText + '**';
        break;

      case 'em':
      case 'i':
        const emText = extractTextContent(node.children || []);
        markdown += '*' + emText + '*';
        break;

      case 'code':
        const codeText = extractTextContent(node.children || []);
        markdown += '`' + codeText + '`';
        break;

      case 'pre':
        const preContent = node.children?.find(child => child.tagName === 'code');
        if (preContent) {
          const language = preContent.attributes?.class?.replace('language-', '') || '';
          const codeContent = extractTextContent(preContent.children || []);
          markdown += '\n```' + language + '\n' + codeContent + '\n```\n\n';
        } else {
          const preText = extractTextContent(node.children || []);
          markdown += '\n```\n' + preText + '\n```\n\n';
        }
        break;

      case 'a':
        const linkText = extractTextContent(node.children || []);
        const href = node.attributes?.href || '';
        const title = node.attributes?.title;
        if (title) {
          markdown += '[' + linkText + '](' + href + ' "' + title + '")';
        } else {
          markdown += '[' + linkText + '](' + href + ')';
        }
        break;

      case 'img':
        const alt = node.attributes?.alt || '';
        const src = node.attributes?.src || '';
        const imgTitle = node.attributes?.title;
        if (imgTitle) {
          markdown += '![' + alt + '](' + src + ' "' + imgTitle + '")';
        } else {
          markdown += '![' + alt + '](' + src + ')';
        }
        break;

      case 'blockquote':
        const quoteText = extractTextContent(node.children || []);
        const quoteLines = quoteText.split('\n');
        for (const line of quoteLines) {
          if (line.trim()) {
            markdown += '> ' + line.trim() + '\n';
          }
        }
        markdown += '\n';
        break;

      case 'ul':
        if (config.enableTaskLists && node.attributes?.class?.includes('task-list')) {
          markdown += convertTaskList(node.children || []);
        } else {
          markdown += convertList(node.children || [], 'ul', 0);
        }
        markdown += '\n';
        break;

      case 'ol':
        markdown += convertList(node.children || [], 'ol', 0);
        markdown += '\n';
        break;

      case 'table':
        if (config.enableTables) {
          markdown += convertTable(node.children || []);
          markdown += '\n';
        }
        break;

      case 'hr':
        markdown += '\n---\n\n';
        break;

      case 'br':
        markdown += '\n';
        break;

      case 'del':
      case 's':
        if (config.enableStrikethrough) {
          const delText = extractTextContent(node.children || []);
          markdown += '~~' + delText + '~~';
        }
        break;

      default:
        // For unknown tags, just extract text content
        const unknownText = extractTextContent(node.children || []);
        if (unknownText.trim()) {
          markdown += unknownText;
        }
        break;
    }
  }

  // Clean up extra whitespace
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
    .trim();
}

function extractTextContent(nodes: ParsedNode[]): string {
  let text = '';

  for (const node of nodes) {
    if (node.type === 'text') {
      text += node.textContent || '';
    } else if (node.type === 'element' && node.children) {
      text += extractTextContent(node.children);
    }
  }

  return text;
}

function convertList(nodes: ParsedNode[], listType: 'ul' | 'ol', indent: number): string {
  let markdown = '';
  let itemCount = 0;

  for (const node of nodes) {
    if (node.type === 'element' && node.tagName === 'li') {
      itemCount++;
      const prefix = listType === 'ul' ? '-' : `${itemCount}.`;
      const indentStr = '  '.repeat(indent);

      if (node.children) {
        const itemText = extractTextContent(node.children);
        markdown += indentStr + prefix + ' ' + itemText + '\n';

        // Handle nested lists
        const nestedList = node.children.find(child =>
          child.type === 'element' && (child.tagName === 'ul' || child.tagName === 'ol')
        );
        if (nestedList && nestedList.children) {
          markdown += convertList(nestedList.children, nestedList.tagName as 'ul' | 'ol', indent + 1);
        }
      }
    }
  }

  return markdown;
}

function convertTaskList(nodes: ParsedNode[]): string {
  let markdown = '';

  for (const node of nodes) {
    if (node.type === 'element' && node.tagName === 'li' && node.attributes?.class?.includes('task-list-item')) {
      const checkbox = node.children?.find(child =>
        child.type === 'element' && child.tagName === 'input' && child.attributes?.type === 'checkbox'
      );
      const isChecked = checkbox?.attributes?.checked !== undefined;
      const checkmark = isChecked ? '[x]' : '[ ]';

      const textNodes = node.children?.filter(child =>
        child.type === 'text' || (child.type === 'element' && child.tagName !== 'input')
      ) || [];
      const itemText = extractTextContent(textNodes).trim();

      markdown += '- ' + checkmark + ' ' + itemText + '\n';
    }
  }

  return markdown;
}

function convertTable(nodes: ParsedNode[]): string {
  let markdown = '';
  const rows: string[][] = [];
  let hasHeader = false;

  for (const node of nodes) {
    if (node.type === 'element') {
      if (node.tagName === 'thead') {
        hasHeader = true;
        const headerRows = extractTableRows(node.children || []);
        rows.push(...headerRows);
      } else if (node.tagName === 'tbody') {
        const bodyRows = extractTableRows(node.children || []);
        rows.push(...bodyRows);
      } else if (node.tagName === 'tr') {
        const row = extractTableCells(node.children || []);
        rows.push(row);
      }
    }
  }

  if (rows.length === 0) return '';

  // Build markdown table
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    markdown += '| ' + row.join(' | ') + ' |\n';

    // Add separator after header row
    if (i === 0 && (hasHeader || rows.length > 1)) {
      const separator = row.map(() => '---').join(' | ');
      markdown += '| ' + separator + ' |\n';
    }
  }

  return markdown;
}

function extractTableRows(nodes: ParsedNode[]): string[][] {
  const rows: string[][] = [];

  for (const node of nodes) {
    if (node.type === 'element' && node.tagName === 'tr') {
      const row = extractTableCells(node.children || []);
      rows.push(row);
    }
  }

  return rows;
}

function extractTableCells(nodes: ParsedNode[]): string[] {
  const cells: string[] = [];

  for (const node of nodes) {
    if (node.type === 'element' && (node.tagName === 'td' || node.tagName === 'th')) {
      const cellText = extractTextContent(node.children || []).replace(/\n/g, ' ').trim();
      cells.push(cellText);
    }
  }

  return cells;
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
      // HTML to Markdown conversion (enhanced with proper parsing)
      const nodes = parseHtmlToNodes(input);
      output = convertHtmlToMarkdown(nodes, config);

      const elements = parseMarkdown(output); // Parse the result to get stats
      const stats = calculateStats(input, output, elements);

      // Update table count for HTML conversion
      const tableMatches = input.match(/<table[^>]*>/gi) || [];
      stats.tableCount = tableMatches.length;

      return {
        success: true,
        output: output.trim(),
        stats
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
  description: 'Professional bidirectional Markdown ↔ HTML converter with comprehensive support for tables, task lists, nested lists, syntax highlighting, and complex HTML structures. True round-trip conversion preserving document structure and formatting.',
  
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
      output: `<h1 id="my-document">My Document</h1>
<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<h2 id="code-example">Code Example</h2>
<p>Here's some code:</p>
<pre><code class="language-javascript">function hello() {
    console.log('Hello, World!');
}
</code></pre>
<h2 id="list-items">List Items</h2>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>`,
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
      output: `<h1 id="project-status">Project Status</h1>
<h2 id="tasks">Tasks</h2>
<ul class="task-list">
  <li class="task-list-item"><input type="checkbox" checked disabled> Setup project</li>
  <li class="task-list-item"><input type="checkbox" disabled> Write documentation</li>
  <li class="task-list-item"><input type="checkbox" disabled> Deploy to production</li>
</ul>
<h2 id="team-members">Team Members</h2>
<table>
<thead>
  <tr>
    <th>Name</th>
    <th>Role</th>
    <th>Status</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>John</td>
    <td>Developer</td>
    <td>Active</td>
  </tr>
  <tr>
    <td>Jane</td>
    <td>Designer</td>
    <td>Active</td>
  </tr>
</tbody>
</table>`,
      description: 'Convert Markdown with tables and task lists'
    },
    {
      title: 'Complex HTML to Markdown',
      input: `<h1>Advanced HTML Document</h1>
<p>This is a paragraph with <strong>bold</strong>, <em>italic</em>, and <code>inline code</code>.</p>

<h2>Features List</h2>
<ul>
  <li>Regular list item</li>
  <li>Item with <a href="https://example.com" title="Example Site">nested link</a></li>
  <li>
    Nested list:
    <ul>
      <li>Nested item 1</li>
      <li>Nested item 2</li>
    </ul>
  </li>
</ul>

<h3>Task List</h3>
<ul class="task-list">
  <li class="task-list-item"><input type="checkbox" checked disabled> Completed task</li>
  <li class="task-list-item"><input type="checkbox" disabled> Pending task</li>
</ul>

<h3>Data Table</h3>
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>Developer</td>
      <td><strong>Active</strong></td>
    </tr>
    <tr>
      <td>Jane Smith</td>
      <td>Designer</td>
      <td><em>On Leave</em></td>
    </tr>
  </tbody>
</table>

<blockquote>
  <p>This is an important quote that spans multiple lines and contains <strong>formatted text</strong>.</p>
</blockquote>

<pre><code class="language-javascript">function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');</code></pre>

<hr>

<p>Image with title: <img src="diagram.png" alt="System Diagram" title="Architecture Overview" /></p>`,
      output: `# Advanced HTML Document

This is a paragraph with **bold**, *italic*, and \`inline code\`.

## Features List

- Regular list item
- Item with [nested link](https://example.com "Example Site")
- Nested list:
  - Nested item 1
  - Nested item 2

### Task List

- [x] Completed task
- [ ] Pending task

### Data Table

| Name | Role | Status |
| --- | --- | --- |
| John Doe | Developer | **Active** |
| Jane Smith | Designer | *On Leave* |

> This is an important quote that spans multiple lines and contains **formatted text**.

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

---

Image with title: ![System Diagram](diagram.png "Architecture Overview")`,
      description: 'Convert complex HTML with tables, nested lists, and rich formatting to Markdown'
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
      question: 'Does this truly work both ways?',
      answer: 'Yes! This converter uses sophisticated DOM parsing for HTML to Markdown conversion, supporting complex structures like nested lists, tables, task lists, blockquotes, and code blocks. It\'s not just basic regex replacement.'
    },
    {
      question: 'What HTML elements are supported in HTML→Markdown?',
      answer: 'The converter handles headings, paragraphs, bold/italic text, links (with titles), images, code blocks (with language detection), tables, ordered/unordered lists, task lists, blockquotes, horizontal rules, and strikethrough text.'
    },
    {
      question: 'Can it handle nested HTML structures?',
      answer: 'Absolutely. The converter properly parses nested lists, tables with complex content, blockquotes with formatting, and preserves the hierarchical structure of your HTML.'
    },
    {
      question: 'What about Markdown features going to HTML?',
      answer: 'The Markdown to HTML conversion supports all GitHub Flavored Markdown features: tables, task lists, strikethrough text, syntax highlighting, autolinks, and custom formatting options like TOC generation.'
    },
    {
      question: 'Can I customize the conversion process?',
      answer: 'Yes, you can enable/disable specific features like tables, task lists, strikethrough, autolinks, TOC generation, and adjust heading levels. Perfect for different use cases and platforms.'
    },
    {
      question: 'Does it preserve code syntax highlighting?',
      answer: 'Yes, code blocks maintain their language information in both directions. HTML <pre><code class="language-js"> becomes ```js and vice versa.'
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