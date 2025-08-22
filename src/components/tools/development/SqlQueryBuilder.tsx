import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processSqlQueryBuilder, type SqlQueryBuilderConfig } from '../../../tools/development/sql-query-builder';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface SqlQueryBuilderProps {
  className?: string;
}

const DEFAULT_CONFIG: SqlQueryBuilderConfig = {
  queryType: 'select',
  database: 'mysql',
  formatOutput: true,
  includeComments: true,
  validateSyntax: true,
  generateExamples: false,
  escapeIdentifiers: false,
  uppercaseKeywords: true,
  indentSize: 2,
};

const BASIC_OPTIONS = [
  {
    key: 'queryType',
    label: 'Query Type',
    type: 'select' as const,
    default: 'select',
    options: [
      { value: 'select', label: '📋 SELECT - Query data' },
      { value: 'insert', label: '➕ INSERT - Add new records' },
      { value: 'update', label: '✏️ UPDATE - Modify existing data' },
      { value: 'delete', label: '🗑️ DELETE - Remove records' },
      { value: 'create', label: '🏗️ CREATE - Build tables/indexes' },
      { value: 'custom', label: '⚙️ Custom - Format existing SQL' },
    ],
    description: 'Choose the type of SQL query to generate',
  },
  {
    key: 'database',
    label: 'Database',
    type: 'select' as const,
    default: 'mysql',
    options: [
      { value: 'mysql', label: '=, MySQL' },
      { value: 'postgresql', label: '= PostgreSQL' },
      { value: 'sqlite', label: '>� SQLite' },
      { value: 'mssql', label: '<� SQL Server' },
      { value: 'oracle', label: '=6 Oracle' },
      { value: 'generic', label: '=� Generic SQL' },
    ],
    description: 'Target database system for optimization',
  },
  {
    key: 'formatOutput',
    label: 'Format Output',
    type: 'checkbox' as const,
    default: true,
    description: 'Apply formatting and indentation to generated SQL',
  },
  {
    key: 'uppercaseKeywords',
    label: 'Uppercase Keywords',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert SQL keywords to uppercase (SELECT, FROM, WHERE)',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'includeComments',
    label: 'Include Comments',
    type: 'checkbox' as const,
    default: true,
    description: 'Add helpful comments and metadata to generated SQL',
  },
  {
    key: 'escapeIdentifiers',
    label: 'Escape Identifiers',
    type: 'checkbox' as const,
    default: false,
    description: 'Wrap table/column names in quotes or backticks',
  },
  {
    key: 'generateExamples',
    label: 'Include Examples',
    type: 'checkbox' as const,
    default: false,
    description: 'Add usage examples in comments',
  },
  {
    key: 'indentSize',
    label: 'Indent Size',
    type: 'range' as const,
    default: 2,
    min: 1,
    max: 8,
    step: 1,
    description: 'Number of spaces for indentation',
  },
] as const;

