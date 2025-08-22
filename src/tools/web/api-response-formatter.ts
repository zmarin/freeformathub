import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ApiResponseConfig {
  mode: 'format' | 'validate' | 'analyze';
  responseType: 'json' | 'xml' | 'text' | 'auto';
  includeHeaders: boolean;
  includeStatus: boolean;
  includeTimings: boolean;
  validateSchema: boolean;
  outputFormat: 'detailed' | 'compact' | 'raw';
  sortKeys: boolean;
  indentSize: number;
  showMetadata: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  analysis?: ResponseAnalysis;
}

interface ResponseAnalysis {
  contentType: string;
  statusCode?: number;
  statusText?: string;
  size: number;
  headers: Record<string, string>;
  bodyType: 'json' | 'xml' | 'html' | 'text' | 'binary';
  isValidJson: boolean;
  isValidXml: boolean;
  jsonSchema?: any;
  structure: any;
  errors: ValidationError[];
  warnings: string[];
  performance?: {
    responseTime?: number;
    contentLength: number;
    compressed: boolean;
  };
}

interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
  column?: number;
}

// Parse raw HTTP response
function parseHttpResponse(rawResponse: string): {
  statusLine: string;
  headers: Record<string, string>;
  body: string;
  statusCode?: number;
  statusText?: string;
} {
  const lines = rawResponse.split('\n');
  let headerEndIndex = -1;
  
  // Find the end of headers (empty line)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      headerEndIndex = i;
      break;
    }
  }
  
  if (headerEndIndex === -1) {
    // No headers found, treat entire input as body
    return {
      statusLine: '',
      headers: {},
      body: rawResponse,
    };
  }
  
  const statusLine = lines[0] || '';
  const headers: Record<string, string> = {};
  
  // Parse headers
  for (let i = 1; i < headerEndIndex; i++) {
    const line = lines[i];
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }
  
  // Extract body
  const body = lines.slice(headerEndIndex + 1).join('\n');
  
  // Parse status line
  const statusMatch = statusLine.match(/HTTP\/[\d.]+\s+(\d+)\s+(.+)/);
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
  const statusText = statusMatch ? statusMatch[2] : undefined;
  
  return {
    statusLine,
    headers,
    body,
    statusCode,
    statusText,
  };
}

// Detect content type
function detectContentType(headers: Record<string, string>, body: string): string {
  // Check Content-Type header
  const contentType = headers['Content-Type'] || headers['content-type'] || '';
  if (contentType) {
    return contentType.split(';')[0].trim().toLowerCase();
  }
  
  // Try to detect from body content
  const trimmedBody = body.trim();
  
  if (trimmedBody.startsWith('{') || trimmedBody.startsWith('[')) {
    return 'application/json';
  }
  
  if (trimmedBody.startsWith('<')) {
    if (trimmedBody.includes('<!DOCTYPE html') || trimmedBody.includes('<html')) {
      return 'text/html';
    }
    return 'application/xml';
  }
  
  return 'text/plain';
}

// Validate JSON
function validateJson(text: string): { isValid: boolean; parsed?: any; error?: string; structure?: any } {
  try {
    const parsed = JSON.parse(text);
    const structure = analyzeJsonStructure(parsed);
    return { isValid: true, parsed, structure };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

// Analyze JSON structure
function analyzeJsonStructure(obj: any, depth: number = 0): any {
  if (depth > 5) return '[Deep Object]'; // Prevent infinite recursion
  
  if (obj === null) return 'null';
  if (typeof obj === 'string') return 'string';
  if (typeof obj === 'number') return 'number';
  if (typeof obj === 'boolean') return 'boolean';
  if (obj instanceof Date) return 'date';
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 'array (empty)';
    const firstItemStructure = analyzeJsonStructure(obj[0], depth + 1);
    return `array[${obj.length}] of ${firstItemStructure}`;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return 'object (empty)';
    
    const structure: any = {};
    for (const key of keys.slice(0, 10)) { // Limit to first 10 keys
      structure[key] = analyzeJsonStructure(obj[key], depth + 1);
    }
    
    if (keys.length > 10) {
      structure['...'] = `${keys.length - 10} more properties`;
    }
    
    return structure;
  }
  
  return typeof obj;
}

// Validate XML
function validateXml(text: string): { isValid: boolean; error?: string } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      return { isValid: false, error: errorNode.textContent || 'XML parsing error' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid XML'
    };
  }
}

// Format JSON with custom options
function formatJson(obj: any, config: ApiResponseConfig): string {
  const indent = ' '.repeat(config.indentSize);
  
  if (config.sortKeys) {
    obj = sortObjectKeys(obj);
  }
  
  return JSON.stringify(obj, null, indent);
}

