import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface UrlShortenerConfig {
  customAlias: string;
  domain: string;
  includeAnalytics: boolean;
  expirationDate: string;
  password: string;
  description: string;
  tags: string[];
  enableRedirect: boolean;
  redirectCode: 301 | 302 | 307 | 308;
  enablePreview: boolean;
  enableClickTracking: boolean;
  maxClicks: number;
  geoRestrictions: string[];
  deviceRestrictions: string[];
  utmParams: UtmParameters;
}

export interface UtmParameters {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  shortUrl?: ShortUrlResult;
  warnings?: string[];
}

interface ShortUrlResult {
  originalUrl: string;
  shortUrl: string;
  alias: string;
  domain: string;
  qrCode: string;
  metadata: UrlMetadata;
  analytics: AnalyticsInfo;
  configuration: ConfigurationInfo;
  security: SecurityInfo;
}

interface UrlMetadata {
  createdAt: string;
  expiresAt?: string;
  description: string;
  tags: string[];
  urlLength: string;
  compressionRatio: number;
  protocol: string;
  domainInfo: DomainInfo;
}

interface DomainInfo {
  hostname: string;
  subdomain: string;
  rootDomain: string;
  tld: string;
  isSecure: boolean;
}

interface AnalyticsInfo {
  trackingEnabled: boolean;
  clickTracking: boolean;
  geoTracking: boolean;
  deviceTracking: boolean;
  utmTracking: boolean;
  maxClicks: number;
  estimatedLifetime: string;
}

interface ConfigurationInfo {
  redirectCode: number;
  redirectType: string;
  previewEnabled: boolean;
  passwordProtected: boolean;
  geoRestricted: boolean;
  deviceRestricted: boolean;
  cacheControl: string;
}

interface SecurityInfo {
  malwareCheck: 'safe' | 'warning' | 'danger' | 'unknown';
  phishingCheck: 'safe' | 'warning' | 'danger' | 'unknown';
  domainReputation: 'good' | 'neutral' | 'poor' | 'unknown';
  httpsSupport: boolean;
  certificateValid: boolean;
}

// URL validation patterns
const URL_PATTERN = /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/;
const DOMAIN_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;

// Predefined short domains for simulation
const SHORT_DOMAINS = [
  'short.ly', 'tny.url', 'go.link', 'bit.do', 'cut.it',
  'qr.link', 'snip.ly', 'mini.url', 'tiny.one', 'shrt.co'
];

function validateUrl(url: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!url.trim()) {
    issues.push('URL is required');
    return { isValid: false, issues };
  }
  
  // Basic URL format validation
  if (!URL_PATTERN.test(url)) {
    issues.push('Invalid URL format');
  }
  
  // Check for common issues
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    issues.push('URL must start with http:// or https://');
  }
  
  if (url.length > 2048) {
    issues.push('URL is too long (max 2048 characters)');
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bit\.ly\/[0-9a-z]+/i,
    /tinyurl\.com/i,
    /localhost/i,
    /127\.0\.0\.1/i,
    /192\.168\./i,
    /10\.\d+\.\d+\.\d+/i
  ];
  
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(url)) {
      issues.push('URL contains potentially suspicious patterns');
    }
  });
  
  return { isValid: issues.length === 0, issues };
}

function generateAlias(originalUrl: string, customAlias?: string): string {
  if (customAlias && customAlias.trim()) {
    // Sanitize custom alias
    return customAlias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 20);
  }
  
  // Generate alias based on URL hash
  let hash = 0;
  for (let i = 0; i < originalUrl.length; i++) {
    const char = originalUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to base36 and ensure minimum length
  const baseAlias = Math.abs(hash).toString(36);
  const timestamp = Date.now().toString(36).slice(-3);
  
  return baseAlias.substring(0, 5) + timestamp;
}

function analyzeDomain(url: string): DomainInfo {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const parts = hostname.split('.');
    
    let subdomain = '';
    let rootDomain = hostname;
    let tld = '';
    
    if (parts.length > 2) {
      subdomain = parts.slice(0, -2).join('.');
      rootDomain = parts.slice(-2).join('.');
      tld = parts[parts.length - 1];
    } else if (parts.length === 2) {
      rootDomain = hostname;
      tld = parts[1];
    }
    
    return {
      hostname,
      subdomain,
      rootDomain,
      tld,
      isSecure: urlObj.protocol === 'https:'
    };
  } catch (error) {
    return {
      hostname: 'unknown',
      subdomain: '',
      rootDomain: 'unknown',
      tld: 'unknown',
      isSecure: false
    };
  }
}

