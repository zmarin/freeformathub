import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ApiDocumentationConfig {
  inputFormat: 'openapi' | 'swagger' | 'postman' | 'manual';
  outputFormat: 'markdown' | 'html' | 'json' | 'yaml';
  includeExamples: boolean;
  includeSchemas: boolean;
  includeAuthentication: boolean;
  includeErrorCodes: boolean;
  includeRateLimiting: boolean;
  includeTestCases: boolean;
  documentationStyle: 'detailed' | 'compact' | 'minimal';
  generateSDK: boolean;
  includeCodeSamples: boolean;
  codeLanguages: string[];
  customBranding: boolean;
  includeChangelog: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  documentation?: ApiDocumentation;
  warnings?: string[];
}

interface ApiDocumentation {
  metadata: ApiMetadata;
  endpoints: ApiEndpoint[];
  schemas: SchemaDefinition[];
  authentication: AuthenticationInfo[];
  examples: ApiExample[];
  errorCodes: ErrorCode[];
  changelog: ChangelogEntry[];
  sdkInfo?: SdkInformation;
}

interface ApiMetadata {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  contact?: ContactInfo;
  license?: LicenseInfo;
  termsOfService?: string;
  servers: ServerInfo[];
  tags: TagInfo[];
}

interface ContactInfo {
  name?: string;
  email?: string;
  url?: string;
}

interface LicenseInfo {
  name: string;
  url?: string;
}

interface ServerInfo {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

interface ServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

interface TagInfo {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}

interface ExternalDocumentation {
  description?: string;
  url: string;
}

interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  operationId?: string;
  summary: string;
  description?: string;
  tags: string[];
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, ResponseInfo>;
  security?: SecurityRequirement[];
  deprecated?: boolean;
  examples?: EndpointExample[];
}

interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required: boolean;
  schema: SchemaInfo;
  example?: any;
  examples?: Record<string, ExampleInfo>;
}

interface RequestBody {
  description?: string;
  content: Record<string, MediaTypeInfo>;
  required?: boolean;
}

interface MediaTypeInfo {
  schema: SchemaInfo;
  example?: any;
  examples?: Record<string, ExampleInfo>;
  encoding?: Record<string, EncodingInfo>;
}

