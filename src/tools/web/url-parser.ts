import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface UrlParserConfig {
  mode: 'parse' | 'validate' | 'analyze';
  includeQueryParams: boolean;
  includeFragments: boolean;
  includeSecurity: boolean;
  includeEncoding: boolean;
  showValidation: boolean;
  outputFormat: 'detailed' | 'json' | 'table';
  decodeComponents: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  urlInfo?: UrlInfo;
}

interface UrlInfo {
  original: string;
  protocol: string;
  hostname: string;
  port: number | null;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  host: string;
  href: string;
  username: string;
  password: string;
  queryParams: Record<string, string | string[]>;
  pathSegments: string[];
  isValid: boolean;
  isSecure: boolean;
  isLocalhost: boolean;
  isIP: boolean;
  ipVersion: string | null;
  tld: string;
  domain: string;
  subdomain: string;
  validation: {
    hasValidProtocol: boolean;
    hasValidHost: boolean;
    hasValidPort: boolean;
    hasValidPath: boolean;
    issues: string[];
  };
  encoding: {
    originalEncoded: string;
    decodedUrl: string;
    hasEncodedChars: boolean;
    encodedComponents: string[];
  };
  security: {
    isHttps: boolean;
    hasCredentials: boolean;
    hasSuspiciousPatterns: boolean;
    securityIssues: string[];
  };
}

// Helper functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function parseQueryString(search: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  
  if (!search || search === '?') return params;
  
  const queryString = search.startsWith('?') ? search.slice(1) : search;
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    if (!pair) continue;
    
    const [key, ...valueParts] = pair.split('=');
    const decodedKey = decodeURIComponent(key);
    const decodedValue = valueParts.length > 0 
      ? decodeURIComponent(valueParts.join('=')) 
      : '';
    
    if (decodedKey in params) {
      const existing = params[decodedKey];
      if (Array.isArray(existing)) {
        existing.push(decodedValue);
      } else {
        params[decodedKey] = [existing, decodedValue];
      }
    } else {
      params[decodedKey] = decodedValue;
    }
  }
  
  return params;
}

function extractDomainParts(hostname: string): { domain: string; subdomain: string; tld: string } {
  if (!hostname) return { domain: '', subdomain: '', tld: '' };
  
  // Check if it's an IP address
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipRegex.test(hostname)) {
    return { domain: hostname, subdomain: '', tld: '' };
  }
  
  const parts = hostname.split('.');
  if (parts.length < 2) {
    return { domain: hostname, subdomain: '', tld: '' };
  }
  
  const tld = parts[parts.length - 1];
  const domain = parts[parts.length - 2];
  const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '';
  
  return { domain, subdomain, tld };
}

function isIPAddress(hostname: string): { isIP: boolean; version: string | null } {
  // IPv4
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = hostname.match(ipv4Regex);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1, 5).map(Number);
    const isValidIPv4 = octets.every(octet => octet >= 0 && octet <= 255);
    return { isIP: isValidIPv4, version: isValidIPv4 ? 'IPv4' : null };
  }
  
  // IPv6 (simplified check)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  if (ipv6Regex.test(hostname) || hostname.includes(':')) {
    return { isIP: true, version: 'IPv6' };
  }
  
  return { isIP: false, version: null };
}

function validateUrl(url: URL): { hasValidProtocol: boolean; hasValidHost: boolean; hasValidPort: boolean; hasValidPath: boolean; issues: string[] } {
  const issues: string[] = [];
  let hasValidProtocol = true;
  let hasValidHost = true;
  let hasValidPort = true;
  let hasValidPath = true;
  
  // Protocol validation
  if (!url.protocol || !url.protocol.includes(':')) {
    hasValidProtocol = false;
    issues.push('Invalid or missing protocol');
  }
  
  const commonProtocols = ['http:', 'https:', 'ftp:', 'ftps:', 'file:', 'mailto:', 'tel:', 'ws:', 'wss:'];
  if (!commonProtocols.includes(url.protocol.toLowerCase())) {
    issues.push(`Uncommon protocol: ${url.protocol}`);
  }
  
  // Host validation
  if (!url.hostname) {
    hasValidHost = false;
    issues.push('Missing hostname');
  } else {
    // Check for valid hostname format
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    const { isIP } = isIPAddress(url.hostname);
    
    if (!isIP && !hostnameRegex.test(url.hostname)) {
      hasValidHost = false;
      issues.push('Invalid hostname format');
    }
  }
  
  // Port validation
  if (url.port) {
    const port = parseInt(url.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      hasValidPort = false;
      issues.push('Invalid port number');
    }
  }
  
  // Path validation
  try {
    decodeURIComponent(url.pathname);
  } catch {
    hasValidPath = false;
    issues.push('Invalid URL encoding in path');
  }
  
  return {
    hasValidProtocol,
    hasValidHost,
    hasValidPort,
    hasValidPath,
    issues
  };
}