function performSecurityCheck(url: string): SecurityInfo {
  // Simulate security checks (in real implementation, this would use actual security APIs)
  const domainInfo = analyzeDomain(url);
  
  // Basic heuristics for demo
  const isHttps = url.startsWith('https://');
  const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co'];
  const isSuspicious = suspiciousDomains.some(domain => url.includes(domain));
  
  // Common phishing/malware patterns
  const dangerousPatterns = [
    /paypal-[a-z]+\.com/i,
    /amazon-[a-z]+\.net/i,
    /google-[a-z]+\.org/i,
    /microsoft-[a-z]+\.info/i,
    /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/
  ];
  
  const hasDangerousPattern = dangerousPatterns.some(pattern => pattern.test(url));
  
  return {
    malwareCheck: hasDangerousPattern ? 'danger' : isSuspicious ? 'warning' : 'safe',
    phishingCheck: hasDangerousPattern ? 'danger' : isSuspicious ? 'warning' : 'safe',
    domainReputation: isSuspicious ? 'poor' : isHttps ? 'good' : 'neutral',
    httpsSupport: isHttps,
    certificateValid: isHttps // Simplified assumption
  };
}

function generateQrCode(shortUrl: string): string {
  // Generate a simple QR code data URL (placeholder)
  // In real implementation, this would use a QR code library
  const size = 200;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Simple placeholder QR code
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    
    // Draw simple pattern
    const moduleSize = size / 21;
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        if ((i + j) % 3 === 0) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    
    // Add text
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', size / 2, size - 10);
  }
  
  return canvas.toDataURL('image/png');
}

function buildShortUrl(domain: string, alias: string, config: UrlShortenerConfig): string {
  const protocol = 'https://';
  const baseDomain = domain || SHORT_DOMAINS[0];
  
  let shortUrl = `${protocol}${baseDomain}/${alias}`;
  
  // Add UTM parameters if specified
  const utmParams = new URLSearchParams();
  if (config.utmParams.source) utmParams.append('utm_source', config.utmParams.source);
  if (config.utmParams.medium) utmParams.append('utm_medium', config.utmParams.medium);
  if (config.utmParams.campaign) utmParams.append('utm_campaign', config.utmParams.campaign);
  if (config.utmParams.term) utmParams.append('utm_term', config.utmParams.term);
  if (config.utmParams.content) utmParams.append('utm_content', config.utmParams.content);
  
  if (utmParams.toString()) {
    shortUrl += `?${utmParams.toString()}`;
  }
  
  return shortUrl;
}

