import type { Tool, ToolResult } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface PerformanceBudgetConfig {
  budgetType: 'resource' | 'timing' | 'network' | 'comprehensive';
  deviceType: 'mobile' | 'desktop' | 'both';
  networkCondition: '3g-slow' | '3g-fast' | '4g' | '5g' | 'cable' | 'custom';
  customBandwidth?: number; // Mbps
  customLatency?: number; // ms
  includeAdvanced: boolean;
  includeRecommendations: boolean;
  includeFramework: boolean;
  targetFramework: 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla' | 'general';
  includeOptimization: boolean;
  outputFormat: 'detailed' | 'summary' | 'json' | 'csv';
  reportLevel: 'basic' | 'intermediate' | 'expert';
}

const DEFAULT_CONFIG: PerformanceBudgetConfig = {
  budgetType: 'comprehensive',
  deviceType: 'mobile',
  networkCondition: '3g-fast',
  includeAdvanced: true,
  includeRecommendations: true,
  includeFramework: true,
  targetFramework: 'react',
  includeOptimization: true,
  outputFormat: 'detailed',
  reportLevel: 'intermediate'
};

interface BudgetCategory {
  name: string;
  description: string;
  metrics: BudgetMetric[];
}

interface BudgetMetric {
  name: string;
  unit: string;
  mobile: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  desktop: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  coreWebVital: boolean;
  measurement: string;
  optimization: string[];
  references: string[];
}

const PERFORMANCE_METRICS: Record<string, BudgetMetric> = {
  'lcp': {
    name: 'Largest Contentful Paint (LCP)',
    unit: 'seconds',
    mobile: { good: 2.5, needsImprovement: 4.0, poor: 4.0 },
    desktop: { good: 2.5, needsImprovement: 4.0, poor: 4.0 },
    description: 'Time to render the largest visible content element',
    priority: 'critical',
    category: 'Core Web Vitals',
    coreWebVital: true,
    measurement: 'Field data (RUM) or lab tools like Lighthouse',
    optimization: [
      'Optimize images (WebP, lazy loading, responsive images)',
      'Remove unused CSS and JavaScript',
      'Improve server response times',
      'Use CDN for static assets',
      'Implement preloading for critical resources'
    ],
    references: ['Web.dev LCP Guide', 'Lighthouse Performance Audits']
  },
  'fid': {
    name: 'First Input Delay (FID)',
    unit: 'milliseconds',
    mobile: { good: 100, needsImprovement: 300, poor: 300 },
    desktop: { good: 100, needsImprovement: 300, poor: 300 },
    description: 'Time from user interaction to browser response',
    priority: 'critical',
    category: 'Core Web Vitals',
    coreWebVital: true,
    measurement: 'Real user monitoring (RUM) only - field data',
    optimization: [
      'Reduce JavaScript execution time',
      'Split long tasks with requestIdleCallback',
      'Remove unused JavaScript',
      'Use web workers for heavy computations',
      'Implement code splitting and lazy loading'
    ],
    references: ['Web.dev FID Guide', 'Chrome User Experience Report']
  },
  'cls': {
    name: 'Cumulative Layout Shift (CLS)',
    unit: 'score',
    mobile: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
    desktop: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
    description: 'Visual stability - unexpected layout shifts',
    priority: 'critical',
    category: 'Core Web Vitals',
    coreWebVital: true,
    measurement: 'Field data or lab tools (note: lab may not capture all shifts)',
    optimization: [
      'Set size attributes on images and videos',
      'Reserve space for dynamic content',
      'Avoid inserting content above existing content',
      'Use CSS aspect-ratio for responsive media',
      'Preload fonts to prevent FOUT/FOIT'
    ],
    references: ['Web.dev CLS Guide', 'Layout Shift Debugging']
  },
  'fcp': {
    name: 'First Contentful Paint (FCP)',
    unit: 'seconds',
    mobile: { good: 1.8, needsImprovement: 3.0, poor: 3.0 },
    desktop: { good: 1.8, needsImprovement: 3.0, poor: 3.0 },
    description: 'Time to first visible content render',
    priority: 'high',
    category: 'Page Load',
    coreWebVital: false,
    measurement: 'Lighthouse, WebPageTest, browser dev tools',
    optimization: [
      'Eliminate render-blocking resources',
      'Minify CSS and JavaScript',
      'Inline critical CSS',
      'Optimize fonts loading',
      'Use efficient cache policies'
    ],
    references: ['Web.dev FCP Guide', 'Critical Rendering Path']
  },
  'ttfb': {
    name: 'Time to First Byte (TTFB)',
    unit: 'milliseconds',
    mobile: { good: 800, needsImprovement: 1800, poor: 1800 },
    desktop: { good: 600, needsImprovement: 1000, poor: 1000 },
    description: 'Server response time for initial request',
    priority: 'high',
    category: 'Server Performance',
    coreWebVital: false,
    measurement: 'Browser dev tools, WebPageTest, synthetic monitoring',
    optimization: [
      'Use faster web hosting',
      'Implement CDN',
      'Cache dynamic content',
      'Optimize database queries',
      'Use HTTP/2 or HTTP/3'
    ],
    references: ['Web.dev TTFB Guide', 'Server Optimization Guide']
  },
  'tbt': {
    name: 'Total Blocking Time (TBT)',
    unit: 'milliseconds',
    mobile: { good: 200, needsImprovement: 600, poor: 600 },
    desktop: { good: 200, needsImprovement: 600, poor: 600 },
    description: 'Total time main thread was blocked',
    priority: 'high',
    category: 'Interactivity',
    coreWebVital: false,
    measurement: 'Lighthouse performance audit',
    optimization: [
      'Reduce main thread work',
      'Minimize third-party impact',
      'Remove unused code',
      'Implement efficient loading strategies',
      'Use service workers wisely'
    ],
    references: ['Web.dev TBT Guide', 'JavaScript Performance']
  },
  'si': {
    name: 'Speed Index',
    unit: 'score',
    mobile: { good: 3.4, needsImprovement: 5.8, poor: 5.8 },
    desktop: { good: 3.4, needsImprovement: 5.8, poor: 5.8 },
    description: 'Visual progress of page loading',
    priority: 'medium',
    category: 'Page Load',
    coreWebVital: false,
    measurement: 'Lighthouse, WebPageTest visual progress',
    optimization: [
      'Optimize critical rendering path',
      'Implement progressive loading',
      'Optimize images and media',
      'Use skeleton screens',
      'Prioritize above-the-fold content'
    ],
    references: ['Web.dev Speed Index Guide', 'Visual Performance']
  }
};

