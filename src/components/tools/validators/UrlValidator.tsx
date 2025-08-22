import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processUrlValidator, type UrlValidatorConfig } from '../../../tools/validators/url-validator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface UrlValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: UrlValidatorConfig = {
  validateSyntax: true,
  validateScheme: true,
  validateDomain: true,
  allowLocalhost: true,
  allowIpAddress: true,
  allowNonStandardPorts: true,
  requireTld: true,
  checkPathSafety: true,
  maxLength: 2048,
  allowedSchemes: [],
  strictMode: false,
  validateEncoding: true,
  checkSecurity: true,
  detectRedirects: false,
  validateAnchor: true,
};

const VALIDATION_OPTIONS = [
  {
    key: 'validateSyntax',
    label: 'Validate Syntax',
    type: 'checkbox' as const,
    default: true,
    description: 'Check URL structure and format',
  },
  {
    key: 'validateScheme',
    label: 'Validate Scheme',
    type: 'checkbox' as const,
    default: true,
    description: 'Verify URL scheme (http, https, etc.)',
  },
  {
    key: 'validateDomain',
    label: 'Validate Domain',
    type: 'checkbox' as const,
    default: true,
    description: 'Check domain name validity',
  },
  {
    key: 'checkPathSafety',
    label: 'Check Path Safety',
    type: 'checkbox' as const,
    default: true,
    description: 'Scan for dangerous path patterns',
  },
  {
    key: 'validateEncoding',
    label: 'Validate Encoding',
    type: 'checkbox' as const,
    default: true,
    description: 'Check URL encoding and special characters',
  },
  {
    key: 'checkSecurity',
    label: 'Security Analysis',
    type: 'checkbox' as const,
    default: true,
    description: 'Analyze URL for security risks',
  },
] as const;

const DOMAIN_OPTIONS = [
  {
    key: 'allowLocalhost',
    label: 'Allow Localhost',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept localhost and local development URLs',
  },
  {
    key: 'allowIpAddress',
    label: 'Allow IP Addresses',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept IP addresses instead of domain names',
  },
  {
    key: 'requireTld',
    label: 'Require TLD',
    type: 'checkbox' as const,
    default: true,
    description: 'Domain must have top-level domain (.com, .org, etc.)',
  },
  {
    key: 'allowNonStandardPorts',
    label: 'Allow Non-Standard Ports',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept URLs with custom port numbers',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Fail validation if any check fails',
  },
  {
    key: 'maxLength',
    label: 'Max URL Length',
    type: 'number' as const,
    default: 2048,
    min: 0,
    max: 10000,
    description: 'Maximum allowed URL length (0 = unlimited)',
  },
] as const;

