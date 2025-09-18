import React, { useState, useCallback, useMemo } from 'react';
import { Layers, ArrowRightLeft, Settings, Eye, Code2, Copy, Download, CheckCircle, XCircle } from 'lucide-react';
import { processJSONFlattener, JSONFlattenerConfig } from '../../../tools/development/json-flattener';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { debounce } from '../../../lib/utils';

interface JSONFlattenerProps {
  className?: string;
}

const DEFAULT_CONFIG: JSONFlattenerConfig = {
  delimiter: '.',
  preserveArrays: false,
  preserveEmptyObjects: true,
  maxDepth: 10,
  includeTypeInfo: false,
  sortKeys: false,
  handleNullValues: 'keep',
  arrayIndexing: 'numeric',
  customPrefix: '',
  caseSensitive: true
};

export default function JSONFlattener({ className = '' }: JSONFlattenerProps) {
  const [input, setInput] = useState(`{
  "user": {
    "name": "John Doe",
    "age": 30,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "coordinates": [40.7128, -74.0060]
    },
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  "active": true,
  "roles": ["admin", "user"]
}`);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<JSONFlattenerConfig>(DEFAULT_CONFIG);
  const [operation, setOperation] = useState<'flatten' | 'unflatten'>('flatten');
  const [activeTab, setActiveTab] = useState<'flattened' | 'unflattened' | 'keymap'>('flattened');

  const processInput = useMemo(
    () => debounce(async (currentInput: string, currentConfig: JSONFlattenerConfig, currentOperation: 'flatten' | 'unflatten') => {
      if (!currentInput.trim()) {
        setResult(null);
        setError('');
        return;
      }

      setIsProcessing(true);
      setError('');

      try {
        const toolResult = await processJSONFlattener(currentInput, currentConfig, currentOperation);
        
        if (toolResult.data) {
          setResult(toolResult);
          setError('');
        } else {
          setError(toolResult.error || 'Failed to process JSON');
          setResult(null);
        }
      } catch (err) {
        setError('Error processing JSON data');
        setResult(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    []
  );

  React.useEffect(() => {
    processInput(input, config, operation);
  }, [input, config, operation, processInput]);

  const handleConfigChange = useCallback((key: keyof JSONFlattenerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleOperationSwitch = () => {
    const newOperation = operation === 'flatten' ? 'unflatten' : 'flatten';
    setOperation(newOperation);
    
    // If we have a result and we're switching to unflatten, use the flattened result as input
    if (newOperation === 'unflatten' && result?.data?.flattened) {
      setInput(JSON.stringify(result.data.flattened, null, 2));
    }
  };

  const handleQuickExample = (type: 'nested' | 'array' | 'complex' | 'config' | 'flat') => {
    const examples = {
      nested: {
        data: `{
  "company": {
    "name": "TechCorp",
    "employees": {
      "count": 150,
      "departments": {
        "engineering": 80,
        "sales": 45,
        "marketing": 25
      }
    }
  }
}`,
        operation: 'flatten' as const
      },
      array: {
        data: `{
  "products": [
    {"id": 1, "name": "Laptop", "price": 999.99},
    {"id": 2, "name": "Mouse", "price": 29.99},
    {"id": 3, "name": "Keyboard", "price": 89.99}
  ]
}`,
        operation: 'flatten' as const
      },
      complex: {
        data: `{
  "api": {
    "endpoints": [
      {
        "path": "/users",
        "methods": ["GET", "POST"],
        "auth": {"required": true, "type": "bearer"}
      },
      {
        "path": "/products",
        "methods": ["GET"],
        "auth": {"required": false}
      }
    ]
  }
}`,
        operation: 'flatten' as const
      },
      config: {
        data: `{
  "database.host": "localhost",
  "database.port": 5432,
  "database.name": "myapp",
  "api.version": "v1",
  "api.timeout": 30000,
  "features.auth.enabled": true
}`,
        operation: 'unflatten' as const
      },
      flat: {
        data: `{
  "user.profile.name": "Jane Smith",
  "user.profile.email": "jane@example.com",
  "user.settings.theme": "light",
  "user.settings.notifications": false,
  "app.version": "2.1.0"
}`,
        operation: 'unflatten' as const
      }
    };

    const example = examples[type];
    setInput(example.data);
    setOperation(example.operation);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadResult = () => {
    if (!result?.data) return;
    
    const data = activeTab === 'unflattened' ? result.data.unflatten : result.data.flattened;
    const content = JSON.stringify(data, null, 2);
    const filename = `json-${operation}-${Date.now()}.json`;
    
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentTabContent = () => {
    if (!result?.data) return '';
    
    switch (activeTab) {
      case 'flattened':
        return JSON.stringify(result.data.flattened, null, 2);
      case 'unflattened':
        return result.data.unflatten ? JSON.stringify(result.data.unflatten, null, 2) : 'No unflattened data available';
      case 'keymap':
        return result.data.keyMap ? JSON.stringify(result.data.keyMap, null, 2) : 'No key mapping available';
      default:
        return '';
    }
  };

  const getStatistics = () => {
    if (!result?.data) return [];
    
    const stats = [];
    const { data, metadata } = result;
    
    stats.push({ label: 'Operation', value: operation });
    stats.push({ label: 'Original Keys', value: data.metadata.originalKeys.toString() });
    stats.push({ label: 'Flattened Keys', value: data.metadata.flattenedKeys.toString() });
    stats.push({ label: 'Max Depth', value: data.metadata.maxDepth.toString() });
    stats.push({ label: 'Arrays Found', value: data.metadata.arrayCount.toString() });
    stats.push({ label: 'Objects Found', value: data.metadata.objectCount.toString() });
    stats.push({ label: 'Reversible', value: data.reversible ? 'Yes' : 'No' });
    stats.push({ label: 'Processing Time', value: `${result.processing_time}ms` });
    
    return stats;
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-8 ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Layers className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">JSON Flattener</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Flatten nested JSON objects to flat key-value pairs or unflatten back to nested structure
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Operation Switch */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Operation Mode</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setOperation('flatten')}
                    className={`px-4 py-2 text-sm font-medium border rounded-l transition-colors ${
                      operation === 'flatten'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Flatten
                  </button>
                  <button
                    onClick={() => setOperation('unflatten')}
                    className={`px-4 py-2 text-sm font-medium border rounded-r transition-colors ${
                      operation === 'unflatten'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Unflatten
                  </button>
                </div>
                
                <button
                  onClick={handleOperationSwitch}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Switch</span>
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-2">
              {operation === 'flatten' 
                ? 'Convert nested JSON objects to flat key-value pairs'
                : 'Convert flat key-value pairs back to nested JSON structure'
              }
            </p>
          </div>

          {/* Input Panel */}
          <InputPanel
            title={operation === 'flatten' ? 'Nested JSON Input' : 'Flat JSON Input'}
            value={input}
            onChange={setInput}
            placeholder={`Enter ${operation === 'flatten' ? 'nested' : 'flattened'} JSON data...`}
            language="json"
            height="300px"
          />

          {/* Output Panel with Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Processing Result</h2>
              <div className="flex items-center space-x-2">
                {result?.data?.reversible !== undefined && (
                  <div className={`flex items-center space-x-1 px-2 py-1 text-xs rounded ${
                    result.data.reversible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.data.reversible ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{result.data.reversible ? 'Reversible' : 'Not Reversible'}</span>
                  </div>
                )}
                {result?.data && (
                  <>
                    <button
                      onClick={() => copyToClipboard(getCurrentTabContent())}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={downloadResult}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            {result?.data && (
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab('flattened')}
                  className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'flattened'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4" />
                    <span>Flattened</span>
                  </div>
                </button>
                
                {result.data.unflatten && (
                  <button
                    onClick={() => setActiveTab('unflattened')}
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'unflattened'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4" />
                      <span>Nested</span>
                    </div>
                  </button>
                )}
                
                {result.data.keyMap && (
                  <button
                    onClick={() => setActiveTab('keymap')}
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'keymap'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Key Map</span>
                    </div>
                  </button>
                )}
              </div>
            )}

            <OutputPanel
              title=""
              content={getCurrentTabContent()}
              isProcessing={isProcessing}
              error={error}
              language="json"
              height="400px"
              showCopy={false}
            />

            {/* Result Information */}
            {result?.data && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Keys:</span>
                    <div className="text-blue-800">{result.data.metadata.originalKeys} → {result.data.metadata.flattenedKeys}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Max Depth:</span>
                    <div className="text-blue-800">{result.data.metadata.maxDepth}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Arrays:</span>
                    <div className="text-blue-800">{result.data.metadata.arrayCount}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Objects:</span>
                    <div className="text-blue-800">{result.data.metadata.objectCount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Examples */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Code2 className="w-5 h-5 mr-2" />
              Quick Examples
            </h3>
            
            <div className="space-y-2">
              {[
                { id: 'nested', label: 'Nested Object', icon: '🔗', desc: 'Deep nesting example' },
                { id: 'array', label: 'Array Data', icon: '📊', desc: 'Products with arrays' },
                { id: 'complex', label: 'Complex Structure', icon: '🔬', desc: 'API endpoints config' },
                { id: 'config', label: 'Config Flatten', icon: '⚙️', desc: 'Unflatten config data' },
                { id: 'flat', label: 'Flat to Nested', icon: '🔄', desc: 'User settings data' }
              ].map(({ id, label, icon, desc }) => (
                <button
                  key={id}
                  onClick={() => handleQuickExample(id as any)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <OptionsPanel title="Flattening Options">
            <div className="space-y-4">
              {/* Delimiter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Delimiter
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['.', '_', '-', '/'].map((delim) => (
                    <button
                      key={delim}
                      onClick={() => handleConfigChange('delimiter', delim)}
                      className={`p-2 text-sm font-mono border rounded transition-colors ${
                        config.delimiter === delim
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {delim}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={config.delimiter}
                  onChange={(e) => handleConfigChange('delimiter', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  placeholder="Custom delimiter"
                />
              </div>

              {/* Array Indexing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Array Indexing
                </label>
                <select
                  value={config.arrayIndexing}
                  onChange={(e) => handleConfigChange('arrayIndexing', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="numeric">Numeric (key.0, key.1)</option>
                  <option value="brackets">Brackets (key[0], key[1])</option>
                  <option value="dots">Dots (key.0, key.1)</option>
                </select>
              </div>

              {/* Max Depth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Depth: {config.maxDepth === 0 ? 'Unlimited' : config.maxDepth}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={config.maxDepth}
                  onChange={(e) => handleConfigChange('maxDepth', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 (No limit)</span>
                  <span>20</span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Processing Options</h4>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.preserveArrays}
                    onChange={(e) => handleConfigChange('preserveArrays', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Preserve arrays as-is</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.preserveEmptyObjects}
                    onChange={(e) => handleConfigChange('preserveEmptyObjects', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Preserve empty objects</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.includeTypeInfo}
                    onChange={(e) => handleConfigChange('includeTypeInfo', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Include type information</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.sortKeys}
                    onChange={(e) => handleConfigChange('sortKeys', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Sort keys alphabetically</span>
                </label>
              </div>

              {/* Null Handling */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Null Value Handling
                </label>
                <select
                  value={config.handleNullValues}
                  onChange={(e) => handleConfigChange('handleNullValues', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="keep">Keep null values</option>
                  <option value="skip">Skip null values</option>
                  <option value="convert">Convert to string</option>
                </select>
              </div>

              {/* Custom Prefix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Prefix (Optional)
                </label>
                <input
                  type="text"
                  value={config.customPrefix}
                  onChange={(e) => handleConfigChange('customPrefix', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., app, config"
                />
              </div>
            </div>
          </OptionsPanel>

          {/* Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Processing Statistics</h3>
            <div className="space-y-2">
              {getStatistics().map((stat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{stat.label}:</span>
                  <span className="font-medium text-gray-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Type Distribution */}
          {result?.data?.metadata?.typeDistribution && Object.keys(result.data.metadata.typeDistribution).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Type Distribution
              </h3>
              
              <div className="space-y-2">
                {Object.entries(result.data.metadata.typeDistribution).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm capitalize text-gray-600">{type}:</span>
                    <span className="font-medium text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}