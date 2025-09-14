import { useState, useEffect, useMemo, useCallback } from 'react';
import { processSubnetCalculator, type SubnetCalculatorConfig } from '../../../tools/network/ip-subnet-calculator';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface IpSubnetCalculatorProps {
  className?: string;
}

const DEFAULT_CONFIG: SubnetCalculatorConfig = {
  mode: 'calculate',
  includePrivateInfo: true,
  includeBroadcast: true,
  includeWildcard: false,
  showBinary: false,
  splitIntoSubnets: 4,
  outputFormat: 'detailed',
};

// Essential options - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Calculation Mode',
    type: 'select' as const,
    default: 'calculate',
    options: [
      { value: 'calculate', label: 'Full Analysis' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'split', label: 'Split Network' },
    ],
    description: 'Choose calculation mode',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Report' },
      { value: 'compact', label: 'Compact' },
      { value: 'table', label: 'Table' },
    ],
    description: 'Output format style',
  },
  {
    key: 'includePrivateInfo',
    label: 'Show Classification',
    type: 'boolean' as const,
    default: true,
    description: 'Include network class and type info',
  },
] as const;

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'includeBroadcast',
    label: 'Broadcast Address',
    type: 'boolean' as const,
    default: true,
    description: 'Show broadcast address',
  },
  {
    key: 'includeWildcard',
    label: 'Wildcard Mask',
    type: 'boolean' as const,
    default: false,
    description: 'Show wildcard mask (inverse)',
  },
  {
    key: 'showBinary',
    label: 'Binary Representation',
    type: 'boolean' as const,
    default: false,
    description: 'Show binary format',
  },
  {
    key: 'splitIntoSubnets',
    label: 'Number of Subnets',
    type: 'select' as const,
    default: 4,
    options: [
      { value: 2, label: '2 Subnets' },
      { value: 4, label: '4 Subnets' },
      { value: 8, label: '8 Subnets' },
      { value: 16, label: '16 Subnets' },
      { value: 32, label: '32 Subnets' },
      { value: 64, label: '64 Subnets' },
    ],
    description: 'Subnets to create (split mode only)',
    showWhen: (cfg: any) => cfg.mode === 'split',
  },
] as const;

const EXAMPLES = [
  {
    title: 'Class C Network',
    value: '192.168.1.0/24',
  },
  {
    title: 'Class B Network', 
    value: '172.16.0.0/16',
  },
  {
    title: 'Class A Network',
    value: '10.0.0.0/8',
  },
  {
    title: 'Small Subnet',
    value: '192.168.1.0/28',
  },
  {
    title: 'Large Subnet',
    value: '172.16.0.0/12',
  },
  {
    title: 'Single Host',
    value: '192.168.1.100/32',
  },
];

