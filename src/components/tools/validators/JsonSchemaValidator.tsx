import { useState, useEffect, useMemo, useCallback } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { validateJsonSchema, type JsonSchemaValidatorConfig } from '../../../tools/validators/json-schema-validator';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface JsonSchemaValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonSchemaValidatorConfig = {
  allErrors: true,
  coerceTypes: false,
  removeAdditional: 'none',
  allowUnionTypes: true,
  strictMode: false,
};

const ESSENTIAL_OPTIONS = [
  {
    key: 'allErrors',
    label: 'Report All Errors',
    type: 'boolean' as const,
    default: true,
    description: 'Continue validation and collect every failing rule',
  },
  {
    key: 'coerceTypes',
    label: 'Coerce Types',
    type: 'boolean' as const,
    default: false,
    description: 'Convert values (e.g., strings to numbers) when possible',
  },
  {
    key: 'removeAdditional',
    label: 'Remove Additional Properties',
    type: 'select' as const,
    default: 'none',
    options: [
      { value: 'none', label: 'Do not remove' },
      { value: 'failing', label: 'Remove only failing properties' },
      { value: 'all', label: 'Remove all undeclared properties' },
    ],
    description: 'Control how extra properties are handled',
  },
  {
    key: 'allowUnionTypes',
    label: 'Allow Union Types',
    type: 'boolean' as const,
    default: true,
    description: 'Permit union type keywords when using draft-04 schemas',
  },
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Enable Ajv strict mode for maximum draft compliance',
  },
];

const SCHEMA_EXAMPLES = [
  {
    title: 'User profile schema',
    value: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["id", "email"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 18 }
  },
  "additionalProperties": false
}`,
  },
  {
    title: 'Product listing schema',
    value: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["sku", "price"],
    "properties": {
      "sku": { "type": "string" },
      "price": { "type": "number", "minimum": 0 },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "uniqueItems": true
      }
    },
    "additionalProperties": false
  }
}`,
  },
];

const DATA_EXAMPLES = [
  {
    title: 'Valid user profile',
    value: `{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "user@example.com",
  "age": 27
}`,
  },
  {
    title: 'Invalid product listing',
    value: `[
  {
    "sku": "SKU-1001",
    "price": -5,
    "tags": ["sale", "sale"]
  }
]`,
  },
];

