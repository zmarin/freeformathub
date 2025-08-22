import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { minifyCss, type CssMinifierConfig } from '../../../tools/web/css-minifier';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CssMinifierProps {
  className?: string;
}

const DEFAULT_CONFIG: CssMinifierConfig = {
  removeComments: true,
  removeWhitespace: true,
  removeSemicolons: true,
  removeEmptyRules: true,
  optimizeColors: true,
  optimizeZeros: true,
  mergeRules: false,
  preserveImportant: true,
};

const OPTIONS = [
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Remove /* */ comments (preserves /*! important comments)',
  },
  {
    key: 'removeWhitespace',
    label: 'Remove Whitespace',
    type: 'boolean' as const,
    default: true,
    description: 'Remove unnecessary spaces, tabs, and line breaks',
  },
  {
    key: 'removeSemicolons',
    label: 'Remove Trailing Semicolons',
    type: 'boolean' as const,
    default: true,
    description: 'Remove semicolons before closing braces',
  },
  {
    key: 'removeEmptyRules',
    label: 'Remove Empty Rules',
    type: 'boolean' as const,
    default: true,
    description: 'Remove CSS rules with no properties',
  },
  {
    key: 'optimizeColors',
    label: 'Optimize Colors',
    type: 'boolean' as const,
    default: true,
    description: 'Convert colors to shorter formats (#ffffff → #fff)',
  },
  {
    key: 'optimizeZeros',
    label: 'Optimize Zeros',
    type: 'boolean' as const,
    default: true,
    description: 'Remove units from zero values (0px → 0)',
  },
  {
    key: 'mergeRules',
    label: 'Merge Identical Rules',
    type: 'boolean' as const,
    default: false,
    description: 'Combine rules with identical selectors (experimental)',
  },
];

const SAMPLE_CSS = `/* Main Header Styles */
.header {
  background-color: #ffffff;
  margin: 10px 0px 0px 0px;
  padding: 20px;
  border: 0px solid black;
}

.header h1 {
  color: rgba(255, 0, 0, 1.0);
  font-size: 2.0rem;
  margin: 0.0em;
}

/* Navigation */
.nav {
  display: flex;
  gap: 10px;
}

.nav a {
  color: rgb(51, 51, 51);
  text-decoration: none;
  padding: 0.5rem 1.0rem;
}

.empty-rule {
  /* This rule is empty */
}

@media screen and (max-width: 768px) {
  .header {
    padding: 10px;
  }
  
  .nav {
    flex-direction: column;
  }
}`;

export function CssMinifier({ className = '' }: CssMinifierProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<CssMinifierConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ReturnType<typeof minifyCss> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToHistory } = useToolStore();

  const debouncedMinify = useMemo(
    () => debounce((value: string, config: CssMinifierConfig) => {
      if (!value.trim()) {
        setResult(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      try {
        const minificationResult = minifyCss(value, config);
        setResult(minificationResult);
        
        if (minificationResult.success && minificationResult.output) {
          addToHistory({
            tool: 'css-minifier',
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
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    debouncedMinify(input, config);
  }, [input, config, debouncedMinify]);

  const handleSampleClick = () => {
    setInput(SAMPLE_CSS);
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
    if (ratio >= 30) return 'text-green-600';
    if (ratio >= 20) return 'text-blue-600';
    if (ratio >= 10) return 'text-yellow-600';
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
            title="CSS Code"
            value={input}
            onChange={setInput}
            placeholder="Paste your CSS code here to minify it..."
            language="css"
            height="350px"
            onClear={handleClear}
            footer={
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={handleSampleClick}
                  className="text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 transition-colors"
                >
                  Try Sample CSS
                </button>
                {isProcessing && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Minifying CSS...
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
            title="Minified CSS"
            value={result?.output || ''}
            error={result?.error}
            language="css"
            height="350px"
            isLoading={isProcessing}
            showMetadata={true}
            metadata={result?.metadata}
            downloads={result?.success ? [
              {
                label: 'Download Minified CSS',
                filename: 'minified-styles.css',
                content: result.output || '',
                type: 'text/css'
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
                📊 Minification Results
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
                  <div className="text-gray-600 dark:text-gray-400 mb-2">CSS Analysis:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="font-medium text-blue-900 dark:text-blue-100">{result.metadata.rules}</div>
                      <div className="text-blue-600 dark:text-blue-300">Rules</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="font-medium text-green-900 dark:text-green-100">{result.metadata.selectors}</div>
                      <div className="text-green-600 dark:text-green-300">Selectors</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <div className="font-medium text-purple-900 dark:text-purple-100">{result.metadata.properties}</div>
                      <div className="text-purple-600 dark:text-purple-300">Properties</div>
                    </div>
                  </div>
                </div>

                {result.metadata.savedBytes > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      💾 Saved {formatBytes(result.metadata.savedBytes)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Faster loading and reduced bandwidth
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              🚀 Performance Benefits
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Faster page loading times</li>
              <li>• Reduced bandwidth usage</li>
              <li>• Better mobile performance</li>
              <li>• Improved SEO scores</li>
              <li>• Lower hosting costs</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
              💡 Minification Tips
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>• Use /*! for important comments</li>
              <li>• Test thoroughly after minification</li>
              <li>• Keep source files for editing</li>
              <li>• Combine with gzip compression</li>
              <li>• Minify during build process</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}