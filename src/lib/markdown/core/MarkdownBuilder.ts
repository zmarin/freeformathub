/**
 * MarkdownBuilder - Fluent API for constructing Markdown documents
 *
 * Provides a chainable interface for building well-formatted Markdown
 * with consistent styling and structure.
 */

export class MarkdownBuilder {
  private content: string[] = [];
  private currentIndent = 0;

  /**
   * Add YAML frontmatter metadata
   */
  frontmatter(data: Record<string, any>): this {
    this.content.push('---');
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        this.content.push(`${key}: [${value.join(', ')}]`);
      } else if (typeof value === 'object') {
        this.content.push(`${key}:`);
        Object.entries(value).forEach(([k, v]) => {
          this.content.push(`  ${k}: ${v}`);
        });
      } else {
        this.content.push(`${key}: ${value}`);
      }
    });
    this.content.push('---');
    this.content.push('');
    return this;
  }

  /**
   * Add a heading with specified level (1-6)
   */
  heading(text: string, level: number = 1): this {
    const prefix = '#'.repeat(Math.max(1, Math.min(6, level)));
    this.content.push(`${prefix} ${text}`);
    this.content.push('');
    return this;
  }

  /**
   * Add a paragraph of text
   */
  paragraph(text: string): this {
    this.content.push(text);
    this.content.push('');
    return this;
  }

  /**
   * Add a blockquote
   */
  blockquote(text: string): this {
    this.content.push(`> ${text}`);
    this.content.push('');
    return this;
  }

  /**
   * Add a code block with optional language
   */
  codeBlock(code: string, language: string = ''): this {
    this.content.push(`\`\`\`${language}`);
    this.content.push(code.trim());
    this.content.push('```');
    this.content.push('');
    return this;
  }

  /**
   * Add an unordered list
   */
  list(items: string[], ordered: boolean = false): this {
    items.forEach((item, index) => {
      const prefix = ordered ? `${index + 1}.` : '-';
      this.content.push(`${prefix} ${item}`);
    });
    this.content.push('');
    return this;
  }

  /**
   * Add a table with headers and rows
   */
  table(headers: string[], rows: string[][]): this {
    // Header row
    this.content.push(`| ${headers.join(' | ')} |`);

    // Separator row
    const separator = headers.map(() => '---').join(' | ');
    this.content.push(`| ${separator} |`);

    // Data rows
    rows.forEach(row => {
      this.content.push(`| ${row.join(' | ')} |`);
    });

    this.content.push('');
    return this;
  }

  /**
   * Add a horizontal rule
   */
  hr(): this {
    this.content.push('---');
    this.content.push('');
    return this;
  }

  /**
   * Add a link
   */
  link(text: string, url: string): this {
    this.content.push(`[${text}](${url})`);
    return this;
  }

  /**
   * Add bold text
   */
  bold(text: string): this {
    this.content.push(`**${text}**`);
    return this;
  }

  /**
   * Add inline code
   */
  inlineCode(text: string): this {
    this.content.push(`\`${text}\``);
    return this;
  }

  /**
   * Add a collapsible details section
   */
  details(summary: string, content: string): this {
    this.content.push(`<details>`);
    this.content.push(`<summary>${summary}</summary>`);
    this.content.push('');
    this.content.push(content);
    this.content.push('</details>');
    this.content.push('');
    return this;
  }

  /**
   * Add raw markdown content
   */
  raw(markdown: string): this {
    this.content.push(markdown);
    return this;
  }

  /**
   * Add a newline
   */
  newline(): this {
    this.content.push('');
    return this;
  }

  /**
   * Add a section (heading + content)
   */
  section(title: string, level: number = 2): SectionBuilder {
    return new SectionBuilder(this, title, level);
  }

  /**
   * Build and return the final markdown string
   */
  build(): string {
    return this.content.join('\n').trim() + '\n';
  }

  /**
   * Get current content length (for token estimation)
   */
  getLength(): number {
    return this.build().length;
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 chars)
   */
  estimateTokens(): number {
    return Math.ceil(this.getLength() / 4);
  }
}

/**
 * SectionBuilder - Chainable builder for sections with content
 */
class SectionBuilder {
  constructor(
    private parent: MarkdownBuilder,
    private title: string,
    private level: number
  ) {
    this.parent.heading(title, level);
  }

  paragraph(text: string): this {
    this.parent.paragraph(text);
    return this;
  }

  list(items: string[], ordered: boolean = false): this {
    this.parent.list(items, ordered);
    return this;
  }

  codeBlock(code: string, language: string = ''): this {
    this.parent.codeBlock(code, language);
    return this;
  }

  table(headers: string[], rows: string[][]): this {
    this.parent.table(headers, rows);
    return this;
  }

  end(): MarkdownBuilder {
    return this.parent;
  }
}

/**
 * Helper functions for common markdown patterns
 */
export class MarkdownHelpers {
  /**
   * Format a tool URL as a clickable link
   */
  static toolLink(name: string, url: string): string {
    return `[${name}](${url})`;
  }

  /**
   * Format a parameter with type and description
   */
  static parameter(name: string, type: string, description: string, required: boolean = false): string {
    const badge = required ? '**Required**' : '*Optional*';
    return `\`${name}\` (${type}) - ${badge} - ${description}`;
  }

  /**
   * Create a badge/tag
   */
  static badge(text: string, color?: string): string {
    return `\`${text}\``;
  }

  /**
   * Format keywords as inline code tags
   */
  static keywords(keywords: string[]): string {
    return keywords.map(k => `\`${k}\``).join(', ');
  }

  /**
   * Create a task list item
   */
  static task(text: string, checked: boolean = false): string {
    const mark = checked ? 'x' : ' ';
    return `- [${mark}] ${text}`;
  }

  /**
   * Format a configuration object as inline code
   */
  static config(obj: Record<string, any>): string {
    return `\`${JSON.stringify(obj)}\``;
  }
}
