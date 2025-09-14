import { useState, useEffect, useMemo, useCallback } from 'react';
import { processPasswordGeneration, type PasswordGeneratorConfig } from '../../../tools/crypto/password-generator';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface PasswordGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: PasswordGeneratorConfig = {
  length: 12,
  count: 1,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  customCharacters: '',
  enforceRules: true,
};

// Essential options for common use
const ESSENTIAL_OPTIONS = [
  {
    key: 'length',
    label: 'Length',
    type: 'select' as const,
    default: 12,
    options: [
      { value: '8', label: '8 chars (Basic)' },
      { value: '12', label: '12 chars (Strong)' },
      { value: '16', label: '16 chars (Very Strong)' },
      { value: '20', label: '20 chars (Ultra Secure)' },
    ],
    description: 'Password length',
  },
  {
    key: 'includeUppercase',
    label: 'Uppercase (A-Z)',
    type: 'boolean' as const,
    default: true,
    description: 'Include uppercase letters',
  },
  {
    key: 'includeLowercase',
    label: 'Lowercase (a-z)',
    type: 'boolean' as const,
    default: true,
    description: 'Include lowercase letters',
  },
  {
    key: 'includeNumbers',
    label: 'Numbers (0-9)',
    type: 'boolean' as const,
    default: true,
    description: 'Include numeric digits',
  },
  {
    key: 'includeSymbols',
    label: 'Symbols (!@#$)',
    type: 'boolean' as const,
    default: true,
    description: 'Include special characters',
  },
  {
    key: 'count',
    label: 'Count',
    type: 'select' as const,
    default: 1,
    options: [
      { value: '1', label: '1 password' },
      { value: '5', label: '5 passwords' },
      { value: '10', label: '10 passwords' },
      { value: '25', label: '25 passwords' },
    ],
    description: 'Number of passwords to generate',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'excludeSimilar',
    label: 'Exclude Similar',
    type: 'boolean' as const,
    default: false,
    description: 'Exclude 0/O, 1/l/I for clarity',
  },
  {
    key: 'excludeAmbiguous',
    label: 'Exclude Ambiguous',
    type: 'boolean' as const,
    default: false,
    description: 'Exclude {}[]()\\/"\'`~,;.<>',
  },
  {
    key: 'enforceRules',
    label: 'Enforce Diversity',
    type: 'boolean' as const,
    default: true,
    description: 'Ensure at least one from each set',
  },
  {
    key: 'customCharacters',
    label: 'Custom Characters',
    type: 'text' as const,
    default: '',
    description: 'Additional characters to include',
  },
];

const PRESETS = [
  {
    name: 'Ultra Secure',
    description: '16 chars, all types',
    config: { ...DEFAULT_CONFIG, length: 16, includeSymbols: true, enforceRules: true }
  },
  {
    name: 'Standard',
    description: '12 chars, all types',
    config: { ...DEFAULT_CONFIG, length: 12, includeSymbols: true }
  },
  {
    name: 'Simple',
    description: '8 chars, no symbols',
    config: { ...DEFAULT_CONFIG, length: 8, includeSymbols: false }
  },
  {
    name: 'PIN',
    description: '4 digits only',
    config: { 
      ...DEFAULT_CONFIG, 
      length: 4, 
      includeUppercase: false, 
      includeLowercase: false, 
      includeNumbers: true, 
      includeSymbols: false 
    }
  },
];

