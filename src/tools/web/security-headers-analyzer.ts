import type { Tool, ToolResult } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface SecurityHeadersConfig {
  analyzeMode: 'url' | 'headers' | 'both';
  includeRecommendations: boolean;
  includeCompliance: boolean;
  complianceStandards: string[];
  includeBestPractices: boolean;
  includeExamples: boolean;
  outputFormat: 'detailed' | 'summary' | 'json' | 'csv';
  includeScore: boolean;
  severityFilter: 'all' | 'critical' | 'high' | 'medium' | 'low';
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  analyzeMode: 'both',
  includeRecommendations: true,
  includeCompliance: true,
  complianceStandards: ['OWASP', 'NIST', 'CSP'],
  includeBestPractices: true,
  includeExamples: true,
  outputFormat: 'detailed',
  includeScore: true,
  severityFilter: 'all'
};

interface SecurityHeader {
  name: string;
  value?: string;
  present: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  purpose: string;
  recommendation: string;
  example: string;
  references: string[];
  compliance: string[];
  alternatives?: string[];
}

interface SecurityAnalysis {
  score: number;
  grade: string;
  headers: SecurityHeader[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
    implemented: number;
  };
  recommendations: string[];
  compliance: {
    standard: string;
    status: 'compliant' | 'partial' | 'non-compliant';
    missing: string[];
  }[];
}

