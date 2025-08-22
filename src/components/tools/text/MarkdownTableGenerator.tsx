import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processMarkdownTableGenerator, type MarkdownTableGeneratorConfig } from '../../../tools/text/markdown-table-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface MarkdownTableGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: MarkdownTableGeneratorConfig = {
  inputFormat: 'csv',
  alignment: 'left',
  includeHeaders: true,
  sortColumn: -1,
  sortDirection: 'none',
  escapeHtml: true,
  compactMode: false,
  addRowNumbers: false,
  maxColumnWidth: 0,
};

const BASIC_OPTIONS = [
  {
    key: 'inputFormat',
    label: 'Input Format',
    type: 'select' as const,
    default: 'csv',
    options: [
      { value: 'csv', label: '=� CSV - Comma-separated values' },
      { value: 'tsv', label: '=� TSV - Tab-separated values' },
      { value: 'json', label: '= JSON - Array of objects' },
      { value: 'manual', label: ' Manual - Pipe-separated or plain text' },
    ],
    description: 'Format of your input data',
  },
  {
    key: 'alignment',
    label: 'Column Alignment',
    type: 'select' as const,
    default: 'left',
    options: [
      { value: 'left', label: ' Left align all columns' },
      { value: 'center', label: '� Center align all columns' },
      { value: 'right', label: '� Right align all columns' },
      { value: 'mixed', label: '= Mixed - alternate alignment' },
    ],
    description: 'Text alignment for table columns',
  },
  {
    key: 'includeHeaders',
    label: 'Include Headers',
    type: 'checkbox' as const,
    default: true,
    description: 'Include header row in the markdown table',
  },
  {
    key: 'addRowNumbers',
    label: 'Add Row Numbers',
    type: 'checkbox' as const,
    default: false,
    description: 'Add a "#" column with row numbers',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'escapeHtml',
    label: 'Escape HTML',
    type: 'checkbox' as const,
    default: true,
    description: 'Escape special characters for safe markdown',
  },
  {
    key: 'compactMode',
    label: 'Compact Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Generate compact table without extra spaces',
  },
  {
    key: 'sortColumn',
    label: 'Sort Column',
    type: 'number' as const,
    default: -1,
    min: -1,
    max: 20,
    description: 'Column index to sort by (-1 = no sorting, 0 = first column)',
  },
  {
    key: 'sortDirection',
    label: 'Sort Direction',
    type: 'select' as const,
    default: 'none',
    options: [
      { value: 'none', label: 'No sorting' },
      { value: 'asc', label: ' Ascending' },
      { value: 'desc', label: ' Descending' },
    ],
    description: 'Sort direction for the selected column',
  },
  {
    key: 'maxColumnWidth',
    label: 'Max Column Width',
    type: 'range' as const,
    default: 0,
    min: 0,
    max: 100,
    step: 5,
    description: 'Maximum width per column (0 = unlimited)',
  },
] as const;