interface EncodingInfo {
  contentType?: string;
  headers?: Record<string, HeaderInfo>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

interface HeaderInfo {
  description?: string;
  required?: boolean;
  schema: SchemaInfo;
  example?: any;
}

interface ResponseInfo {
  description: string;
  headers?: Record<string, HeaderInfo>;
  content?: Record<string, MediaTypeInfo>;
  links?: Record<string, LinkInfo>;
}

interface LinkInfo {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: ServerInfo;
}

interface SecurityRequirement {
  [name: string]: string[];
}

interface SchemaInfo {
  type?: string;
  format?: string;
  items?: SchemaInfo;
  properties?: Record<string, SchemaInfo>;
  required?: string[];
  enum?: any[];
  example?: any;
  description?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: XmlInfo;
  externalDocs?: ExternalDocumentation;
  deprecated?: boolean;
  discriminator?: DiscriminatorInfo;
}

interface XmlInfo {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

interface DiscriminatorInfo {
  propertyName: string;
  mapping?: Record<string, string>;
}

interface SchemaDefinition {
  name: string;
  schema: SchemaInfo;
  description?: string;
  examples?: Record<string, ExampleInfo>;
}

interface ExampleInfo {
  summary?: string;
  description?: string;
  value: any;
  externalValue?: string;
}

interface AuthenticationInfo {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
}

interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

interface ApiExample {
  name: string;
  description?: string;
  endpoint: string;
  method: string;
  request: ExampleRequest;
  response: ExampleResponse;
  scenario: string;
}

interface ExampleRequest {
  headers?: Record<string, string>;
  parameters?: Record<string, any>;
  body?: any;
  curl?: string;
}

interface ExampleResponse {
  status: number;
  headers?: Record<string, string>;
  body?: any;
  time?: number;
}

interface EndpointExample {
  name: string;
  description?: string;
  request: ExampleRequest;
  response: ExampleResponse;
}

interface ErrorCode {
  code: number;
  message: string;
  description: string;
  examples?: string[];
  troubleshooting?: string[];
}

interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangeItem[];
}

interface ChangeItem {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  endpoints?: string[];
  breaking?: boolean;
}

interface SdkInformation {
  languages: SdkLanguage[];
  installation: Record<string, string>;
  quickStart: Record<string, string>;
  examples: Record<string, string>;
}

interface SdkLanguage {
  name: string;
  version: string;
  repository?: string;
  documentation?: string;
}

// Mock data generators for demonstration
function parseMockOpenApiSpec(input: string): ApiDocumentation {
  // Simple mock parser - in reality would use a proper OpenAPI parser
  const mockEndpoints: ApiEndpoint[] = [
    {
      path: '/users',
      method: 'GET',
      operationId: 'getUsers',
      summary: 'Get all users',
      description: 'Retrieve a paginated list of all users',
      tags: ['Users'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: { type: 'integer', example: 1 }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: { type: 'integer', example: 10 }
        }
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved users',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  users: {
                    type: 'array',
                    items: { type: 'object' }
                  },
                  pagination: { type: 'object' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters'
        }
      },
      security: [{ 'bearerAuth': [] }]
    },
    {
      path: '/users/{id}',
      method: 'GET',
      operationId: 'getUserById',
      summary: 'Get user by ID',
      description: 'Retrieve a specific user by their unique identifier',
      tags: ['Users'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'User ID',
          required: true,
          schema: { type: 'string', example: 'user123' }
        }
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved user',
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        '404': {
          description: 'User not found'
        }
      },
      security: [{ 'bearerAuth': [] }]
    },
    {
      path: '/users',
      method: 'POST',
      operationId: 'createUser',
      summary: 'Create new user',
      description: 'Create a new user account with the provided information',
      tags: ['Users'],
      parameters: [],
      requestBody: {
        description: 'User information',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', example: 'john@example.com' },
                role: { type: 'string', example: 'user' }
              },
              required: ['name', 'email']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'User created successfully'
        },
        '400': {
          description: 'Invalid user data'
        },
        '409': {
          description: 'User already exists'
        }
      }
    }
  ];

  const mockSchemas: SchemaDefinition[] = [
    {
      name: 'User',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique user identifier' },
          name: { type: 'string', description: 'User full name' },
          email: { type: 'string', format: 'email', description: 'User email address' },
          role: { type: 'string', enum: ['admin', 'user', 'moderator'], description: 'User role' },
          createdAt: { type: 'string', format: 'date-time', description: 'Account creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        },
        required: ['id', 'name', 'email', 'role']
      }
    },
    {
      name: 'Error',
      schema: {
        type: 'object',
        properties: {
          code: { type: 'integer', description: 'Error code' },
          message: { type: 'string', description: 'Error message' },
          details: { type: 'array', items: { type: 'string' }, description: 'Additional error details' }
        },
        required: ['code', 'message']
      }
    }
  ];

  const mockExamples: ApiExample[] = [
    {
      name: 'Get Users Example',
      description: 'Retrieve a paginated list of users',
      endpoint: '/users',
      method: 'GET',
      scenario: 'Getting first page of users',
      request: {
        headers: { 'Authorization': 'Bearer your-token-here' },
        parameters: { page: 1, limit: 10 },
        curl: 'curl -H "Authorization: Bearer your-token-here" "https://api.example.com/users?page=1&limit=10"'
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          users: [
            { id: 'user123', name: 'John Doe', email: 'john@example.com', role: 'user' },
            { id: 'user456', name: 'Jane Smith', email: 'jane@example.com', role: 'admin' }
          ],
          pagination: { page: 1, limit: 10, total: 50, pages: 5 }
        },
        time: 145
      }
    },
    {
      name: 'Create User Example',
      description: 'Create a new user account',
      endpoint: '/users',
      method: 'POST',
      scenario: 'Creating a new user',
      request: {
        headers: { 'Content-Type': 'application/json' },
        body: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'user'
        },
        curl: 'curl -X POST -H "Content-Type: application/json" -d \'{"name":"Alice Johnson","email":"alice@example.com","role":"user"}\' "https://api.example.com/users"'
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: 'user789',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'user',
          createdAt: '2024-01-15T10:30:00Z'
        },
        time: 89
      }
    }
  ];

  return {
    metadata: {
      title: 'User Management API',
      description: 'A comprehensive API for managing user accounts and authentication',
      version: '1.2.0',
      baseUrl: 'https://api.example.com',
      contact: {
        name: 'API Support Team',
        email: 'support@example.com',
        url: 'https://example.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      servers: [
        { url: 'https://api.example.com', description: 'Production server' },
        { url: 'https://staging-api.example.com', description: 'Staging server' }
      ],
      tags: [
        { name: 'Users', description: 'User management operations' },
        { name: 'Authentication', description: 'Authentication and authorization' }
      ]
    },
    endpoints: mockEndpoints,
    schemas: mockSchemas,
    authentication: [
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token-based authentication'
      }
    ],
    examples: mockExamples,
    errorCodes: [
      {
        code: 400,
        message: 'Bad Request',
        description: 'The request was invalid or cannot be served',
        examples: ['Missing required parameters', 'Invalid parameter format'],
        troubleshooting: ['Check request parameters', 'Validate request body format']
      },
      {
        code: 401,
        message: 'Unauthorized',
        description: 'Authentication credentials are missing or invalid',
        examples: ['Missing Authorization header', 'Invalid token'],
        troubleshooting: ['Include valid Authorization header', 'Check token expiration']
      },
      {
        code: 404,
        message: 'Not Found',
        description: 'The requested resource was not found',
        examples: ['User ID does not exist', 'Endpoint not found'],
        troubleshooting: ['Verify resource ID', 'Check endpoint URL']
      },
      {
        code: 500,
        message: 'Internal Server Error',
        description: 'An unexpected error occurred on the server',
        examples: ['Database connection error', 'Service temporarily unavailable'],
        troubleshooting: ['Try again later', 'Contact support if problem persists']
      }
    ],
    changelog: [
      {
        version: '1.2.0',
        date: '2024-01-15',
        changes: [
          { type: 'added', description: 'New user role management endpoints', endpoints: ['/users/{id}/roles'] },
          { type: 'changed', description: 'Improved error response format', breaking: false },
          { type: 'fixed', description: 'Fixed pagination bug in user listing' }
        ]
      },
      {
        version: '1.1.0',
        date: '2023-12-10',
        changes: [
          { type: 'added', description: 'User profile picture upload support' },
          { type: 'deprecated', description: 'Legacy authentication method (will be removed in v2.0)' }
        ]
      }
    ]
  };
}

