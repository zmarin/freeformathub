import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processHtmlMinifier, type HtmlMinifierConfig } from '../../../tools/web/html-minifier';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface HtmlMinifierProps {
  className?: string;
}

const DEFAULT_CONFIG: HtmlMinifierConfig = {
  removeComments: true,
  removeCommentsFromCDATA: true,
  preserveLineBreaks: false,
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeEmptyElements: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  sortAttributes: false,
  sortClassName: false,
  minifyCSS: true,
  minifyJS: true,
  removeOptionalTags: false,
  removeAttributeQuotes: false,
  caseSensitive: false,
  keepClosingSlash: false,
  decodeEntities: false,
  processScripts: true,
  processConditionalComments: true,
  trimCustomFragments: false,
  ignoreCustomComments: false,
  maxLineLength: 0,
  customAttrAssign: false,
  customAttrSurround: false,
  removeTagWhitespace: true,
};

const BASIC_OPTIONS = [
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove HTML comments (<!-- -->)',
  },
  {
    key: 'collapseWhitespace',
    label: 'Collapse Whitespace',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove unnecessary whitespace between elements',
  },
  {
    key: 'conservativeCollapse',
    label: 'Conservative Collapse',
    type: 'checkbox' as const,
    default: false,
    description: 'More careful whitespace removal to preserve formatting',
  },
  {
    key: 'removeEmptyElements',
    label: 'Remove Empty Elements',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove elements with no content (preserves meaningful empty elements)',
  },
] as const;

const ATTRIBUTE_OPTIONS = [
  {
    key: 'removeRedundantAttributes',
    label: 'Remove Redundant Attributes',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove attributes with default values (e.g., type="text/javascript")',
  },
  {
    key: 'removeEmptyAttributes',
    label: 'Remove Empty Attributes',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove attributes with empty values',
  },
  {
    key: 'removeScriptTypeAttributes',
    label: 'Remove Script Type Attributes',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove type="text/javascript" from script tags',
  },
  {
    key: 'removeStyleLinkTypeAttributes',
    label: 'Remove Style/Link Type Attributes',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove type="text/css" from style and link tags',
  },
  {
    key: 'sortAttributes',
    label: 'Sort Attributes',
    type: 'checkbox' as const,
    default: false,
    description: 'Sort attributes alphabetically within each tag',
  },
  {
    key: 'removeAttributeQuotes',
    label: 'Remove Attribute Quotes',
    type: 'checkbox' as const,
    default: false,
    description: 'Remove quotes from attributes when safe to do so',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'useShortDoctype',
    label: 'Use Short DOCTYPE',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert to <!DOCTYPE html>',
  },
  {
    key: 'removeOptionalTags',
    label: 'Remove Optional Tags',
    type: 'checkbox' as const,
    default: false,
    description: '⚠️ Remove html, head, body tags (advanced - test carefully)',
  },
  {
    key: 'minifyCSS',
    label: 'Minify Inline CSS',
    type: 'checkbox' as const,
    default: true,
    description: 'Minify CSS inside <style> tags',
  },
  {
    key: 'minifyJS',
    label: 'Minify Inline JavaScript',
    type: 'checkbox' as const,
    default: true,
    description: 'Minify JavaScript inside <script> tags',
  },
  {
    key: 'processConditionalComments',
    label: 'Preserve IE Conditional Comments',
    type: 'checkbox' as const,
    default: true,
    description: 'Keep IE conditional comments (<!--[if IE]-->)',
  },
  {
    key: 'trimCustomFragments',
    label: 'Process Template Fragments',
    type: 'checkbox' as const,
    default: false,
    description: 'Minify template syntax like {{ }} or {% %}',
  },
] as const;

