import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface HTMLEntityEncoderOptions {
  mode: 'named' | 'numeric' | 'hex' | 'smart';
  encodeAll: boolean;
  encodeSpaces: boolean;
  encodeQuotes: boolean;
  encodeAmpersands: boolean;
  useShortNames: boolean;
  preserveLineBreaks: boolean;
}

export interface HTMLEntityEncoderInput {
  text: string;
  options: HTMLEntityEncoderOptions;
}

export interface HTMLEntityEncoderResult extends ToolResult {
  encoded?: string;
  originalLength?: number;
  encodedLength?: number;
  entitiesCount?: number;
  encodingRatio?: number;
  usedEntities?: Record<string, number>;
}

export function processHTMLEntityEncoder(input: HTMLEntityEncoderInput): HTMLEntityEncoderResult {
  try {
    const { text, options } = input;

    if (!text) {
      return {
        success: true,
        encoded: '',
        originalLength: 0,
        encodedLength: 0,
        entitiesCount: 0,
        encodingRatio: 0,
        usedEntities: {}
      };
    }

    const originalLength = text.length;
    let encoded = text;
    const usedEntities: Record<string, number> = {};

    switch (options.mode) {
      case 'named':
        encoded = encodeWithNamedEntities(text, options, usedEntities);
        break;
      case 'numeric':
        encoded = encodeWithNumericEntities(text, options, usedEntities);
        break;
      case 'hex':
        encoded = encodeWithHexEntities(text, options, usedEntities);
        break;
      case 'smart':
        encoded = encodeWithSmartMode(text, options, usedEntities);
        break;
    }

    const encodedLength = encoded.length;
    const entitiesCount = Object.values(usedEntities).reduce((sum, count) => sum + count, 0);
    const encodingRatio = originalLength > 0 ? ((encodedLength - originalLength) / originalLength) * 100 : 0;

    return {
      success: true,
      encoded,
      originalLength,
      encodedLength,
      entitiesCount,
      encodingRatio: Math.round(encodingRatio * 100) / 100,
      usedEntities
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Encoding failed'
    };
  }
}

