import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processYamlValidator, type YamlValidatorConfig } from '../../../tools/development/yaml-validator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface YamlValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: YamlValidatorConfig = {
  strictMode: false,
  allowDuplicateKeys: false,
  allowEmptyValues: true,
  allowTabIndentation: false,
  requireQuotedStrings: false,
  validateAnchors: true,
  validateReferences: true,
  checkIndentation: true,
  validateTypes: true,
  allowComments: true,
  maxDepth: 50,
  maxLineLength: 200,
  allowFlowStyle: true,
  validateDocumentMarkers: true,
  checkKeyOrder: false,
};

const VALIDATION_OPTIONS = [
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Fail validation on any error or warning',
  },
  {
    key: 'checkIndentation',
    label: 'Check Indentation',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate YAML indentation consistency',
  },
  {
    key: 'validateAnchors',
    label: 'Validate Anchors',
    type: 'checkbox' as const,
    default: true,
    description: 'Check anchor and reference syntax',
  },
  {
    key: 'validateReferences',
    label: 'Validate References',
    type: 'checkbox' as const,
    default: true,
    description: 'Verify anchor references are valid',
  },
  {
    key: 'validateTypes',
    label: 'Validate Types',
    type: 'checkbox' as const,
    default: true,
    description: 'Check data type consistency',
  },
  {
    key: 'validateDocumentMarkers',
    label: 'Document Markers',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate document start/end markers',
  },
] as const;

const FORMATTING_OPTIONS = [
  {
    key: 'allowDuplicateKeys',
    label: 'Allow Duplicate Keys',
    type: 'checkbox' as const,
    default: false,
    description: 'Allow duplicate keys in the same mapping',
  },
  {
    key: 'allowEmptyValues',
    label: 'Allow Empty Values',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept keys with empty or null values',
  },
  {
    key: 'allowTabIndentation',
    label: 'Allow Tab Indentation',
    type: 'checkbox' as const,
    default: false,
    description: 'Accept tab characters for indentation',
  },
  {
    key: 'allowComments',
    label: 'Allow Comments',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept YAML comments starting with #',
  },
  {
    key: 'allowFlowStyle',
    label: 'Allow Flow Style',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept flow-style syntax ([array], {object})',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'requireQuotedStrings',
    label: 'Require Quoted Strings',
    type: 'checkbox' as const,
    default: false,
    description: 'Require explicit quotes around string values',
  },
  {
    key: 'checkKeyOrder',
    label: 'Check Key Order',
    type: 'checkbox' as const,
    default: false,
    description: 'Warn about non-alphabetical key ordering',
  },
  {
    key: 'maxDepth',
    label: 'Max Nesting Depth',
    type: 'number' as const,
    default: 50,
    min: 1,
    max: 100,
    description: 'Maximum allowed nesting depth',
  },
  {
    key: 'maxLineLength',
    label: 'Max Line Length',
    type: 'number' as const,
    default: 200,
    min: 50,
    max: 500,
    description: 'Maximum allowed line length (0 = unlimited)',
  },
] as const;

