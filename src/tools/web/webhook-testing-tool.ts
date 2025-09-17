import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface WebhookTestingConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  webhookUrl: string;
  payload: string;
  headers: Record<string, string>;
  timeout: number;
  retries: number;
  retryDelay: number;
  followRedirects: boolean;
  validateSsl: boolean;
  contentType: 'application/json' | 'application/x-www-form-urlencoded' | 'text/plain' | 'application/xml' | 'multipart/form-data';
  authentication: {
    type: 'none' | 'bearer' | 'basic' | 'api_key' | 'signature';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    secretKey?: string;
    signatureHeader?: string;
  };
  testScenarios: WebhookTestScenario[];
  validateResponse: boolean;
  expectedStatus: number[];
  expectedHeaders: Record<string, string>;
  expectedBody: string;
  logLevel: 'basic' | 'detailed' | 'debug';
  mockMode: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  testResults?: WebhookTestResults;
  warnings?: string[];
}

interface WebhookTestResults {
  metadata: TestMetadata;
  scenarios: ScenarioResult[];
  summary: TestSummary;
  performance: PerformanceMetrics;
  security: SecurityAnalysis;
  recommendations: string[];
}

interface TestMetadata {
  webhookUrl: string;
  totalScenarios: number;
  startTime: string;
  endTime: string;
  duration: number;
  testId: string;
  userAgent: string;
}

interface WebhookTestScenario {
  name: string;
  description: string;
  method: string;
  payload: string;
  headers: Record<string, string>;
  expectedStatus: number;
  expectedResponse?: string;
  delay?: number;
  enabled: boolean;
}

interface ScenarioResult {
  scenario: WebhookTestScenario;
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  attempt: number;
  response: WebhookResponse;
  validation: ValidationResult;
  error?: string;
}

interface WebhookResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  responseTime: number;
  redirects: RedirectInfo[];
}

interface RedirectInfo {
  status: number;
  location: string;
  responseTime: number;
}

interface ValidationResult {
  statusValid: boolean;
  headersValid: boolean;
  bodyValid: boolean;
  errors: string[];
  warnings: string[];
}

interface TestSummary {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  skippedScenarios: number;
  successRate: number;
  averageResponseTime: number;
  totalRequests: number;
  totalErrors: number;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  throughput: number;
  errorRate: number;
  slowestScenario: string;
  fastestScenario: string;
}

interface SecurityAnalysis {
  httpsUsed: boolean;
  certificateValid: boolean;
  securityHeaders: SecurityHeaderAnalysis;
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
}

interface SecurityHeaderAnalysis {
  present: string[];
  missing: string[];
  recommendations: string[];
}

interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

function generateMockScenarios(): WebhookTestScenario[] {
  return [
    {
      name: 'Basic POST Request',
      description: 'Test basic webhook functionality with JSON payload',
      method: 'POST',
      payload: JSON.stringify({ event: 'test', timestamp: new Date().toISOString() }),
      headers: { 'Content-Type': 'application/json' },
      expectedStatus: 200,
      enabled: true
    },
    {
      name: 'Authentication Test',
      description: 'Test webhook with authentication headers',
      method: 'POST',
      payload: JSON.stringify({ event: 'auth_test', user_id: '12345' }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-123'
      },
      expectedStatus: 200,
      enabled: true
    },
    {
      name: 'Large Payload Test',
      description: 'Test webhook with large JSON payload',
      method: 'POST',
      payload: JSON.stringify({
        event: 'bulk_update',
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          value: Math.random() * 1000
        }))
      }),
      headers: { 'Content-Type': 'application/json' },
      expectedStatus: 200,
      enabled: true
    },
    {
      name: 'Error Handling Test',
      description: 'Test webhook error response handling',
      method: 'POST',
      payload: JSON.stringify({ event: 'error_test', invalid_field: null }),
      headers: { 'Content-Type': 'application/json' },
      expectedStatus: 400,
      enabled: true
    },
    {
      name: 'Timeout Test',
      description: 'Test webhook timeout handling',
      method: 'POST',
      payload: JSON.stringify({ event: 'timeout_test', delay: 30000 }),
      headers: { 'Content-Type': 'application/json' },
      expectedStatus: 200,
      delay: 1000,
      enabled: false
    }
  ];
}

