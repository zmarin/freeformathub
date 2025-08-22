import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ApiRequestBuilderConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  outputFormat: 'curl' | 'fetch' | 'axios' | 'xhr' | 'postman' | 'insomnia';
  includeHeaders: boolean;
  includeAuth: boolean;
  formatJson: boolean;
  includeComments: boolean;
  generateTests: boolean;
  useAsync: boolean;
  timeout: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  request?: RequestInfo;
  codeSnippets?: CodeSnippet[];
}

interface RequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  auth?: AuthInfo;
  queryParams: Record<string, string>;
}

interface AuthInfo {
  type: 'bearer' | 'basic' | 'apikey' | 'oauth' | 'none';
  value?: string;
  username?: string;
  password?: string;
  key?: string;
}

interface CodeSnippet {
  language: string;
  code: string;
  description: string;
}

function parseUrl(urlString: string): { baseUrl: string; queryParams: Record<string, string> } {
  try {
    const url = new URL(urlString);
    const queryParams: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    return {
      baseUrl: `${url.protocol}//${url.host}${url.pathname}`,
      queryParams
    };
  } catch {
    return { baseUrl: urlString, queryParams: {} };
  }
}

function parseHeaders(headersInput: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (!headersInput.trim()) return headers;
  
  const lines = headersInput.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      if (key.trim() && value) {
        headers[key.trim()] = value;
      }
    }
  }
  
  return headers;
}

function parseAuthInfo(authInput: string): AuthInfo {
  const trimmed = authInput.trim().toLowerCase();
  
  if (trimmed.startsWith('bearer ')) {
    return {
      type: 'bearer',
      value: authInput.substring(7).trim()
    };
  } else if (trimmed.startsWith('basic ')) {
    return {
      type: 'basic',
      value: authInput.substring(6).trim()
    };
  } else if (trimmed.includes('username:') && trimmed.includes('password:')) {
    const lines = authInput.split('\n');
    let username = '';
    let password = '';
    
    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      if (lower.startsWith('username:')) {
        username = line.substring(9).trim();
      } else if (lower.startsWith('password:')) {
        password = line.substring(9).trim();
      }
    }
    
    return {
      type: 'basic',
      username,
      password
    };
  } else if (trimmed.includes('api') || trimmed.includes('key')) {
    return {
      type: 'apikey',
      key: authInput.trim()
    };
  }
  
  return { type: 'none' };
}

function generateCurlCommand(request: RequestInfo, config: ApiRequestBuilderConfig): string {
  let curl = `curl -X ${request.method}`;
  
  // Add headers
  Object.entries(request.headers).forEach(([key, value]) => {
    curl += ` \\\n  -H "${key}: ${value}"`;
  });
  
  // Add authentication
  if (request.auth && request.auth.type !== 'none') {
    if (request.auth.type === 'bearer' && request.auth.value) {
      curl += ` \\\n  -H "Authorization: Bearer ${request.auth.value}"`;
    } else if (request.auth.type === 'basic') {
      if (request.auth.username && request.auth.password) {
        curl += ` \\\n  -u "${request.auth.username}:${request.auth.password}"`;
      } else if (request.auth.value) {
        curl += ` \\\n  -H "Authorization: Basic ${request.auth.value}"`;
      }
    } else if (request.auth.type === 'apikey' && request.auth.key) {
      curl += ` \\\n  -H "X-API-Key: ${request.auth.key}"`;
    }
  }
  
  // Add body for POST/PUT/PATCH
  if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (config.formatJson) {
      try {
        const formatted = JSON.stringify(JSON.parse(request.body), null, 2);
        curl += ` \\\n  -d '${formatted}'`;
      } catch {
        curl += ` \\\n  -d '${request.body}'`;
      }
    } else {
      curl += ` \\\n  -d '${request.body}'`;
    }
  }
  
  // Add timeout
  if (config.timeout > 0) {
    curl += ` \\\n  --max-time ${config.timeout}`;
  }
  
  // Add URL
  curl += ` \\\n  "${request.url}"`;
  
  return curl;
}

