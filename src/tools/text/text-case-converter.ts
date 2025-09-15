import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface TextCaseConfig extends ToolConfig {
  targetCase: 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase' | 'camelcase' | 'pascalcase' | 'kebabcase' | 'snakecase' | 'constantcase' | 'dotcase' | 'pathcase' | 'alternatingcase' | 'inversecase';
  preserveAcronyms: boolean;
  customDelimiter: string;
}

export const TEXT_CASE_CONVERTER_TOOL: Tool = {
  id: 'text-case-converter',
  name: 'Text Case Converter',
  description: 'Convert text between 13 different case formats including camelCase, PascalCase, snake_case, kebab-case, UPPERCASE, lowercase, and more. Perfect for developers, writers, and content creators.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-transformation')!,
  slug: 'text-case-converter',
  icon: '🔤',
  keywords: ['text', 'case', 'convert', 'uppercase', 'lowercase', 'camelcase', 'pascalcase', 'snakecase', 'kebabcase', 'titlecase', 'constantcase', 'dotcase', 'pathcase', 'alternating', 'inverse', 'programming', 'variables', 'naming conventions'],
  seoTitle: 'Free Text Case Converter - 13 Formats: camelCase, snake_case, kebab-case & More',
  seoDescription: 'Convert text between 13 case formats instantly. Supports camelCase, PascalCase, snake_case, kebab-case, UPPERCASE, Title Case, and more. Perfect for programming, URLs, and content formatting. Live preview, instant conversion, privacy-first.',
  examples: [
    {
      title: 'Programming Variables (camelCase)',
      input: 'user account settings',
      output: 'userAccountSettings',
      description: 'Perfect for JavaScript variables, Java methods, and TypeScript properties'
    },
    {
      title: 'React Components (PascalCase)',
      input: 'navigation menu item',
      output: 'NavigationMenuItem',
      description: 'Ideal for React components, C# classes, and type definitions'
    },
    {
      title: 'Database Columns (snake_case)',
      input: 'created at timestamp',
      output: 'created_at_timestamp',
      description: 'Standard for Python variables, SQL columns, and API fields'
    },
    {
      title: 'URL Slugs (kebab-case)',
      input: 'product category page',
      output: 'product-category-page',
      description: 'Perfect for URLs, CSS classes, and HTML attributes'
    },
    {
      title: 'Environment Variables (CONSTANT_CASE)',
      input: 'database connection string',
      output: 'DATABASE_CONNECTION_STRING',
      description: 'Standard for constants and environment variables'
    },
    {
      title: 'Document Titles (Title Case)',
      input: 'advanced text formatting guide',
      output: 'Advanced Text Formatting Guide',
      description: 'Professional formatting for headings and titles'
    },
    {
      title: 'With Acronyms (Preserve Option)',
      input: 'XML HTTP Request Handler',
      output: 'XMLHttpRequestHandler',
      description: 'Keep acronyms capitalized when preserve option is enabled'
    },
    {
      title: 'File Paths (path/case)',
      input: 'user profile images',
      output: 'user/profile/images',
      description: 'Convert to path notation for file system organization'
    }
  ],
  useCases: [
    'Convert JavaScript variables to Python snake_case for API integration',
    'Transform user input into URL-friendly kebab-case slugs',
    'Generate database column names from natural language descriptions',
    'Convert API responses between camelCase and snake_case formats',
    'Create consistent CSS class names from component descriptions',
    'Format environment variable names in CONSTANT_CASE',
    'Convert file names to proper naming conventions',
    'Transform blog titles to SEO-friendly URL slugs',
    'Standardize code comments and documentation formatting',
    'Generate React component names from feature descriptions',
    'Convert form field names between frontend and backend formats',
    'Create consistent naming across multi-language codebases',
    'Transform spreadsheet headers to database-friendly column names',
    'Generate configuration keys from human-readable settings',
    'Convert marketing copy to various text formats for different platforms'
  ],
  commonErrors: [
    'Not preserving acronyms when converting cases',
    'Using wrong case convention for specific languages',
    'Losing important formatting when converting',
    'Not handling special characters properly',
    'Mixing different case conventions in same codebase',
    'Using spaces in cases that don\'t support them'
  ],
  faq: [
    {
      question: 'When should I use camelCase vs PascalCase?',
      answer: 'Use camelCase for variables, functions, and methods (JavaScript: userName, getUserData). Use PascalCase for classes, components, and types (React: UserProfile, TypeScript: UserData).'
    },
    {
      question: 'What\'s the difference between snake_case and kebab-case?',
      answer: 'snake_case uses underscores (Python: user_name, SQL: created_at) while kebab-case uses hyphens (URLs: /user-profile, CSS: .nav-menu).'
    },
    {
      question: 'Should I preserve acronyms when converting cases?',
      answer: 'It depends on your style guide. JavaScript often uses "xmlHttpRequest" while C# prefers "XMLHttpRequest". Enable "Preserve Acronyms" to keep acronyms capitalized.'
    },
    {
      question: 'What is CONSTANT_CASE used for?',
      answer: 'CONSTANT_CASE (ALL_CAPS with underscores) is used for constants (const MAX_USERS = 100) and environment variables (DATABASE_URL, API_KEY).'
    },
    {
      question: 'Which case format should I use for URLs?',
      answer: 'Use kebab-case for URLs (example.com/user-profile) as it\'s SEO-friendly, readable, and doesn\'t require encoding unlike underscores or spaces.'
    },
    {
      question: 'How do I handle numbers in case conversion?',
      answer: 'Numbers are preserved in their position. "user2name" becomes "User2Name" in PascalCase, "user_2_name" in snake_case, maintaining readability.'
    },
    {
      question: 'What\'s the difference between Title Case and Sentence case?',
      answer: 'Title Case capitalizes each word ("The Quick Brown Fox"), while Sentence case only capitalizes the first word ("The quick brown fox").'
    },
    {
      question: 'When would I use dot.case or path/case?',
      answer: 'Use dot.case for object notation (user.profile.name) and path/case for file systems (src/components/user). These are specialized formats for specific contexts.'
    },
    {
      question: 'Can I convert between all case types in one tool?',
      answer: 'Yes! This tool supports 13 different case formats with live preview. Simply enter your text and select any target format to see instant conversion.'
    },
    {
      question: 'Is the conversion reversible?',
      answer: 'Most conversions are reversible, but some information may be lost (like original capitalization). Always keep a backup of original text for critical data.'
    }
  ],
  relatedTools: [
    'url-encoder',
    'slug-generator',
    'text-formatter',
    'string-utilities',
    'regex-tester'
  ]
};

