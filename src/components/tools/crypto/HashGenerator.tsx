import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processHash, type HashGeneratorConfig } from '../../../tools/crypto/hash-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface HashGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: HashGeneratorConfig = {
  algorithms: ['MD5', 'SHA-1', 'SHA-256'],
  outputFormat: 'hex',
  includeLength: false,
  uppercaseHex: false,
};

const OPTIONS = [
  {
    key: 'algorithms',
    label: 'Hash Algorithms',
    type: 'multiselect' as const,
    default: ['MD5', 'SHA-1', 'SHA-256'],
    options: [
      { value: 'MD5', label: 'MD5 (deprecated for security)' },
      { value: 'SHA-1', label: 'SHA-1 (deprecated for security)' },
      { value: 'SHA-256', label: 'SHA-256 (recommended)' },
      { value: 'SHA-384', label: 'SHA-384' },
      { value: 'SHA-512', label: 'SHA-512' },
    ],
    description: 'Select which hash algorithms to generate',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'hex',
    options: [
      { value: 'hex', label: 'Hexadecimal' },
      { value: 'base64', label: 'Base64' },
    ],
    description: 'Choose output format for hash values',
  },
  {
    key: 'uppercaseHex',
    label: 'Uppercase Hex',
    type: 'boolean' as const,
    default: false,
    description: 'Use uppercase letters in hexadecimal output',
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

  const { addToHistory } = useToolStore();

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce(async (inputText: string, cfg: HashGeneratorConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        return;
      }

      if (!cfg.algorithms || cfg.algorithms.length === 0) {
        setOutput('');
        setError('Please select at least one hash algorithm');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(async () => {
        try {
          const result = await processHash(inputText, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            
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
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to generate hashes');
        }
        
        setIsLoading(false);
      }, 100);
    }, 300),
    [addToHistory]
  );

  // Process input when it changes
  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: HashGeneratorConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="Text Input"
          placeholder="Enter text to generate hashes..."
          syntax="text"
          examples={EXAMPLES}
          accept=".txt,.json,.md"
        />
        
        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Output Panel */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label="Generated Hashes"
        syntax="text"
        downloadFilename="hashes.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}