const SECURITY_HEADERS_DATABASE: Record<string, Omit<SecurityHeader, 'value' | 'present'>> = {
  'strict-transport-security': {
    name: 'Strict-Transport-Security',
    severity: 'critical',
    description: 'Forces browsers to use HTTPS connections only',
    purpose: 'Prevents man-in-the-middle attacks and protocol downgrade attacks',
    recommendation: 'Include max-age directive with at least 31536000 seconds (1 year)',
    example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    references: ['RFC 6797', 'OWASP HSTS Guide'],
    compliance: ['OWASP', 'NIST', 'CSP'],
    alternatives: ['Expect-CT (deprecated)']
  },
  'content-security-policy': {
    name: 'Content-Security-Policy',
    severity: 'critical',
    description: 'Controls which resources the browser is allowed to load',
    purpose: 'Prevents XSS attacks, data injection, and unauthorized resource loading',
    recommendation: 'Use restrictive policy with specific sources and avoid unsafe-inline/unsafe-eval',
    example: "Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com; style-src 'self' 'unsafe-inline'",
    references: ['CSP Level 3', 'OWASP CSP Guide'],
    compliance: ['OWASP', 'CSP'],
    alternatives: ['Content-Security-Policy-Report-Only']
  },
  'x-frame-options': {
    name: 'X-Frame-Options',
    severity: 'high',
    description: 'Controls whether page can be embedded in frames/iframes',
    purpose: 'Prevents clickjacking attacks by controlling frame embedding',
    recommendation: 'Use DENY or SAMEORIGIN based on your requirements',
    example: 'X-Frame-Options: DENY',
    references: ['RFC 7034', 'OWASP Clickjacking Guide'],
    compliance: ['OWASP', 'NIST'],
    alternatives: ['frame-ancestors directive in CSP']
  },
  'x-content-type-options': {
    name: 'X-Content-Type-Options',
    severity: 'high',
    description: 'Prevents browsers from MIME type sniffing',
    purpose: 'Prevents MIME confusion attacks and unauthorized script execution',
    recommendation: 'Always set to nosniff for all responses',
    example: 'X-Content-Type-Options: nosniff',
    references: ['Microsoft Security Advisory', 'OWASP MIME Sniffing Guide'],
    compliance: ['OWASP', 'NIST']
  },
  'referrer-policy': {
    name: 'Referrer-Policy',
    severity: 'medium',
    description: 'Controls how much referrer information is sent with requests',
    purpose: 'Prevents information leakage through referrer headers',
    recommendation: 'Use strict-origin-when-cross-origin or stricter policy',
    example: 'Referrer-Policy: strict-origin-when-cross-origin',
    references: ['W3C Referrer Policy', 'OWASP Privacy Guide'],
    compliance: ['OWASP', 'Privacy Standards']
  },
  'permissions-policy': {
    name: 'Permissions-Policy',
    severity: 'medium',
    description: 'Controls which browser features can be used',
    purpose: 'Restricts access to sensitive browser APIs and features',
    recommendation: 'Disable unnecessary features like camera, microphone, geolocation',
    example: 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
    references: ['W3C Permissions Policy', 'Feature Policy Migration Guide'],
    compliance: ['Privacy Standards', 'Security Best Practices'],
    alternatives: ['Feature-Policy (deprecated)']
  },
  'x-xss-protection': {
    name: 'X-XSS-Protection',
    severity: 'low',
    description: 'Legacy XSS protection for older browsers',
    purpose: 'Enables built-in XSS filtering in older browsers',
    recommendation: 'Set to "0" (disabled) as modern CSP is more effective',
    example: 'X-XSS-Protection: 0',
    references: ['Microsoft Documentation', 'OWASP XSS Guide'],
    compliance: ['Legacy Compatibility'],
    alternatives: ['Content-Security-Policy (recommended)']
  },
  'cross-origin-opener-policy': {
    name: 'Cross-Origin-Opener-Policy',
    severity: 'medium',
    description: 'Isolates browsing context from cross-origin windows',
    purpose: 'Prevents cross-origin attacks via window references',
    recommendation: 'Use same-origin for sensitive applications',
    example: 'Cross-Origin-Opener-Policy: same-origin',
    references: ['HTML Living Standard', 'OWASP Cross-Origin Guide'],
    compliance: ['Modern Security Standards']
  },
  'cross-origin-embedder-policy': {
    name: 'Cross-Origin-Embedder-Policy',
    severity: 'medium',
    description: 'Controls loading of cross-origin resources',
    purpose: 'Enables SharedArrayBuffer and high-resolution timers safely',
    recommendation: 'Use require-corp when using SharedArrayBuffer',
    example: 'Cross-Origin-Embedder-Policy: require-corp',
    references: ['HTML Living Standard', 'Web Security Guidelines'],
    compliance: ['Modern Security Standards']
  },
  'cross-origin-resource-policy': {
    name: 'Cross-Origin-Resource-Policy',
    severity: 'medium',
    description: 'Controls which cross-origin requests can include this resource',
    purpose: 'Prevents unauthorized cross-origin resource inclusion',
    recommendation: 'Use same-origin for sensitive resources',
    example: 'Cross-Origin-Resource-Policy: same-origin',
    references: ['Fetch Living Standard', 'Cross-Origin Security Guide'],
    compliance: ['Modern Security Standards']
  },
  'expect-ct': {
    name: 'Expect-CT',
    severity: 'low',
    description: 'Certificate Transparency monitoring (deprecated)',
    purpose: 'Monitors certificate transparency compliance',
    recommendation: 'Consider removing as this header is deprecated',
    example: 'Expect-CT: max-age=86400, enforce, report-uri="https://example.com/ct-report"',
    references: ['RFC 6962', 'Certificate Transparency Guide'],
    compliance: ['Legacy TLS Security'],
    alternatives: ['Certificate Transparency in TLS certificates']
  },
  'cache-control': {
    name: 'Cache-Control',
    severity: 'medium',
    description: 'Controls caching behavior for sensitive content',
    purpose: 'Prevents caching of sensitive data',
    recommendation: 'Use no-store for sensitive pages, appropriate cache directives for others',
    example: 'Cache-Control: no-store, no-cache, must-revalidate',
    references: ['RFC 7234', 'HTTP Caching Guide'],
    compliance: ['Data Protection Standards']
  },
  'server': {
    name: 'Server',
    severity: 'low',
    description: 'Server software information disclosure',
    purpose: 'Information disclosure that may aid attackers',
    recommendation: 'Remove or use generic server identification',
    example: 'Server: nginx (remove version info)',
    references: ['HTTP/1.1 Specification', 'Information Disclosure Guide'],
    compliance: ['Security Hardening']
  }
};

function parseHeadersInput(input: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = input.trim().split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex > 0) {
      const name = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
      const value = trimmedLine.substring(colonIndex + 1).trim();
      headers[name] = value;
    }
  }
  
  return headers;
}

