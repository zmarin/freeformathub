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
      <div >
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
          <label >
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
        <div >
          {/* Control Header */}
          <div >
            <h3 >
              UUID Generator Settings
            </h3>
          </div>

          {/* Examples */}
          <div >
            <h4 >Quick Examples</h4>
            <div className="grid gap-2">
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  
                  title={example.description}
                >
                  <div >
                    {example.title}
                  </div>
                  <div >
                    {example.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Essential Options */}
          <div >
            <h4 >Configuration</h4>
            
            <div className="space-y-4">
              {ESSENTIAL_OPTIONS.map((option) => (
                <div key={option.key} className="space-y-2">
                  <label >
                    {option.label}
                  </label>
                  {option.type === 'select' ? (
                    <select
                      value={String(config[option.key as keyof UuidGeneratorConfig] ?? option.default)}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                      
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
                      
                    />
                  ) : null}
                  <p >
                    {option.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Advanced Options Toggle */}
            {ADVANCED_OPTIONS.length > 0 && (
              <div >
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  
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
                          <span >
                            {option.label}
                          </span>
                        </label>
                        <p >
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
          <div >
            <h3 >
              Generated UUIDs
              {isLoading && <span >Generating...</span>}
              {!error && output && metadata && (
                <span >
                  ✓ {metadata.count} UUID{metadata.count > 1 ? 's' : ''} ({metadata.version?.toUpperCase()})
                </span>
              )}
              {error && <span >✗ Error</span>}
            </h3>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button
                    onClick={handleCopy}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      copied 
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    
                  >
                    Download
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Output Content */}
          <div >
            {error ? (
              <div className="p-4 h-full">
                <div >
                  <h4 >Generation Error</h4>
                  <pre >
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
                  
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Metadata */}
          {metadata && !error && output && (
            <div >
              <div >
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
                  <span >
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