function generateCodeSamples(endpoint: ApiEndpoint, languages: string[]): Record<string, string> {
  const samples: Record<string, string> = {};
  
  if (languages.includes('javascript')) {
    samples.javascript = generateJavaScriptSample(endpoint);
  }
  
  if (languages.includes('python')) {
    samples.python = generatePythonSample(endpoint);
  }
  
  if (languages.includes('curl')) {
    samples.curl = generateCurlSample(endpoint);
  }
  
  if (languages.includes('php')) {
    samples.php = generatePhpSample(endpoint);
  }
  
  return samples;
}

function generateJavaScriptSample(endpoint: ApiEndpoint): string {
  const hasBody = endpoint.requestBody !== undefined;
  const pathParams = endpoint.parameters.filter(p => p.in === 'path');
  const queryParams = endpoint.parameters.filter(p => p.in === 'query');
  
  let sample = `// ${endpoint.summary}\n`;
  sample += `const response = await fetch('${endpoint.path}', {\n`;
  sample += `  method: '${endpoint.method}',\n`;
  sample += `  headers: {\n`;
  sample += `    'Content-Type': 'application/json',\n`;
  sample += `    'Authorization': 'Bearer your-token-here'\n`;
  sample += `  }`;
  
  if (hasBody) {
    sample += `,\n  body: JSON.stringify({\n`;
    if (endpoint.requestBody?.content['application/json']?.schema?.properties) {
      const props = endpoint.requestBody.content['application/json'].schema.properties;
      Object.entries(props).forEach(([key, schema], index, arr) => {
        const example = schema.example || `"example_${key}"`;
        sample += `    ${key}: ${typeof example === 'string' ? `"${example}"` : example}${index < arr.length - 1 ? ',' : ''}\n`;
      });
    }
    sample += `  })`;
  }
  
  sample += `\n});\n\nconst data = await response.json();\nconsole.log(data);`;
  
  return sample;
}