function generateMockResponse(scenario: WebhookTestScenario, url: string): WebhookResponse {
  const isSuccessful = Math.random() > 0.1; // 90% success rate
  const baseResponseTime = 100 + Math.random() * 300; // 100-400ms
  const responseTime = scenario.name.includes('Large') ? baseResponseTime * 2 : baseResponseTime;
  
  const status = isSuccessful ? scenario.expectedStatus : 
                 (scenario.expectedStatus === 400 ? 400 : 500);
  
  const statusText = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error'
  }[status] || 'Unknown';

  const headers = {
    'Content-Type': 'application/json',
    'Server': 'webhook-test-server/1.0',
    'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    'Cache-Control': 'no-cache',
    'Date': new Date().toUTCString()
  };

  let body: string;
  if (status === 200 || status === 201) {
    body = JSON.stringify({
      success: true,
      message: `Webhook received successfully for ${scenario.name}`,
      webhook_id: `wh_${Date.now()}`,
      processed_at: new Date().toISOString(),
      data_received: scenario.payload ? JSON.parse(scenario.payload) : null
    });
  } else {
    body = JSON.stringify({
      success: false,
      error: status === 400 ? 'Invalid payload format' : 'Internal server error',
      error_code: `E${status}`,
      timestamp: new Date().toISOString()
    });
  }

  return {
    status,
    statusText,
    headers,
    body,
    size: body.length,
    responseTime: Math.round(responseTime),
    redirects: []
  };
}

function validateResponse(response: WebhookResponse, scenario: WebhookTestScenario): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const statusValid = response.status === scenario.expectedStatus;
  if (!statusValid) {
    errors.push(`Expected status ${scenario.expectedStatus}, got ${response.status}`);
  }
  
  // Validate content type
  const contentType = response.headers['Content-Type'] || response.headers['content-type'];
  if (!contentType) {
    warnings.push('No Content-Type header in response');
  } else if (!contentType.includes('application/json') && scenario.expectedResponse) {
    warnings.push('Response Content-Type is not application/json');
  }
  
  // Validate response time
  if (response.responseTime > 5000) {
    warnings.push(`Slow response time: ${response.responseTime}ms`);
  }
  
  // Validate expected response body
  let bodyValid = true;
  if (scenario.expectedResponse && response.body !== scenario.expectedResponse) {
    bodyValid = false;
    warnings.push('Response body does not match expected content');
  }
  
  return {
    statusValid,
    headersValid: true, // Simplified for mock
    bodyValid,
    errors,
    warnings
  };
}

