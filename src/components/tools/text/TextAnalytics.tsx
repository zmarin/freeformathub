import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processTextAnalytics, type TextAnalyticsConfig } from '../../../tools/text/text-analytics';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface TextAnalyticsProps {
  className?: string;
}

const DEFAULT_CONFIG: TextAnalyticsConfig = {
  analysisType: 'comprehensive',
  sentimentDetailed: true,
  keywordCount: 10,
  includeStatistics: true,
  languageDetection: true,
  readabilityScores: true,
  entityExtraction: true,
  toneAnalysis: true,
  grammarCheck: true,
  duplicateDetection: true,
  wordFrequency: true,
  styleAnalysis: true,
};

const ANALYSIS_OPTIONS = [
  {
    key: 'analysisType',
    label: 'Analysis Type',
    type: 'select' as const,
    default: 'comprehensive',
    options: [
      { value: 'comprehensive', label: '📊 Comprehensive - Complete analysis' },
      { value: 'sentiment', label: '💭 Sentiment - Emotion and polarity' },
      { value: 'readability', label: '📚 Readability - Reading difficulty' },
      { value: 'keywords', label: '🔑 Keywords - Key terms and phrases' },
      { value: 'structure', label: '🏗️ Structure - Document organization' },
    ],
    description: 'Choose the type of analysis to perform',
  },
  {
    key: 'keywordCount',
    label: 'Keyword Count',
    type: 'select' as const,
    default: 10,
    options: [
      { value: 5, label: '5 keywords' },
      { value: 10, label: '10 keywords' },
      { value: 15, label: '15 keywords' },
      { value: 20, label: '20 keywords' },
    ],
    description: 'Number of top keywords to extract',
  },
] as const;

const FEATURE_OPTIONS = [
  {
    key: 'includeStatistics',
    label: 'Basic Statistics',
    type: 'checkbox' as const,
    default: true,
    description: 'Include word count, sentence count, etc.',
  },
  {
    key: 'sentimentDetailed',
    label: 'Detailed Sentiment',
    type: 'checkbox' as const,
    default: true,
    description: 'Include emotion breakdown and paragraph-level sentiment',
  },
  {
    key: 'readabilityScores',
    label: 'Readability Scores',
    type: 'checkbox' as const,
    default: true,
    description: 'Calculate Flesch-Kincaid, Gunning Fog, etc.',
  },
  {
    key: 'languageDetection',
    label: 'Language Detection',
    type: 'checkbox' as const,
    default: true,
    description: 'Detect text language and writing system',
  },
  {
    key: 'entityExtraction',
    label: 'Entity Extraction',
    type: 'checkbox' as const,
    default: true,
    description: 'Extract names, dates, URLs, emails, etc.',
  },
  {
    key: 'toneAnalysis',
    label: 'Tone Analysis',
    type: 'checkbox' as const,
    default: true,
    description: 'Analyze formality, emotion, and writing style',
  },
  {
    key: 'styleAnalysis',
    label: 'Style Analysis',
    type: 'checkbox' as const,
    default: true,
    description: 'Analyze punctuation, voice, and verb tenses',
  },
  {
    key: 'grammarCheck',
    label: 'Grammar Check',
    type: 'checkbox' as const,
    default: true,
    description: 'Basic grammar and quality issues',
  },
  {
    key: 'wordFrequency',
    label: 'Word Frequency',
    type: 'checkbox' as const,
    default: true,
    description: 'Show most common words',
  },
  {
    key: 'duplicateDetection',
    label: 'Duplicate Detection',
    type: 'checkbox' as const,
    default: true,
    description: 'Find repeated sentences and phrases',
  },
] as const;

