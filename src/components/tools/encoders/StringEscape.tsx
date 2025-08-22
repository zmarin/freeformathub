import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processStringEscape, type StringEscapeConfig } from '../../../tools/encoders/string-escape';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface StringEscapeProps {
  className?: string;
}

const DEFAULT_CONFIG: StringEscapeConfig = {
  mode: 'escape',
  type: 'javascript',
  preserveLineBreaks: true,
  escapeUnicode: false,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Operation Mode',
    type: 'select' as const,
    default: 'escape',
    options: [
      { value: 'escape', label: 'Escape String' },
      { value: 'unescape', label: 'Unescape String' },
    ],
    description: 'Whether to escape or unescape the input text',
  },
  {
    key: 'type',
    label: 'Escape Type',
    type: 'select' as const,
    default: 'javascript',
    options: [
      { value: 'javascript', label: 'JavaScript/JSON' },
      { value: 'html', label: 'HTML Entities' },
      { value: 'xml', label: 'XML Entities' },
      { value: 'css', label: 'CSS Escaping' },
      { value: 'sql', label: 'SQL Escaping' },
      { value: 'regex', label: 'RegEx Escaping' },
      { value: 'url', label: 'URL Encoding' },
      { value: 'csv', label: 'CSV Escaping' },
      { value: 'python', label: 'Python String' },
    ],
    description: 'Type of string escaping to apply',
  },
  {
    key: 'preserveLineBreaks',
    label: 'Preserve Line Breaks',
    type: 'boolean' as const,
    default: true,
    description: 'Keep actual line breaks instead of converting to \\n',
  },
  {
    key: 'escapeUnicode',
    label: 'Escape Unicode',
    type: 'boolean' as const,
    default: false,
    description: 'Convert non-ASCII characters to Unicode escape sequences',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'JavaScript Quotes',
    input: 'console.log("Hello \'World\'");',
    config: { ...DEFAULT_CONFIG, type: 'javascript', mode: 'escape' }
  },
  {
    name: 'HTML Entities',
    input: '<script>alert("XSS & injection");</script>',
    config: { ...DEFAULT_CONFIG, type: 'html', mode: 'escape' }
  },
  {
    name: 'SQL Injection Protection',
    input: "Robert'); DROP TABLE students;--",
    config: { ...DEFAULT_CONFIG, type: 'sql', mode: 'escape' }
  },
  {
    name: 'URL Parameters',
    input: 'Hello World & Special Characters!',
    config: { ...DEFAULT_CONFIG, type: 'url', mode: 'escape' }
  },
];

export function StringEscape({ className = '' }: StringEscapeProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<StringEscapeConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    originalLength: number;
    processedLength: number;
    escapeCount: number;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: StringEscapeConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processStringEscape(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'string-escape',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
            setStats(null);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to process string');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 100);
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: StringEscapeConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig(example.config);
  };

  const swapModes = () => {
    setConfig(prev => ({
      ...prev,
      mode: prev.mode === 'escape' ? 'unescape' : 'escape'
    }));
  };

  const getTypeDescription = () => {
    const descriptions = {
      javascript: 'Escapes quotes, backslashes, and control characters for JavaScript/JSON strings',
      html: 'Converts special characters to HTML entities (&lt;, &gt;, &amp;, etc.)',
      xml: 'Same as HTML escaping, converts special XML characters to entities',
      css: 'Escapes characters that have special meaning in CSS selectors and values',
      sql: 'Escapes single quotes and special characters to prevent SQL injection',
      regex: 'Escapes RegEx metacharacters so they are treated as literal characters',
      url: 'URL encoding (percent encoding) for safe transmission in URLs',
      csv: 'Wraps in quotes and escapes embedded quotes for CSV format',
      python: 'Python string escaping similar to JavaScript but with Python conventions'
    };
    return descriptions[config.type] || '';
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={`Text to ${config.mode === 'escape' ? 'Escape' : 'Unescape'}`}
          placeholder={`Enter text to ${config.mode}...

Examples:
- JavaScript: "Hello 'World'"
- HTML: <div>Content & more</div>
- SQL: Robert's Database
- URL: Hello World & More!`}
          syntax="text"
          examples={[
            {
              title: 'JavaScript String',
              value: 'console.log("Hello \'World\'");\nvar text = "Line 1\\nLine 2";',
            },
            {
              title: 'HTML Content',
              value: '<div class="example">Hello & welcome to our "amazing" site!</div>',
            },
            {
              title: 'SQL Query',
              value: "SELECT * FROM users WHERE name = 'John O'Connor';",
            },
          ]}
        />

        {/* Mode Toggle & Quick Examples */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 mb-4">
            <button
              onClick={swapModes}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Switch to {config.mode === 'escape' ? 'Unescape' : 'Escape'}
            </button>
          </div>

          {/* Type Description */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {config.type.charAt(0).toUpperCase() + config.type.slice(1)} {config.mode === 'escape' ? 'Escaping' : 'Unescaping'}:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {getTypeDescription()}
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Examples:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  onClick={() => insertExample(example)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {example.input.length > 40 ? example.input.substring(0, 40) + '...' : example.input}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Processing Statistics:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Original:</span>
                    <span className="font-mono">{stats.originalLength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Processed:</span>
                    <span className="font-mono">{stats.processedLength}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Escapes:</span>
                    <span className="font-mono">{stats.escapeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ratio:</span>
                    <span className="font-mono">
                      {stats.originalLength > 0 ? (stats.processedLength / stats.originalLength).toFixed(2) : '0.00'}x
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
        label={`${config.mode === 'escape' ? 'Escaped' : 'Unescaped'} Result`}
        syntax="text"
        downloadFilename={`${config.mode}-${config.type}.txt`}
        downloadContentType="text/plain"
      />
    </div>
  );
}