export function PasswordGenerator({ className = '' }: PasswordGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<PasswordGeneratorConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('password-generator') as Partial<PasswordGeneratorConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Convert string values from select to numbers
  const processedConfig = useMemo(() => ({
    ...config,
    length: parseInt(String(config.length)) || 12,
    count: parseInt(String(config.count)) || 1,
  }), [config]);

  // Generate passwords function
  const generatePasswords = useCallback((inputText: string = input, cfg: PasswordGeneratorConfig = processedConfig) => {
    // Validate at least one character type is selected
    if (!cfg.includeUppercase && !cfg.includeLowercase && !cfg.includeNumbers && !cfg.includeSymbols && !cfg.customCharacters) {
      setError('Please select at least one character type');
      setOutput('');
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const result = processPasswordGeneration('', cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'password-generator',
        input: `Generate ${cfg.count} password(s) of ${cfg.length} characters`,
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
  }, [input, processedConfig, addToHistory]);

  // Debounced generation for auto-format
  const debouncedGenerate = useMemo(
    () => debounce(generatePasswords, 300),
    [generatePasswords]
  );

  // Auto-generate when config changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedGenerate(input, processedConfig);
    }
  }, [processedConfig, debouncedGenerate, autoFormat, input]);

  // Generate passwords on mount
  useEffect(() => {
    generatePasswords('', processedConfig);
  }, []); // Only run once on mount

  // Quick action handlers
  const handleGenerateStrong = useCallback(() => {
    const strongConfig = { ...processedConfig, length: 16, includeSymbols: true, enforceRules: true };
    setConfig(strongConfig);
    generatePasswords('', strongConfig);
  }, [processedConfig, generatePasswords]);

  const handleGenerateBulk = useCallback(() => {
    const bulkConfig = { ...processedConfig, count: 10 };
    setConfig(bulkConfig);
    generatePasswords('', bulkConfig);
  }, [processedConfig, generatePasswords]);

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
    const filename = processedConfig.count > 1 ? 'passwords.txt' : 'password.txt';
    downloadFile(output, filename, 'text/plain');
  }, [output, processedConfig.count]);

  const handleConfigChange = (newConfig: PasswordGeneratorConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('password-generator', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    generatePasswords('', { ...processedConfig, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  // Strength calculation
  const getStrengthInfo = useCallback(() => {
    const hasMultipleTypes = [
      processedConfig.includeUppercase,
      processedConfig.includeLowercase,
      processedConfig.includeNumbers,
      processedConfig.includeSymbols
    ].filter(Boolean).length;

    let strength = 'Very Weak';
    let color = 'text-red-600 dark:text-red-400';
    let score = 0;

    if (processedConfig.length >= 16 && hasMultipleTypes >= 4) {
      strength = 'Very Strong';
      color = 'text-green-600 dark:text-green-400';
      score = 90;
    } else if (processedConfig.length >= 12 && hasMultipleTypes >= 3) {
      strength = 'Strong';
      color = 'text-blue-600 dark:text-blue-400';
      score = 75;
    } else if (processedConfig.length >= 8 && hasMultipleTypes >= 2) {
      strength = 'Fair';
      color = 'text-yellow-600 dark:text-yellow-400';
      score = 50;
    } else {
      strength = 'Weak';
      color = 'text-orange-600 dark:text-orange-400';
      score = 25;
    }

    return { strength, color, score };
  }, [processedConfig]);

  const strengthInfo = getStrengthInfo();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generatePasswords()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            disabled={isLoading}
            title="Generate new password(s) with current settings"
          >
            {isLoading ? '⏳' : '🔄'} Generate
          </button>
          <button
            onClick={handleGenerateStrong}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate 16-char strong password"
          >
            💪 Generate Strong
          </button>
          <button
            onClick={handleGenerateBulk}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate 10 passwords at once"
          >
            📋 Generate Bulk
          </button>
          {!autoFormat && (
            <button
              onClick={() => generatePasswords()}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? '⏳' : '⚡'} Generate
            </button>
          )}
        </div>

        {/* Auto-format toggle and presets */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
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
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Input/Settings Section */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
          {/* Settings Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Password Settings
            </h3>
            <div className="flex items-center gap-2">
              {/* Preset buttons */}
              <div className="flex gap-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setConfig(preset.config)}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border transition-colors"
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Password Strength Visualization */}
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password Strength
                </span>
                <span className={`text-sm font-semibold ${strengthInfo.color}`}>
                  {strengthInfo.strength}
                </span>
              </div>
              
              {/* Strength Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    strengthInfo.score >= 90 ? 'bg-green-600' :
                    strengthInfo.score >= 75 ? 'bg-blue-600' :
                    strengthInfo.score >= 50 ? 'bg-yellow-600' :
                    strengthInfo.score >= 25 ? 'bg-orange-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${strengthInfo.score}%` }}
                />
              </div>
              
              {/* Metadata */}
              {metadata && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span><strong>Length:</strong> {processedConfig.length} chars</span>
                  <span><strong>Count:</strong> {processedConfig.count}</span>
                  {metadata.totalCombinations && (
                    <span><strong>Combinations:</strong> {metadata.totalCombinations}</span>
                  )}
                  {metadata.characterSets && (
                    <span><strong>Sets:</strong> {metadata.characterSets.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Security recommendations */}
          <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Security Recommendations
            </h4>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Use unique passwords for each account</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Store passwords in a password manager</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Enable two-factor authentication</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400">!</span>
                <span>Use 12+ characters for most accounts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400">!</span>
                <span>Use 16+ characters for sensitive accounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Output Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Generated Passwords
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Generating...</span>}
              {!error && output && <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Ready</span>}
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
                  placeholder="Generated passwords will appear here..."
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
                {option.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof PasswordGeneratorConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof PasswordGeneratorConfig] ?? option.default)}
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
                {ADVANCED_OPTIONS.map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof PasswordGeneratorConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'text' ? (
                      <input
                        type="text"
                        value={String(config[option.key as keyof PasswordGeneratorConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        placeholder={option.description}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
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