// Sort object keys recursively
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sorted: any = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  
  return sorted;
}

// Analyze response performance
function analyzePerformance(headers: Record<string, string>): {
  contentLength: number;
  compressed: boolean;
} {
  const contentLength = parseInt(headers['Content-Length'] || headers['content-length'] || '0', 10);
  const compressed = !!(headers['Content-Encoding'] || headers['content-encoding']);
  
  return {
    contentLength,
    compressed,
  };
}

// Generate response analysis
function analyzeResponse(
  body: string,
  headers: Record<string, string>,
  statusCode?: number,
  statusText?: string
): ResponseAnalysis {
  const contentType = detectContentType(headers, body);
  const size = new Blob([body]).size;
  const performance = analyzePerformance(headers);
  
  let bodyType: ResponseAnalysis['bodyType'] = 'text';
  let isValidJson = false;
  let isValidXml = false;
  let jsonSchema: any;
  let structure: any;
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  // Analyze based on content type
  if (contentType.includes('json')) {
    bodyType = 'json';
    const jsonResult = validateJson(body);
    isValidJson = jsonResult.isValid;
    
    if (jsonResult.isValid) {
      structure = jsonResult.structure;
    } else {
      errors.push({
        path: 'body',
        message: jsonResult.error || 'Invalid JSON',
        severity: 'error',
      });
    }
  } else if (contentType.includes('xml')) {
    bodyType = 'xml';
    const xmlResult = validateXml(body);
    isValidXml = xmlResult.isValid;
    
    if (!xmlResult.isValid) {
      errors.push({
        path: 'body',
        message: xmlResult.error || 'Invalid XML',
        severity: 'error',
      });
    }
  } else if (contentType.includes('html')) {
    bodyType = 'html';
  }
  
  // Add warnings for common issues
  if (statusCode && statusCode >= 400) {
    warnings.push(`HTTP error status: ${statusCode} ${statusText}`);
  }
  
  if (!headers['Content-Type'] && !headers['content-type']) {
    warnings.push('Missing Content-Type header');
  }
  
  if (size > 1024 * 1024) {
    warnings.push(`Large response size: ${(size / 1024 / 1024).toFixed(1)}MB`);
  }
  
  return {
    contentType,
    statusCode,
    statusText,
    size,
    headers,
    bodyType,
    isValidJson,
    isValidXml,
    jsonSchema,
    structure,
    errors,
    warnings,
    performance,
  };
}

// Format output
function formatOutput(analysis: ResponseAnalysis, body: string, config: ApiResponseConfig): string {
  if (config.outputFormat === 'raw') {
    return body;
  }
  
  if (config.outputFormat === 'compact') {
    return formatCompactOutput(analysis, body, config);
  }
  
  return formatDetailedOutput(analysis, body, config);
}

function formatCompactOutput(analysis: ResponseAnalysis, body: string, config: ApiResponseConfig): string {
  let output = '';
  
  if (config.includeStatus && analysis.statusCode) {
    output += `Status: ${analysis.statusCode} ${analysis.statusText}\n`;
  }
  
  if (config.includeHeaders && Object.keys(analysis.headers).length > 0) {
    output += `Headers: ${Object.keys(analysis.headers).length} headers\n`;
  }
  
  output += `Content-Type: ${analysis.contentType}\n`;
  output += `Size: ${analysis.size} bytes\n\n`;
  
  // Format body based on type
  if (analysis.bodyType === 'json' && analysis.isValidJson) {
    try {
      const parsed = JSON.parse(body);
      output += formatJson(parsed, config);
    } catch {
      output += body;
    }
  } else {
    output += body;
  }
  
  return output;
}

