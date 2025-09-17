/**
 * Utilities for managing new windows and formatted output display
 */

export interface WindowOptions {
  title: string;
  width?: number;
  height?: number;
  center?: boolean;
}

export interface FormattedContent {
  content: string;
  language: string;
  filename?: string;
  title?: string;
}

/**
 * Open content in a new window with professional formatting
 */
export function openInNewWindow(formattedContent: FormattedContent, options: WindowOptions = { title: 'Formatted Output' }): void {
  const htmlContent = generateFormattedHtml(formattedContent);

  // Calculate window position for centering
  let windowFeatures = '';
  if (options.width || options.height) {
    const width = options.width || 800;
    const height = options.height || 600;

    if (options.center) {
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      windowFeatures = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;
    } else {
      windowFeatures = `width=${width},height=${height},scrollbars=yes,resizable=yes`;
    }
  } else {
    windowFeatures = 'scrollbars=yes,resizable=yes';
  }

  try {
    const newWindow = window.open('', '_blank', windowFeatures);
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      newWindow.focus();
    } else {
      // Fallback: use blob URL
      openWithBlobUrl(htmlContent);
    }
  } catch (error) {
    console.error('Failed to open new window:', error);
    // Fallback: use blob URL
    openWithBlobUrl(htmlContent);
  }
}

/**
 * Fallback method using blob URL
 */
