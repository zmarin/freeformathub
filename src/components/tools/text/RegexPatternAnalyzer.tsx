import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processRegexPatternAnalyzer, type RegexPatternAnalyzerConfig, REGEX_PATTERNS } from '../../../tools/text/regex-pattern-analyzer';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface RegexPatternAnalyzerProps {
  className?: string;
}

const DEFAULT_CONFIG: RegexPatternAnalyzerConfig = {
  mode: 'analyze',
  flags: '',
  outputFormat: 'all',
  caseSensitive: false,
  multiline: false,
  dotAll: false,
  global: true,
  unicode: false,
  sticky: false,
  showExplanation: true,
  highlightMatches: true,
  maxMatches: 100,
  groupNames: true,
};

const MODE_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'analyze',
    options: [
      { value: 'analyze', label: '🔍 Analyze - Pattern complexity & performance' },
      { value: 'explain', label: '📚 Explain - Break down pattern components' },
      { value: 'test', label: '🧪 Test - Match pattern against text' },
      { value: 'extract', label: '📤 Extract - Find all matches in text' },
    ],
    description: 'Operation mode for regex processing',
  },
] as const;

const FLAG_OPTIONS = [
  {
    key: 'caseSensitive',
    label: 'Case Sensitive',
    type: 'checkbox' as const,
    default: false,
    description: 'Match case exactly (opposite of i flag)',
  },
  {
    key: 'global',
    label: 'Global Match',
    type: 'checkbox' as const,
    default: true,
    description: 'Find all matches, not just the first (g flag)',
  },
  {
    key: 'multiline',
    label: 'Multiline Mode',
    type: 'checkbox' as const,
    default: false,
    description: '^ and $ match line breaks (m flag)',
  },
  {
    key: 'dotAll',
    label: 'Dot Matches All',
    type: 'checkbox' as const,
    default: false,
    description: '. matches newline characters (s flag)',
  },
  {
    key: 'unicode',
    label: 'Unicode Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Enable Unicode matching (u flag)',
  },
  {
    key: 'sticky',
    label: 'Sticky Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Match only at lastIndex position (y flag)',
  },
] as const;

const OUTPUT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'all',
    options: [
      { value: 'matches', label: '📋 Matches Only' },
      { value: 'groups', label: '👥 Include Groups' },
      { value: 'positions', label: '📍 Include Positions' },
      { value: 'all', label: '📊 Complete Details' },
    ],
    description: 'Level of detail in match output',
  },
  {
    key: 'maxMatches',
    label: 'Max Matches',
    type: 'number' as const,
    default: 100,
    min: 1,
    max: 1000,
    description: 'Maximum number of matches to display',
  },
] as const;

