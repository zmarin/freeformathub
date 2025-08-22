import React, { useState, useCallback, useMemo } from 'react';
import { Shield, Key, Clock, User, Settings, Copy, Download, Eye, EyeOff, Info, AlertTriangle } from 'lucide-react';
import { processJWTGenerator, JWTGeneratorConfig } from '../../../tools/crypto/jwt-generator';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { debounce } from '../../../lib/utils';

interface JWTGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: JWTGeneratorConfig = {
  algorithm: 'HS256',
  includeTyp: true,
  includeKid: false,
  issuedAtTime: true,
  secretKey: 'your-256-bit-secret'
};

export default function JWTGenerator({ className = '' }: JWTGeneratorProps) {
  const [input, setInput] = useState('{\n  "userId": 12345,\n  "username": "john.doe",\n  "email": "john@example.com",\n  "role": "user"\n}');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<JWTGeneratorConfig>(DEFAULT_CONFIG);
  const [showToken, setShowToken] = useState(true);
  const [activeTab, setActiveTab] = useState<'token' | 'header' | 'payload' | 'signature'>('token');

  const processInput = useMemo(
    () => debounce(async (currentInput: string, currentConfig: JWTGeneratorConfig) => {
      if (!currentInput.trim()) {
        setResult(null);
        setError('');
        return;
      }

      setIsProcessing(true);
      setError('');

      try {
        const toolResult = await processJWTGenerator(currentInput, currentConfig);
        
        if (toolResult.data) {
          setResult(toolResult);
          setError('');
        } else {
          setError(toolResult.error || 'Failed to generate JWT');
          setResult(null);
        }
      } catch (err) {
        setError('Error generating JWT token');
        setResult(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    []
  );

  React.useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = useCallback((key: keyof JWTGeneratorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleQuickExample = (type: 'basic' | 'admin' | 'api' | 'refresh' | 'oauth') => {
    const examples = {
      basic: {
        payload: '{\n  "userId": 12345,\n  "username": "john.doe",\n  "email": "john@example.com",\n  "role": "user"\n}',
        config: { algorithm: 'HS256' as const, expirationTime: '1h', secretKey: 'user-secret-key' }
      },
      admin: {
        payload: '{\n  "admin": true,\n  "permissions": ["read", "write", "delete"],\n  "department": "IT",\n  "level": "admin"\n}',
        config: { algorithm: 'HS512' as const, expirationTime: '30m', audience: 'admin-api', issuer: 'auth-service', secretKey: 'admin-secret-key' }
      },
      api: {
        payload: '{\n  "clientId": "app-123",\n  "scopes": ["api:read", "api:write"],\n  "type": "client_credentials"\n}',
        config: { algorithm: 'HS256' as const, expirationTime: '2h', audience: 'api-gateway', secretKey: 'api-secret-key' }
      },
      refresh: {
        payload: '{\n  "userId": 12345,\n  "tokenType": "refresh",\n  "sessionId": "sess_abc123"\n}',
        config: { algorithm: 'HS384' as const, expirationTime: '7d', secretKey: 'refresh-secret-key' }
      },
      oauth: {
        payload: '{\n  "sub": "user123",\n  "name": "John Doe",\n  "email": "john@example.com",\n  "picture": "https://example.com/avatar.jpg"\n}',
        config: { algorithm: 'RS256' as const, expirationTime: '1h', audience: 'oauth-client', issuer: 'oauth-provider' }
      }
    };

    const example = examples[type];
    setInput(example.payload);
    setConfig(prev => ({ ...prev, ...example.config }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getAlgorithmColor = (alg: string) => {
    if (alg.startsWith('HS')) return 'bg-blue-100 text-blue-800';
    if (alg.startsWith('RS')) return 'bg-green-100 text-green-800';
    if (alg.startsWith('ES')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatToken = (token: string) => {
    if (!token) return '';
    const parts = token.split('.');
    if (parts.length !== 3) return token;
    
    return `${parts[0]}.\n${parts[1]}.\n${parts[2]}`;
  };

  const getStatistics = () => {
    if (!result?.data) return [];
    
    const stats = [];
    const { data, metadata } = result;
    
    stats.push({ label: 'Algorithm', value: data.keyInfo.algorithm });
    stats.push({ label: 'Token Size', value: `${metadata.tokenSize} chars` });
    stats.push({ label: 'Claims Count', value: metadata.claims.toString() });
    stats.push({ label: 'Header Size', value: `${metadata.headerSize} chars` });
    stats.push({ label: 'Payload Size', value: `${metadata.payloadSize} chars` });
    stats.push({ label: 'Signature Size', value: `${metadata.signatureSize} chars` });
    
    if (metadata.hasExpiration) {
      stats.push({ label: 'Has Expiration', value: 'Yes' });
    }
    
    if (data.expirationInfo?.timeToExpiry) {
      const hours = Math.floor(data.expirationInfo.timeToExpiry / 3600);
      const minutes = Math.floor((data.expirationInfo.timeToExpiry % 3600) / 60);
      stats.push({ label: 'Expires In', value: `${hours}h ${minutes}m` });
    }
    
    return stats;
  };

  const getCurrentTabContent = () => {
    if (!result?.data) return '';
    
    switch (activeTab) {
      case 'token':
        return showToken ? result.data.token : formatToken(result.data.token);
      case 'header':
        return result.data.headerDecoded;
      case 'payload':
        return result.data.payloadDecoded;
      case 'signature':
        return result.data.signature;
      default:
        return '';
    }
  };

  const getCurrentTabLanguage = () => {
    switch (activeTab) {
      case 'header':
      case 'payload':
        return 'json';
      case 'token':
      case 'signature':
        return 'text';
      default:
        return 'text';
    }
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-8 ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">JWT Generator</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate JSON Web Tokens with custom claims, standard fields, and multiple signing algorithms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Input Panel */}
          <InputPanel
            title="JWT Payload (JSON)"
            value={input}
            onChange={setInput}
            placeholder="Enter the JWT payload as JSON..."
            language="json"
            height="300px"
          />

          {/* Output Panel with Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generated JWT</h2>
              <div className="flex items-center space-x-2">
                {activeTab === 'token' && (
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showToken ? 'Format' : 'Compact'}</span>
                  </button>
                )}
                {result?.data && (
                  <button
                    onClick={() => copyToClipboard(getCurrentTabContent())}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              {[
                { id: 'token', label: 'Token', icon: Key },
                { id: 'header', label: 'Header', icon: Settings },
                { id: 'payload', label: 'Payload', icon: User },
                { id: 'signature', label: 'Signature', icon: Shield }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <OutputPanel
              title=""
              content={getCurrentTabContent()}
              isProcessing={isProcessing}
              error={error}
              language={getCurrentTabLanguage()}
              height="400px"
              showCopy={false}
            />

            {/* Token Information */}
            {result?.data && activeTab === 'token' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-800 mb-2">Token Structure</div>
                    <div className="space-y-1 text-blue-700">
                      <div>• <strong>Header:</strong> {result.data.tokenParts.header}</div>
                      <div>• <strong>Payload:</strong> {result.data.tokenParts.payload}</div>
                      <div>• <strong>Signature:</strong> {result.data.signature}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Algorithm Information */}
            {result?.data && (
              <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getAlgorithmColor(result.data.keyInfo.algorithm)}`}>
                    {result.data.keyInfo.algorithm}
                  </span>
                  <span className="text-sm text-gray-600">
                    {result.data.keyInfo.keyType}
                    {result.data.keyInfo.keyLength && ` (${result.data.keyInfo.keyLength} bit)`}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{result.processing_time}ms</span>
                </div>
              </div>
            )}

            {/* Expiration Warning */}
            {result?.data?.expirationInfo?.isExpired && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div className="text-sm text-red-700">
                    <div className="font-medium">Token Expired</div>
                    <div>This token has already expired and will not be accepted by services.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Examples */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Quick Examples
            </h3>
            
            <div className="space-y-2">
              {[
                { id: 'basic', label: 'Basic User Token', icon: '👤', desc: 'Simple user authentication' },
                { id: 'admin', label: 'Admin Token', icon: '🔐', desc: 'Admin with permissions' },
                { id: 'api', label: 'API Token', icon: '🔌', desc: 'Client credentials token' },
                { id: 'refresh', label: 'Refresh Token', icon: '🔄', desc: 'Long-lived refresh token' },
                { id: 'oauth', label: 'OAuth Token', icon: '🌐', desc: 'OAuth2 ID token' }
              ].map(({ id, label, icon, desc }) => (
                <button
                  key={id}
                  onClick={() => handleQuickExample(id as any)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <OptionsPanel title="JWT Configuration">
            <div className="space-y-4">
              {/* Algorithm Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signing Algorithm
                </label>
                <select
                  value={config.algorithm}
                  onChange={(e) => handleConfigChange('algorithm', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <optgroup label="HMAC (Symmetric)">
                    <option value="HS256">HS256 (HMAC-SHA256)</option>
                    <option value="HS384">HS384 (HMAC-SHA384)</option>
                    <option value="HS512">HS512 (HMAC-SHA512)</option>
                  </optgroup>
                  <optgroup label="RSA (Asymmetric)">
                    <option value="RS256">RS256 (RSA-SHA256)</option>
                    <option value="RS384">RS384 (RSA-SHA384)</option>
                    <option value="RS512">RS512 (RSA-SHA512)</option>
                  </optgroup>
                  <optgroup label="ECDSA (Asymmetric)">
                    <option value="ES256">ES256 (ECDSA-SHA256)</option>
                    <option value="ES384">ES384 (ECDSA-SHA384)</option>
                    <option value="ES512">ES512 (ECDSA-SHA512)</option>
                  </optgroup>
                </select>
              </div>

              {/* Secret Key (for HMAC algorithms) */}
              {config.algorithm.startsWith('HS') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    value={config.secretKey || ''}
                    onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                    placeholder="Enter your secret key..."
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              {/* Header Options */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Header Options</h4>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.includeTyp}
                    onChange={(e) => handleConfigChange('includeTyp', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Include "typ": "JWT"</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.includeKid}
                    onChange={(e) => handleConfigChange('includeKid', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Include Key ID</span>
                </label>

                {config.includeKid && (
                  <input
                    type="text"
                    value={config.keyId || ''}
                    onChange={(e) => handleConfigChange('keyId', e.target.value)}
                    placeholder="Key ID..."
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                )}
              </div>

              {/* Standard Claims */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Standard Claims</h4>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Expiration Time</label>
                  <input
                    type="text"
                    value={config.expirationTime || ''}
                    onChange={(e) => handleConfigChange('expirationTime', e.target.value)}
                    placeholder="e.g., 1h, 30m, 7d, or Unix timestamp"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Not Before</label>
                  <input
                    type="text"
                    value={config.notBeforeTime || ''}
                    onChange={(e) => handleConfigChange('notBeforeTime', e.target.value)}
                    placeholder="e.g., 5m, or Unix timestamp"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.issuedAtTime}
                    onChange={(e) => handleConfigChange('issuedAtTime', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Include Issued At (iat)</span>
                </label>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Audience</label>
                  <input
                    type="text"
                    value={config.audience || ''}
                    onChange={(e) => handleConfigChange('audience', e.target.value)}
                    placeholder="e.g., api.example.com"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Issuer</label>
                  <input
                    type="text"
                    value={config.issuer || ''}
                    onChange={(e) => handleConfigChange('issuer', e.target.value)}
                    placeholder="e.g., auth.example.com"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Subject</label>
                  <input
                    type="text"
                    value={config.subject || ''}
                    onChange={(e) => handleConfigChange('subject', e.target.value)}
                    placeholder="e.g., user123"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </OptionsPanel>

          {/* Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Token Statistics</h3>
            <div className="space-y-2">
              {getStatistics().map((stat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{stat.label}:</span>
                  <span className="font-medium text-gray-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}