import { useState, useEffect, useMemo, useCallback } from 'react';
import { processTextCase, type TextCaseConfig } from '../../../tools/text/text-case-converter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface TextCaseConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: TextCaseConfig = {
  targetCase: 'camelcase',
  preserveAcronyms: false,
  customDelimiter: '',
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'targetCase',
    label: 'Case Type',
    type: 'select' as const,
    default: 'camelcase',
    options: [
      { value: 'uppercase', label: 'UPPERCASE' },
      { value: 'lowercase', label: 'lowercase' },
      { value: 'titlecase', label: 'Title Case' },
      { value: 'sentencecase', label: 'Sentence case' },
      { value: 'camelcase', label: 'camelCase' },
      { value: 'pascalcase', label: 'PascalCase' },
      { value: 'kebabcase', label: 'kebab-case' },
      { value: 'snakecase', label: 'snake_case' },
      { value: 'constantcase', label: 'CONSTANT_CASE' },
    ],
    description: 'Choose the target case format',
  },
  {
    key: 'preserveAcronyms',
    label: 'Preserve Acronyms',
    type: 'boolean' as const,
    default: false,
    description: 'Keep acronyms in ALL CAPS (e.g., XMLHttpRequest)',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'dotcase',
    label: 'dot.case',
    type: 'case-button' as const,
    caseValue: 'dotcase',
    description: 'Convert to dot notation',
  },
  {
    key: 'pathcase',
    label: 'path/case',
    type: 'case-button' as const,
    caseValue: 'pathcase',
    description: 'Convert to path notation',
  },
  {
    key: 'alternatingcase',
    label: 'aLtErNaTiNg',
    type: 'case-button' as const,
    caseValue: 'alternatingcase',
    description: 'Alternating character case',
  },
  {
    key: 'inversecase',
    label: 'iNVERSE',
    type: 'case-button' as const,
    caseValue: 'inversecase',
    description: 'Invert character case',
  },
];

const EXAMPLES = [
  {
    title: 'Variable Names',
    value: 'user account settings',
  },
  {
    title: 'Function Names',
    value: 'calculate total price',
  },
  {
    title: 'API Endpoints',
    value: 'get user profile data',
  },
  {
    title: 'CSS Classes',
    value: 'primary button style',
  },
  {
    title: 'Database Columns',
    value: 'created at timestamp',
  },
  {
    title: 'With Acronyms',
    value: 'XML HTTP Request Handler',
  },
  {
    title: 'File Names',
    value: 'user profile image upload',
  },
  {
    title: 'Article Title',
    value: 'the quick brown fox jumps over the lazy dog',
  },
];

export function TextCaseConverter({ className = '' }: TextCaseConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<TextCaseConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('text-case-converter') as Partial<TextCaseConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process text function
  const processText = useCallback((inputText: string = input, cfg: TextCaseConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processTextCase(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'text-case-converter',
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
    () => debounce(processText, 300),
    [processText]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleUpperCase = useCallback(() => {
    const upperConfig = { ...config, targetCase: 'uppercase' as const };
    setConfig(upperConfig);
    processText(input, upperConfig);
  }, [input, config, processText]);

  const handleLowerCase = useCallback(() => {
    const lowerConfig = { ...config, targetCase: 'lowercase' as const };
    setConfig(lowerConfig);
    processText(input, lowerConfig);
  }, [input, config, processText]);

  const handleTitleCase = useCallback(() => {
    const titleConfig = { ...config, targetCase: 'titlecase' as const };
    setConfig(titleConfig);
    processText(input, titleConfig);
  }, [input, config, processText]);

  const handleCamelCase = useCallback(() => {
    const camelConfig = { ...config, targetCase: 'camelcase' as const };
    setConfig(camelConfig);
    processText(input, camelConfig);
  }, [input, config, processText]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processText(content, config);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, config, processText]);

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
    const caseType = config.targetCase.replace('case', '');
    const filename = `converted-${caseType}.txt`;
    downloadFile(output, filename, 'text/plain');
  }, [output, config.targetCase]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: TextCaseConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('text-case-converter', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processText(input, { ...config, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  // Calculate text statistics
  const getTextStats = (text: string) => {
    if (!text) return { chars: 0, words: 0, lines: 0 };
    return {
      chars: text.length,
      words: text.trim().split(/\s+/).filter(w => w.length > 0).length,
      lines: text.split('\n').length,
    };
  };

  const inputStats = getTextStats(input);
  const outputStats = getTextStats(output);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleUpperCase}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert to UPPERCASE"
          >
            UPPER
          </button>
          <button
            onClick={handleLowerCase}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert to lowercase"
          >
            lower
          </button>
          <button
            onClick={handleTitleCase}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert to Title Case"
          >
            Title
          </button>
          <button
            onClick={handleCamelCase}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert to camelCase"
          >
            camelCase
          </button>
          {!autoFormat && (
            <button
              onClick={() => processText()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Converting...' : 'Convert'}
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
            Auto-convert
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
              Text Input
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                Upload
                <input
                  type="file"
                  accept=".txt,.md,.csv"
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
                  Clear
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
              placeholder="Enter text to convert case or drag & drop a file..."
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop text file here
                </div>
              </div>
            )}
          </div>

          {/* Input Stats */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span><strong>Characters:</strong> {inputStats.chars}</span>
              <span><strong>Words:</strong> {inputStats.words}</span>
              <span><strong>Lines:</strong> {inputStats.lines}</span>
            </div>
          </div>

          {/* Example buttons */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Examples:</span>
              {EXAMPLES.slice(0, 4).map((example, idx) => (
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
              Converted Text
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Converting...</span>}
              {!error && output && <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Converted</span>}
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Conversion Error</h4>
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
                  placeholder="Converted text will appear here..."
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Output metadata */}
          {metadata && !error && output && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span><strong>Characters:</strong> {outputStats.chars}</span>
                <span><strong>Words:</strong> {outputStats.words}</span>
                <span><strong>Lines:</strong> {outputStats.lines}</span>
                {metadata.targetCase && (
                  <span><strong>Case:</strong> {metadata.targetCase}</span>
                )}
                {metadata.preservedAcronyms && (
                  <span className="text-blue-600 dark:text-blue-400">
                    <strong>Acronyms preserved</strong>
                  </span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
                {option.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof TextCaseConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof TextCaseConfig] ?? option.default)}
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
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Special Cases</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ADVANCED_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleEssentialConfigChange('targetCase', option.caseValue)}
                    className={`px-3 py-2 text-xs font-mono rounded border transition-colors ${
                      config.targetCase === option.caseValue
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}