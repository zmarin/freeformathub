import { useState, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processLoadTestingConfigGenerator, type LoadTestingConfig } from '../../../tools/development/load-testing-config-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface LoadTestingConfigGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: LoadTestingConfig = {
  testType: 'load',
  framework: 'k6',
  targetUrl: 'https://api.example.com',
  duration: 300,
  virtualUsers: 50,
  rampUpTime: 30,
  thinkTime: 1,
  requestTimeout: 30,
  includeHeaders: true,
  includeAuth: false,
  authType: 'bearer',
  includeDataGeneration: false,
  dataType: 'json',
  reportFormat: 'html',
  includeMetrics: true,
  includeAssertions: true,
  distributedTesting: false,
  nodeCount: 3
};

const OPTIONS = [
  {
    key: 'testType',
    label: 'Test Type',
    type: 'select' as const,
    default: 'load',
    options: [
      { value: 'load', label: '📈 Load - Normal expected traffic' },
      { value: 'stress', label: '🚀 Stress - Beyond normal capacity' },
      { value: 'spike', label: '⚡ Spike - Sudden traffic increases' },
      { value: 'volume', label: '💾 Volume - Large data amounts' },
      { value: 'endurance', label: '⏰ Endurance - Extended periods' }
    ],
    description: 'Type of performance test to conduct'
  },
  {
    key: 'framework',
    label: 'Framework',
    type: 'select' as const,
    default: 'k6',
    options: [
      { value: 'k6', label: '🎯 K6 - Modern load testing (JavaScript)' },
      { value: 'jmeter', label: '🔧 JMeter - Enterprise testing (GUI/XML)' },
      { value: 'artillery', label: '🎪 Artillery - Microservices testing (YAML)' },
      { value: 'locust', label: '🐍 Locust - Python-based testing' },
      { value: 'wrk', label: '⚡ WRK - Simple HTTP benchmarking' },
      { value: 'vegeta', label: '🌿 Vegeta - HTTP load testing (Go)' }
    ],
    description: 'Load testing framework to generate configuration for'
  },
  {
    key: 'duration',
    label: 'Duration (seconds)',
    type: 'number' as const,
    default: 300,
    min: 10,
    max: 7200,
    description: 'Total test duration in seconds'
  },
  {
    key: 'virtualUsers',
    label: 'Virtual Users',
    type: 'number' as const,
    default: 50,
    min: 1,
    max: 10000,
    description: 'Number of concurrent virtual users'
  },
  {
    key: 'rampUpTime',
    label: 'Ramp-up Time (seconds)',
    type: 'number' as const,
    default: 30,
    min: 0,
    max: 600,
    description: 'Time to gradually increase users to target level'
  },
  {
    key: 'iterations',
    label: 'Iterations (optional)',
    type: 'number' as const,
    default: undefined,
    min: 1,
    max: 1000000,
    description: 'Number of iterations per user (leave empty for time-based)'
  },
  {
    key: 'thinkTime',
    label: 'Think Time (seconds)',
    type: 'number' as const,
    default: 1,
    min: 0,
    max: 60,
    description: 'Pause between requests to simulate user behavior'
  },
  {
    key: 'requestTimeout',
    label: 'Request Timeout (seconds)',
    type: 'number' as const,
    default: 30,
    min: 1,
    max: 300,
    description: 'Maximum time to wait for each request'
  },
  {
    key: 'includeHeaders',
    label: 'Include Headers',
    type: 'boolean' as const,
    default: true,
    description: 'Add common HTTP headers to requests'
  },
  {
    key: 'includeAuth',
    label: 'Include Authentication',
    type: 'boolean' as const,
    default: false,
    description: 'Add authentication headers to requests'
  },
  {
    key: 'authType',
    label: 'Authentication Type',
    type: 'select' as const,
    default: 'bearer',
    options: [
      { value: 'bearer', label: '🔑 Bearer Token' },
      { value: 'basic', label: '👤 Basic Auth' },
      { value: 'apikey', label: '🔐 API Key' },
      { value: 'oauth2', label: '🛡️ OAuth 2.0' }
    ],
    description: 'Type of authentication to include',
    showWhen: (config: LoadTestingConfig) => config.includeAuth
  },
  {
    key: 'includeDataGeneration',
    label: 'Include Data Generation',
    type: 'boolean' as const,
    default: false,
    description: 'Generate random test data for POST requests'
  },
  {
    key: 'dataType',
    label: 'Data Type',
    type: 'select' as const,
    default: 'json',
    options: [
      { value: 'json', label: '📋 JSON' },
      { value: 'csv', label: '📊 CSV' },
      { value: 'random', label: '🎲 Random' }
    ],
    description: 'Format for generated test data',
    showWhen: (config: LoadTestingConfig) => config.includeDataGeneration
  },
  {
    key: 'reportFormat',
    label: 'Report Format',
    type: 'select' as const,
    default: 'html',
    options: [
      { value: 'html', label: '🌐 HTML Report' },
      { value: 'json', label: '📋 JSON Data' },
      { value: 'csv', label: '📊 CSV Export' },
      { value: 'junit', label: '🧪 JUnit XML' },
      { value: 'all', label: '📦 All Formats' }
    ],
    description: 'Output format for test results'
  },
  {
    key: 'includeMetrics',
    label: 'Include Metrics Collection',
    type: 'boolean' as const,
    default: true,
    description: 'Collect detailed performance metrics during test'
  },
  {
    key: 'includeAssertions',
    label: 'Include Assertions',
    type: 'boolean' as const,
    default: true,
    description: 'Add response validation and performance assertions'
  },
  {
    key: 'distributedTesting',
    label: 'Distributed Testing',
    type: 'boolean' as const,
    default: false,
    description: 'Generate configuration for distributed load testing'
  },
  {
    key: 'nodeCount',
    label: 'Number of Test Nodes',
    type: 'number' as const,
    default: 3,
    min: 2,
    max: 20,
    description: 'Number of nodes for distributed testing',
    showWhen: (config: LoadTestingConfig) => config.distributedTesting
  }
];

