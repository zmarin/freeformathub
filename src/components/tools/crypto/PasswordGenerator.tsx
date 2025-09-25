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
    let color = 'text-red-600';
    let score = 0;

    if (processedConfig.length >= 16 && hasMultipleTypes >= 4) {
      strength = 'Very Strong';
      color = 'text-green-600';
      score = 90;
    } else if (processedConfig.length >= 12 && hasMultipleTypes >= 3) {
      strength = 'Strong';
      color = 'text-blue-600';
      score = 75;
    } else if (processedConfig.length >= 8 && hasMultipleTypes >= 2) {
      strength = 'Fair';
      color = 'text-yellow-600';
      score = 50;
    } else {
      strength = 'Weak';
      color = 'text-orange-600';
      score = 25;
    }

    return { strength, color, score };
  }, [processedConfig]);

  const strengthInfo = getStrengthInfo();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div >
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
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Input/Settings Section */}
        <div >
          {/* Settings Header */}
          <div >
            <h3 >
              Password Settings
            </h3>
            <div className="flex items-center gap-2">
              {/* Preset buttons */}
              <div className="flex gap-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setConfig(preset.config)}
                    
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Password Strength Visualization */}
          <div >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span >
                  Password Strength
                </span>
                <span className={`text-sm font-semibold ${strengthInfo.color}`}>
                  {strengthInfo.strength}
                </span>
              </div>
              
              {/* Strength Bar */}
              <div >
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
                <div >
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
          <div >
            <h4 >
              Security Recommendations
            </h4>
            <div >
              <div className="flex items-start gap-2">
                <span >✓</span>
                <span>Use unique passwords for each account</span>
              </div>
              <div className="flex items-start gap-2">
                <span >✓</span>
                <span>Store passwords in a password manager</span>
              </div>
              <div className="flex items-start gap-2">
                <span >✓</span>
                <span>Enable two-factor authentication</span>
              </div>
              <div className="flex items-start gap-2">
                <span >!</span>
                <span>Use 12+ characters for most accounts</span>
              </div>
              <div className="flex items-start gap-2">
                <span >!</span>
                <span>Use 16+ characters for sensitive accounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Output Header */}
          <div >
            <h3 >
              Generated Passwords
              {isLoading && <span >Generating...</span>}
              {!error && output && <span >✓ Ready</span>}
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
                  placeholder="Generated passwords will appear here..."
                  
                  spellCheck={false}
                />
              </div>
            )}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label >
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
                    <span >
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof PasswordGeneratorConfig] ?? option.default)}
                    onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                    
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
            <div >
              <h5 >Advanced Options</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADVANCED_OPTIONS.map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label >
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
                        <span >
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'text' ? (
                      <input
                        type="text"
                        value={String(config[option.key as keyof PasswordGeneratorConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        placeholder={option.description}
                        
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