function analyzeSecurityHeaders(headers: Record<string, string>): SecurityAnalysis {
  const analyzedHeaders: SecurityHeader[] = [];
  let score = 0;
  const maxScore = Object.keys(SECURITY_HEADERS_DATABASE).length * 10;
  
  // Analyze each security header
  for (const [headerKey, headerData] of Object.entries(SECURITY_HEADERS_DATABASE)) {
    const present = headerKey in headers;
    const value = headers[headerKey];
    
    const header: SecurityHeader = {
      ...headerData,
      value,
      present
    };
    
    // Calculate score based on presence and correctness
    if (present) {
      let headerScore = 5; // Base score for presence
      
      // Additional score for proper configuration
      if (validateHeaderValue(headerKey, value)) {
        headerScore += 5;
      } else {
        headerScore += 2; // Partial credit for presence but poor config
      }
      
      score += headerScore;
    }
    
    analyzedHeaders.push(header);
  }
  
  // Calculate summary
  const summary = {
    critical: analyzedHeaders.filter(h => h.severity === 'critical').length,
    high: analyzedHeaders.filter(h => h.severity === 'high').length,
    medium: analyzedHeaders.filter(h => h.severity === 'medium').length,
    low: analyzedHeaders.filter(h => h.severity === 'low').length,
    total: analyzedHeaders.length,
    implemented: analyzedHeaders.filter(h => h.present).length
  };
  
  // Calculate grade
  const percentage = (score / maxScore) * 100;
  let grade: string;
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 85) grade = 'A';
  else if (percentage >= 80) grade = 'A-';
  else if (percentage >= 75) grade = 'B+';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 65) grade = 'B-';
  else if (percentage >= 60) grade = 'C+';
  else if (percentage >= 55) grade = 'C';
  else if (percentage >= 50) grade = 'C-';
  else if (percentage >= 45) grade = 'D+';
  else if (percentage >= 40) grade = 'D';
  else grade = 'F';
  
  // Generate recommendations
  const recommendations = generateRecommendations(analyzedHeaders);
  
  // Check compliance
  const compliance = checkCompliance(analyzedHeaders);
  
  return {
    score: Math.round(percentage),
    grade,
    headers: analyzedHeaders,
    summary,
    recommendations,
    compliance
  };
}

function validateHeaderValue(headerName: string, value: string): boolean {
  if (!value) return false;
  
  switch (headerName) {
    case 'strict-transport-security':
      return /max-age=\d+/.test(value) && parseInt(value.match(/max-age=(\d+)/)?.[1] || '0') >= 31536000;
    
    case 'content-security-policy':
      return value.includes('default-src') && !value.includes('unsafe-inline') && !value.includes('unsafe-eval');
    
    case 'x-frame-options':
      return ['DENY', 'SAMEORIGIN'].includes(value.toUpperCase());
    
    case 'x-content-type-options':
      return value.toLowerCase() === 'nosniff';
    
    case 'referrer-policy':
      const validPolicies = ['no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin', 'unsafe-url'];
      return validPolicies.includes(value.toLowerCase());
    
    case 'x-xss-protection':
      return value === '0'; // Modern recommendation is to disable
    
    case 'cross-origin-opener-policy':
      return ['same-origin', 'same-origin-allow-popups', 'unsafe-none'].includes(value.toLowerCase());
    
    default:
      return true; // Basic validation passed
  }
}

function generateRecommendations(headers: SecurityHeader[]): string[] {
  const recommendations: string[] = [];
  
  const missing = headers.filter(h => !h.present);
  const critical = missing.filter(h => h.severity === 'critical');
  const high = missing.filter(h => h.severity === 'high');
  
  if (critical.length > 0) {
    recommendations.push(`🚨 CRITICAL: Implement ${critical.map(h => h.name).join(', ')} immediately`);
  }
  
  if (high.length > 0) {
    recommendations.push(`⚠️ HIGH PRIORITY: Add ${high.map(h => h.name).join(', ')} headers`);
  }
  
  // Specific recommendations
  const hsts = headers.find(h => h.name === 'Strict-Transport-Security');
  if (!hsts?.present) {
    recommendations.push('🔒 Enable HSTS with at least 1-year max-age and includeSubDomains');
  }
  
  const csp = headers.find(h => h.name === 'Content-Security-Policy');
  if (!csp?.present) {
    recommendations.push('🛡️ Implement Content Security Policy to prevent XSS attacks');
  }
  
  const frameOptions = headers.find(h => h.name === 'X-Frame-Options');
  if (!frameOptions?.present) {
    recommendations.push('🖼️ Add X-Frame-Options to prevent clickjacking attacks');
  }
  
  return recommendations;
}

