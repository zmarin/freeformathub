import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processTextDiff, type TextDiffConfig } from '../../../tools/text/text-diff';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface TextDiffProps {
  className?: string;
}

const DEFAULT_CONFIG: TextDiffConfig = {
  mode: 'line',
  ignoreWhitespace: false,
  ignoreCase: false,
  showContext: true,
  contextLines: 3,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Comparison Mode',
    type: 'select' as const,
    default: 'line',
    options: [
      { value: 'line', label: 'Line by Line' },
      { value: 'word', label: 'Word by Word' },
      { value: 'character', label: 'Character by Character' },
    ],
    description: 'How to split and compare the text',
  },
  {
    key: 'ignoreWhitespace',
    label: 'Ignore Whitespace',
    type: 'boolean' as const,
    default: false,
    description: 'Ignore differences in spaces, tabs, and line endings',
  },
  {
    key: 'ignoreCase',
    label: 'Ignore Case',
    type: 'boolean' as const,
    default: false,
    description: 'Treat uppercase and lowercase letters as the same',
  },
  {
    key: 'showContext',
    label: 'Show Context Lines',
    type: 'boolean' as const,
    default: true,
    description: 'Show unchanged lines around changes for context',
  },
  {
    key: 'contextLines',
    label: 'Context Lines Count',
    type: 'number' as const,
    default: 3,
    min: 0,
    max: 20,
    description: 'Number of context lines to show (when context is enabled)',
  },
];

export function TextDiff({ className = '' }: TextDiffProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<TextDiffConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    additions: number;
    deletions: number;
    modifications: number;
    unchanged: number;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: TextDiffConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processTextDiff(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'text-diff',
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
          setError(err instanceof Error ? err.message : 'Failed to compare text');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 100);
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: TextDiffConfig) => {
    setConfig(newConfig);
  };

  const insertSample = (sampleInput: string) => {
    setInput(sampleInput);
  };

  const splitPanes = () => {
    const parts = input.split(/===\s*(LEFT|RIGHT)\s*===/i);
    if (parts.length >= 4) {
      const leftText = parts[2]?.trim() || '';
      const rightText = parts[4]?.trim() || '';
      return { leftText, rightText };
    }
    return { leftText: '', rightText: '' };
  };

  const { leftText, rightText } = splitPanes();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div >
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="Text to Compare"
          placeholder={`Enter text to compare in this format:

===LEFT===
Original text here...
Line 2
Line 3

===RIGHT===
Modified text here...
Line 2 updated
Line 3
New line added`}
          syntax="text"
          examples={[
            {
              title: 'Basic Text Comparison',
              value: `===LEFT===
Hello World
This is line 2
Line 3 unchanged
===RIGHT===
Hello Universe
This is line 2
Line 3 unchanged
New line added`,
            },
            {
              title: 'Code Comparison',
              value: `===LEFT===
function greet(name) {
  console.log("Hello " + name);
  return true;
}
===RIGHT===
function greet(name) {
  console.log(\`Hello \${name}!\`);
  return name !== undefined;
}`,
            },
            {
              title: 'Configuration Changes',
              value: `===LEFT===
server.port=8080
server.host=localhost
debug=true
===RIGHT===
server.port=3000
server.host=0.0.0.0
debug=false
ssl.enabled=true`,
            },
          ]}
        />

        {/* Split Preview */}
        {(leftText || rightText) && (
          <div >
            <h3 >
              Preview Split:
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div >
                  LEFT ({leftText.split(/\r?\n/).length} lines)
                </div>
                <div >
                  {leftText.substring(0, 100)}{leftText.length > 100 ? '...' : ''}
                </div>
              </div>
              <div>
                <div >
                  RIGHT ({rightText.split(/\r?\n/).length} lines)
                </div>
                <div >
                  {rightText.substring(0, 100)}{rightText.length > 100 ? '...' : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div >
            <h3 >
              Comparison Statistics:
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span >Additions:</span>
                  <span className="font-mono">{stats.additions}</span>
                </div>
                <div className="flex justify-between">
                  <span >Deletions:</span>
                  <span className="font-mono">{stats.deletions}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span >Modifications:</span>
                  <span className="font-mono">{stats.modifications}</span>
                </div>
                <div className="flex justify-between">
                  <span >Unchanged:</span>
                  <span className="font-mono">{stats.unchanged}</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
        label="Diff Result"
        syntax="diff"
        downloadFilename="text-diff.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}