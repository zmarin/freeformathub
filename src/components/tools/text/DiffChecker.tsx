import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processDiffChecker, type DiffCheckerConfig } from '../../../tools/text/diff-checker';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface DiffCheckerProps {
  className?: string;
}

const DEFAULT_CONFIG: DiffCheckerConfig = {
  diffType: 'unified',
  ignoreWhitespace: false,
  ignoreCase: false,
  showLineNumbers: true,
  contextLines: 3,
  highlightWords: true,
  compareMode: 'text',
  showStats: true,
};

const BASIC_OPTIONS = [
  {
    key: 'diffType',
    label: 'Diff Format',
    type: 'select' as const,
    default: 'unified',
    options: [
      { value: 'unified', label: '=� Unified - Git-style single column' },
      { value: 'split', label: '=� Split - Side-by-side comparison' },
      { value: 'inline', label: '=� Inline - Sequential changes' },
    ],
    description: 'Choose the diff output format',
  },
  {
    key: 'compareMode',
    label: 'Compare Mode',
    type: 'select' as const,
    default: 'text',
    options: [
      { value: 'text', label: '=� Text - Line-by-line comparison' },
      { value: 'json', label: '= JSON - Structure-aware comparison' },
      { value: 'code', label: '=� Code - Syntax-aware comparison' },
    ],
    description: 'Type of content being compared',
  },
  {
    key: 'showStats',
    label: 'Show Statistics',
    type: 'checkbox' as const,
    default: true,
    description: 'Display diff statistics and similarity percentage',
  },
  {
    key: 'showLineNumbers',
    label: 'Line Numbers',
    type: 'checkbox' as const,
    default: true,
    description: 'Show line numbers in diff output',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'ignoreWhitespace',
    label: 'Ignore Whitespace',
    type: 'checkbox' as const,
    default: false,
    description: 'Ignore differences in spacing and indentation',
  },
  {
    key: 'ignoreCase',
    label: 'Ignore Case',
    type: 'checkbox' as const,
    default: false,
    description: 'Perform case-insensitive comparison',
  },
  {
    key: 'contextLines',
    label: 'Context Lines',
    type: 'range' as const,
    default: 3,
    min: 0,
    max: 10,
    step: 1,
    description: 'Number of unchanged lines to show around changes',
  },
] as const;