export function UrlValidator({ className = '' }: UrlValidatorProps) {
  const [input, setInput] = useState('https://www.example.com/path/to/page?param=value&foo=bar#section');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<UrlValidatorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: UrlValidatorConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processUrlValidator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setValidation(result.validation);
          setAnalysis(result.analysis);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'url-validator',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.validation?.isValid ? 'VALID' : 'INVALID',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to validate URL');
          setOutput('');
          setValidation(null);
          setAnalysis(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during URL validation');
        setOutput('');
        setValidation(null);
        setAnalysis(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('url-validator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'https' | 'api' | 'localhost' | 'ip' | 'dangerous' | 'malformed' | 'long') => {
    const examples = {
      https: 'https://www.example.com/secure/path?token=abc123&user=john#results',
      api: 'https://api.github.com/v3/repos/user/repo/issues?state=open&sort=created',
      localhost: 'http://localhost:3000/dev/dashboard?debug=true',
      ip: 'http://192.168.1.100:8080/admin/config.php',
      dangerous: 'javascript:alert("XSS")',
      malformed: 'ht!tp://bad..domain.com/path with spaces',
      long: 'https://very-long-domain-name-for-testing-purposes.example.com/extremely/long/path/with/many/segments/to/test/length/validation?param1=value1&param2=very-long-parameter-value-for-testing&param3=another-long-value&param4=more-data&param5=additional-information&param6=extra-details&param7=supplementary-info&param8=bonus-content&param9=extended-data&param10=comprehensive-details#very-long-fragment-identifier-for-testing-purposes',
    };
    
    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...VALIDATION_OPTIONS,
    ...DOMAIN_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  // Security level colors
  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-800 bg-green-100';
      case 'medium': return 'text-blue-800 bg-blue-100';
      case 'low': return 'text-yellow-800 bg-yellow-100';
      case 'dangerous': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'high': return '🔒';
      case 'medium': return '🔓';
      case 'low': return '⚠️';
      case 'dangerous': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* URL Security Status */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Security Status</h3>
            <div className={`p-4 rounded-lg border-2 ${getSecurityColor(validation.securityLevel)}`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getSecurityIcon(validation.securityLevel)}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {validation.securityLevel.toUpperCase()} Security
                  </div>
                  <div className="text-xs opacity-80">
                    {validation.scheme.toUpperCase()} Protocol
                  </div>
                </div>
                <div className="ml-auto">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    validation.isValid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {validation.isValid ? '✅ VALID' : '❌ INVALID'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Test URLs */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Test URLs</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('https')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              🔒 HTTPS Website
            </button>
            <button
              onClick={() => handleQuickExample('api')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🔗 API Endpoint
            </button>
            <button
              onClick={() => handleQuickExample('localhost')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              🏠 Localhost
            </button>
            <button
              onClick={() => handleQuickExample('ip')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              🌐 IP Address
            </button>
            <button
              onClick={() => handleQuickExample('dangerous')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-left"
            >
              🚨 Dangerous URL
            </button>
            <button
              onClick={() => handleQuickExample('malformed')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-left"
            >
              ❌ Malformed URL
            </button>
            <button
              onClick={() => handleQuickExample('long')}
              className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-left"
            >
              📏 Long URL Test
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Validation Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Validation Results Summary */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Validation Results</h3>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.syntaxValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Syntax:</span>
                <span className={validation.syntaxValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.syntaxValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.schemeValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Scheme:</span>
                <span className={validation.schemeValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.schemeValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.domainValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Domain:</span>
                <span className={validation.domainValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.domainValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.pathValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Path:</span>
                <span className={validation.pathValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.pathValid ? '✅ Safe' : '❌ Unsafe'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.encodingValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Encoding:</span>
                <span className={validation.encodingValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.encodingValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.lengthValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Length:</span>
                <span className={validation.lengthValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.lengthValid ? '✅ Valid' : '❌ Too Long'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* URL Components */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">URL Components</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheme:</span>
                  <span className="text-gray-800 font-medium font-mono">{validation.scheme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hostname:</span>
                  <span className="text-gray-800 font-medium font-mono text-xs truncate max-w-32">
                    {validation.hostname}
                  </span>
                </div>
                {validation.port && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Port:</span>
                    <span className="text-gray-800 font-medium font-mono">{validation.port}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Path:</span>
                  <span className="text-gray-800 font-medium font-mono text-xs truncate max-w-32">
                    {validation.pathname || '/'}
                  </span>
                </div>
                {validation.search && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Query:</span>
                    <span className="text-gray-800 font-medium font-mono text-xs truncate max-w-32">
                      {validation.search}
                    </span>
                  </div>
                )}
                {validation.hash && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fragment:</span>
                    <span className="text-gray-800 font-medium font-mono text-xs truncate max-w-32">
                      {validation.hash}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* URL Analysis */}
        {analysis && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">URL Analysis</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-600">Type:</span>
                  <span className="text-blue-800 font-medium uppercase">{analysis.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Secure:</span>
                  <span className={analysis.isSecure ? 'text-green-800' : 'text-red-800'}>
                    {analysis.isSecure ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Parameters:</span>
                  <span className="text-blue-800 font-medium">{analysis.paramCount || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Path Depth:</span>
                  <span className="text-blue-800 font-medium">{analysis.pathDepth}</span>
                </div>
                {analysis.estimatedTechnology && (
                  <div className="flex justify-between">
                    <span className="text-blue-600">Technology:</span>
                    <span className="text-blue-800 font-medium">{analysis.estimatedTechnology}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-blue-600">SEO Friendly:</span>
                  <span className={analysis.seoFriendly ? 'text-green-800' : 'text-orange-800'}>
                    {analysis.seoFriendly ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Readability:</span>
                  <span className="text-blue-800 font-medium">{analysis.accessibility.readabilityScore}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Potential Issues */}
        {analysis && analysis.potentialIssues.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Potential Issues</h3>
            <div className="space-y-2">
              {analysis.potentialIssues.map((issue: string, index: number) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-800">{issue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis && analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Recommendations</h3>
            <div className="space-y-2">
              {analysis.recommendations.slice(0, 3).map((recommendation: string, index: number) => (
                <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">💡</span>
                    <span className="text-green-800">{recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Warnings</h3>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">🚨</span>
                    <span className="text-red-800">{warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* URL Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">URL Information</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🔗 About URLs</div>
              <div className="space-y-1">
                <div>• Structure: scheme://domain/path?query#fragment</div>
                <div>• HTTPS is more secure than HTTP</div>
                <div>• Avoid sensitive data in URLs</div>
                <div>• Use SEO-friendly paths with hyphens</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🗑️ Clear Data
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="URL to Validate"
          value={input}
          onChange={setInput}
          placeholder="Enter URL to validate (e.g., https://www.example.com)..."
          language="text"
        />

        <OutputPanel
          title="Validation Result"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="URL validation results will appear here..."
          processingMessage="Validating URL..."
          customActions={
            output && validation ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Results
                </button>
                <button
                  onClick={() => {
                    const report = `URL Validation Report
Generated: ${new Date().toISOString()}

URL: ${validation.url}
Status: ${validation.isValid ? 'VALID' : 'INVALID'}
Security Level: ${validation.securityLevel.toUpperCase()}

Components:
- Scheme: ${validation.scheme}
- Hostname: ${validation.hostname}
${validation.port ? `- Port: ${validation.port}` : ''}
- Path: ${validation.pathname || '/'}
${validation.search ? `- Query: ${validation.search}` : ''}
${validation.hash ? `- Fragment: ${validation.hash}` : ''}

Validation Results:
- Syntax: ${validation.syntaxValid ? 'Valid' : 'Invalid'}
- Scheme: ${validation.schemeValid ? 'Valid' : 'Invalid'}
- Domain: ${validation.domainValid ? 'Valid' : 'Invalid'}
- Path: ${validation.pathValid ? 'Safe' : 'Unsafe'}
- Encoding: ${validation.encodingValid ? 'Valid' : 'Invalid'}
- Length: ${validation.lengthValid ? 'Valid' : 'Too Long'}

${analysis ? `Analysis:
- Type: ${analysis.type.toUpperCase()}
- Secure: ${analysis.isSecure ? 'Yes' : 'No'}
- Parameters: ${analysis.paramCount || 'None'}
- Path Depth: ${analysis.pathDepth}
${analysis.estimatedTechnology ? `- Technology: ${analysis.estimatedTechnology}` : ''}
- SEO Friendly: ${analysis.seoFriendly ? 'Yes' : 'No'}
- Readability Score: ${analysis.accessibility.readabilityScore}%` : ''}

${analysis && analysis.potentialIssues.length > 0 ? `\nPotential Issues:\n${analysis.potentialIssues.map((i: string) => `- ${i}`).join('\n')}` : ''}

${analysis && analysis.recommendations.length > 0 ? `\nRecommendations:\n${analysis.recommendations.map((r: string) => `- ${r}`).join('\n')}` : ''}

${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}

DISCLAIMER: This validation is for structure and format only. It does not check if the URL is reachable or safe to visit.`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${
                  validation.isValid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validation.isValid ? '✅ VALID URL' : '❌ INVALID URL'}
                </div>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getSecurityColor(validation.securityLevel)}`}>
                  {getSecurityIcon(validation.securityLevel)} {validation.securityLevel.toUpperCase()}
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}