import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface TextAnalyticsConfig {
  analysisType: 'comprehensive' | 'sentiment' | 'readability' | 'keywords' | 'structure';
  sentimentDetailed: boolean;
  keywordCount: number;
  includeStatistics: boolean;
  languageDetection: boolean;
  readabilityScores: boolean;
  entityExtraction: boolean;
  toneAnalysis: boolean;
  grammarCheck: boolean;
  duplicateDetection: boolean;
  wordFrequency: boolean;
  styleAnalysis: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  analytics?: TextAnalytics;
  warnings?: string[];
}

interface TextAnalytics {
  basic: BasicStatistics;
  sentiment: SentimentAnalysis;
  readability: ReadabilityMetrics;
  keywords: KeywordAnalysis;
  structure: StructureAnalysis;
  language: LanguageAnalysis;
  entities: EntityExtraction;
  tone: ToneAnalysis;
  style: StyleAnalysis;
  quality: QualityMetrics;
}

interface BasicStatistics {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  averageCharactersPerWord: number;
  uniqueWords: number;
  lexicalDiversity: number;
  commonWords: Array<{ word: string; count: number; percentage: number }>;
  longestWord: string;
  shortestWord: string;
  readingTime: number; // in minutes
}

interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  polarity: number; // -1 to 1
  subjectivity: number; // 0 to 1
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
    trust: number;
    anticipation: number;
  };
  sentimentByParagraph: Array<{
    paragraph: number;
    sentiment: string;
    score: number;
  }>;
}

interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  gunningFog: number;
  colemanLiau: number;
  automatedReadabilityIndex: number;
  readingLevel: 'elementary' | 'middle-school' | 'high-school' | 'college' | 'graduate';
  estimatedReadingTime: number;
  complexity: 'very-easy' | 'easy' | 'fairly-easy' | 'standard' | 'fairly-difficult' | 'difficult' | 'very-difficult';
}

interface KeywordAnalysis {
  extractedKeywords: Array<{ word: string; score: number; frequency: number }>;
  keyphrases: Array<{ phrase: string; score: number; frequency: number }>;
  topics: Array<{ topic: string; confidence: number; keywords: string[] }>;
  categories: Array<{ category: string; confidence: number }>;
  tags: string[];
}

interface StructureAnalysis {
  headings: Array<{ level: number; text: string; position: number }>;
  lists: Array<{ type: 'ordered' | 'unordered'; items: number; position: number }>;
  codeBlocks: Array<{ language?: string; lines: number; position: number }>;
  links: Array<{ text: string; url: string; type: 'internal' | 'external' }>;
  quotes: Array<{ text: string; type: 'block' | 'inline'; position: number }>;
  emphasis: Array<{ text: string; type: 'bold' | 'italic' | 'underline'; position: number }>;
}

interface LanguageAnalysis {
  detectedLanguage: string;
  confidence: number;
  alternativeLanguages: Array<{ language: string; confidence: number }>;
  languageFeatures: {
    hasAccents: boolean;
    hasSpecialCharacters: boolean;
    writingSystem: 'latin' | 'cyrillic' | 'arabic' | 'chinese' | 'japanese' | 'other';
    textDirection: 'ltr' | 'rtl';
  };
}

interface EntityExtraction {
  people: Array<{ name: string; confidence: number; context: string }>;
  organizations: Array<{ name: string; confidence: number; context: string }>;
  locations: Array<{ name: string; confidence: number; context: string }>;
  dates: Array<{ date: string; format: string; context: string }>;
  numbers: Array<{ value: number; type: 'integer' | 'decimal' | 'percentage' | 'currency'; context: string }>;
  urls: Array<{ url: string; domain: string; type: string }>;
  emails: Array<{ email: string; domain: string; context: string }>;
  phoneNumbers: Array<{ number: string; format: string; country?: string }>;
}

interface ToneAnalysis {
  formalityLevel: 'very-informal' | 'informal' | 'neutral' | 'formal' | 'very-formal';
  emotionalTone: 'analytical' | 'confident' | 'tentative' | 'joyful' | 'sad' | 'angry' | 'fearful';
  socialTone: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
  writingStyle: 'academic' | 'business' | 'creative' | 'technical' | 'conversational' | 'journalistic';
  audience: 'general' | 'professional' | 'academic' | 'technical' | 'children' | 'youth';
}

interface StyleAnalysis {
  punctuationUsage: {
    periods: number;
    commas: number;
    semicolons: number;
    colons: number;
    questionMarks: number;
    exclamationMarks: number;
    quotationMarks: number;
    parentheses: number;
  };
  capitalizationPatterns: {
    properNouns: number;
    acronyms: number;
    allCaps: number;
    sentenceStarts: number;
  };
  verbTenses: {
    present: number;
    past: number;
    future: number;
    progressive: number;
    perfect: number;
  };
  voiceAnalysis: {
    activeVoice: number;
    passiveVoice: number;
    ratio: number;
  };
}

interface QualityMetrics {
  grammarIssues: Array<{ type: string; message: string; suggestion: string; position: number }>;
  spellingErrors: Array<{ word: string; suggestions: string[]; position: number }>;
  styleIssues: Array<{ type: string; message: string; suggestion: string; position: number }>;
  duplicateSentences: Array<{ sentence: string; occurrences: number; positions: number[] }>;
  plagiarismRisk: 'low' | 'medium' | 'high';
  overallQuality: number; // 0-100 score
}

