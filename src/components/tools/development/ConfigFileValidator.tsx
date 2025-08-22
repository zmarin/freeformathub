import React, { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processConfigValidation } from '../../../tools/development/config-file-validator';
import type { ConfigValidatorConfig, ToolResult } from '../../../tools/development/config-file-validator';

const DEFAULT_CONFIG: ConfigValidatorConfig = {
  fileType: 'auto',
  validationLevel: 'comprehensive',
  schemaValidation: false,
  strictMode: false,
  checkSecurity: true,
  checkPerformance: true,
  checkBestPractices: true,
  outputFormat: 'detailed',
  fixSuggestions: true,
  includeWarnings: true,
  contextLines: 1
};

const SAMPLE_CONFIGS = {
  json: `{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp",
    "user": "admin",
    "password": "secret123"
  },
  "redis": {
    "host": "localhost",
    "port": 6379,
    "password": "redis_secret"
  },
  "api": {
    "key": "sk-1234567890abcdef",
    "jwt_secret": "super-secret-jwt-key",
    "rate_limit": 1000
  }
}`,
  yaml: `database:
  host: localhost
  port: 5432
  name: myapp
  username: admin
  password: "supersecret"
  ssl: true

redis:
  host: localhost
  port: 6379
  password: "redis_password"

api:
  key: "api-key-12345"
  jwt_secret: "jwt-signing-secret"
  cors_origins:
    - "https://example.com"
    - "https://app.example.com"

logging:
  level: info
  file: /var/log/app.log`,
  dockerfile: `FROM node:18-alpine

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]`,
  nginx: `server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Caching
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
    }
    
    location /static/ {
        root /var/www;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /health {
        access_log off;
        return 200 "healthy\\n";
    }
}`,
  env: `# Database Configuration
DATABASE_URL=postgresql://user:password123@localhost:5432/myapp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=admin
DB_PASSWORD=super_secret_password

# API Configuration  
API_KEY=sk-1234567890abcdef
JWT_SECRET=my-super-secret-jwt-key
ENCRYPTION_KEY=aes-256-encryption-key-here

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis-secret-password

# Third-party Services
STRIPE_SECRET_KEY=sk_test_1234567890
SENDGRID_API_KEY=SG.abcdef123456
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Application Settings
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
DEBUG=false`
};