export function LoadTestingConfigGenerator({ className = '' }: LoadTestingConfigGeneratorProps) {
  const [targetUrl, setTargetUrl] = useState('https://api.example.com');
  const [config, setConfig] = useState<LoadTestingConfig>(DEFAULT_CONFIG);
  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((url: string, cfg: LoadTestingConfig) => {
      if (url.trim()) {
        const result = processLoadTestingConfigGenerator(url, cfg);
        if (result.success && result.result) {
          addToHistory('load-testing-config-generator', {
            input: url,
            output: result.result,
            config: cfg
          });
        }
      }
    }, 300),
    [addToHistory]
  );

  const result = useMemo(() => {
    if (!targetUrl.trim()) {
      return { success: false, error: 'Please enter a target URL' };
    }
    return processLoadTestingConfigGenerator(targetUrl, config);
  }, [targetUrl, config]);

  const handleUrlChange = (url: string) => {
    setTargetUrl(url);
    debouncedProcess(url, config);
  };

  const handleConfigChange = (newConfig: LoadTestingConfig) => {
    setConfig(newConfig);
    debouncedProcess(targetUrl, newConfig);
  };

  const getFileExtension = () => {
    switch (config.framework) {
      case 'k6': return '.js';
      case 'jmeter': return '.jmx';
      case 'artillery': return '.yml';
      case 'locust': return '.py';
      case 'wrk': return '.sh';
      case 'vegeta': return '.txt';
      default: return '.txt';
    }
  };

  const getLanguage = () => {
    switch (config.framework) {
      case 'k6': return 'javascript';
      case 'jmeter': return 'xml';
      case 'artillery': return 'yaml';
      case 'locust': return 'python';
      case 'wrk': return 'bash';
      case 'vegeta': return 'text';
      default: return 'text';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Test Overview */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Overview</h3>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div><strong>{config.testType.charAt(0).toUpperCase() + config.testType.slice(1)}</strong> test using <strong>{config.framework.toUpperCase()}</strong></div>
              <div className="mt-1">
                {config.virtualUsers} users over {Math.floor(config.duration / 60)}min {config.duration % 60}s
                {config.distributedTesting && ` (${config.nodeCount} nodes)`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Configurations</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setConfig({...DEFAULT_CONFIG, testType: 'load', virtualUsers: 10, duration: 60})}
              className="p-2 text-left text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border"
            >
              🧪 <strong>Smoke Test</strong><br/>
              10 users, 1 minute
            </button>
            <button
              onClick={() => setConfig({...DEFAULT_CONFIG, testType: 'load', virtualUsers: 100, duration: 600})}
              className="p-2 text-left text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border"
            >
              📈 <strong>Load Test</strong><br/>
              100 users, 10 minutes
            </button>
            <button
              onClick={() => setConfig({...DEFAULT_CONFIG, testType: 'stress', virtualUsers: 500, duration: 900})}
              className="p-2 text-left text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border"
            >
              🚀 <strong>Stress Test</strong><br/>
              500 users, 15 minutes
            </button>
          </div>
        </div>

        {/* Framework Features */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Framework Features</h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
            {config.framework === 'k6' && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>K6:</strong> JavaScript-based, CI/CD friendly, cloud integrations, extensive metrics
              </div>
            )}
            {config.framework === 'jmeter' && (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <strong>JMeter:</strong> GUI interface, enterprise features, distributed testing, extensive protocols
              </div>
            )}
            {config.framework === 'artillery' && (
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Artillery:</strong> YAML config, microservices focused, AWS Lambda support, plugin ecosystem
              </div>
            )}
            {config.framework === 'locust' && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <strong>Locust:</strong> Python scripts, web UI, distributed testing, complex user behaviors
              </div>
            )}
          </div>
        </div>

        <OptionsPanel 
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="Target URL"
          subtitle="Enter the URL or API endpoint to test"
          value={targetUrl}
          onChange={handleUrlChange}
          placeholder="https://api.example.com/v1/users"
          maxLength={1000}
          showLineNumbers={false}
          language="text"
        />

        <OutputPanel
          title={`${config.framework.toUpperCase()} Configuration`}
          subtitle={result.success ? 
            `Generated ${config.testType} test for ${config.virtualUsers} virtual users` :
            'Configuration will appear here'
          }
          value={result.success ? result.result || '' : ''}
          error={!result.success ? result.error : undefined}
          language={getLanguage()}
          maxHeight="600px"
          actions={
            result.success && result.result ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const filename = `${config.testType}-test-${config.framework}${getFileExtension()}`;
                    const blob = new Blob([result.result || ''], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  💾 Download Config
                </button>
                {config.distributedTesting && (
                  <button
                    onClick={() => {
                      const dockerConfig = result.result?.split('# Docker Compose Configuration')[1]?.split('\n\n# Configuration Guide')[0] || '';
                      if (dockerConfig) {
                        const blob = new Blob([dockerConfig.trim()], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'docker-compose.yml';
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    🐳 Download Docker
                  </button>
                )}
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