// Mock implementations for demonstration
function analyzeBasicStatistics(text: string): BasicStatistics {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const uniqueWordsSet = new Set(words);
  
  // Word frequency analysis
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const commonWords = Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      percentage: (count / words.length) * 100
    }));
  
  const wordLengths = words.map(w => w.length);
  const longestWord = words.reduce((longest, current) => 
    current.length > longest.length ? current : longest, '');
  const shortestWord = words.reduce((shortest, current) => 
    current.length < shortest.length ? current : shortest, words[0] || '');
  
  return {
    characterCount: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
    averageSentencesPerParagraph: paragraphs.length > 0 ? sentences.length / paragraphs.length : 0,
    averageCharactersPerWord: words.length > 0 ? wordLengths.reduce((a, b) => a + b, 0) / words.length : 0,
    uniqueWords: uniqueWordsSet.size,
    lexicalDiversity: words.length > 0 ? uniqueWordsSet.size / words.length : 0,
    commonWords,
    longestWord,
    shortestWord,
    readingTime: Math.ceil(words.length / 250) // 250 words per minute average
  };
}

function analyzeSentiment(text: string): SentimentAnalysis {
  // Simple sentiment analysis based on word patterns
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'joy', 'positive', 'success', 'brilliant', 'perfect', 'outstanding'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'negative', 'failure', 'worst', 'disappointing', 'frustrating', 'annoying', 'disgusting'];
  
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  const totalSentimentWords = positiveScore + negativeScore;
  const polarity = totalSentimentWords > 0 
    ? (positiveScore - negativeScore) / totalSentimentWords 
    : 0;
  
  let overall: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
  if (polarity > 0.2) overall = 'positive';
  else if (polarity < -0.2) overall = 'negative';
  else if (totalSentimentWords > 0) overall = 'mixed';
  
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const sentimentByParagraph = paragraphs.map((para, index) => {
    const paraWords = para.toLowerCase().match(/\b\w+\b/g) || [];
    let paraPositive = 0;
    let paraNegative = 0;
    
    paraWords.forEach(word => {
      if (positiveWords.includes(word)) paraPositive++;
      if (negativeWords.includes(word)) paraNegative++;
    });
    
    const paraTotal = paraPositive + paraNegative;
    const paraPolarity = paraTotal > 0 ? (paraPositive - paraNegative) / paraTotal : 0;
    let paraSentiment = 'neutral';
    if (paraPolarity > 0.2) paraSentiment = 'positive';
    else if (paraPolarity < -0.2) paraSentiment = 'negative';
    
    return {
      paragraph: index + 1,
      sentiment: paraSentiment,
      score: paraPolarity
    };
  });
  
  return {
    overall,
    polarity,
    subjectivity: Math.min(1, totalSentimentWords / Math.max(words.length * 0.1, 1)),
    confidence: Math.min(1, totalSentimentWords / 10),
    emotions: {
      joy: positiveScore > 0 ? 0.6 + (positiveScore * 0.1) : 0.2,
      anger: negativeScore > 0 ? 0.5 + (negativeScore * 0.1) : 0.1,
      fear: negativeScore > 2 ? 0.4 : 0.1,
      sadness: negativeScore > 1 ? 0.4 : 0.1,
      surprise: 0.3,
      disgust: negativeScore > 3 ? 0.3 : 0.1,
      trust: positiveScore > 2 ? 0.7 : 0.4,
      anticipation: 0.4
    },
    sentimentByParagraph
  };
}

