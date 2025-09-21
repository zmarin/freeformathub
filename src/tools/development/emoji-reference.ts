import { Tool, ToolExample } from '../../types/tool';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface EmojiData {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  keywords: string[];
  unicode: string;
  htmlCode: string;
  cssCode: string;
  shortcode: string;
  aliases: string[];
  skinTones?: string[];
  tags: string[];
}

export const EMOJI_DATA: EmojiData[] = [
  // Smileys & Emotion
  {
    id: 'grinning-face',
    emoji: '😀',
    name: 'Grinning Face',
    description: 'A happy, smiling face with open mouth',
    category: 'Smileys & Emotion',
    subcategory: 'face-smiling',
    keywords: ['happy', 'smile', 'grin', 'joy'],
    unicode: 'U+1F600',
    htmlCode: '&#128512;',
    cssCode: '\\1F600',
    shortcode: ':grinning:',
    aliases: [':grinning_face:'],
    tags: ['happy', 'smile', 'emotion', 'face']
  },
  {
    id: 'grinning-face-big-eyes',
    emoji: '😃',
    name: 'Grinning Face with Big Eyes',
    description: 'A happy face with big eyes and open mouth',
    category: 'Smileys & Emotion',
    subcategory: 'face-smiling',
    keywords: ['happy', 'smile', 'big eyes', 'excited'],
    unicode: 'U+1F603',
    htmlCode: '&#128515;',
    cssCode: '\\1F603',
    shortcode: ':smiley:',
    aliases: [':smiley_face:', ':grinning_face_with_big_eyes:'],
    tags: ['happy', 'smile', 'emotion', 'excited']
  },
  {
    id: 'grinning-face-smiling-eyes',
    emoji: '😄',
    name: 'Grinning Face with Smiling Eyes',
    description: 'A very happy face with smiling eyes',
    category: 'Smileys & Emotion',
    subcategory: 'face-smiling',
    keywords: ['happy', 'smile', 'laugh', 'joy'],
    unicode: 'U+1F604',
    htmlCode: '&#128516;',
    cssCode: '\\1F604',
    shortcode: ':smile:',
    aliases: [':grinning_face_with_smiling_eyes:'],
    tags: ['happy', 'smile', 'laugh', 'joy']
  },
  {
    id: 'beaming-face',
    emoji: '😁',
    name: 'Beaming Face with Smiling Eyes',
    description: 'A very happy face beaming with joy',
    category: 'Smileys & Emotion',
    subcategory: 'face-smiling',
    keywords: ['happy', 'beam', 'grin', 'excited'],
    unicode: 'U+1F601',
    htmlCode: '&#128513;',
    cssCode: '\\1F601',
    shortcode: ':grin:',
    aliases: [':beaming_face:'],
    tags: ['happy', 'beam', 'grin', 'excited']
  },
  {
    id: 'laughing',
    emoji: '😂',
    name: 'Face with Tears of Joy',
    description: 'Laughing so hard that tears come out',
    category: 'Smileys & Emotion',
    subcategory: 'face-smiling',
    keywords: ['laugh', 'tears', 'funny', 'hilarious'],
    unicode: 'U+1F602',
    htmlCode: '&#128514;',
    cssCode: '\\1F602',
    shortcode: ':joy:',
    aliases: [':laughing:', ':tears_of_joy:'],
    tags: ['laugh', 'tears', 'funny', 'hilarious']
  },
  {
    id: 'winking',
    emoji: '😉',
    name: 'Winking Face',
    description: 'A face with one eye winking',
    category: 'Smileys & Emotion',
    subcategory: 'face-smiling',
    keywords: ['wink', 'flirt', 'playful', 'joke'],
    unicode: 'U+1F609',
    htmlCode: '&#128521;',
    cssCode: '\\1F609',
    shortcode: ':wink:',
    aliases: [':winking_face:'],
    tags: ['wink', 'flirt', 'playful']
  },

  // People & Body
  {
    id: 'thumbs-up',
    emoji: '👍',
    name: 'Thumbs Up',
    description: 'A hand with thumb pointing up',
    category: 'People & Body',
    subcategory: 'hand-fingers-closed',
    keywords: ['good', 'yes', 'approve', 'like'],
    unicode: 'U+1F44D',
    htmlCode: '&#128077;',
    cssCode: '\\1F44D',
    shortcode: ':thumbsup:',
    aliases: [':+1:', ':thumbs_up:'],
    skinTones: ['👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿'],
    tags: ['good', 'yes', 'approve', 'like', 'hand']
  },
  {
    id: 'thumbs-down',
    emoji: '👎',
    name: 'Thumbs Down',
    description: 'A hand with thumb pointing down',
    category: 'People & Body',
    subcategory: 'hand-fingers-closed',
    keywords: ['bad', 'no', 'disapprove', 'dislike'],
    unicode: 'U+1F44E',
    htmlCode: '&#128078;',
    cssCode: '\\1F44E',
    shortcode: ':thumbsdown:',
    aliases: [':-1:', ':thumbs_down:'],
    skinTones: ['👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿'],
    tags: ['bad', 'no', 'disapprove', 'dislike', 'hand']
  },
  {
    id: 'clapping',
    emoji: '👏',
    name: 'Clapping Hands',
    description: 'Two hands clapping together',
    category: 'People & Body',
    subcategory: 'hands',
    keywords: ['applause', 'clap', 'congratulations', 'well done'],
    unicode: 'U+1F44F',
    htmlCode: '&#128079;',
    cssCode: '\\1F44F',
    shortcode: ':clap:',
    aliases: [':clapping_hands:'],
    skinTones: ['👏🏻', '👏🏼', '👏🏽', '👏🏾', '👏🏿'],
    tags: ['applause', 'clap', 'congratulations', 'hands']
  },
  {
    id: 'peace',
    emoji: '✌️',
    name: 'Victory Hand',
    description: 'Hand with index and middle fingers up',
    category: 'People & Body',
    subcategory: 'hand-fingers-open',
    keywords: ['peace', 'victory', 'two', 'fingers'],
    unicode: 'U+270C U+FE0F',
    htmlCode: '&#9996;&#65039;',
    cssCode: '\\270C\\FE0F',
    shortcode: ':v:',
    aliases: [':victory_hand:', ':peace:'],
    skinTones: ['✌🏻', '✌🏼', '✌🏽', '✌🏾', '✌🏿'],
    tags: ['peace', 'victory', 'hand', 'fingers']
  },

  // Animals & Nature
  {
    id: 'dog-face',
    emoji: '🐶',
    name: 'Dog Face',
    description: 'A friendly dog face',
    category: 'Animals & Nature',
    subcategory: 'animal-mammal',
    keywords: ['dog', 'puppy', 'pet', 'animal'],
    unicode: 'U+1F436',
    htmlCode: '&#128054;',
    cssCode: '\\1F436',
    shortcode: ':dog:',
    aliases: [':dog_face:'],
    tags: ['dog', 'puppy', 'pet', 'animal']
  },
  {
    id: 'cat-face',
    emoji: '🐱',
    name: 'Cat Face',
    description: 'A cute cat face',
    category: 'Animals & Nature',
    subcategory: 'animal-mammal',
    keywords: ['cat', 'kitten', 'pet', 'animal'],
    unicode: 'U+1F431',
    htmlCode: '&#128049;',
    cssCode: '\\1F431',
    shortcode: ':cat:',
    aliases: [':cat_face:'],
    tags: ['cat', 'kitten', 'pet', 'animal']
  },
  {
    id: 'heart',
    emoji: '❤️',
    name: 'Red Heart',
    description: 'A classic red heart',
    category: 'Smileys & Emotion',
    subcategory: 'heart',
    keywords: ['love', 'heart', 'romance', 'red'],
    unicode: 'U+2764 U+FE0F',
    htmlCode: '&#10764;&#65039;',
    cssCode: '\\2764\\FE0F',
    shortcode: ':heart:',
    aliases: [':red_heart:'],
    tags: ['love', 'heart', 'romance', 'red']
  },
  {
    id: 'fire',
    emoji: '🔥',
    name: 'Fire',
    description: 'A flame of fire',
    category: 'Travel & Places',
    subcategory: 'sky-weather',
    keywords: ['fire', 'hot', 'flame', 'burn'],
    unicode: 'U+1F525',
    htmlCode: '&#128293;',
    cssCode: '\\1F525',
    shortcode: ':fire:',
    aliases: [':flame:'],
    tags: ['fire', 'hot', 'flame', 'burn']
  },

  // Objects
  {
    id: 'laptop',
    emoji: '💻',
    name: 'Laptop Computer',
    description: 'A laptop computer',
    category: 'Objects',
    subcategory: 'computer',
    keywords: ['computer', 'laptop', 'technology', 'work'],
    unicode: 'U+1F4BB',
    htmlCode: '&#128187;',
    cssCode: '\\1F4BB',
    shortcode: ':computer:',
    aliases: [':laptop:'],
    tags: ['computer', 'laptop', 'technology', 'work']
  },
  {
    id: 'phone',
    emoji: '📱',
    name: 'Mobile Phone',
    description: 'A mobile phone or smartphone',
    category: 'Objects',
    subcategory: 'phone',
    keywords: ['phone', 'mobile', 'smartphone', 'technology'],
    unicode: 'U+1F4F1',
    htmlCode: '&#128241;',
    cssCode: '\\1F4F1',
    shortcode: ':iphone:',
    aliases: [':mobile_phone:', ':phone:'],
    tags: ['phone', 'mobile', 'smartphone', 'technology']
  },

  // Symbols
  {
    id: 'check-mark',
    emoji: '✅',
    name: 'Check Mark Button',
    description: 'A green check mark in a box',
    category: 'Symbols',
    subcategory: 'other-symbol',
    keywords: ['check', 'done', 'yes', 'correct'],
    unicode: 'U+2705',
    htmlCode: '&#9989;',
    cssCode: '\\2705',
    shortcode: ':white_check_mark:',
    aliases: [':check_mark_button:', ':heavy_check_mark:'],
    tags: ['check', 'done', 'yes', 'correct']
  },
  {
    id: 'cross-mark',
    emoji: '❌',
    name: 'Cross Mark',
    description: 'A red X mark',
    category: 'Symbols',
    subcategory: 'other-symbol',
    keywords: ['x', 'wrong', 'no', 'incorrect'],
    unicode: 'U+274C',
    htmlCode: '&#10060;',
    cssCode: '\\274C',
    shortcode: ':x:',
    aliases: [':cross_mark:'],
    tags: ['x', 'wrong', 'no', 'incorrect']
  },

  // Flags
  {
    id: 'flag-us',
    emoji: '🇺🇸',
    name: 'Flag: United States',
    description: 'The flag of the United States',
    category: 'Flags',
    subcategory: 'country-flag',
    keywords: ['us', 'usa', 'america', 'flag'],
    unicode: 'U+1F1FA U+1F1F8',
    htmlCode: '&#127482;&#127480;',
    cssCode: '\\1F1FA\\1F1F8',
    shortcode: ':us:',
    aliases: [':flag_us:', ':united_states:'],
    tags: ['us', 'usa', 'america', 'flag', 'country']
  },
  {
    id: 'flag-gb',
    emoji: '🇬🇧',
    name: 'Flag: United Kingdom',
    description: 'The flag of the United Kingdom',
    category: 'Flags',
    subcategory: 'country-flag',
    keywords: ['uk', 'britain', 'england', 'flag'],
    unicode: 'U+1F1EC U+1F1E7',
    htmlCode: '&#127468;&#127463;',
    cssCode: '\\1F1EC\\1F1E7',
    shortcode: ':gb:',
    aliases: [':flag_gb:', ':uk:', ':united_kingdom:'],
    tags: ['uk', 'britain', 'england', 'flag', 'country']
  },

  // Food & Drink
  {
    id: 'pizza',
    emoji: '🍕',
    name: 'Pizza',
    description: 'A slice of pizza',
    category: 'Food & Drink',
    subcategory: 'food-prepared',
    keywords: ['pizza', 'food', 'italian', 'slice'],
    unicode: 'U+1F355',
    htmlCode: '&#127829;',
    cssCode: '\\1F355',
    shortcode: ':pizza:',
    aliases: [],
    tags: ['pizza', 'food', 'italian']
  },
  {
    id: 'coffee',
    emoji: '☕',
    name: 'Hot Beverage',
    description: 'A cup of coffee or tea',
    category: 'Food & Drink',
    subcategory: 'drink',
    keywords: ['coffee', 'tea', 'hot', 'drink'],
    unicode: 'U+2615',
    htmlCode: '&#9749;',
    cssCode: '\\2615',
    shortcode: ':coffee:',
    aliases: [':hot_beverage:'],
    tags: ['coffee', 'tea', 'hot', 'drink']
  }
];

