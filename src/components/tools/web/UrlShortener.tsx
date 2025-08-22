import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processUrlShortener, type UrlShortenerConfig } from '../../../tools/web/url-shortener';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface UrlShortenerProps {
  className?: string;
}

const DEFAULT_CONFIG: UrlShortenerConfig = {
  customAlias: '',
  domain: '',
  includeAnalytics: true,
  expirationDate: '',
  password: '',
  description: '',
  tags: [],
  enableRedirect: true,
  redirectCode: 302,
  enablePreview: false,
  enableClickTracking: true,
  maxClicks: 0,
  geoRestrictions: [],
  deviceRestrictions: [],
  utmParams: {
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: ''
  }
};

const BASIC_OPTIONS = [
  {
    key: 'customAlias',
    label: 'Custom Alias',
    type: 'text' as const,
    default: '',
    description: 'Custom short code (3-20 characters)',
  },
  {
    key: 'domain',
    label: 'Custom Domain',
    type: 'text' as const,
    default: '',
    description: 'Your custom domain (optional)',
  },
  {
    key: 'redirectCode',
    label: 'Redirect Type',
    type: 'select' as const,
    default: 302,
    options: [
      { value: 301, label: '301 - Permanent' },
      { value: 302, label: '302 - Temporary' },
      { value: 307, label: '307 - Temporary (strict)' },
      { value: 308, label: '308 - Permanent (strict)' },
    ],
    description: 'HTTP redirect status code',
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text' as const,
    default: '',
    description: 'Optional description for the link',
  },
] as const;

const ANALYTICS_OPTIONS = [
  {
    key: 'includeAnalytics',
    label: 'Enable Analytics',
    type: 'checkbox' as const,
    default: true,
    description: 'Track link clicks and statistics',
  },
  {
    key: 'enableClickTracking',
    label: 'Click Tracking',
    type: 'checkbox' as const,
    default: true,
    description: 'Track individual click events',
  },
  {
    key: 'maxClicks',
    label: 'Max Clicks',
    type: 'number' as const,
    default: 0,
    min: 0,
    max: 10000,
    description: 'Maximum allowed clicks (0 = unlimited)',
  },
  {
    key: 'expirationDate',
    label: 'Expiration Date',
    type: 'date' as const,
    default: '',
    description: 'Link expiration date (optional)',
  },
] as const;

const SECURITY_OPTIONS = [
  {
    key: 'password',
    label: 'Password Protection',
    type: 'password' as const,
    default: '',
    description: 'Password required to access link',
  },
  {
    key: 'enablePreview',
    label: 'Enable Preview',
    type: 'checkbox' as const,
    default: false,
    description: 'Show preview page before redirect',
  },
] as const;

const UTM_OPTIONS = [
  {
    key: 'utmParams.source',
    label: 'UTM Source',
    type: 'text' as const,
    default: '',
    description: 'Traffic source (e.g., google, newsletter)',
  },
  {
    key: 'utmParams.medium',
    label: 'UTM Medium',
    type: 'text' as const,
    default: '',
    description: 'Marketing medium (e.g., cpc, email)',
  },
  {
    key: 'utmParams.campaign',
    label: 'UTM Campaign',
    type: 'text' as const,
    default: '',
    description: 'Campaign name',
  },
  {
    key: 'utmParams.term',
    label: 'UTM Term',
    type: 'text' as const,
    default: '',
    description: 'Keywords for paid search',
  },
  {
    key: 'utmParams.content',
    label: 'UTM Content',
    type: 'text' as const,
    default: '',
    description: 'Ad content or link identifier',
  },
] as const;