function generateFetchCode(request: RequestInfo, config: ApiRequestBuilderConfig): string {
  const asyncKeyword = config.useAsync ? 'async ' : '';
  const awaitKeyword = config.useAsync ? 'await ' : '';
  
  let code = `${asyncKeyword}function makeRequest() {\n`;
  
  if (config.includeComments) {
    code += `  // ${request.method} request to ${request.url}\n`;
  }
  
  code += `  const ${awaitKeyword}response = ${awaitKeyword}fetch('${request.url}', {\n`;
  code += `    method: '${request.method}',\n`;
  
  // Headers
  if (Object.keys(request.headers).length > 0 || request.auth?.type !== 'none') {
    code += `    headers: {\n`;
    
    // Regular headers
    Object.entries(request.headers).forEach(([key, value]) => {
      code += `      '${key}': '${value}',\n`;
    });
    
    // Auth headers
    if (request.auth && request.auth.type !== 'none') {
      if (request.auth.type === 'bearer' && request.auth.value) {
        code += `      'Authorization': 'Bearer ${request.auth.value}',\n`;
      } else if (request.auth.type === 'basic' && request.auth.value) {
        code += `      'Authorization': 'Basic ${request.auth.value}',\n`;
      } else if (request.auth.type === 'apikey' && request.auth.key) {
        code += `      'X-API-Key': '${request.auth.key}',\n`;
      }
    }
    
    code += `    },\n`;
  }
  
  // Body
  if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (config.formatJson) {
      try {
        const formatted = JSON.stringify(JSON.parse(request.body), null, 6);
        code += `    body: JSON.stringify(${formatted}),\n`;
      } catch {
        code += `    body: '${request.body}',\n`;
      }
    } else {
      code += `    body: '${request.body}',\n`;
    }
  }
  
  code += `  });\n\n`;
  
  if (config.useAsync) {
    code += `  const data = await response.json();\n`;
    code += `  return data;\n`;
  } else {
    code += `  return response.then(res => res.json());\n`;
  }
  
  code += `}`;
  
  if (config.generateTests) {
    code += `\n\n// Usage example:\n`;
    code += `makeRequest()\n`;
    code += `  .then(data => console.log(data))\n`;
    code += `  .catch(error => console.error('Error:', error));`;
  }
  
  return code;
}

function generateAxiosCode(request: RequestInfo, config: ApiRequestBuilderConfig): string {
  const asyncKeyword = config.useAsync ? 'async ' : '';
  const awaitKeyword = config.useAsync ? 'await ' : '';
  
  let code = `${asyncKeyword}function makeRequest() {\n`;
  
  if (config.includeComments) {
    code += `  // ${request.method} request using axios\n`;
  }
  
  code += `  const ${awaitKeyword}response = ${awaitKeyword}axios({\n`;
  code += `    method: '${request.method.toLowerCase()}',\n`;
  code += `    url: '${request.url}',\n`;
  
  // Headers
  if (Object.keys(request.headers).length > 0 || request.auth?.type !== 'none') {
    code += `    headers: {\n`;
    
    Object.entries(request.headers).forEach(([key, value]) => {
      code += `      '${key}': '${value}',\n`;
    });
    
    if (request.auth && request.auth.type !== 'none') {
      if (request.auth.type === 'bearer' && request.auth.value) {
        code += `      'Authorization': 'Bearer ${request.auth.value}',\n`;
      } else if (request.auth.type === 'basic' && request.auth.value) {
        code += `      'Authorization': 'Basic ${request.auth.value}',\n`;
      } else if (request.auth.type === 'apikey' && request.auth.key) {
        code += `      'X-API-Key': '${request.auth.key}',\n`;
      }
    }
    
    code += `    },\n`;
  }
  
  // Body
  if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (config.formatJson) {
      try {
        const parsed = JSON.parse(request.body);
        code += `    data: ${JSON.stringify(parsed, null, 4)},\n`;
      } catch {
        code += `    data: '${request.body}',\n`;
      }
    } else {
      code += `    data: '${request.body}',\n`;
    }
  }
  
  // Timeout
  if (config.timeout > 0) {
    code += `    timeout: ${config.timeout * 1000},\n`;
  }
  
  code += `  });\n\n`;
  code += `  return response.data;\n`;
  code += `}`;
  
  if (config.generateTests) {
    code += `\n\n// Usage:\n`;
    if (config.useAsync) {
      code += `try {\n`;
      code += `  const data = await makeRequest();\n`;
      code += `  console.log(data);\n`;
      code += `} catch (error) {\n`;
      code += `  console.error('Error:', error.response?.data || error.message);\n`;
      code += `}`;
    } else {
      code += `makeRequest()\n`;
      code += `  .then(data => console.log(data))\n`;
      code += `  .catch(error => console.error('Error:', error.response?.data || error.message));`;
    }
  }
  
  return code;
}