export function DiffChecker({ className = '' }: DiffCheckerProps) {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<DiffCheckerConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((oldValue: string, newValue: string, currentConfig: DiffCheckerConfig) => {
      if (!oldValue.trim() && !newValue.trim()) {
        setOutput('');
        setDiffData(null);
        setStats(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processDiffChecker(oldValue, newValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setDiffData(result.diffData);
          setStats(result.stats);
          
          // Add to history
          addToHistory({
            toolId: 'diff-checker',
            input: `OLD: ${oldValue.substring(0, 100)}...\nNEW: ${newValue.substring(0, 100)}...`,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to compute diff');
          setOutput('');
          setDiffData(null);
          setStats(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while computing diff');
        setOutput('');
        setDiffData(null);
        setStats(null);
      } finally {
        setIsProcessing(false);
      }
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('diff-checker');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(oldText, newText, config);
  }, [oldText, newText, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleOldExample = (exampleInput: string) => {
    setOldText(exampleInput);
  };

  const handleNewExample = (exampleInput: string) => {
    setNewText(exampleInput);
  };

  // Example texts for testing
  const oldExamples = [
    {
      label: 'Original Code',
      value: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`,
    },
    {
      label: 'Original Config',
      value: `{
  "name": "MyApp",
  "version": "1.0.0",
  "dependencies": {
    "react": "^17.0.0",
    "lodash": "^4.17.21"
  }
}`,
    },
    {
      label: 'Original Text',
      value: `Welcome to our website!
We offer the best products at competitive prices.
Contact us at info@example.com for more information.
Visit our store from 9 AM to 5 PM.`,
    },
    {
      label: 'HTML Before',
      value: `<div class="container">
  <h1>Welcome</h1>
  <p>This is a paragraph.</p>
  <button onclick="alert('Hello')">Click me</button>
</div>`,
    },
  ];

  const newExamples = [
    {
      label: 'Updated Code',
      value: `function calculateTotal(items, tax = 0) {
  let total = 0;
  items.forEach(item => {
    total += item.price * (1 + tax);
  });
  return Math.round(total * 100) / 100;
}`,
    },
    {
      label: 'Updated Config',
      value: `{
  "name": "MyApp",
  "version": "1.1.0",
  "dependencies": {
    "react": "^18.0.0",
    "lodash": "^4.17.21",
    "axios": "^0.27.0"
  },
  "scripts": {
    "start": "react-scripts start"
  }
}`,
    },
    {
      label: 'Updated Text',
      value: `Welcome to our amazing website!
We offer the best products at unbeatable prices.
Contact us at support@example.com for assistance.
Visit our store from 8 AM to 6 PM, Monday to Saturday.
New: We now offer online ordering!`,
    },
    {
      label: 'HTML After',
      value: `<div class="container">
  <h1>Welcome to Our Site</h1>
  <p>This is an updated paragraph with more content.</p>
  <button onclick="showModal()">Open Modal</button>
  <p>New content added here.</p>
</div>`,
    },
  ];

  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...ADVANCED_OPTIONS.filter(option => {
      if (option.key === 'contextLines') {
        return config.diffType === 'unified';
      }
      return true;
    }),
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Old Text Input */}
        <InputPanel
          title="Original Text (OLD)"
          value={oldText}
          onChange={setOldText}
          placeholder="Enter the original text to compare..."
          description="Enter the original/old version of your text or code"
          examples={oldExamples}
          onExampleClick={handleOldExample}
          rows={8}
        />

        {/* New Text Input */}
        <InputPanel
          title="New Text (NEW)"
          value={newText}
          onChange={setNewText}
          placeholder="Enter the new text to compare..."
          description="Enter the new/updated version of your text or code"
          examples={newExamples}
          onExampleClick={handleNewExample}
          rows={8}
        />
        
        <OptionsPanel
          title="Diff Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Statistics Display */}
        {stats && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Diff Statistics</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-green-600">Lines Added:</span>
                  <div className="font-medium text-green-800">{stats.linesAdded}</div>
                </div>
                <div>
                  <span className="text-red-600">Lines Deleted:</span>
                  <div className="font-medium text-red-800">{stats.linesDeleted}</div>
                </div>
                <div>
                  <span className="text-blue-600">Lines Modified:</span>
                  <div className="font-medium text-blue-800">{stats.linesModified}</div>
                </div>
                <div>
                  <span className="text-gray-600">Lines Unchanged:</span>
                  <div className="font-medium text-gray-800">{stats.linesUnchanged}</div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-green-600">Similarity:</span>
                  <div className="font-bold text-green-800">{stats.similarity}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.similarity}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Summary */}
        {diffData && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Change Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded text-xs">
                <span className="text-green-700">+ Additions</span>
                <span className="font-medium text-green-800">{diffData.additions}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 rounded text-xs">
                <span className="text-red-700">- Deletions</span>
                <span className="font-medium text-red-800">{diffData.deletions}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                <span className="text-blue-700">~ Modifications</span>
                <span className="font-medium text-blue-800">{diffData.modifications}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                <span className="text-gray-700">= Unchanged</span>
                <span className="font-medium text-gray-800">{diffData.unchanged}</span>
              </div>
            </div>
          </div>
        )}

        {/* Format Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Diff Format Guide</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">Symbols</div>
              <div className="text-blue-700">
                <div>+ Added lines</div>
                <div>- Removed lines</div>
                <div className="ml-2">Unchanged lines</div>
              </div>
            </div>
            {config.compareMode === 'json' && (
              <div className="p-2 bg-purple-50 rounded">
                <div className="font-medium text-purple-800">JSON Mode</div>
                <div className="text-purple-700">Compares object structure and values</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Format Switcher */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Format</h3>
          <div className="grid grid-cols-3 gap-1">
            {[
              { format: 'unified', icon: '=�', label: 'Unified' },
              { format: 'split', icon: '=�', label: 'Split' },
              { format: 'inline', icon: '=�', label: 'Inline' },
            ].map(({ format, icon, label }) => (
              <button
                key={format}
                onClick={() => handleConfigChange('diffType', format)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  config.diffType === format
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title={`Diff Result (${config.diffType})`}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="diff"
          placeholder="Enter text in both input panels to see the diff..."
          processingMessage="Computing differences..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  =� Copy Diff
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `diff-${config.diffType}-${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  =� Download Diff
                </button>
                {config.diffType === 'unified' && (
                  <button
                    onClick={() => {
                      const patchContent = `--- old.txt
+++ new.txt
${output}`;
                      const blob = new Blob([patchContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `changes.patch`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    =� Export Patch
                  </button>
                )}
                {stats && (
                  <button
                    onClick={() => {
                      const statsText = `Diff Statistics

Lines Added: ${stats.linesAdded}
Lines Deleted: ${stats.linesDeleted}
Lines Modified: ${stats.linesModified}
Lines Unchanged: ${stats.linesUnchanged}
Total Lines: ${stats.totalLines}
Similarity: ${stats.similarity}%`;
                      
                      navigator.clipboard?.writeText(statsText);
                    }}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    =� Copy Stats
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