export function YamlValidator({ className = '' }: YamlValidatorProps) {
  const [input, setInput] = useState(`# YAML Configuration Example
app:
  name: "My Application"
  version: "1.0.0"
  debug: true
  
database:
  host: localhost
  port: 5432
  name: myapp_db
  credentials: &db_creds
    username: admin
    password: secret
    
api:
  endpoints:
    - /api/users
    - /api/posts
    - /api/comments
  auth:
    <<: *db_creds
    timeout: 30
    
features:
  - authentication
  - caching
  - logging`);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<YamlValidatorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: YamlValidatorConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processYamlValidator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setValidation(result.validation);
          setAnalysis(result.analysis);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'yaml-validator',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.validation?.isValid ? 'VALID' : 'INVALID',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to validate YAML');
          setOutput('');
          setValidation(null);
          setAnalysis(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during YAML validation');
        setOutput('');
        setValidation(null);
        setAnalysis(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('yaml-validator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'config' | 'data' | 'anchors' | 'multiline' | 'flow' | 'invalid' | 'complex') => {
    const examples = {
      config: `# Application Configuration
app:
  name: "My Application"
  version: "1.0.0"
  debug: true
  
server:
  host: localhost
  port: 8080
  ssl: false
  
database:
  type: postgres
  host: db.example.com
  port: 5432`,
      data: `# Simple Data Structure
users:
  - id: 1
    name: "John Doe"
    email: "john@example.com"
    active: true
  - id: 2
    name: "Jane Smith"
    email: "jane@example.com"
    active: false
    
settings:
  theme: dark
  notifications: true
  language: en`,
      anchors: `# YAML with Anchors and References
defaults: &defaults
  timeout: 30
  retries: 3
  ssl: true

development:
  <<: *defaults
  host: "dev.example.com"
  debug: true
  
production:
  <<: *defaults
  host: "prod.example.com"
  debug: false`,
      multiline: `# Multiline String Examples
description: >
  This is a folded multiline string
  that will be joined with spaces.
  Line breaks are converted to spaces.

script: |
  #!/bin/bash
  echo "This is a literal multiline string"
  echo "Line breaks are preserved exactly"
  ls -la

plain_text: >-
  This folded string has
  its final newline stripped.`,
      flow: `# Flow Style YAML
users: [{name: "John", age: 30}, {name: "Jane", age: 25}]
config: {debug: true, port: 8080, features: [auth, cache]}
matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
endpoints: ["/api/users", "/api/posts", "/health"]`,
      invalid: `# Invalid YAML Examples
duplicate_key: "first value"
duplicate_key: "second value"  # Duplicate key error

  bad_indent: "inconsistent indentation"
- invalid_list_item_indent

missing_colon "no colon after key"
unmatched: "quotes'
- unclosed: [array, without, closing`,
      complex: `---
# Multi-document YAML
version: "3.8"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes: &web_volumes
      - ./html:/usr/share/nginx/html:ro
      - ./config:/etc/nginx/conf.d:ro
    environment:
      - NODE_ENV=production
    
  api: &api_service
    image: node:16-alpine
    volumes: *web_volumes
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
    depends_on:
      - postgres
  
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

---
# Second document - configuration
logging:
  level: info
  format: json
  outputs:
    - console
    - file: /var/log/app.log`
    };
    
    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...VALIDATION_OPTIONS,
    ...FORMATTING_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  // Validation status colors
  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-800 bg-green-100';
      case 'moderate': return 'text-blue-800 bg-blue-100';
      case 'complex': return 'text-orange-800 bg-orange-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getIndentationIcon = (style: string) => {
    switch (style) {
      case 'spaces': return '⭐';
      case 'tabs': return '📄';
      case 'mixed': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* YAML Validation Status */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Validation Status</h3>
            <div className={`p-4 rounded-lg border-2 ${getValidationColor(validation.isValid)}`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {validation.isValid ? '✅' : '❌'}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {validation.isValid ? 'VALID YAML' : 'INVALID YAML'}
                  </div>
                  <div className="text-xs opacity-80">
                    {validation.errors.length} errors found
                  </div>
                </div>
                {analysis && (
                  <div className="ml-auto">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getComplexityColor(analysis.complexity)}`}>
                      {analysis.complexity.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick YAML Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick YAML Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('config')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              ⚙️ Configuration
            </button>
            <button
              onClick={() => handleQuickExample('data')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📊 Data Structure
            </button>
            <button
              onClick={() => handleQuickExample('anchors')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              🔗 Anchors & References
            </button>
            <button
              onClick={() => handleQuickExample('multiline')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              📝 Multiline Strings
            </button>
            <button
              onClick={() => handleQuickExample('flow')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              🌊 Flow Style
            </button>
            <button
              onClick={() => handleQuickExample('invalid')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-left"
            >
              ❌ Invalid Examples
            </button>
            <button
              onClick={() => handleQuickExample('complex')}
              className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-left"
            >
              🏗️ Complex Structure
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Validation Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Validation Details */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Validation Details</h3>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.syntaxValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Syntax:</span>
                <span className={validation.syntaxValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.syntaxValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.indentationValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Indentation:</span>
                <span className={validation.indentationValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.indentationValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.keysValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Keys:</span>
                <span className={validation.keysValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.keysValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.anchorsValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Anchors:</span>
                <span className={validation.anchorsValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.anchorsValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.referencesValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">References:</span>
                <span className={validation.referencesValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.referencesValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Document Analysis */}
        {analysis && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Document Analysis</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents:</span>
                  <span className="text-gray-800 font-medium">{analysis.documentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Lines:</span>
                  <span className="text-gray-800 font-medium">{analysis.totalLines}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Keys:</span>
                  <span className="text-gray-800 font-medium">{analysis.totalKeys}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Depth:</span>
                  <span className="text-gray-800 font-medium">{analysis.maxDepth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Indentation:</span>
                  <span className="text-gray-800 font-medium font-mono">
                    {getIndentationIcon(analysis.indentationStyle)} {analysis.indentationStyle} ({analysis.spacesPerIndent})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YAML Features */}
        {analysis && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">YAML Features</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-600">Comments:</span>
                  <span className={analysis.hasComments ? 'text-green-800' : 'text-gray-600'}>
                    {analysis.hasComments ? '✅ Present' : '❌ None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Anchors:</span>
                  <span className={analysis.hasAnchors ? 'text-green-800' : 'text-gray-600'}>
                    {analysis.hasAnchors ? '✅ Present' : '❌ None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">References:</span>
                  <span className={analysis.hasReferences ? 'text-green-800' : 'text-gray-600'}>
                    {analysis.hasReferences ? '✅ Present' : '❌ None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Flow Style:</span>
                  <span className={analysis.hasFlowStyle ? 'text-green-800' : 'text-gray-600'}>
                    {analysis.hasFlowStyle ? '✅ Present' : '❌ None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Multiline:</span>
                  <span className={analysis.hasMultilineStrings ? 'text-green-800' : 'text-gray-600'}>
                    {analysis.hasMultilineStrings ? '✅ Present' : '❌ None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Data Types:</span>
                  <span className="text-blue-800 font-medium font-mono text-xs">
                    {analysis.dataTypes.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validation && validation.errors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Validation Errors</h3>
            <div className="space-y-2">
              {validation.errors.slice(0, 5).map((error: any, index: number) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">
                      {error.severity === 'error' ? '❌' : error.severity === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div>
                      <span className="text-red-800">{error.message}</span>
                      {error.line && (
                        <div className="text-red-600 mt-1">Line {error.line}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {validation.errors.length > 5 && (
                <div className="text-xs text-gray-600 px-2">
                  ... and {validation.errors.length - 5} more errors
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis && analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Recommendations</h3>
            <div className="space-y-2">
              {analysis.recommendations.slice(0, 3).map((recommendation: string, index: number) => (
                <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">💡</span>
                    <span className="text-green-800">{recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Warnings</h3>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-800">{warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YAML Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">YAML Information</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">📄 About YAML</div>
              <div className="space-y-1">
                <div>• Human-readable data serialization standard</div>
                <div>• Supports scalars, sequences, and mappings</div>
                <div>• Uses indentation for structure (not tabs)</div>
                <div>• Supports anchors & references for reuse</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🗑️ Clear Data
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="YAML Document to Validate"
          value={input}
          onChange={setInput}
          placeholder="Enter YAML content to validate..."
          language="yaml"
        />

        <OutputPanel
          title="Validation Result"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="YAML validation results will appear here..."
          processingMessage="Validating YAML..."
          customActions={
            output && validation ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Results
                </button>
                <button
                  onClick={() => {
                    const report = `YAML Validation Report
Generated: ${new Date().toISOString()}

Status: ${validation.isValid ? 'VALID' : 'INVALID'}

Document Analysis:
- Documents: ${analysis?.documentCount || 1}
- Total Lines: ${analysis?.totalLines || 0}
- Total Keys: ${analysis?.totalKeys || 0}
- Max Depth: ${analysis?.maxDepth || 0}
- Indentation: ${analysis?.indentationStyle || 'unknown'} (${analysis?.spacesPerIndent || 0} spaces)
- Complexity: ${analysis?.complexity?.toUpperCase() || 'UNKNOWN'}

Features:
- Comments: ${analysis?.hasComments ? 'Present' : 'None'}
- Anchors: ${analysis?.hasAnchors ? 'Present' : 'None'}
- References: ${analysis?.hasReferences ? 'Present' : 'None'}
- Flow Style: ${analysis?.hasFlowStyle ? 'Present' : 'None'}
- Multiline Strings: ${analysis?.hasMultilineStrings ? 'Present' : 'None'}
- Data Types: ${analysis?.dataTypes?.join(', ') || 'None'}

Validation Results:
- Syntax: ${validation.syntaxValid ? 'Valid' : 'Invalid'}
- Indentation: ${validation.indentationValid ? 'Valid' : 'Invalid'}
- Keys: ${validation.keysValid ? 'Valid' : 'Invalid'}
- Anchors: ${validation.anchorsValid ? 'Valid' : 'Invalid'}
- References: ${validation.referencesValid ? 'Valid' : 'Invalid'}

${validation.errors.length > 0 ? `\nErrors:\n${validation.errors.map((e: any) => `- ${e.message}${e.line ? ` (line ${e.line})` : ''}`).join('\n')}` : ''}

${analysis && analysis.recommendations.length > 0 ? `\nRecommendations:\n${analysis.recommendations.map((r: string) => `- ${r}`).join('\n')}` : ''}

${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getValidationColor(validation.isValid)}`}>
                  {validation.isValid ? '✅ VALID' : '❌ INVALID'}
                </div>
                {analysis && (
                  <div className={`px-3 py-1 text-xs font-medium rounded ${getComplexityColor(analysis.complexity)}`}>
                    {analysis.complexity.toUpperCase()} COMPLEXITY
                  </div>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}