function formatDetailedOutput(analysis: ResponseAnalysis, body: string, config: ApiResponseConfig): string {
  let output = '# API Response Analysis\n\n';
  
  // Status information
  if (config.includeStatus && analysis.statusCode) {
    output += '## Status\n\n';
    output += `- **Code**: ${analysis.statusCode}\n`;
    output += `- **Text**: ${analysis.statusText}\n`;
    output += `- **Category**: ${getStatusCategory(analysis.statusCode)}\n\n`;
  }
  
  // Headers
  if (config.includeHeaders && Object.keys(analysis.headers).length > 0) {
    output += '## Headers\n\n';
    for (const [key, value] of Object.entries(analysis.headers)) {
      output += `- **${key}**: ${value}\n`;
    }
    output += '\n';
  }
  
  // Response metadata
  if (config.showMetadata) {
    output += '## Response Metadata\n\n';
    output += `- **Content Type**: ${analysis.contentType}\n`;
    output += `- **Body Type**: ${analysis.bodyType}\n`;
    output += `- **Size**: ${analysis.size.toLocaleString()} bytes (${(analysis.size / 1024).toFixed(1)} KB)\n`;
    
    if (analysis.performance) {
      output += `- **Content Length**: ${analysis.performance.contentLength.toLocaleString()} bytes\n`;
      output += `- **Compressed**: ${analysis.performance.compressed ? 'Yes' : 'No'}\n`;
    }
    
    output += '\n';
  }
  
  // Validation results
  if (config.validateSchema && (analysis.errors.length > 0 || analysis.warnings.length > 0)) {
    output += '## Validation Results\n\n';
    
    if (analysis.errors.length > 0) {
      output += '### Errors\n\n';
      for (const error of analysis.errors) {
        output += `- **${error.path}**: ${error.message}\n`;
      }
      output += '\n';
    }
    
    if (analysis.warnings.length > 0) {
      output += '### Warnings\n\n';
      for (const warning of analysis.warnings) {
        output += `- ⚠️ ${warning}\n`;
      }
      output += '\n';
    }
  }
  
  // Structure analysis for JSON
  if (analysis.bodyType === 'json' && analysis.structure && config.showMetadata) {
    output += '## JSON Structure\n\n';
    output += '```json\n';
    output += JSON.stringify(analysis.structure, null, 2);
    output += '\n```\n\n';
  }
  
  // Formatted body
  output += '## Response Body\n\n';
  
  if (analysis.bodyType === 'json' && analysis.isValidJson) {
    output += '```json\n';
    try {
      const parsed = JSON.parse(body);
      output += formatJson(parsed, config);
    } catch {
      output += body;
    }
    output += '\n```\n';
  } else if (analysis.bodyType === 'xml') {
    output += '```xml\n';
    output += body;
    output += '\n```\n';
  } else if (analysis.bodyType === 'html') {
    output += '```html\n';
    output += body;
    output += '\n```\n';
  } else {
    output += '```\n';
    output += body;
    output += '\n```\n';
  }
  
  output += '\n---\n*Analyzed by FreeFormatHub API Response Formatter*';
  
  return output;
}

function getStatusCategory(statusCode: number): string {
  if (statusCode >= 100 && statusCode < 200) return 'Informational';
  if (statusCode >= 200 && statusCode < 300) return 'Success';
  if (statusCode >= 300 && statusCode < 400) return 'Redirection';
  if (statusCode >= 400 && statusCode < 500) return 'Client Error';
  if (statusCode >= 500 && statusCode < 600) return 'Server Error';
  return 'Unknown';
}

export function processApiResponse(input: string, config: ApiResponseConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide an API response to format'
      };
    }
    
    let body: string;
    let headers: Record<string, string> = {};
    let statusCode: number | undefined;
    let statusText: string | undefined;
    
    // Check if input looks like a full HTTP response
    if (input.includes('HTTP/') && input.includes('\n')) {
      const parsed = parseHttpResponse(input);
      body = parsed.body;
      headers = parsed.headers;
      statusCode = parsed.statusCode;
      statusText = parsed.statusText;
    } else {
      // Treat as body only
      body = input;
      
      // Try to detect content type from body
      if (config.responseType === 'auto') {
        headers['Content-Type'] = detectContentType({}, body);
      } else {
        switch (config.responseType) {
          case 'json':
            headers['Content-Type'] = 'application/json';
            break;
          case 'xml':
            headers['Content-Type'] = 'application/xml';
            break;
          case 'text':
            headers['Content-Type'] = 'text/plain';
            break;
        }
      }
    }
    
    if (config.mode === 'validate') {
      const analysis = analyzeResponse(body, headers, statusCode, statusText);
      
      if (analysis.errors.length === 0) {
        return {
          success: true,
          output: `✅ Response validation passed!\n\nContent Type: ${analysis.contentType}\nBody Type: ${analysis.bodyType}\nSize: ${analysis.size} bytes`
        };
      } else {
        let output = '❌ Response validation failed:\n\n';
        for (const error of analysis.errors) {
          output += `- ${error.message}\n`;
        }
        return {
          success: true,
          output
        };
      }
    }
    
    // Analyze the response
    const analysis = analyzeResponse(body, headers, statusCode, statusText);
    
    // Format the output
    const output = formatOutput(analysis, body, config);
    
    return {
      success: true,
      output,
      analysis
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process API response'
    };
  }
}