export function ConfigFileValidator() {
  const [input, setInput] = useState(SAMPLE_CONFIGS.json);
  const [config, setConfig] = useState<ConfigValidatorConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ToolResult | null>(null);

  const processedResult = useMemo(() => {
    if (!input.trim()) {
      return { success: false, error: 'Please provide configuration file content to validate' };
    }

    return processConfigValidation(input, config);
  }, [input, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(processedResult);
    }, 500);

    return () => clearTimeout(timer);
  }, [processedResult]);

  const handleConfigChange = (key: keyof ConfigValidatorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleLoadSample = (type: keyof typeof SAMPLE_CONFIGS) => {
    setInput(SAMPLE_CONFIGS[type]);
    setConfig(prev => ({ ...prev, fileType: type === 'dockerfile' ? 'dockerfile' : type === 'nginx' ? 'nginx' : type === 'env' ? 'env' : type }));
  };

  const getFileTypeDescription = (type: string) => {
    const descriptions = {
      auto: 'Auto-detect from content',
      json: 'JSON configuration file',
      yaml: 'YAML configuration file',
      toml: 'TOML configuration file',
      xml: 'XML configuration file',
      ini: 'INI/Properties file',
      env: 'Environment variables file',
      properties: 'Java properties file',
      dockerfile: 'Docker container definition',
      nginx: 'Nginx web server config',
      apache: 'Apache web server config'
    };
    return descriptions[type] || 'Configuration file';
  };

  const optionGroups = [
    {
      title: 'File Type & Validation',
      options: [
        {
          key: 'fileType' as const,
          label: 'File Type',
          type: 'select' as const,
          value: config.fileType,
          options: [
            { value: 'auto', label: 'Auto-detect' },
            { value: 'json', label: 'JSON' },
            { value: 'yaml', label: 'YAML' },
            { value: 'toml', label: 'TOML' },
            { value: 'xml', label: 'XML' },
            { value: 'ini', label: 'INI' },
            { value: 'env', label: 'Environment' },
            { value: 'properties', label: 'Properties' },
            { value: 'dockerfile', label: 'Dockerfile' },
            { value: 'nginx', label: 'Nginx' },
            { value: 'apache', label: 'Apache' }
          ]
        },
        {
          key: 'validationLevel' as const,
          label: 'Validation Level',
          type: 'select' as const,
          value: config.validationLevel,
          options: [
            { value: 'syntax', label: 'Syntax Only' },
            { value: 'schema', label: 'Schema Validation' },
            { value: 'comprehensive', label: 'Comprehensive' }
          ]
        },
        {
          key: 'outputFormat' as const,
          label: 'Output Format',
          type: 'select' as const,
          value: config.outputFormat,
          options: [
            { value: 'detailed', label: 'Detailed Report' },
            { value: 'summary', label: 'Summary Only' },
            { value: 'json', label: 'JSON Output' },
            { value: 'junit', label: 'JUnit XML' }
          ]
        }
      ]
    },
    {
      title: 'Analysis Options',
      options: [
        {
          key: 'checkSecurity' as const,
          label: 'Security Analysis',
          type: 'checkbox' as const,
          value: config.checkSecurity
        },
        {
          key: 'checkPerformance' as const,
          label: 'Performance Analysis',
          type: 'checkbox' as const,
          value: config.checkPerformance
        },
        {
          key: 'checkBestPractices' as const,
          label: 'Best Practices Check',
          type: 'checkbox' as const,
          value: config.checkBestPractices
        },
        {
          key: 'schemaValidation' as const,
          label: 'Schema Validation',
          type: 'checkbox' as const,
          value: config.schemaValidation
        },
        {
          key: 'strictMode' as const,
          label: 'Strict Mode',
          type: 'checkbox' as const,
          value: config.strictMode
        }
      ]
    },
    {
      title: 'Output Options',
      options: [
        {
          key: 'fixSuggestions' as const,
          label: 'Include Fix Suggestions',
          type: 'checkbox' as const,
          value: config.fixSuggestions
        },
        {
          key: 'includeWarnings' as const,
          label: 'Include Warnings',
          type: 'checkbox' as const,
          value: config.includeWarnings
        },
        {
          key: 'contextLines' as const,
          label: 'Context Lines',
          type: 'number' as const,
          value: config.contextLines,
          min: 0,
          max: 5
        }
      ]
    }
  ];

  // Add custom schema field if schema validation is enabled
  if (config.schemaValidation) {
    optionGroups[1].options.push({
      key: 'customSchema' as const,
      label: 'Custom Schema (JSON)',
      type: 'textarea' as const,
      value: config.customSchema || '',
      placeholder: 'Enter JSON schema for validation...'
    });
  }

  const getOutputLanguage = () => {
    switch (config.outputFormat) {
      case 'json': return 'json';
      case 'junit': return 'xml';
      default: return 'text';
    }
  };

  const getFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = config.outputFormat === 'json' ? 'json' : 
                     config.outputFormat === 'junit' ? 'xml' : 'txt';
    return `config-validation-${config.fileType}-${timestamp}.${extension}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="space-y-4">
          <InputPanel
            title="Configuration File Content"
            value={input}
            onChange={setInput}
            placeholder="Paste your configuration file content here..."
            language={config.fileType === 'json' ? 'json' : 
                     config.fileType === 'yaml' ? 'yaml' :
                     config.fileType === 'xml' ? 'xml' :
                     config.fileType === 'dockerfile' ? 'dockerfile' : 'text'}
            showLineNumbers
          />
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLoadSample('json')}
              className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              JSON Sample
            </button>
            <button
              onClick={() => handleLoadSample('yaml')}
              className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              YAML Sample
            </button>
            <button
              onClick={() => handleLoadSample('dockerfile')}
              className="px-3 py-2 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Dockerfile
            </button>
            <button
              onClick={() => handleLoadSample('nginx')}
              className="px-3 py-2 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Nginx
            </button>
            <button
              onClick={() => handleLoadSample('env')}
              className="px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors col-span-2"
            >
              Environment Variables
            </button>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">File Type Info</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {getFileTypeDescription(config.fileType)}
            </p>
            {result?.validation?.metadata.detectedFormat && result.validation.metadata.detectedFormat !== config.fileType && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Detected format: {result.validation.metadata.detectedFormat}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <OutputPanel
          title="Validation Results"
          value={result?.output || ''}
          language={getOutputLanguage()}
          error={result?.error}
          showCopy
          showDownload
          filename={getFilename()}
        />
        
        {result?.warnings && result.warnings.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Validation Warnings:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {result?.validation?.securityAnalysis && (result.validation.securityAnalysis.vulnerabilities.length > 0 || result.validation.securityAnalysis.sensitiveDataExposed.length > 0) && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              🔒 Security Issues Found
            </h4>
            <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
              {result.validation.securityAnalysis.vulnerabilities.length > 0 && (
                <div>
                  <span className="font-medium">Vulnerabilities:</span> {result.validation.securityAnalysis.vulnerabilities.length}
                </div>
              )}
              {result.validation.securityAnalysis.sensitiveDataExposed.length > 0 && (
                <div>
                  <span className="font-medium">Sensitive Data Exposed:</span> {result.validation.securityAnalysis.sensitiveDataExposed.length}
                </div>
              )}
            </div>
          </div>
        )}

        {!result?.success && result?.validation?.syntaxValidation.errors && result.validation.syntaxValidation.errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              ❌ Syntax Errors ({result.validation.syntaxValidation.errors.length})
            </h4>
            <div className="space-y-2">
              {result.validation.syntaxValidation.errors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-sm text-red-700 dark:text-red-300">
                  <div className="font-medium">Line {error.line}, Column {error.column}</div>
                  <div>{error.message}</div>
                </div>
              ))}
              {result.validation.syntaxValidation.errors.length > 3 && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  ... and {result.validation.syntaxValidation.errors.length - 3} more errors
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <OptionsPanel
          title="Validation Configuration"
          optionGroups={optionGroups}
          onChange={handleConfigChange}
        />

        {result?.validation?.metadata && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Validation Summary</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>File Size:</span>
                <span className="font-medium">{result.validation.metadata.fileSize} bytes</span>
              </div>
              <div className="flex justify-between">
                <span>Lines:</span>
                <span className="font-medium">{result.validation.metadata.lineCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Time:</span>
                <span className="font-medium">{result.validation.metadata.processingTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Syntax Valid:</span>
                <span className={`font-medium ${result.validation.syntaxValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                  {result.validation.syntaxValidation.valid ? '✅' : '❌'}
                </span>
              </div>
              {result.validation.syntaxValidation.errors.length > 0 && (
                <div className="flex justify-between">
                  <span>Syntax Errors:</span>
                  <span className="font-medium text-red-600">{result.validation.syntaxValidation.errors.length}</span>
                </div>
              )}
              {result.validation.syntaxValidation.warnings.length > 0 && (
                <div className="flex justify-between">
                  <span>Warnings:</span>
                  <span className="font-medium text-yellow-600">{result.validation.syntaxValidation.warnings.length}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {result?.validation?.securityAnalysis && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-3">Security Analysis</h3>
            <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <span className={`font-medium px-2 py-1 text-xs rounded ${
                  result.validation.securityAnalysis.riskLevel === 'critical' ? 'bg-red-600 text-white' :
                  result.validation.securityAnalysis.riskLevel === 'high' ? 'bg-orange-500 text-white' :
                  result.validation.securityAnalysis.riskLevel === 'medium' ? 'bg-yellow-500 text-black' :
                  'bg-green-500 text-white'
                }`}>
                  {result.validation.securityAnalysis.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Security Score:</span>
                <span className="font-medium">{result.validation.securityAnalysis.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Vulnerabilities:</span>
                <span className="font-medium">{result.validation.securityAnalysis.vulnerabilities.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Sensitive Data:</span>
                <span className="font-medium">{result.validation.securityAnalysis.sensitiveDataExposed.length}</span>
              </div>
            </div>
          </div>
        )}

        {result?.validation?.performanceAnalysis && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">Performance Analysis</h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex justify-between">
                <span>Performance Score:</span>
                <span className="font-medium">{result.validation.performanceAnalysis.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Issues:</span>
                <span className="font-medium">{result.validation.performanceAnalysis.issues.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Optimizations:</span>
                <span className="font-medium">{result.validation.performanceAnalysis.optimizations.length}</span>
              </div>
              <div className="text-xs mt-2">
                <div>Resource Impact:</div>
                <div className="flex justify-between mt-1">
                  <span>Memory: {result.validation.performanceAnalysis.resourceUsage.memoryImpact}</span>
                  <span>CPU: {result.validation.performanceAnalysis.resourceUsage.cpuImpact}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network: {result.validation.performanceAnalysis.resourceUsage.networkImpact}</span>
                  <span>Disk: {result.validation.performanceAnalysis.resourceUsage.diskImpact}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {result?.validation?.bestPracticesCheck && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">Best Practices</h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <div className="flex justify-between">
                <span>Overall Score:</span>
                <span className="font-medium">{result.validation.bestPracticesCheck.score.toFixed(1)}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Violations:</span>
                <span className="font-medium">{result.validation.bestPracticesCheck.violations.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Compliance Checks:</span>
                <span className="font-medium">{result.validation.bestPracticesCheck.compliance.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}