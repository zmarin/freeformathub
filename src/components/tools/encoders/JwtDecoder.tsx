import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processJwt, type JwtDecoderConfig } from '../../../tools/encoders/jwt-decoder';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JwtDecoderProps {
  className?: string;
}

const DEFAULT_CONFIG: JwtDecoderConfig = {
  validateSignature: true,
  showRawHeader: false,
  showRawPayload: false,
  formatJson: true,
};

const OPTIONS = [
  {
    key: 'formatJson',
    label: 'Format JSON',
    type: 'boolean' as const,
    default: true,
    description: 'Pretty-print JSON with indentation',
  },
  {
    key: 'validateSignature',
    label: 'Show Validation Info',
    type: 'boolean' as const,
    default: true,
    description: 'Display token validation notes and expiration info',
  },
  {
    key: 'showRawHeader',
    label: 'Show Raw Header',
    type: 'boolean' as const,
    default: false,
    description: 'Display the raw Base64 encoded header',
  },
  {
    key: 'showRawPayload',
    label: 'Show Raw Payload',
    type: 'boolean' as const,
    default: false,
    description: 'Display the raw Base64 encoded payload',
  },
];

const EXAMPLES = [
  {
    title: 'Standard JWT',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  },
  {
    title: 'JWT with Expiration',
    value: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IkphbmUgRG9lIiwiZW1haWwiOiJqYW5lQGV4YW1wbGUuY29tIiwiaWF0IjoxNjA5NDU5MjAwLCJleHAiOjE2MDk0NjI4MDAsImF1ZCI6Im15LWFwcCIsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSJ9.signature',
  },
  {
    title: 'JWT with Custom Claims',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsIm5hbWUiOiJBZG1pbiBVc2VyIiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl0sInBlcm1pc3Npb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTQ2MjgwMH0.signature',
  },
  {
    title: 'Minimal JWT',
    value: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.',
  },
];

export function JwtDecoder({ className = '' }: JwtDecoderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JwtDecoderConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: JwtDecoderConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = processJwt(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          
          // Add to history for successful operations
          addToHistory({
            toolId: 'jwt-decoder',
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

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JwtDecoderConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="JWT Token Input"
          placeholder="Paste your JWT token here..."
          syntax="jwt"
          examples={EXAMPLES}
          accept=".jwt,.txt"
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
        label="Decoded JWT"
        syntax="json"
        downloadFilename="decoded-jwt.json"
        downloadContentType="application/json"
      />
    </div>
  );
}