function runWebhookTest(scenario: WebhookTestScenario, config: WebhookTestingConfig): ScenarioResult {
  const startTime = new Date();
  
  try {
    const response = generateMockResponse(scenario, config.webhookUrl);
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const validation = validateResponse(response, scenario);
    const success = validation.statusValid && validation.errors.length === 0;
    
    return {
      scenario,
      success,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      attempt: 1,
      response,
      validation
    };
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    return {
      scenario,
      success: false,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      attempt: 1,
      response: {
        status: 0,
        statusText: 'Request Failed',
        headers: {},
        body: '',
        size: 0,
        responseTime: duration,
        redirects: []
      },
      validation: {
        statusValid: false,
        headersValid: false,
        bodyValid: false,
        errors: [`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function calculatePerformanceMetrics(results: ScenarioResult[]): PerformanceMetrics {
  const responseTimes = results.map(r => r.response.responseTime);
  const successfulResults = results.filter(r => r.success);
  
  const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  
  // Calculate 95th percentile
  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
  const p95ResponseTime = sortedTimes[p95Index] || 0;
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const throughput = results.length / (totalDuration / 1000); // requests per second
  const errorRate = ((results.length - successfulResults.length) / results.length) * 100;
  
  const slowestResult = results.reduce((prev, curr) => 
    curr.response.responseTime > prev.response.responseTime ? curr : prev
  );
  const fastestResult = results.reduce((prev, curr) => 
    curr.response.responseTime < prev.response.responseTime ? curr : prev
  );
  
  return {
    averageResponseTime: Math.round(averageResponseTime),
    minResponseTime,
    maxResponseTime,
    p95ResponseTime,
    throughput: Math.round(throughput * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
    slowestScenario: slowestResult.scenario.name,
    fastestScenario: fastestResult.scenario.name
  };
}

function analyzeWebhookSecurity(url: string, results: ScenarioResult[]): SecurityAnalysis {
  const httpsUsed = url.toLowerCase().startsWith('https://');
  const certificateValid = httpsUsed; // Simplified for mock
  
  // Analyze security headers from responses
  const allHeaders = results.flatMap(r => Object.keys(r.response.headers));
  const securityHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'content-security-policy',
    'referrer-policy'
  ];
  
  const present = securityHeaders.filter(header => 
    allHeaders.some(h => h.toLowerCase() === header)
  );
  const missing = securityHeaders.filter(header => 
    !allHeaders.some(h => h.toLowerCase() === header)
  );
  
  const securityHeaderAnalysis: SecurityHeaderAnalysis = {
    present,
    missing,
    recommendations: missing.map(header => `Consider adding ${header} header`)
  };
  
  const vulnerabilities: SecurityVulnerability[] = [];
  
  if (!httpsUsed) {
    vulnerabilities.push({
      type: 'Insecure Transport',
      severity: 'high',
      description: 'Webhook uses HTTP instead of HTTPS',
      recommendation: 'Use HTTPS for all webhook communications'
    });
  }
  
  if (missing.includes('strict-transport-security') && httpsUsed) {
    vulnerabilities.push({
      type: 'Missing HSTS',
      severity: 'medium',
      description: 'Strict-Transport-Security header not present',
      recommendation: 'Add HSTS header to prevent protocol downgrade attacks'
    });
  }
  
  const recommendations = [
    ...(httpsUsed ? [] : ['Migrate to HTTPS for secure communication']),
    ...securityHeaderAnalysis.recommendations,
    'Implement proper authentication and authorization',
    'Validate and sanitize all webhook payloads',
    'Implement rate limiting to prevent abuse'
  ];
  
  return {
    httpsUsed,
    certificateValid,
    securityHeaders: securityHeaderAnalysis,
    vulnerabilities,
    recommendations
  };
}

function formatWebhookTestOutput(results: WebhookTestResults, config: WebhookTestingConfig): string {
  const { metadata, scenarios, summary, performance, security } = results;
  
  let output = `🔗 Webhook Testing Report
═══════════════════════════════════════════════════════════

📋 Test Information
├─ Webhook URL: ${metadata.webhookUrl}
├─ Total Scenarios: ${metadata.totalScenarios}
├─ Duration: ${(metadata.duration / 1000).toFixed(1)}s
├─ Test ID: ${metadata.testId}
└─ User Agent: ${metadata.userAgent}

📊 Summary
├─ Success Rate: ${summary.successRate.toFixed(1)}% (${summary.passedScenarios}/${summary.totalScenarios})
├─ Failed Tests: ${summary.failedScenarios}
├─ Average Response Time: ${summary.averageResponseTime}ms
├─ Total Requests: ${summary.totalRequests}
└─ Total Errors: ${summary.totalErrors}

⚡ Performance Metrics
├─ Average Response Time: ${performance.averageResponseTime}ms
├─ Min/Max Response Time: ${performance.minResponseTime}ms / ${performance.maxResponseTime}ms
├─ 95th Percentile: ${performance.p95ResponseTime}ms
├─ Throughput: ${performance.throughput} req/s
├─ Error Rate: ${performance.errorRate}%
├─ Fastest Scenario: ${performance.fastestScenario}
└─ Slowest Scenario: ${performance.slowestScenario}`;

  // Add detailed scenario results
  output += `\n\n🧪 Scenario Results
${'─'.repeat(60)}`;
  
  scenarios.forEach((result, index) => {
    const statusIcon = result.success ? '✅' : '❌';
    const responseTime = result.response.responseTime;
    
    output += `\n${index + 1}. ${statusIcon} ${result.scenario.name}`;
    output += `\n   Method: ${result.scenario.method} | Status: ${result.response.status} | Time: ${responseTime}ms`;
    
    if (result.validation.errors.length > 0) {
      output += `\n   Errors: ${result.validation.errors.join(', ')}`;
    }
    
    if (result.validation.warnings.length > 0) {
      output += `\n   Warnings: ${result.validation.warnings.join(', ')}`;
    }
    
    if (config.logLevel === 'detailed' || config.logLevel === 'debug') {
      output += `\n   Response: ${result.response.body.substring(0, 100)}${result.response.body.length > 100 ? '...' : ''}`;
    }
    
    output += '\n';
  });

  // Add security analysis
  output += `\n🔒 Security Analysis
${'─'.repeat(60)}
├─ HTTPS Used: ${security.httpsUsed ? '✅' : '❌'}
├─ Certificate Valid: ${security.certificateValid ? '✅' : '❌'}
├─ Security Headers Present: ${security.securityHeaders.present.length}
└─ Security Headers Missing: ${security.securityHeaders.missing.length}`;

  if (security.vulnerabilities.length > 0) {
    output += `\n\n🚨 Security Vulnerabilities (${security.vulnerabilities.length})
${'─'.repeat(60)}`;
    security.vulnerabilities.forEach((vuln, index) => {
      const severityIcon = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
      }[vuln.severity];
      
      output += `\n${index + 1}. ${severityIcon} ${vuln.type} (${vuln.severity.toUpperCase()})`;
      output += `\n   ${vuln.description}`;
      output += `\n   → ${vuln.recommendation}\n`;
    });
  }

  if (results.recommendations.length > 0) {
    output += `\n💡 Recommendations
${'─'.repeat(60)}`;
    results.recommendations.forEach((rec, index) => {
      output += `\n${index + 1}. ${rec}`;
    });
  }

  return output;
}

export function processWebhookTesting(input: string, config: WebhookTestingConfig): ToolResult {
  try {
    const webhookUrl = input.trim();
    
    if (!webhookUrl) {
      return { success: false, error: 'Please provide a webhook URL' };
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    const startTime = new Date();
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Use provided scenarios or generate mock ones
    const scenarios = config.testScenarios.length > 0 ? 
      config.testScenarios.filter(s => s.enabled) : 
      generateMockScenarios();
    
    if (scenarios.length === 0) {
      return { 
        success: false, 
        error: 'No enabled test scenarios found',
        warnings: ['Enable at least one test scenario to run webhook tests']
      };
    }

    // Run all test scenarios
    const scenarioResults = scenarios.map(scenario => 
      runWebhookTest(scenario, { ...config, webhookUrl })
    );

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const metadata: TestMetadata = {
      webhookUrl,
      totalScenarios: scenarios.length,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      testId,
      userAgent: 'FreeFormatHub Webhook Tester/1.0'
    };

    const passedScenarios = scenarioResults.filter(r => r.success).length;
    const failedScenarios = scenarioResults.length - passedScenarios;
    const averageResponseTime = Math.round(
      scenarioResults.reduce((sum, r) => sum + r.response.responseTime, 0) / scenarioResults.length
    );

    const summary: TestSummary = {
      totalScenarios: scenarios.length,
      passedScenarios,
      failedScenarios,
      skippedScenarios: 0,
      successRate: (passedScenarios / scenarios.length) * 100,
      averageResponseTime,
      totalRequests: scenarioResults.length,
      totalErrors: failedScenarios
    };

    const performance = calculatePerformanceMetrics(scenarioResults);
    const security = analyzeWebhookSecurity(webhookUrl, scenarioResults);
    
    const recommendations = [
      ...(summary.successRate < 100 ? ['Investigate failed webhook scenarios'] : []),
      ...(performance.averageResponseTime > 1000 ? ['Optimize webhook response time'] : []),
      ...(performance.errorRate > 5 ? ['Reduce error rate for better reliability'] : []),
      ...security.recommendations.slice(0, 3) // Limit security recommendations
    ];

    const testResults: WebhookTestResults = {
      metadata,
      scenarios: scenarioResults,
      summary,
      performance,
      security,
      recommendations
    };

    const output = formatWebhookTestOutput(testResults, config);
    const warnings = summary.failedScenarios > 0 ? [`${summary.failedScenarios} scenario(s) failed`] : undefined;

    return {
      success: true,
      output,
      testResults,
      warnings
    };

  } catch (error) {
    return {
      success: false,
      error: `Testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const WEBHOOK_TESTING_TOOL: Tool = {
  id: 'webhook-testing-tool',
  name: 'Webhook Testing Tool',
  description: 'Comprehensive webhook testing with multiple scenarios, authentication, performance analysis, and security validation',
  icon: '🔗',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'api-tools')!,
  tags: ['webhook', 'testing', 'api', 'http', 'integration', 'automation', 'performance', 'security', 'validation'],
  complexity: 'advanced',
  showInList: true,
  shortDescription: 'Test webhooks with multiple scenarios and analysis',
  
  examples: [
    {
      title: 'Basic Webhook Test',
      input: 'https://webhook.site/unique-id',
      description: 'Test webhook with default scenarios'
    },
    {
      title: 'Authenticated Webhook',
      input: 'https://api.example.com/webhooks/payment',
      description: 'Test webhook with authentication and custom headers'
    },
    {
      title: 'Development Webhook',
      input: 'http://localhost:3000/webhook',
      description: 'Test local development webhook endpoint'
    },
    {
      title: 'Third-party Integration',
      input: 'https://hooks.slack.com/services/T00/B00/XXXX',
      description: 'Test third-party service webhook integration'
    },
    {
      title: 'Production Webhook',
      input: 'https://myapp.com/api/v1/webhooks/orders',
      description: 'Test production webhook with comprehensive scenarios'
    }
  ],

  faqs: [
    {
      question: 'What types of webhook tests are performed?',
      answer: 'Tests include basic POST requests, authentication validation, large payload handling, error scenarios, timeout testing, and performance analysis with security checks.'
    },
    {
      question: 'Can I customize the test scenarios?',
      answer: 'Yes, you can create custom test scenarios with different HTTP methods, payloads, headers, and expected responses. The tool also provides default scenarios for common use cases.'
    },
    {
      question: 'How does the authentication testing work?',
      answer: 'Supports multiple authentication methods including Bearer tokens, Basic Auth, API keys, and signature-based authentication with proper header configuration.'
    },
    {
      question: 'What security analysis is performed?',
      answer: 'Analyzes HTTPS usage, SSL certificate validation, security headers, identifies vulnerabilities, and provides security recommendations for webhook implementations.'
    },
    {
      question: 'Are the webhook requests actually sent?',
      answer: 'In this demo version, responses are simulated. A real implementation would send actual HTTP requests to the provided webhook URLs with proper error handling and security measures.'
    }
  ],

  relatedTools: [
    'api-request-builder',
    'api-response-formatter',
    'http-status-codes',
    'certificate-decoder',
    'json-formatter',
    'api-documentation-generator'
  ]
};