export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  domSize: {
    elements: number;
    nodes: number;
    depth: number;
  };
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  network: {
    requests: number;
    totalSize: number;
    errors: number;
  };
  bundle: {
    htmlSize: number;
    cssSize: number;
    jsSize: number;
    totalSize: number;
  };
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  errors: string[];
  warnings: string[];
  timestamp: number;
}

export interface PerformanceConfig {
  enableFPS: boolean;
  enableMemory: boolean;
  enableNetwork: boolean;
  enableLighthouse: boolean;
  monitoringInterval: number;
  thresholds: {
    fps: number;
    renderTime: number;
    domElements: number;
    memoryUsage: number;
    bundleSize: number;
  };
}

const defaultConfig: PerformanceConfig = {
  enableFPS: true,
  enableMemory: true,
  enableNetwork: true,
  enableLighthouse: false, // Expensive operation
  monitoringInterval: 1000, // 1 second
  thresholds: {
    fps: 30,
    renderTime: 16, // 60fps = 16ms per frame
    domElements: 1000,
    memoryUsage: 50 * 1024 * 1024, // 50MB
    bundleSize: 1024 * 1024 // 1MB
  }
};

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private isMonitoring: boolean = false;
  private intervalId: number | null = null;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private observer: PerformanceObserver | null = null;
  private iframeRef: HTMLIFrameElement | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupPerformanceObserver();
  }

  setIframe(iframe: HTMLIFrameElement | null) {
    this.iframeRef = iframe;
  }

  private setupPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              // Handle custom measurements
            } else if (entry.entryType === 'navigation') {
              // Handle navigation timing
            }
          });
        });

        this.observer.observe({
          entryTypes: ['measure', 'navigation', 'resource', 'paint']
        });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }

  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startFPSMonitoring();
    this.startMetricsCollection();
  }

  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private startFPSMonitoring() {
    if (!this.config.enableFPS) return;

    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timestamp;
      }

      const elapsed = timestamp - this.lastFrameTime;
      this.frameCount++;

      if (elapsed >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed);
        this.frameCount = 0;
        this.lastFrameTime = timestamp;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  private startMetricsCollection() {
    this.intervalId = window.setInterval(() => {
      if (this.isMonitoring) {
        const metrics = this.collectMetrics();
        this.callbacks.forEach(callback => callback(metrics));
      }
    }, this.config.monitoringInterval);
  }

  private collectMetrics(): PerformanceMetrics {
    const startTime = performance.now();

    const metrics: PerformanceMetrics = {
      fps: this.fps,
      renderTime: 0,
      domSize: this.getDOMSize(),
      memory: this.getMemoryUsage(),
      network: this.getNetworkMetrics(),
      bundle: this.getBundleSize(),
      lighthouse: this.getLighthouseMetrics(),
      errors: [],
      warnings: [],
      timestamp: Date.now()
    };

    metrics.renderTime = performance.now() - startTime;

    // Generate warnings based on thresholds
    if (metrics.fps < this.config.thresholds.fps) {
      metrics.warnings.push(`Low FPS: ${metrics.fps} (threshold: ${this.config.thresholds.fps})`);
    }

    if (metrics.renderTime > this.config.thresholds.renderTime) {
      metrics.warnings.push(`Slow render: ${metrics.renderTime.toFixed(2)}ms (threshold: ${this.config.thresholds.renderTime}ms)`);
    }

    if (metrics.domSize.elements > this.config.thresholds.domElements) {
      metrics.warnings.push(`Large DOM: ${metrics.domSize.elements} elements (threshold: ${this.config.thresholds.domElements})`);
    }

    if (metrics.memory.used > this.config.thresholds.memoryUsage) {
      metrics.warnings.push(`High memory usage: ${(metrics.memory.used / 1024 / 1024).toFixed(2)}MB (threshold: ${(this.config.thresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
    }

    if (metrics.bundle.totalSize > this.config.thresholds.bundleSize) {
      metrics.warnings.push(`Large bundle: ${(metrics.bundle.totalSize / 1024).toFixed(2)}KB (threshold: ${(this.config.thresholds.bundleSize / 1024).toFixed(2)}KB)`);
    }

    return metrics;
  }

  private getDOMSize() {
    const doc = this.iframeRef?.contentDocument || document;
    const elements = doc.querySelectorAll('*').length;
    const nodes = this.countNodes(doc);
    const depth = this.getMaxDepth(doc.documentElement);

    return { elements, nodes, depth };
  }

  private countNodes(node: Document | Element): number {
    let count = 1;
    for (let child of node.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        count += this.countNodes(child as Element);
      } else {
        count++;
      }
    }
    return count;
  }

  private getMaxDepth(element: Element, currentDepth: number = 0): number {
    let maxDepth = currentDepth;
    for (let child of element.children) {
      const depth = this.getMaxDepth(child, currentDepth + 1);
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    }
    return maxDepth;
  }

  private getMemoryUsage() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        limit: memory.jsHeapSizeLimit || 0
      };
    }

    return { used: 0, total: 0, limit: 0 };
  }

  private getNetworkMetrics() {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return { requests: 0, totalSize: 0, errors: 0 };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;
    let errors = 0;

    resources.forEach(resource => {
      if (resource.transferSize) {
        totalSize += resource.transferSize;
      }
      if (resource.name.includes('error') || resource.duration === 0) {
        errors++;
      }
    });

    return {
      requests: resources.length,
      totalSize,
      errors
    };
  }

  private getBundleSize() {
    // For iframe content, we need to estimate based on the actual content
    let htmlSize = 0;
    let cssSize = 0;
    let jsSize = 0;

    if (this.iframeRef?.contentDocument) {
      const doc = this.iframeRef.contentDocument;

      // Estimate HTML size
      htmlSize = doc.documentElement.outerHTML.length;

      // Estimate CSS size
      const styleSheets = Array.from(doc.styleSheets);
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          cssSize += rules.map(rule => rule.cssText).join('').length;
        } catch (e) {
          // Cross-origin stylesheets can't be read
        }
      });

      // Estimate JS size from script tags
      const scripts = doc.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent) {
          jsSize += script.textContent.length;
        }
      });
    }

    return {
      htmlSize,
      cssSize,
      jsSize,
      totalSize: htmlSize + cssSize + jsSize
    };
  }

  private getLighthouseMetrics() {
    // Simplified lighthouse-style scoring
    // In a real implementation, you might use the actual Lighthouse API
    const domSize = this.getDOMSize();
    const bundle = this.getBundleSize();
    const memory = this.getMemoryUsage();

    // Simple scoring algorithm (0-100)
    const performance = Math.max(0, 100 - (
      (this.fps < 30 ? 20 : 0) +
      (bundle.totalSize > 500000 ? 15 : 0) +
      (domSize.elements > 500 ? 10 : 0) +
      (memory.used > 25 * 1024 * 1024 ? 15 : 0)
    ));

    const accessibility = Math.max(0, 100 - (
      (domSize.elements > 1000 ? 10 : 0) +
      (this.iframeRef?.contentDocument?.querySelectorAll('img:not([alt])').length || 0) * 5
    ));

    const bestPractices = Math.max(0, 100 - (
      (this.iframeRef?.contentDocument?.querySelectorAll('script[src]').length || 0) > 5 ? 10 : 0
    ));

    const seo = Math.max(0, 100 - (
      (!this.iframeRef?.contentDocument?.querySelector('title') ? 15 : 0) +
      (!this.iframeRef?.contentDocument?.querySelector('meta[name="description"]') ? 10 : 0)
    ));

    return { performance, accessibility, bestPractices, seo };
  }

  onMetrics(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  updateConfig(config: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Utility methods for measuring specific operations
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      return result;
    } finally {
      const duration = performance.now() - start;
      if (typeof window !== 'undefined' && 'performance' in window) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
      console.debug(`${name}: ${duration.toFixed(2)}ms`);
    }
  }

  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      return result;
    } finally {
      const duration = performance.now() - start;
      console.debug(`${name}: ${duration.toFixed(2)}ms`);
    }
  }

  // Resource monitoring
  static monitorResource(url: string): Promise<PerformanceResourceTiming> {
    return new Promise((resolve, reject) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        const entry = entries.find(e => e.name === url);
        if (entry) {
          observer.disconnect();
          resolve(entry);
        }
      });

      observer.observe({ entryTypes: ['resource'] });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Resource monitoring timeout for ${url}`));
      }, 10000);
    });
  }

  dispose() {
    this.stop();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.callbacks = [];
  }
}

