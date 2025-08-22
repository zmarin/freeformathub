import React, { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processGitDiff } from '../../../tools/development/git-diff-visualizer';
import type { GitDiffConfig, ToolResult } from '../../../tools/development/git-diff-visualizer';

const DEFAULT_CONFIG: GitDiffConfig = {
  diffFormat: 'unified',
  contextLines: 3,
  showWhitespace: false,
  ignoreWhitespace: false,
  showLineNumbers: true,
  highlightSyntax: true,
  wordWrap: true,
  theme: 'github',
  outputFormat: 'text',
  statisticsLevel: 'detailed',
  includeMetadata: true,
  detectRenames: true,
  detectCopies: false,
  binaryFileHandling: 'basic',
  maxFileSize: 1000000 // 1MB
};

const SAMPLE_DIFFS = {
  feature: `diff --git a/src/components/Button.tsx b/src/components/Button.tsx
index 1234567..abcdefg 100644
--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -1,8 +1,15 @@
 import React from 'react';
 
 interface ButtonProps {
   children: React.ReactNode;
+  variant?: 'primary' | 'secondary' | 'danger';
+  size?: 'small' | 'medium' | 'large';
+  disabled?: boolean;
   onClick?: () => void;
 }
 
-export function Button({ children, onClick }: ButtonProps) {
-  return <button onClick={onClick}>{children}</button>;
+export function Button({ children, variant = 'primary', size = 'medium', disabled = false, onClick }: ButtonProps) {
+  const baseClasses = 'font-semibold rounded transition-colors focus:outline-none focus:ring-2';
+  const variantClasses = variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 
+                        variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' :
+                        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500';
+  const sizeClasses = size === 'small' ? 'px-2 py-1 text-sm' : size === 'large' ? 'px-6 py-3 text-lg' : 'px-4 py-2';
+  
+  return (
+    <button 
+      className={\`\${baseClasses} \${variantClasses} \${sizeClasses} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
+      onClick={onClick}
+      disabled={disabled}
+    >
+      {children}
+    </button>
+  );
 }`,
  
  bugfix: `diff --git a/src/utils/validation.ts b/src/utils/validation.ts
index 2345678..bcdefgh 100644
--- a/src/utils/validation.ts
+++ b/src/utils/validation.ts
@@ -12,10 +12,15 @@ export function validateEmail(email: string): boolean {
   if (!email || typeof email !== 'string') {
     return false;
   }
+  
+  // Trim whitespace and convert to lowercase
+  email = email.trim().toLowerCase();
+  
   const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
   return emailRegex.test(email);
 }
 
 export function validatePassword(password: string): boolean {
-  return password.length >= 6;
+  // Require at least 8 characters, one uppercase, one lowercase, one digit
+  return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(password);
 }
 
+export function sanitizeInput(input: string): string {
+  // Remove potentially dangerous characters
+  return input.replace(/[<>\"'&]/g, '').trim();
+}`,

  refactor: `diff --git a/src/hooks/useApi.ts b/src/hooks/useApi.ts
deleted file mode 100644
index 3456789..0000000
--- a/src/hooks/useApi.ts
+++ /dev/null
@@ -1,20 +0,0 @@
-import { useState, useEffect } from 'react';
-
-export function useApi<T>(url: string) {
-  const [data, setData] = useState<T | null>(null);
-  const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
-
-  useEffect(() => {
-    fetch(url)
-      .then(response => response.json())
-      .then(setData)
-      .catch(err => setError(err.message))
-      .finally(() => setLoading(false));
-  }, [url]);
-
-  return { data, loading, error };
-}
diff --git a/src/services/api.ts b/src/services/api.ts
new file mode 100644
index 0000000..cdefghi
--- /dev/null
+++ b/src/services/api.ts
@@ -0,0 +1,45 @@
+class ApiService {
+  private baseURL: string;
+  private defaultHeaders: Record<string, string>;
+  
+  constructor(baseURL: string) {
+    this.baseURL = baseURL;
+    this.defaultHeaders = {
+      'Content-Type': 'application/json',
+    };
+  }
+  
+  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
+    const url = \`\${this.baseURL}\${endpoint}\`;
+    const config: RequestInit = {
+      ...options,
+      headers: {
+        ...this.defaultHeaders,
+        ...options.headers,
+      },
+    };
+    
+    const response = await fetch(url, config);
+    
+    if (!response.ok) {
+      throw new Error(\`HTTP error! status: \${response.status}\`);
+    }
+    
+    return response.json();
+  }
+  
+  async get<T>(endpoint: string): Promise<T> {
+    return this.request<T>(endpoint, { method: 'GET' });
+  }
+  
+  async post<T>(endpoint: string, data: any): Promise<T> {
+    return this.request<T>(endpoint, {
+      method: 'POST',
+      body: JSON.stringify(data),
+    });
+  }
+}
+
+export const api = new ApiService(process.env.REACT_APP_API_URL || 'http://localhost:3001');`,

  test: `diff --git a/src/components/Button.test.tsx b/src/components/Button.test.tsx
new file mode 100644
index 0000000..defghij
--- /dev/null
+++ b/src/components/Button.test.tsx
@@ -0,0 +1,55 @@
+import { render, screen, fireEvent } from '@testing-library/react';
+import { Button } from './Button';
+
+describe('Button', () => {
+  it('renders button with children', () => {
+    render(<Button>Click me</Button>);
+    expect(screen.getByRole('button')).toHaveTextContent('Click me');
+  });
+
+  it('calls onClick when clicked', () => {
+    const mockClick = jest.fn();
+    render(<Button onClick={mockClick}>Click me</Button>);
+    fireEvent.click(screen.getByRole('button'));
+    expect(mockClick).toHaveBeenCalledTimes(1);
+  });
+
+  it('does not call onClick when disabled', () => {
+    const mockClick = jest.fn();
+    render(<Button onClick={mockClick} disabled>Disabled</Button>);
+    fireEvent.click(screen.getByRole('button'));
+    expect(mockClick).not.toHaveBeenCalled();
+  });
+
+  describe('variants', () => {
+    it('applies primary variant classes by default', () => {
+      render(<Button>Primary</Button>);
+      expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
+    });
+
+    it('applies secondary variant classes', () => {
+      render(<Button variant="secondary">Secondary</Button>);
+      expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
+    });
+
+    it('applies danger variant classes', () => {
+      render(<Button variant="danger">Danger</Button>);
+      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
+    });
+  });
+
+  describe('sizes', () => {
+    it('applies medium size classes by default', () => {
+      render(<Button>Medium</Button>);
+      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2');
+    });
+
+    it('applies small size classes', () => {
+      render(<Button size="small">Small</Button>);
+      expect(screen.getByRole('button')).toHaveClass('px-2', 'py-1', 'text-sm');
+    });
+
+    it('applies large size classes', () => {
+      render(<Button size="large">Large</Button>);
+      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
+    });
+  });
+});`
};

