import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processEncryption, type EncryptionConfig } from '../../../tools/crypto/encryption-tool';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface EncryptionToolProps {
  className?: string;
}

const DEFAULT_CONFIG: EncryptionConfig = {
  operation: 'encrypt',
  algorithm: 'AES-GCM',
  keySize: 256,
  outputFormat: 'base64',
  includeIV: true,
  generateKey: true,
  iterations: 10000,
  saltLength: 16,
};

const BASIC_OPTIONS = [
  {
    key: 'operation',
    label: 'Operation',
    type: 'select' as const,
    default: 'encrypt',
    options: [
      { value: 'encrypt', label: '🔒 Encrypt - Secure your data' },
      { value: 'decrypt', label: '🔓 Decrypt - Recover your data' },
    ],
    description: 'Choose to encrypt or decrypt your data',
  },
  {
    key: 'algorithm',
    label: 'Algorithm',
    type: 'select' as const,
    default: 'AES-GCM',
    options: [
      { value: 'AES-GCM', label: '🛡️ AES-GCM - Recommended' },
      { value: 'AES-CBC', label: '🔐 AES-CBC - Standard' },
      { value: 'AES-CTR', label: '⚡ AES-CTR - Fast' },
      { value: 'simple-cipher', label: '📚 Simple Cipher - Educational' },
    ],
    description: 'Select encryption algorithm',
  },
  {
    key: 'keySize',
    label: 'Key Size',
    type: 'select' as const,
    default: 256,
    options: [
      { value: 128, label: '128-bit - Fast' },
      { value: 192, label: '192-bit - Balanced' },
      { value: 256, label: '256-bit - Maximum Security' },
    ],
    description: 'Choose key strength (higher = more secure)',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'base64',
    options: [
      { value: 'base64', label: 'Base64 - Text friendly' },
      { value: 'hex', label: 'Hexadecimal - Developer friendly' },
    ],
    description: 'Format for encrypted output',
  },
] as const;

const KEY_OPTIONS = [
  {
    key: 'generateKey',
    label: 'Auto-Generate Key',
    type: 'checkbox' as const,
    default: true,
    description: 'Automatically generate a secure random key',
  },
] as const;