export function SqlQueryBuilder({ className = '' }: SqlQueryBuilderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryInfo, setQueryInfo] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<SqlQueryBuilderConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((inputValue: string, currentConfig: SqlQueryBuilderConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setQueryInfo(null);
        setSuggestions([]);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processSqlQueryBuilder(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setQueryInfo(result.queryInfo);
          setSuggestions(result.suggestions || []);
          
          // Add to history
          addToHistory({
            toolId: 'sql-query-builder',
            input: inputValue,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to build SQL query');
          setOutput('');
          setQueryInfo(null);
          setSuggestions([]);
        }
      } catch (err) {
        setError('An unexpected error occurred while building the query');
        setOutput('');
        setQueryInfo(null);
        setSuggestions([]);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('sql-query-builder');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  // Get examples based on query type
  const getExamples = () => {
    const baseExamples = {
      select: [
        {
          label: 'Basic SELECT',
          value: `table: users
columns: id, name, email
where: status = 'active'
order: name ASC`,
        },
        {
          label: 'JOIN Query',
          value: `table: users
columns: u.name, p.title, p.created_at
joins: INNER JOIN posts p ON u.id = p.user_id
where: p.published = true
order: p.created_at DESC
limit: 20`,
        },
        {
          label: 'Aggregate Query',
          value: `table: orders
columns: user_id, COUNT(*) as order_count, SUM(total) as total_spent
where: created_at >= '2024-01-01'
group: user_id
order: total_spent DESC`,
        },
      ],
      insert: [
        {
          label: 'Single Insert',
          value: `table: products
columns: name, price, category_id, description
values: ('Wireless Mouse', 29.99, 1, 'Ergonomic wireless mouse')`,
        },
        {
          label: 'Batch Insert',
          value: `table: categories
columns: name, description
values: ('Electronics', 'Electronic devices and accessories')
values: ('Books', 'Physical and digital books')
values: ('Clothing', 'Apparel and fashion items')`,
        },
      ],
      update: [
        {
          label: 'Basic Update',
          value: `table: users
set: last_login = NOW(), login_count = login_count + 1
where: id = 123`,
        },
        {
          label: 'Conditional Update',
          value: `table: orders
set: status = 'shipped', shipped_at = NOW()
where: status = 'pending' AND payment_status = 'paid'`,
        },
      ],
      delete: [
        {
          label: 'Conditional Delete',
          value: `table: logs
where: created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        },
        {
          label: 'Soft Delete',
          value: `table: users
set: deleted_at = NOW(), status = 'deleted'
where: id = 456`,
        },
      ],
      custom: [
        {
          label: 'Complex Query to Format',
          value: `SELECT u.id,u.name,p.title,c.name as category FROM users u INNER JOIN posts p ON u.id=p.user_id LEFT JOIN categories c ON p.category_id=c.id WHERE u.active=1 AND p.published=1 ORDER BY p.created_at DESC LIMIT 10`,
        },
      ],
      create: [
        {
          label: 'Create Table',
          value: `CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`,
        },
      ],
    };

    return baseExamples[config.queryType] || baseExamples.select;
  };

  // Get placeholder and description based on query type
  const getInputProps = () => {
    const props = {
      select: {
        placeholder: `table: users
columns: id, name, email
where: status = 'active'
order: created_at DESC
limit: 10`,
        description: 'Describe your SELECT query using the structured format above',
      },
      insert: {
        placeholder: `table: products
columns: name, price, category
values: ('Product Name', 99.99, 'Electronics')`,
        description: 'Define the INSERT statement with table, columns, and values',
      },
      update: {
        placeholder: `table: users
set: last_login = NOW()
where: id = 123`,
        description: 'Specify the UPDATE statement with SET and WHERE clauses',
      },
      delete: {
        placeholder: `table: old_logs
where: created_at < '2024-01-01'`,
        description: 'Define the DELETE statement with WHERE conditions',
      },
      custom: {
        placeholder: 'SELECT * FROM users WHERE active=1 ORDER BY created_at DESC',
        description: 'Paste your existing SQL query to format and analyze',
      },
      create: {
        placeholder: `CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2)
)`,
        description: 'Enter your CREATE TABLE or other DDL statements',
      },
    };

    return props[config.queryType] || props.select;
  };

  const inputProps = getInputProps();
  
  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title={`${config.queryType.toUpperCase()} Query Builder`}
          value={input}
          onChange={setInput}
          placeholder={inputProps.placeholder}
          description={inputProps.description}
          examples={getExamples()}
          onExampleClick={handleExample}
          rows={8}
        />
        
        <OptionsPanel
          title="SQL Generation Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Database-specific info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Database Info</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="font-medium text-blue-800 mb-1">
              Target: {config.database.toUpperCase()}
            </div>
            <div className="text-blue-700">
              {config.database === 'mysql' && 'Supports backticks, AUTO_INCREMENT, ENGINE options'}
              {config.database === 'postgresql' && 'Supports SERIAL, RETURNING, advanced JSON types'}
              {config.database === 'sqlite' && 'Lightweight, supports WITHOUT ROWID, AUTOINCREMENT'}
              {config.database === 'mssql' && 'Supports IDENTITY, TOP, OUTPUT clauses'}
              {config.database === 'oracle' && 'Supports SEQUENCE, DUAL, advanced analytics'}
              {config.database === 'generic' && 'Standard SQL without database-specific features'}
            </div>
          </div>
        </div>

        {/* Query Analysis */}
        {queryInfo && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Query Analysis</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-green-600">Type:</span>
                  <div className="font-medium text-green-800">{queryInfo.type}</div>
                </div>
                <div>
                  <span className="text-green-600">Complexity:</span>
                  <div className="font-medium text-green-800 capitalize">{queryInfo.complexity}</div>
                </div>
              </div>
              {queryInfo.tables.length > 0 && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <span className="text-green-600">Tables:</span>
                  <div className="text-green-700 font-mono text-xs">
                    {queryInfo.tables.join(', ')}
                  </div>
                </div>
              )}
              <div className="mt-2 pt-2 border-t border-green-200 space-y-1">
                {queryInfo.hasJoins && (
                  <div className="text-green-700"> Uses table JOINs</div>
                )}
                {queryInfo.hasSubqueries && (
                  <div className="text-green-700"> Contains subqueries</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Optimization Tips</h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">=�</span>
                    <span className="text-yellow-800">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Query Switcher */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Switch</h3>
          <div className="grid grid-cols-2 gap-1">
            {[
              { type: 'select', icon: '=�', label: 'SELECT' },
              { type: 'insert', icon: '�', label: 'INSERT' },
              { type: 'update', icon: '', label: 'UPDATE' },
              { type: 'delete', icon: '=�', label: 'DELETE' },
            ].map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => handleConfigChange('queryType', type)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  config.queryType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Generated SQL Query"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="sql"
          placeholder="Build your SQL query using the options on the left..."
          processingMessage="Building SQL query..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  =� Copy SQL
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `query_${config.queryType}.sql`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  =� Download .sql
                </button>
                {queryInfo?.query && (
                  <button
                    onClick={() => navigator.clipboard?.writeText(queryInfo.query)}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    =� Copy Clean Query
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