export function MarkdownTableGenerator({ className = '' }: MarkdownTableGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<MarkdownTableGeneratorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((inputValue: string, currentConfig: MarkdownTableGeneratorConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setTableData(null);
        setStats(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processMarkdownTableGenerator(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setTableData(result.tableData);
          setStats(result.stats);
          
          // Add to history
          addToHistory({
            toolId: 'markdown-table-generator',
            input: inputValue,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate markdown table');
          setOutput('');
          setTableData(null);
          setStats(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while generating the table');
        setOutput('');
        setTableData(null);
        setStats(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('markdown-table-generator');
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

  // Get examples based on input format
  const getExamples = () => {
    const examples = {
      csv: [
        {
          label: 'Employee Data',
          value: `Name,Position,Salary,Department
John Doe,Developer,75000,Engineering
Jane Smith,Designer,65000,Design
Mike Johnson,Manager,85000,Engineering
Sarah Wilson,Analyst,60000,Marketing`,
        },
        {
          label: 'Product Inventory',
          value: `Product,SKU,Price,Stock,Category
Laptop Pro,LP001,1299,25,Electronics
Wireless Mouse,WM002,29.99,150,Accessories
USB-C Cable,UC003,12.99,200,Cables
Monitor Stand,MS004,45.99,75,Accessories`,
        },
        {
          label: 'Project Status',
          value: `Task,Status,Priority,Assignee,Due Date
User Authentication,Complete,High,John,2024-01-15
Dashboard Design,In Progress,Medium,Jane,2024-01-20
API Integration,Pending,High,Mike,2024-01-25`,
        },
      ],
      json: [
        {
          label: 'User Profiles',
          value: `[
  {
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "Admin",
    "active": true
  },
  {
    "name": "Bob Smith",
    "email": "bob@example.com", 
    "role": "User",
    "active": false
  }
]`,
        },
        {
          label: 'Sales Data',
          value: `[
  {
    "quarter": "Q1 2024",
    "revenue": 125000,
    "customers": 450,
    "growth": "15%"
  },
  {
    "quarter": "Q2 2024", 
    "revenue": 142000,
    "customers": 520,
    "growth": "18%"
  }
]`,
        },
      ],
      tsv: [
        {
          label: 'Tab-Separated Data',
          value: `Country	Capital	Population	Area
USA	Washington	331000000	9833517
Canada	Ottawa	38000000	9984670
Mexico	Mexico City	128000000	1964375`,
        },
      ],
      manual: [
        {
          label: 'Feature Comparison',
          value: `Feature | Basic Plan | Pro Plan | Enterprise
Storage | 10GB | 100GB | Unlimited
Users | 5 | 25 | Unlimited
Support | Email | Email + Chat | 24/7 Phone
API Access | No | Yes | Yes`,
        },
        {
          label: 'Simple List',
          value: `Task 1: Complete project setup
Task 2: Design user interface  
Task 3: Implement backend API
Task 4: Write unit tests
Task 5: Deploy to production`,
        },
      ],
    };

    return examples[config.inputFormat] || examples.csv;
  };

  const getPlaceholder = () => {
    const placeholders = {
      csv: 'Name,Age,City\nJohn,25,New York\nJane,30,San Francisco',
      json: '[{"name": "John", "age": 25}, {"name": "Jane", "age": 30}]',
      tsv: 'Name\tAge\tCity\nJohn\t25\tNew York',
      manual: 'Name | Age | City\nJohn | 25 | New York\nJane | 30 | San Francisco',
    };
    
    return placeholders[config.inputFormat];
  };

  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...ADVANCED_OPTIONS.filter(option => {
      if (option.key === 'sortDirection') {
        return config.sortColumn >= 0;
      }
      return true;
    }),
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title={`${config.inputFormat.toUpperCase()} Data Input`}
          value={input}
          onChange={setInput}
          placeholder={getPlaceholder()}
          description={`Enter your ${config.inputFormat.toUpperCase()} data to convert to a markdown table`}
          examples={getExamples()}
          onExampleClick={handleExample}
          rows={12}
          language={config.inputFormat === 'json' ? 'json' : 'text'}
        />
        
        <OptionsPanel
          title="Table Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Table Statistics */}
        {stats && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Table Statistics</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-blue-600">Columns:</span>
                  <div className="font-medium text-blue-800">{stats.columnCount}</div>
                </div>
                <div>
                  <span className="text-blue-600">Rows:</span>
                  <div className="font-medium text-blue-800">{stats.rowCount}</div>
                </div>
                <div>
                  <span className="text-blue-600">Total Cells:</span>
                  <div className="font-medium text-blue-800">{stats.totalCells}</div>
                </div>
                <div>
                  <span className="text-blue-600">Avg Row Length:</span>
                  <div className="font-medium text-blue-800">{stats.avgRowLength}</div>
                </div>
              </div>
              {(stats.emptyColumns > 0 || stats.emptyRows > 0) && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="text-orange-600 text-xs">
                    {stats.emptyColumns > 0 && <div>Empty columns: {stats.emptyColumns}</div>}
                    {stats.emptyRows > 0 && <div>Empty rows: {stats.emptyRows}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table Preview Info */}
        {tableData && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Table Preview</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div>
                  <span className="text-green-600">Headers:</span>
                  <div className="text-green-700 font-mono text-xs">
                    {tableData.headers.slice(0, 3).join(', ')}
                    {tableData.headers.length > 3 && '...'}
                  </div>
                </div>
                <div>
                  <span className="text-green-600">Dimensions:</span>
                  <div className="text-green-700">
                    {tableData.columnCount} columns � {tableData.rowCount} rows
                  </div>
                </div>
                <div>
                  <span className="text-green-600">Format:</span>
                  <div className="text-green-700">
                    {config.alignment} aligned, {config.compactMode ? 'compact' : 'spaced'} mode
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Format Guide */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Input Format Guide</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800">CSV Format</div>
              <div className="text-gray-600 font-mono">Name,Age,City</div>
              <div className="text-gray-500">Comma-separated, quotes for text with commas</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800">JSON Format</div>
              <div className="text-gray-600 font-mono">{`[{"key": "value"}]`}</div>
              <div className="text-gray-500">Array of objects with consistent keys</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800">Manual Format</div>
              <div className="text-gray-600 font-mono">Col1 | Col2 | Col3</div>
              <div className="text-gray-500">Pipe-separated or plain text lines</div>
            </div>
          </div>
        </div>

        {/* Quick Format Switcher */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Format</h3>
          <div className="grid grid-cols-2 gap-1">
            {[
              { format: 'csv', icon: '=�', label: 'CSV' },
              { format: 'json', icon: '=', label: 'JSON' },
              { format: 'tsv', icon: '=�', label: 'TSV' },
              { format: 'manual', icon: '', label: 'Manual' },
            ].map(({ format, icon, label }) => (
              <button
                key={format}
                onClick={() => handleConfigChange('inputFormat', format)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  config.inputFormat === format
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
          title="Generated Markdown Table"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Enter data in the selected format to generate a markdown table..."
          processingMessage="Generating markdown table..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  =� Copy Table
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `table-${config.inputFormat}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  =� Download .md
                </button>
                {tableData && (
                  <button
                    onClick={() => {
                      // Generate HTML table for preview
                      let html = '<table border="1" style="border-collapse: collapse;">\n';
                      
                      if (config.includeHeaders) {
                        html += '  <thead>\n    <tr>\n';
                        tableData.headers.forEach((header: string) => {
                          html += `      <th>${header}</th>\n`;
                        });
                        html += '    </tr>\n  </thead>\n';
                      }
                      
                      html += '  <tbody>\n';
                      tableData.rows.forEach((row: string[]) => {
                        html += '    <tr>\n';
                        row.forEach((cell: string) => {
                          html += `      <td>${cell}</td>\n`;
                        });
                        html += '    </tr>\n';
                      });
                      html += '  </tbody>\n</table>';
                      
                      const blob = new Blob([html], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `table-preview.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    =� Export HTML
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