function checkCompliance(headers: SecurityHeader[]): Array<{standard: string, status: 'compliant' | 'partial' | 'non-compliant', missing: string[]}> {
  const compliance = [];
  
  // OWASP compliance
  const owaspHeaders = headers.filter(h => h.compliance.includes('OWASP'));
  const owaspImplemented = owaspHeaders.filter(h => h.present);
  const owaspMissing = owaspHeaders.filter(h => !h.present).map(h => h.name);
  
  let owaspStatus: 'compliant' | 'partial' | 'non-compliant';
  if (owaspMissing.length === 0) owaspStatus = 'compliant';
  else if (owaspImplemented.length > owaspHeaders.length / 2) owaspStatus = 'partial';
  else owaspStatus = 'non-compliant';
  
  compliance.push({
    standard: 'OWASP',
    status: owaspStatus,
    missing: owaspMissing
  });
  
  // NIST compliance
  const nistHeaders = headers.filter(h => h.compliance.includes('NIST'));
  const nistImplemented = nistHeaders.filter(h => h.present);
  const nistMissing = nistHeaders.filter(h => !h.present).map(h => h.name);
  
  let nistStatus: 'compliant' | 'partial' | 'non-compliant';
  if (nistMissing.length === 0) nistStatus = 'compliant';
  else if (nistImplemented.length > nistHeaders.length / 2) nistStatus = 'partial';
  else nistStatus = 'non-compliant';
  
  compliance.push({
    standard: 'NIST',
    status: nistStatus,
    missing: nistMissing
  });
  
  return compliance;
}

