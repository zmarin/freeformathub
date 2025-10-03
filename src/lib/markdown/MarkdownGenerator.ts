import { ToolPageStrategy } from './strategies/ToolPageStrategy';
// import { CategoryPageStrategy } from './strategies/CategoryPageStrategy';
// import { HomepageStrategy } from './strategies/HomepageStrategy';
// import { SearchResultsStrategy } from './strategies/SearchResultsStrategy';

import type {
  PageType,
  FormatType,
  GeneratorOptions,
  GeneratorContext,
  ExportResult,
} from './types';
import type { BaseStrategy } from './strategies/BaseStrategy';

/**
 * Main Markdown Generator - Orchestrates strategy selection and export
 *
 * Usage:
 *   const generator = new MarkdownGenerator(context, {
 *     pageType: 'tool',
 *     format: 'ai-friendly'
 *   });
 *   const result = generator.generate();
 *   generator.download();
 */
export class MarkdownGenerator {
  private strategy: BaseStrategy;
  private context: GeneratorContext;
  private options: GeneratorOptions;

  constructor(context: GeneratorContext, options: GeneratorOptions) {
    this.context = context;
    this.options = options;
    this.strategy = this.selectStrategy(options.pageType, options.format);
  }

  /**
   * Select the appropriate strategy based on page type and format
   */
  private selectStrategy(pageType: PageType, format: FormatType): BaseStrategy {
    switch (pageType) {
      case 'tool':
        return new ToolPageStrategy(format, this.options);

      // TODO: Implement other strategies
      // case 'category':
      //   return new CategoryPageStrategy(format, this.options);
      // case 'homepage':
      //   return new HomepageStrategy(format, this.options);
      // case 'search':
      //   return new SearchResultsStrategy(format, this.options);

      default:
        throw new Error(`Unsupported page type: ${pageType}`);
    }
  }

  /**
   * Generate markdown content
   */
  generate(): ExportResult {
    return this.strategy.generate(this.context);
  }

  /**
   * Generate and download markdown file
   */
  download(customFilename?: string): void {
    const result = this.generate();
    const filename = customFilename || result.filename;

    this.downloadFile(result.content, filename);
  }

  /**
   * Generate and copy to clipboard
   */
  async copyToClipboard(): Promise<void> {
    const result = this.generate();

    try {
      await navigator.clipboard.writeText(result.content);
      console.log('Markdown copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy markdown to clipboard');
    }
  }

  /**
   * Get export statistics without generating full document
   */
  getStats(): { charCount: number; lineCount: number; estimatedTokens: number } {
    const result = this.generate();
    return result.stats;
  }

  /**
   * Preview markdown content (returns string)
   */
  preview(): string {
    const result = this.generate();
    return result.content;
  }

  /**
   * Download file to browser
   */
  private downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Convenience function for quick markdown generation
 */
export function generateMarkdown(
  context: GeneratorContext,
  options: GeneratorOptions
): string {
  const generator = new MarkdownGenerator(context, options);
  return generator.preview();
}

/**
 * Convenience function for quick download
 */
export function downloadMarkdown(
  context: GeneratorContext,
  options: GeneratorOptions,
  filename?: string
): void {
  const generator = new MarkdownGenerator(context, options);
  generator.download(filename);
}
