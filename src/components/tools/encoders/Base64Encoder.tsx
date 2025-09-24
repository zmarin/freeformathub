import { useState, useEffect, useMemo, useCallback } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processBase64, type Base64EncoderConfig } from '../../../tools/encoders/base64-encoder';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface Base64EncoderProps {
  className?: string;
}

const DEFAULT_CONFIG: Base64EncoderConfig = {
  mode: 'encode',
  lineBreaks: false,
  urlSafe: false,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'encode',
    options: [
      { value: 'encode', label: 'Encode (Text → Base64)' },
      { value: 'decode', label: 'Decode (Base64 → Text)' },
    ],
    description: 'Choose encoding or decoding operation',
  },
  {
    key: 'urlSafe',
    label: 'URL-Safe',
    type: 'boolean' as const,
    default: false,
    description: 'Use URL-safe Base64 (replaces +/= with -_)',
  },
  {
    key: 'lineBreaks',
    label: 'Line Breaks',
    type: 'boolean' as const,
    default: false,
    description: 'Add line breaks every 64 characters (encode only)',
  },
];

// Advanced options for power users (currently empty but structure ready)
const ADVANCED_OPTIONS: any[] = [];

const ENCODE_EXAMPLES = [
  {
    title: 'Simple Text',
    value: 'Hello, World!',
  },
  {
    title: 'Email Address',
    value: 'user@example.com',
  },
  {
    title: 'JSON Data',
    value: '{"name":"John","age":30,"email":"john@example.com"}',
  },
  {
    title: 'URL with Parameters',
    value: 'https://example.com/api?user=john&token=abc123',
  },
];

const DECODE_EXAMPLES = [
  {
    title: 'Simple Text',
    value: 'SGVsbG8sIFdvcmxkIQ==',
  },
  {
    title: 'Email Address',
    value: 'dXNlckBleGFtcGxlLmNvbQ==',
  },
  {
    title: 'JSON Data',
    value: 'eyJuYW1lIjoiSm9obiIsImFnZSI6MzAsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSJ9',
  },
  {
    title: 'URL-Safe Base64',
    value: 'aHR0cHM6Ly9leGFtcGxlLmNvbS9hcGk_dXNlcj1qb2huJnRva2VuPWFiYzEyMw',
  },
];

