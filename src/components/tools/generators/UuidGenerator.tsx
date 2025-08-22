import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processUuid, type UuidGeneratorConfig } from '../../../tools/generators/uuid-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface UuidGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: UuidGeneratorConfig = {
  version: 'v4',
  count: 1,
  format: 'standard',
  includeTimestamp: false,
};

const OPTIONS = [
  {
    key: 'version',
    label: 'UUID Version',
    type: 'select' as const,
    default: 'v4',
    options: [
      { value: 'v1', label: 'v1 (Timestamp + MAC)' },
      { value: 'v4', label: 'v4 (Random)' },
      { value: 'v7', label: 'v7 (Timestamp + Random)' },
      { value: 'nil', label: 'Nil UUID (All zeros)' },
    ],
    description: 'Choose UUID version to generate',
  },
  {
    key: 'count',
    label: 'Count',
    type: 'number' as const,
    default: 1,
    min: 1,
    max: 100,
    description: 'Number of UUIDs to generate (1-100)',
  },
  {
    key: 'format',
    label: 'Output Format',
    type: 'select' as const,
    default: 'standard',
    options: [
      { value: 'standard', label: 'Standard (lowercase with dashes)' },
      { value: 'compact', label: 'Compact (no dashes)' },
      { value: 'uppercase', label: 'Uppercase' },
      { value: 'braces', label: 'With Braces {}' },
    ],
    description: 'Choose output format style',
  },
  {
    key: 'includeTimestamp',
    label: 'Include Metadata',
    type: 'boolean' as const,
    default: false,
    description: 'Include generation timestamp and settings as comments',
  },
];

const EXAMPLES = [
  {
    title: 'Single UUID v4',
    value: 'Click "Generate" to create a random UUID',
  },
  {
    title: 'Multiple UUIDs',
    value: 'Set count to 5 and click "Generate"',
  },
  {
    title: 'Database IDs',
    value: 'Use v4 format for database primary keys',
  },
  {
    title: 'Session IDs',
    value: 'Generate compact format for session tracking',
  },
  {
    title: 'API Request IDs',
    value: 'Use v7 for time-ordered request tracking',
  },
];

export function UuidGenerator({ className = '' }: UuidGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<UuidGeneratorConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  // Generate UUIDs immediately when config changes
  const generateUuids = useMemo(
    () => debounce((cfg: UuidGeneratorConfig) => {
      if (cfg.count < 1 || cfg.count > 100) {
        setError('Count must be between 1 and 100');
        setOutput('');
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        try {
          const result = processUuid('', cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            
            // Add to history for successful operations
            addToHistory({
              toolId: 'uuid-generator',
              input: `Generate ${cfg.count} UUID ${cfg.version}`,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to generate UUIDs');
        }
        
        setIsLoading(false);
      }, 100);
    }, 100),
    [addToHistory]
  );

  // Auto-generate when component mounts or config changes
  useEffect(() => {
    generateUuids(config);
  }, [config, generateUuids]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: UuidGeneratorConfig) => {
    setConfig(newConfig);
  };

  const handleGenerate = () => {
    generateUuids(config);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="UUID Generator"
          placeholder="UUIDs will be generated automatically..."
          syntax="text"
          examples={EXAMPLES}
          readonly={true}
          showFileUpload={false}
        />
        
        {/* Generate Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate New UUIDs'}
          </button>
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
        label="Generated UUIDs"
        syntax="text"
        downloadFilename="uuids.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}