export function GitDiffVisualizer() {
  const [input, setInput] = useState(SAMPLE_DIFFS.feature);
  const [config, setConfig] = useState<GitDiffConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ToolResult | null>(null);

  const processedResult = useMemo(() => {
    if (!input.trim()) {
      return { success: false, error: 'Please provide git diff content to analyze' };
    }

    return processGitDiff(input, config);
  }, [input, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(processedResult);
    }, 500);

    return () => clearTimeout(timer);
  }, [processedResult]);

  const handleConfigChange = (key: keyof GitDiffConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleLoadSample = (type: keyof typeof SAMPLE_DIFFS) => {
    setInput(SAMPLE_DIFFS[type]);
  };

  const getDiffTypeDescription = (format: string) => {
    const descriptions = {
      unified: 'Standard unified diff format',
      context: 'Context diff with surrounding lines',
      'side-by-side': 'Side-by-side comparison view',
      inline: 'Inline changes with highlights',
      word: 'Word-level change detection',
      character: 'Character-level change detection'
    };
    return descriptions[format] || 'Diff format';
  };

  const optionGroups = [
    {
      title: 'Display Format',
      options: [
        {
          key: 'diffFormat' as const,
          label: 'Diff Format',
          type: 'select' as const,
          value: config.diffFormat,
          options: [
            { value: 'unified', label: 'Unified' },
            { value: 'context', label: 'Context' },
            { value: 'side-by-side', label: 'Side by Side' },
            { value: 'inline', label: 'Inline' },
            { value: 'word', label: 'Word Level' },
            { value: 'character', label: 'Character Level' }
          ]
        },
        {
          key: 'theme' as const,
          label: 'Color Theme',
          type: 'select' as const,
          value: config.theme,
          options: [
            { value: 'github', label: 'GitHub' },
            { value: 'gitlab', label: 'GitLab' },
            { value: 'bitbucket', label: 'Bitbucket' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' }
          ]
        },
        {
          key: 'outputFormat' as const,
          label: 'Output Format',
          type: 'select' as const,
          value: config.outputFormat,
          options: [
            { value: 'text', label: 'Text Report' },
            { value: 'html', label: 'HTML' },
            { value: 'markdown', label: 'Markdown' },
            { value: 'json', label: 'JSON' }
          ]
        }
      ]
    },
    {
      title: 'Display Options',
      options: [
        {
          key: 'showLineNumbers' as const,
          label: 'Show Line Numbers',
          type: 'checkbox' as const,
          value: config.showLineNumbers
        },
        {
          key: 'highlightSyntax' as const,
          label: 'Syntax Highlighting',
          type: 'checkbox' as const,
          value: config.highlightSyntax
        },
        {
          key: 'showWhitespace' as const,
          label: 'Show Whitespace',
          type: 'checkbox' as const,
          value: config.showWhitespace
        },
        {
          key: 'ignoreWhitespace' as const,
          label: 'Ignore Whitespace',
          type: 'checkbox' as const,
          value: config.ignoreWhitespace
        },
        {
          key: 'wordWrap' as const,
          label: 'Word Wrap',
          type: 'checkbox' as const,
          value: config.wordWrap
        }
      ]
    },
    {
      title: 'Analysis Options',
      options: [
        {
          key: 'statisticsLevel' as const,
          label: 'Statistics Level',
          type: 'select' as const,
          value: config.statisticsLevel,
          options: [
            { value: 'basic', label: 'Basic' },
            { value: 'detailed', label: 'Detailed' },
            { value: 'comprehensive', label: 'Comprehensive' }
          ]
        },
        {
          key: 'includeMetadata' as const,
          label: 'Include Metadata',
          type: 'checkbox' as const,
          value: config.includeMetadata
        },
        {
          key: 'detectRenames' as const,
          label: 'Detect Renames',
          type: 'checkbox' as const,
          value: config.detectRenames
        },
        {
          key: 'detectCopies' as const,
          label: 'Detect Copies',
          type: 'checkbox' as const,
          value: config.detectCopies
        }
      ]
    },
    {
      title: 'Advanced Options',
      options: [
        {
          key: 'contextLines' as const,
          label: 'Context Lines',
          type: 'number' as const,
          value: config.contextLines,
          min: 0,
          max: 10
        },
        {
          key: 'binaryFileHandling' as const,
          label: 'Binary File Handling',
          type: 'select' as const,
          value: config.binaryFileHandling,
          options: [
            { value: 'skip', label: 'Skip Binary Files' },
            { value: 'basic', label: 'Basic Info Only' },
            { value: 'detailed', label: 'Detailed Analysis' }
          ]
        },
        {
          key: 'maxFileSize' as const,
          label: 'Max File Size (bytes)',
          type: 'number' as const,
          value: config.maxFileSize,
          min: 1000,
          max: 10000000,
          step: 1000
        }
      ]
    }
  ];

  const getOutputLanguage = () => {
    switch (config.outputFormat) {
      case 'json': return 'json';
      case 'html': return 'html';
      case 'markdown': return 'markdown';
      default: return 'text';
    }
  };

  const getFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = config.outputFormat === 'json' ? 'json' : 
                     config.outputFormat === 'html' ? 'html' :
                     config.outputFormat === 'markdown' ? 'md' : 'txt';
    return `git-diff-analysis-${timestamp}.${extension}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="space-y-4">
          <InputPanel
            title="Git Diff Content"
            value={input}
            onChange={setInput}
            placeholder="Paste your git diff output here..."
            language="diff"
            showLineNumbers
          />
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLoadSample('feature')}
              className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Feature Example
            </button>
            <button
              onClick={() => handleLoadSample('bugfix')}
              className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Bug Fix Example
            </button>
            <button
              onClick={() => handleLoadSample('refactor')}
              className="px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Refactor Example
            </button>
            <button
              onClick={() => handleLoadSample('test')}
              className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Test Example
            </button>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Format Info</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {getDiffTypeDescription(config.diffFormat)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Context lines: {config.contextLines} | Theme: {config.theme}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <OutputPanel
          title="Diff Analysis"
          value={result?.output || ''}
          language={getOutputLanguage()}
          error={result?.error}
          showCopy
          showDownload
          filename={getFilename()}
        />
        
        {result?.warnings && result.warnings.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Analysis Warnings:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {result?.diffAnalysis?.insights?.risks && result.diffAnalysis.insights.risks.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              ⚠️ Identified Risks ({result.diffAnalysis.insights.risks.length})
            </h4>
            <div className="space-y-2">
              {result.diffAnalysis.insights.risks.slice(0, 3).map((risk, index) => (
                <div key={index} className="text-sm text-red-700 dark:text-red-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{risk.type}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      risk.severity === 'critical' ? 'bg-red-600 text-white' :
                      risk.severity === 'high' ? 'bg-orange-500 text-white' :
                      risk.severity === 'medium' ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="mt-1">{risk.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <OptionsPanel
          title="Diff Configuration"
          optionGroups={optionGroups}
          onChange={handleConfigChange}
        />

        {result?.diffAnalysis?.statistics && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Change Statistics</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Files Changed:</span>
                <span className="font-medium">{result.diffAnalysis.metadata.totalFiles}</span>
              </div>
              <div className="flex justify-between">
                <span>Lines Added:</span>
                <span className="font-medium text-green-600">+{result.diffAnalysis.statistics.totalLinesAdded}</span>
              </div>
              <div className="flex justify-between">
                <span>Lines Deleted:</span>
                <span className="font-medium text-red-600">-{result.diffAnalysis.statistics.totalLinesDeleted}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Change:</span>
                <span className={`font-medium ${
                  result.diffAnalysis.statistics.netLineChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.diffAnalysis.statistics.netLineChange >= 0 ? '+' : ''}{result.diffAnalysis.statistics.netLineChange}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Processing Time:</span>
                <span className="font-medium">{result.diffAnalysis.metadata.processingTime.toFixed(1)}ms</span>
              </div>
            </div>
          </div>
        )}

        {result?.diffAnalysis?.summary && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">Change Summary</h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex justify-between">
                <span>Change Type:</span>
                <span className="font-medium capitalize">{result.diffAnalysis.summary.changeType}</span>
              </div>
              <div className="flex justify-between">
                <span>Impact Level:</span>
                <span className={`font-medium px-2 py-1 text-xs rounded ${
                  result.diffAnalysis.summary.impact === 'critical' ? 'bg-red-600 text-white' :
                  result.diffAnalysis.summary.impact === 'high' ? 'bg-orange-500 text-white' :
                  result.diffAnalysis.summary.impact === 'medium' ? 'bg-yellow-500 text-black' :
                  'bg-green-500 text-white'
                }`}>
                  {result.diffAnalysis.summary.impact.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <span className={`font-medium ${
                  result.diffAnalysis.summary.riskLevel === 'high' ? 'text-red-600' :
                  result.diffAnalysis.summary.riskLevel === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {result.diffAnalysis.summary.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Complexity:</span>
                <span className="font-medium">{result.diffAnalysis.summary.complexity}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Review Time:</span>
                <span className="font-medium">{result.diffAnalysis.summary.reviewTime} minutes</span>
              </div>
            </div>
          </div>
        )}

        {result?.diffAnalysis?.insights?.codeQuality && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">Code Quality</h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <div className="flex justify-between">
                <span>Quality Score:</span>
                <span className="font-medium">{result.diffAnalysis.insights.codeQuality.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Issues Found:</span>
                <span className="font-medium">{result.diffAnalysis.insights.codeQuality.issues.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Complexity:</span>
                <span className="font-medium">{result.diffAnalysis.insights.codeQuality.metrics.cyclomaticComplexity}</span>
              </div>
              <div className="flex justify-between">
                <span>Maintainability:</span>
                <span className="font-medium">{result.diffAnalysis.insights.codeQuality.metrics.maintainabilityIndex}/100</span>
              </div>
            </div>
          </div>
        )}

        {result?.diffAnalysis?.insights?.testCoverage && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">Test Coverage</h3>
            <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
              <div className="flex justify-between">
                <span>Test Files Changed:</span>
                <span className="font-medium">{result.diffAnalysis.insights.testCoverage.testFilesChanged}</span>
              </div>
              <div className="flex justify-between">
                <span>New Tests Added:</span>
                <span className="font-medium">{result.diffAnalysis.insights.testCoverage.newTestsAdded}</span>
              </div>
              <div className="flex justify-between">
                <span>Coverage Impact:</span>
                <span className={`font-medium ${
                  result.diffAnalysis.insights.testCoverage.testCoverageImpact === 'positive' ? 'text-green-600' :
                  result.diffAnalysis.insights.testCoverage.testCoverageImpact === 'negative' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {result.diffAnalysis.insights.testCoverage.testCoverageImpact.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}