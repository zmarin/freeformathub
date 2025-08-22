import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface UrlValidatorConfig {
  validateSyntax: boolean;
  validateScheme: boolean;
  validateDomain: boolean;
  allowLocalhost: boolean;
  allowIpAddress: boolean;
  allowNonStandardPorts: boolean;
  requireTld: boolean;
  checkPathSafety: boolean;
  maxLength: number;
  allowedSchemes: string[];
  strictMode: boolean;
  validateEncoding: boolean;
  checkSecurity: boolean;
  detectRedirects: boolean;
  validateAnchor: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  validation?: UrlValidation;
  analysis?: UrlAnalysis;
  warnings?: string[];
}

interface UrlValidation {
  isValid: boolean;
  url: string;
  scheme: string;
  hostname: string;
  port?: number;
  pathname: string;
  search: string;
  hash: string;
  syntaxValid: boolean;
  schemeValid: boolean;
  domainValid: boolean;
  pathValid: boolean;
  encodingValid: boolean;
  lengthValid: boolean;
  securityLevel: 'high' | 'medium' | 'low' | 'dangerous';
}

interface UrlAnalysis {
  type: 'web' | 'api' | 'file' | 'mail' | 'unknown';
  isSecure: boolean;
  hasParams: boolean;
  paramCount: number;
  hasFragment: boolean;
  pathDepth: number;
  estimatedTechnology?: string;
  potentialIssues: string[];
  recommendations: string[];
  seoFriendly: boolean;
  accessibility: AccessibilityInfo;
}

interface AccessibilityInfo {
  hasDescriptiveText: boolean;
  isShortened: boolean;
  hasUnsafeChars: boolean;
  readabilityScore: number;
}

// Common URL schemes
const STANDARD_SCHEMES = [
  'http', 'https', 'ftp', 'ftps', 'file', 'mailto', 'tel', 'sms',
  'data', 'javascript', 'about', 'chrome', 'chrome-extension',
  'moz-extension', 'resource', 'blob', 'filesystem'
];

const SECURE_SCHEMES = ['https', 'ftps', 'sftp'];
const DANGEROUS_SCHEMES = ['javascript', 'data', 'vbscript'];

// Common TLDs for validation
const COMMON_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'arpa',
  'uk', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi',
  'au', 'nz', 'ca', 'jp', 'cn', 'in', 'br', 'mx', 'ar', 'cl', 'co',
  'info', 'name', 'mobi', 'travel', 'museum', 'aero', 'coop', 'jobs',
  'io', 'ai', 'tech', 'dev', 'app', 'web', 'site', 'online', 'store',
];

// Suspicious URL patterns
const SUSPICIOUS_PATTERNS = [
  /bit\.ly|tinyurl|goo\.gl|t\.co|short\.link/i, // URL shorteners
  /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses in suspicious contexts
  /[а-я]|[α-ω]|[א-ת]|[أ-ي]/, // Non-Latin characters (potential IDN attacks)
  /(.)\1{5,}/, // Repeated characters
  /\.(exe|bat|com|pif|scr|vbs|jar)(\?|$)/i, // Executable file extensions
];

