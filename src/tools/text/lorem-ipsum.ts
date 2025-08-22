import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface LoremIpsumConfig {
  type: 'classic' | 'modern' | 'hipster' | 'pirate' | 'random';
  format: 'words' | 'sentences' | 'paragraphs';
  count: number;
  startWithLorem: boolean;
  includeHtml: boolean;
  htmlTags: string[];
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    characterCount: number;
  };
}

const CLASSIC_WORDS = [
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
  'et', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta', 'sunt', 'explicabo',
  'nemo', 'ipsam', 'voluptatem', 'quia', 'voluptas', 'aspernatur', 'aut',
  'odit', 'fugit', 'sed', 'quia', 'consequuntur', 'magni', 'dolores',
  'ratione', 'sequi', 'nesciunt', 'neque', 'porro', 'quisquam', 'dolorem',
  'adipisci', 'numquam', 'eius', 'modi', 'tempora', 'incidunt', 'magnam'
];

const MODERN_WORDS = [
  'innovation', 'synergy', 'paradigm', 'leverage', 'streamline', 'optimize',
  'facilitate', 'implement', 'integrate', 'maximize', 'strategize', 'revolutionize',
  'enhance', 'empower', 'transform', 'collaborate', 'utilize', 'generate',
  'cultivate', 'pioneer', 'evolve', 'advance', 'accelerate', 'amplify',
  'architect', 'benchmark', 'customize', 'deliver', 'engineer', 'execute',
  'expedite', 'fabricate', 'harness', 'incentivize', 'iterate', 'orchestrate',
  'productize', 'recontextualize', 'reinvent', 'scale', 'synthesize',
  'transition', 'visualize', 'whiteboard', 'ecosystem', 'workflow',
  'methodology', 'framework', 'infrastructure', 'solution', 'platform',
  'interface', 'dashboard', 'analytics', 'metrics', 'deployment', 'scalability',
  'performance', 'efficiency', 'productivity', 'automation', 'digitization',
  'cloud', 'artificial', 'intelligence', 'machine', 'learning', 'blockchain',
  'quantum', 'computing', 'virtual', 'reality', 'augmented', 'cybersecurity'
];

const HIPSTER_WORDS = [
  'artisan', 'organic', 'sustainable', 'locavore', 'farm-to-table', 'craft',
  'vintage', 'retro', 'authentic', 'curated', 'bespoke', 'handcrafted',
  'small-batch', 'single-origin', 'fair-trade', 'ethical', 'mindful',
  'conscious', 'holistic', 'wellness', 'meditation', 'yoga', 'kombucha',
  'quinoa', 'kale', 'avocado', 'mason', 'jar', 'bicycle', 'fixie',
  'vinyl', 'record', 'polaroid', 'instagram', 'aesthetic', 'minimalist',
  'scandinavian', 'hygge', 'wanderlust', 'adventure', 'explore', 'discover',
  'journey', 'experience', 'mindfulness', 'intention', 'gratitude',
  'manifest', 'vibration', 'energy', 'chakra', 'crystal', 'sage',
  'cleanse', 'detox', 'superfood', 'matcha', 'turmeric', 'goji',
  'acai', 'chia', 'hemp', 'coconut', 'almond', 'oat', 'milk'
];

const PIRATE_WORDS = [
  'ahoy', 'matey', 'avast', 'ye', 'scurvy', 'landlubber', 'scallywag',
  'barnacle', 'bilge', 'rat', 'blimey', 'buccaneer', 'cutlass', 'doubloon',
  'parrot', 'treasure', 'chest', 'map', 'island', 'ship', 'vessel',
  'crew', 'captain', 'first', 'mate', 'anchor', 'sail', 'mast',
  'rigging', 'hull', 'deck', 'galley', 'quarters', 'crow', 'nest',
  'plank', 'jolly', 'roger', 'black', 'flag', 'skull', 'crossbones',
  'cannon', 'sword', 'rum', 'grog', 'tavern', 'port', 'harbor',
  'sea', 'ocean', 'waves', 'storm', 'thunder', 'lightning', 'wind',
  'adventure', 'quest', 'fortune', 'gold', 'silver', 'jewels', 'loot',
  'plunder', 'raid', 'attack', 'battle', 'fight', 'victory', 'defeat'
];

