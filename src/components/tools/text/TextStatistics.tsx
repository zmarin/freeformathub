import { useState, useEffect, useMemo, useCallback } from 'react';
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (input.trim()) debouncedProcess(input, config);
            break;
          case 'g':
            e.preventDefault();
            generateSampleText();
            break;
          case '1':
            e.preventDefault();
            applyPreset('basic');
            break;
          case '2':
            e.preventDefault();
            applyPreset('comprehensive');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [input, config, debouncedProcess]);

  return (
    <div className={`${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)', alignItems: 'center' }}>
          {/* Primary Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <button onClick={generateSampleText} className="btn btn-primary" title="Generate sample text (Ctrl+G)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Sample Text
            </button>

            <button onClick={() => applyPreset('basic')} className="btn btn-secondary" title="Basic analysis (Ctrl+1)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Basic
            </button>

            <button onClick={() => applyPreset('comprehensive')} className="btn btn-outline" title="Full analysis (Ctrl+2)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              Full Analysis
            </button>

            <button onClick={() => applyPreset('readability')} className="btn btn-outline" title="Readability focus">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              Readability
            </button>

            <button onClick={() => applyPreset('frequency')} className="btn btn-outline" title="Frequency analysis">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Frequency
            </button>
          </div>

          {/* Stats & Settings */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
            {quickStats && (
              <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <span>Words: <strong>{quickStats.words.toLocaleString()}</strong></span>
                <span>Chars: <strong>{quickStats.characters.toLocaleString()}</strong></span>
                <span>Sentences: <strong>{quickStats.sentences}</strong></span>
                <span>Read Time: <strong>{quickStats.readingTime}min</strong></span>
                {error ? (
                  <span className="status-indicator status-invalid">✗ Error</span>
                ) : output ? (
                  <span className="status-indicator status-valid">✓ Analyzed</span>
                ) : isLoading ? (
                  <span className="status-indicator status-loading">… Analyzing</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid-responsive md:grid-cols-1" style={{
        // Responsive grid handled by CSS class

        minHeight: '500px'
      }}>
        {/* Input Panel */}
        <div style={{ position: 'relative', borderRight: '1px solid var(--color-border)' }} className="md:border-r-0 md:border-b md:border-b-gray-200">
          {/* Input Header */}
          <div className="grid-responsive" style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Text to Analyze
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setInput(text);
                } catch (error) {
                  console.warn('Failed to paste from clipboard');
                }
              }} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Paste
              </button>
              {input && (
                <button onClick={() => setInput('')} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div style={{ position: 'relative', height: '500px' }}>
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
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
              className="form-textarea grid-responsive" style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 0,
                fontFamily: 'var(--font-family-mono)',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'none',
                padding: 'var(--space-lg)'
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div style={{ position: 'relative' }}>
          {/* Output Header */}
          <div className="grid-responsive" style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Analysis Report
              {isLoading && <span style={{ marginLeft: 'var(--space-sm)', fontSize: '0.75rem', color: 'var(--color-primary)' }}>Analyzing...</span>}
            </span>
            {output && (
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(output);
                    } catch (error) {
                      console.error('Failed to copy:', error);
                    }
                  }}
                  className="btn btn-outline"
                  style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Copy
                </button>
                <button onClick={() => {
                  const blob = new Blob([output], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'text-analysis-report.md';
                  a.click();
                  URL.revokeObjectURL(url);
                }} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Download
                </button>
              </div>
            )}
          </div>

          {/* Output Content */}
          <div style={{ height: '500px', position: 'relative' }}>
            {error ? (
              <div className="grid-responsive" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-lg)',
                margin: 'var(--space-lg)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap'
              }}>
                <strong>Analysis Error:</strong><br />
                {error}
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="Text analysis report will appear here..."
                className="form-textarea grid-responsive" style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 0,
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'none',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface)'
                }}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Examples & Configuration - Collapsible */}
      <div className="grid-responsive" style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)'
      }}>
        <details className="group">
          <summary className="grid-responsive" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: 'var(--space-xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Examples & Configuration
            </div>
            <svg className="w-5 h-5 group-open:rotate-180 transition-transform" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div style={{ padding: 'var(--space-xl)' }}>
            {/* Configuration Panel */}
            <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>Analysis Options</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
                {OPTIONS.filter(opt => !opt.showWhen || opt.showWhen(config)).map((option) => (
                  <div key={option.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof TextStatisticsConfig]}
                          onChange={(e) => handleConfigChange({ ...config, [option.key]: e.target.checked })}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        {option.description}
                      </label>
                    ) : option.type === 'number' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <input
                          type="number"
                          min={option.min}
                          max={option.max}
                          value={config[option.key as keyof TextStatisticsConfig] as number}
                          onChange={(e) => handleConfigChange({ ...config, [option.key]: parseInt(e.target.value) || option.default })}
                          className="form-input"
                          style={{ fontSize: '0.875rem' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{option.description}</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Examples Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
              {QUICK_EXAMPLES.map((example, idx) => (
                <div key={idx} className="card" style={{ padding: 'var(--space-lg)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                    {example.name}
                  </div>
                  <div className="grid-responsive" style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.75rem',
                    marginBottom: 'var(--space-md)',
                    color: 'var(--color-text-secondary)',
                    maxHeight: '3rem',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {example.input.split('\n')[0]}...
                  </div>
                  <button
                    onClick={() => insertExample(example)}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.875rem' }}
                  >
                    Try This Example
                  </button>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}