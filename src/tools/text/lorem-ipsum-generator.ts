import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface LoremIpsumGeneratorConfig {
  outputType: 'paragraphs' | 'sentences' | 'words' | 'characters';
  count: number;
  startWithLorem: boolean;
  includeHtml: boolean;
  htmlTags: string[];
  language: 'latin' | 'english' | 'tech' | 'corporate' | 'hipster';
  seed: string;
  lineBreaks: 'paragraph' | 'sentence' | 'none';
  capitalizeFirst: boolean;
  punctuation: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: LoremStats;
}

interface LoremStats {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  characterCount: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
}

// Classic Lorem Ipsum text
const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos',
  'accusamus', 'accusantium', 'doloremque', 'laudantium', 'totam', 'rem',
  'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis',
  'et', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta', 'explicabo', 'nemo',
  'ipsam', 'voluptatem', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
  'fugit', 'sed', 'quia', 'consequuntur', 'magni', 'dolores', 'ratione',
  'sequi', 'neque', 'porro', 'quisquam', 'est', 'qui', 'dolorem', 'adipisci',
  'numquam', 'eius', 'modi', 'tempora', 'incidunt', 'magnam', 'quaerat'
];

const ENGLISH_WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and',
  'runs', 'through', 'forest', 'while', 'chasing', 'rabbit', 'under',
  'bright', 'moonlight', 'across', 'meadow', 'near', 'river', 'where',
  'fish', 'swim', 'peacefully', 'among', 'water', 'lilies', 'blooming',
  'spring', 'sunshine', 'warms', 'earth', 'gentle', 'breeze', 'carries',
  'sweet', 'fragrance', 'flowers', 'birds', 'sing', 'melodious', 'songs',
  'trees', 'sway', 'softly', 'beautiful', 'morning', 'peaceful', 'valley',
  'surrounded', 'mountains', 'covered', 'snow', 'crystal', 'clear', 'lake',
  'reflects', 'blue', 'sky', 'white', 'clouds', 'drift', 'slowly', 'above',
  'children', 'play', 'happily', 'garden', 'full', 'colorful', 'butterflies'
];

const TECH_WORDS = [
  'algorithm', 'api', 'backend', 'database', 'frontend', 'framework',
  'javascript', 'python', 'react', 'nodejs', 'docker', 'kubernetes',
  'microservice', 'authentication', 'authorization', 'encryption', 'ssl',
  'https', 'json', 'xml', 'rest', 'graphql', 'websocket', 'cache',
  'redis', 'mongodb', 'postgresql', 'mysql', 'optimization', 'performance',
  'scalability', 'deployment', 'ci/cd', 'devops', 'monitoring', 'logging',
  'debugging', 'testing', 'unit', 'integration', 'automation', 'pipeline',
  'repository', 'version', 'control', 'git', 'branch', 'merge', 'commit',
  'pull', 'request', 'code', 'review', 'refactoring', 'architecture',
  'design', 'pattern', 'component', 'module', 'library', 'package'
];

const CORPORATE_WORDS = [
  'synergy', 'leverage', 'optimize', 'streamline', 'implement', 'strategy',
  'solution', 'innovative', 'paradigm', 'framework', 'methodology',
  'initiative', 'deliverable', 'stakeholder', 'bandwidth', 'capacity',
  'workflow', 'process', 'efficiency', 'productivity', 'performance',
  'metrics', 'analytics', 'insights', 'actionable', 'scalable', 'robust',
  'enterprise', 'corporate', 'business', 'objectives', 'goals', 'targets',
  'revenue', 'growth', 'market', 'competitive', 'advantage', 'value',
  'proposition', 'customer', 'client', 'user', 'experience', 'engagement',
  'retention', 'acquisition', 'conversion', 'funnel', 'pipeline',
  'quarterly', 'annual', 'forecast', 'budget', 'resources', 'allocation'
];