const RESOURCE_BUDGETS = {
  'total-size': {
    name: 'Total Page Weight',
    unit: 'KB',
    mobile: { good: 1600, needsImprovement: 3000, poor: 3000 },
    desktop: { good: 2500, needsImprovement: 4000, poor: 4000 },
    description: 'Total size of all page resources',
    priority: 'high' as const,
    category: 'Resource Budget'
  },
  'javascript': {
    name: 'JavaScript Bundle Size',
    unit: 'KB',
    mobile: { good: 350, needsImprovement: 750, poor: 750 },
    desktop: { good: 500, needsImprovement: 1000, poor: 1000 },
    description: 'Total JavaScript downloaded and parsed',
    priority: 'critical' as const,
    category: 'Resource Budget'
  },
  'css': {
    name: 'CSS Size',
    unit: 'KB',
    mobile: { good: 75, needsImprovement: 150, poor: 150 },
    desktop: { good: 100, needsImprovement: 200, poor: 200 },
    description: 'Total CSS downloaded',
    priority: 'medium' as const,
    category: 'Resource Budget'
  },
  'images': {
    name: 'Images Size',
    unit: 'KB',
    mobile: { good: 800, needsImprovement: 1500, poor: 1500 },
    desktop: { good: 1200, needsImprovement: 2000, poor: 2000 },
    description: 'Total image payload',
    priority: 'high' as const,
    category: 'Resource Budget'
  },
  'fonts': {
    name: 'Web Fonts Size',
    unit: 'KB',
    mobile: { good: 100, needsImprovement: 200, poor: 200 },
    desktop: { good: 150, needsImprovement: 300, poor: 300 },
    description: 'Total web font payload',
    priority: 'medium' as const,
    category: 'Resource Budget'
  },
  'requests': {
    name: 'HTTP Requests',
    unit: 'count',
    mobile: { good: 50, needsImprovement: 100, poor: 100 },
    desktop: { good: 75, needsImprovement: 150, poor: 150 },
    description: 'Total number of HTTP requests',
    priority: 'medium' as const,
    category: 'Resource Budget'
  }
};