// Performance analysis utilities
export class PerformanceAnalyzer {
  static analyzeMetrics(metrics: PerformanceMetrics[]): {
    summary: {
      avgFPS: number;
      avgRenderTime: number;
      peakMemory: number;
      totalErrors: number;
      totalWarnings: number;
    };
    recommendations: string[];
    trends: {
      fps: number[];
      memory: number[];
      renderTime: number[];
    };
  } {
    if (metrics.length === 0) {
      return {
        summary: { avgFPS: 0, avgRenderTime: 0, peakMemory: 0, totalErrors: 0, totalWarnings: 0 },
        recommendations: [],
        trends: { fps: [], memory: [], renderTime: [] }
      };
    }

    const summary = {
      avgFPS: metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length,
      avgRenderTime: metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length,
      peakMemory: Math.max(...metrics.map(m => m.memory.used)),
      totalErrors: metrics.reduce((sum, m) => sum + m.errors.length, 0),
      totalWarnings: metrics.reduce((sum, m) => sum + m.warnings.length, 0)
    };

    const recommendations: string[] = [];

    if (summary.avgFPS < 30) {
      recommendations.push('Consider optimizing animations and reducing DOM complexity to improve FPS');
    }

    if (summary.avgRenderTime > 16) {
      recommendations.push('Render time is high. Consider reducing JavaScript execution time and DOM operations');
    }

    if (summary.peakMemory > 50 * 1024 * 1024) {
      recommendations.push('Memory usage is high. Check for memory leaks and optimize data structures');
    }

    const latestMetrics = metrics[metrics.length - 1];
    if (latestMetrics.bundle.totalSize > 500 * 1024) {
      recommendations.push('Bundle size is large. Consider code splitting and lazy loading');
    }

    if (latestMetrics.domSize.elements > 1000) {
      recommendations.push('DOM size is large. Consider virtualization for long lists');
    }

    const trends = {
      fps: metrics.map(m => m.fps),
      memory: metrics.map(m => m.memory.used),
      renderTime: metrics.map(m => m.renderTime)
    };

    return { summary, recommendations, trends };
  }