function analyzeReadability(text: string): ReadabilityMetrics {
  const words = text.match(/\b\w+\b/g) || [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  
  // Flesch-Kincaid Grade Level
  const fleschKincaidGrade = sentences.length > 0 && words.length > 0
    ? 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59
    : 0;
  
  // Flesch Reading Ease
  const fleschReadingEase = sentences.length > 0 && words.length > 0
    ? 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
    : 0;
  
  // Gunning Fog Index
  const complexWords = words.filter(word => countSyllables(word) >= 3).length;
  const gunningFog = sentences.length > 0 && words.length > 0
    ? 0.4 * ((words.length / sentences.length) + 100 * (complexWords / words.length))
    : 0;
  
  // Coleman-Liau Index
  const characters = text.replace(/[^a-zA-Z]/g, '').length;
  const colemanLiau = words.length > 0
    ? 0.0588 * (characters / words.length * 100) - 0.296 * (sentences.length / words.length * 100) - 15.8
    : 0;
  
  // Automated Readability Index
  const automatedReadabilityIndex = sentences.length > 0 && words.length > 0
    ? 4.71 * (characters / words.length) + 0.5 * (words.length / sentences.length) - 21.43
    : 0;
  
  // Determine reading level
  const avgGrade = (fleschKincaidGrade + gunningFog + colemanLiau + automatedReadabilityIndex) / 4;
  let readingLevel: ReadabilityMetrics['readingLevel'] = 'elementary';
  if (avgGrade >= 13) readingLevel = 'graduate';
  else if (avgGrade >= 9) readingLevel = 'college';
  else if (avgGrade >= 6) readingLevel = 'high-school';
  else if (avgGrade >= 3) readingLevel = 'middle-school';
  
  // Determine complexity
  let complexity: ReadabilityMetrics['complexity'] = 'standard';
  if (fleschReadingEase >= 90) complexity = 'very-easy';
  else if (fleschReadingEase >= 80) complexity = 'easy';
  else if (fleschReadingEase >= 70) complexity = 'fairly-easy';
  else if (fleschReadingEase >= 60) complexity = 'standard';
  else if (fleschReadingEase >= 50) complexity = 'fairly-difficult';
  else if (fleschReadingEase >= 30) complexity = 'difficult';
  else complexity = 'very-difficult';
  
  return {
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    gunningFog: Math.round(gunningFog * 10) / 10,
    colemanLiau: Math.round(colemanLiau * 10) / 10,
    automatedReadabilityIndex: Math.round(automatedReadabilityIndex * 10) / 10,
    readingLevel,
    estimatedReadingTime: Math.ceil(words.length / 250),
    complexity
  };
}

function countSyllables(word: string): number {
  // Simple syllable counting algorithm
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  let count = word.match(/[aeiouy]+/g)?.length || 0;
  if (word.endsWith('e')) count--;
  if (word.endsWith('le') && word.length > 2) count++;
  
  return Math.max(1, count);
}

function analyzeKeywords(text: string, keywordCount: number): KeywordAnalysis {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);
  
  // Filter out stop words and short words
  const meaningfulWords = words.filter(word => 
    !stopWords.has(word) && word.length > 2
  );
  
  // Count word frequencies
  const wordCounts: Record<string, number> = {};
  meaningfulWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Calculate keyword scores (TF-IDF approximation)
  const extractedKeywords = Object.entries(wordCounts)
    .map(([word, frequency]) => ({
      word,
      score: frequency * Math.log(words.length / frequency),
      frequency
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, keywordCount);
  
  // Extract key phrases (simple bigrams)
  const bigrams: Record<string, number> = {};
  for (let i = 0; i < meaningfulWords.length - 1; i++) {
    const phrase = `${meaningfulWords[i]} ${meaningfulWords[i + 1]}`;
    bigrams[phrase] = (bigrams[phrase] || 0) + 1;
  }
  
  const keyphrases = Object.entries(bigrams)
    .filter(([, count]) => count > 1)
    .map(([phrase, frequency]) => ({
      phrase,
      score: frequency * 2, // Bigrams get higher scores
      frequency
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.floor(keywordCount / 2));
  
  // Mock topic analysis
  const topKeywords = extractedKeywords.slice(0, 5).map(k => k.word);
  const topics = [
    {
      topic: 'Main Theme',
      confidence: 0.8,
      keywords: topKeywords.slice(0, 3)
    }
  ];
  
  // Mock categorization
  const categories = [
    { category: 'General', confidence: 0.7 }
  ];
  
  return {
    extractedKeywords,
    keyphrases,
    topics,
    categories,
    tags: extractedKeywords.slice(0, 5).map(k => k.word)
  };
}

function analyzeStructure(text: string): StructureAnalysis {
  // Mock structure analysis
  const headings = text.match(/^#{1,6}\s+(.+)$/gm)?.map((match, index) => ({
    level: (match.match(/^#+/) || [''])[0].length,
    text: match.replace(/^#+\s+/, ''),
    position: text.indexOf(match)
  })) || [];
  
  const links = text.match(/\[([^\]]+)\]\(([^)]+)\)/g)?.map(match => {
    const [, text, url] = match.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
    return {
      text: text || '',
      url: url || '',
      type: url?.startsWith('http') ? 'external' as const : 'internal' as const
    };
  }) || [];
  
  const codeBlocks = text.match(/```(\w+)?\n([\s\S]*?)```/g)?.map((match, index) => {
    const lines = match.split('\n').length - 2;
    const language = match.match(/```(\w+)/)?.[1];
    return {
      language,
      lines,
      position: text.indexOf(match)
    };
  }) || [];
  
  return {
    headings,
    lists: [], // Simplified for mock
    codeBlocks,
    links,
    quotes: [],
    emphasis: []
  };
}

function analyzeLanguage(text: string): LanguageAnalysis {
  // Simple language detection based on character patterns
  const hasAccents = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(text);
  const hasCyrillic = /[а-я]/i.test(text);
  const hasArabic = /[\u0600-\u06FF]/i.test(text);
  const hasChinese = /[\u4e00-\u9fff]/i.test(text);
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/i.test(text);
  
  let detectedLanguage = 'English';
  let confidence = 0.8;
  let writingSystem: LanguageAnalysis['languageFeatures']['writingSystem'] = 'latin';
  
  if (hasCyrillic) {
    detectedLanguage = 'Russian';
    writingSystem = 'cyrillic';
    confidence = 0.9;
  } else if (hasArabic) {
    detectedLanguage = 'Arabic';
    writingSystem = 'arabic';
    confidence = 0.9;
  } else if (hasChinese) {
    detectedLanguage = 'Chinese';
    writingSystem = 'chinese';
    confidence = 0.9;
  } else if (hasJapanese) {
    detectedLanguage = 'Japanese';
    writingSystem = 'japanese';
    confidence = 0.9;
  } else if (hasAccents) {
    // Could be various European languages
    if (text.includes('ç') || text.includes('ão')) {
      detectedLanguage = 'Portuguese';
    } else if (text.includes('ñ')) {
      detectedLanguage = 'Spanish';
    } else if (text.includes('é') && text.includes('à')) {
      detectedLanguage = 'French';
    } else {
      detectedLanguage = 'European Language';
    }
    confidence = 0.7;
  }
  
  return {
    detectedLanguage,
    confidence,
    alternativeLanguages: [
      { language: 'English', confidence: detectedLanguage === 'English' ? confidence : 0.3 }
    ],
    languageFeatures: {
      hasAccents,
      hasSpecialCharacters: /[^\w\s.,!?;:'"()-]/.test(text),
      writingSystem,
      textDirection: writingSystem === 'arabic' ? 'rtl' : 'ltr'
    }
  };
}

function extractEntities(text: string): EntityExtraction {
  // Simple regex-based entity extraction
  const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g)?.map(email => ({
    email,
    domain: email.split('@')[1],
    context: 'email address'
  })) || [];
  
  const urls = text.match(/https?:\/\/[^\s]+/g)?.map(url => {
    const domain = url.match(/https?:\/\/([^\/]+)/)?.[1] || '';
    return {
      url,
      domain,
      type: 'web link'
    };
  }) || [];
  
  const phoneNumbers = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g)?.map(number => ({
    number,
    format: 'US format',
    country: 'US'
  })) || [];
  
  const dates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g)?.map(date => ({
    date,
    format: date.includes('/') ? 'MM/DD/YYYY' : 'YYYY-MM-DD',
    context: 'date reference'
  })) || [];
  
  // Simple number extraction
  const numbers = text.match(/\b\d+(?:\.\d+)?%?\b/g)?.map(numStr => {
    const value = parseFloat(numStr.replace('%', ''));
    let type: 'integer' | 'decimal' | 'percentage' | 'currency' = 'integer';
    
    if (numStr.includes('%')) type = 'percentage';
    else if (numStr.includes('.')) type = 'decimal';
    else if (text.includes('$' + numStr) || text.includes(numStr + ' dollars')) type = 'currency';
    
    return {
      value,
      type,
      context: 'numeric value'
    };
  }) || [];
  
  // Mock name extraction (very basic)
  const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const people = capitalizedWords
    .filter(name => name.split(' ').length >= 2)
    .slice(0, 5)
    .map(name => ({
      name,
      confidence: 0.6,
      context: 'potential person name'
    }));
  
  return {
    people,
    organizations: [], // Simplified for mock
    locations: [], // Simplified for mock
    dates,
    numbers,
    urls,
    emails,
    phoneNumbers
  };
}

function analyzeTone(text: string): ToneAnalysis {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  // Formality indicators
  const formalWords = ['therefore', 'consequently', 'furthermore', 'moreover', 'subsequently', 'nevertheless'];
  const informalWords = ['gonna', 'wanna', 'yeah', 'okay', 'cool', 'awesome', 'stuff', 'things'];
  
  const formalCount = words.filter(word => formalWords.includes(word)).length;
  const informalCount = words.filter(word => informalWords.includes(word)).length;
  
  let formalityLevel: ToneAnalysis['formalityLevel'] = 'neutral';
  if (formalCount > informalCount * 2) formalityLevel = 'formal';
  else if (informalCount > formalCount * 2) formalityLevel = 'informal';
  
  // Emotional tone analysis
  const confidenceWords = ['certain', 'sure', 'definitely', 'absolutely', 'clearly'];
  const tentativeWords = ['maybe', 'perhaps', 'possibly', 'might', 'could', 'seems'];
  
  const confidenceCount = words.filter(word => confidenceWords.includes(word)).length;
  const tentativeCount = words.filter(word => tentativeWords.includes(word)).length;
  
  let emotionalTone: ToneAnalysis['emotionalTone'] = 'analytical';
  if (confidenceCount > tentativeCount) emotionalTone = 'confident';
  else if (tentativeCount > confidenceCount) emotionalTone = 'tentative';
  
  return {
    formalityLevel,
    emotionalTone,
    socialTone: 'openness', // Simplified
    writingStyle: 'conversational', // Simplified
    audience: 'general' // Simplified
  };
}

function analyzeStyle(text: string): StyleAnalysis {
  const punctuationUsage = {
    periods: (text.match(/\./g) || []).length,
    commas: (text.match(/,/g) || []).length,
    semicolons: (text.match(/;/g) || []).length,
    colons: (text.match(/:/g) || []).length,
    questionMarks: (text.match(/\?/g) || []).length,
    exclamationMarks: (text.match(/!/g) || []).length,
    quotationMarks: (text.match(/["']/g) || []).length,
    parentheses: (text.match(/[()]/g) || []).length
  };
  
  const capitalizationPatterns = {
    properNouns: (text.match(/\b[A-Z][a-z]+\b/g) || []).length,
    acronyms: (text.match(/\b[A-Z]{2,}\b/g) || []).length,
    allCaps: (text.match(/\b[A-Z]{1,}\b/g) || []).length,
    sentenceStarts: (text.match(/[.!?]\s+[A-Z]/g) || []).length
  };
  
  // Simplified verb tense and voice analysis
  const presentIndicators = (text.match(/\b(is|are|am|do|does|has|have)\b/gi) || []).length;
  const pastIndicators = (text.match(/\b(was|were|did|had|went|came|took)\b/gi) || []).length;
  const futureIndicators = (text.match(/\b(will|shall|going to|gonna)\b/gi) || []).length;
  
  const passiveIndicators = (text.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || []).length;
  const activeIndicators = Math.max(1, (text.match(/\b\w+\s+(is|are|was|were)\s+\w+ing\b/gi) || []).length);
  
  return {
    punctuationUsage,
    capitalizationPatterns,
    verbTenses: {
      present: presentIndicators,
      past: pastIndicators,
      future: futureIndicators,
      progressive: 0, // Simplified
      perfect: 0 // Simplified
    },
    voiceAnalysis: {
      activeVoice: activeIndicators,
      passiveVoice: passiveIndicators,
      ratio: activeIndicators / Math.max(1, passiveIndicators)
    }
  };
}

function analyzeQuality(text: string): QualityMetrics {
  // Simple quality analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Check for potential grammar issues (very basic)
  const grammarIssues = [];
  if (text.includes(' i ')) {
    grammarIssues.push({
      type: 'capitalization',
      message: 'Lowercase "i" should be capitalized',
      suggestion: 'Use "I" instead of "i"',
      position: text.indexOf(' i ')
    });
  }
  
  // Check for repeated words
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const duplicateWords = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1]) {
      duplicateWords.push({
        type: 'repetition',
        message: `Repeated word: "${words[i]}"`,
        suggestion: 'Remove duplicate word',
        position: text.toLowerCase().indexOf(words[i] + ' ' + words[i])
      });
    }
  }
  
  // Check for duplicate sentences
  const sentenceMap: Record<string, number[]> = {};
  sentences.forEach((sentence, index) => {
    const clean = sentence.trim().toLowerCase();
    if (clean.length > 10) {
      if (!sentenceMap[clean]) sentenceMap[clean] = [];
      sentenceMap[clean].push(index);
    }
  });
  
  const duplicateSentences = Object.entries(sentenceMap)
    .filter(([, positions]) => positions.length > 1)
    .map(([sentence, positions]) => ({
      sentence,
      occurrences: positions.length,
      positions
    }));
  
  // Calculate overall quality score
  const issues = grammarIssues.length + duplicateWords.length + duplicateSentences.length;
  const overallQuality = Math.max(0, 100 - (issues * 10));
  
  return {
    grammarIssues,
    spellingErrors: [], // Simplified
    styleIssues: duplicateWords,
    duplicateSentences,
    plagiarismRisk: duplicateSentences.length > 0 ? 'medium' : 'low',
    overallQuality
  };
}

export function processTextAnalytics(input: string, config: TextAnalyticsConfig): Promise<ToolResult> {
  return new Promise(async (resolve) => {
    try {
      const startTime = Date.now();
      
      if (!input || input.trim() === '') {
        resolve({
          success: false,
          error: 'Please provide text content for analysis'
        });
        return;
      }
      
      if (input.length < 10) {
        resolve({
          success: false,
          error: 'Text is too short for meaningful analysis (minimum 10 characters)'
        });
        return;
      }
      
      // Perform comprehensive text analysis
      const analytics: TextAnalytics = {
        basic: analyzeBasicStatistics(input),
        sentiment: analyzeSentiment(input),
        readability: analyzeReadability(input),
        keywords: analyzeKeywords(input, config.keywordCount),
        structure: analyzeStructure(input),
        language: analyzeLanguage(input),
        entities: extractEntities(input),
        tone: analyzeTone(input),
        style: analyzeStyle(input),
        quality: analyzeQuality(input)
      };
      
      // Generate output based on analysis type
      let output = generateOutput(analytics, config);
      
      const processingTime = Date.now() - startTime;
      
      // Generate warnings
      const warnings: string[] = [];
      
      if (input.length > 50000) {
        warnings.push('Very long text - analysis may be less accurate for extremely long documents');
      }
      
      if (analytics.basic.wordCount < 50) {
        warnings.push('Short text may result in less reliable readability and sentiment scores');
      }
      
      if (analytics.language.confidence < 0.6) {
        warnings.push('Language detection confidence is low - results may be less accurate');
      }
      
      if (analytics.quality.overallQuality < 50) {
        warnings.push('Text quality issues detected - consider reviewing grammar and style');
      }
      
      resolve({
        success: true,
        output,
        analytics,
        warnings: warnings.length > 0 ? warnings : undefined
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during text analysis'
      });
    }
  });
}

function generateOutput(analytics: TextAnalytics, config: TextAnalyticsConfig): string {
  let output = '';
  
  if (config.analysisType === 'comprehensive' || config.analysisType === 'structure') {
    output += `📊 Text Analytics Report\n${'='.repeat(50)}\n\n`;
  }
  
  // Basic Statistics
  if (config.includeStatistics || config.analysisType === 'comprehensive') {
    output += `📈 Basic Statistics:\n`;
    output += `• Characters: ${analytics.basic.characterCount.toLocaleString()}\n`;
    output += `• Words: ${analytics.basic.wordCount.toLocaleString()}\n`;
    output += `• Sentences: ${analytics.basic.sentenceCount.toLocaleString()}\n`;
    output += `• Paragraphs: ${analytics.basic.paragraphCount.toLocaleString()}\n`;
    output += `• Average words per sentence: ${analytics.basic.averageWordsPerSentence.toFixed(1)}\n`;
    output += `• Average characters per word: ${analytics.basic.averageCharactersPerWord.toFixed(1)}\n`;
    output += `• Unique words: ${analytics.basic.uniqueWords.toLocaleString()}\n`;
    output += `• Lexical diversity: ${(analytics.basic.lexicalDiversity * 100).toFixed(1)}%\n`;
    output += `• Estimated reading time: ${analytics.basic.readingTime} minute${analytics.basic.readingTime !== 1 ? 's' : ''}\n`;
    output += `• Longest word: "${analytics.basic.longestWord}"\n`;
    output += `• Shortest word: "${analytics.basic.shortestWord}"\n\n`;
  }
  
  // Sentiment Analysis
  if (config.analysisType === 'comprehensive' || config.analysisType === 'sentiment') {
    output += `💭 Sentiment Analysis:\n`;
    output += `• Overall sentiment: ${analytics.sentiment.overall.toUpperCase()}\n`;
    output += `• Polarity: ${analytics.sentiment.polarity.toFixed(3)} (${analytics.sentiment.polarity > 0 ? 'positive' : analytics.sentiment.polarity < 0 ? 'negative' : 'neutral'})\n`;
    output += `• Subjectivity: ${analytics.sentiment.subjectivity.toFixed(3)} (${analytics.sentiment.subjectivity > 0.5 ? 'subjective' : 'objective'})\n`;
    output += `• Confidence: ${(analytics.sentiment.confidence * 100).toFixed(1)}%\n`;
    
    if (config.sentimentDetailed) {
      output += `\n🎭 Emotion Breakdown:\n`;
      Object.entries(analytics.sentiment.emotions).forEach(([emotion, score]) => {
        output += `• ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}: ${(score * 100).toFixed(1)}%\n`;
      });
      
      if (analytics.sentiment.sentimentByParagraph.length > 1) {
        output += `\n📝 Sentiment by Paragraph:\n`;
        analytics.sentiment.sentimentByParagraph.forEach(para => {
          output += `• Paragraph ${para.paragraph}: ${para.sentiment} (${para.score.toFixed(2)})\n`;
        });
      }
    }
    output += '\n';
  }
  
  // Readability Analysis
  if (config.readabilityScores || config.analysisType === 'comprehensive' || config.analysisType === 'readability') {
    output += `📚 Readability Analysis:\n`;
    output += `• Reading level: ${analytics.readability.readingLevel.replace('-', ' ').toUpperCase()}\n`;
    output += `• Complexity: ${analytics.readability.complexity.replace('-', ' ').toUpperCase()}\n`;
    output += `• Flesch-Kincaid Grade: ${analytics.readability.fleschKincaidGrade}\n`;
    output += `• Flesch Reading Ease: ${analytics.readability.fleschReadingEase} (${analytics.readability.complexity})\n`;
    output += `• Gunning Fog Index: ${analytics.readability.gunningFog}\n`;
    output += `• Coleman-Liau Index: ${analytics.readability.colemanLiau}\n`;
    output += `• Automated Readability Index: ${analytics.readability.automatedReadabilityIndex}\n`;
    output += `• Estimated reading time: ${analytics.readability.estimatedReadingTime} minute${analytics.readability.estimatedReadingTime !== 1 ? 's' : ''}\n\n`;
  }
  
  // Keyword Analysis
  if (config.analysisType === 'comprehensive' || config.analysisType === 'keywords') {
    output += `🔑 Keyword Analysis:\n`;
    
    if (analytics.keywords.extractedKeywords.length > 0) {
      output += `📌 Top Keywords:\n`;
      analytics.keywords.extractedKeywords.forEach((keyword, index) => {
        output += `${index + 1}. "${keyword.word}" (score: ${keyword.score.toFixed(2)}, frequency: ${keyword.frequency})\n`;
      });
    }
    
    if (analytics.keywords.keyphrases.length > 0) {
      output += `\n🔗 Key Phrases:\n`;
      analytics.keywords.keyphrases.forEach((phrase, index) => {
        output += `${index + 1}. "${phrase.phrase}" (score: ${phrase.score.toFixed(2)}, frequency: ${phrase.frequency})\n`;
      });
    }
    
    if (analytics.keywords.topics.length > 0) {
      output += `\n🎯 Topics:\n`;
      analytics.keywords.topics.forEach(topic => {
        output += `• ${topic.topic} (${(topic.confidence * 100).toFixed(1)}%): ${topic.keywords.join(', ')}\n`;
      });
    }
    
    if (analytics.keywords.tags.length > 0) {
      output += `\n🏷️ Suggested tags: ${analytics.keywords.tags.join(', ')}\n`;
    }
    output += '\n';
  }
  
  // Language Analysis
  if (config.languageDetection || config.analysisType === 'comprehensive') {
    output += `🌍 Language Analysis:\n`;
    output += `• Detected language: ${analytics.language.detectedLanguage} (${(analytics.language.confidence * 100).toFixed(1)}% confidence)\n`;
    output += `• Writing system: ${analytics.language.languageFeatures.writingSystem}\n`;
    output += `• Text direction: ${analytics.language.languageFeatures.textDirection.toUpperCase()}\n`;
    output += `• Has accents: ${analytics.language.languageFeatures.hasAccents ? 'Yes' : 'No'}\n`;
    output += `• Has special characters: ${analytics.language.languageFeatures.hasSpecialCharacters ? 'Yes' : 'No'}\n\n`;
  }
  
  // Entity Extraction
  if (config.entityExtraction || config.analysisType === 'comprehensive') {
    output += `🏷️ Entity Extraction:\n`;
    
    if (analytics.entities.people.length > 0) {
      output += `👥 People: ${analytics.entities.people.map(p => p.name).join(', ')}\n`;
    }
    
    if (analytics.entities.emails.length > 0) {
      output += `📧 Emails: ${analytics.entities.emails.map(e => e.email).join(', ')}\n`;
    }
    
    if (analytics.entities.urls.length > 0) {
      output += `🔗 URLs: ${analytics.entities.urls.map(u => u.domain).join(', ')}\n`;
    }
    
    if (analytics.entities.phoneNumbers.length > 0) {
      output += `📞 Phone numbers: ${analytics.entities.phoneNumbers.map(p => p.number).join(', ')}\n`;
    }
    
    if (analytics.entities.dates.length > 0) {
      output += `📅 Dates: ${analytics.entities.dates.map(d => d.date).join(', ')}\n`;
    }
    
    if (analytics.entities.numbers.length > 0) {
      output += `🔢 Notable numbers: ${analytics.entities.numbers.slice(0, 5).map(n => `${n.value} (${n.type})`).join(', ')}\n`;
    }
    output += '\n';
  }
  
  // Tone Analysis
  if (config.toneAnalysis || config.analysisType === 'comprehensive') {
    output += `🎵 Tone Analysis:\n`;
    output += `• Formality level: ${analytics.tone.formalityLevel.replace('-', ' ').toUpperCase()}\n`;
    output += `• Emotional tone: ${analytics.tone.emotionalTone.toUpperCase()}\n`;
    output += `• Writing style: ${analytics.tone.writingStyle.toUpperCase()}\n`;
    output += `• Target audience: ${analytics.tone.audience.toUpperCase()}\n\n`;
  }
  
  // Style Analysis
  if (config.styleAnalysis || config.analysisType === 'comprehensive') {
    output += `✍️ Style Analysis:\n`;
    output += `• Punctuation usage:\n`;
    Object.entries(analytics.style.punctuationUsage).forEach(([punct, count]) => {
      if (count > 0) {
        output += `  - ${punct.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${count}\n`;
      }
    });
    
    output += `• Voice analysis:\n`;
    output += `  - Active voice: ${analytics.style.voiceAnalysis.activeVoice}\n`;
    output += `  - Passive voice: ${analytics.style.voiceAnalysis.passiveVoice}\n`;
    output += `  - Active/passive ratio: ${analytics.style.voiceAnalysis.ratio.toFixed(2)}\n`;
    
    output += `• Verb tenses:\n`;
    Object.entries(analytics.style.verbTenses).forEach(([tense, count]) => {
      if (count > 0) {
        output += `  - ${tense}: ${count}\n`;
      }
    });
    output += '\n';
  }
  
  // Quality Analysis
  if (config.grammarCheck || config.analysisType === 'comprehensive') {
    output += `✅ Quality Analysis:\n`;
    output += `• Overall quality score: ${analytics.quality.overallQuality}%\n`;
    
    if (analytics.quality.grammarIssues.length > 0) {
      output += `• Grammar issues found: ${analytics.quality.grammarIssues.length}\n`;
      analytics.quality.grammarIssues.slice(0, 3).forEach(issue => {
        output += `  - ${issue.type}: ${issue.message}\n`;
      });
    }
    
    if (analytics.quality.duplicateSentences.length > 0) {
      output += `• Duplicate sentences: ${analytics.quality.duplicateSentences.length}\n`;
      analytics.quality.duplicateSentences.forEach(dup => {
        output += `  - "${dup.sentence.substring(0, 50)}..." appears ${dup.occurrences} times\n`;
      });
    }
    
    output += `• Plagiarism risk: ${analytics.quality.plagiarismRisk.toUpperCase()}\n\n`;
  }
  
  // Most Common Words
  if (config.wordFrequency || config.analysisType === 'comprehensive') {
    if (analytics.basic.commonWords.length > 0) {
      output += `📊 Most Common Words:\n`;
      analytics.basic.commonWords.slice(0, 10).forEach((word, index) => {
        output += `${index + 1}. "${word.word}" - ${word.count} times (${word.percentage.toFixed(1)}%)\n`;
      });
      output += '\n';
    }
  }
  
  // Structure Analysis
  if (config.analysisType === 'comprehensive' || config.analysisType === 'structure') {
    if (analytics.structure.headings.length > 0 || analytics.structure.links.length > 0 || analytics.structure.codeBlocks.length > 0) {
      output += `🏗️ Document Structure:\n`;
      
      if (analytics.structure.headings.length > 0) {
        output += `📋 Headings found: ${analytics.structure.headings.length}\n`;
        analytics.structure.headings.forEach(heading => {
          output += `${'  '.repeat(heading.level - 1)}• H${heading.level}: ${heading.text}\n`;
        });
      }
      
      if (analytics.structure.links.length > 0) {
        output += `🔗 Links found: ${analytics.structure.links.length}\n`;
        analytics.structure.links.slice(0, 5).forEach(link => {
          output += `  • ${link.text} (${link.type})\n`;
        });
      }
      
      if (analytics.structure.codeBlocks.length > 0) {
        output += `💻 Code blocks found: ${analytics.structure.codeBlocks.length}\n`;
        analytics.structure.codeBlocks.forEach(block => {
          output += `  • ${block.language || 'unknown'}: ${block.lines} lines\n`;
        });
      }
      
      output += '\n';
    }
  }
  
  return output;
}

export const TEXT_ANALYTICS_TOOL: Tool = {
  id: 'text-analytics',
  name: 'Advanced Text Analytics',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-analysis')!,
  slug: 'text-analytics',
  icon: '📊',
  keywords: ['text', 'analytics', 'sentiment', 'readability', 'keywords', 'nlp', 'analysis', 'language', 'statistics'],
  seoTitle: 'Advanced Text Analytics - Sentiment, Readability & Content Analysis | FreeFormatHub',
  seoDescription: 'Comprehensive text analysis tool with sentiment analysis, readability scores, keyword extraction, entity recognition, and detailed language statistics.',
  description: 'Comprehensive text analysis providing sentiment analysis, readability scores, keyword extraction, entity recognition, language detection, tone analysis, and detailed content statistics.',

  examples: [
    {
      title: 'Content Analysis',
      input: 'This is an excellent article about artificial intelligence and machine learning. The technology is rapidly advancing and transforming various industries. Companies are investing heavily in AI research and development.',
      output: `📊 Basic Statistics:
• Words: 32 • Sentences: 3 • Reading time: 1 minute

💭 Sentiment Analysis:
• Overall sentiment: POSITIVE
• Polarity: 0.450 (positive)
• Confidence: 75.0%

📚 Readability Analysis:
• Reading level: HIGH-SCHOOL
• Flesch Reading Ease: 45.2 (fairly difficult)

🔑 Top Keywords:
1. "technology" (score: 8.5, frequency: 2)
2. "artificial" (score: 7.2, frequency: 1)
3. "intelligence" (score: 7.2, frequency: 1)`,
      description: 'Analyze content sentiment, readability, and extract key terms'
    },
    {
      title: 'Academic Text Analysis',
      input: 'The methodology employed in this research involves a comprehensive analysis of data collected through systematic observation. The results indicate a significant correlation between variables, suggesting important implications for future studies.',
      output: `📊 Basic Statistics:
• Words: 31 • Sentences: 2 • Reading time: 1 minute

🎵 Tone Analysis:
• Formality level: FORMAL
• Writing style: ACADEMIC
• Target audience: ACADEMIC

📚 Readability Analysis:
• Reading level: GRADUATE
• Complexity: DIFFICULT
• Gunning Fog Index: 16.8`,
      description: 'Analyze academic writing style and complexity'
    },
    {
      title: 'Marketing Copy Analysis',
      input: 'Get amazing results now! Our revolutionary product will transform your life. Limited time offer - 50% off! Contact us today at sales@company.com or call 555-123-4567.',
      output: `💭 Sentiment Analysis:
• Overall sentiment: POSITIVE
• Polarity: 0.750 (very positive)

🏷️ Entity Extraction:
• Emails: sales@company.com
• Phone numbers: 555-123-4567

🎵 Tone Analysis:
• Emotional tone: CONFIDENT
• Writing style: CONVERSATIONAL
• Target audience: GENERAL`,
      description: 'Analyze marketing content tone and extract contact information'
    }
  ],

  useCases: [
    'Content quality assessment and optimization',
    'Sentiment analysis for social media monitoring',
    'Readability testing for educational materials',
    'SEO keyword research and content analysis',
    'Academic paper readability and style checking',
    'Marketing copy effectiveness evaluation',
    'Customer feedback sentiment analysis',
    'Document classification and categorization',
    'Language learning and writing improvement',
    'Brand voice consistency analysis'
  ],

  faq: [
    {
      question: 'What types of text analysis are included?',
      answer: 'The tool provides comprehensive analysis including basic statistics, sentiment analysis, readability scores, keyword extraction, entity recognition, language detection, tone analysis, and writing style assessment.'
    },
    {
      question: 'How accurate is the sentiment analysis?',
      answer: 'Sentiment analysis uses multiple indicators and provides confidence scores. Accuracy varies with text length and complexity, with longer texts generally yielding more reliable results.'
    },
    {
      question: 'What readability metrics are calculated?',
      answer: 'Includes Flesch-Kincaid Grade Level, Flesch Reading Ease, Gunning Fog Index, Coleman-Liau Index, and Automated Readability Index for comprehensive readability assessment.'
    },
    {
      question: 'Can it detect different languages?',
      answer: 'Yes, the tool includes language detection with confidence scoring and can identify various writing systems including Latin, Cyrillic, Arabic, Chinese, and Japanese characters.'
    },
    {
      question: 'What entities can be extracted from text?',
      answer: 'Extracts people names, organizations, locations, dates, numbers, URLs, email addresses, phone numbers, and other structured data from the input text.'
    }
  ],

  commonErrors: [
    'Text too short for reliable analysis (minimum 10 characters)',
    'Language detection confidence too low for accurate results',
    'Mixed languages in text may affect analysis accuracy',
    'Very technical text may not match general readability formulas',
    'Special formatting or code may interfere with text processing'
  ],

  relatedTools: ['keyword-extractor', 'readability-checker', 'sentiment-analyzer', 'language-detector', 'grammar-checker']
};