function analyzeUrlEncoding(originalUrl: string, parsedUrl: URL): {
  originalEncoded: string;
  decodedUrl: string;
  hasEncodedChars: boolean;
  encodedComponents: string[];
} {
  const encodedComponents: string[] = [];
  
  // Check for encoded characters
  const hasEncodedChars = /%[0-9A-Fa-f]{2}/.test(originalUrl);
  
  // Try to decode the entire URL
  let decodedUrl = originalUrl;
  try {
    decodedUrl = decodeURIComponent(originalUrl);
  } catch {
    // If full decode fails, decode components individually
    decodedUrl = originalUrl;
  }
  
  // Check individual components for encoding
  if (/%[0-9A-Fa-f]{2}/.test(parsedUrl.pathname)) {
    encodedComponents.push('pathname');
  }
  if (/%[0-9A-Fa-f]{2}/.test(parsedUrl.search)) {
    encodedComponents.push('query parameters');
  }
  if (/%[0-9A-Fa-f]{2}/.test(parsedUrl.hash)) {
    encodedComponents.push('fragment');
  }
  if (/%[0-9A-Fa-f]{2}/.test(parsedUrl.username)) {
    encodedComponents.push('username');
  }
  if (/%[0-9A-Fa-f]{2}/.test(parsedUrl.password)) {
    encodedComponents.push('password');
  }
  
  return {
    originalEncoded: originalUrl,
    decodedUrl,
    hasEncodedChars,
    encodedComponents
  };
}

function analyzeUrlSecurity(url: URL, originalUrl: string): {
  isHttps: boolean;
  hasCredentials: boolean;
  hasSuspiciousPatterns: boolean;
  securityIssues: string[];
} {
  const securityIssues: string[] = [];
  const isHttps = url.protocol === 'https:';
  const hasCredentials = !!(url.username || url.password);
  
  if (!isHttps && (url.protocol === 'http:')) {
    securityIssues.push('Using insecure HTTP protocol');
  }
  
  if (hasCredentials) {
    securityIssues.push('URL contains credentials (username/password)');
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /eval\(/i,
    /onload=/i,
    /onerror=/i
  ];
  
  const hasSuspiciousPatterns = suspiciousPatterns.some(pattern => pattern.test(originalUrl));
  if (hasSuspiciousPatterns) {
    securityIssues.push('Contains potentially dangerous patterns');
  }
  
  // Check for homograph attacks (mixed scripts)
  const containsMixedScripts = /[А-Яа-я]/.test(url.hostname) && /[a-zA-Z]/.test(url.hostname);
  if (containsMixedScripts) {
    securityIssues.push('Potential homograph attack (mixed character sets in domain)');
  }
  
  // Check for suspicious TLD
  const { tld } = extractDomainParts(url.hostname);
  const suspiciousTlds = ['tk', 'ml', 'ga', 'cf'];
  if (suspiciousTlds.includes(tld.toLowerCase())) {
    securityIssues.push('Uses suspicious top-level domain');
  }
  
  return {
    isHttps,
    hasCredentials,
    hasSuspiciousPatterns,
    securityIssues
  };
}

function formatOutput(urlInfo: UrlInfo, config: UrlParserConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(urlInfo, null, 2);
  }
  
  if (config.outputFormat === 'table') {
    return formatTableOutput(urlInfo, config);
  }
  
  return formatDetailedOutput(urlInfo, config);
}

