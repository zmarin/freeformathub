import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processApiRequestBuilder, type ApiRequestBuilderConfig } from '../../../tools/web/api-request-builder';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface ApiRequestBuilderProps {
  className?: string;
}

const DEFAULT_CONFIG: ApiRequestBuilderConfig = {
  method: 'GET',
  outputFormat: 'curl',
  includeHeaders: true,
  includeAuth: true,
  formatJson: true,
  includeComments: true,
  generateTests: false,
  useAsync: true,
  timeout: 30,
};

const BASIC_OPTIONS = [
  {
    key: 'method',
    label: 'HTTP Method',
    type: 'select' as const,
    default: 'GET',
    options: [
      { value: 'GET', label: '📋 GET - Retrieve data' },
      { value: 'POST', label: '➕ POST - Create new resource' },
      { value: 'PUT', label: '✏️ PUT - Update entire resource' },
      { value: 'PATCH', label: '🔧 PATCH - Partial update' },
      { value: 'DELETE', label: '🗑️ DELETE - Remove resource' },
      { value: 'HEAD', label: '🗂️ HEAD - Get headers only' },
      { value: 'OPTIONS', label: '⚙️ OPTIONS - Get allowed methods' },
    ],
    description: 'HTTP method for the request',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'curl',
    options: [
      { value: 'curl', label: '=� cURL - Command line' },
      { value: 'fetch', label: '< Fetch API - Native JavaScript' },
      { value: 'axios', label: '=� Axios - HTTP client library' },
      { value: 'xhr', label: '= XMLHttpRequest - Legacy JS' },
      { value: 'postman', label: '=� Postman - Collection JSON' },
    ],
    description: 'Format for the generated request code',
  },
  {
    key: 'useAsync',
    label: 'Async/Await',
    type: 'checkbox' as const,
    default: true,
    description: 'Use async/await syntax for JavaScript code',
  },
  {
    key: 'formatJson',
    label: 'Format JSON',
    type: 'checkbox' as const,
    default: true,
    description: 'Pretty-print JSON request bodies',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'includeComments',
    label: 'Include Comments',
    type: 'checkbox' as const,
    default: true,
    description: 'Add helpful comments to generated code',
  },
  {
    key: 'generateTests',
    label: 'Generate Tests',
    type: 'checkbox' as const,
    default: false,
    description: 'Include usage examples and error handling',
  },
  {
    key: 'timeout',
    label: 'Timeout (seconds)',
    type: 'range' as const,
    default: 30,
    min: 5,
    max: 300,
    step: 5,
    description: 'Request timeout in seconds',
  },
] as const;

