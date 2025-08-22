import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface HttpStatusConfig {
  mode: 'lookup' | 'category' | 'search';
  includeDescription: boolean;
  includeRfc: boolean;
  includeExamples: boolean;
  showObsolete: boolean;
  categoryFilter: 'all' | '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
  outputFormat: 'detailed' | 'compact' | 'table' | 'json';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  statusCodes?: StatusCodeInfo[];
}

interface StatusCodeInfo {
  code: number;
  message: string;
  description: string;
  category: string;
  rfc: string[];
  examples: string[];
  isObsolete: boolean;
  isCommon: boolean;
  whenToUse: string;
  relatedCodes: number[];
}

// Comprehensive HTTP status codes database
const HTTP_STATUS_CODES: StatusCodeInfo[] = [
  // 1xx Informational
  {
    code: 100,
    message: 'Continue',
    description: 'The server has received the request headers and the client should proceed to send the request body.',
    category: '1xx Informational',
    rfc: ['RFC 7231'],
    examples: ['Used with Expect: 100-continue header'],
    isObsolete: false,
    isCommon: false,
    whenToUse: 'When client sends Expect: 100-continue header before sending large request body',
    relatedCodes: [417]
  },
  {
    code: 101,
    message: 'Switching Protocols',
    description: 'The requester has asked the server to switch protocols and the server has agreed to do so.',
    category: '1xx Informational',
    rfc: ['RFC 7231'],
    examples: ['HTTP/1.1 to WebSocket protocol upgrade'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When upgrading from HTTP to WebSocket or other protocol',
    relatedCodes: [426]
  },
  {
    code: 102,
    message: 'Processing',
    description: 'The server has received and is processing the request, but no response is available yet.',
    category: '1xx Informational',
    rfc: ['RFC 2518'],
    examples: ['WebDAV operations that take time to complete'],
    isObsolete: false,
    isCommon: false,
    whenToUse: 'For long-running WebDAV operations to prevent client timeout',
    relatedCodes: [202]
  },

  // 2xx Success
  {
    code: 200,
    message: 'OK',
    description: 'The request has succeeded. The meaning of success varies by HTTP method.',
    category: '2xx Success',
    rfc: ['RFC 7231'],
    examples: ['GET: Entity corresponding to the requested resource is sent', 'HEAD: Only headers are sent', 'POST: Entity describing or containing the result of the action'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When the request was successful and response body contains requested data',
    relatedCodes: []
  },
  {
    code: 201,
    message: 'Created',
    description: 'The request has been fulfilled and resulted in a new resource being created.',
    category: '2xx Success',
    rfc: ['RFC 7231'],
    examples: ['POST /api/users creates new user', 'PUT /api/articles/123 creates new article'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When a new resource has been created as a result of the request',
    relatedCodes: [200, 202]
  },
  {
    code: 202,
    message: 'Accepted',
    description: 'The request has been accepted for processing, but the processing has not been completed.',
    category: '2xx Success',
    rfc: ['RFC 7231'],
    examples: ['Async job queued for processing', 'Email scheduled to be sent'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When request is valid but processing will complete asynchronously',
    relatedCodes: [200, 102]
  },
  {
    code: 204,
    message: 'No Content',
    description: 'The server successfully processed the request and is not returning any content.',
    category: '2xx Success',
    rfc: ['RFC 7231'],
    examples: ['DELETE operation successful', 'PUT update with no response body needed'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When request was successful but no response body is needed',
    relatedCodes: [200]
  },

  // 3xx Redirection
  {
    code: 301,
    message: 'Moved Permanently',
    description: 'The resource has been permanently moved to a new URL.',
    category: '3xx Redirection',
    rfc: ['RFC 7231'],
    examples: ['Domain migration', 'URL structure changes'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When a resource has permanently moved to a new location',
    relatedCodes: [302, 308]
  },
  {
    code: 302,
    message: 'Found',
    description: 'The resource has been temporarily moved to a different URL.',
    category: '3xx Redirection',
    rfc: ['RFC 7231'],
    examples: ['Temporary maintenance redirect', 'A/B testing redirects'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When a resource is temporarily available at a different location',
    relatedCodes: [301, 307]
  },
  {
    code: 304,
    message: 'Not Modified',
    description: 'The resource has not been modified since the version specified by request headers.',
    category: '3xx Redirection',
    rfc: ['RFC 7232'],
    examples: ['Browser cache validation', 'ETags matching', 'If-Modified-Since validation'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When client has cached version and resource hasn\'t changed',
    relatedCodes: [200]
  },

  // 4xx Client Error
  {
    code: 400,
    message: 'Bad Request',
    description: 'The server cannot process the request due to client error (malformed syntax, invalid request message framing, or deceptive request routing).',
    category: '4xx Client Error',
    rfc: ['RFC 7231'],
    examples: ['Invalid JSON syntax', 'Missing required parameters', 'Malformed request headers'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When request is malformed, has invalid syntax, or missing required data',
    relatedCodes: [422]
  },
  {
    code: 401,
    message: 'Unauthorized',
    description: 'The request requires user authentication or authentication has failed.',
    category: '4xx Client Error',
    rfc: ['RFC 7235'],
    examples: ['Missing API key', 'Invalid credentials', 'Expired token'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When authentication is required but missing or invalid',
    relatedCodes: [403, 407]
  },
  {
    code: 403,
    message: 'Forbidden',
    description: 'The server understood the request but refuses to authorize it.',
    category: '4xx Client Error',
    rfc: ['RFC 7231'],
    examples: ['Insufficient permissions', 'Access denied to resource', 'IP address blocked'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When client is authenticated but lacks permission for the requested resource',
    relatedCodes: [401, 405]
  },
  {
    code: 404,
    message: 'Not Found',
    description: 'The server can\'t find the requested resource.',
    category: '4xx Client Error',
    rfc: ['RFC 7231'],
    examples: ['URL does not exist', 'Resource deleted', 'Mistyped endpoint'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When the requested resource does not exist on the server',
    relatedCodes: [410]
  },
  {
    code: 405,
    message: 'Method Not Allowed',
    description: 'The request method is known by the server but not supported by the target resource.',
    category: '4xx Client Error',
    rfc: ['RFC 7231'],
    examples: ['POST to read-only endpoint', 'DELETE on non-deletable resource'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When HTTP method is not allowed for the specific resource',
    relatedCodes: [501]
  },
  {
    code: 409,
    message: 'Conflict',
    description: 'The request conflicts with the current state of the target resource.',
    category: '4xx Client Error',
    rfc: ['RFC 7231'],
    examples: ['Resource already exists', 'Version conflicts', 'Concurrent modification'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When request conflicts with current state of resource',
    relatedCodes: [412, 422]
  },
  {
    code: 418,
    message: 'I\'m a teapot',
    description: 'This code was defined in 1998 as one of the traditional IETF April Fools\' jokes.',
    category: '4xx Client Error',
    rfc: ['RFC 2324'],
    examples: ['April Fools\' joke', 'Easter egg responses'],
    isObsolete: false,
    isCommon: false,
    whenToUse: 'Never in production (April Fools\' joke)',
    relatedCodes: []
  },
  {
    code: 422,
    message: 'Unprocessable Entity',
    description: 'The request was well-formed but contains semantic errors.',
    category: '4xx Client Error',
    rfc: ['RFC 4918'],
    examples: ['Validation failures', 'Business logic errors', 'Invalid field values'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When request syntax is correct but semantic validation fails',
    relatedCodes: [400]
  },
  {
    code: 429,
    message: 'Too Many Requests',
    description: 'The user has sent too many requests in a given amount of time.',
    category: '4xx Client Error',
    rfc: ['RFC 6585'],
    examples: ['API rate limiting', 'DDoS protection', 'Spam prevention'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When client exceeds rate limiting thresholds',
    relatedCodes: [503]
  },

  // 5xx Server Error
  {
    code: 500,
    message: 'Internal Server Error',
    description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.',
    category: '5xx Server Error',
    rfc: ['RFC 7231'],
    examples: ['Unhandled exceptions', 'Database connection errors', 'Configuration errors'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When server encounters an unexpected error',
    relatedCodes: [502, 503]
  },
  {
    code: 501,
    message: 'Not Implemented',
    description: 'The server does not support the functionality required to fulfill the request.',
    category: '5xx Server Error',
    rfc: ['RFC 7231'],
    examples: ['Unsupported HTTP method', 'Feature not implemented'],
    isObsolete: false,
    isCommon: false,
    whenToUse: 'When server doesn\'t support the requested functionality',
    relatedCodes: [405]
  },
  {
    code: 502,
    message: 'Bad Gateway',
    description: 'The server, while acting as a gateway or proxy, received an invalid response from an upstream server.',
    category: '5xx Server Error',
    rfc: ['RFC 7231'],
    examples: ['Load balancer cannot reach backend', 'Proxy server errors'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When gateway/proxy receives invalid response from upstream',
    relatedCodes: [503, 504]
  },
  {
    code: 503,
    message: 'Service Unavailable',
    description: 'The server is currently unable to handle the request due to temporary overload or scheduled maintenance.',
    category: '5xx Server Error',
    rfc: ['RFC 7231'],
    examples: ['Server maintenance', 'Temporary overload', 'Database unavailable'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When server is temporarily unavailable',
    relatedCodes: [502, 429]
  },
  {
    code: 504,
    message: 'Gateway Timeout',
    description: 'The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server.',
    category: '5xx Server Error',
    rfc: ['RFC 7231'],
    examples: ['Upstream server timeout', 'Long-running requests'],
    isObsolete: false,
    isCommon: true,
    whenToUse: 'When gateway/proxy times out waiting for upstream response',
    relatedCodes: [502, 408]
  }
];

function findStatusCode(code: number): StatusCodeInfo | null {
  return HTTP_STATUS_CODES.find(status => status.code === code) || null;
}

function searchStatusCodes(query: string): StatusCodeInfo[] {
  const lowerQuery = query.toLowerCase();
  return HTTP_STATUS_CODES.filter(status =>
    status.code.toString().includes(query) ||
    status.message.toLowerCase().includes(lowerQuery) ||
    status.description.toLowerCase().includes(lowerQuery) ||
    status.category.toLowerCase().includes(lowerQuery)
  );
}

function getStatusCodesByCategory(category: string): StatusCodeInfo[] {
  if (category === 'all') return HTTP_STATUS_CODES;
  
  return HTTP_STATUS_CODES.filter(status => {
    const statusCategory = Math.floor(status.code / 100);
    return category === `${statusCategory}xx`;
  });
}

function formatOutput(statusCodes: StatusCodeInfo[], config: HttpStatusConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(statusCodes, null, 2);
  }
  
  if (config.outputFormat === 'table') {
    return formatTableOutput(statusCodes, config);
  }
  
  if (config.outputFormat === 'compact') {
    return formatCompactOutput(statusCodes, config);
  }
  
  return formatDetailedOutput(statusCodes, config);
}

function formatDetailedOutput(statusCodes: StatusCodeInfo[], config: HttpStatusConfig): string {
  if (statusCodes.length === 0) {
    return 'No status codes found matching your criteria.';
  }
  
  let output = `# HTTP Status Code${statusCodes.length > 1 ? 's' : ''} Reference\n\n`;
  
  statusCodes.forEach((status, index) => {
    if (index > 0) output += '\n---\n\n';
    
    output += `## ${status.code} ${status.message}\n\n`;
    output += `**Category**: ${status.category}\n\n`;
    
    if (config.includeDescription) {
      output += `**Description**: ${status.description}\n\n`;
      output += `**When to Use**: ${status.whenToUse}\n\n`;
    }
    
    if (config.includeExamples && status.examples.length > 0) {
      output += `**Common Examples**:\n`;
      status.examples.forEach(example => {
        output += `- ${example}\n`;
      });
      output += '\n';
    }
    
    if (config.includeRfc && status.rfc.length > 0) {
      output += `**RFC References**: ${status.rfc.join(', ')}\n\n`;
    }
    
    if (status.relatedCodes.length > 0) {
      output += `**Related Status Codes**: ${status.relatedCodes.join(', ')}\n\n`;
    }
    
    const badges = [];
    if (status.isCommon) badges.push('✅ Common');
    if (status.isObsolete) badges.push('⚠️ Obsolete');
    if (badges.length > 0) {
      output += `**Status**: ${badges.join(' | ')}\n\n`;
    }
  });
  
  output += `---\n*HTTP Status Code Reference from FreeFormatHub*`;
  
  return output;
}

function formatCompactOutput(statusCodes: StatusCodeInfo[], config: HttpStatusConfig): string {
  let output = '';
  
  statusCodes.forEach(status => {
    output += `${status.code} ${status.message}`;
    if (status.isCommon) output += ' ✅';
    if (status.isObsolete) output += ' ⚠️';
    output += `\n${status.description}\n\n`;
  });
  
  return output.trim();
}

function formatTableOutput(statusCodes: StatusCodeInfo[], config: HttpStatusConfig): string {
  let output = `| Code | Message | Category | Description |\n`;
  output += `|------|---------|----------|-------------|\n`;
  
  statusCodes.forEach(status => {
    const description = config.includeDescription 
      ? status.description.substring(0, 100) + (status.description.length > 100 ? '...' : '')
      : status.message;
    
    output += `| ${status.code} | ${status.message} | ${status.category} | ${description} |\n`;
  });
  
  return output;
}

export function processHttpStatusCodes(input: string, config: HttpStatusConfig): ToolResult {
  try {
    let statusCodes: StatusCodeInfo[] = [];
    
    if (config.mode === 'category') {
      statusCodes = getStatusCodesByCategory(config.categoryFilter);
    } else if (config.mode === 'search') {
      if (!input.trim()) {
        return {
          success: false,
          error: 'Please enter a search term (status code, message, or description)'
        };
      }
      statusCodes = searchStatusCodes(input.trim());
    } else { // lookup mode
      if (!input.trim()) {
        return {
          success: false,
          error: 'Please enter an HTTP status code (e.g., 200, 404, 500)'
        };
      }
      
      const code = parseInt(input.trim(), 10);
      if (isNaN(code) || code < 100 || code > 599) {
        return {
          success: false,
          error: 'Please enter a valid HTTP status code between 100-599'
        };
      }
      
      const foundStatus = findStatusCode(code);
      if (!foundStatus) {
        return {
          success: false,
          error: `HTTP status code ${code} not found in database`
        };
      }
      
      statusCodes = [foundStatus];
    }
    
    // Filter out obsolete codes if not requested
    if (!config.showObsolete) {
      statusCodes = statusCodes.filter(status => !status.isObsolete);
    }
    
    const output = formatOutput(statusCodes, config);
    
    return {
      success: true,
      output,
      statusCodes
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process HTTP status code lookup'
    };
  }
}

export const HTTP_STATUS_CODES_TOOL: Tool = {
  id: 'http-status-codes',
  name: 'HTTP Status Code Reference',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'api-tools')!,
  slug: 'http-status-codes',
  icon: '📋',
  keywords: ['http', 'status', 'codes', 'reference', 'api', 'web', 'responses'],
  seoTitle: 'HTTP Status Code Reference - Complete Guide to HTTP Response Codes | FreeFormatHub',
  seoDescription: 'Comprehensive HTTP status code reference with descriptions, examples, and usage guidelines. Look up status codes 100-599 with detailed explanations.',
  description: 'Complete HTTP status code reference guide with detailed descriptions, usage examples, RFC references, and practical guidance for web developers and API designers.',
  
  examples: [
    {
      title: 'Look up Specific Code',
      input: '404',
      output: `# HTTP Status Code Reference

## 404 Not Found

**Category**: 4xx Client Error

**Description**: The server can't find the requested resource.

**When to Use**: When the requested resource does not exist on the server

**Common Examples**:
- URL does not exist
- Resource deleted
- Mistyped endpoint

**RFC References**: RFC 7231

**Related Status Codes**: 410

**Status**: ✅ Common`,
      description: 'Get detailed information about a specific status code'
    },
    {
      title: 'Search by Message',
      input: 'unauthorized',
      output: `# HTTP Status Code Reference

## 401 Unauthorized

**Category**: 4xx Client Error

**Description**: The request requires user authentication or authentication has failed.

**When to Use**: When authentication is required but missing or invalid

**Common Examples**:
- Missing API key
- Invalid credentials
- Expired token

**Related Status Codes**: 403, 407

**Status**: ✅ Common`,
      description: 'Search status codes by message or description'
    },
    {
      title: 'Browse by Category',
      input: '2xx',
      output: `# HTTP Status Codes Reference

## 200 OK

**Category**: 2xx Success
**Description**: The request has succeeded...

## 201 Created

**Category**: 2xx Success
**Description**: The request has been fulfilled and resulted in a new resource being created...

## 202 Accepted

**Category**: 2xx Success
**Description**: The request has been accepted for processing, but the processing has not been completed...`,
      description: 'Browse all status codes in a specific category'
    }
  ],
  
  useCases: [
    'API development and debugging',
    'Web development troubleshooting',
    'Learning HTTP protocol standards',
    'Server configuration and error handling',
    'API documentation and response design'
  ],
  
  faq: [
    {
      question: 'What are the main HTTP status code categories?',
      answer: '1xx (Informational), 2xx (Success), 3xx (Redirection), 4xx (Client Error), and 5xx (Server Error). Each category indicates the type of response from the server.'
    },
    {
      question: 'When should I use 422 vs 400?',
      answer: 'Use 400 for malformed requests (syntax errors), and 422 for well-formed requests that fail semantic validation (business logic errors).'
    },
    {
      question: 'What\'s the difference between 401 and 403?',
      answer: '401 means authentication is required or failed (login needed), while 403 means the user is authenticated but lacks permission for the resource.'
    },
    {
      question: 'Which status codes are most commonly used?',
      answer: 'Most common: 200 (OK), 201 (Created), 204 (No Content), 301/302 (Redirects), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 422 (Unprocessable Entity), 500 (Internal Server Error), 502 (Bad Gateway), 503 (Service Unavailable).'
    },
    {
      question: 'How do I choose between 301 and 302 redirects?',
      answer: 'Use 301 for permanent redirects (SEO juice transfers, caching encouraged) and 302 for temporary redirects (original URL will be used again).'
    }
  ],
  
  commonErrors: [
    'Invalid status code range - codes must be between 100-599',
    'Unknown status code - not all codes between 100-599 are defined',
    'Mixing up 401 vs 403 - authentication vs authorization',
    'Using 200 when 201 or 204 would be more appropriate',
    'Overusing 500 for client-side validation errors'
  ],

  relatedTools: ['url-parser', 'ip-subnet-calculator', 'json-formatter']
};