function formatDetailedOutput(urlInfo: UrlInfo, config: UrlParserConfig): string {
  let output = `# URL Parser Results\n\n`;
  
  output += `## Basic Information\n\n`;
  output += `- **Original URL**: ${urlInfo.original}\n`;
  output += `- **Protocol**: ${urlInfo.protocol}\n`;
  output += `- **Hostname**: ${urlInfo.hostname}\n`;
  if (urlInfo.port) {
    output += `- **Port**: ${urlInfo.port}\n`;
  }
  output += `- **Path**: ${urlInfo.pathname || '/'}\n`;
  
  if (config.includeQueryParams && urlInfo.search) {
    output += `- **Query String**: ${urlInfo.search}\n`;
  }
  
  if (config.includeFragments && urlInfo.hash) {
    output += `- **Fragment**: ${urlInfo.hash}\n`;
  }
  
  output += `- **Origin**: ${urlInfo.origin}\n`;
  output += `- **Full URL**: ${urlInfo.href}\n`;
  
  if (urlInfo.username || urlInfo.password) {
    output += `\n## Authentication\n\n`;
    if (urlInfo.username) output += `- **Username**: ${urlInfo.username}\n`;
    if (urlInfo.password) output += `- **Password**: ${'*'.repeat(urlInfo.password.length)}\n`;
  }
  
  output += `\n## Domain Analysis\n\n`;
  output += `- **Domain**: ${urlInfo.domain}\n`;
  if (urlInfo.subdomain) {
    output += `- **Subdomain**: ${urlInfo.subdomain}\n`;
  }
  if (urlInfo.tld) {
    output += `- **Top-Level Domain**: ${urlInfo.tld}\n`;
  }
  output += `- **Is IP Address**: ${urlInfo.isIP ? 'Yes' : 'No'}\n`;
  if (urlInfo.ipVersion) {
    output += `- **IP Version**: ${urlInfo.ipVersion}\n`;
  }
  output += `- **Is Localhost**: ${urlInfo.isLocalhost ? 'Yes' : 'No'}\n`;
  
  if (config.includeQueryParams && Object.keys(urlInfo.queryParams).length > 0) {
    output += `\n## Query Parameters\n\n`;
    for (const [key, value] of Object.entries(urlInfo.queryParams)) {
      if (Array.isArray(value)) {
        output += `- **${key}**: [${value.join(', ')}]\n`;
      } else {
        output += `- **${key}**: ${value}\n`;
      }
    }
  }
  
  if (urlInfo.pathSegments.length > 0) {
    output += `\n## Path Segments\n\n`;
    urlInfo.pathSegments.forEach((segment, index) => {
      output += `${index + 1}. ${segment}\n`;
    });
  }
  
  if (config.showValidation) {
    output += `\n## Validation\n\n`;
    output += `- **Valid URL**: ${urlInfo.isValid ? '✅ Yes' : '❌ No'}\n`;
    output += `- **Valid Protocol**: ${urlInfo.validation.hasValidProtocol ? '✅ Yes' : '❌ No'}\n`;
    output += `- **Valid Host**: ${urlInfo.validation.hasValidHost ? '✅ Yes' : '❌ No'}\n`;
    output += `- **Valid Port**: ${urlInfo.validation.hasValidPort ? '✅ Yes' : '❌ No'}\n`;
    output += `- **Valid Path**: ${urlInfo.validation.hasValidPath ? '✅ Yes' : '❌ No'}\n`;
    
    if (urlInfo.validation.issues.length > 0) {
      output += `\n**Issues Found:**\n`;
      urlInfo.validation.issues.forEach(issue => {
        output += `- ⚠️ ${issue}\n`;
      });
    }
  }
  
  if (config.includeEncoding) {
    output += `\n## URL Encoding\n\n`;
    output += `- **Has Encoded Characters**: ${urlInfo.encoding.hasEncodedChars ? 'Yes' : 'No'}\n`;
    if (urlInfo.encoding.hasEncodedChars) {
      output += `- **Decoded URL**: ${urlInfo.encoding.decodedUrl}\n`;
      if (urlInfo.encoding.encodedComponents.length > 0) {
        output += `- **Encoded Components**: ${urlInfo.encoding.encodedComponents.join(', ')}\n`;
      }
    }
  }
  
  if (config.includeSecurity) {
    output += `\n## Security Analysis\n\n`;
    output += `- **Secure Protocol**: ${urlInfo.security.isHttps ? '✅ Yes (HTTPS)' : '❌ No (HTTP)'}\n`;
    output += `- **Contains Credentials**: ${urlInfo.security.hasCredentials ? '⚠️ Yes' : '✅ No'}\n`;
    output += `- **Suspicious Patterns**: ${urlInfo.security.hasSuspiciousPatterns ? '⚠️ Found' : '✅ None'}\n`;
    
    if (urlInfo.security.securityIssues.length > 0) {
      output += `\n**Security Issues:**\n`;
      urlInfo.security.securityIssues.forEach(issue => {
        output += `- 🔒 ${issue}\n`;
      });
    }
  }
  
  output += `\n---\n*Analyzed by FreeFormatHub URL Parser*`;
  
  return output;
}