export function RegexPatternAnalyzer({ className = '' }: RegexPatternAnalyzerProps) {
  const [pattern, setPattern] = useState('');
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<RegexPatternAnalyzerConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentPattern: string, currentText: string, currentConfig: RegexPatternAnalyzerConfig) => {
      if (!currentPattern.trim()) {
        setOutput('');
        setAnalysis(null);
        setError(null);
        setIsProcessing(false);
        return;
      }

      if ((currentConfig.mode === 'test' || currentConfig.mode === 'extract') && !currentText.trim()) {
        setOutput('');
        setAnalysis(null);
        setError(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processRegexPatternAnalyzer(currentPattern, currentText, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setAnalysis(result.analysis);
          
          // Add to history
          addToHistory({
            toolId: 'regex-pattern-analyzer',
            input: `${currentConfig.mode}: ${currentPattern.substring(0, 50)}${currentPattern.length > 50 ? '...' : ''}`,
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process regex pattern');
          setOutput('');
          setAnalysis(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during regex analysis');
        setOutput('');
        setAnalysis(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('regex-pattern-analyzer');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(pattern, text, config);
  }, [pattern, text, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'email' | 'phone' | 'url' | 'ip' | 'credit-card' | 'hex-color') => {
    const example = REGEX_PATTERNS.find(p => p.id === type);
    if (example) {
      setPattern(example.pattern);
      setConfig(prev => ({ 
        ...prev, 
        flags: example.flags,
        caseSensitive: !example.flags.includes('i'),
        global: example.flags.includes('g'),
        multiline: example.flags.includes('m')
      }));
      
      if (config.mode === 'test' || config.mode === 'extract') {
        setText(example.examples.join('\n'));
      }
    }
  };

  const handlePatternFromLibrary = (patternData: typeof REGEX_PATTERNS[0]) => {
    setPattern(patternData.pattern);
    setConfig(prev => ({ 
      ...prev, 
      flags: patternData.flags,
      caseSensitive: !patternData.flags.includes('i'),
      global: patternData.flags.includes('g'),
      multiline: patternData.flags.includes('m')
    }));
    
    if (config.mode === 'test' || config.mode === 'extract') {
      setText(patternData.examples.join('\n'));
    }
  };

  const handleTestSample = () => {
    const sampleTexts = {
      email: 'Contact us at john.doe@example.com or support@company.org for help.',
      phone: 'Call us at (555) 123-4567 or +1-800-555-0199 for assistance.',
      url: 'Visit https://example.com or http://www.test-site.org/path?query=1',
      general: 'Sample text with numbers 12345, emails test@domain.com, and URLs https://site.com/path'
    };
    
    if (pattern.includes('@')) {
      setText(sampleTexts.email);
    } else if (pattern.includes('\\d') && pattern.includes('[()-]')) {
      setText(sampleTexts.phone);
    } else if (pattern.includes('https?')) {
      setText(sampleTexts.url);
    } else {
      setText(sampleTexts.general);
    }
  };

  // Build conditional options
  const allOptions = [
    ...MODE_OPTIONS,
    ...FLAG_OPTIONS,
    ...(config.mode === 'test' || config.mode === 'extract' ? OUTPUT_OPTIONS : []),
  ];

  const showTextInput = config.mode === 'test' || config.mode === 'extract';
  const currentFlags = [
    config.global && 'g',
    !config.caseSensitive && 'i', 
    config.multiline && 'm',
    config.dotAll && 's',
    config.unicode && 'u',
    config.sticky && 'y'
  ].filter(Boolean).join('');

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Current Flags Display */}
        {currentFlags && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Active Flags</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-lg font-mono text-blue-800">/{pattern || 'pattern'}/{currentFlags}</div>
              <div className="text-xs text-blue-600 mt-1">
                {currentFlags.split('').map((flag, index) => {
                  const descriptions = {
                    g: 'Global (find all matches)',
                    i: 'Case insensitive',
                    m: 'Multiline (^ $ match line breaks)', 
                    s: 'Dot matches newlines',
                    u: 'Unicode mode',
                    y: 'Sticky (match at lastIndex)'
                  };
                  return descriptions[flag as keyof typeof descriptions];
                }).join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('email')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              📧 Email
            </button>
            <button
              onClick={() => handleQuickExample('phone')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              📞 Phone
            </button>
            <button
              onClick={() => handleQuickExample('url')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              🌐 URL
            </button>
            <button
              onClick={() => handleQuickExample('ip')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              🔗 IP Address
            </button>
          </div>
          {showTextInput && (
            <button
              onClick={handleTestSample}
              className="w-full px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              📝 Load Sample Text
            </button>
          )}
        </div>

        <OptionsPanel
          title="Analysis Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Pattern Library */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Pattern Library</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {REGEX_PATTERNS.map(patternData => (
              <button
                key={patternData.id}
                onClick={() => handlePatternFromLibrary(patternData)}
                className={`w-full px-3 py-2 text-xs rounded transition-colors text-left ${
                  pattern === patternData.pattern
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">{patternData.name}</div>
                <div className="text-gray-500 truncate mt-1">
                  {patternData.description}
                </div>
                <code className="text-xs opacity-75 mt-1 block">
                  {patternData.pattern.length > 40 
                    ? patternData.pattern.substring(0, 40) + '...'
                    : patternData.pattern}
                </code>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && config.mode === 'analyze' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Analysis Summary</h3>
            <div className={`p-3 border rounded-lg text-xs ${
              analysis.isValid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">Valid:</span>
                  <span className={`ml-1 font-medium ${analysis.isValid ? 'text-green-800' : 'text-red-800'}`}>
                    {analysis.isValid ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Complexity:</span>
                  <span className="ml-1 font-medium text-gray-800">{analysis.complexity}</span>
                </div>
                <div>
                  <span className="text-gray-600">Features:</span>
                  <span className="ml-1 font-medium text-gray-800">{analysis.features.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Risk:</span>
                  <span className={`ml-1 font-medium ${
                    analysis.performance.backtrackingRisk === 'high' ? 'text-red-800' :
                    analysis.performance.backtrackingRisk === 'medium' ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {analysis.performance.backtrackingRisk}
                  </span>
                </div>
              </div>
              
              {analysis.warnings.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-red-700 font-medium">Warnings:</div>
                  {analysis.warnings.map((warning: string, index: number) => (
                    <div key={index} className="text-red-600">• {warning}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regex Reference */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Reference</h3>
          <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-mono text-blue-600">\\d \\w \\s</div>
              <div className="text-gray-600">Digit, word char, whitespace</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-mono text-blue-600">* + ? {`{n,m}`}</div>
              <div className="text-gray-600">Quantifiers (0+, 1+, 0-1, range)</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-mono text-blue-600">^ $ \\b</div>
              <div className="text-gray-600">Anchors (start, end, word boundary)</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-mono text-blue-600">[] () |</div>
              <div className="text-gray-600">Character class, group, alternation</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="Regular Expression Pattern"
          value={pattern}
          onChange={setPattern}
          placeholder="Enter regex pattern (e.g., \\d{3}-\\d{3}-\\d{4})"
          language="regex"
        />

        {showTextInput && (
          <InputPanel
            title="Test Text"
            value={text}
            onChange={setText}
            placeholder="Enter text to test pattern against..."
            language="text"
          />
        )}

        <OutputPanel
          title={`Regex ${config.mode.charAt(0).toUpperCase() + config.mode.slice(1)} Results`}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder={`Enter a regex pattern to ${config.mode}...`}
          processingMessage={`Processing regex ${config.mode}...`}
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Result
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `regex-${config.mode}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download
                </button>
                {pattern && (
                  <button
                    onClick={() => {
                      const regexWithFlags = `/${pattern}/${currentFlags}`;
                      navigator.clipboard?.writeText(regexWithFlags);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    📋 Copy Regex
                  </button>
                )}
                {config.mode !== 'explain' && (
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, mode: 'explain' }))}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    📚 Explain Pattern
                  </button>
                )}
                {(config.mode === 'analyze' || config.mode === 'explain') && (
                  <button
                    onClick={() => {
                      setConfig(prev => ({ ...prev, mode: 'test' }));
                      if (!text.trim()) handleTestSample();
                    }}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    🧪 Test Pattern
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