function formatAnalysisOutput(analysis: SecurityAnalysis, config: SecurityHeadersConfig): string {
  let output = '';
  
  if (config.outputFormat === 'json') {
    return JSON.stringify(analysis, null, 2);
  }
  
  if (config.outputFormat === 'csv') {
    output += 'Header,Present,Severity,Recommendation\n';
    for (const header of analysis.headers) {
      output += `"${header.name}",${header.present},${header.severity},"${header.recommendation}"\n`;
    }
    return output;
  }
  
  // Detailed or Summary format
  if (config.includeScore) {
    output += `# Security Headers Analysis Report\n\n`;
    output += `**Overall Score:** ${analysis.score}/100 (Grade: ${analysis.grade})\n\n`;
    
    output += `## Summary\n`;
    output += `- Total Headers Analyzed: ${analysis.summary.total}\n`;
    output += `- Headers Implemented: ${analysis.summary.implemented}\n`;
    output += `- Critical Issues: ${analysis.summary.critical - analysis.headers.filter(h => h.present && h.severity === 'critical').length}\n`;
    output += `- High Priority Issues: ${analysis.summary.high - analysis.headers.filter(h => h.present && h.severity === 'high').length}\n`;
    output += `- Medium Priority Issues: ${analysis.summary.medium - analysis.headers.filter(h => h.present && h.severity === 'medium').length}\n\n`;
  }
  
  if (config.includeRecommendations && analysis.recommendations.length > 0) {
    output += `## Priority Recommendations\n\n`;
    for (const rec of analysis.recommendations) {
      output += `- ${rec}\n`;
    }
    output += '\n';
  }
  
  if (config.includeCompliance) {
    output += `## Compliance Status\n\n`;
    for (const comp of analysis.compliance) {
      const statusEmoji = comp.status === 'compliant' ? '✅' : comp.status === 'partial' ? '⚠️' : '❌';
      output += `**${comp.standard}:** ${statusEmoji} ${comp.status.toUpperCase()}\n`;
      if (comp.missing.length > 0) {
        output += `  - Missing: ${comp.missing.join(', ')}\n`;
      }
    }
    output += '\n';
  }
  
  // Filter headers by severity
  let filteredHeaders = analysis.headers;
  if (config.severityFilter !== 'all') {
    filteredHeaders = analysis.headers.filter(h => h.severity === config.severityFilter);
  }
  
  if (config.outputFormat === 'detailed') {
    output += `## Detailed Analysis\n\n`;
    
    for (const header of filteredHeaders) {
      const statusIcon = header.present ? '✅' : '❌';
      const severityIcon = {
        critical: '🚨',
        high: '⚠️',
        medium: '📋',
        low: '💡',
        info: 'ℹ️'
      }[header.severity];
      
      output += `### ${statusIcon} ${header.name} ${severityIcon}\n\n`;
      output += `**Status:** ${header.present ? 'Present' : 'Missing'}\n`;
      output += `**Severity:** ${header.severity.toUpperCase()}\n`;
      if (header.value) {
        output += `**Current Value:** \`${header.value}\`\n`;
      }
      output += `**Purpose:** ${header.purpose}\n`;
      output += `**Recommendation:** ${header.recommendation}\n`;
      
      if (config.includeExamples) {
        output += `**Example:** \`${header.example}\`\n`;
      }
      
      if (config.includeCompliance) {
        output += `**Compliance:** ${header.compliance.join(', ')}\n`;
      }
      
      if (header.alternatives && header.alternatives.length > 0) {
        output += `**Alternatives:** ${header.alternatives.join(', ')}\n`;
      }
      
      output += '\n';
    }
  }
  
  if (config.includeBestPractices) {
    output += `## Security Best Practices\n\n`;
    output += `1. **Regular Updates:** Review and update security headers quarterly\n`;
    output += `2. **Testing:** Test headers in development environment before production\n`;
    output += `3. **Monitoring:** Set up monitoring for header changes\n`;
    output += `4. **CSP Evolution:** Start with report-only CSP, then enforce gradually\n`;
    output += `5. **HSTS Preloading:** Consider submitting domain to HSTS preload list\n`;
    output += `6. **Browser Support:** Check browser compatibility for newer headers\n`;
    output += `7. **Header Ordering:** Some headers should be set at application level, others at proxy/CDN\n\n`;
    
    output += `## Implementation Tips\n\n`;
    output += `- **Web Server:** Configure headers in nginx, Apache, or IIS\n`;
    output += `- **Application:** Set headers in Express.js, Django, Spring Boot, etc.\n`;
    output += `- **CDN/Proxy:** Configure headers in CloudFlare, AWS CloudFront, etc.\n`;
    output += `- **Testing Tools:** Use online scanners and browser dev tools to verify\n`;
  }
  
  return output;
}

