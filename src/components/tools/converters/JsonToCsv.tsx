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
    label: 'CSV Delimiter',
    type: 'select' as const,
    default: ',',
    options: [
      { value: ',', label: 'Comma (,) - Standard' },
      { value: ';', label: 'Semicolon (;) - European' },
      { value: '\t', label: 'Tab (\\t) - TSV Format' },
      { value: '|', label: 'Pipe (|) - Alternative' },
    ],
    description: 'Character used to separate CSV columns',
  },
  {
    key: 'includeHeaders',
    label: 'Include Headers',
    type: 'boolean' as const,
    default: true,
    description: 'Add column names as the first row',
  },
  {
    key: 'flattenObjects',
    label: 'Flatten Nested Objects',
    type: 'boolean' as const,
    default: true,
    description: 'Convert nested objects to flat columns (e.g., user.name)',
  },
  {
    key: 'arrayHandling',
    label: 'Array Handling',
    type: 'select' as const,
    default: 'stringify',
    options: [
      { value: 'stringify', label: 'Stringify - Convert to JSON text' },
      { value: 'separate', label: 'Separate - Join with pipes' },
      { value: 'ignore', label: 'Ignore - Leave empty' },
    ],
    description: 'How to handle arrays within objects',
  },
  {
    key: 'nullHandling',
    label: 'Null Value Handling',
    type: 'select' as const,
    default: 'empty',
    options: [
      { value: 'empty', label: 'Empty - Leave blank cells' },
      { value: 'null', label: 'Null - Write "null" text' },
      { value: 'skip', label: 'Skip - Same as empty' },
    ],
    description: 'How to handle null/undefined values',
  },
  {
    key: 'escapeQuotes',
    label: 'Auto-Escape Quotes',
    type: 'boolean' as const,
    default: true,
    description: 'Automatically escape quotes and special characters',
  },
];

const SAMPLE_JSON = [
  {
    name: 'Simple Array',
    data: '[{"name":"John","age":30,"city":"New York"},{"name":"Jane","age":25,"city":"Boston"}]'
  },
  {
    name: 'Nested Objects',
    data: '[{"user":{"name":"John","profile":{"age":30,"location":"NYC"}},"active":true}]'
  },
  {
    name: 'With Arrays',
    data: '[{"name":"John","skills":["JavaScript","Python"],"experience":5}]'
  },
  {
    name: 'Mixed Data',
    data: '[{"id":1,"user":{"name":"Alice","email":"alice@example.com"},"tags":["admin","active"],"metadata":null}]'
  },
];

export function JsonToCsv({ className = '' }: JsonToCsvProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<JsonToCsvConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ReturnType<typeof convertJsonToCsv> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToHistory } = useToolStore();

  const debouncedConvert = useMemo(
    () => debounce((value: string, config: JsonToCsvConfig) => {
      if (!value.trim()) {
        setResult(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      try {
        const conversionResult = convertJsonToCsv(value, config);
        setResult(conversionResult);
        
        if (conversionResult.success && conversionResult.output) {
          addToHistory({
            tool: 'json-to-csv',
            input: value,
            output: conversionResult.output,
            config
          });
        }
      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Conversion failed'
        });
      } finally {
        setIsProcessing(false);
      }
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    debouncedConvert(input, config);
  }, [input, config, debouncedConvert]);

  const handleSampleClick = (sample: string) => {
    setInput(sample);
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getDownloadFilename = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `converted-data-${timestamp}.csv`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InputPanel
            title="JSON Data"
            value={input}
            onChange={setInput}
            placeholder="Paste your JSON array or object here..."
            language="json"
            height="300px"
            onClear={handleClear}
            footer={
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Sample data:</span>
                  {SAMPLE_JSON.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleClick(sample.data)}
                      className="text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 transition-colors"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
                {isProcessing && (
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Converting JSON to CSV...
                  </div>
                )}
              </div>
            }
          />

          <OutputPanel
            title="CSV Output"
            value={result?.output || ''}
            error={result?.error}
            language="text"
            height="300px"
            isLoading={isProcessing}
            showMetadata={true}
            metadata={result?.metadata}
            downloads={result?.success ? [
              {
                label: 'Download CSV',
                filename: getDownloadFilename(),
                content: result.output || '',
                type: 'text/csv'
              },
              {
                label: 'Download as TXT',
                filename: getDownloadFilename().replace('.csv', '.txt'),
                content: result.output || '',
                type: 'text/plain'
              }
            ] : undefined}
          />
        </div>

        <div className="space-y-6">
          <OptionsPanel
            title="Conversion Options"
            options={OPTIONS}
            values={config}
            onChange={handleConfigChange}
          />

          {result?.metadata && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                CSV Statistics
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rows:</span>
                  <span>{result.metadata.rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Columns:</span>
                  <span>{result.metadata.columns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Size:</span>
                  <span>{(result.metadata.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Delimiter:</span>
                  <span className="font-mono">
                    {result.metadata.delimiter === '\t' ? '\\t' : result.metadata.delimiter}
                  </span>
                </div>
                {result.metadata.headers && result.metadata.headers.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 block mb-1">Columns:</span>
                    <div className="flex flex-wrap gap-1">
                      {result.metadata.headers.slice(0, 10).map((header: string, index: number) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                        >
                          {header}
                        </span>
                      ))}
                      {result.metadata.headers.length > 10 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          +{result.metadata.headers.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
              💡 Conversion Tips
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>• Works best with arrays of objects</li>
              <li>• Enable flattening for nested data</li>
              <li>• Use semicolon for European Excel</li>
              <li>• Arrays become JSON strings by default</li>
              <li>• CSV can be imported to Excel/Sheets</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              🔧 Format Options
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div><strong>Comma:</strong> Standard CSV format</div>
              <div><strong>Semicolon:</strong> European locales</div>
              <div><strong>Tab:</strong> TSV format (Excel friendly)</div>
              <div><strong>Pipe:</strong> Alternative separator</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}