// Technology detection patterns
const TECH_PATTERNS: Record<string, RegExp[]> = {
  'WordPress': [/\/wp-content\//, /\/wp-admin\//, /\/wp-includes\//],
  'API': [/\/api\//, /\/v[0-9]+\//, /\.json(\?|$)/, /\/graphql/, /\/rest\//],
  'CDN': [/cdn\.|cloudfront\.|fastly\.|keycdn\./],
  'Social Media': [/facebook\.com|twitter\.com|instagram\.com|linkedin\.com/],
  'E-commerce': [/shopify|woocommerce|magento|prestashop/],
  'Google Services': [/google\.com|googleapis\.com|googleusercontent\.com/],
  'AWS': [/amazonaws\.com|aws\.amazon\.com/],
  'GitHub': [/github\.com|githubusercontent\.com/],
};

function parseUrl(input: string): URL | null {
  try {
    // Handle URLs without scheme
    if (!input.includes('://') && !input.startsWith('mailto:') && !input.startsWith('tel:')) {
      input = 'http://' + input;
    }
    
    return new URL(input);
  } catch {
    return null;
  }
}

function validateScheme(scheme: string, allowedSchemes: string[]): boolean {
  if (allowedSchemes.length > 0) {
    return allowedSchemes.includes(scheme.toLowerCase());
  }
  return STANDARD_SCHEMES.includes(scheme.toLowerCase());
}

function validateDomain(hostname: string, config: UrlValidatorConfig): boolean {
  if (!hostname) return false;
  
  // Allow localhost if configured
  if (config.allowLocalhost && (hostname === 'localhost' || hostname.startsWith('localhost'))) {
    return true;
  }
  
  // Check for IP addresses
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    if (!config.allowIpAddress) return false;
    
    // Validate IP ranges
    const parts = hostname.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }
  
  // IPv6 pattern (basic)
  const ipv6Pattern = /^\[?([0-9a-fA-F]*:){2,7}[0-9a-fA-F]*\]?$/;
  if (ipv6Pattern.test(hostname)) {
    return config.allowIpAddress;
  }
  
  // Domain validation
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainPattern.test(hostname)) return false;
  
  // Check TLD requirement
  if (config.requireTld) {
    const parts = hostname.split('.');
    if (parts.length < 2) return false;
    
    const tld = parts[parts.length - 1].toLowerCase();
    // Allow common TLDs or any TLD with 2+ characters
    return COMMON_TLDS.includes(tld) || tld.length >= 2;
  }
  
  return true;
}

function validatePath(pathname: string): boolean {
  // Check for dangerous patterns
  const dangerousPatterns = [
    /\.\./,  // Directory traversal
    /[<>"|*?]/, // Invalid characters
    /\0/, // Null bytes
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(pathname));
}

function validateEncoding(url: string): boolean {
  try {
    // Check for proper URL encoding
    const decoded = decodeURIComponent(url);
    const encoded = encodeURIComponent(decoded);
    
    // Should not contain unencoded special characters in certain positions
    const specialChars = /[<>"|{}\\^`\[\]]/;
    return !specialChars.test(url.split('://')[1] || '');
  } catch {
    return false;
  }
}

function detectTechnology(url: string, hostname: string, pathname: string): string | undefined {
  const fullUrl = `${hostname}${pathname}`;
  
  for (const [tech, patterns] of Object.entries(TECH_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(fullUrl))) {
      return tech;
    }
  }
  
  // Check file extensions
  const extension = pathname.split('.').pop()?.toLowerCase();
  if (extension) {
    const extensionMap: Record<string, string> = {
      'php': 'PHP',
      'asp': 'ASP.NET',
      'aspx': 'ASP.NET',
      'jsp': 'Java',
      'py': 'Python',
      'rb': 'Ruby',
      'js': 'JavaScript',
      'json': 'API/JSON',
      'xml': 'XML/API',
    };
    
    if (extensionMap[extension]) {
      return extensionMap[extension];
    }
  }
  
  return undefined;
}

function analyzeUrl(parsedUrl: URL): UrlAnalysis {
  const potentialIssues: string[] = [];
  const recommendations: string[] = [];
  
  // Determine URL type
  let type: UrlAnalysis['type'] = 'web';
  if (parsedUrl.protocol === 'mailto:') type = 'mail';
  else if (parsedUrl.protocol === 'file:') type = 'file';
  else if (parsedUrl.pathname.includes('/api/') || parsedUrl.pathname.endsWith('.json')) type = 'api';
  
  // Security analysis
  const isSecure = SECURE_SCHEMES.includes(parsedUrl.protocol.slice(0, -1));
  if (!isSecure && parsedUrl.protocol === 'http:') {
    potentialIssues.push('Uses insecure HTTP protocol');
    recommendations.push('Consider using HTTPS for security');
  }
  
  if (DANGEROUS_SCHEMES.includes(parsedUrl.protocol.slice(0, -1))) {
    potentialIssues.push('Uses potentially dangerous scheme');
  }
  
  // Check for suspicious patterns
  const fullUrl = parsedUrl.toString();
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(fullUrl)) {
      potentialIssues.push('Contains suspicious patterns');
    }
  });
  
  // Path analysis
  const pathDepth = parsedUrl.pathname.split('/').filter(Boolean).length;
  if (pathDepth > 10) {
    potentialIssues.push('Very deep URL path');
    recommendations.push('Consider simplifying URL structure');
  }
  
  // Parameter analysis
  const searchParams = new URLSearchParams(parsedUrl.search);
  const paramCount = Array.from(searchParams).length;
  const hasParams = paramCount > 0;
  
  if (paramCount > 20) {
    potentialIssues.push('Too many URL parameters');
    recommendations.push('Consider reducing number of parameters');
  }
  
  // Check for sensitive data in URL
  const sensitiveParams = ['password', 'token', 'key', 'secret', 'auth'];
  for (const [key] of searchParams) {
    if (sensitiveParams.some(sensitive => key.toLowerCase().includes(sensitive))) {
      potentialIssues.push('Potentially sensitive data in URL parameters');
      recommendations.push('Avoid including sensitive data in URLs');
      break;
    }
  }
  
  // SEO friendliness
  const seoFriendly = !parsedUrl.pathname.includes('?') && 
                     parsedUrl.pathname.split('/').every(segment => 
                       !segment || /^[a-z0-9-]+$/.test(segment));
  
  if (!seoFriendly) {
    recommendations.push('Use SEO-friendly URLs with hyphens instead of underscores');
  }
  
  // Accessibility analysis
  const accessibility: AccessibilityInfo = {
    hasDescriptiveText: parsedUrl.pathname.length > 5 && 
                       parsedUrl.pathname.split('/').some(segment => segment.length > 3),
    isShortened: parsedUrl.hostname.length < 10 || /bit\.ly|tinyurl/i.test(parsedUrl.hostname),
    hasUnsafeChars: /[<>"|*?]/.test(fullUrl),
    readabilityScore: calculateReadabilityScore(fullUrl),
  };
  
  if (accessibility.isShortened) {
    potentialIssues.push('Shortened URL may hide destination');
    recommendations.push('Use full URLs when possible for transparency');
  }
  
  return {
    type,
    isSecure,
    hasParams,
    paramCount,
    hasFragment: !!parsedUrl.hash,
    pathDepth,
    estimatedTechnology: detectTechnology(fullUrl, parsedUrl.hostname, parsedUrl.pathname),
    potentialIssues,
    recommendations,
    seoFriendly,
    accessibility,
  };
}

