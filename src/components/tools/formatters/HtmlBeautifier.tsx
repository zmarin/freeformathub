import { useState, useEffect, useMemo, useCallback } from 'react';
import { processHtmlBeautifier, type HtmlBeautifierConfig, type ValidationError } from '../../../tools/formatters/html-beautifier';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import { openFormatterInNewWindow } from '../../../lib/utils/window-manager';

interface HtmlBeautifierProps {
  className?: string;
}

const DEFAULT_CONFIG: HtmlBeautifierConfig = {
  mode: 'beautify',
  indentSize: 2,
  indentType: 'spaces',
  maxLineLength: 80,
  preserveComments: true,
  preserveEmptyLines: false,
  sortAttributes: false,
  removeTrailingSpaces: true,
  selfCloseTags: true,
  validateHtml: true,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'beautify',
    options: [
      { value: 'beautify', label: 'Beautify' },
      { value: 'minify', label: 'Minify' },
    ],
    description: 'Format or compress',
  },
  {
    key: 'indentSize',
    label: 'Indent',
    type: 'select' as const,
    default: 2,
    options: [
      { value: '2', label: '2 spaces' },
      { value: '4', label: '4 spaces' },
      { value: '0', label: 'Minified' },
    ],
    description: 'Indentation style',
  },
  {
    key: 'preserveComments',
    label: 'Preserve Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Keep HTML comments',
  },
  {
    key: 'validateHtml',
    label: 'Validate HTML',
    type: 'boolean' as const,
    default: true,
    description: 'Check for syntax errors',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'indentType',
    label: 'Indent Type',
    type: 'select' as const,
    default: 'spaces',
    options: [
      { value: 'spaces', label: 'Spaces' },
      { value: 'tabs', label: 'Tabs' },
    ],
    description: 'Use spaces or tabs for indentation',
    showWhen: (cfg: any) => Number(cfg.indentSize ?? 2) > 0,
  },
  {
    key: 'preserveEmptyLines',
    label: 'Preserve Empty Lines',
    type: 'boolean' as const,
    default: false,
    description: 'Keep empty lines in the formatted output',
  },
  {
    key: 'sortAttributes',
    label: 'Sort Attributes',
    type: 'boolean' as const,
    default: false,
    description: 'Sort HTML attributes alphabetically',
  },
  {
    key: 'removeTrailingSpaces',
    label: 'Remove Trailing Spaces',
    type: 'boolean' as const,
    default: true,
    description: 'Remove spaces at the end of lines',
  },
  {
    key: 'selfCloseTags',
    label: 'Self-Close Tags',
    type: 'boolean' as const,
    default: true,
    description: 'Add trailing slash to self-closing tags (XHTML style)',
  },
];