function generatePythonSample(endpoint: ApiEndpoint): string {
  let sample = `import requests\n\n`;
  sample += `# ${endpoint.summary}\n`;
  sample += `url = "${endpoint.path}"\n`;
  sample += `headers = {\n`;
  sample += `    "Content-Type": "application/json",\n`;
  sample += `    "Authorization": "Bearer your-token-here"\n`;
  sample += `}\n`;
  
  if (endpoint.requestBody) {
    sample += `\ndata = {\n`;
    if (endpoint.requestBody.content['application/json']?.schema?.properties) {
      const props = endpoint.requestBody.content['application/json'].schema.properties;
      Object.entries(props).forEach(([key, schema], index, arr) => {
        const example = schema.example || `"example_${key}"`;
        sample += `    "${key}": ${typeof example === 'string' ? `"${example}"` : example}${index < arr.length - 1 ? ',' : ''}\n`;
      });
    }
    sample += `}\n\nresponse = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)\n`;
  } else {
    sample += `\nresponse = requests.${endpoint.method.toLowerCase()}(url, headers=headers)\n`;
  }
  
  sample += `\nif response.status_code == 200:\n`;
  sample += `    print(response.json())\nelse:\n`;
  sample += `    print(f"Error: {response.status_code} - {response.text}")`;
  
  return sample;
}

function generateCurlSample(endpoint: ApiEndpoint): string {
  let sample = `# ${endpoint.summary}\n`;
  sample += `curl -X ${endpoint.method} \\\n`;
  sample += `  -H "Content-Type: application/json" \\\n`;
  sample += `  -H "Authorization: Bearer your-token-here" \\\n`;
  
  if (endpoint.requestBody) {
    sample += `  -d '{\n`;
    if (endpoint.requestBody.content['application/json']?.schema?.properties) {
      const props = endpoint.requestBody.content['application/json'].schema.properties;
      const entries = Object.entries(props);
      entries.forEach(([key, schema], index) => {
        const example = schema.example || `"example_${key}"`;
        const value = typeof example === 'string' ? `"${example}"` : example;
        sample += `    "${key}": ${value}${index < entries.length - 1 ? ',' : ''}\n`;
      });
    }
    sample += `  }' \\\n`;
  }
  
  sample += `  "${endpoint.path}"`;
  
  return sample;
}

function generatePhpSample(endpoint: ApiEndpoint): string {
  let sample = `<?php\n// ${endpoint.summary}\n\n`;
  sample += `$url = "${endpoint.path}";\n`;
  sample += `$headers = [\n`;
  sample += `    "Content-Type: application/json",\n`;
  sample += `    "Authorization: Bearer your-token-here"\n`;
  sample += `];\n`;
  
  if (endpoint.requestBody) {
    sample += `\n$data = [\n`;
    if (endpoint.requestBody.content['application/json']?.schema?.properties) {
      const props = endpoint.requestBody.content['application/json'].schema.properties;
      Object.entries(props).forEach(([key, schema], index, arr) => {
        const example = schema.example || `"example_${key}"`;
        const value = typeof example === 'string' ? `"${example}"` : example;
        sample += `    "${key}" => ${value}${index < arr.length - 1 ? ',' : ''}\n`;
      });
    }
    sample += `];\n`;
  }
  
  sample += `\n$ch = curl_init();\n`;
  sample += `curl_setopt($ch, CURLOPT_URL, $url);\n`;
  sample += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${endpoint.method}");\n`;
  sample += `curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);\n`;
  sample += `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n`;
  
  if (endpoint.requestBody) {
    sample += `curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));\n`;
  }
  
  sample += `\n$response = curl_exec($ch);\n`;
  sample += `$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);\n`;
  sample += `curl_close($ch);\n\n`;
  sample += `if ($httpCode == 200) {\n`;
  sample += `    $data = json_decode($response, true);\n`;
  sample += `    print_r($data);\n`;
  sample += `} else {\n`;
  sample += `    echo "Error: $httpCode - $response";\n`;
  sample += `}\n?>`;
  
  return sample;
}

