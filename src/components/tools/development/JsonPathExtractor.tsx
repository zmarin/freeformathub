import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processJsonPathExtractor, type JsonPathExtractorConfig } from '../../../tools/development/json-path-extractor';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JsonPathExtractorProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonPathExtractorConfig = {
  jsonData: '',
  pathExpression: '',
  outputFormat: 'both',
  flattenArrays: false,
  includeMetadata: true,
  batchMode: false,
  validateJson: true,
  validatePath: true,
  showExamples: false,
  maxResults: 100,
  sortResults: false,
  uniqueOnly: false,
};

const OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'both',
    options: [
      { value: 'values', label: 'Values Only' },
      { value: 'paths', label: 'Paths Only' },
      { value: 'both', label: 'Paths & Values' },
      { value: 'json', label: 'JSON Format' },
    ],
    description: 'How to format the extracted results',
  },
  {
    key: 'batchMode',
    label: 'Batch Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Process multiple JSONPath expressions at once',
  },
  {
    key: 'flattenArrays',
    label: 'Flatten Arrays',
    type: 'boolean' as const,
    default: false,
    description: 'Flatten array results into individual items',
  },
  {
    key: 'includeMetadata',
    label: 'Include Metadata',
    type: 'boolean' as const,
    default: true,
    description: 'Show type information and statistics',
  },
  {
    key: 'sortResults',
    label: 'Sort Results',
    type: 'boolean' as const,
    default: false,
    description: 'Sort results by path name alphabetically',
  },
  {
    key: 'uniqueOnly',
    label: 'Unique Only',
    type: 'boolean' as const,
    default: false,
    description: 'Remove duplicate values from results',
  },
  {
    key: 'maxResults',
    label: 'Max Results',
    type: 'number' as const,
    default: 100,
    min: 1,
    max: 1000,
    description: 'Maximum number of results to return (0 = unlimited)',
  },
  {
    key: 'validateJson',
    label: 'Validate JSON',
    type: 'boolean' as const,
    default: true,
    description: 'Validate JSON syntax before processing',
  },
  {
    key: 'validatePath',
    label: 'Validate Path',
    type: 'boolean' as const,
    default: true,
    description: 'Validate JSONPath expression syntax',
  },
  {
    key: 'showExamples',
    label: 'Show Examples',
    type: 'boolean' as const,
    default: false,
    description: 'Include usage examples in output',
  },
];

const COMMON_PATHS = [
  {
    name: 'Root Properties',
    path: '$.*',
    description: 'Get all top-level properties',
    json: '{"name": "John", "age": 30, "city": "NYC"}'
  },
  {
    name: 'Array Elements',
    path: '$[*]',
    description: 'Get all array elements',
    json: '["apple", "banana", "cherry"]'
  },
  {
    name: 'Nested Property',
    path: '$.user.profile.name',
    description: 'Access deeply nested property',
    json: '{"user": {"profile": {"name": "Alice", "email": "alice@example.com"}}}'
  },
  {
    name: 'Array Index',
    path: '$.items[0]',
    description: 'Get first array element',
    json: '{"items": [{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]}'
  },
  {
    name: 'Filter Query',
    path: '$.products[?(@.price > 100)]',
    description: 'Filter array by condition',
    json: '{"products": [{"name": "Laptop", "price": 999}, {"name": "Mouse", "price": 25}]}'
  },
  {
    name: 'Recursive Search',
    path: '$..name',
    description: 'Find all "name" properties recursively',
    json: '{"users": [{"name": "John", "profile": {"name": "John Doe"}}]}'
  },
  {
    name: 'Array Slice',
    path: '$.items[1:3]',
    description: 'Get array slice (indices 1-2)',
    json: '{"items": ["a", "b", "c", "d", "e"]}'
  },
  {
    name: 'Union Selection',
    path: '$.["name", "email"]',
    description: 'Select multiple properties',
    json: '{"name": "Jane", "email": "jane@example.com", "phone": "123-456-7890"}'
  }
];

