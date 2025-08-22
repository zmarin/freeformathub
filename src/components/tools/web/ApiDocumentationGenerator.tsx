import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processApiDocumentationGenerator, type ApiDocumentationConfig } from '../../../tools/web/api-documentation-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface ApiDocumentationGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: ApiDocumentationConfig = {
  inputFormat: 'openapi',
  outputFormat: 'markdown',
  includeExamples: true,
  includeSchemas: true,
  includeAuthentication: true,
  includeErrorCodes: true,
  includeRateLimiting: false,
  includeTestCases: false,
  documentationStyle: 'detailed',
  generateSDK: false,
  includeCodeSamples: true,
  codeLanguages: ['javascript', 'python', 'curl'],
  customBranding: false,
  includeChangelog: true,
};

const INPUT_OPTIONS = [
  {
    key: 'inputFormat',
    label: 'Input Format',
    type: 'select' as const,
    default: 'openapi',
    options: [
      { value: 'openapi', label: '📄 OpenAPI 3.0 - Modern API specification' },
      { value: 'swagger', label: '📋 Swagger 2.0 - Legacy API specification' },
      { value: 'postman', label: '📮 Postman Collection - API testing format' },
      { value: 'manual', label: '✍️ Manual Description - Text description' },
    ],
    description: 'Format of the input API specification',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'markdown',
    options: [
      { value: 'markdown', label: '📝 Markdown - GitHub/GitLab compatible' },
      { value: 'html', label: '🌐 HTML - Web-ready documentation' },
      { value: 'json', label: '📄 JSON - Structured data format' },
      { value: 'yaml', label: '📋 YAML - Human-readable format' },
    ],
    description: 'Output format for the generated documentation',
  },
  {
    key: 'documentationStyle',
    label: 'Documentation Style',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed - Complete information' },
      { value: 'compact', label: 'Compact - Essential information' },
      { value: 'minimal', label: 'Minimal - Basic overview only' },
    ],
    description: 'Level of detail in the generated documentation',
  },
] as const;

const CONTENT_OPTIONS = [
  {
    key: 'includeExamples',
    label: 'Include Examples',
    type: 'checkbox' as const,
    default: true,
    description: 'Include request/response examples',
  },
  {
    key: 'includeSchemas',
    label: 'Include Data Models',
    type: 'checkbox' as const,
    default: true,
    description: 'Include data model schemas and definitions',
  },
  {
    key: 'includeAuthentication',
    label: 'Authentication Info',
    type: 'checkbox' as const,
    default: true,
    description: 'Include authentication methods and examples',
  },
  {
    key: 'includeErrorCodes',
    label: 'Error Documentation',
    type: 'checkbox' as const,
    default: true,
    description: 'Include error codes and troubleshooting',
  },
  {
    key: 'includeCodeSamples',
    label: 'Code Examples',
    type: 'checkbox' as const,
    default: true,
    description: 'Generate code samples in multiple languages',
  },
  {
    key: 'includeChangelog',
    label: 'Version History',
    type: 'checkbox' as const,
    default: true,
    description: 'Include API version history and changes',
  },
  {
    key: 'includeRateLimiting',
    label: 'Rate Limiting',
    type: 'checkbox' as const,
    default: false,
    description: 'Include rate limiting information',
  },
  {
    key: 'includeTestCases',
    label: 'Test Cases',
    type: 'checkbox' as const,
    default: false,
    description: 'Include API testing scenarios',
  },
  {
    key: 'generateSDK',
    label: 'SDK Information',
    type: 'checkbox' as const,
    default: false,
    description: 'Include SDK installation and usage info',
  },
  {
    key: 'customBranding',
    label: 'Custom Branding',
    type: 'checkbox' as const,
    default: false,
    description: 'Include custom branding and styling',
  },
] as const;

const CODE_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'curl', name: 'cURL', icon: '💻' },
  { id: 'php', name: 'PHP', icon: '🐘' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'csharp', name: 'C#', icon: '🔷' },
  { id: 'ruby', name: 'Ruby', icon: '💎' },
  { id: 'go', name: 'Go', icon: '🔵' },
];

