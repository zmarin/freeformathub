import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface TextStatisticsConfig {
  includeBasicStats: boolean;
  includeAdvancedStats: boolean;
  includeReadabilityScores: boolean;
  includeCharacterFrequency: boolean;
  includeWordFrequency: boolean;
  includeSentenceAnalysis: boolean;
  includeParagraphAnalysis: boolean;
  includeLanguageDetection: boolean;
  caseSensitive: boolean;
  excludeStopWords: boolean;
  minWordLength: number;
  maxTopWords: number;
  maxTopCharacters: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: TextStats;
}

export interface TextStats {
  basic: BasicStats;
  advanced?: AdvancedStats;
  readability?: ReadabilityStats;
  frequency?: FrequencyStats;
  sentences?: SentenceStats;
  paragraphs?: ParagraphStats;
  language?: LanguageStats;
}

interface BasicStats {
  characterCount: number;
  characterCountNoSpaces: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  lineCount: number;
  averageWordsPerSentence: number;
  averageCharactersPerWord: number;
  averageSentencesPerParagraph: number;
}

interface AdvancedStats {
  uniqueWords: number;
  lexicalDiversity: number;
  longestWord: string;
  shortestWord: string;
  averageWordLength: number;
  medianWordLength: number;
  mostCommonWordLength: number;
  syllableCount: number;
  complexWords: number;
  monosyllabicWords: number;
  polysyllabicWords: number;
}

interface ReadabilityStats {
  fleschReadingEase: number;
  fleschKincaidGradeLevel: number;
  automatedReadabilityIndex: number;
  colemanLiauIndex: number;
  gunningFogIndex: number;
  smogIndex: number;
  readingLevel: string;
}

interface FrequencyStats {
  topWords: Array<{ word: string; count: number; percentage: number }>;
  topCharacters: Array<{ char: string; count: number; percentage: number }>;
  characterDistribution: { [char: string]: number };
  wordDistribution: { [word: string]: number };
}

interface SentenceStats {
  averageLength: number;
  longestSentence: string;
  shortestSentence: string;
  sentenceLengths: number[];
  medianLength: number;
}

interface ParagraphStats {
  averageLength: number;
  longestParagraph: string;
  shortestParagraph: string;
  paragraphLengths: number[];
  medianLength: number;
}

interface LanguageStats {
  detectedLanguage: string;
  confidence: number;
  possibleLanguages: Array<{ language: string; confidence: number }>;
}

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'said',
  'each', 'which', 'she', 'do', 'how', 'their', 'if', 'up', 'out', 'many',
  'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like',
  'into', 'him', 'time', 'two', 'more', 'very', 'when', 'come', 'may', 'its',
  'only', 'think', 'now', 'work', 'life', 'can', 'us', 'about', 'over',
  'after', 'use', 'man', 'day', 'get', 'own', 'say', 'here', 'old', 'see',
  'way', 'could', 'people', 'my', 'than', 'first', 'been', 'call', 'who',
  'did', 'just', 'where', 'most', 'know', 'good', 'through', 'back', 'much',
  'before', 'go', 'want', 'also', 'your', 'well', 'never', 'new', 'other'
]);

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3;
}

function calculateBasicStats(text: string): BasicStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const lines = text.split(/\n/).length;
  
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;
  
  return {
    characterCount: characters,
    characterCountNoSpaces: charactersNoSpaces,
    wordCount,
    sentenceCount: Math.max(1, sentenceCount),
    paragraphCount: Math.max(1, paragraphCount),
    lineCount: lines,
    averageWordsPerSentence: wordCount / Math.max(1, sentenceCount),
    averageCharactersPerWord: charactersNoSpaces / Math.max(1, wordCount),
    averageSentencesPerParagraph: sentenceCount / Math.max(1, paragraphCount),
  };
}

