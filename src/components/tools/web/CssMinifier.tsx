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
                  
                >
                  Try Sample CSS
                </button>
                {isProcessing && (
                  <span >
                    Minifying CSS...
                  </span>
                )}
                {result?.metadata && (
                  <span >
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
            <div >
              <h3 >
                📊 Minification Results
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span >Size Reduction:</span>
                  <span className={`font-medium ${getCompressionColor()}`}>
                    {result.metadata.compressionRatio}%
                  </span>
                </div>
                
                <div >
                  <div>
                    <div >Original:</div>
                    <div className="font-mono">{formatBytes(result.metadata.originalSize)}</div>
                  </div>
                  <div>
                    <div >Minified:</div>
                    <div className="font-mono text-green-600">{formatBytes(result.metadata.minifiedSize)}</div>
                  </div>
                </div>

                <div >
                  <div >CSS Analysis:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div >
                      <div >{result.metadata.rules}</div>
                      <div >Rules</div>
                    </div>
                    <div >
                      <div >{result.metadata.selectors}</div>
                      <div >Selectors</div>
                    </div>
                    <div >
                      <div >{result.metadata.properties}</div>
                      <div >Properties</div>
                    </div>
                  </div>
                </div>

                {result.metadata.savedBytes > 0 && (
                  <div >
                    <div >
                      💾 Saved {formatBytes(result.metadata.savedBytes)}
                    </div>
                    <div >
                      Faster loading and reduced bandwidth
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div >
            <h3 >
              🚀 Performance Benefits
            </h3>
            <ul >
              <li>• Faster page loading times</li>
              <li>• Reduced bandwidth usage</li>
              <li>• Better mobile performance</li>
              <li>• Improved SEO scores</li>
              <li>• Lower hosting costs</li>
            </ul>
          </div>

          <div >
            <h3 >
              💡 Minification Tips
            </h3>
            <ul >
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