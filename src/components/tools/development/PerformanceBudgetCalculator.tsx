import { useState, useMemo } from 'react';
import { OutputPanel, OptionsPanel } from '../../ui';
import { processPerformanceBudgetCalculator, type PerformanceBudgetConfig } from '../../../tools/development/performance-budget-calculator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface PerformanceBudgetCalculatorProps {
  className?: string;
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

const OPTIONS = [
  {
    key: 'budgetType',
    label: 'Budget Type',
    type: 'select' as const,
    default: 'comprehensive',
    options: [
      { value: 'comprehensive', label: '🎯 Comprehensive - All metrics and resources' },
      { value: 'timing', label: '⏱️ Timing - Core Web Vitals and performance metrics' },
      { value: 'resource', label: '📦 Resource - Bundle sizes and asset limits' },
      { value: 'network', label: '🌐 Network - Network-sensitive metrics only' }
    ],
    description: 'Type of performance budget to generate'
  },
  {
    key: 'deviceType',
    label: 'Target Device',
    type: 'select' as const,
    default: 'mobile',
    options: [
      { value: 'mobile', label: '📱 Mobile - Smartphones and tablets' },
      { value: 'desktop', label: '💻 Desktop - Laptop and desktop computers' },
      { value: 'both', label: '🔄 Both - Mobile and desktop considerations' }
    ],
    description: 'Primary device type for optimization'
  },
  {
    key: 'networkCondition',
    label: 'Network Condition',
    type: 'select' as const,
    default: '3g-fast',
    options: [
      { value: '3g-slow', label: '🐌 3G Slow - 400 Kbps, 2000ms latency' },
      { value: '3g-fast', label: '📶 3G Fast - 1.6 Mbps, 562ms latency' },
      { value: '4g', label: '🚀 4G - 9 Mbps, 85ms latency' },
      { value: '5g', label: '⚡ 5G - 100 Mbps, 10ms latency' },
      { value: 'cable', label: '🏠 Broadband - 5 Mbps, 28ms latency' },
      { value: 'custom', label: '⚙️ Custom - Define custom network' }
    ],
    description: 'Network conditions for budget calculations'
  },
  {
    key: 'customBandwidth',
    label: 'Custom Bandwidth (Mbps)',
    type: 'number' as const,
    default: 1.6,
    min: 0.1,
    max: 1000,
    description: 'Custom network bandwidth in megabits per second',
    showWhen: (config: PerformanceBudgetConfig) => config.networkCondition === 'custom'
  },
  {
    key: 'customLatency',
    label: 'Custom Latency (ms)',
    type: 'number' as const,
    default: 562,
    min: 1,
    max: 5000,
    description: 'Custom network latency in milliseconds',
    showWhen: (config: PerformanceBudgetConfig) => config.networkCondition === 'custom'
  },
  {
    key: 'targetFramework',
    label: 'Target Framework',
    type: 'select' as const,
    default: 'react',
    options: [
      { value: 'react', label: '⚛️ React - React.js applications' },
      { value: 'vue', label: '💚 Vue - Vue.js applications' },
      { value: 'angular', label: '🅰️ Angular - Angular applications' },
      { value: 'svelte', label: '🧡 Svelte - Svelte applications' },
      { value: 'vanilla', label: '🍦 Vanilla - Pure JavaScript' },
      { value: 'general', label: '🌐 General - Framework agnostic' }
    ],
    description: 'Framework for specific optimization advice',
    showWhen: (config: PerformanceBudgetConfig) => config.includeFramework
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: '📖 Detailed - Full report with explanations' },
      { value: 'summary', label: '📋 Summary - Key metrics only' },
      { value: 'json', label: '🔧 JSON - Structured data format' },
      { value: 'csv', label: '📊 CSV - Spreadsheet format' }
    ],
    description: 'Format for the generated budget report'
  },
  {
    key: 'reportLevel',
    label: 'Report Detail Level',
    type: 'select' as const,
    default: 'intermediate',
    options: [
      { value: 'basic', label: '🔰 Basic - Core Web Vitals only' },
      { value: 'intermediate', label: '📈 Intermediate - Key metrics and resources' },
      { value: 'expert', label: '🎓 Expert - All metrics with implementation details' }
    ],
    description: 'Level of detail in the generated report'
  },
  {
    key: 'includeRecommendations',
    label: 'Include Recommendations',
    type: 'boolean' as const,
    default: true,
    description: 'Include implementation and monitoring recommendations'
  },
  {
    key: 'includeFramework',
    label: 'Include Framework Tips',
    type: 'boolean' as const,
    default: true,
    description: 'Include framework-specific optimization advice'
  },
  {
    key: 'includeOptimization',
    label: 'Include Optimization Strategies',
    type: 'boolean' as const,
    default: true,
    description: 'Include general optimization strategies and techniques'
  },
  {
    key: 'includeAdvanced',
    label: 'Include Advanced Features',
    type: 'boolean' as const,
    default: true,
    description: 'Include Performance API examples and advanced configurations'
  }
];

