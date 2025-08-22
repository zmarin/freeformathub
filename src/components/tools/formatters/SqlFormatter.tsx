import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processSqlFormatter, type SqlFormatterConfig } from '../../../tools/formatters/sql-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface SqlFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: SqlFormatterConfig = {
  mode: 'beautify',
  indentSize: 2,
  indentType: 'spaces',
  keywordCase: 'upper',
  functionCase: 'upper',
  identifierCase: 'preserve',
  linesBetweenQueries: 1,
  alignCommas: false,
  alignColumns: false,
  breakBeforeComma: false,
  breakAfterJoin: true,
  maxLineLength: 120,
  validateSyntax: true,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'beautify',
    options: [
      { value: 'beautify', label: 'Beautify SQL' },
      { value: 'minify', label: 'Minify SQL' },
    ],
    description: 'Format mode: beautify for readable code or minify for compact output',
  },
  {
    key: 'indentSize',
    label: 'Indent Size',
    type: 'number' as const,
    default: 2,
    min: 1,
    max: 8,
    description: 'Number of spaces or tabs for indentation',
  },
  {
    key: 'indentType',
    label: 'Indent Type',
    type: 'select' as const,
    default: 'spaces',
    options: [
      { value: 'spaces', label: 'Spaces' },
      { value: 'tabs', label: 'Tabs' },
    ],
    description: 'Use spaces or tabs for indentation',
  },
  {
    key: 'keywordCase',
    label: 'Keyword Case',
    type: 'select' as const,
    default: 'upper',
    options: [
      { value: 'upper', label: 'UPPERCASE' },
      { value: 'lower', label: 'lowercase' },
      { value: 'preserve', label: 'Preserve Original' },
    ],
    description: 'Case formatting for SQL keywords (SELECT, FROM, etc.)',
  },
  {
    key: 'functionCase',
    label: 'Function Case',
    type: 'select' as const,
    default: 'upper',
    options: [
      { value: 'upper', label: 'UPPERCASE' },
      { value: 'lower', label: 'lowercase' },
      { value: 'preserve', label: 'Preserve Original' },
    ],
    description: 'Case formatting for SQL functions (COUNT, SUM, etc.)',
  },
  {
    key: 'identifierCase',
    label: 'Identifier Case',
    type: 'select' as const,
    default: 'preserve',
    options: [
      { value: 'upper', label: 'UPPERCASE' },
      { value: 'lower', label: 'lowercase' },
      { value: 'preserve', label: 'Preserve Original' },
    ],
    description: 'Case formatting for table names and column identifiers',
  },
  {
    key: 'breakAfterJoin',
    label: 'Break After JOIN',
    type: 'boolean' as const,
    default: true,
    description: 'Start JOIN clauses on new lines',
  },
  {
    key: 'breakBeforeComma',
    label: 'Break Before Comma',
    type: 'boolean' as const,
    default: false,
    description: 'Place commas at the start of new lines in SELECT lists',
  },
  {
    key: 'linesBetweenQueries',
    label: 'Lines Between Queries',
    type: 'number' as const,
    default: 1,
    min: 0,
    max: 5,
    description: 'Number of empty lines between separate SQL statements',
  },
  {
    key: 'validateSyntax',
    label: 'Validate Syntax',
    type: 'boolean' as const,
    default: true,
    description: 'Check for basic syntax errors and warnings',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Simple SELECT',
    input: `select id, name, email from users where active = 1 order by name;`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify' as const }
  },
  {
    name: 'JOIN Query',
    input: `select u.name, p.title, c.name as category from users u inner join posts p on u.id = p.user_id left join categories c on p.category_id = c.id where u.active = 1 and p.published = 1;`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify' as const }
  },
  {
    name: 'Complex with Subquery',
    input: `SELECT customers.customer_name, orders.order_date, (SELECT COUNT(*) FROM order_items WHERE order_items.order_id = orders.order_id) as item_count FROM customers INNER JOIN orders ON customers.customer_id = orders.customer_id WHERE orders.order_date >= '2023-01-01' ORDER BY orders.order_date DESC;`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify' as const }
  },
  {
    name: 'Multiple Statements',
    input: `CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE); INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com'), ('Jane Smith', 'jane@example.com');`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify' as const, linesBetweenQueries: 2 }
  },
];