export function processSecurityHeadersAnalyzer(
  input: string,
  config: SecurityHeadersConfig
): ToolResult {
  try {
    if (!input?.trim()) {
      return {
        success: false,
        error: 'Please provide headers to analyze or a URL to check'
      };
    }
    
    let headers: Record<string, string> = {};
    let urlToCheck = '';
    
    // Determine if input is URL or headers
    if (config.analyzeMode === 'url' || (config.analyzeMode === 'both' && input.trim().startsWith('http'))) {
      urlToCheck = input.trim();
      // In a real implementation, this would fetch headers from the URL
      // For now, we'll return an informative message
      return {
        success: false,
        error: 'URL analysis requires a server-side implementation. Please paste the response headers instead.',
        analysis: {
          suggestion: 'Copy the response headers from browser dev tools (Network tab) and paste them for analysis'
        }
      };
    } else {
      // Parse headers from input
      headers = parseHeadersInput(input);
    }
    
    if (Object.keys(headers).length === 0) {
      return {
        success: false,
        error: 'No valid headers found. Please provide headers in "Header-Name: value" format'
      };
    }
    
    const analysis = analyzeSecurityHeaders(headers);
    const formattedOutput = formatAnalysisOutput(analysis, config);
    
    return {
      success: true,
      result: formattedOutput,
      metadata: {
        score: analysis.score,
        grade: analysis.grade,
        headersAnalyzed: analysis.summary.total,
        headersImplemented: analysis.summary.implemented,
        criticalIssues: analysis.summary.critical - analysis.headers.filter(h => h.present && h.severity === 'critical').length,
        compliance: analysis.compliance
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze security headers'
    };
  }
}

export const SECURITY_HEADERS_ANALYZER_TOOL: Tool = {
  id: 'security-headers-analyzer',
  name: 'Security Headers Analyzer',
  description: 'Comprehensive security headers analysis with compliance checking, recommendations, and scoring for web application security hardening',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'security-headers')!,
  slug: 'security-headers-analyzer',
  icon: 'Shield',
  keywords: ['security', 'headers', 'HTTPS', 'CSP', 'HSTS', 'compliance', 'OWASP', 'web security', 'analysis'],
  seoTitle: 'Free Security Headers Analyzer Online - Check HTTP Security Headers',
  seoDescription: 'Analyze HTTP security headers with compliance checking, OWASP recommendations, and scoring. Check CSP, HSTS, X-Frame-Options and more security headers instantly.',
  tags: ['security', 'headers', 'HTTPS', 'CSP', 'HSTS', 'compliance', 'OWASP', 'web security', 'analysis'],
  complexity: 'advanced',
  showInList: true,
  shortDescription: 'Analyze HTTP security headers and get compliance recommendations',
  
  examples: [
    {
      title: 'Basic Security Headers Analysis',
      input: `Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
X-Frame-Options: DENY
X-Content-Type-Options: nosniff`,
      output: 'Detailed analysis with score, compliance status, and recommendations',
      description: 'Analyze common security headers for compliance and effectiveness'
    },
    {
      title: 'Missing Critical Headers',
      input: `Server: nginx/1.18.0
Cache-Control: public, max-age=3600
Content-Type: text/html; charset=utf-8`,
      output: 'Critical security issues identified with priority recommendations',
      description: 'Identify missing security headers and get implementation guidance'
    },
    {
      title: 'Advanced Security Configuration',
      input: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Permissions-Policy: camera=(), microphone=(), geolocation=()`,
      output: 'High security score with modern header compliance analysis',
      description: 'Analyze comprehensive security header implementation'
    }
  ],

  useCases: [
    'Security auditing of web applications and APIs',
    'Compliance checking against OWASP and NIST standards',
    'Penetration testing and vulnerability assessment',
    'Security header implementation planning and validation',
    'DevOps security pipeline integration and monitoring',
    'Client security reviews and consultant reporting',
    'Educational security training and best practices',
    'Incident response and security posture assessment'
  ],

  faq: [
    {
      question: 'Which security headers are most critical to implement?',
      answer: 'The most critical headers are Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and X-Frame-Options. These prevent major attack vectors like man-in-the-middle attacks, XSS, and clickjacking.'
    },
    {
      question: 'How do I implement these headers in my web server?',
      answer: 'Headers can be set at multiple levels: web server (nginx, Apache), application framework (Express.js, Django), or CDN/proxy (CloudFlare, AWS). The tool provides specific examples for each header.'
    },
    {
      question: 'What is a good security score to aim for?',
      answer: 'Aim for a score of 85+ (Grade A-) for production applications. Critical applications should target 90+ (Grade A+). The score considers both header presence and proper configuration.'
    },
    {
      question: 'How often should I review security headers?',
      answer: 'Review security headers quarterly or after major application changes. Subscribe to security bulletins for new header recommendations and browser updates that might affect your configuration.'
    },
    {
      question: 'Can security headers break my application?',
      answer: 'Yes, particularly CSP and frame-related headers. Always test in a development environment first. Start with CSP in report-only mode to identify issues before enforcing.'
    }
  ],

  commonErrors: [
    'Setting CSP too restrictively causing application functionality to break',
    'Using X-XSS-Protection: 1 instead of disabling it (modern recommendation)',
    'HSTS max-age too short (should be at least 1 year)',
    'Missing includeSubDomains in HSTS for comprehensive protection',
    'Combining conflicting headers like X-Frame-Options and CSP frame-ancestors',
    'Not testing headers across different browsers and devices'
  ],

  relatedTools: ['api-request-builder', 'certificate-decoder', 'dns-lookup', 'url-validator', 'performance-budget-calculator']
};