export function EncryptionTool({ className = '' }: EncryptionToolProps) {
  const [input, setInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [showKey, setShowKey] = useState(false);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<EncryptionConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: EncryptionConfig, keyValue: string) => {
      if (!inputValue.trim()) {
        setOutput('');
        setMetadata(null);
        setError(null);
        return;
      }

      // For decryption, require a key
      if (currentConfig.operation === 'decrypt' && !keyValue.trim() && !currentConfig.customKey) {
        setError('Decryption requires a key. Please provide the decryption key.');
        setOutput('');
        setMetadata(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await processEncryption(inputValue, currentConfig, keyValue);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setMetadata(result.metadata);
          
          // Add to history with masked sensitive data
          addToHistory({
            toolId: 'encryption-tool',
            input: `[${currentConfig.operation.toUpperCase()} - ${inputValue.length} chars]`,
            output: result.output.substring(0, 100) + (result.output.length > 100 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || `Failed to ${currentConfig.operation} data`);
          setOutput('');
          setMetadata(null);
        }
      } catch (err) {
        setError(`An unexpected error occurred during ${config.operation}`);
        setOutput('');
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('encryption-tool');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config, keyInput);
  }, [input, config, keyInput, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  const copyGeneratedKey = () => {
    if (metadata?.keyGenerated) {
      navigator.clipboard?.writeText(metadata.keyGenerated);
    }
  };

  const copyOutput = () => {
    if (output) {
      navigator.clipboard?.writeText(output);
    }
  };

  // Example texts for testing
  const examples = [
    {
      label: 'Secret Message',
      value: 'This is a confidential message that needs to be encrypted!',
    },
    {
      label: 'Personal Data',
      value: 'Name: John Doe, SSN: 123-45-6789, DOB: 01/01/1990',
    },
    {
      label: 'API Key',
      value: 'api_key_abc123xyz789_secret_token',
    },
    {
      label: 'Credit Card Info',
      value: 'Card: 4532-1234-5678-9012, CVV: 123, Exp: 12/25',
    },
    {
      label: 'Encrypted Data (for decryption)',
      value: 'U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y=',
    },
  ];

  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...KEY_OPTIONS,
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title={config.operation === 'encrypt' ? 'Text to Encrypt' : 'Encrypted Text to Decrypt'}
          value={input}
          onChange={setInput}
          placeholder={
            config.operation === 'encrypt' 
              ? 'Enter text to encrypt...' 
              : 'Enter encrypted text to decrypt...'
          }
          description={
            config.operation === 'encrypt'
              ? 'Enter sensitive text that you want to encrypt'
              : 'Paste the encrypted text you want to decrypt'
          }
          examples={examples}
          onExampleClick={handleExample}
          rows={6}
        />

        {/* Key Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {config.operation === 'encrypt' ? 'Encryption Key' : 'Decryption Key'}
              {config.operation === 'decrypt' && <span className="text-red-500 ml-1">*</span>}
            </label>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showKey ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={
                config.generateKey && config.operation === 'encrypt'
                  ? 'Leave empty to auto-generate key...'
                  : 'Enter your encryption/decryption key...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500">
            {config.operation === 'encrypt' 
              ? 'Provide a key or leave empty to generate one automatically'
              : 'Required: Enter the same key used for encryption'
            }
          </p>
        </div>
        
        <OptionsPanel
          title="Encryption Settings"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Generated Key Display */}
        {metadata?.keyGenerated && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Generated Key</h3>
              <button
                onClick={copyGeneratedKey}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                📋 Copy
              </button>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-mono text-xs break-all">
                {showKey ? metadata.keyGenerated : '••••••••••••••••••••••••••••••••'}
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                ⚠️ Save this key securely! You'll need it to decrypt your data.
              </p>
            </div>
          </div>
        )}

        {/* Metadata Display */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Operation Details</h3>
            <div className="p-3 bg-gray-50 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">Algorithm:</span>
                  <div className="font-medium">{metadata.algorithm}</div>
                </div>
                <div>
                  <span className="text-gray-600">Key Size:</span>
                  <div className="font-medium">{metadata.keySize}-bit</div>
                </div>
                <div>
                  <span className="text-gray-600">Input Size:</span>
                  <div className="font-medium">{metadata.inputSize} bytes</div>
                </div>
                <div>
                  <span className="text-gray-600">Output Size:</span>
                  <div className="font-medium">{metadata.outputSize} bytes</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600">Processing Time:</span>
                <div className="text-xs text-gray-500 mt-1">{metadata.processingTime}ms</div>
              </div>
            </div>
          </div>
        )}

        {/* Security Warning */}
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs">
          <div className="flex items-start gap-2">
            <span className="text-red-600">⚠️</span>
            <div>
              <div className="font-medium text-red-800">Security Notice</div>
              <div className="text-red-700 mt-1">
                This tool is for educational purposes. For production security, use dedicated cryptographic libraries and proper key management systems.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Operation Switch */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleConfigChange('operation', 'encrypt')}
            className={`px-3 py-2 text-xs rounded transition-colors ${
              config.operation === 'encrypt'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔒 Encrypt Mode
          </button>
          <button
            onClick={() => handleConfigChange('operation', 'decrypt')}
            className={`px-3 py-2 text-xs rounded transition-colors ${
              config.operation === 'decrypt'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔓 Decrypt Mode
          </button>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title={config.operation === 'encrypt' ? 'Encrypted Result' : 'Decrypted Result'}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder={
            config.operation === 'encrypt'
              ? 'Enter text to encrypt and see the encrypted result here...'
              : 'Enter encrypted text and the decryption key to see the original text...'
          }
          processingMessage={`${config.operation === 'encrypt' ? 'Encrypting' : 'Decrypting'} data...`}
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={copyOutput}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Result
                </button>
                {metadata?.keyGenerated && (
                  <button
                    onClick={copyGeneratedKey}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    🔑 Copy Key
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}