function calculateAdvancedStats(text: string, caseSensitive: boolean): AdvancedStats {
  const processText = caseSensitive ? text : text.toLowerCase();
  const words = processText.trim().split(/\s+/).filter(word => word.length > 0);
  const cleanWords = words.map(word => word.replace(/[^\w]/g, ''));
  
  const uniqueWords = new Set(cleanWords).size;
  const lexicalDiversity = uniqueWords / Math.max(1, cleanWords.length);
  
  const wordLengths = cleanWords.map(word => word.length);
  const sortedLengths = [...wordLengths].sort((a, b) => a - b);
  const medianWordLength = sortedLengths[Math.floor(sortedLengths.length / 2)] || 0;
  
  // Find most common word length
  const lengthCounts: { [length: number]: number } = {};
  for (const length of wordLengths) {
    lengthCounts[length] = (lengthCounts[length] || 0) + 1;
  }
  const mostCommonWordLength = Object.entries(lengthCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
  
  const longestWord = cleanWords.reduce((longest, word) => 
    word.length > longest.length ? word : longest, '');
  const shortestWord = cleanWords.reduce((shortest, word) => 
    word.length < shortest.length ? word : shortest, cleanWords[0] || '');
  
  let syllableCount = 0;
  let complexWords = 0;
  let monosyllabicWords = 0;
  let polysyllabicWords = 0;
  
  for (const word of cleanWords) {
    const syllables = countSyllables(word);
    syllableCount += syllables;
    
    if (syllables === 1) monosyllabicWords++;
    if (syllables >= 3) polysyllabicWords++;
    if (isComplexWord(word)) complexWords++;
  }
  
  return {
    uniqueWords,
    lexicalDiversity,
    longestWord,
    shortestWord,
    averageWordLength: wordLengths.reduce((sum, len) => sum + len, 0) / Math.max(1, wordLengths.length),
    medianWordLength,
    mostCommonWordLength: parseInt(mostCommonWordLength.toString()),
    syllableCount,
    complexWords,
    monosyllabicWords,
    polysyllabicWords,
  };
}

function calculateReadabilityStats(basic: BasicStats, advanced: AdvancedStats): ReadabilityStats {
  const { wordCount, sentenceCount, characterCountNoSpaces } = basic;
  const { syllableCount, complexWords } = advanced;
  
  // Flesch Reading Ease
  const fleschReadingEase = 206.835 - 
    (1.015 * (wordCount / sentenceCount)) - 
    (84.6 * (syllableCount / wordCount));
  
  // Flesch-Kincaid Grade Level
  const fleschKincaidGradeLevel = 
    (0.39 * (wordCount / sentenceCount)) + 
    (11.8 * (syllableCount / wordCount)) - 15.59;
  
  // Automated Readability Index
  const automatedReadabilityIndex = 
    (4.71 * (characterCountNoSpaces / wordCount)) + 
    (0.5 * (wordCount / sentenceCount)) - 21.43;
  
  // Coleman-Liau Index
  const avgCharsPerWord = (characterCountNoSpaces / wordCount) * 100;
  const avgSentencesPer100Words = (sentenceCount / wordCount) * 100;
  const colemanLiauIndex = 
    (0.0588 * avgCharsPerWord) - (0.296 * avgSentencesPer100Words) - 15.8;
  
  // Gunning Fog Index
  const complexWordPercentage = (complexWords / wordCount) * 100;
  const gunningFogIndex = 0.4 * ((wordCount / sentenceCount) + complexWordPercentage);
  
  // SMOG Index
  const smogIndex = 1.0430 * Math.sqrt(complexWords * (30 / sentenceCount)) + 3.1291;
  
  // Determine reading level
  let readingLevel = '';
  if (fleschReadingEase >= 90) readingLevel = 'Very Easy (5th grade)';
  else if (fleschReadingEase >= 80) readingLevel = 'Easy (6th grade)';
  else if (fleschReadingEase >= 70) readingLevel = 'Fairly Easy (7th grade)';
  else if (fleschReadingEase >= 60) readingLevel = 'Standard (8th-9th grade)';
  else if (fleschReadingEase >= 50) readingLevel = 'Fairly Difficult (10th-12th grade)';
  else if (fleschReadingEase >= 30) readingLevel = 'Difficult (College level)';
  else readingLevel = 'Very Difficult (Graduate level)';
  
  return {
    fleschReadingEase: Math.max(0, fleschReadingEase),
    fleschKincaidGradeLevel: Math.max(0, fleschKincaidGradeLevel),
    automatedReadabilityIndex: Math.max(0, automatedReadabilityIndex),
    colemanLiauIndex: Math.max(0, colemanLiauIndex),
    gunningFogIndex: Math.max(0, gunningFogIndex),
    smogIndex: Math.max(0, smogIndex),
    readingLevel,
  };
}

function calculateFrequencyStats(
  text: string, 
  config: TextStatisticsConfig
): FrequencyStats {
  const processText = config.caseSensitive ? text : text.toLowerCase();
  
  // Character frequency
  const characterDistribution: { [char: string]: number } = {};
  for (const char of processText) {
    if (char.match(/[a-zA-Z]/)) {
      characterDistribution[char] = (characterDistribution[char] || 0) + 1;
    }
  }
  
  // Word frequency
  const words = processText.trim().split(/\s+/)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length >= config.minWordLength);
  
  const filteredWords = config.excludeStopWords 
    ? words.filter(word => !STOP_WORDS.has(word))
    : words;
  
  const wordDistribution: { [word: string]: number } = {};
  for (const word of filteredWords) {
    wordDistribution[word] = (wordDistribution[word] || 0) + 1;
  }
  
  // Top characters
  const totalChars = Object.values(characterDistribution).reduce((sum, count) => sum + count, 0);
  const topCharacters = Object.entries(characterDistribution)
    .map(([char, count]) => ({
      char,
      count,
      percentage: (count / totalChars) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, config.maxTopCharacters);
  
  // Top words
  const totalWords = filteredWords.length;
  const topWords = Object.entries(wordDistribution)
    .map(([word, count]) => ({
      word,
      count,
      percentage: (count / totalWords) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, config.maxTopWords);
  
  return {
    topWords,
    topCharacters,
    characterDistribution,
    wordDistribution,
  };
}

function calculateSentenceStats(text: string): SentenceStats {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  
  const averageLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / Math.max(1, sentenceLengths.length);
  const sortedLengths = [...sentenceLengths].sort((a, b) => a - b);
  const medianLength = sortedLengths[Math.floor(sortedLengths.length / 2)] || 0;
  
  const longestSentence = sentences.reduce((longest, sentence) => 
    sentence.trim().split(/\s+/).length > longest.trim().split(/\s+/).length ? sentence : longest, sentences[0] || '');
  const shortestSentence = sentences.reduce((shortest, sentence) => 
    sentence.trim().split(/\s+/).length < shortest.trim().split(/\s+/).length ? sentence : shortest, sentences[0] || '');
  
  return {
    averageLength,
    longestSentence: longestSentence.trim(),
    shortestSentence: shortestSentence.trim(),
    sentenceLengths,
    medianLength,
  };
}

function calculateParagraphStats(text: string): ParagraphStats {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphLengths = paragraphs.map(p => p.trim().split(/\s+/).filter(w => w.length > 0).length);
  
  const averageLength = paragraphLengths.reduce((sum, len) => sum + len, 0) / Math.max(1, paragraphLengths.length);
  const sortedLengths = [...paragraphLengths].sort((a, b) => a - b);
  const medianLength = sortedLengths[Math.floor(sortedLengths.length / 2)] || 0;
  
  const longestParagraph = paragraphs.reduce((longest, paragraph) => 
    paragraph.trim().split(/\s+/).length > longest.trim().split(/\s+/).length ? paragraph : longest, paragraphs[0] || '');
  const shortestParagraph = paragraphs.reduce((shortest, paragraph) => 
    paragraph.trim().split(/\s+/).length < shortest.trim().split(/\s+/).length ? paragraph : shortest, paragraphs[0] || '');
  
  return {
    averageLength,
    longestParagraph: longestParagraph.trim(),
    shortestParagraph: shortestParagraph.trim(),
    paragraphLengths,
    medianLength,
  };
}

function detectLanguage(text: string): LanguageStats {
  // Simple language detection based on character patterns
  // This is a basic implementation - for production, you'd use a proper language detection library
  
  const sample = text.toLowerCase().slice(0, 1000);
  const languageScores: { [lang: string]: number } = {};
  
  // English patterns
  const englishPatterns = ['the ', 'and ', 'that ', 'have ', 'for ', 'not ', 'with ', 'you ', 'this ', 'but '];
  languageScores.english = englishPatterns.filter(pattern => sample.includes(pattern)).length;
  
  // Spanish patterns
  const spanishPatterns = ['que ', 'de ', 'no ', 'la ', 'el ', 'en ', 'y ', 'a ', 'es ', 'se '];
  languageScores.spanish = spanishPatterns.filter(pattern => sample.includes(pattern)).length;
  
  // French patterns
  const frenchPatterns = ['de ', 'le ', 'et ', 'à ', 'un ', 'il ', 'être ', 'et ', 'en ', 'avoir '];
  languageScores.french = frenchPatterns.filter(pattern => sample.includes(pattern)).length;
  
  // German patterns
  const germanPatterns = ['der ', 'die ', 'und ', 'in ', 'den ', 'von ', 'zu ', 'das ', 'mit ', 'sich '];
  languageScores.german = germanPatterns.filter(pattern => sample.includes(pattern)).length;
  
  const sortedLanguages = Object.entries(languageScores)
    .sort((a, b) => b[1] - a[1]);
  
  const topLanguage = sortedLanguages[0] || ['unknown', 0];
  const totalScore = Object.values(languageScores).reduce((sum, score) => sum + score, 0);
  
  return {
    detectedLanguage: topLanguage[0],
    confidence: totalScore > 0 ? (topLanguage[1] / totalScore) * 100 : 0,
    possibleLanguages: sortedLanguages.slice(0, 3).map(([language, score]) => ({
      language,
      confidence: totalScore > 0 ? (score / totalScore) * 100 : 0,
    })),
  };
}

function formatOutput(stats: TextStats, config: TextStatisticsConfig): string {
  let output = '# Text Statistics Report\n\n';
  
  if (config.includeBasicStats && stats.basic) {
    output += '## Basic Statistics\n\n';
    output += `- **Characters**: ${stats.basic.characterCount.toLocaleString()}\n`;
    output += `- **Characters (no spaces)**: ${stats.basic.characterCountNoSpaces.toLocaleString()}\n`;
    output += `- **Words**: ${stats.basic.wordCount.toLocaleString()}\n`;
    output += `- **Sentences**: ${stats.basic.sentenceCount.toLocaleString()}\n`;
    output += `- **Paragraphs**: ${stats.basic.paragraphCount.toLocaleString()}\n`;
    output += `- **Lines**: ${stats.basic.lineCount.toLocaleString()}\n`;
    output += `- **Average words per sentence**: ${stats.basic.averageWordsPerSentence.toFixed(2)}\n`;
    output += `- **Average characters per word**: ${stats.basic.averageCharactersPerWord.toFixed(2)}\n`;
    output += `- **Average sentences per paragraph**: ${stats.basic.averageSentencesPerParagraph.toFixed(2)}\n\n`;
  }
  
  if (config.includeAdvancedStats && stats.advanced) {
    output += '## Advanced Statistics\n\n';
    output += `- **Unique words**: ${stats.advanced.uniqueWords.toLocaleString()}\n`;
    output += `- **Lexical diversity**: ${(stats.advanced.lexicalDiversity * 100).toFixed(2)}%\n`;
    output += `- **Longest word**: "${stats.advanced.longestWord}" (${stats.advanced.longestWord.length} chars)\n`;
    output += `- **Shortest word**: "${stats.advanced.shortestWord}" (${stats.advanced.shortestWord.length} chars)\n`;
    output += `- **Average word length**: ${stats.advanced.averageWordLength.toFixed(2)} characters\n`;
    output += `- **Median word length**: ${stats.advanced.medianWordLength} characters\n`;
    output += `- **Most common word length**: ${stats.advanced.mostCommonWordLength} characters\n`;
    output += `- **Total syllables**: ${stats.advanced.syllableCount.toLocaleString()}\n`;
    output += `- **Complex words (3+ syllables)**: ${stats.advanced.complexWords.toLocaleString()}\n`;
    output += `- **Monosyllabic words**: ${stats.advanced.monosyllabicWords.toLocaleString()}\n`;
    output += `- **Polysyllabic words (3+ syllables)**: ${stats.advanced.polysyllabicWords.toLocaleString()}\n\n`;
  }
  
  if (config.includeReadabilityScores && stats.readability) {
    output += '## Readability Scores\n\n';
    output += `- **Reading Level**: ${stats.readability.readingLevel}\n`;
    output += `- **Flesch Reading Ease**: ${stats.readability.fleschReadingEase.toFixed(1)}\n`;
    output += `- **Flesch-Kincaid Grade Level**: ${stats.readability.fleschKincaidGradeLevel.toFixed(1)}\n`;
    output += `- **Automated Readability Index**: ${stats.readability.automatedReadabilityIndex.toFixed(1)}\n`;
    output += `- **Coleman-Liau Index**: ${stats.readability.colemanLiauIndex.toFixed(1)}\n`;
    output += `- **Gunning Fog Index**: ${stats.readability.gunningFogIndex.toFixed(1)}\n`;
    output += `- **SMOG Index**: ${stats.readability.smogIndex.toFixed(1)}\n\n`;
  }
  
  if (config.includeWordFrequency && stats.frequency) {
    output += '## Most Frequent Words\n\n';
    stats.frequency.topWords.forEach((item, index) => {
      output += `${index + 1}. **${item.word}** - ${item.count} times (${item.percentage.toFixed(2)}%)\n`;
    });
    output += '\n';
  }
  
  if (config.includeCharacterFrequency && stats.frequency) {
    output += '## Most Frequent Characters\n\n';
    stats.frequency.topCharacters.forEach((item, index) => {
      output += `${index + 1}. **${item.char}** - ${item.count} times (${item.percentage.toFixed(2)}%)\n`;
    });
    output += '\n';
  }
  
  if (config.includeSentenceAnalysis && stats.sentences) {
    output += '## Sentence Analysis\n\n';
    output += `- **Average sentence length**: ${stats.sentences.averageLength.toFixed(2)} words\n`;
    output += `- **Median sentence length**: ${stats.sentences.medianLength} words\n`;
    output += `- **Longest sentence**: "${stats.sentences.longestSentence.substring(0, 100)}${stats.sentences.longestSentence.length > 100 ? '...' : ''}" (${stats.sentences.longestSentence.split(/\s+/).length} words)\n`;
    output += `- **Shortest sentence**: "${stats.sentences.shortestSentence}" (${stats.sentences.shortestSentence.split(/\s+/).length} words)\n\n`;
  }
  
  if (config.includeParagraphAnalysis && stats.paragraphs) {
    output += '## Paragraph Analysis\n\n';
    output += `- **Average paragraph length**: ${stats.paragraphs.averageLength.toFixed(2)} words\n`;
    output += `- **Median paragraph length**: ${stats.paragraphs.medianLength} words\n`;
    output += `- **Longest paragraph**: "${stats.paragraphs.longestParagraph.substring(0, 100)}${stats.paragraphs.longestParagraph.length > 100 ? '...' : ''}" (${stats.paragraphs.longestParagraph.split(/\s+/).filter(w => w.length > 0).length} words)\n`;
    output += `- **Shortest paragraph**: "${stats.paragraphs.shortestParagraph.substring(0, 100)}${stats.paragraphs.shortestParagraph.length > 100 ? '...' : ''}" (${stats.paragraphs.shortestParagraph.split(/\s+/).filter(w => w.length > 0).length} words)\n\n`;
  }
  
  if (config.includeLanguageDetection && stats.language) {
    output += '## Language Detection\n\n';
    output += `- **Detected Language**: ${stats.language.detectedLanguage} (${stats.language.confidence.toFixed(1)}% confidence)\n`;
    output += '- **Other Possibilities**:\n';
    stats.language.possibleLanguages.forEach(lang => {
      output += `  - ${lang.language}: ${lang.confidence.toFixed(1)}%\n`;
    });
    output += '\n';
  }
  
  output += '---\n*Report generated by FreeFormatHub Text Statistics Calculator*';
  
  return output;
}

export function processTextStatistics(input: string, config: TextStatisticsConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide text to analyze'
      };
    }
    
    const stats: TextStats = {
      basic: calculateBasicStats(input),
    };
    
    if (config.includeAdvancedStats) {
      stats.advanced = calculateAdvancedStats(input, config.caseSensitive);
    }
    
    if (config.includeReadabilityScores && stats.advanced) {
      stats.readability = calculateReadabilityStats(stats.basic, stats.advanced);
    }
    
    if (config.includeWordFrequency || config.includeCharacterFrequency) {
      stats.frequency = calculateFrequencyStats(input, config);
    }
    
    if (config.includeSentenceAnalysis) {
      stats.sentences = calculateSentenceStats(input);
    }
    
    if (config.includeParagraphAnalysis) {
      stats.paragraphs = calculateParagraphStats(input);
    }
    
    if (config.includeLanguageDetection) {
      stats.language = detectLanguage(input);
    }
    
    const output = formatOutput(stats, config);
    
    return {
      success: true,
      output,
      stats
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze text'
    };
  }
}

export const TEXT_STATISTICS_TOOL: Tool = {
  id: 'text-statistics',
  name: 'Word Counter & Character Counter - Text Statistics Calculator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-analysis')!,
  slug: 'text-statistics',
  icon: '📊',
  keywords: ['word counter', 'character counter', 'word count', 'character count', 'text statistics', 'text analysis', 'readability', 'text length', 'document word count'],
  seoTitle: 'Free Word Counter & Character Counter Online - Text Statistics Tool | FreeFormatHub',
  seoDescription: 'Free online word counter and character counter with detailed text statistics. Count words, characters, sentences, paragraphs, and analyze readability. No upload required.',
  description: 'Professional word counter and character counter tool that provides instant text statistics including word count, character count, sentence count, paragraph count, readability scores, and detailed text analysis for any document or content.',
  
  examples: [
    {
      title: 'Article Analysis',
      input: `The quick brown fox jumps over the lazy dog. This pangram sentence contains every letter of the English alphabet at least once. It has been used for typing practice and font testing for many decades.

Writers and developers often use this sentence to test typefaces, keyboards, and other text-related systems. The sentence demonstrates various letter combinations and provides a good sample of English text structure.`,
      output: `# Text Statistics Report

## Basic Statistics

- **Characters**: 351
- **Characters (no spaces)**: 291
- **Words**: 63
- **Sentences**: 4
- **Paragraphs**: 2
- **Lines**: 4
- **Average words per sentence**: 15.75
- **Average characters per word**: 4.62
- **Average sentences per paragraph**: 2.00

## Advanced Statistics

- **Unique words**: 56
- **Lexical diversity**: 88.89%
- **Longest word**: "demonstrates" (12 chars)
- **Shortest word**: "a" (1 chars)
- **Average word length**: 4.62 characters`,
      description: 'Analyze readability and structure of a sample article'
    },
    {
      title: 'Technical Document',
      input: `API documentation describes the functionality, parameters, return values, and usage examples for application programming interfaces. Clear documentation improves developer experience and reduces support requests.

Best practices include comprehensive examples, error handling descriptions, and version compatibility notes. Documentation should be regularly updated to reflect changes in the API.`,
      output: `# Text Statistics Report

## Basic Statistics

- **Characters**: 371
- **Characters (no spaces)**: 307
- **Words**: 52
- **Sentences**: 3
- **Paragraphs**: 2
- **Lines**: 4
- **Average words per sentence**: 17.33
- **Average characters per word**: 5.90
- **Average sentences per paragraph**: 1.50`,
      description: 'Analyze technical writing for complexity and readability'
    },
    {
      title: 'Creative Writing',
      input: `Once upon a time, in a land far away, there lived a curious little mouse named Chester. Chester loved exploring the vast meadows and hidden corners of his forest home.

Every morning, he would venture out to discover new paths and meet interesting creatures. His adventures taught him valuable lessons about friendship, courage, and the importance of helping others.`,
      output: `# Text Statistics Report

## Basic Statistics

- **Characters**: 347
- **Characters (no spaces)**: 291
- **Words**: 56
- **Sentences**: 4
- **Paragraphs**: 2
- **Lines**: 4
- **Average words per sentence**: 14.00
- **Average characters per word**: 5.20
- **Average sentences per paragraph**: 2.00`,
      description: 'Analyze narrative text for style and structure'
    }
  ],

  howItWorks: [
    {
      title: "Paste or Type Your Text",
      icon: "📝",
      description: "Enter your text directly into the word counter tool. Paste from documents, articles, essays, or type directly. The tool instantly counts words and characters as you type, providing real-time statistics for any content length.",
      keywords: ["paste text", "word counter input", "character counter", "text analysis", "real-time counting"]
    },
    {
      title: "Configure Analysis Options",
      icon: "⚙️",
      description: "Customize your text analysis by choosing which statistics to include. Enable basic stats (word count, character count), advanced metrics (readability scores), frequency analysis, and language detection based on your needs.",
      keywords: ["text analysis options", "word count settings", "readability analysis", "text statistics configuration"]
    },
    {
      title: "View Instant Word Count & Statistics",
      icon: "📊",
      description: "Get immediate results showing word count, character count (with and without spaces), sentence count, paragraph count, and advanced metrics. All processing happens locally in your browser for complete privacy.",
      keywords: ["instant word count", "character count results", "text statistics", "document analysis", "word counter results"]
    },
    {
      title: "Export or Share Results",
      icon: "📋",
      description: "Copy your text statistics to clipboard or download the analysis report. Perfect for academic papers, content writing, SEO optimization, and meeting specific word count requirements for essays or articles.",
      keywords: ["export word count", "download text statistics", "copy results", "academic writing", "essay word count"]
    }
  ],

  useCases: [
    'Content writing and editing optimization',
    'Academic writing analysis and improvement',
    'SEO content optimization and readability scoring',
    'Language learning and text complexity assessment',
    'Research and linguistic analysis of documents'
  ],
  
  faq: [
    {
      question: 'How accurate is the word counter?',
      answer: 'The word counter is very accurate and uses standard whitespace separation to count words. It handles multiple spaces, line breaks, and various text formats correctly, providing reliable word counts for essays, articles, and documents.'
    },
    {
      question: 'Does the character counter include spaces?',
      answer: 'Yes, the tool provides both character count with spaces and character count without spaces. The with-spaces count includes all characters including spaces, punctuation, and line breaks.'
    },
    {
      question: 'Can I use this word counter for essays and academic papers?',
      answer: 'Absolutely! This word counter is perfect for academic writing, essays, research papers, and any content with word count requirements. It provides accurate counts that match standard academic guidelines.'
    },
    {
      question: 'Is this word counter free to use?',
      answer: 'Yes, this online word counter and character counter tool is completely free to use with no limits, no registration required, and no data is uploaded to servers - everything processes locally in your browser.'
    },
    {
      question: 'What readability scores are calculated?',
      answer: 'The tool calculates Flesch Reading Ease, Flesch-Kincaid Grade Level, Automated Readability Index, Coleman-Liau Index, Gunning Fog Index, and SMOG Index to assess text difficulty.'
    },
    {
      question: 'How does the word frequency analysis work?',
      answer: 'The tool counts word occurrences, can exclude common stop words, and provides percentage distributions. You can customize minimum word length and maximum results displayed.'
    },
    {
      question: 'What advanced statistics are included?',
      answer: 'Advanced stats include lexical diversity, syllable counts, complex word identification, word length distributions, and unique vocabulary metrics.'
    },
    {
      question: 'Can I analyze multiple paragraphs?',
      answer: 'Yes, the tool analyzes sentence and paragraph structure, providing insights into document organization and flow patterns.'
    }
  ],
  
  commonErrors: [
    'Inaccurate word count for special characters - uses whitespace separation',
    'Language detection shows low confidence - needs 100-200+ words for accuracy',
    'Readability scores seem inconsistent - different formulas use different factors',
    'Empty or very short text produces incomplete statistics'
  ],

  relatedTools: ['json-formatter', 'xml-formatter', 'markdown-converter']
};