export function ApiRequestBuilder({ className = '' }: ApiRequestBuilderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<ApiRequestBuilderConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((inputValue: string, currentConfig: ApiRequestBuilderConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setRequestInfo(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processApiRequestBuilder(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setRequestInfo(result.request);
          
          // Add to history
          addToHistory({
            toolId: 'api-request-builder',
            input: inputValue,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to build API request');
          setOutput('');
          setRequestInfo(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while building the request');
        setOutput('');
        setRequestInfo(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('api-request-builder');
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

  // Get examples based on method and format
  const getExamples = () => {
    const baseExamples = [
      {
        label: 'GET with Headers',
        value: `url: https://jsonplaceholder.typicode.com/users
headers:
Content-Type: application/json
Accept: application/json
User-Agent: MyApp/1.0`,
      },
      {
        label: 'POST with JSON',
        value: `url: https://jsonplaceholder.typicode.com/posts
headers:
Content-Type: application/json
body:
{
  "title": "My New Post",
  "body": "This is the content of my post",
  "userId": 1
}`,
      },
      {
        label: 'Bearer Auth',
        value: `url: https://api.github.com/user
headers:
Accept: application/vnd.github.v3+json
auth:
Bearer ghp_xxxxxxxxxxxxxxxxxxxx`,
      },
      {
        label: 'Basic Auth',
        value: `url: https://httpbin.org/basic-auth/user/pass
auth:
username: user
password: pass`,
      },
      {
        label: 'API Key Auth',
        value: `url: https://api.openweathermap.org/data/2.5/weather?q=London
headers:
Accept: application/json
auth:
api_key_12345`,
      },
      {
        label: 'PUT Update',
        value: `url: https://jsonplaceholder.typicode.com/posts/1
headers:
Content-Type: application/json
body:
{
  "id": 1,
  "title": "Updated Post Title",
  "body": "Updated content here",
  "userId": 1
}`,
      },
    ];

    return baseExamples;
  };

  const getLanguage = () => {
    switch (config.outputFormat) {
      case 'curl':
        return 'bash';
      case 'fetch':
      case 'axios':
      case 'xhr':
        return 'javascript';
      case 'postman':
        return 'json';
      default:
        return 'text';
    }
  };

  const getPlaceholder = () => {
    const methodExample = {
      GET: `url: https://api.example.com/users
headers:
Accept: application/json`,
      POST: `url: https://api.example.com/users
headers:
Content-Type: application/json
body:
{
  "name": "John Doe",
  "email": "john@example.com"
}`,
      PUT: `url: https://api.example.com/users/123
headers:
Content-Type: application/json
body:
{
  "name": "Updated Name",
  "email": "updated@example.com"
}`,
      DELETE: `url: https://api.example.com/users/123
headers:
Authorization: Bearer token123`,
    };

    return methodExample[config.method as keyof typeof methodExample] || methodExample.GET;
  };
  
  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title={`${config.method} API Request`}
          value={input}
          onChange={setInput}
          placeholder={getPlaceholder()}
          description="Define your API request with URL, headers, body, and authentication"
          examples={getExamples()}
          onExampleClick={handleExample}
          rows={12}
        />
        
        <OptionsPanel
          title="Request Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Request Preview */}
        {requestInfo && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Request Preview</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="text-blue-600">Method:</span>
                  <div className="font-medium text-blue-800">{requestInfo.method}</div>
                </div>
                <div>
                  <span className="text-blue-600">URL:</span>
                  <div className="font-mono text-blue-800 break-all">{requestInfo.url}</div>
                </div>
                {Object.keys(requestInfo.headers).length > 0 && (
                  <div>
                    <span className="text-blue-600">Headers:</span>
                    <div className="text-blue-700 mt-1">
                      {Object.entries(requestInfo.headers).map(([key, value]) => (
                        <div key={key} className="font-mono text-xs">
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {requestInfo.auth?.type !== 'none' && (
                  <div>
                    <span className="text-blue-600">Auth:</span>
                    <div className="text-blue-700 capitalize">{requestInfo.auth.type}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Format Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Output Format</h3>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
            <div className="font-medium text-gray-800 mb-1">
              {config.outputFormat.toUpperCase()}
            </div>
            <div className="text-gray-600">
              {config.outputFormat === 'curl' && 'Command-line tool for making HTTP requests'}
              {config.outputFormat === 'fetch' && 'Modern JavaScript API built into browsers'}
              {config.outputFormat === 'axios' && 'Popular HTTP client library for Node.js and browsers'}
              {config.outputFormat === 'xhr' && 'Traditional JavaScript XMLHttpRequest API'}
              {config.outputFormat === 'postman' && 'Collection JSON format for Postman import'}
            </div>
          </div>
        </div>

        {/* Quick Method Switcher */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Methods</h3>
          <div className="grid grid-cols-2 gap-1">
            {[
              { method: 'GET', icon: '=�', label: 'GET' },
              { method: 'POST', icon: '�', label: 'POST' },
              { method: 'PUT', icon: '', label: 'PUT' },
              { method: 'DELETE', icon: '=�', label: 'DELETE' },
            ].map(({ method, icon, label }) => (
              <button
                key={method}
                onClick={() => handleConfigChange('method', method)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  config.method === method
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Switcher */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Formats</h3>
          <div className="grid grid-cols-2 gap-1">
            {[
              { format: 'curl', icon: '=�', label: 'cURL' },
              { format: 'fetch', icon: '<', label: 'Fetch' },
              { format: 'axios', icon: '=�', label: 'Axios' },
              { format: 'postman', icon: '=�', label: 'Postman' },
            ].map(({ format, icon, label }) => (
              <button
                key={format}
                onClick={() => handleConfigChange('outputFormat', format)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  config.outputFormat === format
                    ? 'bg-green-600 text-white'
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
          title={`Generated ${config.outputFormat.toUpperCase()} Request`}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={getLanguage()}
          placeholder="Define your API request on the left to generate code..."
          processingMessage="Building API request..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  =� Copy Code
                </button>
                {config.outputFormat === 'postman' && (
                  <button
                    onClick={() => {
                      const blob = new Blob([output], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'api-collection.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    =� Download Collection
                  </button>
                )}
                {(config.outputFormat === 'fetch' || config.outputFormat === 'axios') && (
                  <button
                    onClick={() => {
                      const blob = new Blob([output], { type: 'text/javascript' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `api-request.js`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    =� Download .js
                  </button>
                )}
                {config.outputFormat === 'curl' && (
                  <button
                    onClick={() => {
                      const blob = new Blob([output], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'api-request.sh';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    =� Download .sh
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