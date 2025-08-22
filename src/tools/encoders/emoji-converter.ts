import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface EmojiConverterOptions {
  operation: 'to-unicode' | 'from-unicode' | 'to-shortcode' | 'from-shortcode' | 'analyze' | 'search';
  format: 'decimal' | 'hex' | 'css' | 'html' | 'javascript' | 'python';
  includeVariants: boolean;
  includeSkinTones: boolean;
  outputFormat: 'list' | 'table' | 'json';
  searchQuery?: string;
}

export interface EmojiConverterInput {
  content: string;
  options: EmojiConverterOptions;
}

export interface EmojiInfo {
  emoji: string;
  name: string;
  category: string;
  unicode: string;
  shortcode: string;
  keywords: string[];
  codepoints: string[];
}

export interface EmojiConverterResult extends ToolResult {
  result?: string;
  emojis?: EmojiInfo[];
  statistics?: {
    totalEmojis: number;
    uniqueEmojis: number;
    categories: Record<string, number>;
    mostUsed?: { emoji: string; count: number }[];
  };
  searchResults?: EmojiInfo[];
}

// Common emojis database (subset for demonstration)
const EMOJI_DATABASE: EmojiInfo[] = [
  {
    emoji: '😀',
    name: 'grinning face',
    category: 'Smileys & Emotion',
    unicode: 'U+1F600',
    shortcode: ':grinning:',
    keywords: ['happy', 'smile', 'face', 'joy'],
    codepoints: ['1F600']
  },
  {
    emoji: '😃',
    name: 'grinning face with big eyes',
    category: 'Smileys & Emotion',
    unicode: 'U+1F603',
    shortcode: ':smiley:',
    keywords: ['happy', 'smile', 'face', 'joy', 'eyes'],
    codepoints: ['1F603']
  },
  {
    emoji: '😄',
    name: 'grinning face with smiling eyes',
    category: 'Smileys & Emotion',
    unicode: 'U+1F604',
    shortcode: ':smile:',
    keywords: ['happy', 'smile', 'face', 'joy', 'eyes'],
    codepoints: ['1F604']
  },
  {
    emoji: '❤️',
    name: 'red heart',
    category: 'Smileys & Emotion',
    unicode: 'U+2764 U+FE0F',
    shortcode: ':heart:',
    keywords: ['love', 'heart', 'red'],
    codepoints: ['2764', 'FE0F']
  },
  {
    emoji: '👍',
    name: 'thumbs up',
    category: 'People & Body',
    unicode: 'U+1F44D',
    shortcode: ':thumbs_up:',
    keywords: ['thumbs', 'up', 'good', 'yes', 'approve'],
    codepoints: ['1F44D']
  },
  {
    emoji: '🎉',
    name: 'party popper',
    category: 'Activities',
    unicode: 'U+1F389',
    shortcode: ':tada:',
    keywords: ['party', 'celebration', 'confetti'],
    codepoints: ['1F389']
  },
  {
    emoji: '🚀',
    name: 'rocket',
    category: 'Travel & Places',
    unicode: 'U+1F680',
    shortcode: ':rocket:',
    keywords: ['rocket', 'space', 'launch', 'fast'],
    codepoints: ['1F680']
  },
  {
    emoji: '🔥',
    name: 'fire',
    category: 'Objects',
    unicode: 'U+1F525',
    shortcode: ':fire:',
    keywords: ['fire', 'hot', 'flame'],
    codepoints: ['1F525']
  },
  {
    emoji: '💯',
    name: 'hundred points',
    category: 'Smileys & Emotion',
    unicode: 'U+1F4AF',
    shortcode: ':100:',
    keywords: ['hundred', '100', 'perfect', 'score'],
    codepoints: ['1F4AF']
  },
  {
    emoji: '🌟',
    name: 'glowing star',
    category: 'Travel & Places',
    unicode: 'U+1F31F',
    shortcode: ':star2:',
    keywords: ['star', 'glowing', 'sparkle'],
    codepoints: ['1F31F']
  }
];

