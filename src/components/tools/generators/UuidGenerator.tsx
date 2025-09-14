import { useState, useEffect, useMemo, useCallback } from 'react';
import { processUuid, type UuidGeneratorConfig } from '../../../tools/generators/uuid-generator';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface UuidGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: UuidGeneratorConfig = {
  version: 'v4',
  count: 1,
  format: 'standard',
  includeTimestamp: false,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'version',
    label: 'UUID Version',
    type: 'select' as const,
    default: 'v4',
    options: [
      { value: 'v4', label: 'v4 (Random)' },
      { value: 'v1', label: 'v1 (Timestamp + MAC)' },
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
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
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
    title: 'Single v4 UUID',
    description: 'Generate one random UUID v4',
    config: { version: 'v4', count: 1, format: 'standard' },
  },
  {
    title: 'Bulk Generation',
    description: 'Generate 10 UUIDs at once',
    config: { version: 'v4', count: 10, format: 'standard' },
  },
  {
    title: 'Compact Format',
    description: 'UUID without dashes for URLs',
    config: { version: 'v4', count: 1, format: 'compact' },
  },
  {
    title: 'Time-ordered v7',
    description: 'Sortable timestamp-based UUID',
    config: { version: 'v7', count: 5, format: 'standard' },
  },
];

export function UuidGenerator({ className = '' }: UuidGeneratorProps) {
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<UuidGeneratorConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('uuid-generator') as Partial<UuidGeneratorConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
    // Generate initial UUIDs on mount
    const initResult = processUuid('', DEFAULT_CONFIG);
    if (initResult.success) {
      setOutput(initResult.output || '');
      setMetadata(initResult.metadata);
    }
  }, [getSavedConfig]);

  // Process UUID generation function
  const generateUuids = useCallback((cfg?: UuidGeneratorConfig) => {
    const configToUse = cfg || config;
    
    if (configToUse.count < 1 || configToUse.count > 100) {
      setError('Count must be between 1 and 100');
      setOutput('');
      setMetadata(undefined);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = processUuid('', configToUse);
      
      if (result.success) {
        setOutput(result.output || '');
        setError(undefined);
        setMetadata(result.metadata);
        
        // Add to history for successful operations
        addToHistory({
          toolId: 'uuid-generator',
          input: `Generate ${configToUse.count} UUID ${configToUse.version}`,
          output: result.output || '',
          config: configToUse,
          timestamp: Date.now(),
        });
      } else {
        setOutput('');
        setError(result.error);
        setMetadata(undefined);
      }
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : 'Failed to generate UUIDs');
      setMetadata(undefined);
    }
    
    setIsLoading(false);
  }, [config, addToHistory]);

  // Auto-generate when config changes (if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      generateUuids(config);
    }
  }, [config, generateUuids, autoFormat]);

  // Quick action handlers
  const handleGenerate = useCallback(() => {
    generateUuids(config);
  }, [generateUuids, config]);

  const handleGenerateBulk = useCallback(() => {
    const bulkConfig = { ...config, count: 10 };
    setConfig(bulkConfig);
    generateUuids(bulkConfig);
  }, [config, generateUuids]);

  const handleValidateUuid = useCallback(() => {
    // For UUID generator, this could show info about the generated UUIDs
    if (output) {
      const lines = output.split('\n').filter(line => line.trim() && !line.startsWith('//'));
      const uuidCount = lines.length;
      const validUuids = lines.filter(line => {
        const cleanLine = line.trim().replace(/[{}]/g, '').replace(/-/g, '');
        return cleanLine.length === 32 && /^[0-9a-f]+$/i.test(cleanLine);
      }).length;
      
      setMetadata(prev => ({
        ...prev,
        validationInfo: `${validUuids}/${uuidCount} valid UUIDs`
      }));
    }
  }, [output]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [output]);

  // Download handler
  const handleDownload = useCallback(() => {
    const filename = `uuids-${config.version}-${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(output, filename, 'text/plain');
  }, [output, config.version]);

  const handleConfigChange = (newConfig: UuidGeneratorConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('uuid-generator', newConfig); } catch {}
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { 
      ...config, 
      [key]: key === 'count' ? Math.max(1, Math.min(100, parseInt(value) || 1)) : value 
    };
    handleConfigChange(newConfig);
  };

  // Example handler
  const handleExampleClick = (example: any) => {
    const exampleConfig = { ...config, ...example.config };
    setConfig(exampleConfig);
    generateUuids(exampleConfig);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate new UUIDs with current settings"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
          <button
            onClick={handleGenerateBulk}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate 10 UUIDs at once"
            disabled={isLoading}
          >
            Generate Bulk
          </button>
          <button
            onClick={handleValidateUuid}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Validate generated UUIDs"
            disabled={!output || isLoading}
          >
            Validate
          </button>
        </div>

        {/* Auto-format toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="rounded"
            />
            Auto-generate
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Control Section */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 max-w-full lg:max-w-md">
          {/* Control Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              UUID Generator Settings
            </h3>
          </div>

          {/* Examples */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Examples</h4>
            <div className="grid gap-2">
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  className="text-left p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                  title={example.description}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {example.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {example.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Essential Options */}
          <div className="flex-1 p-4 bg-white dark:bg-gray-800">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Configuration</h4>
            
            <div className="space-y-4">
              {ESSENTIAL_OPTIONS.map((option) => (
                <div key={option.key} className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    {option.label}
                  </label>
                  {option.type === 'select' ? (
                    <select
                      value={String(config[option.key as keyof UuidGeneratorConfig] ?? option.default)}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {option.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : option.type === 'number' ? (
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={config[option.key as keyof UuidGeneratorConfig] as number}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  ) : null}
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Advanced Options Toggle */}
            {ADVANCED_OPTIONS.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Advanced Options
                  <span className="text-xs">{showAdvanced ? '△' : '▽'}</span>
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 space-y-4">
                    {ADVANCED_OPTIONS.map((option) => (
                      <div key={option.key} className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!!config[option.key as keyof UuidGeneratorConfig]}
                            onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {option.label}
                          </span>
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                          {option.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Output Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Generated UUIDs
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Generating...</span>}
              {!error && output && metadata && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                  ✓ {metadata.count} UUID{metadata.count > 1 ? 's' : ''} ({metadata.version?.toUpperCase()})
                </span>
              )}
              {error && <span className="ml-2 text-xs text-red-600 dark:text-red-400">✗ Error</span>}
            </h3>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button
                    onClick={handleCopy}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      copied 
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    Download
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Output Content */}
          <div className="flex-1 bg-white dark:bg-gray-800">
            {error ? (
              <div className="p-4 h-full">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Generation Error</h4>
                  <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                    {error}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <textarea
                  value={output}
                  readOnly
                  placeholder="Generated UUIDs will appear here..."
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Metadata */}
          {metadata && !error && output && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span><strong>Version:</strong> {metadata.version?.toUpperCase()}</span>
                <span><strong>Count:</strong> {metadata.count}</span>
                <span><strong>Format:</strong> {metadata.format}</span>
                {metadata.totalLength && (
                  <span><strong>Size:</strong> {metadata.totalLength} chars</span>
                )}
                {metadata.generatedAt && (
                  <span><strong>Generated:</strong> {new Date(metadata.generatedAt).toLocaleTimeString()}</span>
                )}
                {metadata.validationInfo && (
                  <span className="text-green-600 dark:text-green-400">
                    <strong>✓ {metadata.validationInfo}</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}