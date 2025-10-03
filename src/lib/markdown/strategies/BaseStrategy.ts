import { MarkdownBuilder } from '../core/MarkdownBuilder';
import type {
  GeneratorContext,
  GeneratorOptions,
  ExportResult,
  MarkdownMetadata,
  FormatType
} from '../types';

/**
 * Abstract base class for all markdown generation strategies
 *
 * Each page type (tool, category, homepage, search) implements this
 * to provide specialized markdown generation logic.
 */
export abstract class BaseStrategy {
  protected builder: MarkdownBuilder;
  protected format: FormatType;
  protected options: GeneratorOptions;

  constructor(format: FormatType, options: Partial<GeneratorOptions> = {}) {
    this.format = format;
    this.builder = new MarkdownBuilder();
    this.options = {
      format,
      pageType: 'tool', // Will be overridden
      includeMetadata: options.includeMetadata ?? true,
      includeTOC: options.includeTOC ?? false,
      maxExamples: options.maxExamples ?? 5,
      compactMode: options.compactMode ?? (format === 'ai-friendly'),
      ...options
    };
  }

  /**
   * Main generation method - must be implemented by subclasses
   */
  abstract generate(context: GeneratorContext): ExportResult;

  /**
   * Generate metadata for frontmatter
   */
  protected abstract generateMetadata(context: GeneratorContext): MarkdownMetadata;

  /**
   * Get default filename for download
   */
  abstract getDefaultFilename(context: GeneratorContext): string;

  /**
   * Add frontmatter to builder (common across all strategies)
   */
  protected addFrontmatter(metadata: MarkdownMetadata): void {
    if (this.options.includeMetadata) {
      this.builder.frontmatter(metadata);
    }
  }

  /**
   * Calculate export statistics
   */
  protected calculateStats(content: string) {
    return {
      charCount: content.length,
      lineCount: content.split('\n').length,
      estimatedTokens: Math.ceil(content.length / 4),
    };
  }

  /**
   * Create export result
   */
  protected createResult(
    content: string,
    filename: string,
    metadata: MarkdownMetadata
  ): ExportResult {
    return {
      content,
      filename,
      metadata,
      stats: this.calculateStats(content),
    };
  }

  /**
   * Check if running in AI-friendly mode
   */
  protected isAIFriendly(): boolean {
    return this.format === 'ai-friendly';
  }

  /**
   * Format section title based on mode
   */
  protected formatSectionTitle(title: string): string {
    if (this.isAIFriendly()) {
      // AI-friendly: use ALL_CAPS labels
      return title.toUpperCase().replace(/\s+/g, '_');
    }
    return title;
  }

  /**
   * Add table of contents (if enabled)
   */
  protected addTableOfContents(sections: string[]): void {
    if (this.options.includeTOC && !this.isAIFriendly()) {
      this.builder
        .heading('Table of Contents', 2)
        .list(sections.map(s => `[${s}](#${s.toLowerCase().replace(/\s+/g, '-')})`))
        .newline();
    }
  }

  /**
   * Truncate examples if needed
   */
  protected limitExamples<T>(examples: T[]): T[] {
    const max = this.options.maxExamples || examples.length;
    return examples.slice(0, max);
  }

  /**
   * Format keywords for display
   */
  protected formatKeywords(keywords: string[]): string {
    if (this.isAIFriendly()) {
      return keywords.join(', ');
    }
    return keywords.map(k => `\`${k}\``).join(', ');
  }

  /**
   * Reset builder (useful for batch generation)
   */
  protected reset(): void {
    this.builder = new MarkdownBuilder();
  }
}
