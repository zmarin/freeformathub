import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processRegexTest, type RegexTesterConfig } from '../../../tools/text/regex-tester';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface RegexTesterProps {
  className?: string;
}

const DEFAULT_CONFIG: RegexTesterConfig = {
  flags: {
    global: false,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false,
  },
  mode: 'test',
  showGroups: true,
  showExplanation: true,
  highlightMatches: true,
  outputFormat: 'detailed',
  testMultipleInputs: false,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Test Mode',
    type: 'select' as const,
    default: 'test',
    options: [
      { value: 'test', label: '✅ Test (boolean match)' },
      { value: 'match', label: '🎯 Match (find all matches)' },
      { value: 'replace', label: '🔄 Replace (substitute text)' },
      { value: 'split', label: '✂️ Split (divide text)' },
    ],
    description: 'Choose the regex operation mode',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Analysis' },
      { value: 'simple', label: 'Simple Summary' },
      { value: 'json', label: 'JSON Format' },
    ],
    description: 'Choose how to display results',
  },
  {
    key: 'showExplanation',
    label: 'Show Pattern Explanation',
    type: 'checkbox' as const,
    default: true,
    description: 'Display breakdown of regex components',
  },
  {
    key: 'showGroups',
    label: 'Show Capture Groups',
    type: 'checkbox' as const,
    default: true,
    description: 'Display captured groups and named groups',
  },
  {
    key: 'highlightMatches',
    label: 'Highlight Matches',
    type: 'checkbox' as const,
    default: true,
    description: 'Highlight matched text in the input',
  },
  {
    key: 'testMultipleInputs',
    label: 'Test Multiple Inputs',
    type: 'checkbox' as const,
    default: false,
    description: 'Test pattern against multiple lines of input',
  },
] as const;

// Replacement field for replace mode
const REPLACE_OPTION = {
  key: 'replacement',
  label: 'Replacement Text',
  type: 'text' as const,
  default: '',
  description: 'Text to replace matches with (supports $1, $2 for groups)',
};

// Flag options
const FLAG_OPTIONS = [
  {
    key: 'flags.global',
    label: 'Global (g)',
    type: 'checkbox' as const,
    default: false,
    description: 'Find all matches, not just the first one',
  },
  {
    key: 'flags.ignoreCase',
    label: 'Ignore Case (i)',
    type: 'checkbox' as const,
    default: false,
    description: 'Case-insensitive matching',
  },
  {
    key: 'flags.multiline',
    label: 'Multiline (m)',
    type: 'checkbox' as const,
    default: false,
    description: '^ and $ match line boundaries',
  },
  {
    key: 'flags.dotAll',
    label: 'Dot All (s)',
    type: 'checkbox' as const,
    default: false,
    description: 'Make . match newline characters',
  },
  {
    key: 'flags.unicode',
    label: 'Unicode (u)',
    type: 'checkbox' as const,
    default: false,
    description: 'Enable full Unicode support',
  },
  {
    key: 'flags.sticky',
    label: 'Sticky (y)',
    type: 'checkbox' as const,
    default: false,
    description: 'Match only from lastIndex position',
  },
] as const;

export function RegexTester({ className = '' }: RegexTesterProps) {
  const [input, setInput] = useState('');
  const [pattern, setPattern] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<RegexTesterConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, patternValue: string, currentConfig: RegexTesterConfig) => {
      if (!patternValue.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processRegexTest(inputValue, currentConfig, patternValue);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'regex-tester',
            input: `Pattern: ${patternValue}\nTest: ${inputValue}`,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process regex test');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during regex testing');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('regex-tester');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, pattern, config);
  }, [input, pattern, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    if (key.startsWith('flags.')) {
      const flagKey = key.split('.')[1];
      setConfig(prev => ({
        ...prev,
        flags: {
          ...prev.flags,
          [flagKey]: value,
        },
      }));
    } else {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleExample = (exampleInput: string) => {
    const example = examples.find(ex => ex.value === exampleInput);
    if (example) {
      setInput(example.value);
      if (example.pattern) {
        setPattern(example.pattern);
        // Set appropriate flags for the example
        if (example.pattern.includes('\\d+\\.\\d+') || example.pattern.includes('https?')) {
          setConfig(prev => ({
            ...prev,
            flags: { ...prev.flags, global: true }
          }));
        }
        if (example.pattern.includes('@') || example.pattern.includes('(?=.*')) {
          setConfig(prev => ({
            ...prev,
            flags: { ...prev.flags, multiline: true }
          }));
        }
      }
    }
  };

  // Common regex examples
  const examples = [
    {
      label: 'Email Validation',
      value: `user@example.com
invalid-email
test.email@domain.co.uk`,
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    },
    {
      label: 'Phone Numbers',
      value: 'Call me at +1-555-123-4567 or (555) 987-6543',
      pattern: '\\+?1?[-. ]?\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})',
    },
    {
      label: 'Extract URLs',
      value: 'Visit https://example.com or http://test.org for more info',
      pattern: 'https?://[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&\'\\(\\)\\*\\+,;=.]*',
    },
    {
      label: 'Extract Numbers',
      value: 'Price: $29.99, Tax: $2.40, Total: $32.39',
      pattern: '\\d+\\.\\d+',
    },
    {
      label: 'Date Formats',
      value: 'Dates: 2024-01-15, 01/15/2024, Jan 15, 2024',
      pattern: '\\d{4}-\\d{2}-\\d{2}|\\d{2}/\\d{2}/\\d{4}|[A-Za-z]{3} \\d{1,2}, \\d{4}',
    },
    {
      label: 'HTML Tags',
      value: '<div class="container"><p>Hello <strong>world</strong>!</p></div>',
      pattern: '<\\/?[\\w\\s]*>?',
    },
    {
      label: 'Clean Whitespace',
      value: 'Remove   extra    spaces   and   normalize    text.',
      pattern: '\\s+',
    },
    {
      label: 'Password Strength',
      value: `password123
MySecurePass123!
weak
StrongP@ssw0rd!`,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    },
  ];

  // Build all options including flags and conditional replacement
  const allOptions = [
    ...OPTIONS,
    ...(config.mode === 'replace' ? [REPLACE_OPTION] : []),
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Pattern Input */}
        <InputPanel
          title="Regular Expression Pattern"
          value={pattern}
          onChange={setPattern}
          placeholder="Enter your regex pattern here... (e.g., \\d+|[a-z]+@[a-z]+\\.[a-z]+)"
          description="Enter the regular expression pattern to test"
          language="regex"
          rows={3}
        />
        
        {/* Test Input */}
        <InputPanel
          title={config.testMultipleInputs ? 'Test Inputs (one per line)' : 'Test Input'}
          value={input}
          onChange={setInput}
          placeholder={
            config.testMultipleInputs
              ? "Line 1 to test\nLine 2 to test\nLine 3 to test"
              : "Enter text to test your pattern against..."
          }
          description={
            config.testMultipleInputs
              ? "Enter multiple test strings, one per line"
              : "Enter the text to test your regular expression against"
          }
          examples={examples}
          onExampleClick={handleExample}
          rows={config.testMultipleInputs ? 6 : 4}
        />
        
        {/* Options Panel */}
        <OptionsPanel
          title="Test Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />
        
        {/* Flags Panel */}
        <OptionsPanel
          title="Regex Flags"
          options={FLAG_OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Test Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'markdown'}
          placeholder="Enter a regex pattern to see test results..."
        />
      </div>
    </div>
  );
}