const examples: ToolExample[] = [
  {
    title: 'Find Heart Emojis',
    input: 'heart',
    description: 'Search for all heart-related emojis with their codes'
  },
  {
    title: 'Search by Category',
    input: 'Animals',
    description: 'Filter emojis by category to find specific types'
  },
  {
    title: 'Copy Unicode Values',
    input: 'unicode',
    description: 'Find Unicode values for programmatic emoji usage'
  },
  {
    title: 'HTML Entity Codes',
    input: 'thumbs up',
    description: 'Get HTML entity codes for web development'
  }
];

export const EMOJI_REFERENCE_TOOL: Tool = {
  id: 'emoji-reference',
  name: 'Emoji Reference',
  slug: 'emoji-reference',
  description: 'Comprehensive emoji reference with Unicode values, HTML codes, CSS codes, and shortcodes for developers and content creators',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  examples,
  relatedTools: ['ascii-art-generator', 'text-case-converter', 'html-encoder-decoder'],
  tags: ['emoji', 'unicode', 'html', 'css', 'shortcodes', 'reference', 'symbols'],
  searchTerms: [
    'emoji',
    'unicode',
    'html codes',
    'css codes',
    'shortcodes',
    'symbols',
    'emoticons',
    'character reference',
    'emoji codes',
    'emoji unicode'
  ],
  faqs: [
    {
      question: 'What is the difference between Unicode and HTML codes?',
      answer: 'Unicode is the standard character encoding (e.g., U+1F600), while HTML codes are numeric entities for web pages (e.g., &#128512;). Both represent the same emoji but in different formats.'
    },
    {
      question: 'How do I use CSS codes for emojis?',
      answer: 'CSS codes use backslash notation (e.g., \\1F600) and are typically used in CSS ::before or ::after pseudo-elements with the content property.'
    },
    {
      question: 'What are emoji shortcodes?',
      answer: 'Shortcodes are text representations of emojis (e.g., :smile:) commonly used in messaging apps, GitHub, Slack, and Discord. They\'re converted to actual emojis by the platform.'
    },
    {
      question: 'Why do some emojis have skin tone variants?',
      answer: 'Unicode includes skin tone modifiers for human emojis to promote inclusivity. These use additional Unicode characters combined with the base emoji.'
    }
  ]
};