export function IpSubnetCalculator({ className = '' }: IpSubnetCalculatorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<SubnetCalculatorConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('ip-subnet-calculator') as Partial<SubnetCalculatorConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process subnet function
  const processSubnet = useCallback((inputText: string = input, cfg: SubnetCalculatorConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual calculate button
    const result = processSubnetCalculator(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      
      // Create metadata from network info
      const meta: Record<string, any> = {};
      if (result.networkInfo) {
        meta.networkAddress = result.networkInfo.networkAddress;
        meta.totalHosts = result.networkInfo.totalHosts;
        meta.usableHosts = result.networkInfo.usableHosts;
        meta.networkClass = result.networkInfo.networkClass;
        meta.isPrivate = result.networkInfo.isPrivate;
        if (result.networkInfo.subnets) {
          meta.subnetCount = result.networkInfo.subnets.length;
        }
      }
      setMetadata(meta);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'ip-subnet-calculator',
        input: inputText,
        output: result.output || '',
        config: cfg,
        timestamp: Date.now(),
      });
    } else {
      setOutput('');
      setError(result.error);
      setMetadata(undefined);
    }
    
    setIsLoading(false);
  }, [input, config, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processSubnet, 500),
    [processSubnet]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleCalculate = useCallback(() => {
    const analyzeConfig = { ...config, mode: 'calculate' as const, outputFormat: 'detailed' as const };
    setConfig(analyzeConfig);
    processSubnet(input, analyzeConfig);
  }, [input, config, processSubnet]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...config, mode: 'validate' as const };
    setConfig(validateConfig);
    processSubnet(input, validateConfig);
  }, [input, config, processSubnet]);

  const handleAnalyze = useCallback(() => {
    const analyzeConfig = { ...config, mode: 'split' as const };
    setConfig(analyzeConfig);
    processSubnet(input, analyzeConfig);
  }, [input, config, processSubnet]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      // For IP lists, take the first valid IP/CIDR
      const lines = content.split('\n');
      const firstValidLine = lines.find(line => line.trim().includes('/'));
      if (firstValidLine) {
        setInput(firstValidLine.trim());
        if (autoFormat) {
          processSubnet(firstValidLine.trim(), config);
        }
      } else {
        setInput(content.trim());
        if (autoFormat) {
          processSubnet(content.trim(), config);
        }
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, config, processSubnet]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

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
    const filename = config.mode === 'split' ? 'subnet-analysis.txt' : 'subnet-info.txt';
    downloadFile(output, filename, 'text/plain');
  }, [output, config.mode]);

  const handleConfigChange = (newConfig: SubnetCalculatorConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('ip-subnet-calculator', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processSubnet(input, newConfig);
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCalculate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Calculate full subnet information"
          >
            🧮 Calculate
          </button>
          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Validate IP/CIDR format only"
          >
            ✓ Validate
          </button>
          <button
            onClick={handleAnalyze}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Analyze and split into subnets"
          >
            🔀 Analyze
          </button>
          {!autoFormat && (
            <button
              onClick={() => processSubnet()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? '⏳' : '⚡'} Process
            </button>
          )}
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
            Auto-calculate
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Input Section */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
          {/* Input Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              IP Address & CIDR
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                📁 Upload
                <input
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
              {input && (
                <button
                  onClick={() => setInput('')}
                  className="text-xs px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  title="Clear input"
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div 
            className={`flex-1 relative ${dragActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter IP address with CIDR notation (e.g., 192.168.1.0/24)&#10;Or drag & drop a file..."
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop IP list file here
                </div>
              </div>
            )}
          </div>

          {/* Example buttons */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Examples:</span>
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(example.value)}
                  className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  title={example.title}
                >
                  {example.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Output Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Subnet Information
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Calculating...</span>}
              {!error && output && <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Valid</span>}
              {error && <span className="ml-2 text-xs text-red-600 dark:text-red-400">✗ Invalid</span>}
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
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    💾 Download
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Subnet Calculation Error</h4>
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
                  placeholder="Subnet calculation results will appear here..."
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Metadata panel */}
          {metadata && !error && output && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                {metadata.networkAddress && (
                  <span><strong>Network:</strong> {metadata.networkAddress}</span>
                )}
                {typeof metadata.usableHosts === 'number' && (
                  <span><strong>Usable Hosts:</strong> {metadata.usableHosts.toLocaleString()}</span>
                )}
                {metadata.networkClass && (
                  <span><strong>Class:</strong> {metadata.networkClass}</span>
                )}
                {typeof metadata.isPrivate === 'boolean' && (
                  <span className={metadata.isPrivate ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                    <strong>{metadata.isPrivate ? '🔒' : '🌐'}</strong> {metadata.isPrivate ? 'Private' : 'Public'}
                  </span>
                )}
                {typeof metadata.subnetCount === 'number' && metadata.subnetCount > 0 && (
                  <span><strong>Subnets:</strong> {metadata.subnetCount}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Essential Options Panel */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Options</h4>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {showAdvanced ? '△ Less' : '▽ More'}
            </button>
          </div>
          
          {/* Essential options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
                {option.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof SubnetCalculatorConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof SubnetCalculatorConfig] ?? option.default)}
                    onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                    className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {option.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ))}
          </div>

          {/* Advanced options */}
          {showAdvanced && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Advanced Options</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADVANCED_OPTIONS.filter(option => !option.showWhen || option.showWhen(config)).map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof SubnetCalculatorConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof SubnetCalculatorConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {option.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}