import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processLoremIpsum, type LoremIpsumConfig } from '../../../tools/text/lorem-ipsum';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface LoremIpsumProps {
  className?: string;
}

const DEFAULT_CONFIG: LoremIpsumConfig = {
  type: 'classic',
  format: 'paragraphs',
  count: 3,
  startWithLorem: true,
  includeHtml: false,
  htmlTags: ['p'],
};

const OPTIONS = [
  {
    key: 'type',
    label: 'Text Style',
    type: 'select' as const,
    default: 'classic',
    options: [
      { value: 'classic', label: 'Classic Lorem Ipsum' },
      { value: 'modern', label: 'Modern Business' },
      { value: 'hipster', label: 'Hipster Lifestyle' },
      { value: 'pirate', label: 'Pirate Speak' },
      { value: 'random', label: 'Random Mixed' },
    ],
    description: 'Style of placeholder text to generate',
  },
  {
    key: 'format',
    label: 'Output Format',
    type: 'select' as const,
    default: 'paragraphs',
    options: [
      { value: 'words', label: 'Words' },
      { value: 'sentences', label: 'Sentences' },
      { value: 'paragraphs', label: 'Paragraphs' },
    ],
    description: 'How to structure the generated text',
  },
  {
    key: 'count',
    label: 'Count',
    type: 'number' as const,
    default: 3,
    min: 1,
    max: 1000,
    description: 'Number of words, sentences, or paragraphs to generate',
  },
  {
    key: 'startWithLorem',
    label: 'Start with "Lorem Ipsum"',
    type: 'boolean' as const,
    default: true,
    description: 'Begin with traditional "Lorem ipsum" text (Classic style only)',
  },
  {
    key: 'includeHtml',
    label: 'Include HTML Tags',
    type: 'boolean' as const,
    default: false,
    description: 'Wrap generated text with HTML markup',
  },
  {
    key: 'htmlTags',
    label: 'HTML Tags',
    type: 'multiselect' as const,
    default: ['p'],
    options: [
      { value: 'p', label: '<p> Paragraph' },
      { value: 'div', label: '<div> Division' },
      { value: 'section', label: '<section> Section' },
      { value: 'article', label: '<article> Article' },
      { value: 'blockquote', label: '<blockquote> Quote' },
      { value: 'h1', label: '<h1> Heading 1' },
      { value: 'h2', label: '<h2> Heading 2' },
      { value: 'h3', label: '<h3> Heading 3' },
    ],
    description: 'HTML tags to use for wrapping text',
  },
];

const QUICK_PRESETS = [
  {
    name: '3 Classic Paragraphs',
    config: { ...DEFAULT_CONFIG, type: 'classic', format: 'paragraphs', count: 3, startWithLorem: true }
  },
  {
    name: '5 Modern Sentences',
    config: { ...DEFAULT_CONFIG, type: 'modern', format: 'sentences', count: 5, startWithLorem: false }
  },
  {
    name: '50 Hipster Words',
    config: { ...DEFAULT_CONFIG, type: 'hipster', format: 'words', count: 50, startWithLorem: false }
  },
  {
    name: 'HTML Paragraphs',
    config: { ...DEFAULT_CONFIG, type: 'classic', format: 'paragraphs', count: 2, includeHtml: true, htmlTags: ['p'] }
  },
];

export function LoremIpsum({ className = '' }: LoremIpsumProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<LoremIpsumConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    characterCount: number;
  } | null>(null);

  const { addToHistory } = useToolStore();

  // Generate text immediately when config changes
  const generateText = useMemo(
    () => debounce((cfg: LoremIpsumConfig) => {
      if (cfg.count <= 0) {
        setError('Count must be greater than 0');
        setOutput('');
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        try {
          const result = processLoremIpsum('', cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            // Add to history for successful operations
            addToHistory({
              toolId: 'lorem-ipsum',
              input: `Generate ${cfg.count} ${cfg.format} (${cfg.type} style)`,
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
          setError(err instanceof Error ? err.message : 'Failed to generate text');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 100);
    }, 100),
    [addToHistory]
  );

  // Auto-generate when component mounts or config changes
  useEffect(() => {
    generateText(config);
  }, [config, generateText]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: LoremIpsumConfig) => {
    setConfig(newConfig);
  };

  const handleGenerate = () => {
    generateText(config);
  };

  const handlePresetSelect = (presetConfig: LoremIpsumConfig) => {
    setConfig(presetConfig);
  };

  const getEstimatedOutput = () => {
    const { format, count } = config;
    
    switch (format) {
      case 'words':
        return `~${count} words`;
      case 'sentences':
        return `~${count * 12} words in ${count} sentences`;
      case 'paragraphs':
        return `~${count * 80} words in ${count} paragraphs`;
      default:
        return '';
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="Lorem Ipsum Generator"
          placeholder="Text will be generated automatically based on your settings..."
          syntax="text"
          examples={[
            { title: 'Auto-Generated', value: 'Configure options below and click "Generate Text"' },
            { title: 'Classic Style', value: 'Traditional Lorem Ipsum starting with "Lorem ipsum dolor sit amet"' },
            { title: 'Modern Business', value: 'Contemporary business and technology terminology' },
          ]}
          readonly={true}
          showFileUpload={false}
        />
        
        {/* Generate Button & Presets */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate New Text'}
          </button>
          
          {/* Output Preview */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Output Preview:
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {getEstimatedOutput()}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Style: {config.type.charAt(0).toUpperCase() + config.type.slice(1)} • 
              Format: {config.format.charAt(0).toUpperCase() + config.format.slice(1)} • 
              {config.includeHtml ? `HTML: ${config.htmlTags.join(', ')}` : 'Plain Text'}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Presets:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset.config)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Generated Statistics:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Words:</span>
                    <span className="font-mono">{stats.wordCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sentences:</span>
                    <span className="font-mono">{stats.sentenceCount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Paragraphs:</span>
                    <span className="font-mono">{stats.paragraphCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Characters:</span>
                    <span className="font-mono">{stats.characterCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
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
        label="Generated Text"
        syntax={config.includeHtml ? 'html' : 'text'}
        downloadFilename="lorem-ipsum.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}