export function processEmojiData(query: string, filters: {
  category?: string;
  subcategory?: string;
  hasSkinTones?: boolean;
}): {
  results: EmojiData[];
  totalCount: number;
  categories: string[];
} {
  let filteredEmojis = EMOJI_DATA;

  // Apply filters
  if (filters.category) {
    filteredEmojis = filteredEmojis.filter(emoji => emoji.category === filters.category);
  }
  if (filters.subcategory) {
    filteredEmojis = filteredEmojis.filter(emoji => emoji.subcategory === filters.subcategory);
  }
  if (filters.hasSkinTones !== undefined) {
    filteredEmojis = filteredEmojis.filter(emoji =>
      filters.hasSkinTones ? emoji.skinTones && emoji.skinTones.length > 0 : !emoji.skinTones
    );
  }

  // Apply search query
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    filteredEmojis = filteredEmojis.filter(emoji =>
      emoji.name.toLowerCase().includes(searchTerm) ||
      emoji.description.toLowerCase().includes(searchTerm) ||
      emoji.shortcode.toLowerCase().includes(searchTerm) ||
      emoji.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
      emoji.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      emoji.aliases.some(alias => alias.toLowerCase().includes(searchTerm)) ||
      emoji.unicode.toLowerCase().includes(searchTerm)
    );
  }

  const categories = [...new Set(EMOJI_DATA.map(emoji => emoji.category))].sort();

  return {
    results: filteredEmojis,
    totalCount: filteredEmojis.length,
    categories
  };
}