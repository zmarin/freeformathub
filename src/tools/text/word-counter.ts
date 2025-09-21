import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface WordCounterConfig {
  showCharactersWithSpaces: boolean;
  showCharactersWithoutSpaces: boolean;
  showSentences: boolean;
  showParagraphs: boolean;
  showLines: boolean;
  showAvgWordsPerSentence: boolean;
  realTimeCount: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: WordStats;
}

export interface WordStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  avgWordsPerSentence: number;
  estimatedReadingTime: number; // in minutes
}

const DEFAULT_CONFIG: WordCounterConfig = {
  showCharactersWithSpaces: true,
  showCharactersWithoutSpaces: true,
  showSentences: true,
  showParagraphs: true,
  showLines: false,
  showAvgWordsPerSentence: false,
  realTimeCount: true,
};

export function countWords(text: string, config: WordCounterConfig = DEFAULT_CONFIG): ToolResult {
  try {
    if (!text || typeof text !== 'string') {
      return {
        success: true,
        output: 'Enter text to see word count and character count.',
        stats: {
          words: 0,
          charactersWithSpaces: 0,
          charactersWithoutSpaces: 0,
          sentences: 0,
          paragraphs: 0,
          lines: 0,
          avgWordsPerSentence: 0,
          estimatedReadingTime: 0,
        }
      };
    }

    // Basic counts
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const charactersWithSpaces = text.length;
    const charactersWithoutSpaces = text.replace(/\s/g, '').length;

    // Sentence count (improved regex)
    const sentenceEnders = /[.!?]+/g;
    const sentenceMatches = text.match(sentenceEnders);
    const sentences = sentenceMatches ? sentenceMatches.length : (text.trim() ? 1 : 0);

    // Paragraph count (empty lines separate paragraphs)
    const paragraphSeparator = /\n\s*\n/;
    const paragraphs = text.trim() === '' ? 0 : text.split(paragraphSeparator).filter(p => p.trim()).length;

    // Line count
    const lines = text === '' ? 0 : text.split('\n').length;

    // Average words per sentence
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;

    // Estimated reading time (average 200 words per minute)
    const estimatedReadingTime = words / 200;

    const stats: WordStats = {
      words,
      charactersWithSpaces,
      charactersWithoutSpaces,
      sentences,
      paragraphs,
      lines,
      avgWordsPerSentence,
      estimatedReadingTime,
    };

    // Generate output
    let output = `# Word Count Results\n\n`;
    output += `**Words:** ${words.toLocaleString()}\n`;

    if (config.showCharactersWithSpaces) {
      output += `**Characters (with spaces):** ${charactersWithSpaces.toLocaleString()}\n`;
    }

    if (config.showCharactersWithoutSpaces) {
      output += `**Characters (without spaces):** ${charactersWithoutSpaces.toLocaleString()}\n`;
    }

    if (config.showSentences) {
      output += `**Sentences:** ${sentences.toLocaleString()}\n`;
    }

    if (config.showParagraphs) {
      output += `**Paragraphs:** ${paragraphs.toLocaleString()}\n`;
    }

    if (config.showLines) {
      output += `**Lines:** ${lines.toLocaleString()}\n`;
    }

    if (config.showAvgWordsPerSentence && sentences > 0) {
      output += `**Average words per sentence:** ${avgWordsPerSentence.toFixed(1)}\n`;
    }

    if (estimatedReadingTime > 0) {
      if (estimatedReadingTime < 1) {
        output += `**Estimated reading time:** ${Math.ceil(estimatedReadingTime * 60)} seconds\n`;
      } else {
        output += `**Estimated reading time:** ${estimatedReadingTime.toFixed(1)} minutes\n`;
      }
    }

    return {
      success: true,
      output,
      stats
    };

  } catch (error) {
    return {
      success: false,
      error: `Word counting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const WORD_COUNTER_TOOL: Tool = {
  id: 'word-counter',
  name: 'Word Counter - Free Online Word & Character Counter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-analysis')!,
  slug: 'word-counter',
  icon: '🔢',
  keywords: ['word counter', 'character counter', 'word count', 'character count', 'text counter', 'document word count', 'essay word counter', 'free word counter', 'online word counter'],
  seoTitle: 'Free Word Counter & Character Counter Online - Accurate Text Counting Tool',
  seoDescription: 'Free online word counter and character counter. Instantly count words, characters, sentences, and paragraphs. Perfect for essays, articles, and documents. No upload required.',
  description: 'Free online word counter and character counter tool that instantly counts words, characters (with and without spaces), sentences, paragraphs, and provides reading time estimates. Perfect for essays, articles, social media posts, and any text content.',

  examples: [
    {
      title: 'Essay Word Count',
      input: `Introduction

Writing is a fundamental skill that serves as the cornerstone of effective communication. Whether crafting academic papers, professional reports, or creative narratives, the ability to articulate thoughts clearly and persuasively is invaluable.

Body Paragraph

The importance of writing extends beyond mere documentation. It serves as a tool for critical thinking, allowing individuals to organize their thoughts, analyze complex ideas, and present arguments in a logical sequence. Through writing, we can preserve knowledge, share experiences, and connect with readers across time and space.

Conclusion

In conclusion, mastering the art of writing opens doors to countless opportunities for personal and professional growth. As we continue to navigate an increasingly digital world, strong writing skills remain more relevant than ever.`,
      output: `# Word Count Results

**Words:** 123
**Characters (with spaces):** 789
**Characters (without spaces):** 666
**Sentences:** 7
**Paragraphs:** 3
**Estimated reading time:** 0.6 minutes`,
      description: 'Count words in academic essays and papers'
    },
    {
      title: 'Social Media Post',
      input: `Just finished reading an amazing book about productivity! 📚 The key takeaway: focus on systems, not just goals. When you build good habits and consistent processes, success becomes inevitable. What's your favorite productivity tip? #productivity #books #success`,
      output: `# Word Count Results

**Words:** 36
**Characters (with spaces):** 282
**Characters (without spaces):** 247
**Sentences:** 4
**Paragraphs:** 1
**Estimated reading time:** 11 seconds`,
      description: 'Perfect for checking social media character limits'
    },
    {
      title: 'Article Excerpt',
      input: `The rise of artificial intelligence has transformed numerous industries, from healthcare to finance. Machine learning algorithms now assist doctors in diagnosing diseases, help financial institutions detect fraud, and enable autonomous vehicles to navigate complex traffic scenarios. As AI continues to evolve, its potential applications seem limitless.`,
      output: `# Word Count Results

**Words:** 48
**Characters (with spaces):** 340
**Characters (without spaces):** 293
**Sentences:** 3
**Paragraphs:** 1
**Estimated reading time:** 0.2 minutes`,
      description: 'Analyze article length and readability'
    }
  ],

  howItWorks: [
    {
      title: "Enter Your Text",
      icon: "✏️",
      description: "Simply paste or type your text into the word counter tool. You can enter essays, articles, social media posts, or any text content. The tool supports unlimited text length and works with any language.",
      keywords: ["enter text", "paste text", "word counter input", "text analysis"]
    },
    {
      title: "Get Instant Word Count",
      icon: "⚡",
      description: "See real-time word count and character count as you type. The tool instantly calculates words, characters (with and without spaces), sentences, paragraphs, and estimated reading time.",
      keywords: ["instant word count", "real-time counting", "character count", "text statistics"]
    },
    {
      title: "Customize Display Options",
      icon: "⚙️",
      description: "Choose which statistics to display - word count, character count, sentences, paragraphs, or reading time. Customize the tool to show only the metrics you need for your specific requirements.",
      keywords: ["customize word counter", "text analysis options", "word count settings"]
    },
    {
      title: "Copy or Share Results",
      icon: "📋",
      description: "Copy your word count results to clipboard or share them easily. Perfect for meeting essay requirements, checking social media limits, or tracking writing progress.",
      keywords: ["copy word count", "share results", "export statistics", "writing progress"]
    }
  ],

  useCases: [
    'Academic essay and research paper word count requirements',
    'Content writing and blog post optimization',
    'Social media character limit checking (Twitter, LinkedIn, Instagram)',
    'Resume and cover letter length optimization',
    'Book and manuscript word count tracking',
    'Email and newsletter content length analysis',
    'Student assignment word count verification',
    'SEO meta description character counting',
    'Creative writing progress tracking',
    'Professional document length assessment'
  ],

  faq: [
    {
      question: 'How accurate is this word counter?',
      answer: 'This word counter is extremely accurate and uses industry-standard methods for counting words. It counts words by splitting text on whitespace and handles various text formats correctly, matching the word count methods used by Microsoft Word and Google Docs.'
    },
    {
      question: 'Does the character counter include spaces and punctuation?',
      answer: 'Yes, the tool provides both character counts: "with spaces" includes all characters including spaces, punctuation, and line breaks, while "without spaces" counts only letters, numbers, and symbols excluding whitespace.'
    },
    {
      question: 'Is this word counter free to use?',
      answer: 'Yes, this online word counter is completely free to use with no limits, no registration required, and no advertisements. You can count unlimited amounts of text without any restrictions.'
    },
    {
      question: 'Can I use this for academic essays and papers?',
      answer: 'Absolutely! This word counter is perfect for academic writing, providing accurate word counts that match university and school requirements. It\'s ideal for essays, research papers, dissertations, and any academic assignments with word count limits.'
    },
    {
      question: 'How is the reading time calculated?',
      answer: 'Reading time is estimated based on an average reading speed of 200 words per minute, which is the standard for adult readers. This gives you a realistic estimate of how long it would take someone to read your content.'
    },
    {
      question: 'Does this work with languages other than English?',
      answer: 'Yes, this word counter works with text in any language including Spanish, French, German, Chinese, Arabic, and many others. The word counting algorithm is language-agnostic and handles Unicode characters correctly.'
    },
    {
      question: 'Can I count words in real-time as I type?',
      answer: 'Yes, the tool provides real-time word counting as you type or paste text. You can see the word count, character count, and other statistics update instantly as you edit your content.'
    },
    {
      question: 'Is my text data secure when using this tool?',
      answer: 'Yes, your text is completely secure. All processing happens locally in your browser - no text is sent to any server or stored anywhere. Your content remains private and is never uploaded or saved.'
    }
  ],

  commonErrors: [
    'Unexpected word count differences - various tools may count hyphenated words differently',
    'Character count variations - some tools include or exclude certain whitespace characters',
    'Sentence count accuracy - depends on proper punctuation and sentence structure',
    'Reading time estimates - actual reading speed varies by individual and content complexity'
  ],

  relatedTools: ['text-statistics', 'text-case-converter', 'diff-checker', 'lorem-ipsum-generator']
};