export * from './tool';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title: string;
    description: string;
    image?: string;
    type: string;
  };
  jsonLd?: Record<string, any>;
}

export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  tti?: number;
  fcp?: number;
}