function generatePostmanCollection(request: RequestInfo): string {
  const collection = {
    info: {
      name: 'Generated API Collection',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: [
      {
        name: `${request.method} Request`,
        request: {
          method: request.method,
          header: Object.entries(request.headers).map(([key, value]) => ({
            key,
            value,
            type: 'text'
          })),
          url: {
            raw: request.url,
            protocol: request.url.startsWith('https') ? 'https' : 'http',
            host: new URL(request.url).hostname.split('.'),
            path: new URL(request.url).pathname.split('/').filter(p => p),
            query: Object.entries(request.queryParams).map(([key, value]) => ({
              key,
              value
            }))
          },
          ...(request.body && ['POST', 'PUT', 'PATCH'].includes(request.method) && {
            body: {
              mode: 'raw',
              raw: request.body,
              options: {
                raw: {
                  language: 'json'
                }
              }
            }
          })
        }
      }
    ]
  };
  
  return JSON.stringify(collection, null, 2);
}

export function processApiRequestBuilder(input: string, config: ApiRequestBuilderConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide API request details to generate code'
      };
    }

    const lines = input.trim().split('\n').filter(line => line.trim());
    let url = '';
    let headers: Record<string, string> = {};
    let body = '';
    let auth: AuthInfo = { type: 'none' };
    
    let currentSection = '';
    let bodyLines: string[] = [];
    let headerLines: string[] = [];
    let authLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith('url:') || trimmed.startsWith('endpoint:')) {
        url = line.substring(line.indexOf(':') + 1).trim();
      } else if (trimmed === 'headers:') {
        currentSection = 'headers';
      } else if (trimmed === 'body:' || trimmed === 'data:') {
        currentSection = 'body';
      } else if (trimmed === 'auth:' || trimmed === 'authorization:') {
        currentSection = 'auth';
      } else if (currentSection === 'headers') {
        headerLines.push(line);
      } else if (currentSection === 'body') {
        bodyLines.push(line);
      } else if (currentSection === 'auth') {
        authLines.push(line);
      } else if (!url && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
        url = line.trim();
      }
    }
    
    if (!url) {
      return {
        success: false,
        error: 'URL is required. Please specify the API endpoint.'
      };
    }
    
    // Parse components
    const { baseUrl, queryParams } = parseUrl(url);
    headers = parseHeaders(headerLines.join('\n'));
    body = bodyLines.join('\n').trim();
    auth = parseAuthInfo(authLines.join('\n'));
    
    // Build request info
    const request: RequestInfo = {
      method: config.method,
      url: baseUrl,
      headers,
      body: body || undefined,
      auth,
      queryParams
    };
    
    // Add query params to URL if any
    if (Object.keys(queryParams).length > 0) {
      const urlObj = new URL(baseUrl);
      Object.entries(queryParams).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
      });
      request.url = urlObj.toString();
    }
    
    // Generate code based on format
    let output = '';
    const codeSnippets: CodeSnippet[] = [];
    
    switch (config.outputFormat) {
      case 'curl':
        output = generateCurlCommand(request, config);
        codeSnippets.push({
          language: 'bash',
          code: output,
          description: 'cURL command line request'
        });
        break;
        
      case 'fetch':
        output = generateFetchCode(request, config);
        codeSnippets.push({
          language: 'javascript',
          code: output,
          description: 'Native JavaScript Fetch API'
        });
        break;
        
      case 'axios':
        output = generateAxiosCode(request, config);
        codeSnippets.push({
          language: 'javascript',
          code: output,
          description: 'Axios HTTP client library'
        });
        break;
        
      case 'postman':
        output = generatePostmanCollection(request);
        codeSnippets.push({
          language: 'json',
          code: output,
          description: 'Postman Collection JSON'
        });
        break;
        
      default:
        output = generateCurlCommand(request, config);
    }
    
    // Add header comment if enabled
    if (config.includeComments && config.outputFormat !== 'postman') {
      const header = `# Generated API Request\n# Method: ${request.method}\n# URL: ${request.url}\n# Generated by FreeFormatHub\n\n`;
      output = header + output;
    }

    return {
      success: true,
      output,
      request,
      codeSnippets
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build API request'
    };
  }
}