const HIPSTER_WORDS = [
  'artisan', 'craft', 'organic', 'sustainable', 'locally', 'sourced',
  'handcrafted', 'vintage', 'retro', 'authentic', 'unique', 'boutique',
  'curated', 'minimalist', 'aesthetic', 'vibe', 'mood', 'trendy',
  'hipster', 'indie', 'underground', 'alternative', 'artisanal', 'bespoke',
  'heritage', 'traditional', 'rustic', 'urban', 'contemporary', 'modern',
  'creative', 'innovative', 'experimental', 'eclectic', 'bohemian',
  'chic', 'stylish', 'fashionable', 'cool', 'edgy', 'sophisticated',
  'refined', 'cultured', 'worldly', 'cosmopolitan', 'metropolitan',
  'lifestyle', 'experience', 'journey', 'adventure', 'discovery',
  'exploration', 'wanderlust', 'nomadic', 'freedom', 'expression'
];

const WORD_SETS: Record<string, string[]> = {
  latin: LOREM_WORDS,
  english: ENGLISH_WORDS,
  tech: TECH_WORDS,
  corporate: CORPORATE_WORDS,
  hipster: HIPSTER_WORDS
};

// Simple seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: string = '') {
    this.seed = this.hashCode(seed) || Math.random() * 2147483647;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  randomChoice<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)];
  }
}

function generateWords(count: number, config: LoremIpsumGeneratorConfig): string[] {
  const wordSet = WORD_SETS[config.language] || LOREM_WORDS;
  const rng = new SeededRandom(config.seed);
  const words: string[] = [];

  // Start with "Lorem ipsum" if requested and using Latin
  if (config.startWithLorem && config.language === 'latin' && count >= 2) {
    words.push('Lorem', 'ipsum');
    count -= 2;
  }

  for (let i = 0; i < count; i++) {
    words.push(rng.randomChoice(wordSet));
  }

  return words;
}

function generateSentences(count: number, config: LoremIpsumGeneratorConfig): string[] {
  const rng = new SeededRandom(config.seed);
  const sentences: string[] = [];

  for (let i = 0; i < count; i++) {
    const wordsInSentence = rng.randomInt(8, 18);
    const words = generateWords(wordsInSentence, { ...config, startWithLorem: i === 0 && config.startWithLorem });
    
    let sentence = words.join(' ');
    
    if (config.capitalizeFirst) {
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }
    
    if (config.punctuation) {
      const punctMarks = ['.', '.', '.', '.', '!', '?']; // Weighted toward periods
      sentence += rng.randomChoice(punctMarks);
    }
    
    sentences.push(sentence);
  }

  return sentences;
}

function generateParagraphs(count: number, config: LoremIpsumGeneratorConfig): string[] {
  const rng = new SeededRandom(config.seed);
  const paragraphs: string[] = [];

  for (let i = 0; i < count; i++) {
    const sentencesInParagraph = rng.randomInt(3, 8);
    const sentences = generateSentences(sentencesInParagraph, { 
      ...config, 
      startWithLorem: i === 0 && config.startWithLorem 
    });
    paragraphs.push(sentences.join(' '));
  }

  return paragraphs;
}

function wrapWithHtml(content: string[], tags: string[]): string[] {
  if (tags.length === 0) return content;

  const rng = new SeededRandom();
  return content.map(item => {
    const tag = rng.randomChoice(tags);
    return `<${tag}>${item}</${tag}>`;
  });
}

function calculateStats(text: string): LoremStats {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;
  const characterCount = text.length;
  const averageWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
  const averageSentencesPerParagraph = paragraphCount > 0 ? Math.round(sentenceCount / paragraphCount) : 0;

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    characterCount,
    averageWordsPerSentence,
    averageSentencesPerParagraph
  };
}

export function processLoremIpsumGenerator(config: LoremIpsumGeneratorConfig): ToolResult {
  try {
    if (config.count <= 0) {
      return {
        success: false,
        error: 'Count must be greater than 0'
      };
    }

    if (config.count > 1000) {
      return {
        success: false,
        error: 'Count cannot exceed 1000 for performance reasons'
      };
    }

    let content: string[] = [];

    switch (config.outputType) {
      case 'words':
        content = generateWords(config.count, config);
        break;
      
      case 'sentences':
        content = generateSentences(config.count, config);
        break;
      
      case 'paragraphs':
        content = generateParagraphs(config.count, config);
        break;
      
      case 'characters':
        const words = generateWords(Math.ceil(config.count / 6), config);
        let text = words.join(' ');
        content = [text.substring(0, config.count)];
        break;
    }

    // Apply HTML wrapping if requested
    if (config.includeHtml && config.htmlTags.length > 0) {
      content = wrapWithHtml(content, config.htmlTags);
    }

    // Join content with appropriate separators
    let output = '';
    switch (config.lineBreaks) {
      case 'paragraph':
        output = content.join('\n\n');
        break;
      case 'sentence':
        output = content.join('\n');
        break;
      case 'none':
        output = content.join(' ');
        break;
    }

    // Calculate statistics
    const stats = calculateStats(output);

    return {
      success: true,
      output,
      stats
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate Lorem Ipsum text'
    };
  }
}