export function TextAnalytics({ className = '' }: TextAnalyticsProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<TextAnalyticsConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (currentInput: string, currentConfig: TextAnalyticsConfig) => {
      if (!currentInput.trim()) {
        setOutput('');
        setAnalytics(null);
        setError(null);
        setWarnings([]);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = await processTextAnalytics(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setAnalytics(result.analytics);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'text-analytics',
            input: currentInput.length > 100 ? currentInput.substring(0, 100) + '...' : currentInput,
            output: result.analytics ? 
              `${result.analytics.basic.wordCount} words, ${result.analytics.sentiment.overall} sentiment` : 
              'Analyzed',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to analyze text');
          setOutput('');
          setAnalytics(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during text analysis');
        setOutput('');
        setAnalytics(null);
      } finally {
        setIsProcessing(false);
      }
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('text-analytics');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'marketing' | 'academic' | 'blog' | 'news' | 'social' | 'technical' | 'creative' | 'business') => {
    const examples = {
      marketing: {
        data: `Get amazing results now! Our revolutionary product will transform your life completely. Don't miss this incredible opportunity - limited time offer with 50% off! Join thousands of satisfied customers who have already discovered the secret to success. Contact us today at info@company.com or call 1-800-555-0123. Your satisfaction is guaranteed or your money back!`,
        config: { analysisType: 'comprehensive', sentimentDetailed: true, toneAnalysis: true, entityExtraction: true }
      },
      academic: {
        data: `The methodology employed in this research study involves a comprehensive quantitative analysis of data collected through systematic observation and controlled experimentation. The results indicate a statistically significant correlation between the independent and dependent variables, suggesting important theoretical implications for future research in this domain. Furthermore, the findings contribute to our understanding of the underlying mechanisms and provide empirical support for the proposed theoretical framework.`,
        config: { analysisType: 'comprehensive', readabilityScores: true, toneAnalysis: true, styleAnalysis: true }
      },
      blog: {
        data: `Hey everyone! I wanted to share my thoughts on the latest technology trends that are shaping our world. Artificial intelligence and machine learning are becoming incredibly powerful tools that help us solve complex problems. From smart homes to autonomous vehicles, these innovations are making our lives easier and more efficient. What do you think about these exciting developments? I'd love to hear your opinions in the comments below!`,
        config: { analysisType: 'comprehensive', sentimentDetailed: true, toneAnalysis: true, keywordCount: 15 }
      },
      news: {
        data: `The city council announced today that construction on the new community center will begin next month. The $2.3 million project, funded through municipal bonds, is expected to create 150 jobs during the 18-month construction period. Mayor Johnson stated that the facility will serve over 10,000 residents and include a gymnasium, meeting rooms, and educational spaces. The center is scheduled to open in fall 2025.`,
        config: { analysisType: 'comprehensive', entityExtraction: true, languageDetection: true, toneAnalysis: true }
      },
      social: {
        data: `Just had the most amazing coffee at this new café downtown! ☕ The barista was super friendly and the atmosphere is perfect for working or studying. Definitely coming back tomorrow. Has anyone else been there? Would love to hear your thoughts! #coffee #local #downtown #cafe`,
        config: { analysisType: 'sentiment', sentimentDetailed: true, toneAnalysis: true, entityExtraction: true }
      },
      technical: {
        data: `The implementation requires careful consideration of memory allocation and garbage collection patterns. We utilize a multi-threaded approach with concurrent data structures to optimize performance. The algorithm complexity is O(n log n) in the worst case, with space complexity of O(n). Error handling follows the established patterns with proper exception propagation and logging mechanisms integrated throughout the system architecture.`,
        config: { analysisType: 'comprehensive', readabilityScores: true, styleAnalysis: true, keywordCount: 20 }
      },
      creative: {
        data: `The moonlight danced across the shimmering lake, casting ethereal shadows that whispered secrets to the night. Sarah felt a profound sense of wonder as she watched the stars reflect in the water like scattered diamonds. This magical moment would stay with her forever, a memory carved deep into her heart. The gentle breeze carried the scent of jasmine, completing this perfect symphony of nature's beauty.`,
        config: { analysisType: 'comprehensive', sentimentDetailed: true, styleAnalysis: true, toneAnalysis: true }
      },
      business: {
        data: `Dear valued stakeholders, we are pleased to announce that our quarterly revenue has exceeded projections by 15%, demonstrating strong market performance and operational efficiency. The executive team has approved the expansion into three new markets, with implementation scheduled for Q2. We remain committed to delivering exceptional value to our clients while maintaining our focus on sustainable growth and innovation. We appreciate your continued support and trust in our organization.`,
        config: { analysisType: 'comprehensive', toneAnalysis: true, readabilityScores: true, styleAnalysis: true }
      }
    };
    
    const example = examples[type];
    setInput(example.data);
    
    // Apply configuration changes
    Object.entries(example.config).forEach(([key, value]) => {
      setConfig(prev => ({ ...prev, [key]: value }));
    });
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
    setConfig(DEFAULT_CONFIG);
  };

  // Build all options
  const allOptions = [
    ...ANALYSIS_OPTIONS,
    ...FEATURE_OPTIONS,
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'text-green-800 bg-green-100';
      case 'negative': return 'text-red-800 bg-red-100';
      case 'mixed': return 'text-yellow-800 bg-yellow-100';
      case 'neutral': return 'text-gray-800 bg-gray-100';
      default: return 'text-blue-800 bg-blue-100';
    }
  };

  const getReadabilityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'elementary': return 'text-green-800 bg-green-100';
      case 'middle-school': return 'text-blue-800 bg-blue-100';
      case 'high-school': return 'text-orange-800 bg-orange-100';
      case 'college': return 'text-red-800 bg-red-100';
      case 'graduate': return 'text-purple-800 bg-purple-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-800 bg-green-100';
    if (score >= 75) return 'text-blue-800 bg-blue-100';
    if (score >= 60) return 'text-yellow-800 bg-yellow-100';
    if (score >= 40) return 'text-orange-800 bg-orange-100';
    return 'text-red-800 bg-red-100';
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Summary */}
        {analytics && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Quick Summary</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getSentimentColor(analytics.sentiment.overall)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">💭</div>
                  <div>
                    <div className="font-medium text-sm">
                      {analytics.sentiment.overall.toUpperCase()} Sentiment
                    </div>
                    <div className="text-xs opacity-80">
                      {(analytics.sentiment.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Words:</span>
                    <span className="text-blue-800 font-medium">{analytics.basic.wordCount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-2 bg-green-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-600">Reading:</span>
                    <span className="text-green-800 font-medium">{analytics.basic.readingTime}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Readability Info */}
        {analytics && analytics.readability && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Readability</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getReadabilityColor(analytics.readability.readingLevel)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📚</div>
                  <div>
                    <div className="font-medium text-sm">
                      {analytics.readability.readingLevel.replace('-', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs opacity-80">
                      {analytics.readability.complexity.replace('-', ' ')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-purple-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-purple-600">F-K Grade:</span>
                    <span className="text-purple-800 font-medium">{analytics.readability.fleschKincaidGrade}</span>
                  </div>
                </div>
                <div className="p-2 bg-indigo-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-indigo-600">Reading Ease:</span>
                    <span className="text-indigo-800 font-medium">{analytics.readability.fleschReadingEase}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Language & Quality */}
        {analytics && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Language & Quality</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Language:</span>
                <span className="text-gray-800 font-medium">
                  {analytics.language.detectedLanguage} ({(analytics.language.confidence * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Unique words:</span>
                <span className="text-gray-800 font-medium">{analytics.basic.uniqueWords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Diversity:</span>
                <span className="text-gray-800 font-medium">{(analytics.basic.lexicalDiversity * 100).toFixed(1)}%</span>
              </div>
              {analytics.quality && (
                <div className={`flex justify-between text-xs p-2 rounded ${getQualityColor(analytics.quality.overallQuality)}`}>
                  <span className="opacity-80">Quality score:</span>
                  <span className="font-medium">{analytics.quality.overallQuality}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Keywords */}
        {analytics && analytics.keywords && analytics.keywords.extractedKeywords.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Top Keywords</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {analytics.keywords.extractedKeywords.slice(0, 8).map((keyword: any, index: number) => (
                <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-orange-800">"{keyword.word}"</span>
                    <div className="flex gap-1">
                      <span className="px-1 bg-orange-200 text-orange-800 rounded text-xs">
                        {keyword.frequency}×
                      </span>
                      <span className="px-1 bg-orange-100 text-orange-700 rounded text-xs">
                        {keyword.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entities */}
        {analytics && analytics.entities && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Extracted Entities</h3>
            <div className="space-y-2">
              {analytics.entities.emails.length > 0 && (
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <div className="font-medium text-blue-800 mb-1">📧 Emails</div>
                  <div className="space-y-1">
                    {analytics.entities.emails.map((email: any, index: number) => (
                      <div key={index} className="text-blue-700">{email.email}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {analytics.entities.urls.length > 0 && (
                <div className="p-2 bg-green-50 rounded text-xs">
                  <div className="font-medium text-green-800 mb-1">🔗 URLs</div>
                  <div className="space-y-1">
                    {analytics.entities.urls.map((url: any, index: number) => (
                      <div key={index} className="text-green-700">{url.domain}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {analytics.entities.phoneNumbers.length > 0 && (
                <div className="p-2 bg-purple-50 rounded text-xs">
                  <div className="font-medium text-purple-800 mb-1">📞 Phone Numbers</div>
                  <div className="space-y-1">
                    {analytics.entities.phoneNumbers.map((phone: any, index: number) => (
                      <div key={index} className="text-purple-700">{phone.number}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {analytics.entities.people.length > 0 && (
                <div className="p-2 bg-pink-50 rounded text-xs">
                  <div className="font-medium text-pink-800 mb-1">👥 People</div>
                  <div className="space-y-1">
                    {analytics.entities.people.map((person: any, index: number) => (
                      <div key={index} className="text-pink-700">{person.name}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('marketing')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📢 Marketing Copy
            </button>
            <button
              onClick={() => handleQuickExample('academic')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🎓 Academic Text
            </button>
            <button
              onClick={() => handleQuickExample('blog')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              📝 Blog Post
            </button>
            <button
              onClick={() => handleQuickExample('news')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              📰 News Article
            </button>
            <button
              onClick={() => handleQuickExample('social')}
              className="px-3 py-2 text-xs bg-pink-100 text-pink-800 rounded hover:bg-pink-200 transition-colors text-left"
            >
              💬 Social Media
            </button>
            <button
              onClick={() => handleQuickExample('technical')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              🔧 Technical Writing
            </button>
            <button
              onClick={() => handleQuickExample('creative')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              ✨ Creative Writing
            </button>
            <button
              onClick={() => handleQuickExample('business')}
              className="px-3 py-2 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-left"
            >
              💼 Business Communication
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Analysis Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Warnings</h3>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-800">{warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">About Text Analytics</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">📊 Analysis Features</div>
              <div className="space-y-1">
                <div>• Sentiment analysis with emotion detection</div>
                <div>• Readability scores (Flesch-Kincaid, etc.)</div>
                <div>• Keyword extraction and topic analysis</div>
                <div>• Entity recognition (names, emails, etc.)</div>
                <div>• Language detection and tone analysis</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🗑️ Clear Data
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="Text to Analyze"
          value={input}
          onChange={setInput}
          placeholder="Enter your text here for comprehensive analysis...

Examples:
• Marketing copy for sentiment and tone analysis
• Academic writing for readability assessment
• Blog posts for SEO keyword extraction
• Social media content for engagement analysis
• Technical documentation for complexity evaluation"
          language="text"
        />

        <OutputPanel
          title="Text Analysis Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="Comprehensive text analysis will appear here..."
          processingMessage="Analyzing text content..."
          customActions={
            output && analytics ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Analysis
                </button>
                <button
                  onClick={() => {
                    const summary = `Text Analysis Summary:
• ${analytics.basic.wordCount} words, ${analytics.basic.sentenceCount} sentences
• Sentiment: ${analytics.sentiment.overall} (${(analytics.sentiment.polarity * 100).toFixed(0)}%)
• Reading Level: ${analytics.readability.readingLevel}
• Top Keywords: ${analytics.keywords.extractedKeywords.slice(0, 5).map((k: any) => k.word).join(', ')}`;
                    navigator.clipboard?.writeText(summary);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📄 Copy Summary
                </button>
                <button
                  onClick={() => {
                    const keywords = analytics.keywords.extractedKeywords.map((k: any) => k.word).join(', ');
                    navigator.clipboard?.writeText(keywords);
                  }}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  🔑 Copy Keywords
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getSentimentColor(analytics.sentiment.overall)}`}>
                  {analytics.sentiment.overall.toUpperCase()}
                </div>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getReadabilityColor(analytics.readability.readingLevel)}`}>
                  {analytics.readability.readingLevel.replace('-', ' ').toUpperCase()}
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {analytics.basic.wordCount} words
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}