export function UrlShortener({ className = '' }: UrlShortenerProps) {
  const [input, setInput] = useState('https://www.example.com/very/long/path/to/important/content?param1=value1&param2=value2&param3=value3');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<UrlShortenerConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: UrlShortenerConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        // Parse tags from string to array
        const configWithTags = {
          ...currentConfig,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        };

        const result = processUrlShortener(currentInput, configWithTags);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setShortUrl(result.shortUrl);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'url-shortener',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.shortUrl ? result.shortUrl.shortUrl : 'Shortened',
            config: configWithTags,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to create short URL');
          setOutput('');
          setShortUrl(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during URL shortening');
        setOutput('');
        setShortUrl(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory, tags]
  );

  useEffect(() => {
    setCurrentTool('url-shortener');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    if (key.startsWith('utmParams.')) {
      const utmKey = key.split('.')[1];
      setConfig(prev => ({
        ...prev,
        utmParams: { ...prev.utmParams, [utmKey]: value }
      }));
    } else {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleQuickExample = (type: 'basic' | 'long' | 'marketing' | 'docs' | 'social' | 'ecommerce' | 'newsletter' | 'event') => {
    const examples = {
      basic: {
        url: 'https://www.example.com/product/12345',
        config: {
          customAlias: '',
          description: 'Product page link',
          includeAnalytics: true,
        }
      },
      long: {
        url: 'https://docs.example.com/api/v2/authentication/oauth2/getting-started?tab=javascript&framework=react&version=latest',
        config: {
          customAlias: 'api-auth',
          description: 'API Authentication Documentation',
          includeAnalytics: true,
        }
      },
      marketing: {
        url: 'https://www.example.com/special-offer',
        config: {
          customAlias: 'spring-sale',
          description: 'Spring Sale Landing Page',
          includeAnalytics: true,
          maxClicks: 1000,
          expirationDate: '2024-12-31',
          utmParams: {
            source: 'email',
            medium: 'newsletter',
            campaign: 'spring-sale-2024',
            term: '',
            content: 'main-cta'
          }
        }
      },
      docs: {
        url: 'https://help.example.com/troubleshooting/common-issues',
        config: {
          customAlias: 'help-guide',
          description: 'Common Issues Help Guide',
          includeAnalytics: true,
          redirectCode: 301,
        }
      },
      social: {
        url: 'https://www.example.com/blog/10-tips-for-productivity',
        config: {
          customAlias: 'productivity-tips',
          description: 'Productivity Tips Blog Post',
          includeAnalytics: true,
          utmParams: {
            source: 'twitter',
            medium: 'social',
            campaign: 'blog-promotion',
            term: '',
            content: 'organic-post'
          }
        }
      },
      ecommerce: {
        url: 'https://shop.example.com/checkout?discount=SAVE20&ref=email',
        config: {
          customAlias: 'checkout-20',
          description: '20% Discount Checkout Link',
          includeAnalytics: true,
          maxClicks: 500,
          expirationDate: '2024-06-30',
        }
      },
      newsletter: {
        url: 'https://www.example.com/newsletter/signup?source=website',
        config: {
          customAlias: 'newsletter',
          description: 'Newsletter Signup Form',
          includeAnalytics: true,
          utmParams: {
            source: 'website',
            medium: 'referral',
            campaign: 'newsletter-signup',
            term: '',
            content: 'footer-link'
          }
        }
      },
      event: {
        url: 'https://events.example.com/webinar/react-best-practices?register=true',
        config: {
          customAlias: 'react-webinar',
          description: 'React Best Practices Webinar',
          includeAnalytics: true,
          maxClicks: 200,
          expirationDate: '2024-03-15',
          password: 'webinar2024',
        }
      }
    };
    
    const example = examples[type];
    setInput(example.url);
    
    // Apply configuration
    Object.entries(example.config).forEach(([key, value]) => {
      if (key === 'utmParams') {
        setConfig(prev => ({ ...prev, utmParams: { ...prev.utmParams, ...value } }));
      } else {
        setConfig(prev => ({ ...prev, [key]: value }));
      }
    });
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
    setConfig(DEFAULT_CONFIG);
    setTags('');
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...ANALYTICS_OPTIONS.filter(opt => 
      opt.key !== 'enableClickTracking' || config.includeAnalytics
    ),
    ...SECURITY_OPTIONS,
    ...UTM_OPTIONS,
  ];

  const getCompressionColor = (ratio: number) => {
    if (ratio > 60) return 'text-green-800 bg-green-100';
    if (ratio > 30) return 'text-yellow-800 bg-yellow-100';
    return 'text-red-800 bg-red-100';
  };

  const getSecurityColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-800 bg-green-100';
      case 'warning': return 'text-yellow-800 bg-yellow-100';
      case 'danger': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Short URL Preview */}
        {shortUrl && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Short URL</h3>
            <div className="p-4 bg-white border-2 border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔗</div>
                <div className="flex-1">
                  <div className="font-medium text-blue-800 break-all">
                    {shortUrl.shortUrl}
                  </div>
                  <div className="text-xs text-blue-600">
                    Alias: {shortUrl.alias}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(shortUrl.shortUrl)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        )}

        {/* URL Statistics */}
        {shortUrl && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Statistics</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getCompressionColor(shortUrl.metadata.compressionRatio)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📊</div>
                  <div>
                    <div className="font-medium text-sm">
                      {shortUrl.metadata.compressionRatio}% Compression
                    </div>
                    <div className="text-xs opacity-80">
                      {shortUrl.metadata.urlLength}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-2 rounded text-xs ${getSecurityColor(shortUrl.security.malwareCheck)}`}>
                <div className="flex justify-between">
                  <span>Security:</span>
                  <span className="font-medium">
                    {shortUrl.security.malwareCheck === 'safe' ? '✅ Safe' : 
                     shortUrl.security.malwareCheck === 'warning' ? '⚠️ Warning' : '❌ Danger'}
                  </span>
                </div>
              </div>
              
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-600">Protocol:</span>
                  <span className="text-blue-800 font-medium">{shortUrl.metadata.protocol}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('basic')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🔗 Basic Link
            </button>
            <button
              onClick={() => handleQuickExample('long')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📚 Documentation Link
            </button>
            <button
              onClick={() => handleQuickExample('marketing')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              📈 Marketing Campaign
            </button>
            <button
              onClick={() => handleQuickExample('social')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              📱 Social Media
            </button>
            <button
              onClick={() => handleQuickExample('ecommerce')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              🛒 E-commerce
            </button>
            <button
              onClick={() => handleQuickExample('newsletter')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              📧 Newsletter
            </button>
            <button
              onClick={() => handleQuickExample('event')}
              className="px-3 py-2 text-xs bg-pink-100 text-pink-800 rounded hover:bg-pink-200 transition-colors text-left"
            >
              🎟️ Event Registration
            </button>
          </div>
        </div>

        <OptionsPanel
          title="URL Shortener Options"
          options={allOptions}
          values={{
            ...config,
            'utmParams.source': config.utmParams.source,
            'utmParams.medium': config.utmParams.medium,
            'utmParams.campaign': config.utmParams.campaign,
            'utmParams.term': config.utmParams.term,
            'utmParams.content': config.utmParams.content,
          }}
          onChange={handleConfigChange}
        />

        {/* Tags Input */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Tags</h3>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas"
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-xs text-gray-500">
            Example: marketing, campaign, social-media
          </div>
        </div>

        {/* Configuration Summary */}
        {shortUrl && shortUrl.configuration && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Configuration</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-blue-50 rounded">
                <span className="text-blue-600">Redirect Type:</span>
                <span className="text-blue-800 font-medium">{shortUrl.configuration.redirectType}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-green-50 rounded">
                <span className="text-green-600">Analytics:</span>
                <span className="text-green-800 font-medium">{shortUrl.analytics.trackingEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-purple-50 rounded">
                <span className="text-purple-600">Max Clicks:</span>
                <span className="text-purple-800 font-medium">{shortUrl.analytics.maxClicks || 'Unlimited'}</span>
              </div>
              {shortUrl.configuration.passwordProtected && (
                <div className="flex justify-between text-xs p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-600">Password:</span>
                  <span className="text-yellow-800 font-medium">Protected</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Warnings</h3>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-800">{warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* URL Shortener Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Features</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🔗 URL Shortening Benefits</div>
              <div className="space-y-1">
                <div>• Shorter links for social media</div>
                <div>• Click tracking and analytics</div>
                <div>• Custom aliases for branding</div>
                <div>• Password protection available</div>
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
          title="URL to Shorten"
          value={input}
          onChange={setInput}
          placeholder="Enter the long URL you want to shorten..."
          language="text"
        />

        <OutputPanel
          title="Short URL Details"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="Short URL details will appear here..."
          processingMessage="Creating short URL..."
          customActions={
            output && shortUrl ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleCopyToClipboard(shortUrl.shortUrl)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Short URL
                </button>
                <button
                  onClick={() => handleCopyToClipboard(shortUrl.originalUrl)}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📄 Copy Original URL
                </button>
                <button
                  onClick={() => {
                    const qrWindow = window.open('', '_blank');
                    if (qrWindow) {
                      qrWindow.document.write(`
                        <html>
                          <head><title>QR Code for ${shortUrl.shortUrl}</title></head>
                          <body style="text-align: center; padding: 20px;">
                            <h2>QR Code</h2>
                            <img src="${shortUrl.qrCode}" alt="QR Code" style="border: 1px solid #ccc; padding: 10px;"/>
                            <p>${shortUrl.shortUrl}</p>
                          </body>
                        </html>
                      `);
                    }
                  }}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  📱 View QR Code
                </button>
                <button
                  onClick={() => {
                    const report = `URL Shortener Report\nGenerated: ${new Date().toISOString()}\n\nOriginal URL: ${shortUrl.originalUrl}\nShort URL: ${shortUrl.shortUrl}\nAlias: ${shortUrl.alias}\nDomain: ${shortUrl.domain}\n\nStatistics:\n- Compression: ${shortUrl.metadata.compressionRatio}%\n- URL Length: ${shortUrl.metadata.urlLength}\n- Protocol: ${shortUrl.metadata.protocol}\n- Domain: ${shortUrl.metadata.domainInfo.rootDomain}\n\nConfiguration:\n- Redirect Type: ${shortUrl.configuration.redirectType} (${shortUrl.configuration.redirectCode})\n- Analytics: ${shortUrl.analytics.trackingEnabled ? 'Enabled' : 'Disabled'}\n- Click Tracking: ${shortUrl.analytics.clickTracking ? 'Enabled' : 'Disabled'}\n- Password Protected: ${shortUrl.configuration.passwordProtected ? 'Yes' : 'No'}\n- Preview: ${shortUrl.configuration.previewEnabled ? 'Enabled' : 'Disabled'}\n- Max Clicks: ${shortUrl.analytics.maxClicks || 'Unlimited'}\n- Lifetime: ${shortUrl.analytics.estimatedLifetime}\n\nSecurity:\n- Malware Check: ${shortUrl.security.malwareCheck}\n- Phishing Check: ${shortUrl.security.phishingCheck}\n- Domain Reputation: ${shortUrl.security.domainReputation}\n- HTTPS Support: ${shortUrl.security.httpsSupport ? 'Yes' : 'No'}\n\n${shortUrl.metadata.description ? `Description: ${shortUrl.metadata.description}\n` : ''}${shortUrl.metadata.tags.length > 0 ? `Tags: ${shortUrl.metadata.tags.join(', ')}\n` : ''}${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getCompressionColor(shortUrl.metadata.compressionRatio)}`}>
                  {shortUrl.metadata.compressionRatio}% Smaller
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {shortUrl.configuration.redirectCode} Redirect
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}