import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processHtmlBeautifier, type HtmlBeautifierConfig, type ValidationError } from '../../../tools/formatters/html-beautifier';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

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

const OPTIONS = [
  {
    key: 'mode',
    label: 'Processing Mode',
    type: 'select' as const,
    default: 'beautify',
    options: [
      { value: 'beautify', label: 'Beautify (Format)' },
      { value: 'minify', label: 'Minify (Compress)' },
    ],
    description: 'Whether to format for readability or compress for size',
  },
  {
    key: 'indentSize',
    label: 'Indent Size',
    type: 'select' as const,
    default: 2,
    options: [
      { value: 2, label: '2 spaces' },
      { value: 4, label: '4 spaces' },
      { value: 8, label: '8 spaces' },
    ],
    description: 'Number of spaces for indentation (when using spaces)',
  },
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
  },
  {
    key: 'preserveComments',
    label: 'Preserve Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Keep HTML comments in the output',
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
  {
    key: 'validateHtml',
    label: 'Validate HTML',
    type: 'boolean' as const,
    default: true,
    description: 'Check for HTML syntax errors and warnings',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Minified HTML',
    input: `<!DOCTYPE html><html><head><title>Example</title></head><body><div class="container"><h1>Hello World</h1><p>This is a paragraph with <strong>bold</strong> text.</p><ul><li>Item 1</li><li>Item 2</li></ul></div></body></html>`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify' }
  },
  {
    name: 'HTML with Errors',
    input: `<div class="container">
  <p>Unclosed paragraph
  <span>Nested content</span>
  <img src="image.jpg" alt="Image">
</div>`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify', validateHtml: true }
  },
  {
    name: 'Complex HTML',
    input: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <header class="main-header">
      <nav>
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <section class="hero">
        <h1>Welcome to My Site</h1>
        <p>This is the hero section.</p>
      </section>
    </main>
  </body>
</html>`,
    config: { ...DEFAULT_CONFIG, mode: 'minify' }
  },
];

export function HtmlBeautifier({ className = '' }: HtmlBeautifierProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<HtmlBeautifierConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    lineCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: HtmlBeautifierConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processHtmlBeautifier(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'html-beautifier',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
            setStats(null);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to process HTML');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 200);
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: HtmlBeautifierConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig(example.config);
  };

  const swapModes = () => {
    setConfig(prev => ({
      ...prev,
      mode: prev.mode === 'beautify' ? 'minify' : 'beautify'
    }));
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="HTML Input"
          placeholder={`Enter HTML code to ${config.mode}...

Example:
<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <div class="container">
      <h1>Hello World</h1>
      <p>Content here</p>
    </div>
  </body>
</html>`}
          syntax="html"
          examples={[
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
              value: `<div><h1>Title</h1><p>Text with <strong>bold</strong> and <em>italic</em>.</p><ul><li>Item 1</li><li>Item 2</li></ul></div>`,
            },
          ]}
        />

        {/* Mode Toggle & Quick Examples */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 mb-4">
            <button
              onClick={swapModes}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Switch to {config.mode === 'beautify' ? 'Minify' : 'Beautify'}
            </button>
          </div>

          {/* Processing Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mode: {config.mode === 'beautify' ? 'Beautify (Format)' : 'Minify (Compress)'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {config.mode === 'beautify' 
                ? `Indentation: ${config.indentType === 'tabs' ? 'Tabs' : `${config.indentSize} spaces`}`
                : 'Removing unnecessary whitespace for smaller file size'
              }
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Examples:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  onClick={() => insertExample(example)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {example.config.mode === 'beautify' ? 'Format for readability' : 'Compress for production'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Processing Results:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Original:</span>
                    <span className="font-mono">{stats.originalSize.toLocaleString()}B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Processed:</span>
                    <span className="font-mono">{stats.processedSize.toLocaleString()}B</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ratio:</span>
                    <span className="font-mono">{(stats.compressionRatio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Lines:</span>
                    <span className="font-mono">{stats.lineCount}</span>
                  </div>
                </div>
              </div>
              
              {/* Validation Results */}
              {stats.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                    Errors ({stats.errors.length}):
                  </div>
                  <div className="max-h-20 overflow-y-auto">
                    {stats.errors.slice(0, 3).map((err, i) => (
                      <div key={i} className="text-xs text-red-600 dark:text-red-400">
                        Line {err.line}: {err.message}
                      </div>
                    ))}
                    {stats.errors.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{stats.errors.length - 3} more errors...
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {stats.warnings.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                    Warnings ({stats.warnings.length}):
                  </div>
                  <div className="max-h-20 overflow-y-auto">
                    {stats.warnings.slice(0, 2).map((warn, i) => (
                      <div key={i} className="text-xs text-yellow-600 dark:text-yellow-400">
                        Line {warn.line}: {warn.message}
                      </div>
                    ))}
                    {stats.warnings.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{stats.warnings.length - 2} more warnings...
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {stats.errors.length === 0 && stats.warnings.length === 0 && config.validateHtml && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ No validation errors found
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Output Panel */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label={`${config.mode === 'beautify' ? 'Formatted' : 'Minified'} HTML`}
        syntax="html"
        downloadFilename={`${config.mode === 'beautify' ? 'formatted' : 'minified'}.html`}
        downloadContentType="text/html"
      />
    </div>
  );
}