function openWithBlobUrl(htmlContent: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');

  // Cleanup the blob URL after a short delay
  if (newWindow) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Generate a complete HTML document with syntax highlighting and professional styling
 */
function generateFormattedHtml(formattedContent: FormattedContent): string {
  const { content, language, filename, title } = formattedContent;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Formatted Output'} - FreeFormatHub</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css">
    <style>
        /* Modern styling with CSS variables */
        :root {
            --color-background: #ffffff;
            --color-surface: #f8fafc;
            --color-border: #e2e8f0;
            --color-text-primary: #1e293b;
            --color-text-secondary: #64748b;
            --color-primary: #3b82f6;
            --space-sm: 0.5rem;
            --space-md: 1rem;
            --space-lg: 1.5rem;
            --space-xl: 2rem;
            --radius-lg: 0.5rem;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --color-background: #0f172a;
                --color-surface: #1e293b;
                --color-border: #334155;
                --color-text-primary: #f8fafc;
                --color-text-secondary: #cbd5e1;
            }
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: var(--color-background);
            color: var(--color-text-primary);
        }

        .header {
            background-color: var(--color-surface);
            border-bottom: 1px solid var(--color-border);
            padding: var(--space-lg) var(--space-xl);
            position: sticky;
            top: 0;
            z-index: 10;
            box-shadow: var(--shadow-sm);
        }

        .header h1 {
            margin: 0 0 var(--space-sm) 0;
            font-size: 1.5rem;
            color: var(--color-text-primary);
        }

        .header .subtitle {
            margin: 0;
            font-size: 0.875rem;
            color: var(--color-text-secondary);
        }

        .header .subtitle a {
            color: var(--color-primary);
            text-decoration: none;
        }

        .header .subtitle a:hover {
            text-decoration: underline;
        }

        .toolbar {
            background-color: var(--color-surface);
            border-bottom: 1px solid var(--color-border);
            padding: var(--space-md) var(--space-xl);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: var(--space-md);
        }

        .toolbar-info {
            display: flex;
            align-items: center;
            gap: var(--space-lg);
            font-size: 0.875rem;
            color: var(--color-text-secondary);
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-sm) var(--space-md);
            background-color: var(--color-primary);
            color: var(--color-background);
            border: none;
            border-radius: var(--radius-lg);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            transition: all 150ms ease;
        }

        .btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .btn-outline {
            background-color: transparent;
            color: var(--color-text-primary);
            border: 1px solid var(--color-border);
        }

        .btn-outline:hover {
            background-color: var(--color-surface);
        }

        .content {
            padding: var(--space-xl);
            max-width: 100%;
            overflow-x: auto;
        }

        .code-container {
            background-color: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }

        pre {
            margin: 0;
            padding: var(--space-lg);
            overflow-x: auto;
            font-family: 'Monaco', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            white-space: pre;
        }

        code {
            font-family: inherit;
        }

        .line-numbers {
            background-color: var(--color-background);
            border-right: 1px solid var(--color-border);
            color: var(--color-text-secondary);
            padding: var(--space-lg) var(--space-md);
            font-size: 0.75rem;
            line-height: 1.5;
            user-select: none;
            min-width: 3rem;
            text-align: right;
        }

        .code-with-lines {
            display: flex;
            align-items: flex-start;
        }

        .code-content {
            flex: 1;
            min-width: 0;
        }

        .footer {
            margin-top: var(--space-xl);
            padding: var(--space-lg) var(--space-xl);
            border-top: 1px solid var(--color-border);
            background-color: var(--color-surface);
            text-align: center;
            font-size: 0.875rem;
            color: var(--color-text-secondary);
        }

        .footer a {
            color: var(--color-primary);
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        /* Print styles */
        @media print {
            .header, .toolbar, .footer {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact;
            }

            .btn {
                display: none;
            }

            body {
                background: white !important;
                color: black !important;
            }
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .header, .toolbar, .content, .footer {
                padding-left: var(--space-md);
                padding-right: var(--space-md);
            }

            .toolbar {
                flex-direction: column;
                align-items: flex-start;
            }

            .toolbar-info {
                flex-direction: column;
                align-items: flex-start;
                gap: var(--space-sm);
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>${title || 'Formatted Output'}</h1>
        <p class="subtitle">Generated by <a href="https://freeformathub.com" target="_blank">FreeFormatHub.com</a></p>
    </header>

    <div class="toolbar">
        <div class="toolbar-info">
            ${filename ? `<span><strong>File:</strong> ${filename}</span>` : ''}
            <span><strong>Language:</strong> ${language}</span>
            <span><strong>Size:</strong> ${formatFileSize(content.length)}</span>
            <span><strong>Lines:</strong> ${content.split('\\n').length}</span>
        </div>
        <div>
            <button class="btn" onclick="copyToClipboard()">
                📋 Copy to Clipboard
            </button>
            <button class="btn btn-outline" onclick="window.print()">
                🖨️ Print
            </button>
        </div>
    </div>

    <main class="content">
        <div class="code-container">
            <div class="code-with-lines">
                <div class="line-numbers">
                    ${generateLineNumbers(content)}
                </div>
                <div class="code-content">
                    <pre><code class="language-${language}">${escapeHtml(content)}</code></pre>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <p>
            Powered by <a href="https://freeformathub.com" target="_blank">FreeFormatHub</a> -
            Privacy-first developer tools with 100+ utilities
        </p>
    </footer>

    <!-- Prism.js for syntax highlighting -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>

    <script>
        // Copy to clipboard functionality
        async function copyToClipboard() {
            const content = ${JSON.stringify(content)};
            try {
                await navigator.clipboard.writeText(content);
                const btn = event.target.closest('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ Copied!';
                btn.style.backgroundColor = '#10b981';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = '';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Content copied to clipboard!');
            }
        }

        // Auto-highlight syntax on load
        document.addEventListener('DOMContentLoaded', function() {
            Prism.highlightAll();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'p':
                        e.preventDefault();
                        window.print();
                        break;
                    case 'c':
                        if (e.shiftKey) {
                            e.preventDefault();
                            copyToClipboard();
                        }
                        break;
                }
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Generate line numbers for code display
 */
function generateLineNumbers(content: string): string {
  const lines = content.split('\n');
  return lines.map((_, index) => index + 1).join('\n');
}

/**
 * Escape HTML characters for safe display
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Quick utility function for formatter tools
 */
export function openFormatterInNewWindow(content: string, language: string, toolName: string, filename?: string): void {
  // For JSON, open the interactive tree viewer if content is valid JSON
  if (language === 'json' && toolName.toLowerCase().includes('json')) {
    try {
      JSON.parse(content); // Validate JSON
      openJsonTreeViewer(content, toolName, filename);
      return;
    } catch {
      // Fall back to text view if invalid JSON
    }
  }

  openInNewWindow(
    {
      content,
      language,
      filename: filename || `formatted-${language}.${getFileExtension(language)}`,
      title: `${toolName} Output`
    },
    {
      title: `${toolName} - FreeFormatHub`,
      width: 1000,
      height: 700,
      center: true
    }
  );
}

/**
 * Open JSON content in the interactive tree viewer
 */
export function openJsonTreeViewer(content: string, toolName?: string, filename?: string): void {
  try {
    // Generate a unique key for localStorage
    const storageKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store JSON data in localStorage (for large data that won't fit in URL)
    localStorage.setItem(`json-tree-data-${storageKey}`, content);

    // Build the viewer URL
    const baseUrl = window.location.origin;
    const viewerUrl = `${baseUrl}/viewer/json-tree?key=${storageKey}`;

    // Open in new window
    const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes';
    const newWindow = window.open(viewerUrl, '_blank', windowFeatures);

    if (newWindow) {
      newWindow.focus();

      // Clean up localStorage after window is likely loaded
      setTimeout(() => {
        try {
          localStorage.removeItem(`json-tree-data-${storageKey}`);
        } catch (error) {
          console.warn('Failed to clean up localStorage:', error);
        }
      }, 10000); // 10 seconds should be enough for the page to load
    } else {
      // Fallback: try with URL parameter for smaller JSON
      if (content.length < 2000) {
        const encodedData = encodeURIComponent(content);
        const fallbackUrl = `${baseUrl}/viewer/json-tree?data=${encodedData}`;
        window.open(fallbackUrl, '_blank', windowFeatures);
      } else {
        console.error('Failed to open JSON tree viewer and data too large for URL parameter');
        // Fall back to text view
        openInNewWindow(
          {
            content,
            language: 'json',
            filename: filename || 'formatted.json',
            title: `${toolName} Output`
          },
          {
            title: `${toolName} - FreeFormatHub`,
            width: 1000,
            height: 700,
            center: true
          }
        );
      }
    }
  } catch (error) {
    console.error('Failed to open JSON tree viewer:', error);
    // Fall back to text view
    openInNewWindow(
      {
        content,
        language: 'json',
        filename: filename || 'formatted.json',
        title: `${toolName} Output`
      },
      {
        title: `${toolName} - FreeFormatHub`,
        width: 1000,
        height: 700,
        center: true
      }
    );
  }
}

/**
 * Get appropriate file extension for a language
 */
function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    'javascript': 'js',
    'typescript': 'ts',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'xml': 'xml',
    'yaml': 'yml',
    'sql': 'sql',
    'python': 'py',
    'java': 'java',
    'cpp': 'cpp',
    'csharp': 'cs',
    'php': 'php',
    'ruby': 'rb',
    'go': 'go',
    'rust': 'rs',
    'swift': 'swift',
    'kotlin': 'kt',
    'dart': 'dart',
    'csv': 'csv',
    'markdown': 'md',
    'plaintext': 'txt'
  };

  return extensions[language] || 'txt';
}