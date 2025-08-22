import React, { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processWebhookTesting } from '../../../tools/web/webhook-testing-tool';
import type { WebhookTestingConfig, ToolResult } from '../../../tools/web/webhook-testing-tool';

const DEFAULT_CONFIG: WebhookTestingConfig = {
  method: 'POST',
  webhookUrl: '',
  payload: '',
  headers: {},
  timeout: 5000,
  retries: 1,
  retryDelay: 1000,
  followRedirects: true,
  validateSsl: true,
  contentType: 'application/json',
  authentication: {
    type: 'none'
  },
  testScenarios: [],
  validateResponse: true,
  expectedStatus: [200, 201, 202],
  expectedHeaders: {},
  expectedBody: '',
  logLevel: 'detailed',
  mockMode: true
};

const SAMPLE_WEBHOOKS = [
  'https://webhook.site/unique-id-here',
  'https://api.example.com/webhooks/payment',
  'https://hooks.slack.com/services/T00/B00/XXXX',
  'http://localhost:3000/webhook',
  'https://myapp.com/api/v1/webhooks'
];

const SAMPLE_PAYLOAD = JSON.stringify({
  event: "order.completed",
  timestamp: new Date().toISOString(),
  data: {
    orderId: "order_123456",
    customerId: "cust_789",
    amount: 99.99,
    currency: "USD",
    items: [
      { id: "item_1", name: "Product A", quantity: 2, price: 49.99 }
    ]
  }
}, null, 2);