const PRESET_CONFIGS = {
  mobile3g: {
    ...DEFAULT_CONFIG,
    deviceType: 'mobile' as const,
    networkCondition: '3g-fast' as const,
    budgetType: 'comprehensive' as const,
    reportLevel: 'intermediate' as const
  },
  desktop4g: {
    ...DEFAULT_CONFIG,
    deviceType: 'desktop' as const,
    networkCondition: '4g' as const,
    budgetType: 'comprehensive' as const,
    reportLevel: 'intermediate' as const
  },
  pwa: {
    ...DEFAULT_CONFIG,
    deviceType: 'mobile' as const,
    networkCondition: '3g-slow' as const,
    budgetType: 'comprehensive' as const,
    reportLevel: 'expert' as const,
    includeAdvanced: true
  },
  ecommerce: {
    ...DEFAULT_CONFIG,
    deviceType: 'both' as const,
    networkCondition: '3g-fast' as const,
    budgetType: 'timing' as const,
    reportLevel: 'intermediate' as const,
    targetFramework: 'react' as const
  }
};

export function PerformanceBudgetCalculator({ className = '' }: PerformanceBudgetCalculatorProps) {
  const [config, setConfig] = useState<PerformanceBudgetConfig>(DEFAULT_CONFIG);
  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((cfg: PerformanceBudgetConfig) => {
      const result = processPerformanceBudgetCalculator(cfg);
      if (result.success && result.result) {
        addToHistory('performance-budget-calculator', {
          input: JSON.stringify(cfg, null, 2),
          output: result.result,
          config: cfg
        });
      }
    }, 300),
    [addToHistory]
  );

  const result = useMemo(() => {
    return processPerformanceBudgetCalculator(config);
  }, [config]);

  const handleConfigChange = (newConfig: PerformanceBudgetConfig) => {
    setConfig(newConfig);
    debouncedProcess(newConfig);
  };

  const loadPreset = (presetKey: keyof typeof PRESET_CONFIGS) => {
    const presetConfig = PRESET_CONFIGS[presetKey];
    setConfig(presetConfig);
    debouncedProcess(presetConfig);
  };

  const getNetworkInfo = () => {
    if (config.networkCondition === 'custom') {
      return `${config.customBandwidth || 1.6} Mbps, ${config.customLatency || 562}ms`;
    }
    
    const networkMap = {
      '3g-slow': '400 Kbps, 2000ms',
      '3g-fast': '1.6 Mbps, 562ms',
      '4g': '9 Mbps, 85ms',
      '5g': '100 Mbps, 10ms',
      'cable': '5 Mbps, 28ms'
    };
    
    return networkMap[config.networkCondition] || 'Unknown';
  };

  const getBudgetSummary = () => {
    if (!result.success || !result.metadata) return null;
    
    return {
      metrics: result.metadata.metricsCount,
      resources: result.metadata.resourcesCount,
      coreVitals: result.metadata.coreWebVitalsCount,
      device: result.metadata.deviceType,
      network: result.metadata.networkCondition
    };
  };

  const summary = getBudgetSummary();

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Current Configuration */}
        <div className="space-y-3">
          <h3 >Current Configuration</h3>
          <div >
            <div className="text-sm space-y-1">
              <div><strong>Type:</strong> {config.budgetType.charAt(0).toUpperCase() + config.budgetType.slice(1)}</div>
              <div><strong>Device:</strong> {config.deviceType.charAt(0).toUpperCase() + config.deviceType.slice(1)}</div>
              <div><strong>Network:</strong> {getNetworkInfo()}</div>
              {config.includeFramework && (
                <div><strong>Framework:</strong> {config.targetFramework.charAt(0).toUpperCase() + config.targetFramework.slice(1)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Budget Summary */}
        {summary && (
          <div className="space-y-3">
            <h3 >Budget Summary</h3>
            <div >
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Core Web Vitals:</span>
                  <span >{summary.coreVitals}</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance Metrics:</span>
                  <span >{summary.metrics}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resource Budgets:</span>
                  <span >{summary.resources}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-3">
          <h3 >Quick Presets</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => loadPreset('mobile3g')}
              
            >
              📱 <strong>Mobile 3G</strong><br/>
              Core Web Vitals for mobile users
            </button>
            <button
              onClick={() => loadPreset('desktop4g')}
              
            >
              💻 <strong>Desktop 4G</strong><br/>
              Standard desktop performance budget
            </button>
            <button
              onClick={() => loadPreset('pwa')}
              
            >
              📲 <strong>PWA Optimized</strong><br/>
              Progressive Web App on slow 3G
            </button>
            <button
              onClick={() => loadPreset('ecommerce')}
              
            >
              🛒 <strong>E-commerce</strong><br/>
              High-conversion user experience focus
            </button>
          </div>
        </div>

        {/* Core Web Vitals Info */}
        <div className="space-y-3">
          <h3 >Core Web Vitals</h3>
          <div >
            <div >
              <strong>LCP:</strong> Largest Contentful Paint - Loading performance
            </div>
            <div >
              <strong>FID:</strong> First Input Delay - Interactivity responsiveness
            </div>
            <div >
              <strong>CLS:</strong> Cumulative Layout Shift - Visual stability
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="space-y-3">
          <h3 >Quick Tips</h3>
          <div >
            <div>• Prioritize Core Web Vitals for SEO ranking</div>
            <div>• Test on real devices and networks</div>
            <div>• Monitor with RUM and synthetic tools</div>
            <div>• Implement budgets in CI/CD pipeline</div>
            <div>• Focus on mobile-first optimization</div>
          </div>
        </div>

        <OptionsPanel 
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8 space-y-6">
        <OutputPanel
          title="Performance Budget Report"
          subtitle={result.success ? 
            `${config.budgetType.charAt(0).toUpperCase() + config.budgetType.slice(1)} budget for ${config.deviceType} devices` :
            'Performance budget will appear here'
          }
          value={result.success ? result.result || '' : ''}
          error={!result.success ? result.error : undefined}
          language={config.outputFormat === 'json' ? 'json' : config.outputFormat === 'csv' ? 'csv' : 'markdown'}
          maxHeight="700px"
          actions={
            result.success && result.result ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const extension = config.outputFormat === 'json' ? '.json' : 
                                    config.outputFormat === 'csv' ? '.csv' : '.md';
                    const filename = `performance-budget-${config.deviceType}-${config.networkCondition}${extension}`;
                    const blob = new Blob([result.result || ''], { 
                      type: config.outputFormat === 'json' ? 'application/json' :
                            config.outputFormat === 'csv' ? 'text/csv' : 'text/markdown'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📊 Download Budget
                </button>
                <button
                  onClick={() => {
                    const lighthouseConfig = {
                      ci: {
                        collect: {
                          settings: {
                            chromeFlags: "--no-sandbox"
                          }
                        },
                        assert: {
                          assertions: {
                            "categories:performance": ["warn", {minScore: 0.9}],
                            "first-contentful-paint": ["error", {maxNumericValue: 2000}],
                            "largest-contentful-paint": ["error", {maxNumericValue: 2500}],
                            "cumulative-layout-shift": ["error", {maxNumericValue: 0.1}]
                          }
                        }
                      }
                    };
                    
                    const blob = new Blob([JSON.stringify(lighthouseConfig, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'lighthouse-ci-config.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  🚦 Lighthouse Config
                </button>
                <button
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  🔄 Reset
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}