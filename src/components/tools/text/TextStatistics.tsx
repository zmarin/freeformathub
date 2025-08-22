import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processTextStatistics, type TextStatisticsConfig } from '../../../tools/text/text-statistics';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface TextStatisticsProps {
  className?: string;
}

const DEFAULT_CONFIG: TextStatisticsConfig = {
  includeBasicStats: true,
  includeAdvancedStats: true,
  includeReadabilityScores: true,
  includeCharacterFrequency: false,
  includeWordFrequency: true,
  includeSentenceAnalysis: true,
  includeParagraphAnalysis: false,
  includeLanguageDetection: false,
  caseSensitive: false,
  excludeStopWords: true,
  minWordLength: 2,
  maxTopWords: 10,
  maxTopCharacters: 10,
};

const OPTIONS = [
  {
    key: 'includeBasicStats',
    label: 'Basic Statistics',
    type: 'boolean' as const,
    default: true,
    description: 'Character count, word count, sentences, paragraphs, and averages',
  },
  {
    key: 'includeAdvancedStats',
    label: 'Advanced Statistics',
    type: 'boolean' as const,
    default: true,
    description: 'Unique words, lexical diversity, syllables, and word complexity',
  },
  {
    key: 'includeReadabilityScores',
    label: 'Readability Scores',
    type: 'boolean' as const,
    default: true,
    description: 'Flesch, Coleman-Liau, Gunning Fog, and other readability metrics',
  },
  {
    key: 'includeWordFrequency',
    label: 'Word Frequency Analysis',
    type: 'boolean' as const,
    default: true,
    description: 'Most common words and their occurrence percentages',
  },
  {
    key: 'includeCharacterFrequency',
    label: 'Character Frequency Analysis',
    type: 'boolean' as const,
    default: false,
    description: 'Most common letters and their occurrence percentages',
  },
  {
    key: 'includeSentenceAnalysis',
    label: 'Sentence Analysis',
    type: 'boolean' as const,
    default: true,
    description: 'Sentence length statistics and longest/shortest sentences',
  },
  {
    key: 'includeParagraphAnalysis',
    label: 'Paragraph Analysis',
    type: 'boolean' as const,
    default: false,
    description: 'Paragraph length statistics and structure analysis',
  },
  {
    key: 'includeLanguageDetection',
    label: 'Language Detection',
    type: 'boolean' as const,
    default: false,
    description: 'Basic language identification based on common word patterns',
  },
  {
    key: 'caseSensitive',
    label: 'Case Sensitive',
    type: 'boolean' as const,
    default: false,
    description: 'Treat uppercase and lowercase letters as different',
  },
  {
    key: 'excludeStopWords',
    label: 'Exclude Stop Words',
    type: 'boolean' as const,
    default: true,
    description: 'Exclude common words (the, and, is, etc.) from frequency analysis',
  },
  {
    key: 'minWordLength',
    label: 'Minimum Word Length',
    type: 'number' as const,
    default: 2,
    min: 1,
    max: 10,
    description: 'Minimum length for words to include in frequency analysis',
  },
  {
    key: 'maxTopWords',
    label: 'Max Top Words',
    type: 'number' as const,
    default: 10,
    min: 5,
    max: 50,
    description: 'Maximum number of top words to display',
    showWhen: (config: TextStatisticsConfig) => config.includeWordFrequency,
  },
  {
    key: 'maxTopCharacters',
    label: 'Max Top Characters',
    type: 'number' as const,
    default: 10,
    min: 5,
    max: 26,
    description: 'Maximum number of top characters to display',
    showWhen: (config: TextStatisticsConfig) => config.includeCharacterFrequency,
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Sample Article',
    input: `The quick brown fox jumps over the lazy dog. This pangram sentence contains every letter of the English alphabet at least once. It has been used for typing practice and font testing for many decades.

Writers and developers often use this sentence to test typefaces, keyboards, and other text-related systems. The sentence demonstrates various letter combinations and provides a good sample of English text structure.

Modern applications of this classic phrase extend beyond traditional typography. Software developers use it to test internationalization, text rendering engines, and character encoding systems.`,
    config: { ...DEFAULT_CONFIG, includeAdvancedStats: true, includeReadabilityScores: true }
  },
  {
    name: 'Technical Writing',
    input: `API documentation describes the functionality, parameters, return values, and usage examples for application programming interfaces. Clear documentation improves developer experience and reduces support requests.

Best practices include comprehensive examples, error handling descriptions, and version compatibility notes. Documentation should be regularly updated to reflect changes in the API.

Authentication mechanisms must be clearly explained with step-by-step implementation guides. Rate limiting, error codes, and response formats require detailed specification.`,
    config: { ...DEFAULT_CONFIG, includeReadabilityScores: true, includeWordFrequency: true, excludeStopWords: true }
  },
  {
    name: 'Creative Writing',
    input: `Once upon a time, in a land far away, there lived a curious little mouse named Chester. Chester loved exploring the vast meadows and hidden corners of his forest home.

Every morning, he would venture out to discover new paths and meet interesting creatures. His adventures taught him valuable lessons about friendship, courage, and the importance of helping others.

The forest was alive with sounds and colors that changed with each season. Spring brought fresh flowers and singing birds, while autumn painted the leaves in brilliant shades of gold and crimson.`,
    config: { ...DEFAULT_CONFIG, includeSentenceAnalysis: true, includeParagraphAnalysis: true, includeLanguageDetection: true }
  },
  {
    name: 'Academic Text',
    input: `The phenomenon of climate change represents one of the most significant challenges facing contemporary society. Scientific research demonstrates that anthropogenic activities, particularly the emission of greenhouse gases, contribute substantially to global temperature increases.

Mitigation strategies encompass technological innovations, policy interventions, and behavioral modifications. The implementation of renewable energy systems, carbon capture technologies, and sustainable transportation methods constitute essential components of comprehensive climate action frameworks.

International cooperation facilitates knowledge sharing and resource allocation for addressing transnational environmental challenges. Collaborative research initiatives enable the development of evidence-based solutions and adaptive management strategies.`,
    config: { ...DEFAULT_CONFIG, includeReadabilityScores: true, includeAdvancedStats: true, minWordLength: 4 }
  },
];