export function processEmojiConverter(input: EmojiConverterInput): EmojiConverterResult {
  try {
    const { content, options } = input;

    switch (options.operation) {
      case 'to-unicode':
        return convertToUnicode(content, options);
      
      case 'from-unicode':
        return convertFromUnicode(content, options);
      
      case 'to-shortcode':
        return convertToShortcode(content, options);
      
      case 'from-shortcode':
        return convertFromShortcode(content, options);
      
      case 'analyze':
        return analyzeEmojis(content, options);
      
      case 'search':
        return searchEmojis(options.searchQuery || content, options);
      
      default:
        return {
          success: false,
          error: `Unknown operation: ${options.operation}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    };
  }
}

function convertToUnicode(content: string, options: EmojiConverterOptions): EmojiConverterResult {
  if (!content) {
    return { success: true, result: '', emojis: [] };
  }

  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  let result = content;
  const foundEmojis: EmojiInfo[] = [];

  content.replace(emojiRegex, (match) => {
    const emojiInfo = findEmojiByCharacter(match);
    if (emojiInfo) {
      foundEmojis.push(emojiInfo);
      const unicodeFormat = formatUnicode(emojiInfo.codepoints, options.format);
      result = result.replace(match, unicodeFormat);
    }
    return match;
  });

  return {
    success: true,
    result,
    emojis: foundEmojis
  };
}

function convertFromUnicode(content: string, options: EmojiConverterOptions): EmojiConverterResult {
  if (!content) {
    return { success: true, result: '', emojis: [] };
  }

  let result = content;
  const foundEmojis: EmojiInfo[] = [];

  // Match various Unicode formats
  const patterns = [
    /U\+([0-9A-F]{4,6})/gi,
    /\\u\{([0-9A-F]{4,6})\}/gi,
    /\\u([0-9A-F]{4})/gi,
    /&#x([0-9A-F]{4,6});/gi,
    /&#([0-9]+);/gi,
    /0x([0-9A-F]{4,6})/gi
  ];

  patterns.forEach(pattern => {
    result = result.replace(pattern, (match, code) => {
      try {
        let codePoint;
        if (pattern.source.includes('&#([0-9]+)')) {
          codePoint = parseInt(code, 10);
        } else {
          codePoint = parseInt(code, 16);
        }
        
        const emoji = String.fromCodePoint(codePoint);
        const emojiInfo = findEmojiByCharacter(emoji);
        if (emojiInfo) {
          foundEmojis.push(emojiInfo);
        }
        return emoji;
      } catch (e) {
        return match;
      }
    });
  });

  return {
    success: true,
    result,
    emojis: foundEmojis
  };
}

function convertToShortcode(content: string, options: EmojiConverterOptions): EmojiConverterResult {
  if (!content) {
    return { success: true, result: '', emojis: [] };
  }

  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  let result = content;
  const foundEmojis: EmojiInfo[] = [];

  result = result.replace(emojiRegex, (match) => {
    const emojiInfo = findEmojiByCharacter(match);
    if (emojiInfo) {
      foundEmojis.push(emojiInfo);
      return emojiInfo.shortcode;
    }
    return match;
  });

  return {
    success: true,
    result,
    emojis: foundEmojis
  };
}

function convertFromShortcode(content: string, options: EmojiConverterOptions): EmojiConverterResult {
  if (!content) {
    return { success: true, result: '', emojis: [] };
  }

  let result = content;
  const foundEmojis: EmojiInfo[] = [];

  const shortcodeRegex = /:[\w+-]+:/g;
  result = result.replace(shortcodeRegex, (match) => {
    const emojiInfo = findEmojiByShortcode(match);
    if (emojiInfo) {
      foundEmojis.push(emojiInfo);
      return emojiInfo.emoji;
    }
    return match;
  });

  return {
    success: true,
    result,
    emojis: foundEmojis
  };
}

function analyzeEmojis(content: string, options: EmojiConverterOptions): EmojiConverterResult {
  if (!content) {
    return { 
      success: true, 
      result: 'No emojis found',
      statistics: {
        totalEmojis: 0,
        uniqueEmojis: 0,
        categories: {}
      }
    };
  }

  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const matches = Array.from(content.matchAll(emojiRegex));
  
  const emojiCounts: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const foundEmojis: EmojiInfo[] = [];

  matches.forEach(match => {
    const emoji = match[0];
    emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
    
    const emojiInfo = findEmojiByCharacter(emoji);
    if (emojiInfo) {
      if (!foundEmojis.find(e => e.emoji === emoji)) {
        foundEmojis.push(emojiInfo);
      }
      categories[emojiInfo.category] = (categories[emojiInfo.category] || 0) + 1;
    }
  });

  const mostUsed = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({ emoji, count }));

  const statistics = {
    totalEmojis: matches.length,
    uniqueEmojis: Object.keys(emojiCounts).length,
    categories,
    mostUsed
  };

  let result = '';
  if (options.outputFormat === 'json') {
    result = JSON.stringify({ emojis: foundEmojis, statistics }, null, 2);
  } else if (options.outputFormat === 'table') {
    result = formatAsTable(foundEmojis, statistics);
  } else {
    result = formatAsList(foundEmojis, statistics);
  }

  return {
    success: true,
    result,
    emojis: foundEmojis,
    statistics
  };
}

function searchEmojis(query: string, options: EmojiConverterOptions): EmojiConverterResult {
  if (!query) {
    return { success: true, result: 'Enter a search query', searchResults: [] };
  }

  const searchTerm = query.toLowerCase();
  const results = EMOJI_DATABASE.filter(emoji => 
    emoji.name.toLowerCase().includes(searchTerm) ||
    emoji.shortcode.toLowerCase().includes(searchTerm) ||
    emoji.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
    emoji.category.toLowerCase().includes(searchTerm)
  );

  let result = '';
  if (options.outputFormat === 'json') {
    result = JSON.stringify(results, null, 2);
  } else if (options.outputFormat === 'table') {
    result = formatSearchResults(results);
  } else {
    result = results.map(emoji => `${emoji.emoji} ${emoji.name} (${emoji.shortcode})`).join('\n');
  }

  return {
    success: true,
    result,
    searchResults: results
  };
}

function findEmojiByCharacter(character: string): EmojiInfo | undefined {
  return EMOJI_DATABASE.find(emoji => emoji.emoji === character);
}

function findEmojiByShortcode(shortcode: string): EmojiInfo | undefined {
  return EMOJI_DATABASE.find(emoji => emoji.shortcode === shortcode);
}

function formatUnicode(codepoints: string[], format: string): string {
  switch (format) {
    case 'decimal':
      return codepoints.map(cp => `&#${parseInt(cp, 16)};`).join('');
    case 'hex':
      return codepoints.map(cp => `&#x${cp};`).join('');
    case 'css':
      return codepoints.map(cp => `\\${cp.toLowerCase()}`).join('');
    case 'html':
      return codepoints.map(cp => `&#x${cp};`).join('');
    case 'javascript':
      return codepoints.map(cp => `\\u{${cp}}`).join('');
    case 'python':
      return codepoints.map(cp => `\\U${cp.padStart(8, '0')}`).join('');
    default:
      return codepoints.map(cp => `U+${cp}`).join(' ');
  }
}

function formatAsList(emojis: EmojiInfo[], statistics: any): string {
  let result = `Found ${statistics.totalEmojis} emojis (${statistics.uniqueEmojis} unique)\n\n`;
  
  result += 'Categories:\n';
  Object.entries(statistics.categories).forEach(([category, count]) => {
    result += `- ${category}: ${count}\n`;
  });
  
  result += '\nEmojis found:\n';
  emojis.forEach(emoji => {
    result += `${emoji.emoji} ${emoji.name} (${emoji.shortcode}) - ${emoji.unicode}\n`;
  });
  
  return result;
}

function formatAsTable(emojis: EmojiInfo[], statistics: any): string {
  let result = `Emoji Analysis Results\n`;
  result += `Total: ${statistics.totalEmojis} | Unique: ${statistics.uniqueEmojis}\n\n`;
  
  result += `Emoji | Name | Shortcode | Unicode | Category\n`;
  result += `------|------|-----------|---------|----------\n`;
  
  emojis.forEach(emoji => {
    result += `${emoji.emoji} | ${emoji.name} | ${emoji.shortcode} | ${emoji.unicode} | ${emoji.category}\n`;
  });
  
  return result;
}

function formatSearchResults(results: EmojiInfo[]): string {
  let output = `Found ${results.length} matching emojis:\n\n`;
  output += `Emoji | Name | Shortcode | Keywords\n`;
  output += `------|------|-----------|----------\n`;
  
  results.forEach(emoji => {
    output += `${emoji.emoji} | ${emoji.name} | ${emoji.shortcode} | ${emoji.keywords.join(', ')}\n`;
  });
  
  return output;
}

export const EMOJI_CONVERTER_TOOL: Tool = {
  id: 'emoji-converter',
  name: 'Emoji Converter',
  description: 'Convert between emoji formats, analyze emoji usage, and search emoji database',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'text-encoding')!,
  slug: 'emoji-converter',
  icon: 'Smile',
  tags: ['emoji', 'unicode', 'shortcode', 'convert', 'analyze'],
  complexity: 'intermediate',
  keywords: ['emoji', 'unicode', 'shortcode', 'convert', 'analyze', 'search', 'emoticon'],
  
  examples: [
    {
      title: 'Emoji to Unicode Conversion',
      input: 'Hello 😀 World!',
      output: 'Hello U+1F600 World!',
      description: 'Convert emojis to Unicode codepoints'
    },
    {
      title: 'Unicode to Emoji Conversion',
      input: 'Hello U+1F600 World!',
      output: 'Hello 😀 World!',
      description: 'Convert Unicode codepoints back to emojis'
    },
    {
      title: 'Emoji Analysis',
      input: '🎉 Celebrating 🎂 with friends! 😀😃😄',
      output: 'Found 5 emojis (4 unique)\nCategories:\n- Activities: 2\n- Smileys & Emotion: 3',
      description: 'Analyze emoji usage and get statistics'
    }
  ],
  
  useCases: [
    'Convert emojis to Unicode codepoints for programming',
    'Transform Unicode codepoints back to emojis',
    'Convert between emoji shortcodes and actual emojis',
    'Analyze emoji usage in text content',
    'Search for emojis by name or keywords',
    'Generate emoji statistics and reports',
    'Extract emoji information from text'
  ],
  
  faq: [
    {
      question: 'What emoji formats are supported?',
      answer: 'Unicode codepoints (various formats), emoji shortcodes (:smile:), and actual emoji characters are supported.'
    },
    {
      question: 'How comprehensive is the emoji database?',
      answer: 'The tool includes a curated set of common emojis. The full Unicode emoji set would require a larger database.'
    },
    {
      question: 'Can I analyze emoji usage in my text?',
      answer: 'Yes, the analyze feature provides statistics, categories, and most-used emoji information.'
    },
    {
      question: 'What Unicode formats are supported?',
      answer: 'U+1F600, \\u{1F600}, \\u1F600, &#x1F600;, &#128512;, and 0x1F600 formats are supported.'
    }
  ],
  
  commonErrors: [
    'Invalid Unicode format',
    'Unsupported emoji shortcode',
    'Malformed codepoint sequence'
  ],
  
  relatedTools: ['text-statistics', 'string-escape', 'html-entity-encoder'],
  seoTitle: 'Emoji Converter - Unicode, Shortcode, and Emoji Analysis Tool',
  seoDescription: 'Convert between emoji formats, analyze emoji usage, and search emoji database. Support for Unicode, shortcodes, and emoji statistics.'
};