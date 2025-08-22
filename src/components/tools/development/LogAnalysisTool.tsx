import React, { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processLogAnalysis } from '../../../tools/development/log-analysis-tool';
import type { LogAnalysisConfig, ToolResult } from '../../../tools/development/log-analysis-tool';

const DEFAULT_CONFIG: LogAnalysisConfig = {
  logFormat: 'apache',
  customFormat: '',
  analysisType: 'overview',
  timeRange: {
    last: '24h'
  },
  filters: {
    statusCodes: [],
    ipAddresses: [],
    userAgents: [],
    methods: [],
    paths: [],
    excludePatterns: []
  },
  groupBy: 'hour',
  outputFormat: 'summary',
  includeMetrics: {
    requestCount: true,
    uniqueVisitors: true,
    responseTime: true,
    bandwidth: true,
    errorRate: true,
    topPages: true,
    topIPs: true,
    topUserAgents: true
  },
  alertThresholds: {
    errorRate: 5,
    responseTime: 1000,
    requestsPerSecond: 100
  }
};

const SAMPLE_APACHE_LOGS = `192.168.1.100 - - [25/Dec/2023:10:00:01 +0000] "GET /api/users HTTP/1.1" 200 1234 "https://example.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
192.168.1.101 - - [25/Dec/2023:10:00:02 +0000] "POST /login HTTP/1.1" 401 512 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
192.168.1.102 - - [25/Dec/2023:10:00:03 +0000] "GET /dashboard HTTP/1.1" 200 5678 "https://example.com/login" "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)"
192.168.1.103 - - [25/Dec/2023:10:00:04 +0000] "GET /admin/login.php HTTP/1.1" 404 512 "-" "sqlmap/1.0"
192.168.1.104 - - [25/Dec/2023:10:00:05 +0000] "GET /api/orders HTTP/1.1" 500 256 "https://example.com/dashboard" "Mozilla/5.0 (X11; Linux x86_64)"
192.168.1.105 - - [25/Dec/2023:10:00:06 +0000] "GET /wp-admin/ HTTP/1.1" 404 512 "-" "Nikto/2.1.6"
192.168.1.106 - - [25/Dec/2023:10:00:07 +0000] "GET /api/products HTTP/1.1" 200 3456 "https://example.com" "Googlebot/2.1"
192.168.1.107 - - [25/Dec/2023:10:00:08 +0000] "POST /api/checkout HTTP/1.1" 200 1024 "https://example.com/cart" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
192.168.1.108 - - [25/Dec/2023:10:00:09 +0000] "GET /api/users/../../../etc/passwd HTTP/1.1" 403 0 "-" "curl/7.68.0"
192.168.1.109 - - [25/Dec/2023:10:00:10 +0000] "GET /api/users HTTP/1.1" 200 2048 "https://google.com" "Mozilla/5.0 (Edge)"`;

const SAMPLE_JSON_LOGS = `{"timestamp":"2023-12-25T10:00:01Z","ip":"192.168.1.100","method":"GET","path":"/api/users","status":200,"response_time":150,"size":1234,"user_agent":"Mozilla/5.0","referer":"https://example.com"}
{"timestamp":"2023-12-25T10:00:02Z","ip":"192.168.1.101","method":"POST","path":"/login","status":401,"response_time":50,"size":512,"user_agent":"Mozilla/5.0","referer":"-"}
{"timestamp":"2023-12-25T10:00:03Z","ip":"192.168.1.102","method":"GET","path":"/dashboard","status":200,"response_time":300,"size":5678,"user_agent":"Mozilla/5.0","referer":"https://example.com/login"}
{"timestamp":"2023-12-25T10:00:04Z","ip":"192.168.1.103","method":"GET","path":"/admin/login.php","status":404,"response_time":25,"size":512,"user_agent":"sqlmap/1.0","referer":"-"}
{"timestamp":"2023-12-25T10:00:05Z","ip":"192.168.1.104","method":"GET","path":"/api/orders","status":500,"response_time":2500,"size":256,"user_agent":"Mozilla/5.0","referer":"https://example.com/dashboard"}`;