export function Base64Encoder({ className = '' }: Base64EncoderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<Base64EncoderConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('base64-encoder') as Partial<Base64EncoderConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Get appropriate examples based on mode
  const examples = useMemo(() => {
    return config.mode === 'encode' ? ENCODE_EXAMPLES : DECODE_EXAMPLES;
  }, [config.mode]);

  // Process Base64 function
  const processBase64Handler = useCallback((inputText: string = input, cfg: Base64EncoderConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processBase64(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'base64-encoder',
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
    () => debounce(processBase64Handler, 500),
    [processBase64Handler]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // Clear input/output when mode changes
  useEffect(() => {
    setInput('');
    setOutput('');
    setError(undefined);
    setMetadata(undefined);
  }, [config.mode]);

  // Quick action handlers
  const handleEncode = useCallback(() => {
    const encodeConfig = { ...config, mode: 'encode' as const };
    setConfig(encodeConfig);
    processBase64Handler(input, encodeConfig);
  }, [input, config, processBase64Handler]);

  const handleDecode = useCallback(() => {
    const decodeConfig = { ...config, mode: 'decode' as const };
    setConfig(decodeConfig);
    processBase64Handler(input, decodeConfig);
  }, [input, config, processBase64Handler]);

  const handleValidate = useCallback(() => {
    if (config.mode === 'decode') {
      processBase64Handler(input, config);
    } else {
      // For encode mode, just show if input is valid text
      processBase64Handler(input, config);
    }
  }, [input, config, processBase64Handler]);

  // File upload handler (only for encode mode)
  const handleFileUpload = useCallback(async (file: File) => {
    if (config.mode !== 'encode') return;
    
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processBase64Handler(content, config);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [config, autoFormat, processBase64Handler]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (config.mode === 'encode') {
      setDragActive(true);
    }
  }, [config.mode]);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (config.mode === 'encode') {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    }
  }, [config.mode, handleFileUpload]);

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
    const filename = config.mode === 'encode' ? 'encoded.txt' : 'decoded.txt';
    downloadFile(output, filename, 'text/plain');
  }, [output, config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: Base64EncoderConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('base64-encoder', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processBase64Handler(input, newConfig);
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  return (
    <div className={`base64-encoder-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleEncode}
              className={`btn ${
                config.mode === 'encode' ? 'btn-primary' : 'btn-outline'
              }`}
              title="Encode text to Base64"
            >
              <span className="icon">🔐</span> Encode
            </button>
            <button
              onClick={handleDecode}
              className={`btn ${
                config.mode === 'decode' ? 'btn-primary' : 'btn-outline'
              }`}
              title="Decode Base64 to text"
            >
              <span className="icon">🔓</span> Decode
            </button>
            <button
              onClick={handleValidate}
              className="btn btn-secondary"
              title="Validate current input"
            >
              <span className="icon">✓</span> Validate
            </button>
            {!autoFormat && (
              <button
                onClick={() => processBase64Handler()}
                disabled={!input.trim() || isLoading}
                className="btn btn-outline"
              >
                {isLoading ? (
                  <span className="loading-spinner" />
                ) : (
                  <span className="icon">⚡</span>
                )} Process
              </button>
            )}
          </div>

          {/* Stats Display */}
          {metadata && !error && output && (
            <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {typeof metadata.inputSize === 'number' && (
                <span><strong>Input:</strong> {metadata.inputSize} chars</span>
              )}
              {typeof metadata.outputSize === 'number' && (
                <span><strong>Output:</strong> {metadata.outputSize} chars</span>
              )}
              {typeof metadata.processingTimeMs === 'number' && (
                <span><strong>Time:</strong> {Math.round(metadata.processingTimeMs)}ms</span>
              )}
            </div>
          )}

          {/* Auto-format toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <input
                type="checkbox"
                checked={autoFormat}
                onChange={(e) => setAutoFormat(e.target.checked)}
                className="form-checkbox"
              />
              Auto-process
            </label>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid-responsive md:grid-cols-1" style={{
        // Responsive grid handled by CSS class

        minHeight: '500px'
      }}>
        {/* Input Panel */}
        <div className="card border-r md:border-r-0 md:border-b">
          <InputPanel
            value={input}
            onChange={handleInputChange}
            placeholder={config.mode === 'encode'
              ? 'Enter text to encode as Base64...'
              : 'Enter Base64 string to decode...'}
            label={config.mode === 'encode' ? 'Text Input' : 'Base64 Input'}
            language="text"
            examples={examples}
            onSelectExample={setInput}
            fileUpload={config.mode === 'encode' ? {
              accept: '.txt,.json',
              onUpload: handleFileUpload
            } : undefined}
            dragAndDrop={config.mode === 'encode' ? {
              accept: ['text/plain', 'application/json'],
              onDrop: handleFileUpload
            } : undefined}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                processBase64Handler();
              }
            }}
            showLineNumbers={false}
            className="h-full"
          />
        </div>

        {/* Output Panel */}
        <div className="card">
          <OutputPanel
            value={output}
            error={error}
            label={config.mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
            language="text"
            isLoading={isLoading}
            onCopy={handleCopy}
            onDownload={handleDownload}
            downloadFilename={config.mode === 'encode' ? 'encoded.txt' : 'decoded.txt'}
            status={{
              type: error ? 'error' : output ? 'success' : 'idle',
              message: error ? 'Invalid Base64' : output ? 'Valid' : undefined
            }}
            showLineNumbers={false}
            className="h-full"
          />
        </div>
      </div>

      {/* Options Panel */}
      <OptionsPanel
        options={ESSENTIAL_OPTIONS}
        advancedOptions={ADVANCED_OPTIONS}
        config={config}
        onChange={handleConfigChange}
        onEssentialChange={handleEssentialConfigChange}
        showAdvanced={showAdvanced}
        onToggleAdvanced={setShowAdvanced}
      />
    </div>
  );
}