function formatTableOutput(urlInfo: UrlInfo, config: UrlParserConfig): string {
  let output = `| Component | Value |\n`;
  output += `|-----------|-------|\n`;
  output += `| Protocol | ${urlInfo.protocol} |\n`;
  output += `| Hostname | ${urlInfo.hostname} |\n`;
  if (urlInfo.port) output += `| Port | ${urlInfo.port} |\n`;
  output += `| Path | ${urlInfo.pathname || '/'} |\n`;
  if (urlInfo.search) output += `| Query | ${urlInfo.search} |\n`;
  if (urlInfo.hash) output += `| Fragment | ${urlInfo.hash} |\n`;
  output += `| Origin | ${urlInfo.origin} |\n`;
  output += `| Domain | ${urlInfo.domain} |\n`;
  if (urlInfo.subdomain) output += `| Subdomain | ${urlInfo.subdomain} |\n`;
  if (urlInfo.tld) output += `| TLD | ${urlInfo.tld} |\n`;
  output += `| Is Secure | ${urlInfo.isSecure ? 'Yes' : 'No'} |\n`;
  output += `| Is Valid | ${urlInfo.isValid ? 'Yes' : 'No'} |\n`;
  
  return output;
}

export function processUrlParser(input: string, config: UrlParserConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide a URL to parse'
      };
    }
    
    const trimmedInput = input.trim();
    
    // Add protocol if missing
    let urlToParse = trimmedInput;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmedInput)) {
      urlToParse = 'https://' + trimmedInput;
    }
    
    if (config.mode === 'validate') {
      const isValid = isValidUrl(urlToParse);
      return {
        success: true,
        output: isValid ? '✅ Valid URL format' : '❌ Invalid URL format'
      };
    }
    
    if (!isValidUrl(urlToParse)) {
      return {
        success: false,
        error: 'Invalid URL format. Please provide a valid URL.'
      };
    }
    
    const url = new URL(urlToParse);
    const { domain, subdomain, tld } = extractDomainParts(url.hostname);
    const { isIP, version } = isIPAddress(url.hostname);
    
    const urlInfo: UrlInfo = {
      original: trimmedInput,
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port ? parseInt(url.port, 10) : null,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      host: url.host,
      href: url.href,
      username: url.username,
      password: url.password,
      queryParams: parseQueryString(url.search),
      pathSegments: url.pathname.split('/').filter(segment => segment.length > 0),
      isValid: true,
      isSecure: url.protocol === 'https:',
      isLocalhost: url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1',
      isIP: isIP,
      ipVersion: version,
      tld,
      domain,
      subdomain,
      validation: validateUrl(url),
      encoding: analyzeUrlEncoding(trimmedInput, url),
      security: analyzeUrlSecurity(url, trimmedInput)
    };
    
    if (config.decodeComponents && urlInfo.encoding.hasEncodedChars) {
      // Apply decoding to display
      try {
        urlInfo.pathname = decodeURIComponent(urlInfo.pathname);
        urlInfo.search = decodeURIComponent(urlInfo.search);
        urlInfo.hash = decodeURIComponent(urlInfo.hash);
      } catch {
        // Keep original if decoding fails
      }
    }
    
    const output = formatOutput(urlInfo, config);
    
    return {
      success: true,
      output,
      urlInfo
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse URL'
    };
  }
}