export function JsonSchemaValidator({ className = '' }: JsonSchemaValidatorProps) {
  const [schemaInput, setSchemaInput] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsonSchemaValidatorConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [autoValidate, setAutoValidate] = useState(true);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved configuration on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('json-schema-validator') as Partial<JsonSchemaValidatorConfig & {
        schemaInput: string;
        dataInput: string;
        autoValidate: boolean;
      }>) || {};

      if (saved && Object.keys(saved).length > 0) {
        setConfig(prev => ({ ...prev, ...saved }));
        if (typeof saved.schemaInput === 'string') {
          setSchemaInput(saved.schemaInput);
        }
        if (typeof saved.dataInput === 'string') {
          setDataInput(saved.dataInput);
        }
        if (typeof saved.autoValidate === 'boolean') {
          setAutoValidate(saved.autoValidate);
        }
      }
    } catch {}
  }, [getSavedConfig]);

  const processedConfig = useMemo(() => ({ ...config }), [config]);

  const runValidation = useCallback(
    (
      schema: string = schemaInput,
      data: string = dataInput,
      cfg: JsonSchemaValidatorConfig = processedConfig
    ) => {
      if (!schema.trim()) {
        setError('Schema input is required.');
        setOutput('');
        setMetadata(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const result = validateJsonSchema(schema, data, cfg);

      if (result.success) {
        setOutput(result.output || '');
        setError(undefined);
        setMetadata(result.metadata);

        try {
          addToHistory({
            toolId: 'json-schema-validator',
            input: JSON.stringify({ schema, data, config: cfg }, null, 2),
            output: result.output || '',
            config: cfg,
            timestamp: Date.now(),
          });
        } catch {}
      } else {
        setOutput('');
        setError(result.error);
        setMetadata(undefined);
      }

      setIsLoading(false);
    },
    [schemaInput, dataInput, processedConfig, addToHistory]
  );

  const debouncedValidate = useMemo(() => debounce(runValidation, 500), [runValidation]);

  useEffect(() => {
    if (autoValidate) {
      debouncedValidate(schemaInput, dataInput, processedConfig);
    }
  }, [schemaInput, dataInput, processedConfig, debouncedValidate, autoValidate]);

  const handleConfigChange = useCallback(
    (newConfig: JsonSchemaValidatorConfig) => {
      setConfig(newConfig);
      try {
        updateSavedConfig?.('json-schema-validator', {
          ...newConfig,
          schemaInput,
          dataInput,
          autoValidate,
        });
      } catch {}

      if (autoValidate) {
        debouncedValidate(schemaInput, dataInput, newConfig);
      }
    },
    [updateSavedConfig, schemaInput, dataInput, autoValidate, debouncedValidate]
  );

  const handleValidateClick = useCallback(() => {
    runValidation(schemaInput, dataInput, processedConfig);
  }, [runValidation, schemaInput, dataInput, processedConfig]);

  const handleToggleAuto = useCallback(() => {
    const next = !autoValidate;
    setAutoValidate(next);
    try {
      updateSavedConfig?.('json-schema-validator', {
        ...processedConfig,
        schemaInput,
        dataInput,
        autoValidate: next,
      });
    } catch {}

    if (next) {
      runValidation(schemaInput, dataInput, processedConfig);
    }
  }, [autoValidate, updateSavedConfig, processedConfig, schemaInput, dataInput, runValidation]);

  const handleCopyMetadata = useCallback(async () => {
    if (!metadata) return;
    try {
      await copyToClipboard(JSON.stringify(metadata, null, 2));
      alert('Validation metadata copied to clipboard.');
    } catch {
      alert('Unable to copy metadata to clipboard.');
    }
  }, [metadata]);

  const handleDownloadMetadata = useCallback(() => {
    if (!metadata) return;
    downloadFile(
      JSON.stringify(metadata, null, 2),
      'json-schema-validation.json',
      'application/json'
    );
  }, [metadata]);

  return (
    <div className={className}>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <InputPanel
            label="JSON Schema"
            placeholder="Paste JSON Schema here..."
            value={schemaInput}
            onChange={value => {
              setSchemaInput(value);
              try {
                updateSavedConfig?.('json-schema-validator', {
                  ...processedConfig,
                  schemaInput: value,
                  dataInput,
                  autoValidate,
                });
              } catch {}
            }}
            rows={18}
            examples={SCHEMA_EXAMPLES}
          />
        </div>
        <div className="flex-1">
          <InputPanel
            label="JSON Data"
            placeholder="Paste JSON data to validate (optional)..."
            value={dataInput}
            onChange={value => {
              setDataInput(value);
              try {
                updateSavedConfig?.('json-schema-validator', {
                  ...processedConfig,
                  schemaInput,
                  dataInput: value,
                  autoValidate,
                });
              } catch {}
            }}
            rows={18}
            examples={DATA_EXAMPLES}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div >
          <label >
            <input
              type="checkbox"
              checked={autoValidate}
              onChange={handleToggleAuto}
              
            />
            Auto-validate
          </label>
          <button
            onClick={handleValidateClick}
            className="ml-auto text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Validate JSON
          </button>
        </div>

        <OptionsPanel
          options={ESSENTIAL_OPTIONS as any}
          config={config}
          onChange={newConfig => handleConfigChange(newConfig as JsonSchemaValidatorConfig)}
          
        />
      </div>

      <div className="mt-6">
        <OutputPanel
          label="Validation Report"
          value={output}
          error={error}
          isLoading={isLoading}
          syntax="markdown"
          downloadFilename="json-schema-validation.txt"
        />
      </div>

      {metadata && (
        <div >
          <div className="flex items-center justify-between mb-4">
            <h3 >Summary</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMetadata}
                
              >
                Copy JSON
              </button>
              <button
                onClick={handleDownloadMetadata}
                
              >
                Download JSON
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div >
              <p >Status</p>
              <p >
                {metadata.valid ? 'Valid' : 'Invalid'}
              </p>
            </div>
            <div >
              <p >Errors</p>
              <p >
                {metadata.errorCount}
              </p>
            </div>
            <div >
              <p >Strict Mode</p>
              <p >
                {metadata.configuration?.strictMode ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          {Array.isArray(metadata.errors) && metadata.errors.length > 0 && (
            <div className="mt-6">
              <h4 >
                Detailed Errors
              </h4>
              <div className="space-y-3">
                {metadata.errors.map((err: any, index: number) => (
                  <div
                    key={`${err.instancePath}-${index}`}
                    
                  >
                    <p >Error #{index + 1}</p>
                    <p >
                      Path: <code className="font-mono">{err.instancePath || '/'}</code>
                    </p>
                    <p >
                      {err.message}
                    </p>
                    {err.schemaPath && (
                      <p >
                        Schema path: <code className="font-mono">{err.schemaPath}</code>
                      </p>
                    )}
                    {err.params && (
                      <pre >
{JSON.stringify(err.params, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
