import React, { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processNetworkMonitoring } from '../../../tools/network/network-monitoring-tool';
import type { NetworkMonitoringConfig, ToolResult } from '../../../tools/network/network-monitoring-tool';

const DEFAULT_CONFIG: NetworkMonitoringConfig = {
  monitorType: 'ping',
  target: '',
  interval: 1,
  timeout: 5000,
  attempts: 10,
  detailed: true,
  includeTimestamps: true,
  showLatency: true,
  showJitter: true,
  showPacketLoss: true,
  portRange: '1-1000',
  protocol: 'tcp',
  recordHistory: true,
  alertThresholds: {
    latency: 100,
    packetLoss: 5,
    downtime: 10
  },
  outputFormat: 'text'
};

const SAMPLE_TARGETS = {
  ping: 'google.com',
  traceroute: 'cloudflare.com',
  port_scan: '192.168.1.1',
  dns_lookup: 'github.com',
  ssl_check: 'https://example.com',
  http_headers: 'https://httpbin.org/headers',
  speed_test: 'fast.com'
};

export function NetworkMonitoringTool() {
  const [input, setInput] = useState(SAMPLE_TARGETS.ping);
  const [config, setConfig] = useState<NetworkMonitoringConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const processedResult = useMemo(() => {
    if (!input.trim()) {
      return { success: false, error: 'Please enter a target hostname, IP address, or URL' };
    }

    return processNetworkMonitoring(input, config);
  }, [input, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(processedResult);
    }, 500);

    return () => clearTimeout(timer);
  }, [processedResult]);

  useEffect(() => {
    // Update input when monitor type changes
    setInput(SAMPLE_TARGETS[config.monitorType] || 'example.com');
  }, [config.monitorType]);

  const handleConfigChange = (key: keyof NetworkMonitoringConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    // In a real implementation, this would start/stop continuous monitoring
  };

  const getMonitorTypeDescription = (type: string) => {
    const descriptions = {
      ping: 'Test basic connectivity and measure latency',
      traceroute: 'Trace network path to destination',
      port_scan: 'Scan for open ports on target system',
      dns_lookup: 'Query DNS records for domain',
      ssl_check: 'Verify SSL certificate validity',
      http_headers: 'Analyze HTTP response headers',
      speed_test: 'Measure network speed and throughput'
    };
    return descriptions[type] || 'Network monitoring';
  };

  const optionGroups = [
    {
      title: 'Monitor Configuration',
      options: [
        {
          key: 'monitorType' as const,
          label: 'Monitor Type',
          type: 'select' as const,
          value: config.monitorType,
          options: [
            { value: 'ping', label: 'Ping Test' },
            { value: 'traceroute', label: 'Traceroute' },
            { value: 'port_scan', label: 'Port Scan' },
            { value: 'dns_lookup', label: 'DNS Lookup' },
            { value: 'ssl_check', label: 'SSL Check' },
            { value: 'http_headers', label: 'HTTP Headers' },
            { value: 'speed_test', label: 'Speed Test' }
          ]
        },
        {
          key: 'attempts' as const,
          label: 'Number of Attempts',
          type: 'number' as const,
          value: config.attempts,
          min: 1,
          max: 100
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
          key: 'interval' as const,
          label: 'Interval (seconds)',
          type: 'number' as const,
          value: config.interval,
          min: 1,
          max: 300
        }
      ]
    },
    {
      title: 'Display Options',
      options: [
        {
          key: 'detailed' as const,
          label: 'Detailed Output',
          type: 'checkbox' as const,
          value: config.detailed
        },
        {
          key: 'includeTimestamps' as const,
          label: 'Include Timestamps',
          type: 'checkbox' as const,
          value: config.includeTimestamps
        },
        {
          key: 'showLatency' as const,
          label: 'Show Latency',
          type: 'checkbox' as const,
          value: config.showLatency
        },
        {
          key: 'showJitter' as const,
          label: 'Show Jitter',
          type: 'checkbox' as const,
          value: config.showJitter
        },
        {
          key: 'showPacketLoss' as const,
          label: 'Show Packet Loss',
          type: 'checkbox' as const,
          value: config.showPacketLoss
        },
        {
          key: 'recordHistory' as const,
          label: 'Record History',
          type: 'checkbox' as const,
          value: config.recordHistory
        }
      ]
    },
    {
      title: 'Output Format',
      options: [
        {
          key: 'outputFormat' as const,
          label: 'Format',
          type: 'select' as const,
          value: config.outputFormat,
          options: [
            { value: 'text', label: 'Text Report' },
            { value: 'json', label: 'JSON' },
            { value: 'csv', label: 'CSV' },
            { value: 'graph', label: 'ASCII Graph' }
          ]
        }
      ]
    },
    {
      title: 'Alert Thresholds',
      options: [
        {
          key: 'alertThresholds.latency' as const,
          label: 'Latency Threshold (ms)',
          type: 'number' as const,
          value: config.alertThresholds.latency,
          min: 1,
          max: 1000
        },
        {
          key: 'alertThresholds.packetLoss' as const,
          label: 'Packet Loss Threshold (%)',
          type: 'number' as const,
          value: config.alertThresholds.packetLoss,
          min: 0,
          max: 100
        },
        {
          key: 'alertThresholds.downtime' as const,
          label: 'Downtime Threshold (s)',
          type: 'number' as const,
          value: config.alertThresholds.downtime,
          min: 1,
          max: 300
        }
      ]
    }
  ];

  // Add port-specific options for port scan
  if (config.monitorType === 'port_scan') {
    optionGroups[0].options.push({
      key: 'portRange' as const,
      label: 'Port Range',
      type: 'text' as const,
      value: config.portRange || '1-1000',
      placeholder: 'e.g., 80,443 or 1-1000'
    });
    optionGroups[0].options.push({
      key: 'protocol' as const,
      label: 'Protocol',
      type: 'select' as const,
      value: config.protocol || 'tcp',
      options: [
        { value: 'tcp', label: 'TCP' },
        { value: 'udp', label: 'UDP' }
      ]
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
    return `network-monitor-${config.monitorType}-${timestamp}.${extension}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <InputPanel
          title="Target"
          value={input}
          onChange={setInput}
          placeholder="Enter hostname, IP address, or URL"
          singleLine
        />
        
        <div >
          <div className="flex items-center justify-between">
            <div>
              <h3 >
                {config.monitorType.replace('_', ' ').toUpperCase()}
              </h3>
              <p >
                {getMonitorTypeDescription(config.monitorType)}
              </p>
            </div>
            <button
              onClick={handleStartMonitoring}
              className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                isMonitoring
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isMonitoring ? '⏹ Stop' : '▶ Start'}
            </button>
          </div>
          
          {isMonitoring && (
            <div >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Monitoring active (simulated)
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        <OutputPanel
          title="Monitoring Results"
          value={result?.output || ''}
          language={getOutputLanguage()}
          error={result?.error}
          showCopy
          showDownload
          filename={getFilename()}
        />
        
        {result?.warnings && result.warnings.length > 0 && (
          <div >
            <h4 >Warnings:</h4>
            <ul >
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {result?.monitoring?.alerts && result.monitoring.alerts.length > 0 && (
          <div >
            <h4 >
              🚨 Alerts ({result.monitoring.alerts.length})
            </h4>
            <div className="space-y-2">
              {result.monitoring.alerts.map((alert, index) => (
                <div key={index} >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{alert.type.replace('_', ' ').toUpperCase()}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      alert.severity === 'critical' ? 'bg-red-600 text-white' :
                      alert.severity === 'high' ? 'bg-orange-500 text-white' :
                      alert.severity === 'medium' ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1">{alert.message}</p>
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

        {result?.monitoring?.summary && (
          <div >
            <h3 >Performance Summary</h3>
            <div >
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className={`font-medium ${
                  result.monitoring.summary.successRate >= 95 ? 'text-green-600' :
                  result.monitoring.summary.successRate >= 85 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.monitoring.summary.successRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Latency:</span>
                <span className={`font-medium ${
                  result.monitoring.summary.averageLatency <= 50 ? 'text-green-600' :
                  result.monitoring.summary.averageLatency <= 100 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.monitoring.summary.averageLatency}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Jitter:</span>
                <span className="font-medium">{result.monitoring.summary.jitter}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Packet Loss:</span>
                <span className={`font-medium ${
                  result.monitoring.summary.packetLoss === 0 ? 'text-green-600' :
                  result.monitoring.summary.packetLoss <= 5 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {result.monitoring.summary.packetLoss}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="font-medium text-green-600">
                  {result.monitoring.summary.uptime.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {result?.monitoring?.recommendations && result.monitoring.recommendations.length > 0 && (
          <div >
            <h4 >
              💡 Recommendations
            </h4>
            <ul >
              {result.monitoring.recommendations.map((rec, index) => (
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