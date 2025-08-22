import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processTextCase, type TextCaseConfig } from '../../../tools/text/text-case-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface TextCaseConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: TextCaseConfig = {
  targetCase: 'camelcase',
  preserveAcronyms: false,
  customDelimiter: '',
};

const OPTIONS = [
  {
    key: 'targetCase',
    label: 'Target Case',
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
      { value: 'dotcase', label: 'dot.case' },
      { value: 'pathcase', label: 'path/case' },
      { value: 'alternatingcase', label: 'aLtErNaTiNg CaSe' },
      { value: 'inversecase', label: 'iNVERSE cASE' },
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

  const { addToHistory } = useToolStore();

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: TextCaseConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = processTextCase(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          
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
        }
        
        setIsLoading(false);
      }, 50);
    }, 200),
    [addToHistory]
  );

  // Process input when it changes
  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: TextCaseConfig) => {
    setConfig(newConfig);
  };

  const getCasePreview = (caseType: string) => {
    const sample = 'hello world example';
    const previewConfig = { ...config, targetCase: caseType as any };
    const result = processTextCase(sample, previewConfig);
    return result.success ? result.output : sample;
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="Text Input"
          placeholder="Enter text to convert case..."
          syntax="text"
          examples={EXAMPLES}
          accept=".txt,.md"
        />
        
        {/* Quick Convert Buttons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Convert:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'camelcase', label: 'camelCase' },
                { key: 'pascalcase', label: 'PascalCase' },
                { key: 'kebabcase', label: 'kebab-case' },
                { key: 'snakecase', label: 'snake_case' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setConfig(prev => ({ ...prev, targetCase: key as any }))}
                  className={`px-3 py-2 text-xs font-mono rounded border transition-colors ${
                    config.targetCase === key
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
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
        label="Converted Text"
        syntax="text"
        downloadFilename="converted-text.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}