const NETWORK_CONDITIONS = {
  '3g-slow': { bandwidth: 0.4, latency: 2000, name: '3G Slow' },
  '3g-fast': { bandwidth: 1.6, latency: 562, name: '3G Fast' },
  '4g': { bandwidth: 9, latency: 85, name: '4G' },
  '5g': { bandwidth: 100, latency: 10, name: '5G' },
  'cable': { bandwidth: 5, latency: 28, name: 'Broadband' }
};

function calculateBudget(config: PerformanceBudgetConfig) {
  const metrics: any[] = [];
  const resources: any[] = [];
  
  // Core Web Vitals (always included)
  const coreVitals = ['lcp', 'fid', 'cls'];
  
  // Additional metrics based on budget type
  let metricsToInclude: string[] = [];
  switch (config.budgetType) {
    case 'timing':
      metricsToInclude = [...coreVitals, 'fcp', 'ttfb', 'tbt', 'si'];
      break;
    case 'resource':
      // Resource budgets only
      break;
    case 'network':
      metricsToInclude = [...coreVitals, 'ttfb', 'fcp'];
      break;
    case 'comprehensive':
    default:
      metricsToInclude = Object.keys(PERFORMANCE_METRICS);
      break;
  }
  
  // Calculate timing budgets
  for (const metricKey of metricsToInclude) {
    const metric = PERFORMANCE_METRICS[metricKey];
    if (metric) {
      const deviceBudget = config.deviceType === 'desktop' ? metric.desktop : metric.mobile;
      
      // Adjust for network conditions
      const adjustment = calculateNetworkAdjustment(config, metric);
      
      metrics.push({
        ...metric,
        budget: {
          good: deviceBudget.good * adjustment,
          needsImprovement: deviceBudget.needsImprovement * adjustment,
          poor: deviceBudget.poor * adjustment
        },
        adjustedForNetwork: adjustment !== 1.0
      });
    }
  }
  
  // Calculate resource budgets
  if (config.budgetType === 'resource' || config.budgetType === 'comprehensive') {
    for (const [key, resource] of Object.entries(RESOURCE_BUDGETS)) {
      const deviceBudget = config.deviceType === 'desktop' ? resource.desktop : resource.mobile;
      
      // Adjust for network conditions
      const adjustment = calculateResourceAdjustment(config, key);
      
      resources.push({
        ...resource,
        key,
        budget: {
          good: Math.round(deviceBudget.good * adjustment),
          needsImprovement: Math.round(deviceBudget.needsImprovement * adjustment),
          poor: Math.round(deviceBudget.poor * adjustment)
        },
        adjustedForNetwork: adjustment !== 1.0
      });
    }
  }
  
  return { metrics, resources };
}

function calculateNetworkAdjustment(config: PerformanceBudgetConfig, metric: BudgetMetric): number {
  if (config.networkCondition === 'custom') {
    // Custom network adjustment based on bandwidth and latency
    const bandwidth = config.customBandwidth || 1.6;
    const latency = config.customLatency || 562;
    
    // Adjust based on how this metric is affected by network
    if (metric.name.includes('TTFB') || metric.category === 'Server Performance') {
      return Math.max(0.5, Math.min(2.0, latency / 562)); // Latency sensitive
    }
    if (metric.name.includes('LCP') || metric.name.includes('FCP')) {
      return Math.max(0.7, Math.min(1.5, (562 / latency) * (bandwidth / 1.6))); // Both sensitive
    }
    return 1.0; // Not significantly affected by network
  }
  
  const networkData = NETWORK_CONDITIONS[config.networkCondition];
  const baseline = NETWORK_CONDITIONS['3g-fast'];
  
  // Calculate adjustment factor based on network capability
  if (metric.name.includes('TTFB') || metric.category === 'Server Performance') {
    return Math.max(0.5, Math.min(2.0, networkData.latency / baseline.latency));
  }
  
  if (metric.name.includes('LCP') || metric.name.includes('FCP')) {
    const latencyFactor = baseline.latency / networkData.latency;
    const bandwidthFactor = networkData.bandwidth / baseline.bandwidth;
    return Math.max(0.7, Math.min(1.5, (latencyFactor + bandwidthFactor) / 2));
  }
  
  return 1.0;
}