const SAMPLE_NGINX_ERROR = `2023/12/25 10:00:01 [error] 1234#0: *567 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.100, server: example.com, request: "GET /api/users HTTP/1.1"
2023/12/25 10:00:02 [warn] 1234#0: *568 upstream server temporarily disabled while connecting to upstream, client: 192.168.1.101
2023/12/25 10:00:03 [error] 1234#0: *569 FastCGI sent in stderr: "PHP message: PHP Fatal error: Uncaught Error: Call to undefined function" while reading response header from upstream
2023/12/25 10:00:04 [alert] 1234#0: *570 client 192.168.1.102 sent invalid request: "GET /../../../etc/passwd HTTP/1.1"
2023/12/25 10:00:05 [error] 1234#0: *571 access forbidden by rule, client: 192.168.1.103, server: example.com, request: "POST /admin/ HTTP/1.1"`;

export function LogAnalysisTool() {
  const [input, setInput] = useState(SAMPLE_APACHE_LOGS);
  const [config, setConfig] = useState<LogAnalysisConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ToolResult | null>(null);

  const processedResult = useMemo(() => {
    if (!input.trim()) {
      return { success: false, error: 'Please provide log data to analyze' };
    }

    return processLogAnalysis(input, config);
  }, [input, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(processedResult);
    }, 500);

    return () => clearTimeout(timer);
  }, [processedResult]);

  const handleConfigChange = (key: keyof LogAnalysisConfig, value: any) => {
    // Handle nested objects
    if (key.startsWith('timeRange.')) {
      const timeKey = key.replace('timeRange.', '');
      setConfig(prev => ({
        ...prev,
        timeRange: {
          ...prev.timeRange,
          [timeKey]: value
        }
      }));
    } else if (key.startsWith('filters.')) {
      const filterKey = key.replace('filters.', '');
      setConfig(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          [filterKey]: value
        }
      }));
    } else if (key.startsWith('includeMetrics.')) {
      const metricKey = key.replace('includeMetrics.', '');
      setConfig(prev => ({
        ...prev,
        includeMetrics: {
          ...prev.includeMetrics,
          [metricKey]: value
        }
      }));
    } else if (key.startsWith('alertThresholds.')) {
      const thresholdKey = key.replace('alertThresholds.', '');
      setConfig(prev => ({
        ...prev,
        alertThresholds: {
          ...prev.alertThresholds,
          [thresholdKey]: value
        }
      }));
    } else {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleLoadSampleLogs = (type: 'apache' | 'json' | 'nginx') => {
    switch (type) {
      case 'apache':
        setInput(SAMPLE_APACHE_LOGS);
        setConfig(prev => ({ ...prev, logFormat: 'apache' }));
        break;
      case 'json':
        setInput(SAMPLE_JSON_LOGS);
        setConfig(prev => ({ ...prev, logFormat: 'json' }));
        break;
      case 'nginx':
        setInput(SAMPLE_NGINX_ERROR);
        setConfig(prev => ({ ...prev, logFormat: 'nginx' }));
        break;
    }
  };

  const getLogFormatDescription = (format: string) => {
    const descriptions = {
      apache: 'Apache Common/Combined log format',
      nginx: 'Nginx access/error log format',
      combined: 'Combined Log Format (CLF)',
      common: 'Common Log Format',
      json: 'JSON structured logs',
      custom: 'Custom log format',
      syslog: 'Syslog format',
      iis: 'IIS log format',
      cloudflare: 'CloudFlare log format'
    };
    return descriptions[format] || 'Unknown format';
  };

  const optionGroups = [
    {
      title: 'Log Format & Analysis',
      options: [
        {
          key: 'logFormat' as const,
          label: 'Log Format',
          type: 'select' as const,
          value: config.logFormat,
          options: [
            { value: 'apache', label: 'Apache (Common/Combined)' },
            { value: 'nginx', label: 'Nginx' },
            { value: 'combined', label: 'Combined Log Format' },
            { value: 'common', label: 'Common Log Format' },
            { value: 'json', label: 'JSON Structured' },
            { value: 'syslog', label: 'Syslog' },
            { value: 'iis', label: 'IIS' },
            { value: 'cloudflare', label: 'CloudFlare' },
            { value: 'custom', label: 'Custom Format' }
          ]
        },
        {
          key: 'analysisType' as const,
          label: 'Analysis Type',
          type: 'select' as const,
          value: config.analysisType,
          options: [
            { value: 'overview', label: 'Overview Analysis' },
            { value: 'errors', label: 'Error Analysis' },
            { value: 'performance', label: 'Performance Analysis' },
            { value: 'security', label: 'Security Analysis' },
            { value: 'traffic', label: 'Traffic Analysis' },
            { value: 'custom', label: 'Custom Analysis' }
          ]
        },
        {
          key: 'outputFormat' as const,
          label: 'Output Format',
          type: 'select' as const,
          value: config.outputFormat,
          options: [
            { value: 'summary', label: 'Summary Report' },
            { value: 'detailed', label: 'Detailed Report' },
            { value: 'csv', label: 'CSV Export' },
            { value: 'json', label: 'JSON Export' },
            { value: 'chart', label: 'Chart Data' }
          ]
        }
      ]
    },
    {
      title: 'Time Range & Grouping',
      options: [
        {
          key: 'timeRange.last' as const,
          label: 'Time Range',
          type: 'select' as const,
          value: config.timeRange.last,
          options: [
            { value: '1h', label: 'Last Hour' },
            { value: '6h', label: 'Last 6 Hours' },
            { value: '24h', label: 'Last 24 Hours' },
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: 'all', label: 'All Time' }
          ]
        },
        {
          key: 'groupBy' as const,
          label: 'Group By',
          type: 'select' as const,
          value: config.groupBy,
          options: [
            { value: 'hour', label: 'Hour' },
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'status', label: 'Status Code' },
            { value: 'ip', label: 'IP Address' },
            { value: 'path', label: 'Request Path' },
            { value: 'method', label: 'HTTP Method' }
          ]
        }
      ]
    },
    {
      title: 'Metrics to Include',
      options: [
        {
          key: 'includeMetrics.requestCount' as const,
          label: 'Request Count',
          type: 'checkbox' as const,
          value: config.includeMetrics.requestCount
        },
        {
          key: 'includeMetrics.uniqueVisitors' as const,
          label: 'Unique Visitors',
          type: 'checkbox' as const,
          value: config.includeMetrics.uniqueVisitors
        },
        {
          key: 'includeMetrics.responseTime' as const,
          label: 'Response Time',
          type: 'checkbox' as const,
          value: config.includeMetrics.responseTime
        },
        {
          key: 'includeMetrics.bandwidth' as const,
          label: 'Bandwidth Usage',
          type: 'checkbox' as const,
          value: config.includeMetrics.bandwidth
        },
        {
          key: 'includeMetrics.errorRate' as const,
          label: 'Error Rate',
          type: 'checkbox' as const,
          value: config.includeMetrics.errorRate
        },
        {
          key: 'includeMetrics.topPages' as const,
          label: 'Top Pages',
          type: 'checkbox' as const,
          value: config.includeMetrics.topPages
        },
        {
          key: 'includeMetrics.topIPs' as const,
          label: 'Top IP Addresses',
          type: 'checkbox' as const,
          value: config.includeMetrics.topIPs
        },
        {
          key: 'includeMetrics.topUserAgents' as const,
          label: 'Top User Agents',
          type: 'checkbox' as const,
          value: config.includeMetrics.topUserAgents
        }
      ]
    },
    {
      title: 'Alert Thresholds',
      options: [
        {
          key: 'alertThresholds.errorRate' as const,
          label: 'Error Rate Threshold (%)',
          type: 'number' as const,
          value: config.alertThresholds.errorRate,
          min: 0,
          max: 100,
          step: 0.1
        },
        {
          key: 'alertThresholds.responseTime' as const,
          label: 'Response Time Threshold (ms)',
          type: 'number' as const,
          value: config.alertThresholds.responseTime,
          min: 100,
          max: 10000,
          step: 100
        },
        {
          key: 'alertThresholds.requestsPerSecond' as const,
          label: 'Requests/Second Threshold',
          type: 'number' as const,
          value: config.alertThresholds.requestsPerSecond,
          min: 1,
          max: 1000,
          step: 10
        }
      ]
    }
  ];

  // Add custom format field if custom is selected
  if (config.logFormat === 'custom') {
    optionGroups[0].options.push({
      key: 'customFormat' as const,
      label: 'Custom Format Pattern',
      type: 'text' as const,
      value: config.customFormat,
      placeholder: 'e.g., %h %l %u %t "%r" %>s %O "%{Referer}i" "%{User-Agent}i"'
    });
  }

  const getOutputLanguage = () => {
    switch (config.outputFormat) {
      case 'json': return 'json';
      case 'csv': return 'csv';
      default: return 'text';
    }
  };

  const getFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = config.outputFormat === 'json' ? 'json' : 
                     config.outputFormat === 'csv' ? 'csv' : 'txt';
    return `log-analysis-${config.analysisType}-${timestamp}.${extension}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="space-y-4">
          <InputPanel
            title="Log Data"
            value={input}
            onChange={setInput}
            placeholder="Paste your log data here..."
            language={config.logFormat === 'json' ? 'json' : 'text'}
            showLineNumbers
          />
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleLoadSampleLogs('apache')}
              className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apache Sample
            </button>
            <button
              onClick={() => handleLoadSampleLogs('json')}
              className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              JSON Sample
            </button>
            <button
              onClick={() => handleLoadSampleLogs('nginx')}
              className="px-3 py-2 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Nginx Sample
            </button>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Format Info</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {getLogFormatDescription(config.logFormat)}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <OutputPanel
          title="Analysis Results"
          value={result?.output || ''}
          language={getOutputLanguage()}
          error={result?.error}
          showCopy
          showDownload
          filename={getFilename()}
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

        {result?.analysis?.alerts && result.analysis.alerts.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              🚨 Alerts ({result.analysis.alerts.length})
            </h4>
            <div className="space-y-2">
              {result.analysis.alerts.map((alert, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-700 dark:text-red-300">{alert.type.replace('_', ' ').toUpperCase()}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      alert.severity === 'critical' ? 'bg-red-600 text-white' :
                      alert.severity === 'high' ? 'bg-orange-500 text-white' :
                      alert.severity === 'medium' ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-red-600 dark:text-red-400">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <OptionsPanel
          title="Analysis Configuration"
          optionGroups={optionGroups}
          onChange={handleConfigChange}
        />

        {result?.analysis?.summary && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Quick Summary</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Total Requests:</span>
                <span className="font-medium">{result.analysis.summary.totalRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className={`font-medium ${
                  result.analysis.summary.successRate >= 95 ? 'text-green-600' :
                  result.analysis.summary.successRate >= 85 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.analysis.summary.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span className={`font-medium ${
                  result.analysis.summary.errorRate <= 1 ? 'text-green-600' :
                  result.analysis.summary.errorRate <= 5 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.analysis.summary.errorRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Response Time:</span>
                <span className={`font-medium ${
                  result.analysis.summary.averageResponseTime <= 200 ? 'text-green-600' :
                  result.analysis.summary.averageResponseTime <= 500 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.analysis.summary.averageResponseTime}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unique Visitors:</span>
                <span className="font-medium">{result.analysis.summary.uniqueVisitors.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Bandwidth:</span>
                <span className="font-medium">{(result.analysis.summary.totalBandwidth / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        )}

        {result?.analysis?.security && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-3">Security Analysis</h3>
            <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
              <div className="flex justify-between">
                <span>Threat Level:</span>
                <span className={`font-medium px-2 py-1 text-xs rounded ${
                  result.analysis.security.threatLevel === 'critical' ? 'bg-red-600 text-white' :
                  result.analysis.security.threatLevel === 'high' ? 'bg-orange-500 text-white' :
                  result.analysis.security.threatLevel === 'medium' ? 'bg-yellow-500 text-black' :
                  'bg-green-500 text-white'
                }`}>
                  {result.analysis.security.threatLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Attack Attempts:</span>
                <span className="font-medium">{result.analysis.security.attackAttempts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Suspicious IPs:</span>
                <span className="font-medium">{result.analysis.security.suspiciousIPs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>SQL Injection:</span>
                <span className="font-medium">{result.analysis.security.sqlInjectionAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span>XSS Attempts:</span>
                <span className="font-medium">{result.analysis.security.xssAttempts}</span>
              </div>
            </div>
          </div>
        )}

        {result?.analysis?.recommendations && result.analysis.recommendations.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              💡 Recommendations
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              {result.analysis.recommendations.slice(0, 4).map((rec, index) => (
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