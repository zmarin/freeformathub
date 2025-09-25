import { useState, useEffect, useMemo, useCallback } from 'react';
import { generateEncryptionKeys, type EncryptionKeyConfig } from '../../../tools/crypto/encryption-key-generator';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard, downloadFile } from '../../../lib/utils';

interface EncryptionKeyGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: EncryptionKeyConfig = {
  keySize: 256,
  format: 'base64url',
  count: 1,
  includeEnvFormat: true,
};

// Essential options for key generation
const ESSENTIAL_OPTIONS = [
  {
    key: 'keySize',
    label: 'Key Size',
    type: 'select' as const,
    default: 256,
    options: [
      { value: '128', label: '128-bit (16 bytes)' },
      { value: '192', label: '192-bit (24 bytes)' },
      { value: '256', label: '256-bit (32 bytes) - Recommended' },
      { value: '512', label: '512-bit (64 bytes)' },
    ],
    description: 'Cryptographic key size in bits',
  },
  {
    key: 'format',
    label: 'Output Format',
    type: 'select' as const,
    default: 'base64url',
    options: [
      { value: 'base64url', label: 'URL-Safe Base64' },
      { value: 'base64', label: 'Standard Base64' },
      { value: 'hex', label: 'Hexadecimal' },
      { value: 'raw', label: 'Raw Bytes' },
    ],
    description: 'Key encoding format',
  },
  {
    key: 'count',
    label: 'Number of Keys',
    type: 'select' as const,
    default: 1,
    options: [
      { value: '1', label: '1 key' },
      { value: '3', label: '3 keys' },
      { value: '5', label: '5 keys' },
      { value: '10', label: '10 keys' },
      { value: '25', label: '25 keys' },
    ],
    description: 'Number of keys to generate',
  },
  {
    key: 'includeEnvFormat',
    label: 'Environment Format',
    type: 'boolean' as const,
    default: true,
    description: 'Include .env file format in output',
  },
];

const PRESETS = [
  {
    name: 'JWT Secret',
    description: '256-bit URL-safe for JWT',
    config: { ...DEFAULT_CONFIG, keySize: 256, format: 'base64url', count: 1, includeEnvFormat: true }
  },
  {
    name: 'API Keys',
    description: '256-bit hex format',
    config: { ...DEFAULT_CONFIG, keySize: 256, format: 'hex', count: 1, includeEnvFormat: true }
  },
  {
    name: 'Multiple Envs',
    description: '3 keys for dev/staging/prod',
    config: { ...DEFAULT_CONFIG, keySize: 256, format: 'base64url', count: 3, includeEnvFormat: true }
  },
  {
    name: 'High Security',
    description: '512-bit maximum security',
    config: { ...DEFAULT_CONFIG, keySize: 512, format: 'base64url', count: 1, includeEnvFormat: true }
  },
];

