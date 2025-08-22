export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  subcategory?: ToolSubcategory;
  slug: string;
  icon: string;
  keywords: string[];
  examples: ToolExample[];
  useCases: string[];
  commonErrors: string[];
  faq: FAQ[];
  relatedTools: string[];
  seoTitle: string;
  seoDescription: string;
}

export interface ToolExample {
  title: string;
  input: string;
  output: string;
  description?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ToolSubcategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
  seoTitle: string;
  seoDescription: string;
  toolCount?: number;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  subcategories?: ToolSubcategory[];
}

export interface ToolConfig {
  preserveWhitespace?: boolean;
  validateInput?: boolean;
  useWorker?: boolean;
  maxInputSize?: number;
  outputFormat?: string;
  [key: string]: any;
}

export interface ToolResult<T = any> {
  success?: boolean;
  output?: string;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
  processing_time?: number;
}

export interface ToolHistory {
  id: string;
  toolId: string;
  input: string;
  output: string;
  config?: ToolConfig;
  timestamp: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultConfigs: Record<string, ToolConfig>;
  favoriteTools: string[];
  recentTools: string[];
  history: ToolHistory[];
}