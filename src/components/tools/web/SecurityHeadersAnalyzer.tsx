import { useState, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processSecurityHeadersAnalyzer, type SecurityHeadersConfig } from '../../../tools/web/security-headers-analyzer';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface SecurityHeadersAnalyzerProps {
  className?: string;
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

const OPTIONS = [
  {
    key: 'analyzeMode',
    label: 'Analysis Mode',
    type: 'select' as const,
    default: 'both',
    options: [
      { value: 'headers', label: '📋 Headers Only - Analyze pasted headers' },
      { value: 'url', label: '🌐 URL Only - Fetch and analyze headers' },
      { value: 'both', label: '🔄 Both - Auto-detect input type' }
    ],
    description: 'Choose input type for analysis'
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: '📖 Detailed - Full analysis with explanations' },
      { value: 'summary', label: '📋 Summary - Key findings only' },
      { value: 'json', label: '🔧 JSON - Structured data format' },
      { value: 'csv', label: '📊 CSV - Spreadsheet format' }
    ],
    description: 'Choose output format for analysis results'
  },
  {
    key: 'severityFilter',
    label: 'Severity Filter',
    type: 'select' as const,
    default: 'all',
    options: [
      { value: 'all', label: '🔍 All - Show all severity levels' },
      { value: 'critical', label: '🚨 Critical - Critical issues only' },
      { value: 'high', label: '⚠️ High - High priority issues' },
      { value: 'medium', label: '📋 Medium - Medium priority issues' },
      { value: 'low', label: '💡 Low - Low priority issues' }
    ],
    description: 'Filter results by issue severity'
  },
  {
    key: 'includeScore',
    label: 'Include Security Score',
    type: 'boolean' as const,
    default: true,
    description: 'Show overall security score and grade'
  },
  {
    key: 'includeRecommendations',
    label: 'Include Recommendations',
    type: 'boolean' as const,
    default: true,
    description: 'Provide specific implementation recommendations'
  },
  {
    key: 'includeCompliance',
    label: 'Include Compliance Check',
    type: 'boolean' as const,
    default: true,
    description: 'Check against security standards and frameworks'
  },
  {
    key: 'complianceStandards',
    label: 'Compliance Standards',
    type: 'text' as const,
    default: 'OWASP,NIST,CSP',
    description: 'Comma-separated list of standards to check against',
    showWhen: (config: SecurityHeadersConfig) => config.includeCompliance
  },
  {
    key: 'includeBestPractices',
    label: 'Include Best Practices',
    type: 'boolean' as const,
    default: true,
    description: 'Include security best practices and implementation tips'
  },
  {
    key: 'includeExamples',
    label: 'Include Examples',
    type: 'boolean' as const,
    default: true,
    description: 'Show example header configurations'
  }
];

const SAMPLE_HEADERS = {
  basic: `Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin`,

  advanced: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
X-XSS-Protection: 0`,

  minimal: `Server: nginx/1.18.0
Content-Type: text/html; charset=utf-8
Cache-Control: public, max-age=3600
Set-Cookie: sessionid=abc123; Path=/`,

  ecommerce: `Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' https://js.stripe.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self)`
};