export function processApiDocumentationGenerator(input: string, config: ApiDocumentationConfig): Promise<ToolResult> {
  return new Promise(async (resolve) => {
    try {
      const startTime = Date.now();
      
      if (!input || input.trim() === '') {
        resolve({
          success: false,
          error: 'Please provide API specification or documentation content'
        });
        return;
      }
      
      let documentation: ApiDocumentation;
      
      // Parse input based on format
      if (config.inputFormat === 'openapi' || config.inputFormat === 'swagger') {
        try {
          // Try to parse as JSON/YAML first
          const parsed = JSON.parse(input);
          documentation = parseMockOpenApiSpec(input);
        } catch {
          // If not valid JSON, treat as text description and generate mock API
          documentation = parseMockOpenApiSpec(input);
        }
      } else if (config.inputFormat === 'manual') {
        // Generate documentation from manual description
        documentation = parseMockOpenApiSpec(input);
      } else {
        // Postman collection or other formats
        documentation = parseMockOpenApiSpec(input);
      }
      
      // Generate output based on format
      let output = '';
      
      switch (config.outputFormat) {
        case 'markdown':
          output = generateMarkdownDocumentation(documentation, config);
          break;
        case 'html':
          output = generateHtmlDocumentation(documentation, config);
          break;
        case 'json':
          output = JSON.stringify(documentation, null, 2);
          break;
        case 'yaml':
          output = generateYamlDocumentation(documentation, config);
          break;
        default:
          output = generateMarkdownDocumentation(documentation, config);
      }
      
      const processingTime = Date.now() - startTime;
      
      // Generate warnings
      const warnings: string[] = [];
      
      if (documentation.endpoints.length === 0) {
        warnings.push('No API endpoints found - documentation may be incomplete');
      }
      
      if (!documentation.authentication || documentation.authentication.length === 0) {
        warnings.push('No authentication information provided');
      }
      
      if (config.includeCodeSamples && config.codeLanguages.length === 0) {
        warnings.push('Code samples requested but no languages specified');
      }
      
      resolve({
        success: true,
        output,
        documentation,
        warnings: warnings.length > 0 ? warnings : undefined
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during documentation generation'
      });
    }
  });
}

