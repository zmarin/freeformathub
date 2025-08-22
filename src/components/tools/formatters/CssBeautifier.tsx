import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processCssBeautifier, type CssBeautifierConfig, type ValidationError } from '../../../tools/formatters/css-beautifier';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CssBeautifierProps {
  className?: string;
}

const DEFAULT_CONFIG: CssBeautifierConfig = {
  mode: 'beautify',
  indentSize: 2,
  indentType: 'spaces',
  insertNewLineBeforeOpeningBrace: false,
  insertNewLineAfterOpeningBrace: false,
  insertNewLineBeforeClosingBrace: false,
  insertNewLineAfterRule: true,
  insertNewLineAfterComma: false,
  preserveComments: true,
  removeEmptyRules: false,
  sortProperties: false,
  insertSpaceAfterColon: true,
  insertSpaceAfterComma: true,
  insertSpaceBeforeOpeningBrace: true,
  autoprefixer: false,
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
    key: 'insertSpaceBeforeOpeningBrace',
    label: 'Space Before Opening Brace',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space before { in selectors',
  },
  {
    key: 'insertSpaceAfterColon',
    label: 'Space After Colon',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space after : in property declarations',
  },
  {
    key: 'insertNewLineAfterRule',
    label: 'New Line After Rule',
    type: 'boolean' as const,
    default: true,
    description: 'Insert empty line after each CSS rule',
  },
  {
    key: 'preserveComments',
    label: 'Preserve Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Keep CSS comments in the output',
  },
  {
    key: 'sortProperties',
    label: 'Sort Properties',
    type: 'boolean' as const,
    default: false,
    description: 'Sort CSS properties alphabetically within each rule',
  },
  {
    key: 'removeEmptyRules',
    label: 'Remove Empty Rules',
    type: 'boolean' as const,
    default: false,
    description: 'Remove CSS rules that have no properties',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Minified CSS',
    input: `.container{width:100%;margin:0 auto;padding:20px}.header{background-color:#333;color:white;padding:10px}.header h1{margin:0;font-size:24px}@media (max-width:768px){.container{padding:10px}}`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify' }
  },
  {
    name: 'Flexbox Layout',
    input: `.flex-container{display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-height:100vh}.flex-item{flex:1 0 auto;padding:1rem;border:1px solid #ccc}@media(min-width:768px){.flex-container{flex-direction:row}}`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify', sortProperties: true }
  },
  {
    name: 'CSS Grid with Variables',
    input: `:root{--grid-gap:1rem;--primary-color:#007bff;--secondary-color:#6c757d}.grid-container{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--grid-gap);padding:var(--grid-gap)}.grid-item{background:var(--primary-color);color:white;padding:1rem;border-radius:0.5rem}`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify', insertNewLineAfterRule: true }
  },
];

export function CssBeautifier({ className = '' }: CssBeautifierProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CssBeautifierConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    lineCount: number;
    ruleCount: number;
    propertyCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: CssBeautifierConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processCssBeautifier(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'css-beautifier',
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
          setError(err instanceof Error ? err.message : 'Failed to process CSS');
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

  const handleConfigChange = (newConfig: CssBeautifierConfig) => {
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
          label="CSS Input"
          placeholder={`Enter CSS code to ${config.mode}...

Example:
.container {
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background-color: #333;
  color: white;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
}`}
          syntax="css"
          examples={[
            {
              title: 'Basic CSS Structure',
              value: `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 2rem 0;
}`,
            },
            {
              title: 'Flexbox Layout',
              value: `.flex-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-item {
  flex: 1 1 300px;
  min-height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}`,
            },
            {
              title: 'Minified CSS',
              value: `.btn{display:inline-block;padding:12px 24px;background:#007bff;color:white;text-decoration:none;border-radius:4px;transition:all 0.3s ease}.btn:hover{background:#0056b3;transform:translateY(-2px)}`,
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
                : 'Removing whitespace and optimizing for smaller file size'
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
                    {example.config.mode === 'beautify' ? 'Format with proper spacing' : 'Compress for production'}
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
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ratio:</span>
                    <span className="font-mono">{(stats.compressionRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Rules:</span>
                    <span className="font-mono">{stats.ruleCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Properties:</span>
                    <span className="font-mono">{stats.propertyCount}</span>
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
              
              {stats.errors.length === 0 && stats.warnings.length === 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ No validation issues found
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
        label={`${config.mode === 'beautify' ? 'Formatted' : 'Minified'} CSS`}
        syntax="css"
        downloadFilename={`${config.mode === 'beautify' ? 'formatted' : 'minified'}.css`}
        downloadContentType="text/css"
      />
    </div>
  );
}