export function SecurityHeadersAnalyzer({ className = '' }: SecurityHeadersAnalyzerProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<SecurityHeadersConfig>(DEFAULT_CONFIG);
  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: SecurityHeadersConfig) => {
      if (inputText.trim()) {
        const result = processSecurityHeadersAnalyzer(inputText, cfg);
        if (result.success && result.result) {
          addToHistory('security-headers-analyzer', {
            input: inputText,
            output: result.result,
            config: cfg
          });
        }
      }
    }, 300),
    [addToHistory]
  );

  const result = useMemo(() => {
    if (!input.trim()) {
      return { success: false, error: 'Please provide headers to analyze or a URL to check' };
    }
    return processSecurityHeadersAnalyzer(input, config);
  }, [input, config]);

  const handleInputChange = (value: string) => {
    setInput(value);
    debouncedProcess(value, config);
  };

  const handleConfigChange = (newConfig: SecurityHeadersConfig) => {
    setConfig(newConfig);
    debouncedProcess(input, newConfig);
  };

  const loadSample = (sampleKey: keyof typeof SAMPLE_HEADERS) => {
    const sampleData = SAMPLE_HEADERS[sampleKey];
    setInput(sampleData);
    debouncedProcess(sampleData, config);
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    if (grade.startsWith('D')) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Analysis Status */}
        {result.success && result.metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Security Analysis</h3>
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className={`text-2xl font-bold ${getGradeColor(result.metadata.grade)}`}>
                Grade: {result.metadata.grade}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Score: {result.metadata.score}/100
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {result.metadata.headersImplemented}/{result.metadata.headersAnalyzed} headers implemented
                {result.metadata.criticalIssues > 0 && (
                  <span className="text-red-600 dark:text-red-400 ml-2">
                    • {result.metadata.criticalIssues} critical issues
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sample Headers */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sample Headers</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => loadSample('basic')}
              className="p-2 text-left text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border"
            >
              🛡️ <strong>Basic Security</strong><br/>
              Essential headers for standard protection
            </button>
            <button
              onClick={() => loadSample('advanced')}
              className="p-2 text-left text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border"
            >
              🚀 <strong>Advanced Security</strong><br/>
              Comprehensive modern header set
            </button>
            <button
              onClick={() => loadSample('ecommerce')}
              className="p-2 text-left text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border"
            >
              🛒 <strong>E-commerce</strong><br/>
              Headers for payment processing sites
            </button>
            <button
              onClick={() => loadSample('minimal')}
              className="p-2 text-left text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border"
            >
              ⚠️ <strong>Minimal (Insecure)</strong><br/>
              Example of missing security headers
            </button>
          </div>
        </div>

        {/* Security Standards */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Security Standards</h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <strong>OWASP:</strong> Open Web Application Security Project guidelines
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <strong>NIST:</strong> National Institute of Standards and Technology
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <strong>CSP:</strong> Content Security Policy best practices
            </div>
          </div>
        </div>

        {/* Header Input Guide */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Input Format</h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>• Paste response headers from browser dev tools</div>
            <div>• Format: "Header-Name: value"</div>
            <div>• One header per line</div>
            <div>• Comments start with #</div>
          </div>
        </div>

        <OptionsPanel 
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="HTTP Response Headers"
          subtitle="Paste response headers from browser dev tools (Network tab → Response Headers)"
          value={input}
          onChange={handleInputChange}
          placeholder={`# Paste your HTTP response headers here
# Example:
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff

# Or provide a URL to analyze (server-side required):
# https://example.com`}
          maxLength={10000}
          language="http"
          showLineNumbers={true}
        />

        <OutputPanel
          title="Security Analysis Report"
          subtitle={result.success ? 
            `Security analysis with recommendations and compliance check` :
            'Analysis will appear here'
          }
          value={result.success ? result.result || '' : ''}
          error={!result.success ? result.error : undefined}
          language={config.outputFormat === 'json' ? 'json' : config.outputFormat === 'csv' ? 'csv' : 'markdown'}
          maxHeight="600px"
          actions={
            result.success && result.result ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const extension = config.outputFormat === 'json' ? '.json' : 
                                    config.outputFormat === 'csv' ? '.csv' : '.md';
                    const filename = `security-headers-analysis${extension}`;
                    const blob = new Blob([result.result || ''], { 
                      type: config.outputFormat === 'json' ? 'application/json' :
                            config.outputFormat === 'csv' ? 'text/csv' : 'text/markdown'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📄 Download Report
                </button>
                {result.metadata?.grade && (
                  <div className={`px-3 py-1 text-xs rounded ${
                    result.metadata.grade.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    result.metadata.grade.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    result.metadata.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    result.metadata.grade.startsWith('D') ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {result.metadata.grade} Grade
                  </div>
                )}
                <button
                  onClick={() => setInput('')}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  🔄 Clear
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}