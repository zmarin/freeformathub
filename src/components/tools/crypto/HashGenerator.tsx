import { useState, useEffect, useMemo, useCallback } from 'react';
import { processHash, type HashGeneratorConfig } from '../../../tools/crypto/hash-generator';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface HashGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: HashGeneratorConfig = {
  algorithms: ['SHA-256'],
  outputFormat: 'hex',
  includeLength: false,
  uppercaseHex: false,
  salt: '',
};

// Essential options - most commonly used
const ESSENTIAL_OPTIONS = [
  {
    key: 'algorithm',
    label: 'Algorithm',
    type: 'select' as const,
    default: 'SHA-256',
    options: [
      { value: 'MD5', label: 'MD5 (deprecated)' },
      { value: 'SHA-1', label: 'SHA-1 (deprecated)' },
      { value: 'SHA-256', label: 'SHA-256 (recommended)' },
      { value: 'SHA-384', label: 'SHA-384' },
      { value: 'SHA-512', label: 'SHA-512' },
    ],
    description: 'Primary hash algorithm',
  },
  {
    key: 'outputFormat',
    label: 'Format',
    type: 'select' as const,
    default: 'hex',
    options: [
      { value: 'hex', label: 'Hexadecimal' },
      { value: 'base64', label: 'Base64' },
    ],
    description: 'Output format',
  },
  {
    key: 'salt',
    label: 'Salt',
    type: 'text' as const,
    default: '',
    description: 'Optional salt to add before hashing',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'algorithms',
    label: 'Multiple Algorithms',
    type: 'multiselect' as const,
    default: ['SHA-256'],
    options: [
      { value: 'MD5', label: 'MD5 (deprecated for security)' },
      { value: 'SHA-1', label: 'SHA-1 (deprecated for security)' },
      { value: 'SHA-256', label: 'SHA-256 (recommended)' },
      { value: 'SHA-384', label: 'SHA-384' },
      { value: 'SHA-512', label: 'SHA-512' },
    ],
    description: 'Generate multiple hashes simultaneously',
  },
  {
    key: 'uppercaseHex',
    label: 'Uppercase Hex',
    type: 'boolean' as const,
    default: false,
    description: 'Use uppercase letters in hexadecimal output',
    showWhen: (cfg: any) => cfg.outputFormat === 'hex',
  },
  {
    key: 'includeLength',
    label: 'Include Length',
    type: 'boolean' as const,
    default: false,
    description: 'Show character count for each hash',
  },
];

const EXAMPLES = [
  {
    title: 'Simple Text',
    value: 'Hello, World!',
  },
  {
    title: 'Password',
    value: 'mySecurePassword123!',
  },
  {
    title: 'Lorem Ipsum',
    value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    title: 'JSON Data',
    value: '{"name":"John","email":"john@example.com","id":12345}',
  },
  {
    title: 'File Content Sample',
    value: 'The quick brown fox jumps over the lazy dog',
  },
  {
    title: 'Unicode Text',
    value: 'Héllo Wørld! 🌍 café résumé naïve',
  },
];

