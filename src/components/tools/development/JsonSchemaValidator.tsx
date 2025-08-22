import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processJsonSchemaValidator, type JsonSchemaValidatorConfig, SCHEMA_TEMPLATES } from '../../../tools/development/json-schema-validator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JsonSchemaValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonSchemaValidatorConfig = {
  validationMode: 'validate',
  schemaVersion: 'draft-2020-12',
  strictMode: false,
  showDetailedErrors: true,
  generateExamples: false,
  allowAdditionalProperties: true,
  requireAllProperties: false,
  validateFormats: true,
  outputFormat: 'detailed',
};

const MODE_OPTIONS = [
  {
    key: 'validationMode',
    label: 'Mode',
    type: 'select' as const,
    default: 'validate',
    options: [
      { value: 'validate', label: '✅ Validate - Check data against schema' },
      { value: 'generate', label: '🔧 Generate - Create schema from data' },
      { value: 'analyze', label: '📊 Analyze - Examine schema structure' },
    ],
    description: 'Operation mode for the validator',
  },
] as const;

const SCHEMA_OPTIONS = [
  {
    key: 'schemaVersion',
    label: 'Schema Version',
    type: 'select' as const,
    default: 'draft-2020-12',
    options: [
      { value: 'draft-04', label: 'Draft 04 (Legacy)' },
      { value: 'draft-06', label: 'Draft 06' },
      { value: 'draft-07', label: 'Draft 07' },
      { value: 'draft-2019-09', label: 'Draft 2019-09' },
      { value: 'draft-2020-12', label: 'Draft 2020-12 (Latest)' },
    ],
    description: 'JSON Schema specification version',
  },
] as const;

const VALIDATION_OPTIONS = [
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Enforce strict validation rules and report more issues',
  },
  {
    key: 'showDetailedErrors',
    label: 'Detailed Error Messages',
    type: 'checkbox' as const,
    default: true,
    description: 'Include data values and paths in error messages',
  },
  {
    key: 'validateFormats',
    label: 'Validate String Formats',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate email, URI, date, and other string formats',
  },
  {
    key: 'allowAdditionalProperties',
    label: 'Allow Extra Properties',
    type: 'checkbox' as const,
    default: true,
    description: 'Allow properties not defined in the schema',
  },
] as const;

const OUTPUT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'summary', label: '📝 Summary - Brief validation result' },
      { value: 'detailed', label: '📋 Detailed - Full error report' },
      { value: 'json', label: '📊 JSON - Machine-readable output' },
    ],
    description: 'Format for validation results',
  },
] as const;

