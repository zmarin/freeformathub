import type { Tool, ToolCategory } from '../../types';

/**
 * Page types that can be exported as Markdown
 */
export type PageType = 'tool' | 'category' | 'homepage' | 'search';

/**
 * Output format styles
 */
export type FormatType = 'standard' | 'ai-friendly';

/**
 * Generator configuration options
 */
export interface GeneratorOptions {
  pageType: PageType;
  format: FormatType;
  includeMetadata?: boolean;
  includeTOC?: boolean;
  maxExamples?: number;
  compactMode?: boolean;
}

/**
 * Context data for markdown generation
 */
export interface GeneratorContext {
  // For tool pages
  tool?: Tool;

  // For category pages
  category?: ToolCategory;
  categoryTools?: Tool[];

  // For homepage
  allCategories?: ToolCategory[];
  allTools?: Tool[];

  // For search results
  searchQuery?: string;
  searchResults?: Tool[];

  // Common metadata
  siteUrl?: string;
  generatedAt?: Date;
}

/**
 * Metadata for frontmatter
 */
export interface MarkdownMetadata {
  title: string;
  type: PageType;
  url: string;
  category?: string;
  subcategory?: string;
  keywords?: string[];
  generated: string;
  version?: string;
  [key: string]: any;
}

/**
 * Configuration for AI-friendly format
 */
export interface AIFriendlyConfig {
  useAllCaps?: boolean;
  maxTokens?: number;
  includeExamples?: boolean;
  includeRelatedTools?: boolean;
  compactTables?: boolean;
}

/**
 * Export result with metadata
 */
export interface ExportResult {
  content: string;
  filename: string;
  metadata: MarkdownMetadata;
  stats: {
    charCount: number;
    lineCount: number;
    estimatedTokens: number;
  };
}
