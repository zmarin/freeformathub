import { useState, useEffect, useMemo } from 'react';
import { OutputPanel, OptionsPanel } from '../../ui';
import { processLoremIpsumGenerator, type LoremIpsumGeneratorConfig } from '../../../tools/text/lorem-ipsum-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface LoremIpsumGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: LoremIpsumGeneratorConfig = {
  outputType: 'paragraphs',
  count: 3,
  startWithLorem: true,
  includeHtml: false,
  htmlTags: ['p'],
  language: 'latin',
  seed: '',
  lineBreaks: 'paragraph',
  capitalizeFirst: true,
  punctuation: true,
};

const BASIC_OPTIONS = [
  {
    key: 'outputType',
    label: 'Output Type',
    type: 'select' as const,
    default: 'paragraphs',
    options: [
      { value: 'paragraphs', label: '=� Paragraphs - Full text blocks' },
      { value: 'sentences', label: '=� Sentences - Complete thoughts' },
      { value: 'words', label: '=$ Words - Individual terms' },
      { value: 'characters', label: '=� Characters - Exact length' },
    ],
    description: 'Type of content to generate',
  },
  {
    key: 'count',
    label: 'Count',
    type: 'number' as const,
    default: 3,
    min: 1,
    max: 1000,
    description: 'Number of items to generate',
  },
  {
    key: 'language',
    label: 'Language/Style',
    type: 'select' as const,
    default: 'latin',
    options: [
      { value: 'latin', label: '<� Latin - Classic Lorem Ipsum' },
      { value: 'english', label: '<�<� English - Readable placeholder' },
      { value: 'tech', label: '=� Tech - Development terminology' },
      { value: 'corporate', label: '<� Corporate - Business language' },
      { value: 'hipster', label: '( Hipster - Creative/lifestyle terms' },
    ],
    description: 'Vocabulary style for generated text',
  },
  {
    key: 'startWithLorem',
    label: 'Start with "Lorem ipsum"',
    type: 'checkbox' as const,
    default: true,
    description: 'Begin text with traditional Lorem ipsum (Latin only)',
  },
] as const;

const HTML_OPTIONS = [
  {
    key: 'includeHtml',
    label: 'Include HTML',
    type: 'checkbox' as const,
    default: false,
    description: 'Wrap content with HTML tags',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'lineBreaks',
    label: 'Line Breaks',
    type: 'select' as const,
    default: 'paragraph',
    options: [
      { value: 'paragraph', label: 'Double line breaks (paragraphs)' },
      { value: 'sentence', label: 'Single line breaks (sentences)' },
      { value: 'none', label: 'No line breaks (continuous)' },
    ],
    description: 'How to separate generated content',
  },
  {
    key: 'capitalizeFirst',
    label: 'Capitalize First Letter',
    type: 'checkbox' as const,
    default: true,
    description: 'Capitalize the first letter of sentences',
  },
  {
    key: 'punctuation',
    label: 'Add Punctuation',
    type: 'checkbox' as const,
    default: true,
    description: 'Add periods, exclamation marks, and question marks',
  },
  {
    key: 'seed',
    label: 'Seed (optional)',
    type: 'text' as const,
    default: '',
    placeholder: 'Enter seed for consistent results...',
    description: 'Seed string for reproducible generation',
  },
] as const;

const HTML_TAG_OPTIONS = [
  { id: 'p', label: '<p> - Paragraphs', category: 'Block' },
  { id: 'div', label: '<div> - Divisions', category: 'Block' },
  { id: 'h1', label: '<h1> - Main heading', category: 'Headings' },
  { id: 'h2', label: '<h2> - Section heading', category: 'Headings' },
  { id: 'h3', label: '<h3> - Subsection heading', category: 'Headings' },
  { id: 'h4', label: '<h4> - Minor heading', category: 'Headings' },
  { id: 'span', label: '<span> - Inline text', category: 'Inline' },
  { id: 'strong', label: '<strong> - Bold text', category: 'Inline' },
  { id: 'em', label: '<em> - Emphasized text', category: 'Inline' },
  { id: 'blockquote', label: '<blockquote> - Quote blocks', category: 'Block' },
  { id: 'li', label: '<li> - List items', category: 'Lists' },
  { id: 'article', label: '<article> - Article content', category: 'Semantic' },
  { id: 'section', label: '<section> - Content sections', category: 'Semantic' },
];