export function HtmlMinifier({ className = '' }: HtmlMinifierProps) {
  const [input, setInput] = useState(`<!DOCTYPE html>
<html>
  <head>
    <title>Sample HTML Page</title>
    <!-- This is a comment -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style type="text/css">
      body {
        margin: 0;
        padding: 20px;
        font-family: Arial, sans-serif;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to My Website</h1>
      <p>This is a sample paragraph with some text.</p>
      
      <div class="">
        <!-- Empty div with empty class -->
      </div>
      
      <form method="get">
        <input type="text" value="" placeholder="Enter text" />
        <button type="submit">Submit</button>
      </form>
      
      <script type="text/javascript">
        // JavaScript comment
        console.log('Hello World');
        function greet() {
          return 'Hello!';
        }
      </script>
    </div>
  </body>
</html>`);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<HtmlMinifierConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: HtmlMinifierConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processHtmlMinifier(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setMetadata(result.metadata);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'html-minifier',
            input: currentInput.substring(0, 100) + (currentInput.length > 100 ? '...' : ''),
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to minify HTML');
          setOutput('');
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during HTML minification');
        setOutput('');
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('html-minifier');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'basic' | 'form' | 'email' | 'spa' | 'aggressive') => {
    const examples = {
      basic: `<!DOCTYPE html>
<html>
  <head>
    <title>Simple Page</title>
    <!-- Page comment -->
    <style type="text/css">
      .header { color: #333; }
    </style>
  </head>
  <body>
    <h1>Hello World</h1>
    <p>Simple paragraph.</p>
  </body>
</html>`,
      
      form: `<form method="get" action="">
  <div class="">
    <label for="name">Name:</label>
    <input type="text" id="name" value="" required />
  </div>
  <div class="">
    <label for="email">Email:</label>
    <input type="email" id="email" value="" />
  </div>
  <button type="submit">Submit Form</button>
</form>`,

      email: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
  <head>
    <meta charset="UTF-8">
    <title>Email Template</title>
  </head>
  <body>
    <table width="600" style="margin: 0 auto;">
      <tr>
        <td style="padding: 20px;">
          <!-- Email content -->
          <h1 style="color: #333;">Newsletter</h1>
          <p>Email content here.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,

      spa: `<div id="app">
  <!-- React/Vue app container -->
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Loading application...</p>
  </div>
  
  <script type="text/javascript">
    // App initialization
    window.APP_CONFIG = {
      apiUrl: 'https://api.example.com',
      debug: false
    };
  </script>
</div>`,

      aggressive: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aggressive Minification Test</title>
    <link rel="stylesheet" type="text/css" href="styles.css">
  </head>
  <body>
    <div class="container">
      <header class="header">
        <h1>Website Title</h1>
      </header>
      <main class="content">
        <p>Content goes here.</p>
      </main>
    </div>
  </body>
</html>`
    };
    
    setInput(examples[type]);
    
    // Adjust config for different examples
    if (type === 'aggressive') {
      setConfig(prev => ({ 
        ...prev, 
        removeOptionalTags: true, 
        removeAttributeQuotes: true,
        sortAttributes: true 
      }));
    } else if (type === 'email') {
      setConfig(prev => ({ 
        ...prev, 
        useShortDoctype: false,
        removeOptionalTags: false,
        conservativeCollapse: true
      }));
    }
  };

  const handlePreset = (preset: 'conservative' | 'standard' | 'aggressive') => {
    const presets = {
      conservative: {
        ...DEFAULT_CONFIG,
        conservativeCollapse: true,
        removeEmptyElements: false,
        removeOptionalTags: false,
        removeAttributeQuotes: false,
        minifyCSS: false,
        minifyJS: false,
      },
      standard: DEFAULT_CONFIG,
      aggressive: {
        ...DEFAULT_CONFIG,
        removeOptionalTags: true,
        removeAttributeQuotes: true,
        sortAttributes: true,
        trimCustomFragments: true,
      }
    };
    
    setConfig(presets[preset]);
  };

  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...ATTRIBUTE_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  const compressionRatio = metadata ? metadata.compressionRatio : 0;
  const isHighCompression = compressionRatio > 20;
  const isLowCompression = compressionRatio < 5;

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Preset Configurations */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Presets</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePreset('conservative')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              🛡️ Safe
            </button>
            <button
              onClick={() => handlePreset('standard')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              ⚖️ Standard
            </button>
            <button
              onClick={() => handlePreset('aggressive')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            >
              🚀 Max
            </button>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('basic')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              📄 Basic HTML Page
            </button>
            <button
              onClick={() => handleQuickExample('form')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📝 HTML Form
            </button>
            <button
              onClick={() => handleQuickExample('email')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              📧 Email Template
            </button>
            <button
              onClick={() => handleQuickExample('spa')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              ⚛️ SPA Container
            </button>
            <button
              onClick={() => handleQuickExample('aggressive')}
              className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-left"
            >
              🚀 Aggressive Example
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Minification Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Minification Statistics */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Compression Stats</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="grid gap-1">
                <div>
                  <span className="text-blue-600">Original Size:</span>
                  <span className="ml-1 font-medium text-blue-800">
                    {metadata.originalSize.toLocaleString()} bytes
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Minified Size:</span>
                  <span className="ml-1 font-medium text-blue-800">
                    {metadata.minifiedSize.toLocaleString()} bytes
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Savings:</span>
                  <span className={`ml-1 font-medium ${
                    isHighCompression ? 'text-green-800' : 
                    isLowCompression ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {metadata.savings.toLocaleString()} bytes ({metadata.compressionRatio.toFixed(1)}%)
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Elements:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.processedElements}</span>
                </div>
                <div>
                  <span className="text-blue-600">Processing:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.processingTime}ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Details */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Optimizations Applied</h3>
            <div className="space-y-2">
              {metadata.removedComments > 0 && (
                <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Comments Removed:</span>
                  <span className="text-gray-800 font-medium">{metadata.removedComments}</span>
                </div>
              )}
              {metadata.removedWhitespace > 0 && (
                <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Whitespace Saved:</span>
                  <span className="text-gray-800 font-medium">{metadata.removedWhitespace} chars</span>
                </div>
              )}
              {metadata.removedEmptyElements > 0 && (
                <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Empty Elements:</span>
                  <span className="text-gray-800 font-medium">{metadata.removedEmptyElements}</span>
                </div>
              )}
              {metadata.removedAttributes > 0 && (
                <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Attributes Cleaned:</span>
                  <span className="text-gray-800 font-medium">{metadata.removedAttributes}</span>
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

        {/* Performance Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Performance Tips</h3>
          <div className="text-xs space-y-1">
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800 mb-1">Best Practices</div>
              <div className="text-gray-600 space-y-1">
                <div>• Always test minified HTML in target browsers</div>
                <div>• Use gzip compression on your web server</div>
                <div>• Consider separate CSS/JS files for large amounts</div>
                <div>• Be cautious with removing optional tags</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="HTML Code"
          value={input}
          onChange={setInput}
          placeholder="Enter HTML code to minify..."
          language="html"
        />

        <OutputPanel
          title="Minified HTML"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="html"
          placeholder="Minified HTML will appear here..."
          processingMessage="Minifying HTML..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Minified
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'minified.html';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download HTML
                </button>
                {metadata && (
                  <button
                    onClick={() => {
                      const report = `HTML Minification Report
Generated: ${new Date().toISOString()}

Original Size: ${metadata.originalSize.toLocaleString()} bytes
Minified Size: ${metadata.minifiedSize.toLocaleString()} bytes
Savings: ${metadata.savings.toLocaleString()} bytes (${metadata.compressionRatio.toFixed(1)}%)
Processing Time: ${metadata.processingTime}ms

Optimizations Applied:
- Comments Removed: ${metadata.removedComments}
- Whitespace Saved: ${metadata.removedWhitespace} characters
- Empty Elements Removed: ${metadata.removedEmptyElements}
- Attributes Cleaned: ${metadata.removedAttributes}
- Elements Processed: ${metadata.processedElements}

${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}`;
                      
                      navigator.clipboard?.writeText(report);
                    }}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    📊 Copy Report
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}