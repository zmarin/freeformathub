import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { convertJsonToCsv, type JsonToCsvConfig } from '../../../tools/converters/json-to-csv';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JsonToCsvProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonToCsvConfig = {
  delimiter: ',',
  includeHeaders: true,
  flattenObjects: true,
  arrayHandling: 'stringify',
  nullHandling: 'empty',
  escapeQuotes: true,
};

const OPTIONS = [
  {
    key: 'delimiter',
    label: 'Delimiter',
    type: 'select' as const,
    default: ',',
    options: [
      { value: ',', label: 'Comma (,)' },
      { value: ';', label: 'Semicolon (;)' },
      { value: '\t', label: 'Tab (\\t)' },
      { value: '|', label: 'Pipe (|)' }
    ],
    description: 'CSV field separator'
  },
  {
    key: 'includeHeaders',
    label: 'Include Headers',
    type: 'boolean' as const,
    default: true,
    description: 'Add column headers as first row'
  },
  {
    key: 'flattenObjects',
    label: 'Flatten Objects',
    type: 'boolean' as const,
    default: true,
    description: 'Convert nested objects to dot notation (e.g., user.name)'
  },
  {
    key: 'arrayHandling',
    label: 'Array Handling',
    type: 'select' as const,
    default: 'stringify',
    options: [
      { value: 'stringify', label: 'Stringify (JSON format)' },
      { value: 'separate', label: 'Separate (pipe-separated)' },
      { value: 'ignore', label: 'Ignore (empty)' }
    ],
    description: 'How to handle arrays in JSON objects'
  },
  {
    key: 'nullHandling',
    label: 'Null Values',
    type: 'select' as const,
    default: 'empty',
    options: [
      { value: 'empty', label: 'Empty cells' },
      { value: 'null', label: 'Text "null"' },
      { value: 'skip', label: 'Skip entirely' }
    ],
    description: 'How to handle null/undefined values'
  },
  {
    key: 'escapeQuotes',
    label: 'Escape Quotes',
    type: 'boolean' as const,
    default: true,
    description: 'Properly escape quote characters in values'
  }
];

const QUICK_EXAMPLES = [
  {
    title: 'Simple Array',
    value: JSON.stringify([
      { "name": "John", "age": 30, "city": "New York" },
      { "name": "Jane", "age": 25, "city": "Boston" }
    ], null, 2)
  },
  {
    title: 'Nested Objects',
    value: JSON.stringify([
      {
        "user": { "name": "John", "profile": { "age": 30, "email": "john@example.com" } },
        "active": true
      },
      {
        "user": { "name": "Jane", "profile": { "age": 25, "email": "jane@example.com" } },
        "active": false
      }
    ], null, 2)
  },
  {
    title: 'With Arrays',
    value: JSON.stringify([
      { "name": "John", "skills": ["JavaScript", "Python", "React"], "experience": 5 },
      { "name": "Jane", "skills": ["Java", "Spring", "SQL"], "experience": 3 }
    ], null, 2)
  },
  {
    title: 'Mixed Data Types',
    value: JSON.stringify([
      { "id": 1, "name": "Product A", "price": 29.99, "available": true, "tags": ["new", "featured"] },
      { "id": 2, "name": "Product B", "price": null, "available": false, "tags": ["sale"] }
    ], null, 2)
  }
];

export function JsonToCsv({ className = '' }: JsonToCsvProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsonToCsvConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  const debouncedConvert = useMemo(
    () => debounce((text: string, cfg: JsonToCsvConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        return;
      }

      setIsLoading(true);

      setTimeout(() => {
        try {
          const result = convertJsonToCsv(text, cfg);

          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);

            addToHistory({
              toolId: 'json-to-csv',
              input: text,
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
          setError(err instanceof Error ? err.message : 'Failed to convert JSON to CSV');
        }

        setIsLoading(false);
      }, 200);
    }, 400),
    [addToHistory]
  );

  useEffect(() => {
    debouncedConvert(input, config);
  }, [input, config, debouncedConvert]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JsonToCsvConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.value);
  };

  const getDelimiterName = (delimiter: string): string => {
    switch (delimiter) {
      case ',': return 'comma';
      case ';': return 'semicolon';
      case '\t': return 'tab';
      case '|': return 'pipe';
      default: return 'custom';
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div>
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="JSON Input"
          placeholder={`Enter JSON array or object:

[
  {
    "name": "John",
    "age": 30,
    "city": "New York"
  },
  {
    "name": "Jane",
    "age": 25,
    "city": "Boston"
  }
]`}
          syntax="json"
          examples={QUICK_EXAMPLES}
          onExampleClick={insertExample}
          accept=".json"
          maxLength={1000000}
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
        label={`CSV Output${config.includeHeaders ? ' (with headers)' : ''}`}
        syntax="csv"
        downloadFilename={`converted-${getDelimiterName(config.delimiter)}.csv`}
        downloadContentType="text/csv"
        showLineNumbers={true}
      />
    </div>
  );
}