export function LoremIpsumGenerator({ className = '' }: LoremIpsumGeneratorProps) {
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [htmlTags, setHtmlTags] = useState<string[]>(['p']);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<LoremIpsumGeneratorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentConfig: LoremIpsumGeneratorConfig) => {
      setIsProcessing(true);
      setError(null);

      try {
        const configWithTags = { ...currentConfig, htmlTags };
        const result = processLoremIpsumGenerator(configWithTags);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setStats(result.stats);
          
          // Add to history
          addToHistory({
            toolId: 'lorem-ipsum-generator',
            input: `${currentConfig.count} ${currentConfig.outputType} (${currentConfig.language})`,
            output: result.output,
            config: configWithTags,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate Lorem Ipsum text');
          setOutput('');
          setStats(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while generating text');
        setOutput('');
        setStats(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [htmlTags, addToHistory]
  );

  useEffect(() => {
    setCurrentTool('lorem-ipsum-generator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(config);
  }, [config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleHtmlTagToggle = (tagId: string) => {
    setHtmlTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const handleQuickGenerate = (type: 'short' | 'medium' | 'long') => {
    const configs = {
      short: { outputType: 'sentences' as const, count: 3 },
      medium: { outputType: 'paragraphs' as const, count: 2 },
      long: { outputType: 'paragraphs' as const, count: 5 },
    };
    
    setConfig(prev => ({ ...prev, ...configs[type] }));
  };

  const handleLanguagePreset = (language: string) => {
    const presets: Record<string, Partial<LoremIpsumGeneratorConfig>> = {
      classic: { language: 'latin', startWithLorem: true, capitalizeFirst: true },
      readable: { language: 'english', startWithLorem: false, capitalizeFirst: true },
      technical: { language: 'tech', startWithLorem: false, capitalizeFirst: true },
      business: { language: 'corporate', startWithLorem: false, capitalizeFirst: true },
    };
    
    setConfig(prev => ({ ...prev, ...presets[language] }));
  };

  // Group HTML tags by category
  const tagsByCategory = useMemo(() => {
    const groups: Record<string, typeof HTML_TAG_OPTIONS> = {};
    HTML_TAG_OPTIONS.forEach(tag => {
      if (!groups[tag.category]) {
        groups[tag.category] = [];
      }
      groups[tag.category].push(tag);
    });
    return groups;
  }, []);

  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS.filter(option => {
      if (option.key === 'startWithLorem') {
        return config.language === 'latin';
      }
      return true;
    }),
    ...HTML_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Generation Buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Generate</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickGenerate('short')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              =� Short
            </button>
            <button
              onClick={() => handleQuickGenerate('medium')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              =� Medium  
            </button>
            <button
              onClick={() => handleQuickGenerate('long')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              =� Long
            </button>
          </div>
        </div>

        {/* Language Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Language Presets</h3>
          <div className="grid grid-cols-2 gap-1">
            {[
              { key: 'classic', label: '<� Classic', desc: 'Traditional Latin' },
              { key: 'readable', label: '=� Readable', desc: 'English words' },
              { key: 'technical', label: '=� Technical', desc: 'Dev terms' },
              { key: 'business', label: '<� Business', desc: 'Corporate speak' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleLanguagePreset(key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  (key === 'classic' && config.language === 'latin') ||
                  (key === 'readable' && config.language === 'english') ||
                  (key === 'technical' && config.language === 'tech') ||
                  (key === 'business' && config.language === 'corporate')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        <OptionsPanel
          title="Generation Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* HTML Tags Selection */}
        {config.includeHtml && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">HTML Tags</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setHtmlTags(HTML_TAG_OPTIONS.map(t => t.id))}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={() => setHtmlTags([])}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  None
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {Object.entries(tagsByCategory).map(([category, tags]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-600 border-b border-gray-200 pb-1">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {tags.map(tag => (
                      <label
                        key={tag.id}
                        className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={htmlTags.includes(tag.id)}
                          onChange={() => handleHtmlTagToggle(tag.id)}
                          className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{tag.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {htmlTags.length > 0 && (
              <div className="p-2 bg-blue-50 rounded text-xs">
                <span className="text-blue-600">Selected tags:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {htmlTags.map(tagId => (
                    <span key={tagId} className="inline-block bg-blue-100 text-blue-800 px-1 rounded">
                      {tagId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics Display */}
        {stats && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Text Statistics</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-green-600">Words:</span>
                  <div className="font-medium text-green-800">{stats.wordCount}</div>
                </div>
                <div>
                  <span className="text-green-600">Characters:</span>
                  <div className="font-medium text-green-800">{stats.characterCount}</div>
                </div>
                <div>
                  <span className="text-green-600">Sentences:</span>
                  <div className="font-medium text-green-800">{stats.sentenceCount}</div>
                </div>
                <div>
                  <span className="text-green-600">Paragraphs:</span>
                  <div className="font-medium text-green-800">{stats.paragraphCount}</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="text-green-700 text-xs">
                  <div>Avg words/sentence: {stats.averageWordsPerSentence}</div>
                  <div>Avg sentences/paragraph: {stats.averageSentencesPerParagraph}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Common Use Cases</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-yellow-50 rounded">
              <div className="font-medium text-yellow-800">Design Layouts</div>
              <div className="text-yellow-700">Use paragraphs to test typography and spacing</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">Web Development</div>
              <div className="text-blue-700">Generate HTML content for testing components</div>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <div className="font-medium text-purple-800">Content Strategy</div>
              <div className="text-purple-700">Create placeholder for content planning</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Generated Lorem Ipsum"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.includeHtml ? 'html' : 'text'}
          placeholder="Configure options on the left to generate Lorem Ipsum text..."
          processingMessage="Generating Lorem Ipsum..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  =� Copy Text
                </button>
                <button
                  onClick={() => {
                    const extension = config.includeHtml ? 'html' : 'txt';
                    const mimeType = config.includeHtml ? 'text/html' : 'text/plain';
                    const blob = new Blob([output], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `lorem-ipsum.${extension}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  =� Download File
                </button>
                <button
                  onClick={() => {
                    // Generate without HTML for plain text version
                    const plainConfig = { ...config, includeHtml: false, htmlTags: [] };
                    const plainResult = processLoremIpsumGenerator(plainConfig);
                    if (plainResult.success && plainResult.output) {
                      navigator.clipboard?.writeText(plainResult.output);
                    }
                  }}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  =� Copy Plain Text
                </button>
                {stats && (
                  <button
                    onClick={() => {
                      const statsText = `Lorem Ipsum Statistics

Words: ${stats.wordCount}
Characters: ${stats.characterCount}  
Sentences: ${stats.sentenceCount}
Paragraphs: ${stats.paragraphCount}
Average words per sentence: ${stats.averageWordsPerSentence}
Average sentences per paragraph: ${stats.averageSentencesPerParagraph}

Settings: ${config.count} ${config.outputType} in ${config.language}`;
                      
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