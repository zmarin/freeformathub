import { BaseStrategy } from './BaseStrategy';
import type { GeneratorContext, ExportResult, MarkdownMetadata, FormatType } from '../types';
import type { Tool } from '../../../types';

/**
 * Strategy for generating markdown documentation for individual tool pages
 *
 * Produces comprehensive documentation including examples, configuration,
 * use cases, and error handling.
 */
export class ToolPageStrategy extends BaseStrategy {
  constructor(format: FormatType, options = {}) {
    super(format, { ...options, pageType: 'tool' });
  }

  generate(context: GeneratorContext): ExportResult {
    const { tool, siteUrl = 'https://freeformathub.com' } = context;

    if (!tool) {
      throw new Error('Tool context is required for ToolPageStrategy');
    }

    this.reset();

    // Generate metadata
    const metadata = this.generateMetadata(context);
    this.addFrontmatter(metadata);

    // Build document based on format
    if (this.isAIFriendly()) {
      this.buildAIFriendlyDocument(tool, siteUrl);
    } else {
      this.buildStandardDocument(tool, siteUrl);
    }

    const content = this.builder.build();
    const filename = this.getDefaultFilename(context);

    return this.createResult(content, filename, metadata);
  }

  protected generateMetadata(context: GeneratorContext): MarkdownMetadata {
    const { tool, siteUrl = 'https://freeformathub.com' } = context;

    if (!tool) {
      throw new Error('Tool is required');
    }

    return {
      title: tool.name,
      type: 'tool' as const,
      url: `${siteUrl}/${tool.category.id}/${tool.slug}`,
      category: tool.category.name,
      subcategory: tool.subcategory?.name,
      keywords: tool.keywords,
      generated: new Date().toISOString(),
      version: '1.0',
      privacy: 'client-side',
    };
  }

  getDefaultFilename(context: GeneratorContext): string {
    const { tool } = context;
    if (!tool) return 'tool-export.md';

    const slug = tool.slug || tool.id;
    const format = this.isAIFriendly() ? 'ai' : 'standard';
    return `${slug}-${format}.md`;
  }

  /**
   * Build standard human-friendly document
   */
  private buildStandardDocument(tool: Tool, siteUrl: string): void {
    // Title and description
    this.builder
      .heading(tool.name, 1)
      .blockquote(tool.description)
      .newline();

    // Overview section
    this.builder
      .heading('Overview', 2)
      .paragraph(tool.description);

    // Features/Capabilities
    if (tool.features && tool.features.length > 0) {
      this.builder
        .heading('Features', 2)
        .list(tool.features.map(f => `✓ ${f}`));
    }

    // Configuration options
    if (tool.configOptions && tool.configOptions.length > 0) {
      this.buildConfigurationSection(tool);
    }

    // Usage examples
    if (tool.examples && tool.examples.length > 0) {
      this.buildExamplesSection(tool);
    }

    // Use cases
    if (tool.useCases && tool.useCases.length > 0) {
      this.builder
        .heading('Common Use Cases', 2)
        .list(tool.useCases, true);
    }

    // FAQs
    if (tool.faqs && tool.faqs.length > 0) {
      this.buildFAQSection(tool);
    }

    // Related tools
    if (tool.relatedTools && tool.relatedTools.length > 0) {
      this.buildRelatedToolsSection(tool, siteUrl);
    }

    // Keywords
    this.builder
      .heading('Keywords', 2)
      .paragraph(this.formatKeywords(tool.keywords || []));
  }

  /**
   * Build AI-friendly compact document
   */
  private buildAIFriendlyDocument(tool: Tool, siteUrl: string): void {
    // Structured format optimized for AI parsing
    this.builder
      .raw(`TOOL: ${tool.name}`)
      .raw(`URL: ${siteUrl}/${tool.category.id}/${tool.slug}`)
      .raw(`CATEGORY: ${tool.category.name} > ${tool.subcategory?.name || 'General'}`)
      .newline();

    this.builder
      .raw(`DESCRIPTION:`)
      .raw(tool.description)
      .newline();

    // Capabilities (concise list)
    if (tool.features && tool.features.length > 0) {
      this.builder.raw(`CAPABILITIES:`);
      tool.features.forEach(feature => {
        this.builder.raw(`- ${feature}`);
      });
      this.builder.newline();
    }

    // Examples in compact format
    if (tool.examples && tool.examples.length > 0) {
      this.buildAIFriendlyExamples(tool);
    }

    // Common patterns (use cases)
    if (tool.useCases && tool.useCases.length > 0) {
      this.builder.raw(`COMMON_PATTERNS:`);
      tool.useCases.forEach(useCase => {
        this.builder.raw(`- ${useCase}`);
      });
      this.builder.newline();
    }

    // Error handling (from FAQs or common errors)
    if (tool.commonErrors && tool.commonErrors.length > 0) {
      this.builder.raw(`ERROR_HANDLING:`);
      tool.commonErrors.forEach(error => {
        this.builder.raw(`- ${error}`);
      });
      this.builder.newline();
    }

    // Keywords (compact format)
    if (tool.keywords && tool.keywords.length > 0) {
      this.builder.raw(`KEYWORDS: ${tool.keywords.join(', ')}`);
    }
  }

