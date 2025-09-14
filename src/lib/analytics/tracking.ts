// Google Analytics 4 Event Tracking Utilities

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

export interface SearchAnalytics {
  searchTerm: string;
  results?: number;
  selectedTool?: {
    id: string;
    name: string;
    category: string;
    matchType?: string;
    matchScore?: number;
  };
}

export interface ToolAnalytics {
  toolId: string;
  toolName: string;
  category: string;
  action: 'view' | 'process' | 'copy' | 'download' | 'error';
  details?: Record<string, any>;
}

// Check if analytics is available
function isAnalyticsAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

// Generic event tracking
export function trackEvent(eventName: string, parameters: Record<string, any> = {}): void {
  if (!isAnalyticsAvailable()) {
    console.log('Analytics not available, would track:', eventName, parameters);
    return;
  }

  try {
    window.gtag('event', eventName, {
      send_to: 'G-34Z7YVSEZ2',
      ...parameters
    });

    // Debug logging in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('📊 GA4 Event:', eventName, parameters);
    }
  } catch (error) {
    console.warn('Failed to track analytics event:', error);
  }
}

// Search-specific tracking
export function trackSearch(analytics: SearchAnalytics): void {
  trackEvent('search', {
    search_term: analytics.searchTerm,
    results_count: analytics.results
  });
}

export function trackSearchSelect(analytics: SearchAnalytics): void {
  if (!analytics.selectedTool) return;

  trackEvent('search_select', {
    search_term: analytics.searchTerm,
    content_type: 'tool',
    item_id: analytics.selectedTool.id,
    item_name: analytics.selectedTool.name,
    item_category: analytics.selectedTool.category,
    custom_parameter_1: analytics.selectedTool.matchType || 'unknown',
    custom_parameter_2: analytics.selectedTool.matchScore || 0
  });
}

// Tool usage tracking
export function trackToolView(analytics: ToolAnalytics): void {
  trackEvent('tool_view', {
    content_type: 'tool',
    item_id: analytics.toolId,
    item_name: analytics.toolName,
    item_category: analytics.category,
    page_title: document.title,
    page_location: window.location.href
  });
}

export function trackToolAction(analytics: ToolAnalytics): void {
  trackEvent('tool_action', {
    content_type: 'tool',
    item_id: analytics.toolId,
    item_name: analytics.toolName,
    item_category: analytics.category,
    action_type: analytics.action,
    ...analytics.details
  });
}

// User engagement tracking
export function trackUserEngagement(action: string, details: Record<string, any> = {}): void {
  trackEvent('user_engagement', {
    engagement_type: action,
    ...details
  });
}

// Error tracking
export function trackError(error: Error | string, context?: string): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' ? error.stack : undefined;

  trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    context: context || 'unknown',
    stack_trace: errorStack
  });
}

// Performance tracking
export function trackPerformance(metric: string, value: number, details?: Record<string, any>): void {
  trackEvent('performance', {
    metric_name: metric,
    metric_value: value,
    ...details
  });
}

// Custom conversion tracking
export function trackConversion(conversionType: string, value?: number, details?: Record<string, any>): void {
  trackEvent('conversion', {
    conversion_type: conversionType,
    value: value,
    currency: 'USD', // For e-commerce tracking if needed later
    ...details
  });
}

// Page-specific tracking helpers
export function trackPageView(page: string, title?: string): void {
  trackEvent('page_view', {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: page || window.location.pathname
  });
}

// Social sharing tracking
export function trackShare(platform: string, content: string): void {
  trackEvent('share', {
    method: platform,
    content_type: 'tool',
    item_id: content
  });
}

// Download tracking
export function trackDownload(filename: string, toolId?: string): void {
  trackEvent('file_download', {
    file_name: filename,
    link_url: window.location.href,
    item_id: toolId
  });
}

// Form tracking
export function trackFormSubmit(formName: string, success: boolean = true): void {
  trackEvent('form_submit', {
    form_name: formName,
    success: success
  });
}

// Navigation tracking
export function trackNavigation(from: string, to: string, method?: string): void {
  trackEvent('navigation', {
    from_page: from,
    to_page: to,
    method: method || 'click'
  });
}

// Batch event tracking for performance
export function trackBatchEvents(events: { name: string; parameters: Record<string, any> }[]): void {
  if (!isAnalyticsAvailable()) return;

  events.forEach(event => {
    trackEvent(event.name, event.parameters);
  });
}

// Initialize enhanced measurement tracking
export function initEnhancedTracking(): void {
  if (!isAnalyticsAvailable()) return;

  // Track initial page performance
  if (window.performance) {
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      setTimeout(() => {
        trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart, {
          connection_type: (navigator as any).connection?.effectiveType || 'unknown'
        });
      }, 1000);
    }
  }

  // Track viewport and device info
  trackEvent('device_info', {
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    color_depth: screen.colorDepth,
    pixel_ratio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  });

  console.log('✅ Enhanced analytics tracking initialized');
}