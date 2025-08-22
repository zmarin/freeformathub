import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processTimestampFormatter, type TimestampFormatterConfig, TIMESTAMP_FORMATS, COMMON_TIMEZONES, LOCALES } from '../../../tools/datetime/timestamp-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface TimestampFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: TimestampFormatterConfig = {
  mode: 'format',
  inputFormat: 'auto',
  outputFormat: 'iso8601',
  inputTimezone: 'UTC',
  outputTimezone: 'UTC',
  customInputFormat: '',
  customOutputFormat: '',
  locale: 'en-US',
  includeMilliseconds: false,
  useUtc: true,
  showRelativeTime: false,
  batchProcessing: false,
};

const MODE_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'format',
    options: [
      { value: 'format', label: '🔄 Format - Convert timestamp formats' },
      { value: 'convert', label: '🌍 Convert - Change timezones' },
      { value: 'calculate', label: '🧮 Calculate - Time calculations' },
    ],
    description: 'Operation mode for timestamp processing',
  },
] as const;

const INPUT_OPTIONS = [
  {
    key: 'inputFormat',
    label: 'Input Format',
    type: 'select' as const,
    default: 'auto',
    options: [
      { value: 'auto', label: '🔍 Auto-detect format' },
      { value: 'unix', label: '📅 Unix timestamp (seconds)' },
      { value: 'unix-ms', label: '⏱️ Unix timestamp (milliseconds)' },
      { value: 'iso8601', label: '📋 ISO 8601 (2023-11-29T12:36:07Z)' },
      { value: 'rfc2822', label: '📧 RFC 2822 (Wed, 29 Nov 2023)' },
      { value: 'custom', label: '⚙️ Custom format' },
    ],
    description: 'Format of the input timestamp',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'iso8601',
    options: [
      { value: 'unix', label: '📅 Unix timestamp (seconds)' },
      { value: 'unix-ms', label: '⏱️ Unix timestamp (milliseconds)' },
      { value: 'iso8601', label: '📋 ISO 8601' },
      { value: 'rfc2822', label: '📧 RFC 2822' },
      { value: 'relative', label: '⏰ Relative time (2 hours ago)' },
      { value: 'custom', label: '⚙️ Custom format' },
      { value: 'all', label: '📊 All formats' },
    ],
    description: 'Format for the output timestamp',
  },
] as const;

const TIMEZONE_OPTIONS = [
  {
    key: 'inputTimezone',
    label: 'Input Timezone',
    type: 'select' as const,
    default: 'UTC',
    options: COMMON_TIMEZONES.map(tz => ({
      value: tz.id,
      label: `${tz.name} (${tz.offset})`
    })),
    description: 'Timezone of the input timestamp',
  },
  {
    key: 'outputTimezone',
    label: 'Output Timezone',
    type: 'select' as const,
    default: 'UTC',
    options: [
      { value: 'local', label: 'Local timezone' },
      ...COMMON_TIMEZONES.map(tz => ({
        value: tz.id,
        label: `${tz.name} (${tz.offset})`
      }))
    ],
    description: 'Timezone for the output timestamp',
  },
] as const;

const FORMATTING_OPTIONS = [
  {
    key: 'locale',
    label: 'Locale',
    type: 'select' as const,
    default: 'en-US',
    options: LOCALES.map(locale => ({
      value: locale.id,
      label: locale.name
    })),
    description: 'Locale for date formatting',
  },
  {
    key: 'includeMilliseconds',
    label: 'Include Milliseconds',
    type: 'checkbox' as const,
    default: false,
    description: 'Show milliseconds in formatted output',
  },
  {
    key: 'useUtc',
    label: 'Use UTC',
    type: 'checkbox' as const,
    default: true,
    description: 'Display times in UTC when possible',
  },
  {
    key: 'showRelativeTime',
    label: 'Show Relative Time',
    type: 'checkbox' as const,
    default: false,
    description: 'Display relative time information',
  },
  {
    key: 'batchProcessing',
    label: 'Batch Processing',
    type: 'checkbox' as const,
    default: false,
    description: 'Process multiple timestamps (one per line)',
  },
] as const;