export const LOREM_IPSUM_GENERATOR_TOOL: Tool = {
  id: 'lorem-ipsum-generator',
  name: 'Lorem Ipsum Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-generation')!,
  slug: 'lorem-ipsum-generator',
  icon: '=�',
  keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy', 'content', 'filler', 'generator'],
  seoTitle: 'Lorem Ipsum Generator - Create Placeholder Text | FreeFormatHub',
  seoDescription: 'Generate Lorem Ipsum placeholder text for design and development. Multiple languages, HTML support, custom lengths, and seeded generation.',
  description: 'Generate Lorem Ipsum and placeholder text for your design and development needs. Multiple languages and formats with customizable options.',

  examples: [
    {
      title: 'Classic Lorem Ipsum (3 paragraphs)',
      input: 'Type: Paragraphs, Count: 3, Language: Latin',
      output: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`,
      description: 'Standard Lorem Ipsum text for design layouts'
    },
    {
      title: 'Tech Placeholder (50 words)',
      input: 'Type: Words, Count: 50, Language: Tech',
      output: `algorithm api backend database frontend framework javascript python react nodejs docker kubernetes microservice authentication authorization encryption ssl https json xml rest graphql websocket cache redis mongodb postgresql mysql optimization performance scalability deployment ci/cd devops monitoring logging debugging testing unit integration automation pipeline repository version control git branch merge commit pull request code review refactoring`,
      description: 'Technical terminology for developer mockups'
    },
    {
      title: 'HTML Paragraphs',
      input: 'Type: Paragraphs, Count: 2, HTML: true, Tags: p, h2',
      output: `<h2>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</h2>

<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>`,
      description: 'HTML-wrapped content for web development'
    }
  ],

  useCases: [
    'Creating placeholder content for website and app designs',
    'Filling templates and mockups with realistic text lengths',
    'Testing typography and layout with various content sizes',
    'Generating content for design presentations and prototypes',
    'Creating dummy data for development and testing environments',
    'Filling CMS templates with temporary content during development',
    'Generating HTML content with proper semantic markup',
    'Creating industry-specific placeholder text for specialized projects'
  ],

  faq: [
    {
      question: 'What is Lorem Ipsum and why is it used?',
      answer: 'Lorem Ipsum is scrambled Latin text used as placeholder content since the 1500s. It has a normal distribution of letters, making it ideal for testing layouts without distracting readable content.'
    },
    {
      question: 'What are the different language options for?',
      answer: 'Different vocabularies serve specific needs: Latin (traditional), English (readable), Tech (development content), Corporate (business contexts), and Hipster (lifestyle/creative projects).'
    },
    {
      question: 'How does seeded generation work?',
      answer: 'Providing a seed string ensures consistent output for the same parameters. This is useful when you need reproducible placeholder content across different sessions or team members.'
    },
    {
      question: 'When should I use HTML wrapping?',
      answer: 'HTML wrapping is perfect for web development when you need content already formatted with proper tags (p, h1-h6, div, span, etc.) to test styling and markup structure.'
    },
    {
      question: 'What\'s the difference between output types?',
      answer: 'Words generate individual terms, Sentences create complete thoughts, Paragraphs build full text blocks, and Characters give exact length control for fixed-width layouts.'
    }
  ],

  commonErrors: [
    'Count value exceeds maximum limit (1000)',
    'Count value is zero or negative',
    'No HTML tags selected when HTML wrapping is enabled',
    'Invalid seed string causing generation issues',
    'Requesting character count that\'s too small for meaningful content'
  ],

  relatedTools: ['text-generator', 'random-data', 'content-filler', 'design-placeholder', 'dummy-text']
};