export function EncryptionKeyGenerator({ className = '' }: EncryptionKeyGeneratorProps) {
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<EncryptionKeyConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('encryption-key-generator') as Partial<EncryptionKeyConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Convert string values from select to numbers
  const processedConfig = useMemo(() => ({
    ...config,
    keySize: parseInt(String(config.keySize)) as 128 | 192 | 256 | 512,
    count: parseInt(String(config.count)) || 1,
  }), [config]);

  // Generate keys function
  const generateKeys = useCallback(async (cfg: EncryptionKeyConfig = processedConfig) => {
    setIsLoading(true);
    setCopied(false);

    try {
      const result = await generateEncryptionKeys(cfg);

      if (result.success) {
        setOutput(result.output || '');
        setError(undefined);
        setMetadata(result.metadata);

        // Add to history for successful operations
        addToHistory({
          toolId: 'encryption-key-generator',
          input: `Generate ${cfg.count} ${cfg.keySize}-bit key(s) in ${cfg.format} format`,
          output: result.output || '',
          config: cfg,
          timestamp: Date.now(),
        });

        // Save current config
        updateSavedConfig?.('encryption-key-generator', cfg);
      } else {
        setError(result.error);
        setOutput('');
        setMetadata(undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate keys');
      setOutput('');
      setMetadata(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [processedConfig, addToHistory, updateSavedConfig]);

  // Auto-generate when config changes
  useEffect(() => {
    if (autoGenerate) {
      generateKeys();
    }
  }, [autoGenerate, generateKeys]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (output) {
      try {
        await copyToClipboard(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        navigator.clipboard?.writeText(output);
      }
    }
  }, [output]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (output) {
      const extension = config.format === 'hex' ? 'txt' : 'env';
      downloadFile(output, `encryption-keys.${extension}`, 'text/plain');
    }
  }, [output, config.format]);

  // Handle quick actions
  const handleGenerateJWT = useCallback(() => {
    const jwtConfig = { ...DEFAULT_CONFIG, keySize: 256, format: 'base64url', count: 1, includeEnvFormat: true } as EncryptionKeyConfig;
    setConfig(jwtConfig);
    generateKeys(jwtConfig);
  }, [generateKeys]);

  const handleGenerateAPI = useCallback(() => {
    const apiConfig = { ...DEFAULT_CONFIG, keySize: 256, format: 'hex', count: 1, includeEnvFormat: true } as EncryptionKeyConfig;
    setConfig(apiConfig);
    generateKeys(apiConfig);
  }, [generateKeys]);

  const handleGenerateMultiple = useCallback(() => {
    const multiConfig = { ...DEFAULT_CONFIG, keySize: 256, format: 'base64url', count: 3, includeEnvFormat: true } as EncryptionKeyConfig;
    setConfig(multiConfig);
    generateKeys(multiConfig);
  }, [generateKeys]);

  // Update config
  const updateConfig = useCallback((key: keyof EncryptionKeyConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // Get security info based on key size
  const getSecurityInfo = useMemo(() => {
    let level: string;
    let color: string;
    let score: number;
    let description: string;

    if (processedConfig.keySize >= 512) {
      level = 'Maximum';
      color = 'text-purple-600';
      score = 100;
      description = 'Quantum-resistant security level';
    } else if (processedConfig.keySize >= 256) {
      level = 'High';
      color = 'text-green-600';
      score = 90;
      description = 'Industry standard for production';
    } else if (processedConfig.keySize >= 192) {
      level = 'Medium';
      color = 'text-blue-600';
      score = 70;
      description = 'Adequate for most applications';
    } else {
      level = 'Basic';
      color = 'text-orange-600';
      score = 50;
      description = 'Consider upgrading to 256-bit';
    }

    return { level, color, score, description };
  }, [processedConfig.keySize]);

  const securityInfo = getSecurityInfo;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div >
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generateKeys()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            disabled={isLoading}
            title="Generate new key(s) with current settings"
          >
            {isLoading ? '⏳' : '🔄'} Generate
          </button>
          <button
            onClick={handleGenerateJWT}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate JWT secret key"
          >
            🔑 JWT Secret
          </button>
          <button
            onClick={handleGenerateAPI}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate API key in hex format"
          >
            🌐 API Key
          </button>
          <button
            onClick={handleGenerateMultiple}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Generate 3 keys for different environments"
          >
            📋 Multiple Keys
          </button>
        </div>

        {/* Auto-generate toggle */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <label >
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="rounded"
              />
              Auto-generate
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Settings Section */}
        <div >
          {/* Settings Header */}
          <div >
            <h3 >
              Key Generation Settings
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

          {/* Security Level Visualization */}
          <div >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span >
                  Security Level
                </span>
                <span className={`text-sm font-semibold ${securityInfo.color}`}>
                  {securityInfo.level}
                </span>
              </div>

              {/* Security Bar */}
              <div >
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    securityInfo.score >= 90 ? 'bg-green-600' :
                    securityInfo.score >= 70 ? 'bg-blue-600' :
                    securityInfo.score >= 50 ? 'bg-orange-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${securityInfo.score}%` }}
                />
              </div>

              <p >
                {securityInfo.description}
              </p>

              {/* Metadata */}
              {metadata && (
                <div >
                  <span><strong>Key Size:</strong> {processedConfig.keySize} bits</span>
                  <span><strong>Format:</strong> {processedConfig.format}</span>
                  <span><strong>Count:</strong> {processedConfig.count}</span>
                  <span><strong>Entropy:</strong> {metadata.entropyBits} bits</span>
                  {metadata.generationTime && (
                    <span><strong>Generated in:</strong> {metadata.generationTime}ms</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Configuration Options */}
          <div >
            <div className="space-y-4">
              {ESSENTIAL_OPTIONS.map((option) => (
                <div key={option.key} className="space-y-1">
                  <label >
                    {option.label}
                  </label>
                  {option.type === 'select' ? (
                    <select
                      value={String(config[option.key as keyof EncryptionKeyConfig])}
                      onChange={(e) => updateConfig(option.key as keyof EncryptionKeyConfig,
                        option.key === 'keySize' || option.key === 'count' ? parseInt(e.target.value) : e.target.value
                      )}
                      
                    >
                      {option.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : option.type === 'boolean' ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(config[option.key as keyof EncryptionKeyConfig])}
                        onChange={(e) => updateConfig(option.key as keyof EncryptionKeyConfig, e.target.checked)}
                        className="rounded"
                      />
                      <span >{option.description}</span>
                    </label>
                  ) : null}
                  {option.description && option.type !== 'boolean' && (
                    <p >
                      {option.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Usage Tips */}
          <div >
            <h4 >
              Usage Tips
            </h4>
            <div >
              <div className="flex items-start gap-2">
                <span >✓</span>
                <span>Use 256-bit keys for production applications</span>
              </div>
              <div className="flex items-start gap-2">
                <span >✓</span>
                <span>URL-safe Base64 is ideal for environment variables</span>
              </div>
              <div className="flex items-start gap-2">
                <span >✓</span>
                <span>Store keys securely and never commit to version control</span>
              </div>
              <div className="flex items-start gap-2">
                <span >!</span>
                <span>Rotate keys regularly for enhanced security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Output Header */}
          <div >
            <h3 >
              Generated Keys
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
                  <span>⚠️</span>
                  <span className="font-medium text-sm">Generation Error</span>
                </div>
                <p >{error}</p>
              </div>
            ) : output ? (
              <div className="h-full">
                <pre >
                  {output}
                </pre>
              </div>
            ) : (
              <div className="p-4 h-full flex items-center justify-center">
                <div >
                  <div className="text-4xl mb-4">🔑</div>
                  <p className="text-sm font-medium">No keys generated yet</p>
                  <p className="text-xs mt-1">Click "Generate" or enable auto-generate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}