function getWordList(type: string): string[] {
  switch (type) {
    case 'modern':
      return MODERN_WORDS;
    case 'hipster':
      return HIPSTER_WORDS;
    case 'pirate':
      return PIRATE_WORDS;
    case 'random':
      const allWords = [...CLASSIC_WORDS, ...MODERN_WORDS, ...HIPSTER_WORDS, ...PIRATE_WORDS];
      return allWords;
    case 'classic':
    default:
      return CLASSIC_WORDS;
  }
}

function getRandomWord(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}

function generateWords(count: number, words: string[], startWithLorem: boolean): string[] {
  const result: string[] = [];
  
  if (startWithLorem && words === CLASSIC_WORDS) {
    result.push('lorem', 'ipsum');
    count = Math.max(0, count - 2);
  }
  
  for (let i = 0; i < count; i++) {
    result.push(getRandomWord(words));
  }
  
  return result;
}

function generateSentence(words: string[], minWords = 8, maxWords = 20): string {
  const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const sentenceWords = [];
  
  for (let i = 0; i < wordCount; i++) {
    sentenceWords.push(getRandomWord(words));
  }
  
  // Capitalize first word
  if (sentenceWords.length > 0) {
    sentenceWords[0] = sentenceWords[0].charAt(0).toUpperCase() + sentenceWords[0].slice(1);
  }
  
  return sentenceWords.join(' ') + '.';
}

function generateParagraph(words: string[], minSentences = 3, maxSentences = 8): string {
  const sentenceCount = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
  const sentences: string[] = [];
  
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence(words));
  }
  
  return sentences.join(' ');
}

function wrapWithHtml(text: string, tags: string[]): string {
  if (tags.length === 0) return text;
  
  const paragraphs = text.split('\n\n');
  const wrappedParagraphs = paragraphs.map(paragraph => {
    if (!paragraph.trim()) return paragraph;
    
    const tag = tags[Math.floor(Math.random() * tags.length)];
    
    switch (tag) {
      case 'p':
        return `<p>${paragraph}</p>`;
      case 'div':
        return `<div>${paragraph}</div>`;
      case 'section':
        return `<section>${paragraph}</section>`;
      case 'article':
        return `<article>${paragraph}</article>`;
      case 'blockquote':
        return `<blockquote>${paragraph}</blockquote>`;
      case 'h1':
        return `<h1>${paragraph.split('.')[0]}.</h1>`;
      case 'h2':
        return `<h2>${paragraph.split('.')[0]}.</h2>`;
      case 'h3':
        return `<h3>${paragraph.split('.')[0]}.</h3>`;
      default:
        return `<${tag}>${paragraph}</${tag}>`;
    }
  });
  
  return wrappedParagraphs.join('\n');
}

function calculateStats(text: string): ToolResult['stats'] {
  const words = text.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0);
  const sentences = text.replace(/<[^>]*>/g, '').split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);
  const characters = text.length;
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    characterCount: characters
  };
}

