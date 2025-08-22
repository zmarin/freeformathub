import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processUrl, type UrlEncoderConfig } from '../../../tools/encoders/url-encoder';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface UrlEncoderProps {
  className?: string;
}

const DEFAULT_CONFIG: UrlEncoderConfig = {
  mode: 'encode',
  encodeSpaces: 'percent',
  encodeReserved: false,
  component: false,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'encode',
    options: [
      { value: 'encode', label: 'Encode (Text → URL)' },
      { value: 'decode', label: 'Decode (URL → Text)' },
    ],
    description: 'Choose encoding or decoding operation',
  },
  {
    key: 'component',
    label: 'Component Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Use encodeURIComponent (for parameters) vs encodeURI (for full URLs)',
  },
  {
    key: 'encodeSpaces',
    label: 'Space Encoding',
    type: 'select' as const,
    default: 'percent',
    options: [
      { value: 'percent', label: 'Percent (%20)' },
      { value: 'plus', label: 'Plus (+)' },
    ],
    description: 'How to encode spaces in URLs',
  },
  {
    key: 'encodeReserved',
    label: 'Encode Reserved',
    type: 'boolean' as const,
    default: false,
    description: 'Encode additional reserved characters (encode mode only)',
  },
];

const ENCODE_EXAMPLES = [
  {
    title: 'URL with Spaces',
    value: 'https://example.com/hello world.html',
  },
  {
    title: 'Query Parameters',
    value: 'name=John Doe&email=john@example.com&message=Hello, World!',
  },
  {
    title: 'Path with Special Chars',
    value: '/api/users/search?q=user name & category',
  },
  {
    title: 'Unicode Characters',
    value: 'café résumé naïve',
  },
];

const DECODE_EXAMPLES = [
  {
    title: 'URL with Encoded Spaces',
    value: 'https%3A//example.com/hello%20world.html',
  },
  {
    title: 'Query Parameters',
    value: 'name%3DJohn%20Doe%26email%3Djohn%40example.com',
  },
  {
    title: 'Plus Encoded Spaces',
    value: 'name=John+Doe&message=Hello+World',
  },
  {
    title: 'Unicode Characters',
    value: 'caf%C3%A9%20r%C3%A9sum%C3%A9%20na%C3%AFve',
  },
];

export function UrlEncoder({ className = '' }: UrlEncoderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<UrlEncoderConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  // Get appropriate examples based on mode
  const examples = useMemo(() => {
    return config.mode === 'encode' ? ENCODE_EXAMPLES : DECODE_EXAMPLES;
  }, [config.mode]);

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: UrlEncoderConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = processUrl(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          
          // Add to history for successful operations
          addToHistory({
            toolId: 'url-encoder',
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

  const handleConfigChange = (newConfig: UrlEncoderConfig) => {
    setConfig(newConfig);
  };

  const inputLabel = config.mode === 'encode' ? 'Text/URL Input' : 'Encoded URL Input';
  const outputLabel = config.mode === 'encode' ? 'URL Encoded Output' : 'Decoded Text';
  const placeholder = config.mode === 'encode' 
    ? 'Enter text or URL to encode...'
    : 'Enter URL encoded string to decode...';

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={inputLabel}
          placeholder={placeholder}
          syntax={config.mode === 'encode' ? 'text' : 'url'}
          examples={examples}
          accept=".txt,.url,.html"
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
        syntax={config.mode === 'encode' ? 'url' : 'text'}
        downloadFilename={
          config.mode === 'encode' ? 'encoded-url.txt' : 'decoded-text.txt'
        }
        downloadContentType="text/plain"
      />
    </div>
  );
}