function calculateResourceAdjustment(config: PerformanceBudgetConfig, resourceType: string): number {
  if (config.networkCondition === 'custom') {
    const bandwidth = config.customBandwidth || 1.6;
    // Adjust resource budgets based on available bandwidth
    return Math.max(0.5, Math.min(2.0, bandwidth / 1.6));
  }
  
  const networkData = NETWORK_CONDITIONS[config.networkCondition];
  const baseline = NETWORK_CONDITIONS['3g-fast'];
  
  // Slower networks = smaller budgets, faster networks = larger budgets
  return Math.max(0.5, Math.min(2.0, networkData.bandwidth / baseline.bandwidth));
}

function generateFrameworkSpecificAdvice(framework: string): string[] {
  const advice: Record<string, string[]> = {
    'react': [
      'Use React.lazy() and Suspense for code splitting',
      'Implement useMemo and useCallback for expensive computations',
      'Use React.memo for component memoization',
      'Consider Next.js for automatic optimizations',
      'Implement proper key props to avoid unnecessary re-renders',
      'Use React DevTools Profiler to identify performance bottlenecks'
    ],
    'vue': [
      'Use Vue\'s built-in lazy loading with defineAsyncComponent',
      'Implement v-memo for expensive list rendering',
      'Use computed properties instead of methods when appropriate',
      'Consider Nuxt.js for SSR and automatic optimizations',
      'Use Vue DevTools to monitor component performance',
      'Implement proper key attributes for v-for loops'
    ],
    'angular': [
      'Use Angular\'s lazy loading with loadChildren',
      'Implement OnPush change detection strategy',
      'Use trackBy functions for *ngFor loops',
      'Consider Angular Universal for SSR',
      'Use Angular DevTools for performance profiling',
      'Implement proper async pipe usage to avoid memory leaks'
    ],
    'svelte': [
      'Use Svelte\'s built-in code splitting with dynamic imports',
      'Implement stores for global state management',
      'Use SvelteKit for full-stack optimizations',
      'Take advantage of Svelte\'s compile-time optimizations',
      'Use reactive statements efficiently',
      'Implement proper component lifecycle management'
    ],
    'vanilla': [
      'Implement intersection observer for lazy loading',
      'Use requestAnimationFrame for smooth animations',
      'Implement efficient event delegation',
      'Use Web Components for reusable UI elements',
      'Consider using a build tool for optimization',
      'Implement proper memory management and cleanup'
    ]
  };
  
  return advice[framework] || advice['vanilla'];
}

function generateOptimizationStrategies(): string[] {
  return [
    '📦 Bundle Optimization: Use tree shaking, code splitting, and dynamic imports',
    '🖼️ Image Optimization: WebP format, responsive images, lazy loading',
    '⚡ Critical Path: Inline critical CSS, preload key resources',
    '🗄️ Caching: Implement service workers, CDN, and browser caching',
    '🔄 Compression: Enable Gzip/Brotli, minify assets',
    '📱 Progressive Loading: Skeleton screens, progressive enhancement',
    '🎯 Third-party: Audit and optimize external scripts',
    '🔍 Monitoring: Implement RUM and synthetic monitoring'
  ];
}