export function TextStatistics({ className = '' }: TextStatisticsProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<TextStatisticsConfig>(DEFAULT_CONFIG);
  const [quickStats, setQuickStats] = useState<{
    words: number;
    characters: number;
    sentences: number;
    readingTime: number;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: TextStatisticsConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setQuickStats(null);
        return;
      }

      // Quick stats calculation (immediate)
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characters = text.length;
      const sentences = Math.max(1, text.split(/[.!?]+/).filter(s => s.trim().length > 0).length);
      const readingTime = Math.ceil(words / 200); // Average 200 WPM reading speed
      
      setQuickStats({
        words,
        characters,
        sentences,
        readingTime,
      });

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processTextStatistics(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            
            addToHistory({
              toolId: 'text-statistics',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to analyze text');
        }
        
        setIsLoading(false);
      }, 500);
    }, 600),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: TextStatisticsConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig(example.config);
  };

  const generateSampleText = () => {
    const sampleText = `Text analysis is a fascinating field that combines linguistics, computer science, and statistics. By examining various properties of written content, we can gain insights into readability, complexity, and structure.

Modern text analysis tools can calculate numerous metrics including word frequency, sentence structure, and readability scores. These measurements help writers, editors, and researchers understand how their content might be perceived by different audiences.

The applications of text analysis extend far beyond academic research. Marketing professionals use it to optimize content for target demographics, while educators employ these tools to ensure materials match appropriate reading levels for their students.`;
    
    setInput(sampleText);
  };

  const presetConfigs = {
    basic: { ...DEFAULT_CONFIG, includeAdvancedStats: false, includeReadabilityScores: false, includeWordFrequency: false },
    comprehensive: { ...DEFAULT_CONFIG, includeCharacterFrequency: true, includeParagraphAnalysis: true, includeLanguageDetection: true },
    readability: { ...DEFAULT_CONFIG, includeAdvancedStats: true, includeReadabilityScores: true, includeWordFrequency: false, includeSentenceAnalysis: true },
    frequency: { ...DEFAULT_CONFIG, includeWordFrequency: true, includeCharacterFrequency: true, excludeStopWords: true, maxTopWords: 20 },
  };

  const applyPreset = (preset: keyof typeof presetConfigs) => {
    setConfig(presetConfigs[preset]);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="Text Input"
          placeholder={`Enter text to analyze:

The quick brown fox jumps over the lazy dog. This sentence demonstrates the comprehensive analysis capabilities of our text statistics tool.

Features include:
- Word and character counting
- Readability scoring (Flesch, Coleman-Liau, etc.)
- Frequency analysis for words and characters
- Sentence and paragraph structure analysis
- Language detection
- Lexical diversity measurement

Perfect for writers, editors, researchers, and content creators who need detailed insights into their text quality and complexity.`}
          syntax="text"
          examples={[
            {
              title: 'Simple Text',
              value: 'The quick brown fox jumps over the lazy dog. This sentence contains all letters of the alphabet.',
            },
            {
              title: 'Multiple Paragraphs',
              value: 'First paragraph with several sentences. Each sentence adds to the overall analysis.\n\nSecond paragraph provides more content. Statistical analysis becomes more accurate with larger text samples.',
            },
            {
              title: 'Technical Content',
              value: 'API documentation describes functionality, parameters, and usage examples. Clear documentation improves developer experience.',
            },
          ]}
        />

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={generateSampleText}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Sample Text
            </button>
            <button
              onClick={() => applyPreset('basic')}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Basic Analysis
            </button>
            <button
              onClick={() => applyPreset('comprehensive')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
            >
              Full Analysis
            </button>
            <button
              onClick={() => applyPreset('readability')}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              Readability Focus
            </button>
          </div>

          {/* Quick Stats */}
          {quickStats && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Quick Overview:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Words:</span>
                    <span className="font-mono font-bold">{quickStats.words.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Characters:</span>
                    <span className="font-mono font-bold">{quickStats.characters.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Sentences:</span>
                    <span className="font-mono font-bold">{quickStats.sentences.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Read Time:</span>
                    <span className="font-mono font-bold">{quickStats.readingTime} min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Settings */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Analysis Settings:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                Enabled: {[
                  config.includeBasicStats && 'Basic',
                  config.includeAdvancedStats && 'Advanced',
                  config.includeReadabilityScores && 'Readability',
                  config.includeWordFrequency && 'Word Freq',
                  config.includeCharacterFrequency && 'Char Freq',
                  config.includeSentenceAnalysis && 'Sentences',
                  config.includeParagraphAnalysis && 'Paragraphs',
                  config.includeLanguageDetection && 'Language'
                ].filter(Boolean).join(', ') || 'None'}
              </div>
              <div>
                Options: {[
                  !config.caseSensitive && 'Case Insensitive',
                  config.excludeStopWords && 'No Stop Words',
                  `Min Length: ${config.minWordLength}`,
                  config.includeWordFrequency && `Top ${config.maxTopWords} Words`
                ].filter(Boolean).join(', ')}
              </div>
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
                    {example.input.split('\n')[0].length > 40 ? 
                      example.input.split('\n')[0].substring(0, 40) + '...' : 
                      example.input.split('\n')[0]
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>
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
        label="Text Analysis Report"
        syntax="markdown"
        downloadFilename="text-analysis-report.md"
        downloadContentType="text/markdown"
      />
    </div>
  );
}