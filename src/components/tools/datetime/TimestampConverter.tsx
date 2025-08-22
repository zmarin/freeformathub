import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processTimestampConverter, type TimestampConverterConfig } from '../../../tools/datetime/timestamp-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface TimestampConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: TimestampConverterConfig = {
  inputFormat: 'auto',
  outputFormat: 'all',
  timezone: 'local',
  customTimezone: 'UTC',
  customInputFormat: '',
  customOutputFormat: 'YYYY-MM-DD HH:mm:ss',
  showRelativeTime: true,
  batchConversion: false,
};

const OPTIONS = [
  {
    key: 'inputFormat',
    label: 'Input Format',
    type: 'select' as const,
    default: 'auto',
    options: [
      { value: 'auto', label: 'Auto-detect' },
      { value: 'unix-seconds', label: 'Unix Seconds' },
      { value: 'unix-milliseconds', label: 'Unix Milliseconds' },
      { value: 'iso', label: 'ISO Format' },
      { value: 'custom', label: 'Custom Format' },
    ],
    description: 'Format of the input timestamp',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'all',
    options: [
      { value: 'all', label: 'Show All Formats' },
      { value: 'unix-seconds', label: 'Unix Seconds' },
      { value: 'unix-milliseconds', label: 'Unix Milliseconds' },
      { value: 'iso', label: 'ISO Format' },
      { value: 'readable', label: 'Human Readable' },
      { value: 'custom', label: 'Custom Format' },
    ],
    description: 'Desired output format',
  },
  {
    key: 'timezone',
    label: 'Timezone',
    type: 'select' as const,
    default: 'local',
    options: [
      { value: 'local', label: 'Local Time' },
      { value: 'utc', label: 'UTC' },
      { value: 'custom', label: 'Custom Timezone' },
    ],
    description: 'Timezone for output timestamps',
  },
  {
    key: 'customTimezone',
    label: 'Custom Timezone',
    type: 'select' as const,
    default: 'UTC',
    options: [
      { value: 'UTC', label: 'UTC' },
      { value: 'EST', label: 'EST (UTC-5)' },
      { value: 'CST', label: 'CST (UTC-6)' },
      { value: 'MST', label: 'MST (UTC-7)' },
      { value: 'PST', label: 'PST (UTC-8)' },
      { value: 'EDT', label: 'EDT (UTC-4)' },
      { value: 'CDT', label: 'CDT (UTC-5)' },
      { value: 'MDT', label: 'MDT (UTC-6)' },
      { value: 'PDT', label: 'PDT (UTC-7)' },
      { value: 'GMT', label: 'GMT' },
      { value: 'CET', label: 'CET (UTC+1)' },
      { value: 'JST', label: 'JST (UTC+9)' },
      { value: 'IST', label: 'IST (UTC+5:30)' },
      { value: 'AEST', label: 'AEST (UTC+10)' },
    ],
    description: 'Specific timezone when using custom timezone',
  },
  {
    key: 'showRelativeTime',
    label: 'Show Relative Time',
    type: 'boolean' as const,
    default: true,
    description: 'Display time relative to now (e.g., "2 hours ago")',
  },
  {
    key: 'batchConversion',
    label: 'Batch Conversion',
    type: 'boolean' as const,
    default: false,
    description: 'Process multiple timestamps (one per line)',
  },
  {
    key: 'customOutputFormat',
    label: 'Custom Format Pattern',
    type: 'text' as const,
    default: 'YYYY-MM-DD HH:mm:ss',
    description: 'Custom date format pattern (YYYY-MM-DD HH:mm:ss)',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Current Unix Timestamp',
    input: Math.floor(Date.now() / 1000).toString(),
    config: { ...DEFAULT_CONFIG, inputFormat: 'unix-seconds', outputFormat: 'all' }
  },
  {
    name: 'ISO Date String',
    input: new Date().toISOString(),
    config: { ...DEFAULT_CONFIG, inputFormat: 'iso', outputFormat: 'unix-seconds' }
  },
  {
    name: 'Millisecond Timestamp',
    input: Date.now().toString(),
    config: { ...DEFAULT_CONFIG, inputFormat: 'unix-milliseconds', outputFormat: 'readable' }
  },
  {
    name: 'Batch Processing',
    input: `1672531200
${Math.floor(Date.now() / 1000)}
${new Date('2024-06-15').getTime() / 1000}`,
    config: { ...DEFAULT_CONFIG, batchConversion: true, outputFormat: 'iso' }
  },
];

export function TimestampConverter({ className = '' }: TimestampConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<TimestampConverterConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    inputCount: number;
    successCount: number;
    errorCount: number;
    timezone: string;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: TimestampConverterConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processTimestampConverter(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'timestamp-converter',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
            setStats(null);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to convert timestamp');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 200);
    }, 400),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: TimestampConverterConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig(example.config);
  };

  const insertCurrentTimestamp = () => {
    const now = Math.floor(Date.now() / 1000);
    setInput(now.toString());
  };

  const insertCurrentISO = () => {
    const now = new Date().toISOString();
    setInput(now);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={`Timestamp Input ${config.batchConversion ? '(One per line)' : ''}`}
          placeholder={config.batchConversion ? 
            `Enter timestamps, one per line:

1672531200
2023-01-01T00:00:00Z
1687693800000
2023-12-25T18:00:00.000Z` :
            `Enter a timestamp to convert:

Examples:
1672531200 (Unix seconds)
1672531200000 (Unix milliseconds)
2023-01-01T00:00:00Z (ISO format)
2023-01-01 12:30:00 (Readable format)`}
          syntax="text"
          examples={[
            {
              title: 'Unix Timestamp (Seconds)',
              value: '1672531200',
            },
            {
              title: 'Unix Timestamp (Milliseconds)',
              value: '1672531200000',
            },
            {
              title: 'ISO Format',
              value: '2023-01-01T00:00:00.000Z',
            },
          ]}
        />

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={insertCurrentTimestamp}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Current Unix Time
            </button>
            <button
              onClick={insertCurrentISO}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Current ISO Time
            </button>
          </div>

          {/* Format Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Settings:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Input: {config.inputFormat === 'auto' ? 'Auto-detect' : config.inputFormat}</div>
              <div>Output: {config.outputFormat === 'all' ? 'Show all formats' : config.outputFormat}</div>
              <div>Timezone: {config.timezone === 'custom' ? config.customTimezone : config.timezone}</div>
              {config.batchConversion && <div>Mode: Batch processing enabled</div>}
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Examples:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  onClick={() => insertExample(example)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {example.input.length > 50 ? 
                      example.input.substring(0, 50) + '...' : 
                      example.input
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conversion Results:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Processed:</span>
                    <span className="font-mono">{stats.inputCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Successful:</span>
                    <span className="font-mono">{stats.successCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Errors:</span>
                    <span className="font-mono">{stats.errorCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Timezone:</span>
                    <span className="font-mono">{stats.timezone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Output Panel */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label="Converted Timestamps"
        syntax="text"
        downloadFilename="timestamps.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}