const EXAMPLES = [
  {
    title: 'Basic HTML Structure',
    value: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Page Title</title>
</head>
<body>
  <h1>Main Heading</h1>
  <p>Paragraph text</p>
</body>
</html>`,
  },
  {
    title: 'HTML with Form',
    value: `<form action="/submit" method="post">
<div class="form-group">
<label for="email">Email:</label>
<input type="email" id="email" name="email" required>
</div>
<div class="form-group">
<label for="message">Message:</label>
<textarea id="message" name="message"></textarea>
</div>
<button type="submit">Submit</button>
</form>`,
  },
  {
    title: 'Minified HTML',
    value: `<!DOCTYPE html><html><head><title>Example</title></head><body><div class="container"><h1>Hello World</h1><p>This is a paragraph with <strong>bold</strong> text.</p><ul><li>Item 1</li><li>Item 2</li></ul></div></body></html>`,
  },
  {
    title: 'HTML with Errors',
    value: `<div class="container">
  <p>Unclosed paragraph
  <span>Nested content</span>
  <img src="image.jpg" alt="Image">
</div>`,
  },
];

export function HtmlBeautifier({ className = '' }: HtmlBeautifierProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<HtmlBeautifierConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<{
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    lineCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
  } | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('html-beautifier') as Partial<HtmlBeautifierConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Convert string values from select to numbers for indentSize
  const processedConfig = useMemo(() => ({
    ...config,
    indentSize: parseInt(String(config.indentSize)) || 2,
  }), [config]);

  // Process HTML function
  const processHtml = useCallback((inputText: string = input, cfg: HtmlBeautifierConfig = processedConfig) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processHtmlBeautifier(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.stats);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'html-beautifier',
        input: inputText,
        output: result.output || '',
        config: cfg,
        timestamp: Date.now(),
      });
    } else {
      setOutput('');
      setError(result.error);
      setMetadata(undefined);
    }
    
    setIsLoading(false);
  }, [input, processedConfig, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processHtml, 500),
    [processHtml]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, processedConfig);
    }
  }, [input, processedConfig, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleBeautify = useCallback(() => {
    const beautifyConfig = { ...processedConfig, mode: 'beautify' as const, indentSize: 2 };
    setConfig(beautifyConfig);
    processHtml(input, beautifyConfig);
  }, [input, processedConfig, processHtml]);

  const handleMinify = useCallback(() => {
    const minifyConfig = { ...processedConfig, mode: 'minify' as const };
    setConfig(minifyConfig);
    processHtml(input, minifyConfig);
  }, [input, processedConfig, processHtml]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...processedConfig, validateHtml: true };
    setConfig(validateConfig);
    processHtml(input, validateConfig);
  }, [input, processedConfig, processHtml]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processHtml(content, processedConfig);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid HTML file.');
    }
  }, [autoFormat, processedConfig, processHtml]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [output]);

  // Download handler
  const handleDownload = useCallback(() => {
    const filename = config.mode === 'minify' ? 'formatted.min.html' : 'formatted.html';
    downloadFile(output, filename, 'text/html');
  }, [output, config.mode]);

  // Open in new window handler
  const handleOpenInNewWindow = useCallback(() => {
    const filename = config.mode === 'minify' ? 'formatted.min.html' : 'formatted.html';
    openFormatterInNewWindow(output, 'html', 'HTML Beautifier', filename);
  }, [output, config.mode]);

  // Paste handler
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      if (autoFormat) {
        processHtml(text, processedConfig);
      }
    } catch (error) {
      console.warn('Failed to paste from clipboard');
    }
  }, [autoFormat, processedConfig, processHtml]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(undefined);
    setMetadata(undefined);
  }, []);

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
            handleBeautify();
            break;
          case 'm':
            e.preventDefault();
            handleMinify();
            break;
          case 'l':
            e.preventDefault();
            handleClear();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleBeautify, handleMinify, handleClear]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: HtmlBeautifierConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('html-beautifier', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processHtml(input, { ...processedConfig, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

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
            <button onClick={handleBeautify} className="btn btn-primary" title="Beautify HTML (Ctrl+Enter)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              Beautify HTML
            </button>

            <button onClick={handleValidate} className="btn btn-secondary" title="Validate HTML">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
              </svg>
              Validate
            </button>

            <button onClick={handleMinify} className="btn btn-outline" title="Minify HTML (Ctrl+M)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Minify
            </button>

            <button onClick={handleClear} className="btn btn-outline" title="Clear all (Ctrl+L)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear
            </button>
          </div>

          {/* Stats & Settings */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <span>Size: <strong>{new Blob([input]).size.toLocaleString()} B</strong></span>
              <span>Lines: <strong>{input.split('\n').length}</strong></span>
              {metadata && (
                <>
                  <span>Processed: <strong>{metadata.processedSize.toLocaleString()} B</strong></span>
                  <span>Ratio: <strong>{(metadata.compressionRatio * 100).toFixed(1)}%</strong></span>
                </>
              )}
              {error ? (
                <span className="status-indicator status-invalid">✗ Invalid</span>
              ) : output ? (
                <span className="status-indicator status-valid">✓ Valid</span>
              ) : null}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={autoFormat}
                onChange={(e) => setAutoFormat(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Auto-format
            </label>
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
              HTML Input
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button onClick={handlePaste} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Paste
              </button>
              <label className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                Upload
                <input
                  type="file"
                  accept=".html,.htm,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Input Textarea */}
          <div
            style={{ position: 'relative', height: '500px' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your HTML here or drag & drop a file..."
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
            {dragActive && (
              <div className="grid-responsive" style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--color-primary)'
              }}>
                Drop HTML file here
              </div>
            )}
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
              {config.mode === 'beautify' ? 'Formatted' : 'Minified'} HTML
            </span>
            {output && (
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  onClick={handleCopy}
                  className={copied ? 'btn btn-secondary' : 'btn btn-outline'}
                  style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={copied ? "M9 12l2 2 4-4" : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"}/>
                  </svg>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleDownload} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Download
                </button>
                <button onClick={handleOpenInNewWindow} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Open in New Window
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
                <strong>HTML Error:</strong><br />
                {error}
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="Formatted HTML will appear here..."
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

        {/* Validation Results Panel (conditionally rendered) */}
        {metadata && !error && output && (metadata.errors.length > 0 || metadata.warnings.length > 0) && (
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', padding: 'var(--space-lg)', backgroundColor: 'var(--color-surface-secondary)' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>Validation Issues</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-lg)' }}>
              {metadata.errors.length > 0 && (
                <div className="card" style={{ padding: 'var(--space-lg)', borderLeft: '4px solid var(--color-danger)' }}>
                  <h5 style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Errors ({metadata.errors.length})</h5>
                  {metadata.errors.slice(0, 3).map((err, i) => (
                    <div key={i} style={{ marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                      <strong style={{ color: 'var(--color-danger)' }}>Line {err.line}:</strong> {err.message}
                    </div>
                  ))}
                  {metadata.errors.length > 3 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>+{metadata.errors.length - 3} more errors</div>
                  )}
                </div>
              )}
              {metadata.warnings.length > 0 && (
                <div className="card" style={{ padding: 'var(--space-lg)', borderLeft: '4px solid var(--color-warning)' }}>
                  <h5 style={{ color: 'var(--color-warning)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Warnings ({metadata.warnings.length})</h5>
                  {metadata.warnings.slice(0, 2).map((warn, i) => (
                    <div key={i} style={{ marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                      <strong style={{ color: 'var(--color-warning)' }}>Line {warn.line}:</strong> {warn.message}
                    </div>
                  ))}
                  {metadata.warnings.length > 2 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>+{metadata.warnings.length - 2} more warnings</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Examples & Options - Collapsible */}
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
              Quick Examples & Options
            </div>
            <svg className="w-5 h-5 group-open:rotate-180 transition-transform" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div style={{ padding: 'var(--space-xl)' }}>
            {/* Examples */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-lg)', color: 'var(--color-text-primary)' }}>Examples</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                {EXAMPLES.map((example, idx) => (
                  <div key={idx} className="card" style={{ padding: 'var(--space-lg)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                      {example.title}
                    </div>
                    <div className="grid-responsive" style={{
                      backgroundColor: 'var(--color-surface-secondary)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.75rem',
                      marginBottom: 'var(--space-md)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {example.value.substring(0, 50)}...
                    </div>
                    <button
                      onClick={() => setInput(example.value)}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.875rem' }}
                    >
                      Try This Example
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-lg)', color: 'var(--color-text-primary)' }}>Configuration Options</h4>

              {/* Essential options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                {ESSENTIAL_OPTIONS.map((option) => (
                  <div key={option.key} className="card" style={{ padding: 'var(--space-lg)' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof HtmlBeautifierConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <>
                        <select
                          value={String(config[option.key as keyof HtmlBeautifierConfig] ?? option.default)}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                          className="form-select"
                          style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                        >
                          {option.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                          {option.description}
                        </p>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Advanced options toggle */}
              <details className="group" style={{ marginTop: 'var(--space-lg)' }}>
                <summary className="grid-responsive" style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)'
                }}>
                  Advanced Options
                  <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
                  {ADVANCED_OPTIONS.filter(option => !option.showWhen || option.showWhen(config)).map((option) => (
                    <div key={option.key} className="card" style={{ padding: 'var(--space-lg)' }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                        {option.label}
                      </label>
                      {option.type === 'boolean' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!config[option.key as keyof HtmlBeautifierConfig]}
                            onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                            style={{ accentColor: 'var(--color-primary)' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {option.description}
                          </span>
                        </label>
                      ) : option.type === 'select' ? (
                        <>
                          <select
                            value={String(config[option.key as keyof HtmlBeautifierConfig] ?? option.default)}
                            onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                            className="form-select"
                            style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                          >
                            {option.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                            {option.description}
                          </p>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}