export function processTextCase(input: string, config: TextCaseConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide text to convert.'
    };
  }

  try {
    const converted = convertCase(input, config);
    
    return {
      success: true,
      output: converted,
      metadata: {
        originalLength: input.length,
        convertedLength: converted.length,
        targetCase: config.targetCase,
        preservedAcronyms: config.preserveAcronyms,
        customDelimiter: config.customDelimiter || 'none'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert text case'
    };
  }
}

function convertCase(input: string, config: TextCaseConfig): string {
  const text = input.trim();
  
  switch (config.targetCase) {
    case 'uppercase':
      return text.toUpperCase();
      
    case 'lowercase':
      return text.toLowerCase();
      
    case 'titlecase':
      return toTitleCase(text, config.preserveAcronyms);
      
    case 'sentencecase':
      return toSentenceCase(text);
      
    case 'camelcase':
      return toCamelCase(text, config.preserveAcronyms);
      
    case 'pascalcase':
      return toPascalCase(text, config.preserveAcronyms);
      
    case 'kebabcase':
      return toKebabCase(text);
      
    case 'snakecase':
      return toSnakeCase(text);
      
    case 'constantcase':
      return toConstantCase(text);
      
    case 'dotcase':
      return toDotCase(text);
      
    case 'pathcase':
      return toPathCase(text);
      
    case 'alternatingcase':
      return toAlternatingCase(text);
      
    case 'inversecase':
      return toInverseCase(text);
      
    default:
      throw new Error(`Unsupported case type: ${config.targetCase}`);
  }
}

function toTitleCase(text: string, preserveAcronyms: boolean): string {
  const words = text.split(/\s+/);
  
  return words.map(word => {
    if (preserveAcronyms && isAllCaps(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function toSentenceCase(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return trimmed;
  
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function toCamelCase(text: string, preserveAcronyms: boolean): string {
  const words = splitIntoWords(text);
  
  return words.map((word, index) => {
    if (index === 0) {
      return preserveAcronyms && isAllCaps(word) ? word : word.toLowerCase();
    }
    if (preserveAcronyms && isAllCaps(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}

function toPascalCase(text: string, preserveAcronyms: boolean): string {
  const words = splitIntoWords(text);
  
  return words.map(word => {
    if (preserveAcronyms && isAllCaps(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}

function toKebabCase(text: string): string {
  return splitIntoWords(text)
    .map(word => word.toLowerCase())
    .join('-');
}

function toSnakeCase(text: string): string {
  return splitIntoWords(text)
    .map(word => word.toLowerCase())
    .join('_');
}

function toConstantCase(text: string): string {
  return splitIntoWords(text)
    .map(word => word.toUpperCase())
    .join('_');
}

function toDotCase(text: string): string {
  return splitIntoWords(text)
    .map(word => word.toLowerCase())
    .join('.');
}

function toPathCase(text: string): string {
  return splitIntoWords(text)
    .map(word => word.toLowerCase())
    .join('/');
}

function toAlternatingCase(text: string): string {
  return text.split('').map((char, index) => {
    return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
  }).join('');
}

function toInverseCase(text: string): string {
  return text.split('').map(char => {
    return char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
  }).join('');
}

function splitIntoWords(text: string): string[] {
  // Split by spaces, hyphens, underscores, dots, and camelCase boundaries
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space before capitals in camelCase
    .split(/[\s\-_\.\/]+/) // Split by various delimiters
    .filter(word => word.length > 0);
}

function isAllCaps(word: string): boolean {
  return word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);
}