function formatBudgetOutput(budget: any, config: PerformanceBudgetConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(budget, null, 2);
  }
  
  if (config.outputFormat === 'csv') {
    let csv = 'Metric,Unit,Good,Needs Improvement,Poor,Priority,Category\n';
    
    for (const metric of budget.metrics) {
      csv += `"${metric.name}",${metric.unit},${metric.budget.good},${metric.budget.needsImprovement},${metric.budget.poor},${metric.priority},"${metric.category}"\n`;
    }
    
    for (const resource of budget.resources) {
      csv += `"${resource.name}",${resource.unit},${resource.budget.good},${resource.budget.needsImprovement},${resource.budget.poor},${resource.priority},"${resource.category}"\n`;
    }
    
    return csv;
  }
  
  // Detailed or Summary format
  let output = '';
  
  // Header
  const networkInfo = config.networkCondition === 'custom' 
    ? `Custom (${config.customBandwidth}Mbps, ${config.customLatency}ms)`
    : NETWORK_CONDITIONS[config.networkCondition]?.name || config.networkCondition;
    
  output += `# Performance Budget Report\n\n`;
  output += `**Target Device:** ${config.deviceType === 'both' ? 'Mobile & Desktop' : config.deviceType.charAt(0).toUpperCase() + config.deviceType.slice(1)}\n`;
  output += `**Network Condition:** ${networkInfo}\n`;
  output += `**Budget Type:** ${config.budgetType.charAt(0).toUpperCase() + config.budgetType.slice(1)}\n\n`;
  
  // Core Web Vitals section
  const coreVitals = budget.metrics.filter((m: any) => m.coreWebVital);
  if (coreVitals.length > 0) {
    output += `## 🎯 Core Web Vitals\n\n`;
    output += `These metrics directly impact search rankings and user experience:\n\n`;
    
    for (const metric of coreVitals) {
      output += `### ${metric.name}\n`;
      output += `- **Good:** ≤ ${metric.budget.good}${metric.unit}\n`;
      output += `- **Needs Improvement:** ${metric.budget.good + 0.01}-${metric.budget.needsImprovement}${metric.unit}\n`;
      output += `- **Poor:** > ${metric.budget.needsImprovement}${metric.unit}\n`;
      output += `- **Description:** ${metric.description}\n`;
      if (metric.adjustedForNetwork) {
        output += `- **Note:** Adjusted for ${networkInfo} conditions\n`;
      }
      output += '\n';
    }
  }
  
  // Performance metrics section
  const otherMetrics = budget.metrics.filter((m: any) => !m.coreWebVital);
  if (otherMetrics.length > 0 && config.reportLevel !== 'basic') {
    output += `## ⚡ Performance Metrics\n\n`;
    
    for (const metric of otherMetrics) {
      output += `### ${metric.name}\n`;
      output += `- **Good:** ≤ ${metric.budget.good}${metric.unit}\n`;
      output += `- **Needs Improvement:** ${metric.budget.good + 0.01}-${metric.budget.needsImprovement}${metric.unit}\n`;
      output += `- **Poor:** > ${metric.budget.needsImprovement}${metric.unit}\n`;
      output += `- **Priority:** ${metric.priority.toUpperCase()}\n`;
      
      if (config.outputFormat === 'detailed') {
        output += `- **Description:** ${metric.description}\n`;
        output += `- **Measurement:** ${metric.measurement}\n`;
      }
      
      if (metric.adjustedForNetwork) {
        output += `- **Note:** Adjusted for ${networkInfo} conditions\n`;
      }
      output += '\n';
    }
  }
  
  // Resource budgets section
  if (budget.resources.length > 0) {
    output += `## 📦 Resource Budgets\n\n`;
    
    for (const resource of budget.resources) {
      output += `### ${resource.name}\n`;
      output += `- **Good:** ≤ ${resource.budget.good}${resource.unit}\n`;
      output += `- **Needs Improvement:** ${resource.budget.good + 1}-${resource.budget.needsImprovement}${resource.unit}\n`;
      output += `- **Poor:** > ${resource.budget.needsImprovement}${resource.unit}\n`;
      output += `- **Priority:** ${resource.priority.toUpperCase()}\n`;
      
      if (config.outputFormat === 'detailed') {
        output += `- **Description:** ${resource.description}\n`;
      }
      
      if (resource.adjustedForNetwork) {
        output += `- **Note:** Adjusted for ${networkInfo} bandwidth\n`;
      }
      output += '\n';
    }
  }
  
  // Framework-specific advice
  if (config.includeFramework && config.targetFramework !== 'general') {
    output += `## 🚀 ${config.targetFramework.charAt(0).toUpperCase() + config.targetFramework.slice(1)} Optimization Tips\n\n`;
    const frameworkAdvice = generateFrameworkSpecificAdvice(config.targetFramework);
    for (const tip of frameworkAdvice) {
      output += `- ${tip}\n`;
    }
    output += '\n';
  }
  
  // General optimization strategies
  if (config.includeOptimization) {
    output += `## 🛠️ Optimization Strategies\n\n`;
    const strategies = generateOptimizationStrategies();
    for (const strategy of strategies) {
      output += `- ${strategy}\n`;
    }
    output += '\n';
  }
  
  // Recommendations
  if (config.includeRecommendations) {
    output += `## 💡 Implementation Recommendations\n\n`;
    output += `### Monitoring Setup\n`;
    output += `1. **Real User Monitoring (RUM):** Implement tools like Google Analytics, New Relic, or DataDog\n`;
    output += `2. **Synthetic Monitoring:** Use Lighthouse CI, WebPageTest, or Pingdom\n`;
    output += `3. **Core Web Vitals Tracking:** Monitor CWV in Google Search Console\n\n`;
    
    output += `### Budget Implementation\n`;
    output += `1. **CI/CD Integration:** Fail builds that exceed performance budgets\n`;
    output += `2. **Bundle Analysis:** Use webpack-bundle-analyzer or similar tools\n`;
    output += `3. **Regular Audits:** Schedule weekly/monthly performance reviews\n\n`;
    
    output += `### Priority Matrix\n`;
    output += `- **Critical:** Core Web Vitals, JavaScript bundle size\n`;
    output += `- **High:** TTFB, FCP, total page weight, images\n`;
    output += `- **Medium:** CSS size, Speed Index, fonts, HTTP requests\n`;
    output += `- **Low:** Non-critical third-party resources\n\n`;
  }
  
  // Advanced considerations
  if (config.includeAdvanced && config.reportLevel === 'expert') {
    output += `## 🔬 Advanced Considerations\n\n`;
    output += `### Performance API Usage\n`;
    output += `\`\`\`javascript\n`;
    output += `// Measure Core Web Vitals\n`;
    output += `new PerformanceObserver((list) => {\n`;
    output += `  for (const entry of list.getEntries()) {\n`;
    output += `    if (entry.entryType === 'largest-contentful-paint') {\n`;
    output += `      console.log('LCP:', entry.startTime);\n`;
    output += `    }\n`;
    output += `  }\n`;
    output += `}).observe({entryTypes: ['largest-contentful-paint']});\n`;
    output += `\`\`\`\n\n`;
    
    output += `### Budget Enforcement\n`;
    output += `\`\`\`json\n`;
    output += `// Lighthouse CI budget.json example\n`;
    output += `{\n`;
    output += `  "resourceSizes": [\n`;
    output += `    { "resourceType": "script", "budget": ${budget.resources.find((r: any) => r.key === 'javascript')?.budget.good || 350} },\n`;
    output += `    { "resourceType": "image", "budget": ${budget.resources.find((r: any) => r.key === 'images')?.budget.good || 800} }\n`;
    output += `  ],\n`;
    output += `  "timings": [\n`;
    output += `    { "metric": "first-contentful-paint", "budget": ${budget.metrics.find((m: any) => m.name.includes('FCP'))?.budget.good * 1000 || 1800} }\n`;
    output += `  ]\n`;
    output += `}\n`;
    output += `\`\`\`\n\n`;
  }
  
  return output;
}

