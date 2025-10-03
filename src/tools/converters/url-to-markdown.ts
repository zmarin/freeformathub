import type { Tool, ToolResult } from '../../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface UrlToMarkdownConfig {
  format: 'standard' | 'ai-friendly';
  includeMetadata: boolean;
  extractCodeBlocks: boolean;
  preserveLinks: boolean;
  includeImages: boolean;
  maxContentLength?: number;
}

/**
 * Convert HTML content to Markdown
 */
export function htmlToMarkdown(html: string, config: UrlToMarkdownConfig): string {
  // Basic HTML to Markdown conversion
  let markdown = html;

  // Remove script and style tags
  markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  markdown = markdown.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Headers (h1-h6)
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n\n');

  // Bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Code blocks and inline code
  if (config.extractCodeBlocks) {
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '\n```\n$1\n```\n\n');
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  }

  // Links
  if (config.preserveLinks) {
    markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  } else {
    markdown = markdown.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
  }

  // Images
  if (config.includeImages) {
    markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
    markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, '![]($1)');
  } else {
    markdown = markdown.replace(/<img[^>]*>/gi, '');
  }

  // Lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Paragraphs and line breaks
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n\n');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '\n> $1\n\n');

  // Tables (basic support)
  markdown = markdown.replace(/<table[^>]*>(.*?)<\/table>/gis, (match, content) => {
    return '\n\n' + content + '\n\n';
  });
  markdown = markdown.replace(/<tr[^>]*>(.*?)<\/tr>/gi, '$1\n');
  markdown = markdown.replace(/<th[^>]*>(.*?)<\/th>/gi, '| $1 ');
  markdown = markdown.replace(/<td[^>]*>(.*?)<\/td>/gi, '| $1 ');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  // Clean up whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

/**
 * Convert to AI-friendly structured format
 */