export const API_RESPONSE_FORMATTER_TOOL: Tool = {
  id: 'api-response-formatter',
  name: 'API Response Formatter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'api-tools')!,
  slug: 'api-response-formatter',
  icon: '🔄',
  keywords: ['api', 'response', 'formatter', 'json', 'xml', 'http', 'validator', 'rest'],
  seoTitle: 'API Response Formatter - Format, Validate & Analyze HTTP Responses | FreeFormatHub',
  seoDescription: 'Format and analyze API responses including JSON, XML, and HTTP headers. Validate response structure, analyze performance, and beautify API data.',
  description: 'Format, validate, and analyze API responses including JSON, XML, and raw HTTP responses with headers, status codes, and performance metrics.',
  
  examples: [
    {
      title: 'JSON API Response',
      input: `{
  "status": "success",
  "data": {
    "users": [
      {"id": 1, "name": "John Doe", "email": "john@example.com"},
      {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
    ],
    "total": 2,
    "page": 1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`,
      output: `# API Response Analysis

## Response Metadata

- **Content Type**: application/json
- **Body Type**: json
- **Size**: 245 bytes (0.2 KB)

## JSON Structure

\`\`\`json
{
  "status": "string",
  "data": {
    "users": "array[2] of object",
    "total": "number",
    "page": "number"
  },
  "timestamp": "string"
}
\`\`\`

## Response Body

\`\`\`json
{
  "data": {
    "page": 1,
    "total": 2,
    "users": [
      {
        "email": "john@example.com",
        "id": 1,
        "name": "John Doe"
      },
      {
        "email": "jane@example.com",
        "id": 2,
        "name": "Jane Smith"
      }
    ]
  },
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\``,
      description: 'Format and analyze a JSON API response with structure analysis'
    },
    {
      title: 'Full HTTP Response',
      input: `HTTP/1.1 200 OK
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
      output: `# API Response Analysis

## Status

- **Code**: 200
- **Text**: OK
- **Category**: Success

## Headers

- **Content-Type**: application/json; charset=utf-8
- **Content-Length**: 156
- **Cache-Control**: max-age=300
- **X-RateLimit-Remaining**: 4999

## Response Metadata

- **Content Type**: application/json
- **Body Type**: json
- **Size**: 89 bytes (0.1 KB)
- **Content Length**: 156 bytes
- **Compressed**: No

## Response Body

\`\`\`json
{
  "data": null,
  "message": "Hello, World!",
  "success": true,
  "timestamp": 1642248600
}
\`\`\``,
      description: 'Parse complete HTTP response with headers and status'
    },
    {
      title: 'XML API Response',
      input: `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <status>success</status>
  <data>
    <user id="1">
      <name>John Doe</name>
      <email>john@example.com</email>
    </user>
  </data>
</response>`,
      output: `# API Response Analysis

## Response Metadata

- **Content Type**: application/xml
- **Body Type**: xml
- **Size**: 198 bytes (0.2 KB)

## Response Body

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <status>success</status>
  <data>
    <user id="1">
      <name>John Doe</name>
      <email>john@example.com</email>
    </user>
  </data>
</response>
\`\`\``,
      description: 'Format and analyze XML API response'
    }
  ],
  
  useCases: [
    'API development and debugging',
    'Response validation and testing',
    'API documentation and examples',
    'Performance analysis of API responses',
    'Data structure analysis and schema generation',
    'HTTP response troubleshooting'
  ],
  
  faq: [
    {
      question: 'What response formats are supported?',
      answer: 'The tool supports JSON, XML, HTML, and plain text responses. It can auto-detect the format or you can specify it manually.'
    },
    {
      question: 'Can I analyze full HTTP responses with headers?',
      answer: 'Yes! Paste the complete HTTP response including status line and headers. The tool will parse and analyze all components separately.'
    },
    {
      question: 'How does JSON structure analysis work?',
      answer: 'The tool analyzes JSON objects to show data types, array lengths, nested structures, and provides a schema-like overview of the response structure.'
    },
    {
      question: 'What validation features are available?',
      answer: 'Validation includes JSON/XML syntax checking, HTTP status code analysis, header validation, and performance warnings for large responses.'
    },
    {
      question: 'Can I format responses for documentation?',
      answer: 'Yes! The detailed format includes markdown-formatted output perfect for API documentation, with syntax highlighting and structured analysis.'
    }
  ],
  
  commonErrors: [
    'Invalid JSON syntax - check for missing quotes, commas, or brackets',
    'Malformed HTTP response - ensure proper status line and header format',
    'Invalid XML - check for unclosed tags or invalid characters',
    'Missing Content-Type header - specify response type manually',
    'Large response size may cause performance issues'
  ],

  relatedTools: ['json-formatter', 'xml-formatter', 'http-status-codes', 'url-parser']
};