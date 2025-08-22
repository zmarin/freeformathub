import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { minifyJs, type JsMinifierConfig } from '../../../tools/web/js-minifier';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JsMinifierProps {
  className?: string;
}

const DEFAULT_CONFIG: JsMinifierConfig = {
  removeComments: true,
  removeWhitespace: true,
  preserveNewlines: false,
  mangleNames: false,
  removeDebugger: true,
  removeConsole: false,
  preserveImportant: true,
  safeModeOnly: true,
};

const OPTIONS = [
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Remove // and /* */ comments (preserves /*! important)',
  },
  {
    key: 'removeWhitespace',
    label: 'Remove Whitespace',
    type: 'boolean' as const,
    default: true,
    description: 'Remove unnecessary spaces, tabs, and line breaks',
  },
  {
    key: 'preserveNewlines',
    label: 'Preserve Line Breaks',
    type: 'boolean' as const,
    default: false,
    description: 'Keep line breaks for better readability',
  },
  {
    key: 'removeDebugger',
    label: 'Remove Debugger Statements',
    type: 'boolean' as const,
    default: true,
    description: 'Remove debugger; statements from code',
  },
  {
    key: 'removeConsole',
    label: 'Remove Console Logs',
    type: 'boolean' as const,
    default: false,
    description: 'Remove console.log(), console.warn(), etc.',
  },
  {
    key: 'mangleNames',
    label: 'Mangle Variable Names',
    type: 'boolean' as const,
    default: false,
    description: 'Shorten variable names (experimental, use with caution)',
  },
  {
    key: 'safeModeOnly',
    label: 'Safe Mode Only',
    type: 'boolean' as const,
    default: true,
    description: 'Only apply safe optimizations that won\'t break code',
  },
];

const SAMPLE_JS = `/**
 * User Management System
 * @author John Doe
 */

class UserManager {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.cache = new Map();
    this.retryCount = 3;
  }

  // Fetch user data with caching
  async fetchUser(id) {
    console.log('Fetching user:', id);
    
    if (this.cache.has(id)) {
      console.log('Cache hit for user:', id);
      return this.cache.get(id);
    }

    try {
      const response = await fetch(\`\${this.apiUrl}/users/\${id}\`);
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      const user = await response.json();
      
      // Cache the result
      this.cache.set(id, user);
      
      debugger; // Remove this in production
      
      return user;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }

  // Batch fetch multiple users
  async fetchUsers(ids) {
    const promises = ids.map(id => this.fetchUser(id));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  }
}

// Initialize the user manager
const userManager = new UserManager('https://api.example.com');

// Export for use in other modules
export default userManager;`;

export function JsMinifier({ className = '' }: JsMinifierProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<JsMinifierConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ReturnType<typeof minifyJs> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToHistory } = useToolStore();

  const debouncedMinify = useMemo(
    () => debounce((value: string, config: JsMinifierConfig) => {
      if (!value.trim()) {
        setResult(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      try {
        const minificationResult = minifyJs(value, config);
        setResult(minificationResult);
        
        if (minificationResult.success && minificationResult.output) {
          addToHistory({
            tool: 'js-minifier',
            input: value,
            output: minificationResult.output,
            config
          });
        }
      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Minification failed'
        });
      } finally {
        setIsProcessing(false);
      }
    }, 400),
    [addToHistory]
  );

  useEffect(() => {
    debouncedMinify(input, config);
  }, [input, config, debouncedMinify]);

  const handleSampleClick = () => {
    setInput(SAMPLE_JS);
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getCompressionColor = () => {
    if (!result?.metadata?.compressionRatio) return 'text-gray-500';
    const ratio = result.metadata.compressionRatio;
    if (ratio >= 40) return 'text-green-600';
    if (ratio >= 30) return 'text-blue-600';
    if (ratio >= 20) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InputPanel
            title="JavaScript Code"
            value={input}
            onChange={setInput}
            placeholder="Paste your JavaScript code here to minify it..."
            language="javascript"
            height="400px"
            onClear={handleClear}
            footer={
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={handleSampleClick}
                  className="text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 transition-colors"
                >
                  Try Sample JavaScript
                </button>
                {isProcessing && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Minifying JavaScript...
                  </span>
                )}
                {result?.metadata && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Original: {formatBytes(result.metadata.originalSize)}
                  </span>
                )}
              </div>
            }
          />

          <OutputPanel
            title="Minified JavaScript"
            value={result?.output || ''}
            error={result?.error}
            language="javascript"
            height="400px"
            isLoading={isProcessing}
            showMetadata={true}
            metadata={result?.metadata}
            downloads={result?.success ? [
              {
                label: 'Download Minified JS',
                filename: 'minified-script.js',
                content: result.output || '',
                type: 'application/javascript'
              }
            ] : undefined}
          />
        </div>

        <div className="space-y-6">
          <OptionsPanel
            title="Minification Options"
            options={OPTIONS}
            values={config}
            onChange={handleConfigChange}
          />

          {result?.metadata && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                ⚡ Minification Results
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Size Reduction:</span>
                  <span className={`font-medium ${getCompressionColor()}`}>
                    {result.metadata.compressionRatio}%
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Original:</div>
                    <div className="font-mono">{formatBytes(result.metadata.originalSize)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Minified:</div>
                    <div className="font-mono text-green-600">{formatBytes(result.metadata.minifiedSize)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-gray-600 dark:text-gray-400 mb-2">Code Analysis:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="font-medium text-blue-900 dark:text-blue-100">{result.metadata.functions}</div>
                      <div className="text-blue-600 dark:text-blue-300">Functions</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="font-medium text-green-900 dark:text-green-100">{result.metadata.variables}</div>
                      <div className="text-green-600 dark:text-green-300">Variables</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <div className="font-medium text-purple-900 dark:text-purple-100">{result.metadata.lines}</div>
                      <div className="text-purple-600 dark:text-purple-300">Lines</div>
                    </div>
                  </div>
                </div>

                {result.metadata.savedBytes > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      💾 Saved {formatBytes(result.metadata.savedBytes)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Faster downloads and execution
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
              ⚠️ Important Warning
            </h3>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
              <li>• Always test minified code thoroughly</li>
              <li>• Keep original source for debugging</li>
              <li>• Variable mangling is experimental</li>
              <li>• Some features may break functionality</li>
              <li>• Use build tools for complex projects</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              🚀 Performance Benefits
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Faster script loading times</li>
              <li>• Reduced bandwidth usage</li>
              <li>• Better mobile performance</li>
              <li>• Improved page speed scores</li>
              <li>• Lower CDN costs</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Best Practices
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use /*! for license comments</li>
              <li>• Test in different environments</li>
              <li>• Enable source maps for debugging</li>
              <li>• Minify as part of build process</li>
              <li>• Combine with gzip compression</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}