export function JsonPathExtractor({ className = '' }: JsonPathExtractorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsonPathExtractorConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    jsonValid: boolean;
    pathValid: boolean;
    resultsCount: number;
    jsonSize: number;
    processingTime: number;
    pathComplexity: 'Simple' | 'Medium' | 'Complex';
    dataStructure: string;
    maxDepth: number;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: JsonPathExtractorConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processJsonPathExtractor(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'json-path-extractor',
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
          setError(err instanceof Error ? err.message : 'Failed to extract JSON path');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 300);
    }, 600),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JsonPathExtractorConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof COMMON_PATHS[0]) => {
    const combined = `${example.json}\n${example.path}`;
    setInput(combined);
    setConfig({ ...config, jsonData: example.json, pathExpression: example.path });
  };

  const generateTestCase = (type: string) => {
    const testCases = {
      simple: `{
  "name": "John Doe",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipcode": "10001"
  }
}
$.name`,
      array: `{
  "users": [
    {"id": 1, "name": "Alice", "role": "admin"},
    {"id": 2, "name": "Bob", "role": "user"},
    {"id": 3, "name": "Charlie", "role": "admin"}
  ]
}
$.users[*].name`,
      filter: `{
  "products": [
    {"name": "Laptop", "price": 999, "category": "electronics"},
    {"name": "Book", "price": 15, "category": "books"},
    {"name": "Phone", "price": 599, "category": "electronics"}
  ]
}
$.products[?(@.price > 100)].name`,
      recursive: `{
  "company": {
    "name": "TechCorp",
    "departments": [
      {
        "name": "Engineering",
        "teams": [
          {"name": "Frontend", "lead": "Alice"},
          {"name": "Backend", "lead": "Bob"}
        ]
      },
      {
        "name": "Marketing",
        "teams": [
          {"name": "Digital", "lead": "Charlie"}
        ]
      }
    ]
  }
}
$..name`
    };
    
    setInput(testCases[type as keyof typeof testCases] || testCases.simple);
  };

  const clearInput = () => {
    setInput('');
    setConfig(DEFAULT_CONFIG);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'text-green-600 dark:text-green-400';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'Complex': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="JSON Data & JSONPath Expression"
          placeholder={`Enter JSON data on first line(s), then JSONPath expression:

{
  "users": [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25}
  ]
}
$.users[*].name

JSONPath Examples:
- Root: $
- Property: $.name
- Array: $[0] or $[*]
- Filter: $[?(@.age > 25)]
- Recursive: $..name
- Slice: $[1:3]`}
          syntax="json"
          examples={[
            {
              title: 'Simple Property',
              value: '{"name": "John", "age": 30}\n$.name',
            },
            {
              title: 'Array Elements',
              value: '{"users": [{"name": "Alice"}, {"name": "Bob"}]}\n$.users[*].name',
            },
            {
              title: 'Filter Query',
              value: '{"products": [{"name": "A", "price": 100}, {"name": "B", "price": 50}]}\n$.products[?(@.price > 75)].name',
            },
          ]}
        />

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => generateTestCase('simple')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Simple Test
            </button>
            <button
              onClick={() => generateTestCase('array')}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Array Test
            </button>
            <button
              onClick={() => generateTestCase('filter')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
            >
              Filter Test
            </button>
            <button
              onClick={() => generateTestCase('recursive')}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              Recursive Test
            </button>
            <button
              onClick={clearInput}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Current Configuration */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Configuration:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Output: {config.outputFormat.toUpperCase()}</div>
              <div>Max Results: {config.maxResults || 'Unlimited'}</div>
              <div>
                Options: {[
                  config.batchMode && 'Batch',
                  config.sortResults && 'Sorted',
                  config.uniqueOnly && 'Unique',
                  config.flattenArrays && 'Flattened',
                ].filter(Boolean).join(', ') || 'Basic'}
              </div>
            </div>
          </div>

          {/* JSONPath Help */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
              JSONPath Quick Reference:
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <div><code>$</code> = root, <code>@</code> = current node, <code>.*</code> = all children</div>
              <div><code>[n]</code> = index, <code>[*]</code> = all, <code>[n:m]</code> = slice</div>
              <div><code>[?(expr)]</code> = filter, <code>..</code> = recursive descent</div>
              <div><code>["a","b"]</code> = union, <code>@.prop</code> = current property</div>
            </div>
          </div>

          {/* Common Paths */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Common JSONPath Examples:
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {COMMON_PATHS.map((example) => (
                <button
                  key={example.name}
                  onClick={() => insertExample(example)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {example.path}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {example.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Extraction Results:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">JSON Valid:</span>
                    <span className={`font-mono ${stats.jsonValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stats.jsonValid ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Path Valid:</span>
                    <span className={`font-mono ${stats.pathValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stats.pathValid ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Results:</span>
                    <span className="font-mono">{stats.resultsCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Complexity:</span>
                    <span className={`font-mono ${getComplexityColor(stats.pathComplexity)}`}>
                      {stats.pathComplexity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Data Type:</span>
                    <span className="font-mono">{stats.dataStructure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                    <span className="font-mono">{stats.processingTime}ms</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  JSON Size: {stats.jsonSize} chars, Max Depth: {stats.maxDepth}
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
        label="JSONPath Extraction Results"
        syntax="text"
        downloadFilename="jsonpath-results.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}