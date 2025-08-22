import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processJsBeautifier, type JsBeautifierConfig, type ValidationError } from '../../../tools/formatters/js-beautifier';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JsBeautifierProps {
  className?: string;
}

const DEFAULT_CONFIG: JsBeautifierConfig = {
  mode: 'beautify',
  indentSize: 2,
  indentType: 'spaces',
  maxLineLength: 80,
  insertSpaceAfterKeywords: true,
  insertSpaceBeforeFunctionParen: false,
  insertSpaceAfterFunctionParen: false,
  insertSpaceBeforeOpeningBrace: true,
  insertNewLineBeforeOpeningBrace: false,
  insertNewLineAfterOpeningBrace: true,
  insertNewLineBeforeClosingBrace: true,
  preserveComments: true,
  preserveEmptyLines: false,
  addSemicolons: false,
  quoteStyle: 'preserve',
  trailingCommas: false,
  validateSyntax: true,
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
    key: 'quoteStyle',
    label: 'Quote Style',
    type: 'select' as const,
    default: 'preserve',
    options: [
      { value: 'preserve', label: 'Preserve Original' },
      { value: 'single', label: 'Single Quotes' },
      { value: 'double', label: 'Double Quotes' },
    ],
    description: 'Preferred quote style for strings',
  },
  {
    key: 'insertSpaceAfterKeywords',
    label: 'Space After Keywords',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space after keywords like if, while, for',
  },
  {
    key: 'insertSpaceBeforeOpeningBrace',
    label: 'Space Before Opening Brace',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space before { in functions and blocks',
  },
  {
    key: 'preserveComments',
    label: 'Preserve Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Keep JavaScript comments in the output',
  },
  {
    key: 'addSemicolons',
    label: 'Add Missing Semicolons',
    type: 'boolean' as const,
    default: false,
    description: 'Automatically insert missing semicolons',
  },
  {
    key: 'validateSyntax',
    label: 'Validate Syntax',
    type: 'boolean' as const,
    default: true,
    description: 'Check for JavaScript syntax errors and warnings',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Minified JavaScript',
    input: `function calculate(a,b){if(a>b){return a+b;}else{return a-b;}}const users=[{name:"John",age:30},{name:"Jane",age:25}];users.forEach(user=>{console.log(\`\${user.name} is \${user.age} years old\`);});`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify' }
  },
  {
    name: 'React Component',
    input: `const MyComponent=({data,loading})=>{const[state,setState]=useState(null);useEffect(()=>{if(data){setState(processData(data));}},data);if(loading)return <Spinner/>;return <div className="container">{state?<DataView data={state}/>:<EmptyState/>}</div>;};`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify', quoteStyle: 'single' }
  },
  {
    name: 'Async Functions',
    input: `async function fetchUserData(id){try{const response=await fetch(\`/api/users/\${id}\`);if(!response.ok)throw new Error("Failed to fetch");const user=await response.json();return user;}catch(error){console.error("Error:",error);return null;}}`,
    config: { ...DEFAULT_CONFIG, mode: 'beautify', addSemicolons: true }
  },
];

export function JsBeautifier({ className = '' }: JsBeautifierProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsBeautifierConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    lineCount: number;
    functionCount: number;
    variableCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: JsBeautifierConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processJsBeautifier(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'js-beautifier',
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
          setError(err instanceof Error ? err.message : 'Failed to process JavaScript');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 300);
    }, 600),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JsBeautifierConfig) => {
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
          label="JavaScript Input"
          placeholder={`Enter JavaScript code to ${config.mode}...

Example:
function greet(name) {
  if (name) {
    return \`Hello, \${name}!\`;
  } else {
    return 'Hello, World!';
  }
}

const users = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
];

users.forEach(user => {
  console.log(greet(user.name));
});`}
          syntax="javascript"
          examples={[
            {
              title: 'Function Declaration',
              value: `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

const cart = [
  { price: 10.99, quantity: 2 },
  { price: 5.99, quantity: 1 },
  { price: 15.50, quantity: 3 }
];

console.log('Total:', calculateTotal(cart));`,
            },
            {
              title: 'React Component',
              value: `const UserProfile = ({ user, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = async (updatedUser) => {
    try {
      await updateUser(updatedUser);
      setIsEditing(false);
      onEdit(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <div className="user-profile">
      {isEditing ? (
        <EditForm user={user} onSave={handleSave} />
      ) : (
        <UserDisplay user={user} onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
};`,
            },
            {
              title: 'Minified Code',
              value: `const api={get:async(url)=>{const res=await fetch(url);return res.json();},post:async(url,data)=>{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return res.json();}};`,
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
                ? `Indentation: ${config.indentType === 'tabs' ? 'Tabs' : `${config.indentSize} spaces`} • Quotes: ${config.quoteStyle}`
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
                    <span className="text-gray-600 dark:text-gray-400">Functions:</span>
                    <span className="font-mono">{stats.functionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Variables:</span>
                    <span className="font-mono">{stats.variableCount}</span>
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
                    Syntax Errors ({stats.errors.length}):
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
              
              {stats.errors.length === 0 && stats.warnings.length === 0 && config.validateSyntax && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ No syntax issues found
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
        label={`${config.mode === 'beautify' ? 'Formatted' : 'Minified'} JavaScript`}
        syntax="javascript"
        downloadFilename={`${config.mode === 'beautify' ? 'formatted' : 'minified'}.js`}
        downloadContentType="application/javascript"
      />
    </div>
  );
}