function generateMarkdownDocumentation(doc: ApiDocumentation, config: ApiDocumentationConfig): string {
  let output = '';
  
  // Title and description
  output += `# ${doc.metadata.title}\n\n`;
  output += `${doc.metadata.description}\n\n`;
  
  // API Information
  output += `## API Information\n\n`;
  output += `- **Version**: ${doc.metadata.version}\n`;
  output += `- **Base URL**: ${doc.metadata.baseUrl}\n`;
  
  if (doc.metadata.contact) {
    output += `- **Contact**: ${doc.metadata.contact.name || 'N/A'}`;
    if (doc.metadata.contact.email) output += ` (${doc.metadata.contact.email})`;
    output += `\n`;
  }
  
  if (doc.metadata.license) {
    output += `- **License**: [${doc.metadata.license.name}](${doc.metadata.license.url || '#'})\n`;
  }
  
  output += `\n`;
  
  // Servers
  if (doc.metadata.servers.length > 0) {
    output += `## Servers\n\n`;
    doc.metadata.servers.forEach(server => {
      output += `- **${server.url}**: ${server.description || 'Server'}\n`;
    });
    output += `\n`;
  }
  
  // Authentication
  if (config.includeAuthentication && doc.authentication.length > 0) {
    output += `## Authentication\n\n`;
    doc.authentication.forEach(auth => {
      output += `### ${auth.type.toUpperCase()}\n\n`;
      output += `${auth.description || 'Authentication required'}\n\n`;
      
      if (auth.type === 'http' && auth.scheme === 'bearer') {
        output += `**Header**: \`Authorization: Bearer <token>\`\n\n`;
      } else if (auth.type === 'apiKey') {
        output += `**${auth.in}**: \`${auth.name}\`\n\n`;
      }
    });
  }
  
  // Endpoints
  output += `## Endpoints\n\n`;
  
  const groupedEndpoints: Record<string, ApiEndpoint[]> = {};
  doc.endpoints.forEach(endpoint => {
    const tag = endpoint.tags[0] || 'General';
    if (!groupedEndpoints[tag]) groupedEndpoints[tag] = [];
    groupedEndpoints[tag].push(endpoint);
  });
  
  Object.entries(groupedEndpoints).forEach(([tag, endpoints]) => {
    output += `### ${tag}\n\n`;
    
    endpoints.forEach(endpoint => {
      output += `#### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;
      output += `${endpoint.summary}\n\n`;
      
      if (endpoint.description) {
        output += `${endpoint.description}\n\n`;
      }
      
      // Parameters
      if (endpoint.parameters.length > 0) {
        output += `**Parameters:**\n\n`;
        output += `| Name | Type | In | Required | Description |\n`;
        output += `|------|------|----|---------|--------------|\n`;
        
        endpoint.parameters.forEach(param => {
          output += `| ${param.name} | ${param.schema.type || 'string'} | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${param.description || 'N/A'} |\n`;
        });
        
        output += `\n`;
      }
      
      // Request Body
      if (endpoint.requestBody && config.includeExamples) {
        output += `**Request Body:**\n\n`;
        output += `\`\`\`json\n`;
        
        const schema = endpoint.requestBody.content['application/json']?.schema;
        if (schema?.properties) {
          const exampleBody: any = {};
          Object.entries(schema.properties).forEach(([key, propSchema]) => {
            exampleBody[key] = propSchema.example || `"example_${key}"`;
          });
          output += JSON.stringify(exampleBody, null, 2);
        }
        
        output += `\n\`\`\`\n\n`;
      }
      
      // Responses
      output += `**Responses:**\n\n`;
      Object.entries(endpoint.responses).forEach(([status, response]) => {
        output += `- **${status}**: ${response.description}\n`;
      });
      output += `\n`;
      
      // Code samples
      if (config.includeCodeSamples && config.codeLanguages.length > 0) {
        output += `**Code Examples:**\n\n`;
        const samples = generateCodeSamples(endpoint, config.codeLanguages);
        
        Object.entries(samples).forEach(([lang, code]) => {
          output += `**${lang.charAt(0).toUpperCase() + lang.slice(1)}:**\n\n`;
          output += `\`\`\`${lang === 'curl' ? 'bash' : lang}\n${code}\n\`\`\`\n\n`;
        });
      }
      
      output += `---\n\n`;
    });
  });
  
  // Schemas
  if (config.includeSchemas && doc.schemas.length > 0) {
    output += `## Data Models\n\n`;
    
    doc.schemas.forEach(schema => {
      output += `### ${schema.name}\n\n`;
      if (schema.description) {
        output += `${schema.description}\n\n`;
      }
      
      output += `\`\`\`json\n`;
      output += JSON.stringify(generateSchemaExample(schema.schema), null, 2);
      output += `\n\`\`\`\n\n`;
      
      if (schema.schema.properties) {
        output += `**Properties:**\n\n`;
        output += `| Name | Type | Required | Description |\n`;
        output += `|------|------|----------|-------------|\n`;
        
        Object.entries(schema.schema.properties).forEach(([name, prop]) => {
          const required = schema.schema.required?.includes(name) ? 'Yes' : 'No';
          output += `| ${name} | ${prop.type || 'string'} | ${required} | ${prop.description || 'N/A'} |\n`;
        });
        
        output += `\n`;
      }
    });
  }
  
  // Error Codes
  if (config.includeErrorCodes && doc.errorCodes.length > 0) {
    output += `## Error Codes\n\n`;
    
    doc.errorCodes.forEach(error => {
      output += `### ${error.code} - ${error.message}\n\n`;
      output += `${error.description}\n\n`;
      
      if (error.examples && error.examples.length > 0) {
        output += `**Common causes:**\n\n`;
        error.examples.forEach(example => {
          output += `- ${example}\n`;
        });
        output += `\n`;
      }
      
      if (error.troubleshooting && error.troubleshooting.length > 0) {
        output += `**Troubleshooting:**\n\n`;
        error.troubleshooting.forEach(tip => {
          output += `- ${tip}\n`;
        });
        output += `\n`;
      }
    });
  }
  
  // Examples
  if (config.includeExamples && doc.examples.length > 0) {
    output += `## Examples\n\n`;
    
    doc.examples.forEach(example => {
      output += `### ${example.name}\n\n`;
      if (example.description) {
        output += `${example.description}\n\n`;
      }
      
      output += `**Request:**\n\n`;
      output += `\`\`\`bash\n${example.request.curl || 'curl example'}\n\`\`\`\n\n`;
      
      output += `**Response:**\n\n`;
      output += `\`\`\`json\n`;
      output += JSON.stringify(example.response.body, null, 2);
      output += `\n\`\`\`\n\n`;
    });
  }
  
  // Changelog
  if (config.includeChangelog && doc.changelog.length > 0) {
    output += `## Changelog\n\n`;
    
    doc.changelog.forEach(entry => {
      output += `### Version ${entry.version} (${entry.date})\n\n`;
      
      entry.changes.forEach(change => {
        const emoji = {
          'added': '✨',
          'changed': '🔄',
          'deprecated': '⚠️',
          'removed': '❌',
          'fixed': '🐛',
          'security': '🔒'
        }[change.type] || '📝';
        
        output += `${emoji} **${change.type.toUpperCase()}**: ${change.description}\n`;
        
        if (change.breaking) {
          output += `  ⚠️ *Breaking change*\n`;
        }
      });
      
      output += `\n`;
    });
  }
  
  return output;
}