export const API_REQUEST_BUILDER_TOOL: Tool = {
  id: 'api-request-builder',
  name: 'API Request Builder',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'api-tools')!,
  slug: 'api-request-builder',
  icon: '<',
  keywords: ['api', 'request', 'builder', 'curl', 'fetch', 'axios', 'http', 'rest', 'postman'],
  seoTitle: 'API Request Builder - Generate HTTP Requests | FreeFormatHub',
  seoDescription: 'Build API requests in multiple formats. Generate cURL, Fetch, Axios code with headers, authentication, and request bodies. Export to Postman collections.',
  description: 'Build and generate API requests in multiple formats. Support for cURL, JavaScript Fetch, Axios, and Postman collections with authentication and custom headers.',

  examples: [
    {
      title: 'GET Request with Headers',
      input: `url: https://api.example.com/users
headers:
Content-Type: application/json
Accept: application/json
User-Agent: MyApp/1.0`,
      output: `# Generated API Request
# Method: GET
# URL: https://api.example.com/users
# Generated by FreeFormatHub

curl -X GET \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -H "User-Agent: MyApp/1.0" \\
  "https://api.example.com/users"`,
      description: 'Generate a GET request with custom headers'
    },
    {
      title: 'POST with JSON Body',
      input: `url: https://api.example.com/users
headers:
Content-Type: application/json
auth:
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}`,
      output: `async function makeRequest() {
  // POST request to https://api.example.com/users
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    },
    body: JSON.stringify({
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }),
  });

  const data = await response.json();
  return data;
}`,
      description: 'Generate a POST request with authentication and JSON body'
    }
  ],

  useCases: [
    'Testing REST APIs and web services during development',
    'Converting API documentation to executable requests',
    'Creating request templates for different environments',
    'Generating code snippets for API integration',
    'Building Postman collections from API specifications',
    'Learning HTTP request formats and best practices',
    'Debugging API requests with proper headers and authentication',
    'Creating curl commands for server-side scripting'
  ],

  faq: [
    {
      question: 'What authentication methods are supported?',
      answer: 'Supports Bearer tokens, Basic authentication, API keys, and custom header authentication. You can specify auth details in the auth section of your input.'
    },
    {
      question: 'Can I generate code for different programming languages?',
      answer: 'Currently supports JavaScript (Fetch, Axios), cURL commands, and Postman collections. More language support may be added in future updates.'
    },
    {
      question: 'How do I handle query parameters?',
      answer: 'Include query parameters directly in the URL (e.g., https://api.example.com/users?page=1&limit=10) and they will be properly formatted in the generated code.'
    },
    {
      question: 'Can it handle file uploads and form data?',
      answer: 'Currently optimized for JSON requests. For file uploads and multipart forms, use the generated code as a starting point and modify the body and Content-Type header manually.'
    },
    {
      question: 'How do I test the generated requests?',
      answer: 'Copy the generated cURL command to test in terminal, or use the JavaScript code in browser console or Node.js. Postman collections can be imported directly.'
    }
  ],

  commonErrors: [
    'Missing or invalid URL format (must start with http:// or https://)',
    'Incorrect header format (should be Key: Value per line)',
    'Invalid JSON in request body',
    'Missing authentication details for protected endpoints',
    'Incorrect HTTP method for the intended operation'
  ],

  relatedTools: ['curl-converter', 'json-formatter', 'http-status-codes', 'url-encoder', 'jwt-decoder']
};