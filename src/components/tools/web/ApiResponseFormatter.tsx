import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processApiResponse, type ApiResponseConfig } from '../../../tools/web/api-response-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface ApiResponseFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: ApiResponseConfig = {
  mode: 'format',
  responseType: 'auto',
  includeHeaders: true,
  includeStatus: true,
  includeTimings: false,
  validateSchema: true,
  outputFormat: 'detailed',
  sortKeys: false,
  indentSize: 2,
  showMetadata: true,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Processing Mode',
    type: 'select' as const,
    default: 'format',
    options: [
      { value: 'format', label: 'Format & Analyze' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'analyze', label: 'Analyze Structure' },
    ],
    description: 'Choose how to process the API response',
  },
  {
    key: 'responseType',
    label: 'Response Type',
    type: 'select' as const,
    default: 'auto',
    options: [
      { value: 'auto', label: 'Auto-detect' },
      { value: 'json', label: 'JSON' },
      { value: 'xml', label: 'XML' },
      { value: 'text', label: 'Plain Text' },
    ],
    description: 'Specify the response content type',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Report' },
      { value: 'compact', label: 'Compact Format' },
      { value: 'raw', label: 'Raw Content Only' },
    ],
    description: 'Choose the output format style',
  },
  {
    key: 'indentSize',
    label: 'Indent Size',
    type: 'select' as const,
    default: 2,
    options: [
      { value: 2, label: '2 spaces' },
      { value: 4, label: '4 spaces' },
      { value: 8, label: '8 spaces' },
    ],
    description: 'Number of spaces for indentation',
  },
  {
    key: 'includeHeaders',
    label: 'Include Headers',
    type: 'checkbox' as const,
    default: true,
    description: 'Show HTTP headers in the analysis',
  },
  {
    key: 'includeStatus',
    label: 'Include Status',
    type: 'checkbox' as const,
    default: true,
    description: 'Show HTTP status code and text',
  },
  {
    key: 'validateSchema',
    label: 'Validate Content',
    type: 'checkbox' as const,
    default: true,
    description: 'Perform content validation and error checking',
  },
  {
    key: 'showMetadata',
    label: 'Show Metadata',
    type: 'checkbox' as const,
    default: true,
    description: 'Display response metadata and analysis',
  },
  {
    key: 'sortKeys',
    label: 'Sort JSON Keys',
    type: 'checkbox' as const,
    default: false,
    description: 'Sort JSON object keys alphabetically',
  },
] as const;

export function ApiResponseFormatter({ className = '' }: ApiResponseFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<ApiResponseConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: ApiResponseConfig) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processApiResponse(value, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'api-response-formatter',
            input: value,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process API response');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during API response processing');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('api-response-formatter');
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

  const examples = [
    {
      label: 'JSON Response',
      value: `{
  "status": "success",
  "data": {
    "user": {
      "id": 12345,
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`,
    },
    {
      label: 'HTTP Response with Headers',
      value: `HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 156
Cache-Control: max-age=300
X-RateLimit-Remaining: 4999

{
  "message": "Hello, World!",
  "timestamp": 1642248600,
  "success": true,
  "data": null
}`,
    },
    {
      label: 'XML API Response',
      value: `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <status>success</status>
  <data>
    <user id="1">
      <name>John Doe</name>
      <email>john@example.com</email>
    </user>
  </data>
</response>`,
    },
    {
      label: 'Error Response',
      value: `HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid request",
  "code": "INVALID_PARAM",
  "message": "The 'id' parameter is required",
  "timestamp": "2024-01-15T10:30:00Z"
}`,
    },
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="API Response"
          value={input}
          onChange={setInput}
          placeholder="Paste your API response here (JSON, XML, or full HTTP response)..."
          description="Paste raw API response data or complete HTTP response with headers"
          examples={examples}
          onExampleClick={handleExample}
          language="http"
          rows={12}
        />
        
        <OptionsPanel
          title="Format Options"
          options={OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Formatted Response"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Your formatted and analyzed API response will appear here..."
        />
      </div>
    </div>
  );
}