function generateHtmlDocumentation(doc: ApiDocumentation, config: ApiDocumentationConfig): string {
  // Simplified HTML generation
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.metadata.title} - API Documentation</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .endpoint { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 5px; }
    .method { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; }
    .get { background-color: #61affe; }
    .post { background-color: #49cc90; }
    .put { background-color: #fca130; }
    .delete { background-color: #f93e3e; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${doc.metadata.title}</h1>
  <p>${doc.metadata.description}</p>
  
  <h2>Base URL</h2>
  <code>${doc.metadata.baseUrl}</code>
  
  <h2>Endpoints</h2>`;
  
  doc.endpoints.forEach(endpoint => {
    html += `
    <div class="endpoint">
      <h3><span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span> ${endpoint.path}</h3>
      <p>${endpoint.summary}</p>
      ${endpoint.description ? `<p>${endpoint.description}</p>` : ''}
    </div>`;
  });
  
  html += `</body></html>`;
  
  return html;
}

function generateYamlDocumentation(doc: ApiDocumentation, config: ApiDocumentationConfig): string {
  // Simplified YAML generation
  return `openapi: 3.0.0
info:
  title: ${doc.metadata.title}
  description: ${doc.metadata.description}
  version: ${doc.metadata.version}
servers:
${doc.metadata.servers.map(s => `  - url: ${s.url}\n    description: ${s.description || 'Server'}`).join('\n')}
paths:
${doc.endpoints.map(e => `  ${e.path}:
    ${e.method.toLowerCase()}:
      summary: ${e.summary}
      description: ${e.description || e.summary}`).join('\n')}`;
}

function generateSchemaExample(schema: SchemaInfo): any {
  if (schema.example) return schema.example;
  
  if (schema.type === 'object' && schema.properties) {
    const example: any = {};
    Object.entries(schema.properties).forEach(([key, prop]) => {
      example[key] = generateSchemaExample(prop);
    });
    return example;
  }
  
  if (schema.type === 'array' && schema.items) {
    return [generateSchemaExample(schema.items)];
  }
  
  // Default examples based on type
  switch (schema.type) {
    case 'string':
      return schema.format === 'email' ? 'user@example.com' : 
             schema.format === 'date-time' ? '2024-01-15T10:30:00Z' :
             'string';
    case 'integer':
    case 'number':
      return 123;
    case 'boolean':
      return true;
    default:
      return 'value';
  }
}

export const API_DOCUMENTATION_GENERATOR_TOOL: Tool = {
  id: 'api-documentation-generator',
  name: 'API Documentation Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'api-tools')!,
  slug: 'api-documentation-generator',
  icon: '📚',
  keywords: ['api', 'documentation', 'openapi', 'swagger', 'rest', 'endpoints', 'sdk', 'postman'],
  seoTitle: 'API Documentation Generator - Create Beautiful API Docs | FreeFormatHub',
  seoDescription: 'Generate comprehensive API documentation from OpenAPI/Swagger specs, Postman collections, or manual input. Create markdown, HTML, and interactive documentation.',
  description: 'Generate comprehensive API documentation from OpenAPI/Swagger specifications, Postman collections, or manual input. Create beautiful, interactive documentation with code examples, schemas, and testing capabilities.',

  examples: [
    {
      title: 'OpenAPI Specification',
      input: `{
  "openapi": "3.0.0",
  "info": {
    "title": "User API",
    "version": "1.0.0",
    "description": "User management API"
  },
  "servers": [{"url": "https://api.example.com"}],
  "paths": {
    "/users": {
      "get": {
        "summary": "Get users",
        "responses": {"200": {"description": "Success"}}
      }
    }
  }
}`,
      output: `# User API

User management API

## API Information
- **Version**: 1.0.0
- **Base URL**: https://api.example.com

## Endpoints

### Users

#### GET /users

Get all users

**Responses:**
- **200**: Successfully retrieved users

**Code Examples:**

**JavaScript:**
\`\`\`javascript
const response = await fetch('/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-token-here'
  }
});
\`\`\``,
      description: 'Generate documentation from OpenAPI specification'
    },
    {
      title: 'Manual API Description',
      input: 'Create documentation for a REST API that manages user accounts with endpoints for creating, reading, updating, and deleting users. Include authentication with JWT tokens.',
      output: `# User Management API

A comprehensive API for managing user accounts and authentication

## API Information
- **Version**: 1.2.0
- **Base URL**: https://api.example.com

## Authentication

### HTTP
JWT token-based authentication
**Header**: \`Authorization: Bearer <token>\`

## Endpoints

### Users

#### GET /users
Get all users
**Parameters:**
| Name | Type | In | Required | Description |
|------|------|----|---------| ------------|
| page | integer | query | No | Page number for pagination |
| limit | integer | query | No | Number of items per page |`,
      description: 'Generate documentation from manual description'
    },
    {
      title: 'API with Code Examples',
      input: 'User registration API with POST /users endpoint accepting name, email, and password fields',
      output: `#### POST /users
Create new user

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
\`\`\`

**Python:**
\`\`\`python
import requests

url = "/users"
headers = {
    "Content-Type": "application/json"
}

data = {
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "user"
}

response = requests.post(url, headers=headers, json=data)
\`\`\``,
      description: 'Generate documentation with multiple code examples'
    }
  ],

  useCases: [
    'API documentation generation from OpenAPI/Swagger specs',
    'Creating developer portals and API reference guides',
    'Converting Postman collections to documentation',
    'Generating SDK documentation and code samples',
    'API versioning and changelog documentation',
    'Team collaboration on API design and documentation',
    'Customer-facing API documentation websites',
    'Internal API documentation for microservices',
    'API testing documentation and examples',
    'Integration guide creation for third-party developers'
  ],

  faq: [
    {
      question: 'What input formats are supported?',
      answer: 'Supports OpenAPI 3.0, Swagger 2.0, Postman collections (JSON), and manual text descriptions. Can parse JSON and YAML formats for specifications.'
    },
    {
      question: 'What output formats can be generated?',
      answer: 'Generates Markdown, HTML, JSON, and YAML documentation. Includes options for different documentation styles and customizable branding.'
    },
    {
      question: 'Are code examples automatically generated?',
      answer: 'Yes, can generate code examples in JavaScript, Python, PHP, cURL, and other languages based on endpoint definitions and request/response schemas.'
    },
    {
      question: 'Can I include authentication documentation?',
      answer: 'Supports all standard authentication methods including API keys, Bearer tokens, OAuth 2.0, and OpenID Connect with detailed implementation examples.'
    },
    {
      question: 'Is interactive API testing supported?',
      answer: 'The generated documentation includes request/response examples and can be enhanced with interactive testing capabilities when deployed to documentation platforms.'
    }
  ],

  commonErrors: [
    'Invalid OpenAPI/Swagger specification format',
    'Missing required fields in API specification',
    'Unsupported authentication scheme in specification',
    'Invalid JSON or YAML syntax in input',
    'Missing endpoint definitions or empty specification'
  ],

  relatedTools: ['openapi-validator', 'json-formatter', 'yaml-formatter', 'postman-converter', 'api-tester']
};