export function WebhookTestingTool() {
  const [input, setInput] = useState(SAMPLE_WEBHOOKS[0]);
  const [config, setConfig] = useState<WebhookTestingConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const processedResult = useMemo(() => {
    if (!input.trim()) {
      return { success: false, error: 'Please enter a webhook URL' };
    }

    return processWebhookTesting(input, config);
  }, [input, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(processedResult);
    }, 500);

    return () => clearTimeout(timer);
  }, [processedResult]);

  const handleConfigChange = (key: keyof WebhookTestingConfig, value: any) => {
    // Handle nested authentication object
    if (key.startsWith('authentication.')) {
      const authKey = key.replace('authentication.', '');
      setConfig(prev => ({
        ...prev,
        authentication: {
          ...prev.authentication,
          [authKey]: value
        }
      }));
    } else {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleRunTests = () => {
    setIsRunning(true);
    // Simulate test run
    setTimeout(() => {
      setIsRunning(false);
    }, 3000);
  };

  const handleAddHeader = () => {
    const key = prompt('Header name:');
    const value = prompt('Header value:');
    if (key && value) {
      setConfig(prev => ({
        ...prev,
        headers: { ...prev.headers, [key]: value }
      }));
    }
  };

  const handleRemoveHeader = (headerKey: string) => {
    setConfig(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[headerKey];
      return { ...prev, headers: newHeaders };
    });
  };

  const optionGroups = [
    {
      title: 'Request Configuration',
      options: [
        {
          key: 'method' as const,
          label: 'HTTP Method',
          type: 'select' as const,
          value: config.method,
          options: [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
            { value: 'DELETE', label: 'DELETE' },
            { value: 'HEAD', label: 'HEAD' },
            { value: 'OPTIONS', label: 'OPTIONS' }
          ]
        },
        {
          key: 'contentType' as const,
          label: 'Content Type',
          type: 'select' as const,
          value: config.contentType,
          options: [
            { value: 'application/json', label: 'application/json' },
            { value: 'application/x-www-form-urlencoded', label: 'application/x-www-form-urlencoded' },
            { value: 'text/plain', label: 'text/plain' },
            { value: 'application/xml', label: 'application/xml' },
            { value: 'multipart/form-data', label: 'multipart/form-data' }
          ]
        },
        {
          key: 'timeout' as const,
          label: 'Timeout (ms)',
          type: 'number' as const,
          value: config.timeout,
          min: 1000,
          max: 30000,
          step: 1000
        },
        {
          key: 'retries' as const,
          label: 'Max Retries',
          type: 'number' as const,
          value: config.retries,
          min: 0,
          max: 5
        },
        {
          key: 'retryDelay' as const,
          label: 'Retry Delay (ms)',
          type: 'number' as const,
          value: config.retryDelay,
          min: 500,
          max: 10000,
          step: 500
        }
      ]
    },
    {
      title: 'Authentication',
      options: [
        {
          key: 'authentication.type' as const,
          label: 'Auth Type',
          type: 'select' as const,
          value: config.authentication.type,
          options: [
            { value: 'none', label: 'None' },
            { value: 'bearer', label: 'Bearer Token' },
            { value: 'basic', label: 'Basic Auth' },
            { value: 'api_key', label: 'API Key' },
            { value: 'signature', label: 'Signature' }
          ]
        }
      ]
    },
    {
      title: 'Validation Options',
      options: [
        {
          key: 'validateResponse' as const,
          label: 'Validate Response',
          type: 'checkbox' as const,
          value: config.validateResponse
        },
        {
          key: 'validateSsl' as const,
          label: 'Validate SSL',
          type: 'checkbox' as const,
          value: config.validateSsl
        },
        {
          key: 'followRedirects' as const,
          label: 'Follow Redirects',
          type: 'checkbox' as const,
          value: config.followRedirects
        },
        {
          key: 'mockMode' as const,
          label: 'Mock Mode (Demo)',
          type: 'checkbox' as const,
          value: config.mockMode
        }
      ]
    },
    {
      title: 'Output Options',
      options: [
        {
          key: 'logLevel' as const,
          label: 'Log Level',
          type: 'select' as const,
          value: config.logLevel,
          options: [
            { value: 'basic', label: 'Basic' },
            { value: 'detailed', label: 'Detailed' },
            { value: 'debug', label: 'Debug' }
          ]
        }
      ]
    }
  ];

  // Add authentication fields based on selected type
  if (config.authentication.type === 'bearer') {
    optionGroups[1].options.push({
      key: 'authentication.token' as const,
      label: 'Bearer Token',
      type: 'text' as const,
      value: config.authentication.token || '',
      placeholder: 'your-bearer-token'
    });
  } else if (config.authentication.type === 'basic') {
    optionGroups[1].options.push(
      {
        key: 'authentication.username' as const,
        label: 'Username',
        type: 'text' as const,
        value: config.authentication.username || '',
        placeholder: 'username'
      },
      {
        key: 'authentication.password' as const,
        label: 'Password',
        type: 'password' as const,
        value: config.authentication.password || '',
        placeholder: 'password'
      }
    );
  } else if (config.authentication.type === 'api_key') {
    optionGroups[1].options.push(
      {
        key: 'authentication.apiKey' as const,
        label: 'API Key',
        type: 'text' as const,
        value: config.authentication.apiKey || '',
        placeholder: 'your-api-key'
      },
      {
        key: 'authentication.apiKeyHeader' as const,
        label: 'API Key Header',
        type: 'text' as const,
        value: config.authentication.apiKeyHeader || 'X-API-Key',
        placeholder: 'X-API-Key'
      }
    );
  } else if (config.authentication.type === 'signature') {
    optionGroups[1].options.push(
      {
        key: 'authentication.secretKey' as const,
        label: 'Secret Key',
        type: 'text' as const,
        value: config.authentication.secretKey || '',
        placeholder: 'webhook-secret'
      },
      {
        key: 'authentication.signatureHeader' as const,
        label: 'Signature Header',
        type: 'text' as const,
        value: config.authentication.signatureHeader || 'X-Signature',
        placeholder: 'X-Signature'
      }
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <InputPanel
          title="Webhook URL"
          value={input}
          onChange={setInput}
          placeholder="https://webhook.site/unique-id"
          singleLine
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Test Payload (JSON)
          </label>
          <textarea
            value={config.payload || SAMPLE_PAYLOAD}
            onChange={(e) => handleConfigChange('payload', e.target.value)}
            placeholder="Enter JSON payload for webhook testing"
            className="w-full h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
          />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Custom Headers</h3>
            <button
              onClick={handleAddHeader}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Add
            </button>
          </div>
          {Object.entries(config.headers).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(config.headers).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{key}:</span>
                    <span className="text-xs text-gray-900 dark:text-gray-100 ml-2">{value}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveHeader(key)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">No custom headers</p>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
              isRunning
                ? 'bg-yellow-600 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isRunning ? '🔄 Running Tests...' : '▶ Run Webhook Tests'}
          </button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <OutputPanel
          title="Test Results"
          value={result?.output || ''}
          language="text"
          error={result?.error}
          showCopy
          showDownload
          filename="webhook-test-results.txt"
        />
        
        {result?.warnings && result.warnings.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {result?.testResults?.security?.vulnerabilities && result.testResults.security.vulnerabilities.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              🔒 Security Issues ({result.testResults.security.vulnerabilities.length})
            </h4>
            <div className="space-y-2">
              {result.testResults.security.vulnerabilities.map((vuln, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-700 dark:text-red-300">{vuln.type}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      vuln.severity === 'critical' ? 'bg-red-600 text-white' :
                      vuln.severity === 'high' ? 'bg-orange-500 text-white' :
                      vuln.severity === 'medium' ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {vuln.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-red-600 dark:text-red-400">{vuln.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <OptionsPanel
          title="Configuration"
          optionGroups={optionGroups}
          onChange={handleConfigChange}
        />

        {result?.testResults?.summary && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Test Summary</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className={`font-medium ${
                  result.testResults.summary.successRate >= 95 ? 'text-green-600' :
                  result.testResults.summary.successRate >= 80 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.testResults.summary.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Scenarios:</span>
                <span className="font-medium">{result.testResults.summary.totalScenarios}</span>
              </div>
              <div className="flex justify-between">
                <span>Passed/Failed:</span>
                <span className="font-medium">
                  {result.testResults.summary.passedScenarios}/{result.testResults.summary.failedScenarios}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Response Time:</span>
                <span className={`font-medium ${
                  result.testResults.summary.averageResponseTime <= 500 ? 'text-green-600' :
                  result.testResults.summary.averageResponseTime <= 1000 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.testResults.summary.averageResponseTime}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {result?.testResults?.performance && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">Performance Metrics</h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex justify-between">
                <span>Throughput:</span>
                <span className="font-medium">{result.testResults.performance.throughput} req/s</span>
              </div>
              <div className="flex justify-between">
                <span>95th Percentile:</span>
                <span className="font-medium">{result.testResults.performance.p95ResponseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span className="font-medium">{result.testResults.performance.errorRate}%</span>
              </div>
            </div>
          </div>
        )}

        {result?.testResults?.recommendations && result.testResults.recommendations.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              💡 Recommendations
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              {result.testResults.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}