  /**
   * Build examples section for standard format
   */
  private buildExamplesSection(tool: Tool): void {
    this.builder.heading('Usage Examples', 2);

    const examples = this.limitExamples(tool.examples || []);

    examples.forEach((example, index) => {
      this.builder.heading(`Example ${index + 1}: ${example.title}`, 3);

      if (example.description) {
        this.builder.paragraph(example.description);
      }

      this.builder
        .bold('Input:')
        .codeBlock(example.input, this.detectLanguage(example.input));

      this.builder
        .bold('Output:')
        .codeBlock(example.output, this.detectLanguage(example.output));

      // TODO(human): Add configuration display if available
      // this.builder.bold('Config:').paragraph(`\`${JSON.stringify(example.config)}\``);

      this.builder.hr();
    });
  }

  /**
   * Build examples in AI-friendly format
   */
  private buildAIFriendlyExamples(tool: Tool): void {
    this.builder.raw(`EXAMPLES:`);

    const examples = this.limitExamples(tool.examples || []);

    examples.forEach((example, index) => {
      // Compact format: INPUT → OUTPUT with minimal formatting
      this.builder.raw(`\nExample ${index + 1}: ${example.title}`);
      this.builder.raw(`INPUT: ${this.compactCode(example.input)}`);
      this.builder.raw(`OUTPUT: ${this.compactCode(example.output)}`);
    });

    this.builder.newline();
  }

  /**
   * Build FAQ section
   */
  private buildFAQSection(tool: Tool): void {
    this.builder.heading('FAQs', 2);

    (tool.faqs || []).forEach(faq => {
      this.builder
        .paragraph(`**Q: ${faq.question}**`)
        .paragraph(`A: ${faq.answer}`)
        .newline();
    });
  }

  /**
   * Build related tools section
   */
  private buildRelatedToolsSection(tool: Tool, siteUrl: string): void {
    this.builder.heading('Related Tools', 2);

    const relatedList = (tool.relatedTools || []).map(related => {
      const url = related.url || `/${related.category?.id}/${related.slug}`;
      return `**${related.name}** - [${siteUrl}${url}](${siteUrl}${url})`;
    });

    this.builder.list(relatedList);
  }

  /**
   * Detect programming language for syntax highlighting
   */
  private detectLanguage(code: string): string {
    // Simple heuristic-based detection
    if (code.trim().startsWith('{') || code.trim().startsWith('[')) {
      return 'json';
    }
    if (code.includes('<!DOCTYPE') || code.includes('<html')) {
      return 'html';
    }
    if (code.includes('<?xml')) {
      return 'xml';
    }
    if (code.includes('function') || code.includes('=>')) {
      return 'javascript';
    }
    return '';
  }

  /**
   * Compact code for AI-friendly format (single line if possible)
   */
  private compactCode(code: string): string {
    // For AI format, try to compact JSON/simple code to one line
    if (code.trim().startsWith('{') || code.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(code);
        return JSON.stringify(parsed);
      } catch {
        return code.trim().replace(/\s+/g, ' ');
      }
    }
    return code.trim().replace(/\n+/g, ' ').slice(0, 200); // Limit length
  }

  /**
   * Build configuration options table (Zoho-style)
   */
  private buildConfigurationSection(tool: Tool): void {
    this.builder.heading('Configuration Options', 2);

    const headers = ['Parameter', 'Type', 'Default', 'Description'];
    const rows = (tool.configOptions || []).map(option => {
      const name = option.required ? `\`${option.name}\` **Required**` : `\`${option.name}\``;
      const type = option.type;
      const defaultValue = `\`${JSON.stringify(option.default)}\``;
      const description = option.description;

      return [name, type, defaultValue, description];
    });

    this.builder.table(headers, rows);
  }
}
