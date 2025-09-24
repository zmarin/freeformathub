import { useState, useEffect, useMemo, useCallback } from 'react';
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (input.trim()) processInput(input, config);
            break;
          case '1':
            e.preventDefault();
            handlePreset('conservative');
            break;
          case '2':
            e.preventDefault();
            handlePreset('standard');
            break;
          case '3':
            e.preventDefault();
            handlePreset('aggressive');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [input, config, processInput]);

  return (
    <div className={`${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)', alignItems: 'center' }}>
          {/* Primary Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <button onClick={() => handlePreset('conservative')} className="btn btn-secondary" title="Safe minification (Ctrl+1)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Safe
            </button>

            <button onClick={() => handlePreset('standard')} className="btn btn-primary" title="Standard minification (Ctrl+2)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              Standard
            </button>

            <button onClick={() => handlePreset('aggressive')} className="btn btn-outline" title="Maximum minification (Ctrl+3)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Maximum
            </button>

            <button onClick={() => handleQuickExample('basic')} className="btn btn-outline" title="Load basic example">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Example
            </button>
          </div>

          {/* Stats & Settings */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
            {metadata && (
              <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <span>Size: <strong>{metadata.originalSize.toLocaleString()}B</strong></span>
                <span>Minified: <strong>{metadata.minifiedSize.toLocaleString()}B</strong></span>
                <span>Saved: <strong>{metadata.compressionRatio.toFixed(1)}%</strong></span>
                <span>Time: <strong>{metadata.processingTime}ms</strong></span>
                {error ? (
                  <span className="status-indicator status-invalid">✗ Error</span>
                ) : output ? (
                  <span className="status-indicator status-valid">✓ Minified</span>
                ) : isProcessing ? (
                  <span className="status-indicator status-loading">… Processing</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid-responsive md:grid-cols-1" style={{
        // Responsive grid handled by CSS class

        minHeight: '500px'
      }}>
        {/* Input Panel */}
        <div style={{ position: 'relative', borderRight: '1px solid var(--color-border)' }} className="md:border-r-0 md:border-b md:border-b-gray-200">
          {/* Input Header */}
          <div className="grid-responsive" style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              HTML Code
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setInput(text);
                } catch (error) {
                  console.warn('Failed to paste from clipboard');
                }
              }} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Paste
              </button>
              {input && (
                <button onClick={() => setInput('')} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div style={{ position: 'relative', height: '500px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter HTML code to minify..."
              className="form-textarea grid-responsive" style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 0,
                fontFamily: 'var(--font-family-mono)',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'none',
                padding: 'var(--space-lg)'
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div style={{ position: 'relative' }}>
          {/* Output Header */}
          <div className="grid-responsive" style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Minified HTML
              {isProcessing && <span style={{ marginLeft: 'var(--space-sm)', fontSize: '0.75rem', color: 'var(--color-primary)' }}>Minifying...</span>}
            </span>
            {output && (
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(output);
                    } catch (error) {
                      console.error('Failed to copy:', error);
                    }
                  }}
                  className="btn btn-outline"
                  style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Copy
                </button>
                <button onClick={() => {
                  const blob = new Blob([output], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'minified.html';
                  a.click();
                  URL.revokeObjectURL(url);
                }} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Download
                </button>
              </div>
            )}
          </div>

          {/* Output Content */}
          <div style={{ height: '500px', position: 'relative' }}>
            {error ? (
              <div className="grid-responsive" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-lg)',
                margin: 'var(--space-lg)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap'
              }}>
                <strong>Minification Error:</strong><br />
                {error}
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="Minified HTML will appear here..."
                className="form-textarea grid-responsive" style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 0,
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'none',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface)'
                }}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Examples & Configuration - Collapsible */}
      <div className="grid-responsive" style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)'
      }}>
        <details className="group">
          <summary className="grid-responsive" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: 'var(--space-xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Examples & Configuration
            </div>
            <svg className="w-5 h-5 group-open:rotate-180 transition-transform" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div style={{ padding: 'var(--space-xl)' }}>
            {/* Quick Examples */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
              {[
                { key: 'basic', title: 'Basic HTML Page', icon: '📄' },
                { key: 'form', title: 'HTML Form', icon: '📝' },
                { key: 'email', title: 'Email Template', icon: '📧' },
                { key: 'spa', title: 'SPA Container', icon: '⚛️' },
                { key: 'aggressive', title: 'Aggressive Example', icon: '🚀' }
              ].map((example) => (
                <div key={example.key} className="card" style={{ padding: 'var(--space-lg)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                    {example.icon} {example.title}
                  </div>
                  <button
                    onClick={() => handleQuickExample(example.key as any)}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.875rem' }}
                  >
                    Try This Example
                  </button>
                </div>
              ))}
            </div>

            {/* Configuration Panel */}
            <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>Minification Options</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
                {allOptions.map((option) => (
                  <div key={option.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={!!config[option.key as keyof HtmlMinifierConfig]}
                        onChange={(e) => handleConfigChange(option.key, e.target.checked)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      {option.label}
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{option.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            {metadata && (
              <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>Minification Results</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>File Size</div>
                    <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                      {metadata.originalSize.toLocaleString()} → {metadata.minifiedSize.toLocaleString()} bytes
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Compression</div>
                    <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1rem', color: 'var(--color-success)' }}>
                      {metadata.compressionRatio.toFixed(1)}% saved
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Processing Time</div>
                    <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                      {metadata.processingTime}ms
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Elements Processed</div>
                    <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                      {metadata.processedElements}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-lg)', backgroundColor: 'var(--color-warning-light)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-warning)' }}>Warnings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {warnings.map((warning, index) => (
                    <div key={index} style={{ fontSize: '0.875rem', color: 'var(--color-warning)' }}>
                      ⚠️ {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      </div>

        {/* Minification Statistics Hidden */}

    </div>
  );
}