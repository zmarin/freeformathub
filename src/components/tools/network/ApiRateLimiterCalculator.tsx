import React, { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { useToolStore } from '../../../lib/store/toolStore';
import type { ApiRateLimiterConfig, RateLimitResult } from '../../../tools/network/api-rate-limiter-calculator';
import { processApiRateLimiter } from '../../../tools/network/api-rate-limiter-calculator';

export function ApiRateLimiterCalculator() {
  const [input, setInput] = useState('Configure rate limiting for REST API: 100 requests per minute with token bucket algorithm');
  const [result, setResult] = useState<RateLimitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { getConfig, updateConfig } = useToolStore();
  const config = getConfig('api-rate-limiter-calculator') as ApiRateLimiterConfig;

  const options = [
    {
      key: 'rateLimitType',
      label: 'Rate Limit Type',
      type: 'select' as const,
      default: 'requests_per_second',
      options: [
        { value: 'requests_per_second', label: 'Requests per Second' },
        { value: 'requests_per_minute', label: 'Requests per Minute' },
        { value: 'requests_per_hour', label: 'Requests per Hour' },
        { value: 'requests_per_day', label: 'Requests per Day' }
      ],
      description: 'Time unit for rate limiting'
    },
    {
      key: 'maxRequests',
      label: 'Maximum Requests',
      type: 'number' as const,
      default: 100,
      min: 1,
      max: 100000,
      description: 'Maximum number of requests allowed per time window'
    },
    {
      key: 'timeWindow',
      label: 'Time Window',
      type: 'number' as const,
      default: 1,
      min: 1,
      max: 3600,
      description: 'Duration of the time window in selected units'
    },
    {
      key: 'burstCapacity',
      label: 'Burst Capacity',
      type: 'number' as const,
      default: 20,
      min: 0,
      max: 10000,
      description: 'Additional requests allowed in short bursts'
    },
    {
      key: 'algorithm',
      label: 'Rate Limiting Algorithm',
      type: 'select' as const,
      default: 'token_bucket',
      options: [
        { value: 'token_bucket', label: 'Token Bucket' },
        { value: 'leaky_bucket', label: 'Leaky Bucket' },
        { value: 'fixed_window', label: 'Fixed Window' },
        { value: 'sliding_window', label: 'Sliding Window' },
        { value: 'sliding_log', label: 'Sliding Log' }
      ],
      description: 'Rate limiting algorithm to use'
    },
    {
      key: 'distributedMode',
      label: 'Distributed Mode',
      type: 'boolean' as const,
      default: false,
      description: 'Generate distributed rate limiter with Redis'
    },
    {
      key: 'backoffStrategy',
      label: 'Backoff Strategy',
      type: 'select' as const,
      default: 'exponential',
      options: [
        { value: 'exponential', label: 'Exponential Backoff' },
        { value: 'linear', label: 'Linear Backoff' },
        { value: 'fixed', label: 'Fixed Delay' },
        { value: 'fibonacci', label: 'Fibonacci Backoff' }
      ],
      description: 'Client backoff strategy when rate limited'
    },
    {
      key: 'initialDelay',
      label: 'Initial Delay (ms)',
      type: 'number' as const,
      default: 1000,
      min: 100,
      max: 60000,
      description: 'Initial delay for backoff strategy'
    },
    {
      key: 'maxDelay',
      label: 'Maximum Delay (ms)',
      type: 'number' as const,
      default: 30000,
      min: 1000,
      max: 300000,
      description: 'Maximum delay for backoff strategy'
    },
    {
      key: 'jitterEnabled',
      label: 'Enable Jitter',
      type: 'boolean' as const,
      default: true,
      description: 'Add randomness to backoff delays'
    },
    {
      key: 'gracePeriod',
      label: 'Grace Period (seconds)',
      type: 'number' as const,
      default: 5,
      min: 0,
      max: 3600,
      description: 'Grace period before enforcing rate limits'
    },
    {
      key: 'quotaReset',
      label: 'Quota Reset Strategy',
      type: 'select' as const,
      default: 'rolling',
      options: [
        { value: 'rolling', label: 'Rolling Window' },
        { value: 'fixed_interval', label: 'Fixed Interval' }
      ],
      description: 'How rate limit quotas reset'
    },
    {
      key: 'includeHeaders',
      label: 'Include Rate Limit Headers',
      type: 'boolean' as const,
      default: true,
      description: 'Generate standard rate limit HTTP headers'
    },
    {
      key: 'format',
      label: 'Output Format',
      type: 'select' as const,
      default: 'implementation',
      options: [
        { value: 'implementation', label: 'Implementation Code' },
        { value: 'config', label: 'Configuration Only' },
        { value: 'nginx', label: 'Nginx Config' },
        { value: 'cloudflare', label: 'Cloudflare Workers' },
        { value: 'aws', label: 'AWS Lambda' },
        { value: 'redis_lua', label: 'Redis Lua Script' }
      ],
      description: 'Primary output format'
    }
  ];

  const processInput = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsProcessing(true);
        setError(null);

        try {
          const processResult = processApiRateLimiter(config);
          
          if (processResult.success) {
            setResult(processResult.data!);
            setError(null);
          } else {
            setError(processResult.error || 'Failed to generate rate limiter configuration');
            setResult(null);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
          setResult(null);
        } finally {
          setIsProcessing(false);
        }
      }, 300);
    };
  }, [config]);

  useEffect(() => {
    processInput();
  }, [processInput]);

  const outputContent = useMemo(() => {
    if (error) {
      return `Error: ${error}`;
    }

    if (!result) {
      return 'Configure your rate limiting settings...';
    }

    switch (config.format) {
      case 'config':
        return JSON.stringify(result.configuration, null, 2);
      
      case 'nginx':
        return result.nginx_config || 'Nginx configuration not available';
      
      case 'cloudflare':
        return result.cloudflare_config || 'Cloudflare configuration not available';
      
      case 'aws':
        return result.aws_config || 'AWS configuration not available';
      
      case 'redis_lua':
        return result.redis_script || 'Redis script not available';
      
      case 'implementation':
      default:
        const sections = [
          '# Rate Limiter Implementation',
          '',
          '## Configuration',
          '```json',
          JSON.stringify(result.configuration, null, 2),
          '```',
          '',
          '## Implementation',
          '```javascript',
          result.implementation,
          '```'
        ];

        if (result.headers && Object.keys(result.headers).length > 0) {
          sections.push(
            '',
            '## HTTP Headers',
            '```json',
            JSON.stringify(result.headers, null, 2),
            '```'
          );
        }

        if (result.redis_script) {
          sections.push(
            '',
            '## Redis Lua Script',
            '```lua',
            result.redis_script,
            '```'
          );
        }

        if (result.documentation) {
          sections.push(
            '',
            '## Documentation',
            '```markdown',
            result.documentation,
            '```'
          );
        }

        if (result.monitoring) {
          sections.push(
            '',
            '## Monitoring',
            '```markdown',
            result.monitoring,
            '```'
          );
        }

        if (result.testing_scenarios && result.testing_scenarios.length > 0) {
          sections.push(
            '',
            '## Testing Scenarios',
            '```json',
            JSON.stringify(result.testing_scenarios, null, 2),
            '```'
          );
        }

        return sections.join('\n');
    }
  }, [result, error, config.format]);

  const downloadOptions = useMemo(() => {
    if (!result) return [];

    const options = [
      {
        label: 'Download Implementation (.js)',
        onClick: () => {
          const blob = new Blob([result.implementation], { type: 'text/javascript' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rate-limiter-${result.algorithm}.js`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      {
        label: 'Download Configuration (.json)',
        onClick: () => {
          const blob = new Blob([JSON.stringify(result.configuration, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rate-limiter-config.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    ];

    if (result.redis_script) {
      options.push({
        label: 'Download Redis Script (.lua)',
        onClick: () => {
          const blob = new Blob([result.redis_script!], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rate-limiter.lua`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }

    if (result.nginx_config) {
      options.push({
        label: 'Download Nginx Config (.conf)',
        onClick: () => {
          const blob = new Blob([result.nginx_config!], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nginx-rate-limit.conf`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }

    if (result.documentation) {
      options.push({
        label: 'Download Documentation (.md)',
        onClick: () => {
          const blob = new Blob([result.documentation], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rate-limiter-docs.md`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }

    return options;
  }, [result]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 >
          API Rate Limiter Calculator
        </h1>
        <p >
          Generate comprehensive rate limiting configurations, implementations, and monitoring 
          for APIs with multiple algorithms and deployment targets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InputPanel
            input={input}
            onInputChange={setInput}
            placeholder="Describe your rate limiting requirements..."
            language="text"
            maxLength={500}
          />
          
          <OptionsPanel
            options={options}
            config={config}
            onChange={(newConfig) => updateConfig('api-rate-limiter-calculator', newConfig)}
          />
        </div>

        <div>
          <OutputPanel
            output={outputContent}
            language={config.format === 'config' ? 'json' : 
                     config.format === 'nginx' ? 'nginx' :
                     config.format === 'redis_lua' ? 'lua' :
                     config.format === 'cloudflare' ? 'javascript' :
                     config.format === 'aws' ? 'python' : 'markdown'}
            isLoading={isProcessing}
            downloadOptions={downloadOptions}
          />
        </div>
      </div>

      {result && (
        <div >
          <h3 >
            Rate Limiting Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div >
              <div >Algorithm</div>
              <div >
                {result.algorithm.replace('_', ' ')}
              </div>
            </div>
            <div >
              <div >Rate Limit</div>
              <div >
                {result.configuration.max_requests}/{config.rateLimitType?.replace('requests_per_', '') || 'second'}
              </div>
            </div>
            <div >
              <div >Burst Capacity</div>
              <div >
                {result.configuration.burst_capacity}
              </div>
            </div>
            <div >
              <div >Mode</div>
              <div >
                {result.configuration.distributed_mode ? 'Distributed' : 'Single Node'}
              </div>
            </div>
          </div>

          {result.testing_scenarios && result.testing_scenarios.length > 0 && (
            <div className="mt-6">
              <h4 >
                Testing Scenarios
              </h4>
              <div className="space-y-2">
                {result.testing_scenarios.slice(0, 4).map((scenario, index) => (
                  <div
                    key={index}
                    
                  >
                    <div>
                      <div >
                        {scenario.name}
                      </div>
                      <div >
                        {scenario.description}
                      </div>
                    </div>
                    <div >
                      {scenario.requests} requests
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}