export function SqlFormatter({ className = '' }: SqlFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<SqlFormatterConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    lineCount: number;
    queryCount: number;
    tableCount: number;
    errors: Array<{ line: number; column: number; message: string; type: string; code: string }>;
    warnings: Array<{ line: number; column: number; message: string; type: string; code: string }>;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: SqlFormatterConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processSqlFormatter(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'sql-formatter',
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
          setError(err instanceof Error ? err.message : 'Failed to process SQL');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 300);
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: SqlFormatterConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig(example.config);
  };

  const generateRandomQuery = () => {
    const tables = ['users', 'posts', 'categories', 'orders', 'products', 'customers'];
    const columns = ['id', 'name', 'title', 'email', 'created_at', 'updated_at', 'status'];
    const randomTable = tables[Math.floor(Math.random() * tables.length)];
    const randomColumns = columns.slice(0, Math.floor(Math.random() * 4) + 2);
    
    const query = `select ${randomColumns.join(', ')} from ${randomTable} where status = 1 order by created_at desc limit 10;`;
    setInput(query);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="SQL Input"
          placeholder={`Enter SQL code to format:

Examples:
select * from users where active = 1;

SELECT u.name, p.title FROM users u 
JOIN posts p ON u.id = p.user_id 
WHERE u.active = 1;

CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);`}
          syntax="sql"
          examples={[
            {
              title: 'Basic SELECT',
              value: 'select id, name, email from users where active = 1;',
            },
            {
              title: 'JOIN Query',
              value: 'select u.name, p.title from users u inner join posts p on u.id = p.user_id;',
            },
            {
              title: 'Complex Query',
              value: 'SELECT customers.name, (SELECT COUNT(*) FROM orders WHERE customer_id = customers.id) as order_count FROM customers WHERE created_at >= \'2023-01-01\';',
            },
          ]}
        />

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={generateRandomQuery}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Random Query
            </button>
            <button
              onClick={() => setConfig({ ...config, mode: config.mode === 'beautify' ? 'minify' : 'beautify' })}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              {config.mode === 'beautify' ? 'Switch to Minify' : 'Switch to Beautify'}
            </button>
          </div>

          {/* Format Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Settings:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Mode: {config.mode === 'beautify' ? 'Beautify (Format)' : 'Minify (Compress)'}</div>
              <div>Keywords: {config.keywordCase.toUpperCase()}, Functions: {config.functionCase.toUpperCase()}</div>
              <div>Indent: {config.indentSize} {config.indentType}, Validation: {config.validateSyntax ? 'On' : 'Off'}</div>
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
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {example.input.length > 40 ? 
                      example.input.substring(0, 40) + '...' : 
                      example.input
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Processing Results:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Original:</span>
                    <span className="font-mono">{stats.originalSize} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Processed:</span>
                    <span className="font-mono">{stats.processedSize} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ratio:</span>
                    <span className="font-mono">{(stats.compressionRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Lines:</span>
                    <span className="font-mono">{stats.lineCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Queries:</span>
                    <span className="font-mono">{stats.queryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tables:</span>
                    <span className="font-mono">{stats.tableCount}</span>
                  </div>
                </div>
              </div>
              
              {(stats.errors.length > 0 || stats.warnings.length > 0) && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  {stats.errors.length > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400 mb-1">
                      Errors: {stats.errors.length}
                    </div>
                  )}
                  {stats.warnings.length > 0 && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      Warnings: {stats.warnings.length}
                    </div>
                  )}
                </div>
              )}
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
        label={config.mode === 'beautify' ? 'Formatted SQL' : 'Minified SQL'}
        syntax="sql"
        downloadFilename={`sql-${config.mode}.sql`}
        downloadContentType="text/plain"
      />
    </div>
  );
}