export function processUrlShortener(originalUrl: string, config: UrlShortenerConfig): ToolResult {
  try {
    const startTime = Date.now();
    
    // Validate URL
    const validation = validateUrl(originalUrl);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid URL: ${validation.issues.join(', ')}`
      };
    }

    const warnings: string[] = [];
    
    // Validate custom alias if provided
    if (config.customAlias && !/^[a-zA-Z0-9-]{3,20}$/.test(config.customAlias)) {
      warnings.push('Custom alias should be 3-20 characters (letters, numbers, hyphens only)');
    }
    
    // Validate domain if provided
    if (config.domain && !DOMAIN_PATTERN.test(config.domain)) {
      warnings.push('Invalid custom domain format');
    }

    // Generate alias and short URL
    const alias = generateAlias(originalUrl, config.customAlias);
    const domain = config.domain || SHORT_DOMAINS[Math.floor(Math.random() * SHORT_DOMAINS.length)];
    const shortUrl = buildShortUrl(domain, alias, config);
    
    // Analyze original URL
    const domainInfo = analyzeDomain(originalUrl);
    const securityInfo = performSecurityCheck(originalUrl);
    
    // Calculate compression ratio
    const originalLength = originalUrl.length;
    const shortLength = shortUrl.split('?')[0].length; // Exclude UTM params from compression calculation
    const compressionRatio = Math.round(((originalLength - shortLength) / originalLength) * 100);
    
    // Generate QR code
    const qrCode = generateQrCode(shortUrl);
    
    // Create metadata
    const createdAt = new Date().toISOString();
    const expiresAt = config.expirationDate ? new Date(config.expirationDate).toISOString() : undefined;
    
    const metadata: UrlMetadata = {
      createdAt,
      expiresAt,
      description: config.description || '',
      tags: config.tags || [],
      urlLength: `${originalLength} → ${shortLength} chars`,
      compressionRatio,
      protocol: domainInfo.isSecure ? 'HTTPS' : 'HTTP',
      domainInfo
    };

    const analytics: AnalyticsInfo = {
      trackingEnabled: config.includeAnalytics,
      clickTracking: config.enableClickTracking,
      geoTracking: config.geoRestrictions.length > 0,
      deviceTracking: config.deviceRestrictions.length > 0,
      utmTracking: Object.values(config.utmParams).some(param => param.length > 0),
      maxClicks: config.maxClicks || 0,
      estimatedLifetime: expiresAt ? 'Until expiration' : 'Permanent'
    };

    const configuration: ConfigurationInfo = {
      redirectCode: config.redirectCode,
      redirectType: config.redirectCode === 301 ? 'Permanent' : 'Temporary',
      previewEnabled: config.enablePreview,
      passwordProtected: config.password.length > 0,
      geoRestricted: config.geoRestrictions.length > 0,
      deviceRestricted: config.deviceRestrictions.length > 0,
      cacheControl: config.redirectCode === 301 ? 'Long-term' : 'Short-term'
    };

    const shortUrlResult: ShortUrlResult = {
      originalUrl,
      shortUrl,
      alias,
      domain,
      qrCode,
      metadata,
      analytics,
      configuration,
      security: securityInfo
    };

    // Add warnings based on analysis
    if (securityInfo.malwareCheck === 'danger' || securityInfo.phishingCheck === 'danger') {
      warnings.push('Security warning: URL may contain malicious content');
    }
    
    if (!securityInfo.httpsSupport) {
      warnings.push('URL uses HTTP instead of HTTPS - not secure');
    }
    
    if (compressionRatio < 20) {
      warnings.push('Short URL not much smaller than original - consider a custom alias');
    }
    
    if (config.maxClicks > 0 && config.maxClicks < 100) {
      warnings.push('Low click limit may cause link to expire quickly');
    }
    
    if (config.geoRestrictions.length > 0) {
      warnings.push('Geographic restrictions may limit accessibility');
    }

    // Generate output
    const processingTime = Date.now() - startTime;
    
    const output = `URL Shortener Result\n${'='.repeat(25)}\n\nShort URL: ${shortUrl}\nAlias: ${alias}\nDomain: ${domain}\n\nOriginal URL Analysis:\n• Length: ${metadata.urlLength}\n• Compression: ${compressionRatio}% reduction\n• Protocol: ${metadata.protocol}\n• Domain: ${domainInfo.rootDomain}\n• Security: ${securityInfo.malwareCheck === 'safe' ? '✅ Safe' : '⚠️ Check required'}\n\nConfiguration:\n• Redirect Type: ${configuration.redirectType} (${configuration.redirectCode})\n• Preview: ${configuration.previewEnabled ? 'Enabled' : 'Disabled'}\n• Password Protected: ${configuration.passwordProtected ? 'Yes' : 'No'}\n• Analytics: ${analytics.trackingEnabled ? 'Enabled' : 'Disabled'}\n• Max Clicks: ${analytics.maxClicks || 'Unlimited'}\n• Expires: ${metadata.expiresAt ? new Date(metadata.expiresAt).toLocaleDateString() : 'Never'}\n\nTracking Features:\n• Click Tracking: ${analytics.clickTracking ? 'Enabled' : 'Disabled'}\n• Geographic Tracking: ${analytics.geoTracking ? 'Enabled' : 'Disabled'}\n• Device Tracking: ${analytics.deviceTracking ? 'Enabled' : 'Disabled'}\n• UTM Parameters: ${analytics.utmTracking ? 'Included' : 'None'}\n\n${config.description ? `Description: ${config.description}\n` : ''}${config.tags.length > 0 ? `Tags: ${config.tags.join(', ')}\n` : ''}Processing Time: ${processingTime}ms`;

    return {
      success: true,
      output,
      shortUrl: shortUrlResult,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const URL_SHORTENER_TOOL: Tool = {
  id: 'url-shortener',
  name: 'URL Shortener',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'api-tools')!,
  slug: 'url-shortener',
  icon: '🔗',
  keywords: ['url', 'shorten', 'link', 'redirect', 'analytics', 'tracking', 'custom', 'domain', 'qr'],
  seoTitle: 'URL Shortener - Create Custom Short Links with Analytics | FreeFormatHub',
  seoDescription: 'Create custom short URLs with analytics, password protection, expiration dates, and QR codes. Perfect for social media, marketing campaigns, and link management.',
  description: 'Create custom short URLs with advanced features like analytics tracking, password protection, expiration dates, geographic restrictions, and QR code generation.',

  examples: [
    {
      title: 'Basic URL Shortening',
      input: 'https://www.example.com/very/long/path/to/important/content?param1=value1&param2=value2',
      output: `URL Shortener Result
=========================

Short URL: https://short.ly/a1b2c3
Alias: a1b2c3
Domain: short.ly

Original URL Analysis:
• Length: 89 → 23 chars
• Compression: 74% reduction
• Protocol: HTTPS
• Domain: example.com
• Security: ✅ Safe

Configuration:
• Redirect Type: Temporary (302)
• Preview: Disabled
• Password Protected: No
• Analytics: Disabled`,
      description: 'Create a basic short URL with automatic alias generation'
    },
    {
      title: 'Custom Alias with Analytics',
      input: 'https://docs.example.com/api/v2/getting-started',
      output: `Short URL: https://go.link/api-docs
Alias: api-docs
Domain: go.link

Configuration:
• Redirect Type: Permanent (301)
• Preview: Enabled
• Analytics: Enabled
• Max Clicks: 1000
• Expires: Never

Tracking Features:
• Click Tracking: Enabled
• Geographic Tracking: Enabled
• UTM Parameters: Included`,
      description: 'Create a branded short URL with custom alias and comprehensive tracking'
    },
    {
      title: 'Secure Link with Restrictions',
      input: 'https://secure.example.com/private/document',
      output: `Short URL: https://tny.url/secure123
Alias: secure123
Domain: tny.url

Configuration:
• Password Protected: Yes
• Geographic Restrictions: US, CA, UK
• Device Restrictions: Desktop only
• Expires: 2024-12-31
• Max Clicks: 50

Security Features:
• Password required for access
• Geographic access control
• Click limit protection`,
      description: 'Create a secure short URL with password and access restrictions'
    }
  ],

  useCases: [
    'Social media link sharing with character limits',
    'Marketing campaign tracking and analytics',
    'Email marketing with click tracking',
    'QR code generation for print materials',
    'Branded short links for business communications',
    'Temporary links with expiration dates',
    'Geographic or device-specific targeting',
    'A/B testing with different link variations',
    'Password-protected content sharing',
    'Event registration and ticket links'
  ],

  faq: [
    {
      question: 'How long are the generated short URLs?',
      answer: 'Short URLs are typically 15-25 characters long, depending on the domain and alias. Custom aliases can be 3-20 characters long for maximum branding control.'
    },
    {
      question: 'What analytics and tracking features are available?',
      answer: 'You can track clicks, geographic location, devices, referrers, and custom UTM parameters. Set click limits, expiration dates, and view detailed statistics.'
    },
    {
      question: 'Can I use my own custom domain for short URLs?',
      answer: 'Yes, you can specify a custom domain for your short URLs. This helps with branding and trust. Make sure the domain is configured for URL redirection.'
    },
    {
      question: 'How do password-protected links work?',
      answer: 'Password-protected links require users to enter a password before being redirected to the original URL. This adds an extra layer of security for sensitive content.'
    },
    {
      question: 'What security checks are performed on URLs?',
      answer: 'The tool performs basic security checks for malware, phishing attempts, and suspicious patterns. However, always verify the safety of URLs before sharing.'
    }
  ],

  commonErrors: [
    'Invalid URL format or malformed URLs',
    'Custom alias already exists or contains invalid characters',
    'Custom domain not properly configured for redirects',
    'Password too weak for password-protected links',
    'Expiration date set in the past'
  ],

  relatedTools: ['qr-code-generator', 'url-validator', 'link-analyzer', 'utm-builder', 'base64-encoder']
};