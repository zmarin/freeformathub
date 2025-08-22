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
  description: 'Convert text between different cases: uppercase, lowercase, camelCase, PascalCase, snake_case, kebab-case, and more.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-transformation')!,
  slug: 'text-case-converter',
  icon: '🔤',
  keywords: ['text', 'case', 'convert', 'uppercase', 'lowercase', 'camelcase', 'pascalcase', 'snakecase', 'kebabcase', 'titlecase'],
  seoTitle: 'Free Text Case Converter Online - camelCase, snake_case, kebab-case',
  seoDescription: 'Convert text between different cases instantly. Free online case converter supporting camelCase, PascalCase, snake_case, kebab-case, UPPERCASE, and more. Privacy-first.',
  examples: [
    {
      title: 'camelCase Conversion',
      input: 'hello world example',
      output: 'helloWorldExample',
      description: 'Convert to camelCase for JavaScript variables'
    },
    {
      title: 'snake_case Conversion',
      input: 'Hello World Example',
      output: 'hello_world_example',
      description: 'Convert to snake_case for Python/database columns'
    },
    {
      title: 'kebab-case Conversion',
      input: 'Hello World Example',
      output: 'hello-world-example',
      description: 'Convert to kebab-case for URLs and CSS classes'
    },
    {
      title: 'Title Case Conversion',
      input: 'hello world example',
      output: 'Hello World Example',
      description: 'Convert to Title Case for headings'
    }
  ],
  useCases: [
    'Convert variable names between programming conventions',
    'Format text for different programming languages',
    'Create URL-friendly slugs from titles',
    'Generate database column names from descriptions',
    'Convert API field names between formats',
    'Format text for documentation and presentations'
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
      answer: 'Use camelCase for variables and functions (JavaScript, Java). Use PascalCase for classes, types, and components (C#, TypeScript React components).'
    },
    {
      question: 'What\'s the difference between snake_case and kebab-case?',
      answer: 'snake_case uses underscores (Python, databases) while kebab-case uses hyphens (URLs, CSS classes, HTML attributes).'
    },
    {
      question: 'Should I preserve acronyms when converting?',
      answer: 'It depends on your style guide. Some prefer "xmlHttpRequest" while others prefer "XMLHttpRequest". Enable "Preserve Acronyms" for the latter.'
    },
    {
      question: 'What is CONSTANT_CASE used for?',
      answer: 'CONSTANT_CASE (ALL_CAPS with underscores) is used for constants and environment variables in most programming languages.'
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