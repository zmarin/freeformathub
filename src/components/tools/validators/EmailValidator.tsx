import { useState, useEffect, useMemo, useCallback } from 'react';
import { validateEmail, type EmailValidatorConfig } from '../../../tools/validators/email-validator';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface EmailValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: EmailValidatorConfig = {
  checkMxRecord: false,
  allowInternational: true,
  strictMode: false,
  checkDisposable: true,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'strictMode',
    label: 'Validation Level',
    type: 'select' as const,
    default: false,
    options: [
      { value: 'false', label: 'Standard validation' },
      { value: 'true', label: 'Strict validation' },
    ],
    description: 'Validation strictness level',
  },
  {
    key: 'checkDisposable',
    label: 'Show Suggestions',
    type: 'boolean' as const,
    default: true,
    description: 'Show warnings for disposable emails',
  },
  {
    key: 'bulkMode',
    label: 'Bulk Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Validate multiple emails (one per line)',
  },
];

// Advanced options
const ADVANCED_OPTIONS = [
  {
    key: 'allowInternational',
    label: 'Allow International Domains',
    type: 'boolean' as const,
    default: true,
    description: 'Accept international domain names (IDN) with Unicode characters',
  },
  {
    key: 'checkMxRecord',
    label: 'Check MX Record',
    type: 'boolean' as const,
    default: false,
    description: 'Verify domain has mail exchange records (requires internet)',
  },
];

const EXAMPLES = [
  {
    title: 'Valid Email',
    value: 'user@example.com',
  },
  {
    title: 'With Plus',
    value: 'test.email+tag@subdomain.domain.org',
  },
  {
    title: 'International',
    value: 'user@тест.com',
  },
  {
    title: 'Bulk Sample',
    value: 'user@example.com\ntest@domain.org\ninvalid-email@\ngood@company.co.uk',
  },
];

export function EmailValidator({ className = '' }: EmailValidatorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<EmailValidatorConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('email-validator') as Partial<EmailValidatorConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
        if ((saved as any).bulkMode !== undefined) {
          setBulkMode((saved as any).bulkMode);
        }
      }
    } catch {}
  }, [getSavedConfig]);

  // Process emails function
  const processEmails = useCallback((inputText: string = input, cfg: EmailValidatorConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      if (bulkMode) {
        // Bulk validation
        const emails = inputText.split('\n').map(e => e.trim()).filter(e => e);
        const results = emails.map(email => ({ email, ...validateEmail(email, cfg) }));
        
        const validCount = results.filter(r => r.success && r.metadata?.valid).length;
        const invalidCount = results.length - validCount;
        
        const outputLines = results.map(result => {
          if (result.success) {
            return result.output;
          } else {
            return `❌ ${result.email}: ${result.error}`;
          }
        });
        
        setOutput(outputLines.join('\n\n---\n\n'));
        setError(undefined);
        setMetadata({
          totalEmails: results.length,
          validEmails: validCount,
          invalidEmails: invalidCount,
          validPercentage: Math.round((validCount / results.length) * 100),
        });
      } else {
        // Single email validation
        const result = validateEmail(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          setMetadata(result.metadata);
        } else {
          setOutput('');
          setError(result.error);
          setMetadata(undefined);
        }
      }
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'email-validator',
        input: inputText,
        output: output,
        config: cfg,
        timestamp: Date.now(),
      });
    } catch (error) {
      setOutput('');
      setError(error instanceof Error ? error.message : 'Validation failed');
      setMetadata(undefined);
    }
    
    setIsLoading(false);
  }, [input, config, bulkMode, addToHistory, output]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processEmails, 500),
    [processEmails]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat, bulkMode]);

  // Quick action handlers
  const handleValidate = useCallback(() => {
    processEmails();
  }, [processEmails]);

  const handleBulkValidate = useCallback(() => {
    setBulkMode(true);
    const newConfig = { ...config, bulkMode: true };
    setConfig(newConfig);
    processEmails(input, newConfig);
  }, [input, config, processEmails]);

  const handleExport = useCallback(() => {
    if (!output) return;
    const filename = bulkMode ? 'bulk-email-validation.txt' : 'email-validation.txt';
    downloadFile(output, filename, 'text/plain');
  }, [output, bulkMode]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setBulkMode(true);
      setInput(content);
      if (autoFormat) {
        processEmails(content, { ...config, bulkMode: true });
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, config, processEmails]);

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

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: EmailValidatorConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('email-validator', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processEmails(input, newConfig);
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    if (key === 'bulkMode') {
      setBulkMode(value);
    }
    const processedValue = key === 'strictMode' ? value === 'true' : value;
    const newConfig = { ...config, [key]: processedValue };
    handleConfigChange(newConfig);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Validate email address"
          >
            ✅ Validate
          </button>
          <button
            onClick={handleBulkValidate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Switch to bulk validation mode"
          >
            📋 Bulk Validate
          </button>
          <button
            onClick={handleExport}
            disabled={!output}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            title="Export validation results"
          >
            💾 Export
          </button>
          {!autoFormat && (
            <button
              onClick={() => processEmails()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? '⏳' : '⚡'} Validate
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
            Auto-validate
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
              {bulkMode ? 'Email List (One per line)' : 'Email Address'}
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
              placeholder={bulkMode 
                ? "Enter multiple email addresses (one per line)...\n\nuser@example.com\ntest@domain.org\nanother@company.com"
                : "Enter email address to validate...\n\nuser@example.com"
              }
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop email file here (.txt, .csv)
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
                  onClick={() => {
                    if (example.title === 'Bulk Sample') {
                      setBulkMode(true);
                    }
                    setInput(example.value);
                  }}
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
              Validation Results
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Validating...</span>}
              {!error && output && !bulkMode && <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Complete</span>}
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
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={handleExport}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    💾 Export
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Validation Error</h4>
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
                  placeholder={bulkMode 
                    ? "Bulk validation results will appear here..."
                    : "Email validation result will appear here..."
                  }
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
                {bulkMode ? (
                  <>
                    <span><strong>Total:</strong> {metadata.totalEmails}</span>
                    <span className="text-green-600 dark:text-green-400">
                      <strong>Valid:</strong> {metadata.validEmails}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      <strong>Invalid:</strong> {metadata.invalidEmails}
                    </span>
                    <span><strong>Success Rate:</strong> {metadata.validPercentage}%</span>
                  </>
                ) : (
                  <>
                    <span><strong>Status:</strong> {metadata.valid ? '✅ Valid' : '❌ Invalid'}</span>
                    {metadata.length && <span><strong>Length:</strong> {metadata.length} chars</span>}
                    {metadata.issues > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        <strong>Issues:</strong> {metadata.issues}
                      </span>
                    )}
                    {metadata.warnings > 0 && (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        <strong>Warnings:</strong> {metadata.warnings}
                      </span>
                    )}
                    {metadata.features && metadata.features.length > 0 && (
                      <span><strong>Features:</strong> {metadata.features.join(', ')}</span>
                    )}
                  </>
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
                      checked={option.key === 'bulkMode' ? bulkMode : !!config[option.key as keyof EmailValidatorConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof EmailValidatorConfig] ?? option.default)}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ADVANCED_OPTIONS.map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      {option.label}
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!config[option.key as keyof EmailValidatorConfig]}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {option.description}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <h5 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Validation Tips</h5>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Valid emails need exactly one @ symbol</li>
                <li>• Domain must have at least one dot</li>
                <li>• Local part can't start/end with dots</li>
                <li>• No consecutive dots allowed</li>
                <li>• Maximum length is 320 characters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}