export const URL_PARSER_TOOL: Tool = {
  id: 'url-parser',
  name: 'URL Parser & Analyzer',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'api-tools')!,
  slug: 'url-parser',
  icon: '🔗',
  keywords: ['url', 'parser', 'analyzer', 'domain', 'query', 'parameters', 'validator'],
  seoTitle: 'URL Parser & Analyzer - Parse URLs, Domains, Query Parameters | FreeFormatHub',
  seoDescription: 'Parse and analyze URLs to extract components like protocol, domain, path, query parameters, and fragments. Includes validation and security analysis.',
  description: 'Parse and analyze URLs to extract all components including protocol, hostname, path, query parameters, fragments, with security analysis and validation features.',
  
  examples: [
    {
      title: 'Basic URL Parsing',
      input: 'https://example.com/path/to/page?param1=value1&param2=value2#section',
      output: `# URL Parser Results

## Basic Information

- **Original URL**: https://example.com/path/to/page?param1=value1&param2=value2#section
- **Protocol**: https:
- **Hostname**: example.com
- **Path**: /path/to/page
- **Query String**: ?param1=value1&param2=value2
- **Fragment**: #section
- **Origin**: https://example.com
- **Full URL**: https://example.com/path/to/page?param1=value1&param2=value2#section

## Domain Analysis

- **Domain**: example
- **Top-Level Domain**: com
- **Is IP Address**: No
- **Is Localhost**: No

## Query Parameters

- **param1**: value1
- **param2**: value2`,
      description: 'Parse a complete URL with all components'
    },
    {
      title: 'URL with Authentication',
      input: 'ftp://user:password@files.example.com:2121/documents/',
      output: `# URL Parser Results

## Basic Information

- **Original URL**: ftp://user:password@files.example.com:2121/documents/
- **Protocol**: ftp:
- **Hostname**: files.example.com
- **Port**: 2121
- **Path**: /documents/

## Authentication

- **Username**: user
- **Password**: ********

## Domain Analysis

- **Domain**: example
- **Subdomain**: files
- **Top-Level Domain**: com`,
      description: 'Parse FTP URL with authentication credentials'
    },
    {
      title: 'Complex URL Analysis',
      input: 'https://api.sub.example.com:8443/v1/users/123?filter=active&sort=name#results',
      output: `# URL Parser Results

## Basic Information

- **Original URL**: https://api.sub.example.com:8443/v1/users/123?filter=active&sort=name#results
- **Protocol**: https:
- **Hostname**: api.sub.example.com
- **Port**: 8443
- **Path**: /v1/users/123
- **Query String**: ?filter=active&sort=name
- **Fragment**: #results

## Domain Analysis

- **Domain**: example
- **Subdomain**: api.sub
- **Top-Level Domain**: com

## Path Segments

1. v1
2. users
3. 123

## Query Parameters

- **filter**: active
- **sort**: name`,
      description: 'Analyze complex API URL with subdomain and path segments'
    }
  ],
  
  useCases: [
    'URL validation and format checking',
    'Extracting query parameters for API testing',
    'Domain and subdomain analysis',
    'Security auditing of URLs for malicious patterns',
    'URL debugging and troubleshooting',
    'Building URL components for web applications'
  ],
  
  faq: [
    {
      question: 'What URL components can be parsed?',
      answer: 'The parser extracts protocol, hostname, port, path, query parameters, fragments, authentication credentials, and analyzes domain structure including subdomains and TLD.'
    },
    {
      question: 'How does URL validation work?',
      answer: 'Validation checks protocol format, hostname structure, port range (1-65535), and URL encoding. It flags common issues and suspicious patterns for security analysis.'
    },
    {
      question: 'What security issues can be detected?',
      answer: 'The tool detects insecure HTTP protocols, embedded credentials, suspicious patterns like JavaScript injections, homograph attacks, and potentially dangerous TLDs.'
    },
    {
      question: 'How are query parameters parsed?',
      answer: 'Query parameters are parsed and decoded, handling multiple values for the same key and preserving the original encoding. Arrays are automatically detected for repeated parameter names.'
    },
    {
      question: 'Can the parser handle encoded URLs?',
      answer: 'Yes, the parser detects URL encoding and can decode components while preserving the original encoded version for comparison and analysis.'
    }
  ],
  
  commonErrors: [
    'Invalid URL format - ensure proper protocol and hostname structure',
    'Missing protocol - URLs should include http:// or https://',
    'Invalid port number - ports must be between 1 and 65535',
    'Malformed query parameters - check for proper encoding',
    'Invalid characters in hostname - use only letters, numbers, and hyphens'
  ],

  relatedTools: ['ip-subnet-calculator', 'url-encoder', 'regex-tester']
};