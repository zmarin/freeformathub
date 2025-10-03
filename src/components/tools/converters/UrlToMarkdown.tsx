import { useState } from 'react';
import { InputPanel, OutputPanel } from '../../ui';
import type { UrlToMarkdownConfig } from '../../../tools/converters/url-to-markdown';
import { htmlToMarkdown, toAIFriendlyFormat } from '../../../tools/converters/url-to-markdown';
import { useToolStore } from '../../../lib/store';

interface UrlToMarkdownProps {
  className?: string;
}

const DEFAULT_CONFIG: UrlToMarkdownConfig = {
  format: 'standard',
  includeMetadata: true,
  extractCodeBlocks: true,
  preserveLinks: true,
  includeImages: false,
};

export function UrlToMarkdown({ className = '' }: UrlToMarkdownProps) {
  const [url, setUrl] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<UrlToMarkdownConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  const handleConvert = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      setError('Invalid URL format. Please include protocol (http:// or https://)');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setOutput('');

    try {
      // Use WebFetch to get the HTML content
      // Since we're in the browser, we'll use a simple fetch first
      // If CORS blocks it, we'll show an appropriate message

      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FreeFormatHub/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

      // Convert HTML to Markdown
      let markdown = htmlToMarkdown(html, config);

      // Add frontmatter if requested
      if (config.includeMetadata) {
        const frontmatter = [
          '---',
          `url: ${url}`,
          pageTitle ? `title: ${pageTitle}` : null,
          `converted: ${new Date().toISOString()}`,
          '---',
          ''
        ].filter(Boolean).join('\n');

        markdown = frontmatter + '\n' + markdown;
      }

      // Convert to AI-friendly format if requested
      if (config.format === 'ai-friendly') {
        markdown = toAIFriendlyFormat(markdown, url, pageTitle);
      }

      setOutput(markdown);
      setError(undefined);

      // Save to history
      addToHistory({
        toolId: 'url-to-markdown',
        input: url,
        output: markdown,
        timestamp: Date.now()
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch URL';

      // Check if it's a CORS error
      if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        setError('⚠️ CORS Error: This website blocks cross-origin requests. Try using the browser extension or server-side proxy option.');
      } else {
        setError(`Error: ${errorMessage}`);
      }
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setOutput('');
    setError(undefined);
  };

  return (
    <div className={`url-to-markdown ${className}`}>
      {/* URL Input Section */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ padding: 'var(--space-lg)' }}>
          <label
            htmlFor="url-input"
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 'var(--space-sm)',
              color: 'var(--color-text-primary)'
            }}
          >
            Enter URL to Convert
          </label>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConvert()}
              placeholder="https://example.com/page"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: 'var(--space-md)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-family-mono)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            />

            <button
              onClick={handleConvert}
              disabled={isLoading || !url.trim()}
              className="btn btn-primary"
              style={{ minWidth: '120px' }}
            >
              {isLoading ? 'Converting...' : 'Convert'}
            </button>

            <button
              onClick={handleClear}
              disabled={isLoading}
              className="btn btn-outline"
            >
              Clear
            </button>
          </div>

          {/* Quick Examples */}
          <div style={{ marginTop: 'var(--space-md)' }}>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              Try these examples:
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
              {[
                'https://projects.zoho.com/api-docs',
                'https://en.wikipedia.org/wiki/Markdown',
                'https://github.com/anthropics/claude-code'
              ].map((exampleUrl) => (
                <button
                  key={exampleUrl}
                  onClick={() => setUrl(exampleUrl)}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem' }}
                  disabled={isLoading}
                >
                  {new URL(exampleUrl).hostname}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Options */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: 'var(--space-md)',
            color: 'var(--color-text-primary)'
          }}>
            Conversion Options
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            {/* Format Selection */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: 'var(--space-xs)',
                color: 'var(--color-text-primary)'
              }}>
                Output Format
              </label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value as 'standard' | 'ai-friendly' })}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="standard">Standard Markdown</option>
                <option value="ai-friendly">AI-Friendly (Structured)</option>
              </select>
            </div>

            {/* Boolean options */}
            {[
              { key: 'preserveLinks', label: 'Preserve Links' },
              { key: 'extractCodeBlocks', label: 'Extract Code Blocks' },
              { key: 'includeImages', label: 'Include Images' },
              { key: 'includeMetadata', label: 'Include Metadata' }
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={config[key as keyof UrlToMarkdownConfig] as boolean}
                  onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Output Section */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label={`Markdown Output (${config.format === 'ai-friendly' ? 'AI-Friendly' : 'Standard'})`}
        syntax="markdown"
        downloadFilename={`converted-${Date.now()}.md`}
        downloadContentType="text/markdown"
        showLineNumbers={true}
      />

      {/* Info Box */}
      {!output && !error && (
        <div className="card" style={{
          marginTop: 'var(--space-lg)',
          backgroundColor: 'var(--color-primary-light)',
          borderLeft: '4px solid var(--color-primary)'
        }}>
          <div style={{ padding: 'var(--space-lg)' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: 'var(--space-sm)',
              color: 'var(--color-primary)'
            }}>
              💡 How It Works
            </h4>
            <ul style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              marginLeft: 'var(--space-lg)',
              lineHeight: 1.6
            }}>
              <li>Enter any public webpage URL</li>
              <li>Choose between standard Markdown or AI-friendly structured format</li>
              <li>Click Convert to fetch and process the page</li>
              <li>Copy or download the generated Markdown</li>
            </ul>

            <div style={{
              marginTop: 'var(--space-md)',
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)'
            }}>
              <strong>Note:</strong> Some websites may block cross-origin requests (CORS).
              Static content converts best. JavaScript-heavy sites may not render completely.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