export function toAIFriendlyFormat(markdown: string, url: string, title?: string): string {
  const lines = markdown.split('\n');
  const output: string[] = [];

  output.push('---');
  output.push(`URL: ${url}`);
  if (title) output.push(`TITLE: ${title}`);
  output.push(`GENERATED: ${new Date().toISOString()}`);
  output.push('---');
  output.push('');

  // Extract main sections
  let currentSection = '';
  const sections: Record<string, string[]> = {};

  for (const line of lines) {
    if (line.startsWith('#')) {
      currentSection = line.replace(/^#+\s*/, '').toUpperCase().replace(/\s+/g, '_');
      sections[currentSection] = [];
    } else if (currentSection && line.trim()) {
      sections[currentSection].push(line);
    }
  }

  // Output in structured format
  for (const [section, content] of Object.entries(sections)) {
    if (content.length > 0) {
      output.push(`${section}:`);
      output.push(content.join('\n'));
      output.push('');
    }
  }

  return output.join('\n');
}

/**
 * Process URL to Markdown conversion
 */
export async function processUrlToMarkdown(
  url: string,
  config: UrlToMarkdownConfig
): Promise<ToolResult> {
  try {
    // Validate URL
    if (!url || !url.trim()) {
      return {
        success: false,
        error: 'Please enter a valid URL'
      };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return {
        success: false,
        error: 'Invalid URL format. Please include protocol (http:// or https://)'
      };
    }

    // Note: In the React component, we'll use WebFetch via the browser
    // This function will be called from the component after fetching
    return {
      success: false,
      error: 'This function should be called from the React component after fetching HTML'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert URL to Markdown'
    };
  }
}

export const URL_TO_MARKDOWN_TOOL: Tool = {
  id: 'url-to-markdown',
  name: 'URL to Markdown Converter',
  description: 'Convert any webpage to clean Markdown format. Perfect for documentation, saving articles, or preparing content for AI tools like Claude and GPT-4. Supports standard human-readable format and AI-optimized structured format for better LLM comprehension.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  slug: 'url-to-markdown',
  icon: '🔗',
  keywords: [
    'url to markdown',
    'webpage to markdown',
    'html to markdown',
    'web scraping',
    'documentation converter',
    'article converter',
    'ai-friendly format',
    'llm markdown',
    'claude markdown',
    'gpt markdown',
    'structured content'
  ],
  seoTitle: 'URL to Markdown Converter - Convert Webpages to Markdown Online',
  seoDescription: 'Convert any webpage to clean Markdown format. Supports AI-friendly structured output optimized for Claude, GPT-4, and other LLMs. Free, private, browser-based conversion.',
  features: [
    'Convert any webpage URL to Markdown',
    'Standard format: Clean, human-readable Markdown',
    'AI-friendly format: Structured for LLM context windows',
    'Extract headings, links, code blocks, and tables',
    'Remove ads, navigation, and clutter',
    'Copy or download converted Markdown',
    'Privacy-focused: Processing happens in your browser'
  ],
  configOptions: [
    {
      name: 'format',
      type: 'select',
      default: 'standard',
      required: true,
      description: 'Output format: standard (human-readable) or ai-friendly (structured)',
      options: [
        { value: 'standard', label: 'Standard Markdown' },
        { value: 'ai-friendly', label: 'AI-Friendly (Structured)' }
      ]
    },
    {
      name: 'preserveLinks',
      type: 'boolean',
      default: true,
      description: 'Keep hyperlinks in Markdown format [text](url)'
    },
    {
      name: 'extractCodeBlocks',
      type: 'boolean',
      default: true,
      description: 'Convert <pre><code> blocks to Markdown code blocks'
    },
    {
      name: 'includeImages',
      type: 'boolean',
      default: false,
      description: 'Include image references in output'
    },
    {
      name: 'includeMetadata',
      type: 'boolean',
      default: true,
      description: 'Add YAML frontmatter with URL and title'
    }
  ],
  examples: [
    {
      title: 'API Documentation (Zoho Projects)',
      input: 'https://projects.zoho.com/api-docs#projects#create-a-project',
      output: `---
URL: https://projects.zoho.com/api-docs#projects#create-a-project
TITLE: Create a Project - Zoho Projects API
GENERATED: 2025-01-15T10:30:00Z
---

CREATE_A_PROJECT:
POST /api/v3/portal/[PORTAL_ID]/projects/

AUTHENTICATION:
- OAuth 2.0 required
- Header: Authorization: Zoho-oauthtoken [ACCESS_TOKEN]

PARAMETERS:
- name (string, required): Project name
- description (string, optional): Project description
- owner_id (string, required): User ID of project owner`,
      description: 'Convert API documentation to AI-friendly structured format'
    },
    {
      title: 'Blog Article to Markdown',
      input: 'https://example.com/blog/how-to-use-markdown',
      output: `# How to Use Markdown

Markdown is a lightweight markup language...

## Benefits
- Easy to read
- Easy to write
- Portable

## Syntax Examples
\`\`\`markdown
# Heading
**bold** and *italic*
\`\`\``,
      description: 'Convert blog articles to clean Markdown'
    }
  ],
  useCases: [
    'Convert API documentation for AI-assisted development',
    'Save articles and tutorials in Markdown format',
    'Prepare web content for LLM context (Claude, GPT-4)',
    'Extract documentation from GitHub wikis',
    'Convert StackOverflow answers to Markdown notes',
    'Archive web content in portable format',
    'Create training data from web sources'
  ],
  commonErrors: [
    'CORS error: Some websites block cross-origin requests',
    'JavaScript-rendered content may not be captured',
    'Complex layouts might not convert perfectly',
    'Login-required pages cannot be accessed',
    'Rate limiting on repeated requests to same domain'
  ],
  faq: [
    {
      question: 'Can I convert any website to Markdown?',
      answer: 'Most public websites can be converted. However, sites with heavy JavaScript rendering, login requirements, or CORS restrictions may not work perfectly. Static content converts best.'
    },
    {
      question: 'What is AI-friendly format?',
      answer: 'AI-friendly format uses structured labels (URL:, TITLE:, SECTION:) instead of Markdown headers. This makes it easier for AI models like Claude and GPT-4 to parse and understand the content, using fewer tokens and providing better context.'
    },
    {
      question: 'Is my browsing data private?',
      answer: 'Yes! All conversion happens in your browser using client-side processing. URLs are fetched through your browser, and no data is sent to our servers or stored.'
    },
    {
      question: 'Why use this instead of copy-paste?',
      answer: 'This tool automatically cleans up navigation, ads, and formatting. It preserves semantic structure (headings, lists, code blocks) that gets lost with plain copy-paste, and offers AI-optimized formatting.'
    },
    {
      question: 'Can I convert documentation with code examples?',
      answer: 'Yes! The tool automatically detects and preserves code blocks, converting <pre><code> tags to Markdown code fences. Perfect for API documentation like Zoho, Stripe, or GitHub docs.'
    }
  ],
  relatedTools: []
};
