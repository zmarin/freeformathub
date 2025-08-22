import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processBase64, type Base64EncoderConfig } from '../../../tools/encoders/base64-encoder';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface Base64EncoderProps {
  className?: string;
}

const DEFAULT_CONFIG: Base64EncoderConfig = {
  mode: 'encode',
  lineBreaks: false,
  urlSafe: false,
};

const OPTIONS = [
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

  const { addToHistory } = useToolStore();

  // Get appropriate examples based on mode
  const examples = useMemo(() => {
    return config.mode === 'encode' ? ENCODE_EXAMPLES : DECODE_EXAMPLES;
  }, [config.mode]);

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: Base64EncoderConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = processBase64(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          
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

  // Clear input/output when mode changes
  useEffect(() => {
    setInput('');
    setOutput('');
    setError(undefined);
  }, [config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: Base64EncoderConfig) => {
    setConfig(newConfig);
  };

  const inputLabel = config.mode === 'encode' ? 'Text Input' : 'Base64 Input';
  const outputLabel = config.mode === 'encode' ? 'Base64 Output' : 'Decoded Text';
  const placeholder = config.mode === 'encode' 
    ? 'Enter text to encode as Base64...'
    : 'Enter Base64 string to decode...';

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={inputLabel}
          placeholder={placeholder}
          syntax={config.mode === 'encode' ? 'text' : 'base64'}
          examples={examples}
          accept=".txt,.json"
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
        label={outputLabel}
        syntax={config.mode === 'encode' ? 'base64' : 'text'}
        downloadFilename={
          config.mode === 'encode' ? 'encoded.txt' : 'decoded.txt'
        }
        downloadContentType="text/plain"
      />
    </div>
  );
}