export function ApiDocumentationGenerator({ className = '' }: ApiDocumentationGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentation, setDocumentation] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<ApiDocumentationConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (currentInput: string, currentConfig: ApiDocumentationConfig) => {
      if (!currentInput.trim()) {
        setOutput('');
        setDocumentation(null);
        setError(null);
        setWarnings([]);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = await processApiDocumentationGenerator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setDocumentation(result.documentation);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'api-documentation-generator',
            input: currentInput.length > 100 ? currentInput.substring(0, 100) + '...' : currentInput,
            output: result.documentation ? 
              `${result.documentation.endpoints?.length || 0} endpoints, ${currentConfig.outputFormat} format` : 
              'Generated',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate API documentation');
          setOutput('');
          setDocumentation(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during documentation generation');
        setOutput('');
        setDocumentation(null);
      } finally {
        setIsProcessing(false);
      }
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('api-documentation-generator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleLanguageToggle = (languageId: string) => {
    setConfig(prev => ({
      ...prev,
      codeLanguages: prev.codeLanguages.includes(languageId)
        ? prev.codeLanguages.filter(id => id !== languageId)
        : [...prev.codeLanguages, languageId]
    }));
  };

  const handleQuickExample = (type: 'openapi' | 'swagger' | 'manual' | 'postman' | 'minimal' | 'rest' | 'graphql') => {
    const examples = {
      openapi: {
        data: `{
  "openapi": "3.0.0",
  "info": {
    "title": "User Management API",
    "version": "1.2.0",
    "description": "A comprehensive API for managing user accounts",
    "contact": {
      "name": "API Support",
      "email": "support@example.com"
    },
    "license": {
      "name": "MIT"
    }
  },
  "servers": [
    {
      "url": "https://api.example.com",
      "description": "Production server"
    }
  ],
  "paths": {
    "/users": {
      "get": {
        "summary": "Get all users",
        "description": "Retrieve a paginated list of users",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": {"type": "integer", "default": 1}
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {"type": "integer", "default": 10}
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "users": {"type": "array"},
                    "pagination": {"type": "object"}
                  }
                }
              }
            }
          }
        },
        "security": [{"bearerAuth": []}]
      },
      "post": {
        "summary": "Create new user",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {"type": "string", "example": "John Doe"},
                  "email": {"type": "string", "example": "john@example.com"},
                  "role": {"type": "string", "example": "user"}
                },
                "required": ["name", "email"]
              }
            }
          }
        },
        "responses": {
          "201": {"description": "User created"},
          "400": {"description": "Invalid data"}
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}`,
        config: { inputFormat: 'openapi', outputFormat: 'markdown', includeCodeSamples: true, includeAuthentication: true }
      },
      swagger: {
        data: `{
  "swagger": "2.0",
  "info": {
    "title": "Product API",
    "version": "1.0.0",
    "description": "API for managing products"
  },
  "host": "api.example.com",
  "basePath": "/v1",
  "schemes": ["https"],
  "paths": {
    "/products": {
      "get": {
        "summary": "List products",
        "parameters": [
          {
            "name": "category",
            "in": "query",
            "type": "string",
            "description": "Filter by category"
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "schema": {
              "type": "array",
              "items": {"$ref": "#/definitions/Product"}
            }
          }
        }
      }
    }
  },
  "definitions": {
    "Product": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "name": {"type": "string"},
        "price": {"type": "number"},
        "category": {"type": "string"}
      }
    }
  }
}`,
        config: { inputFormat: 'swagger', outputFormat: 'markdown', includeSchemas: true, includeExamples: true }
      },
      manual: {
        data: `Create comprehensive API documentation for a social media platform API.

The API should include:
- User management (registration, authentication, profiles)
- Post creation and management (create, edit, delete posts)
- Social interactions (likes, comments, follows)
- Media upload (images, videos)
- Real-time notifications
- Content moderation features

Authentication: JWT tokens with refresh token support
Rate limiting: 1000 requests per hour for authenticated users
Response format: JSON with consistent error handling

Base URL: https://api.socialmedia.com/v2

Include examples for all major endpoints and proper error documentation.`,
        config: { inputFormat: 'manual', outputFormat: 'markdown', includeCodeSamples: true, codeLanguages: ['javascript', 'python', 'curl'] }
      },
      postman: {
        data: `{
  "info": {
    "name": "E-commerce API",
    "description": "API for online store operations",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Products",
      "item": [
        {
          "name": "Get Products",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/products?page=1&limit=20",
              "host": ["{{baseUrl}}"],
              "path": ["products"],
              "query": [
                {"key": "page", "value": "1"},
                {"key": "limit", "value": "20"}
              ]
            }
          },
          "response": []
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.store.com"
    }
  ]
}`,
        config: { inputFormat: 'postman', outputFormat: 'html', includeExamples: true, includeCodeSamples: false }
      },
      minimal: {
        data: `Simple task management API with basic CRUD operations for tasks and user management.`,
        config: { inputFormat: 'manual', outputFormat: 'markdown', documentationStyle: 'minimal', includeCodeSamples: false }
      },
      rest: {
        data: `RESTful blog API with the following endpoints:
- GET /posts - List all blog posts
- GET /posts/{id} - Get specific post
- POST /posts - Create new post
- PUT /posts/{id} - Update post
- DELETE /posts/{id} - Delete post
- GET /posts/{id}/comments - Get post comments
- POST /posts/{id}/comments - Add comment

Authentication via API key in header.
Supports pagination, filtering, and search.`,
        config: { inputFormat: 'manual', outputFormat: 'markdown', includeAuthentication: true, includeErrorCodes: true }
      },
      graphql: {
        data: `GraphQL API documentation for a library management system:

Query types:
- books(filter: BookFilter): [Book]
- authors(limit: Int): [Author]
- book(id: ID!): Book

Mutation types:
- addBook(input: BookInput!): Book
- updateBook(id: ID!, input: BookInput!): Book
- deleteBook(id: ID!): Boolean

Types:
- Book: id, title, author, isbn, publishedDate, genre
- Author: id, name, biography, books
- BookInput: title, authorId, isbn, genre

Include subscription support for real-time updates.`,
        config: { inputFormat: 'manual', outputFormat: 'markdown', includeSchemas: true, documentationStyle: 'detailed' }
      }
    };
    
    const example = examples[type];
    setInput(example.data);
    
    // Apply configuration changes
    Object.entries(example.config).forEach(([key, value]) => {
      setConfig(prev => ({ ...prev, [key]: value }));
    });
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
    setConfig(DEFAULT_CONFIG);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInput(content);
        
        // Auto-detect format based on content
        try {
          const parsed = JSON.parse(content);
          if (parsed.openapi) {
            setConfig(prev => ({ ...prev, inputFormat: 'openapi' }));
          } else if (parsed.swagger) {
            setConfig(prev => ({ ...prev, inputFormat: 'swagger' }));
          } else if (parsed.info && parsed.item) {
            setConfig(prev => ({ ...prev, inputFormat: 'postman' }));
          }
        } catch {
          // Not JSON, assume manual format
          setConfig(prev => ({ ...prev, inputFormat: 'manual' }));
        }
      };
      reader.readAsText(file);
    }
  };

  // Build all options
  const allOptions = [
    ...INPUT_OPTIONS,
    ...CONTENT_OPTIONS,
  ];

  const getFormatColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'openapi': return 'text-green-800 bg-green-100';
      case 'swagger': return 'text-blue-800 bg-blue-100';
      case 'postman': return 'text-orange-800 bg-orange-100';
      case 'manual': return 'text-purple-800 bg-purple-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getOutputColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'markdown': return 'text-blue-800 bg-blue-100';
      case 'html': return 'text-green-800 bg-green-100';
      case 'json': return 'text-yellow-800 bg-yellow-100';
      case 'yaml': return 'text-purple-800 bg-purple-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* File Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">File Upload</h3>
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <input
              type="file"
              accept=".json,.yaml,.yml,.txt"
              onChange={handleFileUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="mt-2 text-xs text-gray-600">
              Upload OpenAPI, Swagger, or Postman collection files
            </div>
          </div>
        </div>

        {/* API Overview */}
        {documentation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">API Overview</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getFormatColor(config.inputFormat)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📚</div>
                  <div>
                    <div className="font-medium text-sm">
                      {documentation.metadata.title}
                    </div>
                    <div className="text-xs opacity-80">
                      v{documentation.metadata.version}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Endpoints:</span>
                    <span className="text-blue-800 font-medium">{documentation.endpoints?.length || 0}</span>
                  </div>
                </div>
                <div className="p-2 bg-green-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-600">Schemas:</span>
                    <span className="text-green-800 font-medium">{documentation.schemas?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Details */}
        {documentation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">API Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Base URL:</span>
                <span className="text-gray-800 font-mono text-xs truncate ml-2">{documentation.metadata.baseUrl}</span>
              </div>
              {documentation.metadata.contact && (
                <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Contact:</span>
                  <span className="text-gray-800 font-medium">{documentation.metadata.contact.email}</span>
                </div>
              )}
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Servers:</span>
                <span className="text-gray-800 font-medium">{documentation.metadata.servers?.length || 0}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Auth methods:</span>
                <span className="text-gray-800 font-medium">{documentation.authentication?.length || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Summary */}
        {documentation && documentation.endpoints && documentation.endpoints.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Endpoints</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {documentation.endpoints.slice(0, 10).map((endpoint: any, index: number) => (
                <div key={index} className="p-2 bg-indigo-50 border border-indigo-200 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                      endpoint.method === 'GET' ? 'bg-blue-500' :
                      endpoint.method === 'POST' ? 'bg-green-500' :
                      endpoint.method === 'PUT' ? 'bg-yellow-500' :
                      endpoint.method === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-indigo-800">{endpoint.path}</span>
                  </div>
                  <div className="mt-1 text-indigo-700 truncate">{endpoint.summary}</div>
                </div>
              ))}
              {documentation.endpoints.length > 10 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  ... and {documentation.endpoints.length - 10} more endpoints
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code Languages */}
        {config.includeCodeSamples && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Code Languages</h3>
            <div className="grid grid-cols-2 gap-2">
              {CODE_LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageToggle(lang.id)}
                  className={`px-3 py-2 text-xs rounded transition-colors text-left ${
                    config.codeLanguages.includes(lang.id)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang.icon} {lang.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('openapi')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📄 OpenAPI 3.0 Spec
            </button>
            <button
              onClick={() => handleQuickExample('swagger')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              📋 Swagger 2.0 Spec
            </button>
            <button
              onClick={() => handleQuickExample('manual')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              ✍️ Manual Description
            </button>
            <button
              onClick={() => handleQuickExample('postman')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              📮 Postman Collection
            </button>
            <button
              onClick={() => handleQuickExample('rest')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              🔄 REST API
            </button>
            <button
              onClick={() => handleQuickExample('minimal')}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors text-left"
            >
              📋 Minimal API
            </button>
            <button
              onClick={() => handleQuickExample('graphql')}
              className="px-3 py-2 text-xs bg-pink-100 text-pink-800 rounded hover:bg-pink-200 transition-colors text-left"
            >
              🎯 GraphQL API
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Documentation Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

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

        {/* Tool Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">About API Docs</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">📚 Documentation Features</div>
              <div className="space-y-1">
                <div>• OpenAPI/Swagger specification support</div>
                <div>• Multi-language code examples</div>
                <div>• Interactive request/response examples</div>
                <div>• Authentication and error documentation</div>
                <div>• Multiple output formats (MD, HTML, JSON)</div>
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
          title="API Specification or Description"
          value={input}
          onChange={setInput}
          placeholder={`Enter your API specification or description here...

Examples:
• OpenAPI 3.0 JSON/YAML specification
• Swagger 2.0 specification  
• Postman collection JSON
• Manual API description in text

For OpenAPI/Swagger:
{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "Get users"
      }
    }
  }
}

For manual description:
"Create documentation for a user management API with endpoints for CRUD operations, JWT authentication, and pagination support."`}
          language={config.inputFormat === 'openapi' || config.inputFormat === 'swagger' || config.inputFormat === 'postman' ? 'json' : 'text'}
        />

        <OutputPanel
          title="Generated API Documentation"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : config.outputFormat === 'yaml' ? 'yaml' : config.outputFormat === 'html' ? 'html' : 'markdown'}
          placeholder="Comprehensive API documentation will appear here..."
          processingMessage="Generating API documentation..."
          customActions={
            output && documentation ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Documentation
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { 
                      type: config.outputFormat === 'html' ? 'text/html' :
                           config.outputFormat === 'json' ? 'application/json' :
                           config.outputFormat === 'yaml' ? 'text/yaml' : 'text/markdown'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `api-docs.${config.outputFormat === 'markdown' ? 'md' : config.outputFormat}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download Docs
                </button>
                <button
                  onClick={() => {
                    const summary = `API: ${documentation.metadata.title} v${documentation.metadata.version}\nEndpoints: ${documentation.endpoints?.length || 0}\nSchemas: ${documentation.schemas?.length || 0}`;
                    navigator.clipboard?.writeText(summary);
                  }}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  📄 Copy Summary
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getFormatColor(config.inputFormat)}`}>
                  {config.inputFormat.toUpperCase()}
                </div>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getOutputColor(config.outputFormat)}`}>
                  {config.outputFormat.toUpperCase()}
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {documentation.endpoints?.length || 0} endpoints
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}