export function TimestampFormatter({ className = '' }: TimestampFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<TimestampFormatterConfig>(DEFAULT_CONFIG);

  // Update current time every second
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const timestamp = Math.floor(now.getTime() / 1000);
      const formatted = now.toISOString();
      setCurrentTime(`Unix: ${timestamp} | ISO: ${formatted}`);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: TimestampFormatterConfig) => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = processTimestampFormatter(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setInfo(result.info);
          
          // Add to history
          addToHistory({
            toolId: 'timestamp-formatter',
            input: currentInput || 'Current timestamp',
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process timestamp');
          setOutput('');
          setInfo(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while processing timestamp');
        setOutput('');
        setInfo(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('timestamp-formatter');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'current' | 'unix' | 'iso' | 'rfc' | 'batch') => {
    const examples = {
      current: { input: '', config: { outputFormat: 'all' as const } },
      unix: { input: '1701234567', config: { inputFormat: 'unix' as const, outputFormat: 'iso8601' as const } },
      iso: { input: '2023-11-29T12:36:07.890Z', config: { inputFormat: 'iso8601' as const, outputFormat: 'relative' as const } },
      rfc: { input: 'Wed, 29 Nov 2023 12:36:07 GMT', config: { inputFormat: 'rfc2822' as const, outputFormat: 'unix' as const } },
      batch: { 
        input: '1701234567\n2023-11-29T12:36:07Z\nWed, 29 Nov 2023 12:36:07 GMT', 
        config: { batchProcessing: true, outputFormat: 'iso8601' as const } 
      }
    };
    
    const example = examples[type];
    setInput(example.input);
    setConfig(prev => ({ ...prev, ...example.config }));
  };

  const handleInsertCurrentTimestamp = (format: 'unix' | 'unix-ms' | 'iso') => {
    const now = Date.now();
    const timestamps = {
      unix: Math.floor(now / 1000).toString(),
      'unix-ms': now.toString(),
      iso: new Date(now).toISOString()
    };
    
    setInput(timestamps[format]);
    setConfig(prev => ({ 
      ...prev, 
      inputFormat: format === 'iso' ? 'iso8601' : (format === 'unix-ms' ? 'unix' : 'unix')
    }));
  };

  const handleTimezoneQuickSelect = (timezone: string) => {
    setConfig(prev => ({ ...prev, outputTimezone: timezone }));
  };

  // Build conditional options
  const allOptions = [
    ...MODE_OPTIONS,
    ...INPUT_OPTIONS.filter(opt => {
      // Show input format only when there's input or not showing current time
      if (opt.key === 'inputFormat') return input.trim() || config.outputFormat !== 'all';
      return true;
    }),
    ...TIMEZONE_OPTIONS,
    ...FORMATTING_OPTIONS,
  ];

  const inputPlaceholder = config.batchProcessing 
    ? 'Enter multiple timestamps (one per line):\n1701234567\n2023-11-29T12:36:07Z\nWed, 29 Nov 2023 12:36:07 GMT'
    : 'Enter timestamp to convert or leave empty for current time...';

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Current Time Display */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Current Time</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-mono text-blue-800">
              {currentTime}
            </div>
            <div className="mt-2 flex gap-1">
              <button
                onClick={() => handleInsertCurrentTimestamp('unix')}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Insert Unix
              </button>
              <button
                onClick={() => handleInsertCurrentTimestamp('unix-ms')}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Insert Unix (ms)
              </button>
              <button
                onClick={() => handleInsertCurrentTimestamp('iso')}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Insert ISO
              </button>
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('current')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              ⏰ Current Time
            </button>
            <button
              onClick={() => handleQuickExample('unix')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              📅 Unix → ISO
            </button>
            <button
              onClick={() => handleQuickExample('iso')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              ⏰ ISO → Relative
            </button>
            <button
              onClick={() => handleQuickExample('batch')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              📊 Batch Mode
            </button>
          </div>
        </div>

        {/* Quick Timezone Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Common Timezones</h3>
          <div className="grid grid-cols-1 gap-1">
            {COMMON_TIMEZONES.slice(0, 6).map(tz => (
              <button
                key={tz.id}
                onClick={() => handleTimezoneQuickSelect(tz.id)}
                className={`px-2 py-1 text-xs rounded transition-colors text-left ${
                  config.outputTimezone === tz.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tz.name}
              </button>
            ))}
          </div>
        </div>

        <OptionsPanel
          title="Timestamp Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Timestamp Information */}
        {info && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Timestamp Info</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="grid gap-1">
                <div>
                  <span className="text-green-600">Format:</span>
                  <span className="ml-1 font-medium text-green-800">{info.inputFormat}</span>
                </div>
                <div>
                  <span className="text-green-600">Day:</span>
                  <span className="ml-1 font-medium text-green-800">{info.dayOfWeek}</span>
                </div>
                <div>
                  <span className="text-green-600">Relative:</span>
                  <span className="ml-1 font-medium text-green-800">{info.relativeTime}</span>
                </div>
                <div>
                  <span className="text-green-600">Timezone:</span>
                  <span className="ml-1 font-medium text-green-800">{info.timezone}</span>
                </div>
                <div>
                  <span className="text-green-600">Valid:</span>
                  <span className="ml-1 font-medium text-green-800">
                    {info.isValid ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Format Reference */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Format Reference</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {TIMESTAMP_FORMATS.map(format => (
              <div key={format.id} className="p-2 bg-gray-50 rounded text-xs">
                <div className="font-medium text-gray-800">{format.name}</div>
                <div className="text-gray-600 mt-1">{format.description}</div>
                <code className="block mt-1 text-blue-600 bg-white px-1 rounded">
                  {format.example}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="Timestamp Input"
          value={input}
          onChange={setInput}
          placeholder={inputPlaceholder}
          language="text"
        />

        <OutputPanel
          title="Formatted Timestamp"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="Enter timestamp or leave empty for current time..."
          processingMessage="Processing timestamp..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Result
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'timestamps.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download File
                </button>
                {info && (
                  <button
                    onClick={() => {
                      const infoText = `Timestamp Information:
                      
Original Input: ${info.originalInput}
Parsed Timestamp: ${info.parsedTimestamp}
Input Format: ${info.inputFormat}
Output Format: ${info.outputFormat}
Timezone: ${info.timezone}
Day of Week: ${info.dayOfWeek}
Relative Time: ${info.relativeTime}
Valid: ${info.isValid ? 'Yes' : 'No'}`;
                      
                      navigator.clipboard?.writeText(infoText);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    📊 Copy Info
                  </button>
                )}
                <button
                  onClick={() => {
                    const reverseConfig = {
                      ...config,
                      inputFormat: config.outputFormat === 'unix' ? 'unix' as const :
                                  config.outputFormat === 'unix-ms' ? 'unix' as const :
                                  config.outputFormat === 'iso8601' ? 'iso8601' as const :
                                  config.outputFormat === 'rfc2822' ? 'rfc2822' as const : 'auto' as const,
                      outputFormat: config.inputFormat === 'unix' ? 'unix' as const :
                                   config.inputFormat === 'iso8601' ? 'iso8601' as const :
                                   config.inputFormat === 'rfc2822' ? 'rfc2822' as const : 'iso8601' as const
                    };
                    setInput(output);
                    setConfig(reverseConfig);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  🔄 Reverse
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}