export function processPerformanceBudgetCalculator(
  config: PerformanceBudgetConfig
): ToolResult {
  try {
    const budget = calculateBudget(config);
    const formattedOutput = formatBudgetOutput(budget, config);
    
    return {
      success: true,
      result: formattedOutput,
      metadata: {
        budgetType: config.budgetType,
        deviceType: config.deviceType,
        networkCondition: config.networkCondition,
        metricsCount: budget.metrics.length,
        resourcesCount: budget.resources.length,
        targetFramework: config.targetFramework,
        coreWebVitalsCount: budget.metrics.filter((m: any) => m.coreWebVital).length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate performance budget'
    };
  }
}

export const PERFORMANCE_BUDGET_CALCULATOR_TOOL: Tool = {
  id: 'performance-budget-calculator',
  name: 'Performance Budget Calculator',
  description: 'Calculate comprehensive performance budgets for web applications with Core Web Vitals, resource limits, and framework-specific optimization guidance',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'performance-tools')!,
  slug: 'performance-budget-calculator',
  icon: 'Zap',
  keywords: ['performance', 'budget', 'core web vitals', 'optimization', 'lighthouse', 'web vitals', 'resources', 'timing'],
  seoTitle: 'Free Performance Budget Calculator - Core Web Vitals & Resource Optimization',
  seoDescription: 'Calculate performance budgets for web applications with Core Web Vitals, resource limits, and optimization guidance. Optimize LCP, FID, CLS and more.',
  tags: ['performance', 'budget', 'core web vitals', 'optimization', 'lighthouse', 'web vitals', 'resources', 'timing'],
  complexity: 'advanced',
  showInList: true,
  shortDescription: 'Calculate performance budgets for Core Web Vitals and resource optimization',
  
  examples: [
    {
      title: 'Mobile 3G Performance Budget',
      input: 'Device: Mobile, Network: 3G Fast, Type: Comprehensive',
      output: 'Complete budget with Core Web Vitals (LCP: 2.5s, FID: 100ms, CLS: 0.1) and resource limits',
      description: 'Generate performance budget for mobile users on 3G networks'
    },
    {
      title: 'React App Resource Budget',
      input: 'Framework: React, Type: Resource, Device: Desktop',
      output: 'JavaScript: 500KB, CSS: 100KB, Images: 1200KB with React-specific optimization tips',
      description: 'Create resource budget with React framework optimizations'
    },
    {
      title: 'Enterprise Application Budget',
      input: 'Network: 4G, Level: Expert, Type: Comprehensive, Advanced: Yes',
      output: 'Detailed budget with Performance API code examples and CI/CD integration guide',
      description: 'Generate expert-level budget with implementation details'
    }
  ],

  useCases: [
    'Setting performance targets for new web applications',
    'Establishing CI/CD performance gates and monitoring',
    'Core Web Vitals optimization and SEO improvement',
    'Framework-specific performance planning and optimization',
    'Network-aware application development and testing',
    'Performance team education and stakeholder reporting',
    'Third-party vendor performance requirement specification',
    'Progressive web app (PWA) performance planning'
  ],

  faq: [
    {
      question: 'How do Core Web Vitals affect search rankings?',
      answer: 'Core Web Vitals (LCP, FID, CLS) are official Google ranking factors. Good scores improve search visibility, while poor scores can negatively impact rankings. They measure real user experience and are critical for SEO.'
    },
    {
      question: 'Should I optimize for mobile or desktop first?',
      answer: 'Always optimize for mobile first. Mobile users typically have slower networks and less powerful devices. If your site performs well on mobile, it will excel on desktop. Google also uses mobile-first indexing.'
    },
    {
      question: 'How do I implement these budgets in my CI/CD pipeline?',
      answer: 'Use tools like Lighthouse CI, SpeedCurve, or WebPageTest APIs to fail builds that exceed your budgets. The tool provides JSON configurations for popular performance monitoring tools.'
    },
    {
      question: 'What is the difference between lab and field data?',
      answer: 'Lab data comes from controlled environments (Lighthouse, WebPageTest) and is consistent but may not reflect real user conditions. Field data comes from real users (Chrome UX Report) and varies but represents actual experience.'
    },
    {
      question: 'How often should I review and update performance budgets?',
      answer: 'Review budgets quarterly or when major features are added. Technology improvements and user behavior changes may allow for tighter budgets. Monitor real user metrics to ensure budgets remain realistic.'
    }
  ],

  commonErrors: [
    'Setting unrealistic budgets that are impossible to achieve with current technology',
    'Focusing only on lab data without considering real user conditions',
    'Not accounting for network variability in target user base',
    'Ignoring framework-specific optimization opportunities',
    'Setting budgets without proper monitoring and enforcement mechanisms',
    'Not considering the cumulative impact of third-party scripts and resources'
  ],

  relatedTools: ['load-testing-config-generator', 'security-headers-analyzer', 'api-request-builder', 'network-monitoring-tool']
};