export function HashGenerator({ className = '' }: HashGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<HashGeneratorConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('hash-generator') as Partial<HashGeneratorConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Processed config that handles the algorithm/algorithms switching
  const processedConfig = useMemo(() => {
    const cfg = { ...config };
    
    // If using single algorithm mode, set algorithms array
    if (cfg.algorithm && (!cfg.algorithms || cfg.algorithms.length === 0)) {
      cfg.algorithms = [cfg.algorithm];
    }
    
    // Add salt to input if provided
    const saltedInput = cfg.salt ? cfg.salt + input : input;
    
    return { ...cfg, saltedInput };
  }, [config, input]);

  // Process hash function
  const processHashes = useCallback((inputText: string = input, cfg: HashGeneratorConfig = processedConfig) => {
    const textToHash = cfg.salt ? cfg.salt + inputText : inputText;
    
    if (!textToHash.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    if (!cfg.algorithms || cfg.algorithms.length === 0) {
      setOutput('');
      setError('Please select at least one hash algorithm');
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual hash generation
    try {
      const result = processHash(textToHash, cfg);
      
      if (result.success) {
        setOutput(result.output || '');
        setError(undefined);
        setMetadata(result.metadata);
        
        // Add to history for successful operations
        addToHistory({
          toolId: 'hash-generator',
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
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : 'Failed to generate hashes');
      setMetadata(undefined);
    }
    
    setIsLoading(false);
  }, [input, processedConfig, addToHistory]);

  // Debounced processing for auto-hash
  const debouncedProcess = useMemo(
    () => debounce(processHashes, 500),
    [processHashes]
  );

  // Process input when it changes (only if auto-hash is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, processedConfig);
    }
  }, [input, processedConfig, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleGenerate = useCallback(() => {
    const singleConfig = { ...processedConfig, algorithms: [processedConfig.algorithms[0] || 'SHA-256'] };
    setConfig(singleConfig);
    processHashes(input, singleConfig);
  }, [input, processedConfig, processHashes]);

  const handleGenerateAll = useCallback(() => {
    const allAlgorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    const allConfig = { ...processedConfig, algorithms: allAlgorithms };
    setConfig(allConfig);
    processHashes(input, allConfig);
  }, [input, processedConfig, processHashes]);

  const handleVerify = useCallback(() => {
    if (!input.includes('\n') || !input.includes(':')) {
      setError('For verification, provide text in format: "original_text:expected_hash"');
      return;
    }
    
    const [originalText, expectedHash] = input.split(':', 2);
    const verifyConfig = { ...processedConfig, algorithms: [processedConfig.algorithms[0] || 'SHA-256'] };
    
    processHashes(originalText, verifyConfig);
    
    // Check if generated hash matches expected
    setTimeout(() => {
      if (output && output.includes(expectedHash.trim())) {
        setMetadata(prev => ({ ...prev, verification: 'MATCH' }));
      } else {
        setMetadata(prev => ({ ...prev, verification: 'NO_MATCH' }));
      }
    }, 100);
  }, [input, output, processedConfig, processHashes]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      setMetadata(prev => ({ ...prev, fileSize: file.size, fileName: file.name }));
      if (autoFormat) {
        processHashes(content, processedConfig);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, processedConfig, processHashes]);

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
    const filename = `hashes_${config.outputFormat}.txt`;
    downloadFile(output, filename, 'text/plain');
  }, [output, config.outputFormat]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: HashGeneratorConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('hash-generator', newConfig); } catch {}
    
    // If not auto-hashing, don't process automatically
    if (!autoFormat) return;
    processHashes(input, { ...processedConfig, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    
    // Handle the primary algorithm selection
    if (key === 'algorithm') {
      newConfig.algorithms = [value];
    }
    
    handleConfigChange(newConfig);
  };

  // Get hash strength indicator
  const getHashStrength = (algorithm: string) => {
    switch (algorithm.toLowerCase()) {
      case 'md5': return { strength: 'Weak', color: 'text-red-600' };
      case 'sha-1': return { strength: 'Weak', color: 'text-red-600' };
      case 'sha-256': return { strength: 'Strong', color: 'text-green-600' };
      case 'sha-384': return { strength: 'Very Strong', color: 'text-blue-600' };
      case 'sha-512': return { strength: 'Very Strong', color: 'text-blue-600' };
      default: return { strength: 'Unknown', color: 'text-gray-600' };
    }
  };

  const primaryAlgorithm = processedConfig.algorithms?.[0] || 'SHA-256';
  const hashStrength = getHashStrength(primaryAlgorithm);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div >
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate hash with current algorithm"
          >
            🔐 Generate
          </button>
          <button
            onClick={handleGenerateAll}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate hashes with all algorithms"
          >
            🔐🔐 Generate All
          </button>
          <button
            onClick={handleVerify}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Verify hash against expected value (format: text:hash)"
          >
            ✅ Verify
          </button>
          {!autoFormat && (
            <button
              onClick={() => processHashes()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? '⏳' : '⚡'} Hash
            </button>
          )}
        </div>

        {/* Auto-hash toggle and hash strength indicator */}
        <div className="flex items-center gap-4 ml-auto">
          <div >
            <span className="font-medium">{primaryAlgorithm}:</span>
            <span className={`ml-1 ${hashStrength.color}`}>{hashStrength.strength}</span>
          </div>
          <label >
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="rounded"
            />
            Auto-hash
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Input Section */}
        <div >
          {/* Input Header */}
          <div >
            <h3 >
              Text Input
              {processedConfig.salt && (
                <span >🧂 Salted</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <label >
                📁 Upload
                <input
                  type="file"
                  accept=".txt,.json,.md,.csv,.log"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
              {input && (
                <button
                  onClick={() => setInput('')}
                  
                  title="Clear input"
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div 
            className={`flex-1 relative ${dragActive ? 'bg-blue-50/20' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to hash, paste file content, or drag & drop a file..."
              
              spellCheck={false}
            />
            {dragActive && (
              <div >
                <div >
                  Drop file here to hash its content
                </div>
              </div>
            )}
          </div>

          {/* Example buttons */}
          <div >
            <div className="flex flex-wrap gap-2">
              <span >Examples:</span>
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(example.value)}
                  
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
          <div >
            <h3 >
              Generated Hashes
              {isLoading && <span >Processing...</span>}
              {!error && output && <span >✓ Generated</span>}
              {error && <span >✗ Error</span>}
              {metadata?.verification === 'MATCH' && <span >✅ Hash Verified</span>}
              {metadata?.verification === 'NO_MATCH' && <span >❌ Hash Mismatch</span>}
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
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    
                  >
                    💾 Download
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
                  <h4 >Hash Generation Error</h4>
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
                  placeholder="Generated hashes will appear here..."
                  
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Metadata display */}
          {metadata && !error && output && (
            <div >
              <div >
                {metadata.algorithms && (
                  <span><strong>Algorithms:</strong> {metadata.algorithms}</span>
                )}
                {typeof metadata.hashCount === 'number' && (
                  <span><strong>Hashes:</strong> {metadata.hashCount}</span>
                )}
                {typeof metadata.inputLength === 'number' && (
                  <span><strong>Input:</strong> {metadata.inputLength} chars</span>
                )}
                {metadata.fileName && (
                  <span><strong>File:</strong> {metadata.fileName}</span>
                )}
                {typeof metadata.fileSize === 'number' && (
                  <span><strong>Size:</strong> {(metadata.fileSize / 1024).toFixed(1)}KB</span>
                )}
                {metadata.outputFormat && (
                  <span><strong>Format:</strong> {metadata.outputFormat.toUpperCase()}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Essential Options Panel */}
      <div >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 >Options</h4>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              
            >
              {showAdvanced ? '△ Less' : '▽ More'}
            </button>
          </div>
          
          {/* Essential options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label >
                  {option.label}
                </label>
                {option.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof HashGeneratorConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span >
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof HashGeneratorConfig] ?? option.default)}
                    onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                    
                  >
                    {option.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : option.type === 'text' ? (
                  <input
                    type="text"
                    value={String(config[option.key as keyof HashGeneratorConfig] ?? '')}
                    onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                    placeholder={option.description}
                    
                  />
                ) : null}
              </div>
            ))}
          </div>

          {/* Advanced options */}
          {showAdvanced && (
            <div >
              <h5 >Advanced Options</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADVANCED_OPTIONS.filter(option => !option.showWhen || option.showWhen(config)).map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label >
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof HashGeneratorConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span >
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof HashGeneratorConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        
                      >
                        {option.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : option.type === 'multiselect' ? (
                      <div className="space-y-1">
                        {option.options?.map((opt) => (
                          <label key={opt.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={config.algorithms?.includes(opt.value) || false}
                              onChange={(e) => {
                                const algorithms = config.algorithms || [];
                                const newAlgorithms = e.target.checked
                                  ? [...algorithms, opt.value]
                                  : algorithms.filter(a => a !== opt.value);
                                handleEssentialConfigChange('algorithms', newAlgorithms);
                              }}
                              className="rounded"
                            />
                            <span >
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
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