  static generateReport(metrics: PerformanceMetrics[]): string {
    const analysis = this.analyzeMetrics(metrics);
    const latest = metrics[metrics.length - 1];

    return `
# Performance Report

## Summary
- Average FPS: ${analysis.summary.avgFPS.toFixed(1)}
- Average Render Time: ${analysis.summary.avgRenderTime.toFixed(2)}ms
- Peak Memory Usage: ${(analysis.summary.peakMemory / 1024 / 1024).toFixed(2)}MB
- Total Errors: ${analysis.summary.totalErrors}
- Total Warnings: ${analysis.summary.totalWarnings}

## Current Metrics
- FPS: ${latest?.fps || 0}
- DOM Elements: ${latest?.domSize.elements || 0}
- Bundle Size: ${latest ? (latest.bundle.totalSize / 1024).toFixed(2) : 0}KB
- Memory Usage: ${latest ? (latest.memory.used / 1024 / 1024).toFixed(2) : 0}MB

## Lighthouse Scores
- Performance: ${latest?.lighthouse.performance || 0}/100
- Accessibility: ${latest?.lighthouse.accessibility || 0}/100
- Best Practices: ${latest?.lighthouse.bestPractices || 0}/100
- SEO: ${latest?.lighthouse.seo || 0}/100

## Recommendations
${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

Generated at: ${new Date().toISOString()}
    `.trim();
  }
}

export default PerformanceMonitor;