function calculateReadabilityScore(url: string): number {
  let score = 100;
  
  // Penalize length
  if (url.length > 100) score -= 20;
  else if (url.length > 50) score -= 10;
  
  // Penalize special characters
  const specialCharCount = (url.match(/[^a-zA-Z0-9./-]/g) || []).length;
  score -= specialCharCount * 2;
  
  // Penalize numbers in domain
  if (/\d/.test(url.split('/')[2] || '')) score -= 10;
  
  // Reward hyphens over underscores
  const underscoreCount = (url.match(/_/g) || []).length;
  score -= underscoreCount * 5;
  
  return Math.max(0, Math.min(100, score));
}

export function processUrlValidator(input: string, config: UrlValidatorConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'URL is required'
      };
    }
    
    const warnings: string[] = [];
    const originalInput = input.trim();
    
    // Basic length check
    if (config.maxLength > 0 && originalInput.length > config.maxLength) {
      return {
        success: false,
        error: `URL exceeds maximum length of ${config.maxLength} characters`
      };
    }
    
    // Parse URL
    const parsedUrl = parseUrl(originalInput);
    if (!parsedUrl) {
      return {
        success: false,
        error: 'Invalid URL format'
      };
    }
    
    // Validation checks
    const syntaxValid = true; // If we got here, syntax is valid
    const schemeValid = config.validateScheme ? validateScheme(parsedUrl.protocol.slice(0, -1), config.allowedSchemes) : true;
    const domainValid = config.validateDomain ? validateDomain(parsedUrl.hostname, config) : true;
    const pathValid = config.checkPathSafety ? validatePath(parsedUrl.pathname) : true;
    const encodingValid = config.validateEncoding ? validateEncoding(parsedUrl.toString()) : true;
    const lengthValid = config.maxLength === 0 || originalInput.length <= config.maxLength;
    
    // Overall validation
    const isValid = syntaxValid && schemeValid && domainValid && pathValid && encodingValid && lengthValid;
    
    if (config.strictMode && !isValid) {
      let errors = [];
      if (!schemeValid) errors.push('invalid scheme');
      if (!domainValid) errors.push('invalid domain');
      if (!pathValid) errors.push('unsafe path');
      if (!encodingValid) errors.push('invalid encoding');
      if (!lengthValid) errors.push('exceeds length limit');
      
      return {
        success: false,
        error: `Strict mode validation failed: ${errors.join(', ')}`
      };
    }
    
    // Determine security level
    let securityLevel: UrlValidation['securityLevel'] = 'medium';
    if (DANGEROUS_SCHEMES.includes(parsedUrl.protocol.slice(0, -1))) {
      securityLevel = 'dangerous';
    } else if (SECURE_SCHEMES.includes(parsedUrl.protocol.slice(0, -1))) {
      securityLevel = 'high';
    } else if (parsedUrl.protocol === 'http:') {
      securityLevel = 'low';
    }
    
    // Create validation result
    const validation: UrlValidation = {
      isValid,
      url: parsedUrl.toString(),
      scheme: parsedUrl.protocol.slice(0, -1),
      hostname: parsedUrl.hostname,
      port: parsedUrl.port ? parseInt(parsedUrl.port) : undefined,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      hash: parsedUrl.hash,
      syntaxValid,
      schemeValid,
      domainValid,
      pathValid,
      encodingValid,
      lengthValid,
      securityLevel,
    };
    
    // Analyze URL
    const analysis = analyzeUrl(parsedUrl);
    
    // Generate output
    let output = `URL Validation Result\n`;
    output += `${'='.repeat(30)}\n\n`;
    output += `URL: ${validation.url}\n`;
    output += `Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}\n`;
    output += `Security: ${getSecurityEmoji(validation.securityLevel)} ${validation.securityLevel.toUpperCase()}\n\n`;
    
    output += `Components:\n`;
    output += `• Scheme: ${validation.scheme}\n`;
    output += `• Hostname: ${validation.hostname}\n`;
    if (validation.port) output += `• Port: ${validation.port}\n`;
    output += `• Path: ${validation.pathname || '/'}\n`;
    if (validation.search) output += `• Query: ${validation.search}\n`;
    if (validation.hash) output += `• Fragment: ${validation.hash}\n\n`;
    
    output += `Validation Checks:\n`;
    output += `• Syntax: ${validation.syntaxValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Scheme: ${validation.schemeValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Domain: ${validation.domainValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Path: ${validation.pathValid ? '✅ Safe' : '❌ Unsafe'}\n`;
    output += `• Encoding: ${validation.encodingValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Length: ${validation.lengthValid ? '✅ Valid' : '❌ Too long'}\n\n`;
    
    output += `Analysis:\n`;
    output += `• Type: ${analysis.type.toUpperCase()}\n`;
    output += `• Secure: ${analysis.isSecure ? '✅ Yes' : '❌ No'}\n`;
    output += `• Parameters: ${analysis.hasParams ? `${analysis.paramCount}` : 'None'}\n`;
    output += `• Path Depth: ${analysis.pathDepth}\n`;
    if (analysis.estimatedTechnology) output += `• Technology: ${analysis.estimatedTechnology}\n`;
    output += `• SEO Friendly: ${analysis.seoFriendly ? '✅ Yes' : '❌ No'}\n`;
    output += `• Readability: ${analysis.accessibility.readabilityScore}%\n`;
    
    if (analysis.potentialIssues.length > 0) {
      output += `\nPotential Issues:\n`;
      analysis.potentialIssues.forEach(issue => {
        output += `• ⚠️ ${issue}\n`;
      });
    }
    
    if (analysis.recommendations.length > 0) {
      output += `\nRecommendations:\n`;
      analysis.recommendations.forEach(rec => {
        output += `• 💡 ${rec}\n`;
      });
    }
    
    // Add warnings
    if (!validation.domainValid) {
      warnings.push('Domain validation failed');
    }
    
    if (!validation.schemeValid) {
      warnings.push('Unsupported or invalid URL scheme');
    }
    
    if (analysis.accessibility.isShortened) {
      warnings.push('Shortened URL detected - destination may be hidden');
    }
    
    if (validation.securityLevel === 'dangerous') {
      warnings.push('URL uses potentially dangerous scheme');
    }
    
    return {
      success: true,
      output,
      validation,
      analysis,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

function getSecurityEmoji(level: string): string {
  switch (level) {
    case 'high': return '🔒';
    case 'medium': return '🔓';
    case 'low': return '⚠️';
    case 'dangerous': return '🚨';
    default: return '❓';
  }
}

export const URL_VALIDATOR_TOOL: Tool = {
  id: 'url-validator',
  name: 'URL Validator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!.subcategories!.find(sub => sub.id === 'web-validation')!,
  slug: 'url-validator',
  icon: '🔗',
  keywords: ['url', 'validate', 'link', 'web', 'domain', 'scheme', 'security', 'seo'],
  seoTitle: 'URL Validator - Validate Web Links & Check URL Security | FreeFormatHub',
  seoDescription: 'Validate URLs and web links with security analysis, domain verification, and SEO recommendations. Check URL structure and safety.',
  description: 'Validate URLs and web links with comprehensive security analysis, domain verification, SEO recommendations, and accessibility checks.',

  examples: [
    {
      title: 'Secure HTTPS URL',
      input: 'https://www.example.com/path/to/page?param=value#section',
      output: `URL Validation Result
==============================

URL: https://www.example.com/path/to/page?param=value#section
Status: ✅ VALID
Security: 🔒 HIGH

Components:
• Scheme: https
• Hostname: www.example.com
• Path: /path/to/page
• Query: ?param=value
• Fragment: #section

Validation Checks:
• Syntax: ✅ Valid
• Scheme: ✅ Valid
• Domain: ✅ Valid
• Path: ✅ Safe
• Encoding: ✅ Valid
• Length: ✅ Valid`,
      description: 'Validate a secure HTTPS URL with all components'
    },
    {
      title: 'API Endpoint',
      input: 'https://api.example.com/v1/users/123?include=profile',
      output: `Analysis:
• Type: API
• Secure: ✅ Yes
• Parameters: 1
• Path Depth: 4
• Technology: API
• SEO Friendly: ✅ Yes
• Readability: 85%`,
      description: 'Validate and analyze an API endpoint URL'
    },
    {
      title: 'Invalid URL',
      input: 'ht!tp://bad-url..com/path with spaces',
      output: `URL Validation Result
==============================

Status: ❌ INVALID

Potential Issues:
• ⚠️ Invalid URL format
• ⚠️ Contains unsafe characters`,
      description: 'Example of invalid URL with format issues'
    }
  ],

  useCases: [
    'Validating user-submitted URLs in web applications',
    'Checking link safety and security before redirection',
    'SEO analysis and URL structure optimization',
    'Web scraping and API endpoint validation',
    'Security auditing of external links and resources',
    'Form validation for URL input fields',
    'Link checker and broken link detection preparation',
    'Educational purposes for understanding URL structure'
  ],

  faq: [
    {
      question: 'What makes a URL valid or invalid?',
      answer: 'URL validity depends on proper syntax (scheme://domain/path), valid domain names, supported schemes, safe characters, and adherence to RFC standards.'
    },
    {
      question: 'How does the security analysis work?',
      answer: 'Security analysis checks for HTTPS usage, dangerous schemes (like javascript:), suspicious patterns, IP addresses, and potential phishing indicators.'
    },
    {
      question: 'Can it detect different types of URLs?',
      answer: 'Yes, the tool can identify web URLs, API endpoints, file URLs, email links, and estimate the underlying technology based on patterns and extensions.'
    },
    {
      question: 'What are SEO-friendly URLs?',
      answer: 'SEO-friendly URLs use lowercase letters, hyphens instead of underscores, descriptive words, and avoid excessive parameters or complex structures.'
    },
    {
      question: 'Does it check if URLs are reachable?',
      answer: 'This tool validates URL structure and format but does not check if URLs are actually reachable or return valid responses. It focuses on syntax and security.'
    }
  ],

  commonErrors: [
    'Invalid URL syntax or missing scheme',
    'Unsupported or dangerous URL schemes',
    'Invalid domain names or IP addresses',
    'Unsafe characters in URL paths',
    'URLs exceeding maximum length limits'
  ],

  relatedTools: ['link-checker', 'domain-validator', 'seo-analyzer', 'security-scanner', 'http-status-checker']
};