export function processLoremIpsum(input: string, config: LoremIpsumConfig): ToolResult {
  try {
    if (config.count <= 0) {
      return {
        success: false,
        error: 'Count must be greater than 0'
      };
    }
    
    if (config.count > 10000) {
      return {
        success: false,
        error: 'Count too large. Maximum is 10,000 for performance reasons.'
      };
    }
    
    const words = getWordList(config.type);
    let output = '';
    
    switch (config.format) {
      case 'words': {
        const generatedWords = generateWords(config.count, words, config.startWithLorem);
        output = generatedWords.join(' ');
        break;
      }
      
      case 'sentences': {
        const sentences: string[] = [];
        for (let i = 0; i < config.count; i++) {
          let sentence = generateSentence(words);
          
          // For first sentence, optionally start with "Lorem ipsum"
          if (i === 0 && config.startWithLorem && config.type === 'classic') {
            sentence = 'Lorem ipsum ' + sentence.toLowerCase();
            sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
          }
          
          sentences.push(sentence);
        }
        output = sentences.join(' ');
        break;
      }
      
      case 'paragraphs': {
        const paragraphs: string[] = [];
        for (let i = 0; i < config.count; i++) {
          let paragraph = generateParagraph(words);
          
          // For first paragraph, optionally start with "Lorem ipsum"
          if (i === 0 && config.startWithLorem && config.type === 'classic') {
            paragraph = 'Lorem ipsum ' + paragraph.toLowerCase();
            paragraph = paragraph.charAt(0).toUpperCase() + paragraph.slice(1);
          }
          
          paragraphs.push(paragraph);
        }
        output = paragraphs.join('\n\n');
        break;
      }
      
      default:
        return {
          success: false,
          error: 'Invalid format specified'
        };
    }
    
    // Apply HTML formatting if requested
    if (config.includeHtml && config.htmlTags.length > 0) {
      output = wrapWithHtml(output, config.htmlTags);
    }
    
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

export const LOREM_IPSUM_TOOL: Tool = {
  id: 'lorem-ipsum',
  name: 'Lorem Ipsum Generator',
  description: 'Generate placeholder text in various styles including classic Lorem Ipsum, modern business text, hipster phrases, and pirate speak for design and development mockups.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-generation')!,
  slug: 'lorem-ipsum',
  icon: 'Type',
  tags: ['lorem', 'ipsum', 'placeholder', 'text', 'generator', 'design', 'mockup'],
  complexity: 'beginner',
  keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'generator', 'design', 'mockup', 'classic', 'modern', 'hipster', 'pirate'],
  
  examples: [
    {
      title: 'Classic Lorem Ipsum (3 paragraphs)',
      input: '',
      output: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      description: 'Traditional Lorem Ipsum text starting with "Lorem ipsum dolor sit amet"'
    },
    {
      title: 'Modern Business Text (5 sentences)',
      input: '',
      output: 'Innovation synergy paradigm leverage streamline...',
      description: 'Contemporary business and tech buzzwords for modern designs'
    },
    {
      title: 'Hipster Style (50 words)',
      input: '',
      output: 'Artisan organic sustainable locavore farm-to-table...',
      description: 'Trendy lifestyle and artisan-focused placeholder text'
    }
  ],
  
  useCases: [
    'Website and app design mockups',
    'Print design layouts and templates',
    'Content management system testing',
    'Typography and layout testing',
    'Client presentations and demos'
  ],
  
  faq: [
    {
      question: 'What is Lorem Ipsum and why is it used?',
      answer: 'Lorem Ipsum is placeholder text used in the printing and typesetting industry since the 1500s. It helps designers focus on layout and design without being distracted by readable content.'
    },
    {
      question: 'What text styles are available?',
      answer: 'We offer Classic Lorem Ipsum, Modern business language, Hipster lifestyle terms, Pirate speak, and Random mixed styles for different design contexts.'
    },
    {
      question: 'Can I generate HTML-formatted text?',
      answer: 'Yes, you can wrap the generated text in HTML tags like <p>, <div>, <h1>-<h3>, <blockquote>, and more for ready-to-use markup.'
    },
    {
      question: 'Should I start with "Lorem ipsum"?',
      answer: 'For classic style, starting with "Lorem ipsum" is traditional and helps identify it as placeholder text. For other styles, you can choose based on your preference.'
    },
    {
      question: 'What are the different output formats?',
      answer: 'Words gives you a specified number of words, Sentences creates complete sentences, and Paragraphs generates full paragraphs with multiple sentences each.'
    }
  ],
  
  commonErrors: [
    'Generated text is too short or long',
    'HTML tags are not working',
    'Text doesn\'t start with Lorem Ipsum'
  ],
  
  relatedTools: ['text-statistics', 'string-escape', 'html-beautifier'],
  seoTitle: 'Lorem Ipsum Generator - Free Placeholder Text Tool',
  seoDescription: 'Generate Lorem Ipsum placeholder text in multiple styles. Perfect for design mockups, web development, and content testing.'
};