function encodeWithNamedEntities(text: string, options: HTMLEntityEncoderOptions, usedEntities: Record<string, number>): string {
  let encoded = text;

  // Essential HTML characters (always encode if encodeAll is false)
  if (options.encodeAmpersands || options.encodeAll) {
    encoded = encoded.replace(/&/g, '&amp;');
    incrementUsedEntity(usedEntities, '&amp;', (text.match(/&/g) || []).length);
  }

  encoded = encoded.replace(/</g, '&lt;');
  incrementUsedEntity(usedEntities, '&lt;', (text.match(/</g) || []).length);

  encoded = encoded.replace(/>/g, '&gt;');
  incrementUsedEntity(usedEntities, '&gt;', (text.match(/>/g) || []).length);

  if (options.encodeQuotes || options.encodeAll) {
    encoded = encoded.replace(/"/g, '&quot;');
    incrementUsedEntity(usedEntities, '&quot;', (text.match(/"/g) || []).length);

    encoded = encoded.replace(/'/g, '&#39;');
    incrementUsedEntity(usedEntities, '&#39;', (text.match(/'/g) || []).length);
  }

  if (options.encodeSpaces) {
    encoded = encoded.replace(/ /g, '&nbsp;');
    incrementUsedEntity(usedEntities, '&nbsp;', (text.match(/ /g) || []).length);
  }

  if (options.encodeAll) {
    // Extended named entities
    const namedEntities: Record<string, string> = {
      '©': '&copy;',
      '®': '&reg;',
      '™': '&trade;',
      '…': '&hellip;',
      '—': '&mdash;',
      '–': '&ndash;',
      '\u2018': '&lsquo;',
      '\u2019': '&rsquo;',
      '\u201C': '&ldquo;',
      '\u201D': '&rdquo;',
      '•': '&bull;',
      '·': '&middot;',
      '°': '&deg;',
      '±': '&plusmn;',
      '×': '&times;',
      '÷': '&divide;',
      '¡': '&iexcl;',
      '¿': '&iquest;',
      '¢': '&cent;',
      '£': '&pound;',
      '¥': '&yen;',
      '€': '&euro;',
      '¤': '&curren;',
      '§': '&sect;',
      '¶': '&para;',
      'α': '&alpha;',
      'β': '&beta;',
      'γ': '&gamma;',
      'δ': '&delta;',
      'ε': '&epsilon;',
      'π': '&pi;',
      'σ': '&sigma;',
      'τ': '&tau;',
      'φ': '&phi;',
      'χ': '&chi;',
      'ψ': '&psi;',
      'ω': '&omega;'
    };

    for (const [char, entity] of Object.entries(namedEntities)) {
      if (encoded.includes(char)) {
        const count = (encoded.match(new RegExp(escapeRegExp(char), 'g')) || []).length;
        encoded = encoded.replace(new RegExp(escapeRegExp(char), 'g'), entity);
        incrementUsedEntity(usedEntities, entity, count);
      }
    }

    // Encode any remaining non-ASCII characters as numeric entities
    encoded = encoded.replace(/[^\x00-\x7F]/g, (char) => {
      const entity = `&#${char.charCodeAt(0)};`;
      incrementUsedEntity(usedEntities, entity, 1);
      return entity;
    });
  }

  if (!options.preserveLineBreaks) {
    encoded = encoded.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  return encoded;
}

function encodeWithNumericEntities(text: string, options: HTMLEntityEncoderOptions, usedEntities: Record<string, number>): string {
  let encoded = text;

  // Always encode essential HTML characters
  encoded = encoded.replace(/&/g, '&#38;');
  incrementUsedEntity(usedEntities, '&#38;', (text.match(/&/g) || []).length);

  encoded = encoded.replace(/</g, '&#60;');
  incrementUsedEntity(usedEntities, '&#60;', (text.match(/</g) || []).length);

  encoded = encoded.replace(/>/g, '&#62;');
  incrementUsedEntity(usedEntities, '&#62;', (text.match(/>/g) || []).length);

  if (options.encodeQuotes || options.encodeAll) {
    encoded = encoded.replace(/"/g, '&#34;');
    incrementUsedEntity(usedEntities, '&#34;', (text.match(/"/g) || []).length);

    encoded = encoded.replace(/'/g, '&#39;');
    incrementUsedEntity(usedEntities, '&#39;', (text.match(/'/g) || []).length);
  }

  if (options.encodeSpaces) {
    encoded = encoded.replace(/ /g, '&#32;');
    incrementUsedEntity(usedEntities, '&#32;', (text.match(/ /g) || []).length);
  }

  if (options.encodeAll) {
    // Encode all non-ASCII characters
    encoded = encoded.replace(/[^\x00-\x7F]/g, (char) => {
      const entity = `&#${char.charCodeAt(0)};`;
      incrementUsedEntity(usedEntities, entity, 1);
      return entity;
    });
  }

  return encoded;
}

function encodeWithHexEntities(text: string, options: HTMLEntityEncoderOptions, usedEntities: Record<string, number>): string {
  let encoded = text;

  // Always encode essential HTML characters
  encoded = encoded.replace(/&/g, '&#x26;');
  incrementUsedEntity(usedEntities, '&#x26;', (text.match(/&/g) || []).length);

  encoded = encoded.replace(/</g, '&#x3C;');
  incrementUsedEntity(usedEntities, '&#x3C;', (text.match(/</g) || []).length);

  encoded = encoded.replace(/>/g, '&#x3E;');
  incrementUsedEntity(usedEntities, '&#x3E;', (text.match(/>/g) || []).length);

  if (options.encodeQuotes || options.encodeAll) {
    encoded = encoded.replace(/"/g, '&#x22;');
    incrementUsedEntity(usedEntities, '&#x22;', (text.match(/"/g) || []).length);

    encoded = encoded.replace(/'/g, '&#x27;');
    incrementUsedEntity(usedEntities, '&#x27;', (text.match(/'/g) || []).length);
  }

  if (options.encodeSpaces) {
    encoded = encoded.replace(/ /g, '&#x20;');
    incrementUsedEntity(usedEntities, '&#x20;', (text.match(/ /g) || []).length);
  }

  if (options.encodeAll) {
    // Encode all non-ASCII characters
    encoded = encoded.replace(/[^\x00-\x7F]/g, (char) => {
      const hex = char.charCodeAt(0).toString(16).toUpperCase();
      const entity = `&#x${hex};`;
      incrementUsedEntity(usedEntities, entity, 1);
      return entity;
    });
  }

  return encoded;
}

function encodeWithSmartMode(text: string, options: HTMLEntityEncoderOptions, usedEntities: Record<string, number>): string {
  let encoded = text;

  // Essential HTML characters - always encode
  encoded = encoded.replace(/&/g, '&amp;');
  incrementUsedEntity(usedEntities, '&amp;', (text.match(/&/g) || []).length);

  encoded = encoded.replace(/</g, '&lt;');
  incrementUsedEntity(usedEntities, '&lt;', (text.match(/</g) || []).length);

  encoded = encoded.replace(/>/g, '&gt;');
  incrementUsedEntity(usedEntities, '&gt;', (text.match(/>/g) || []).length);

  if (options.encodeQuotes || options.encodeAll) {
    encoded = encoded.replace(/"/g, '&quot;');
    incrementUsedEntity(usedEntities, '&quot;', (text.match(/"/g) || []).length);

    encoded = encoded.replace(/'/g, '&#39;');
    incrementUsedEntity(usedEntities, '&#39;', (text.match(/'/g) || []).length);
  }

  if (options.encodeSpaces) {
    encoded = encoded.replace(/ /g, '&nbsp;');
    incrementUsedEntity(usedEntities, '&nbsp;', (text.match(/ /g) || []).length);
  }

  // Smart encoding: use named entities for common characters, numeric for others
  const commonNamedEntities: Record<string, string> = {
    '©': '&copy;',
    '®': '&reg;',
    '™': '&trade;',
    '…': '&hellip;',
    '—': '&mdash;',
    '–': '&ndash;',
    '°': '&deg;',
    '±': '&plusmn;',
    '×': '&times;',
    '÷': '&divide;',
    '€': '&euro;',
    '£': '&pound;',
    '¥': '&yen;',
    '¢': '&cent;'
  };

  for (const [char, entity] of Object.entries(commonNamedEntities)) {
    if (encoded.includes(char)) {
      const count = (encoded.match(new RegExp(escapeRegExp(char), 'g')) || []).length;
      encoded = encoded.replace(new RegExp(escapeRegExp(char), 'g'), entity);
      incrementUsedEntity(usedEntities, entity, count);
    }
  }

  if (options.encodeAll) {
    // Encode remaining non-ASCII characters as numeric entities
    encoded = encoded.replace(/[^\x00-\x7F]/g, (char) => {
      // Skip characters already encoded as named entities
      if (Object.keys(commonNamedEntities).includes(char)) {
        return char;
      }
      const entity = `&#${char.charCodeAt(0)};`;
      incrementUsedEntity(usedEntities, entity, 1);
      return entity;
    });
  }

  return encoded;
}

function incrementUsedEntity(usedEntities: Record<string, number>, entity: string, count: number): void {
  if (count > 0) {
    usedEntities[entity] = (usedEntities[entity] || 0) + count;
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const HTML_ENTITY_ENCODER_TOOL: Tool = {
  id: 'html-entity-encoder',
  name: 'HTML Entity Encoder',
  description: 'Encode text to HTML entities using named, numeric, hexadecimal, or smart encoding modes',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'url-encoding')!,
  slug: 'html-entity-encoder',
  icon: 'Code2',
  tags: ['html', 'entity', 'encode', 'escape', 'xss', 'security'],
  complexity: 'beginner',
  keywords: ['html', 'entity', 'encode', 'escape', 'special', 'characters', 'web', 'security', 'xss'],
  
  examples: [
    {
      title: 'Basic HTML Entity Encoding',
      input: 'Copyright © 2024 & Company',
      output: 'Copyright &copy; 2024 &amp; Company',
      description: 'Encode special characters for safe HTML display'
    },
    {
      title: 'HTML Tag Escaping',
      input: '<script>alert("XSS")</script>',
      output: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      description: 'Prevent XSS attacks by encoding HTML tags'
    },
    {
      title: 'Mixed Content Encoding',
      input: '"Price: €29.99" & free shipping!',
      output: '&quot;Price: &euro;29.99&quot; &amp; free shipping!',
      description: 'Encode quotes, currency symbols, and ampersands'
    }
  ],
  
  useCases: [
    'Prepare text for safe HTML display by encoding special characters',
    'Prevent XSS attacks by encoding user input',
    'Encode copyright symbols, trademarks, and special characters',
    'Convert Unicode characters to HTML-safe entities',
    'Prepare content for XML and SGML documents',
    'Encode quotes and ampersands for HTML attributes',
    'Convert text for email HTML templates'
  ],
  
  faq: [
    {
      question: 'What encoding modes are available?',
      answer: 'Named entities (&copy;), numeric entities (&#169;), hexadecimal entities (&#xA9;), and smart mode (mixed approach).'
    },
    {
      question: 'When should I use each encoding mode?',
      answer: 'Named entities are most readable, numeric/hex for maximum compatibility, smart mode for optimal balance of readability and compatibility.'
    },
    {
      question: 'Are essential HTML characters always encoded?',
      answer: 'Yes, <, >, and & are always encoded as they have special meaning in HTML. Quotes can be optionally encoded.'
    },
    {
      question: 'What is the difference from HTML Entity Decoder?',
      answer: 'This tool encodes (converts characters to entities), while the decoder converts entities back to characters.'
    }
  ],
  
  commonErrors: [
    'Encoding already encoded text',
    'Missing entity names or codes',
    'Incorrect encoding mode selection'
  ],
  
  relatedTools: ['html-entity-decoder', 'string-escape', 'url-encoder'],
  seoTitle: 'HTML Entity Encoder - Free HTML Character Encoder',
  seoDescription: 'Encode HTML entities and special characters for safe web display. Prevent XSS attacks and ensure proper HTML rendering.'
};