export function JsonSchemaValidator({ className = '' }: JsonSchemaValidatorProps) {
  const [dataInput, setDataInput] = useState('');
  const [schemaInput, setSchemaInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<JsonSchemaValidatorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentDataInput: string, currentSchemaInput: string, currentConfig: JsonSchemaValidatorConfig) => {
      if (currentConfig.validationMode === 'validate' && (!currentDataInput.trim() || !currentSchemaInput.trim())) {
        setOutput('');
        setValidationResult(null);
        setError(null);
        setIsProcessing(false);
        return;
      }
      
      if (currentConfig.validationMode === 'generate' && !currentDataInput.trim()) {
        setOutput('');
        setValidationResult(null);
        setError(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processJsonSchemaValidator(currentDataInput, currentSchemaInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setValidationResult(result.validationResult || result.generatedSchema);
          
          // Add to history
          addToHistory({
            toolId: 'json-schema-validator',
            input: currentConfig.validationMode === 'generate' 
              ? 'Generate schema from data' 
              : 'Validate data against schema',
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process JSON schema validation');
          setOutput('');
          setValidationResult(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during validation');
        setOutput('');
        setValidationResult(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('json-schema-validator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(dataInput, schemaInput, config);
  }, [dataInput, schemaInput, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'person' | 'api' | 'product' | 'simple' | 'generate') => {
    if (type === 'generate') {
      setDataInput(JSON.stringify({
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        address: {
          street: "123 Main St",
          city: "New York",
          zipCode: "10001"
        },
        hobbies: ["reading", "programming"]
      }, null, 2));
      setSchemaInput('');
      setConfig(prev => ({ ...prev, validationMode: 'generate' }));
      return;
    }
    
    const examples = {
      person: {
        data: JSON.stringify({
          name: "John Doe",
          age: 30,
          email: "john@example.com",
          address: {
            street: "123 Main St",
            city: "New York",
            zipCode: "10001"
          }
        }, null, 2),
        schema: JSON.stringify(SCHEMA_TEMPLATES.find(t => t.id === 'person')?.schema, null, 2)
      },
      api: {
        data: JSON.stringify({
          success: true,
          data: [{ id: 1, name: "Item 1" }],
          message: "Request successful",
          pagination: { page: 1, limit: 10, total: 25 }
        }, null, 2),
        schema: JSON.stringify(SCHEMA_TEMPLATES.find(t => t.id === 'api-response')?.schema, null, 2)
      },
      product: {
        data: JSON.stringify({
          id: "prod-123",
          name: "Wireless Headphones",
          description: "High-quality wireless headphones",
          price: 99.99,
          currency: "USD",
          category: "Electronics",
          tags: ["wireless", "audio", "bluetooth"],
          inStock: true,
          images: [{ url: "https://example.com/image.jpg", alt: "Product photo" }]
        }, null, 2),
        schema: JSON.stringify(SCHEMA_TEMPLATES.find(t => t.id === 'product')?.schema, null, 2)
      },
      simple: {
        data: JSON.stringify({ name: "John", age: "thirty" }, null, 2),
        schema: JSON.stringify({
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "integer" }
          },
          required: ["name", "age"]
        }, null, 2)
      }
    };
    
    const example = examples[type];
    setDataInput(example.data);
    setSchemaInput(example.schema);
    setConfig(prev => ({ ...prev, validationMode: 'validate' }));
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = SCHEMA_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSchemaInput(JSON.stringify(template.schema, null, 2));
    }
  };

  const handleSwapInputs = () => {
    const temp = dataInput;
    setDataInput(schemaInput);
    setSchemaInput(temp);
  };

  // Build conditional options
  const allOptions = [
    ...MODE_OPTIONS,
    ...(config.validationMode !== 'generate' ? SCHEMA_OPTIONS : []),
    ...(config.validationMode === 'validate' ? VALIDATION_OPTIONS : []),
    ...OUTPUT_OPTIONS,
  ];

  const showSchemaInput = config.validationMode === 'validate' || config.validationMode === 'analyze';

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('simple')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              🧪 Simple Test
            </button>
            <button
              onClick={() => handleQuickExample('generate')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              🔧 Generate Schema
            </button>
            <button
              onClick={() => handleQuickExample('person')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              👤 Person Object
            </button>
            <button
              onClick={() => handleQuickExample('api')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              🔌 API Response
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Validation Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Schema Templates */}
        {showSchemaInput && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Schema Templates</h3>
            <div className="space-y-2">
              {SCHEMA_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleLoadTemplate(template.id)}
                  className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-left"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-gray-500">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Validation Results Summary */}
        {validationResult && config.validationMode === 'validate' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Validation Summary</h3>
            <div className={`p-3 border rounded-lg text-xs ${
              validationResult.isValid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {validationResult.isValid ? '✅' : '❌'}
                </span>
                <span className={`font-medium ${
                  validationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.isValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
              <div className={`mt-2 grid grid-cols-2 gap-2 ${
                validationResult.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                <div>Errors: {validationResult.summary.totalErrors}</div>
                <div>Warnings: {validationResult.summary.totalWarnings}</div>
                <div>Complexity: {validationResult.summary.schemaComplexity}</div>
                <div>Types: {validationResult.summary.dataTypes.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Usage Tips</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">Schema Generation</div>
              <div className="text-blue-700">Use generate mode to create schemas from sample data</div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="font-medium text-green-800">Validation</div>
              <div className="text-green-700">Enable format validation for email, URI, and date checks</div>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <div className="font-medium text-purple-800">Error Debugging</div>
              <div className="text-purple-700">Use detailed output to see exact error locations</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="JSON Data"
          value={dataInput}
          onChange={setDataInput}
          placeholder={config.validationMode === 'generate' 
            ? 'Enter JSON data to generate schema from...'
            : 'Enter JSON data to validate...'}
          language="json"
        />

        {showSchemaInput && (
          <InputPanel
            title="JSON Schema"
            value={schemaInput}
            onChange={setSchemaInput}
            placeholder="Enter JSON Schema definition..."
            language="json"
          />
        )}

        <OutputPanel
          title={config.validationMode === 'generate' ? 'Generated Schema' : 'Validation Result'}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' || config.validationMode === 'generate' ? 'json' : 'text'}
          placeholder="Results will appear here..."
          processingMessage="Processing validation..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Result
                </button>
                <button
                  onClick={() => {
                    const extension = config.outputFormat === 'json' || config.validationMode === 'generate' ? 'json' : 'txt';
                    const mimeType = extension === 'json' ? 'application/json' : 'text/plain';
                    const blob = new Blob([output], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `validation-result.${extension}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download
                </button>
                {config.validationMode === 'generate' && output && (
                  <button
                    onClick={() => {
                      setSchemaInput(output);
                      setConfig(prev => ({ ...prev, validationMode: 'validate' }));
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    ✅ Use as Schema
                  </button>
                )}
                {showSchemaInput && (dataInput && schemaInput) && (
                  <button
                    onClick={handleSwapInputs}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    🔄 Swap Inputs
                  </button>
                )}
                {validationResult && config.validationMode === 'validate' && (
                  <button
                    onClick={() => {
                      const summary = `JSON Schema Validation Summary

Status: ${validationResult.isValid ? 'Valid' : 'Invalid'}
Errors: ${validationResult.summary.totalErrors}
Warnings: ${validationResult.summary.totalWarnings}
Schema Complexity: ${validationResult.summary.schemaComplexity}
Data Types: ${validationResult.summary.dataTypes.join(', ')}

Required Fields: ${validationResult.summary.requiredFields.join(', ')}
Optional Fields: ${validationResult.summary.optionalFields.join(', ')}`;

                      navigator.clipboard?.writeText(summary);
                    }}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    📊 Copy Summary
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