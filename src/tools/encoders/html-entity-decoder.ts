import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface HtmlEntityDecoderConfig {
  decodeNamed: boolean;
  decodeNumeric: boolean;
  decodeHex: boolean;
  strictMode: boolean;
  preserveUnknown: boolean;
  validateHtml: boolean;
  outputFormat: 'text' | 'html' | 'escaped';
  maxLength: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  decoding?: DecodingResult;
  warnings?: string[];
}

interface DecodingResult {
  originalText: string;
  decodedText: string;
  entitiesFound: EntityMatch[];
  totalEntities: number;
  namedEntities: number;
  numericEntities: number;
  hexEntities: number;
  unknownEntities: string[];
  decodingStats: DecodingStats;
}

interface EntityMatch {
  entity: string;
  decoded: string;
  type: 'named' | 'numeric' | 'hex' | 'unknown';
  position: number;
  length: number;
}

interface DecodingStats {
  charactersProcessed: number;
  entitiesDecoded: number;
  entitiesSkipped: number;
  decodingRate: number;
  hasInvalidEntities: boolean;
}

// HTML entity mapping for named entities
const HTML_ENTITIES: Record<string, string> = {
  // Basic HTML entities
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': "'",
  
  // Common named entities
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&bull;': '•',
  '&middot;': '·',
  '&deg;': '°',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&frac12;': '½',
  '&frac14;': '¼',
  '&frac34;': '¾',
  '&cent;': '¢',
  '&pound;': '£',
  '&euro;': '€',
  '&yen;': '¥',
  '&sect;': '§',
  '&para;': '¶',
  '&dagger;': '†',
  '&Dagger;': '‡',
  '&permil;': '‰',
  '&lsaquo;': '‹',
  '&rsaquo;': '›',
  '&laquo;': '«',
  '&raquo;': '»',
  
  // Mathematical symbols
  '&alpha;': 'α',
  '&beta;': 'β',
  '&gamma;': 'γ',
  '&delta;': 'δ',
  '&epsilon;': 'ε',
  '&theta;': 'θ',
  '&lambda;': 'λ',
  '&mu;': 'μ',
  '&pi;': 'π',
  '&sigma;': 'σ',
  '&tau;': 'τ',
  '&phi;': 'φ',
  '&omega;': 'ω',
  '&infin;': '∞',
  '&sum;': '∑',
  '&prod;': '∏',
  '&int;': '∫',
  '&radic;': '√',
  '&prop;': '∝',
  '&part;': '∂',
  '&exist;': '∃',
  '&empty;': '∅',
  '&isin;': '∈',
  '&notin;': '∉',
  '&cap;': '∩',
  '&cup;': '∪',
  '&sub;': '⊂',
  '&sup;': '⊃',
  '&sube;': '⊆',
  '&supe;': '⊇',
  
  // Arrows
  '&larr;': '←',
  '&uarr;': '↑',
  '&rarr;': '→',
  '&darr;': '↓',
  '&harr;': '↔',
  '&lArr;': '⇐',
  '&uArr;': '⇑',
  '&rArr;': '⇒',
  '&dArr;': '⇓',
  '&hArr;': '⇔',
  
  // Card suits and symbols
  '&spades;': '♠',
  '&clubs;': '♣',
  '&hearts;': '♥',
  '&diams;': '♦',
};

function findHtmlEntities(text: string, config: HtmlEntityDecoderConfig): EntityMatch[] {
  const entities: EntityMatch[] = [];
  const entityRegex = /&([a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#[xX][0-9a-fA-F]+);/g;
  let match;

  while ((match = entityRegex.exec(text)) !== null) {
    const fullEntity = match[0];
    const entityContent = match[1];
    const position = match.index;

    let decoded = '';
    let type: EntityMatch['type'] = 'unknown';

    // Named entities
    if (config.decodeNamed && /^[a-zA-Z]/.test(entityContent)) {
      if (HTML_ENTITIES[fullEntity]) {
        decoded = HTML_ENTITIES[fullEntity];
        type = 'named';
      } else {
        type = 'unknown';
      }
    }
    
    // Numeric entities
    else if (config.decodeNumeric && /^#[0-9]+$/.test(entityContent)) {
      const charCode = parseInt(entityContent.substring(1), 10);
      if (charCode >= 0 && charCode <= 0x10FFFF) {
        try {
          decoded = String.fromCodePoint(charCode);
          type = 'numeric';
        } catch (e) {
          type = 'unknown';
        }
      } else {
        type = 'unknown';
      }
    }
    
    // Hexadecimal entities
    else if (config.decodeHex && /^#[xX][0-9a-fA-F]+$/.test(entityContent)) {
      const charCode = parseInt(entityContent.substring(2), 16);
      if (charCode >= 0 && charCode <= 0x10FFFF) {
        try {
          decoded = String.fromCodePoint(charCode);
          type = 'hex';
        } catch (e) {
          type = 'unknown';
        }
      } else {
        type = 'unknown';
      }
    }

    entities.push({
      entity: fullEntity,
      decoded: decoded || fullEntity,
      type,
      position,
      length: fullEntity.length
    });
  }

  return entities;
}

function decodeHtmlEntities(text: string, entities: EntityMatch[], config: HtmlEntityDecoderConfig): string {
  let result = text;
  const unknownEntities: string[] = [];

  // Process entities in reverse order to maintain position indices
  entities.reverse().forEach(entity => {
    if (entity.type !== 'unknown' || !config.preserveUnknown) {
      const replacement = entity.type === 'unknown' ? 
        (config.preserveUnknown ? entity.entity : '') : 
        entity.decoded;
      
      result = result.substring(0, entity.position) + 
               replacement + 
               result.substring(entity.position + entity.length);
    }

    if (entity.type === 'unknown') {
      unknownEntities.push(entity.entity);
    }
  });

  return result;
}

function validateHtmlStructure(text: string): string[] {
  const issues: string[] = [];
  
  // Check for unmatched angle brackets
  const openBrackets = (text.match(/</g) || []).length;
  const closeBrackets = (text.match(/>/g) || []).length;
  
  if (openBrackets !== closeBrackets) {
    issues.push('Unmatched angle brackets detected');
  }

  // Check for potential XSS patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<embed\b/gi,
    /<object\b/gi
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      issues.push('Potentially dangerous content detected');
    }
  });

  return issues;
}

function formatOutput(text: string, format: string): string {
  switch (format) {
    case 'html':
      // Escape HTML for display
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    case 'escaped':
      // JavaScript-style escaping
      return text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    
    case 'text':
    default:
      return text;
  }
}

export function processHtmlEntityDecoder(input: string, config: HtmlEntityDecoderConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'HTML content is required'
      };
    }

    const warnings: string[] = [];
    const originalText = input.trim();

    // Check length limit
    if (config.maxLength > 0 && originalText.length > config.maxLength) {
      return {
        success: false,
        error: `Input exceeds maximum length of ${config.maxLength} characters`
      };
    }

    // Find HTML entities
    const entities = findHtmlEntities(originalText, config);
    
    // Decode entities
    const decodedText = decodeHtmlEntities(originalText, [...entities], config);
    
    // Count entity types
    const namedEntities = entities.filter(e => e.type === 'named').length;
    const numericEntities = entities.filter(e => e.type === 'numeric').length;
    const hexEntities = entities.filter(e => e.type === 'hex').length;
    const unknownEntities = entities.filter(e => e.type === 'unknown').map(e => e.entity);
    
    // Calculate stats
    const totalEntities = entities.length;
    const entitiesDecoded = entities.filter(e => e.type !== 'unknown').length;
    const entitiesSkipped = unknownEntities.length;
    const decodingRate = totalEntities > 0 ? Math.round((entitiesDecoded / totalEntities) * 100) : 100;

    // Validate HTML structure if enabled
    let htmlValidationIssues: string[] = [];
    if (config.validateHtml) {
      htmlValidationIssues = validateHtmlStructure(decodedText);
      if (htmlValidationIssues.length > 0) {
        warnings.push(...htmlValidationIssues);
      }
    }

    // Create decoding result
    const decoding: DecodingResult = {
      originalText,
      decodedText,
      entitiesFound: entities,
      totalEntities,
      namedEntities,
      numericEntities,
      hexEntities,
      unknownEntities: Array.from(new Set(unknownEntities)),
      decodingStats: {
        charactersProcessed: originalText.length,
        entitiesDecoded,
        entitiesSkipped,
        decodingRate,
        hasInvalidEntities: unknownEntities.length > 0
      }
    };

    // Format output
    const formattedOutput = formatOutput(decodedText, config.outputFormat);

    // Generate output text
    let output = `HTML Entity Decoding Result\n`;
    output += `${'='.repeat(35)}\n\n`;
    
    output += `Decoding Summary:\n`;
    output += `• Total Entities Found: ${totalEntities}\n`;
    output += `• Successfully Decoded: ${entitiesDecoded}\n`;
    output += `• Decoding Rate: ${decodingRate}%\n\n`;
    
    if (totalEntities > 0) {
      output += `Entity Breakdown:\n`;
      output += `• Named Entities: ${namedEntities}\n`;
      output += `• Numeric Entities: ${numericEntities}\n`;
      output += `• Hexadecimal Entities: ${hexEntities}\n`;
      if (unknownEntities.length > 0) {
        output += `• Unknown Entities: ${unknownEntities.length}\n`;
      }
      output += `\n`;
    }

    if (entities.length > 0) {
      output += `Decoded Entities:\n`;
      entities.slice(0, 20).forEach(entity => {
        const status = entity.type === 'unknown' ? '❌' : '✅';
        output += `• ${status} ${entity.entity} → ${entity.decoded}\n`;
      });
      if (entities.length > 20) {
        output += `... and ${entities.length - 20} more entities\n`;
      }
      output += `\n`;
    }

    output += `Decoded Text:\n`;
    output += `${'-'.repeat(20)}\n`;
    output += `${formattedOutput}\n`;

    // Add warnings
    if (unknownEntities.length > 0 && config.strictMode) {
      warnings.push(`${unknownEntities.length} unknown entities found in strict mode`);
    }

    if (unknownEntities.length > 0) {
      warnings.push('Some HTML entities could not be decoded');
    }

    if (htmlValidationIssues.length > 0) {
      warnings.push('HTML structure validation issues detected');
    }

    return {
      success: true,
      output,
      decoding,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const HTML_ENTITY_DECODER_TOOL: Tool = {
  id: 'html-entity-decoder',
  name: 'HTML Entity Decoder',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'url-encoding')!,
  slug: 'html-entity-decoder',
  icon: '🔓',
  keywords: ['html', 'entity', 'decode', 'unescape', 'characters', 'symbols', 'unicode', 'convert'],
  seoTitle: 'HTML Entity Decoder - Convert HTML Entities to Text | FreeFormatHub',
  seoDescription: 'Decode HTML entities to readable text. Convert named, numeric, and hexadecimal HTML entities with validation and formatting options.',
  description: 'Decode HTML entities into readable text characters, supporting named entities, numeric codes, and hexadecimal values with comprehensive validation.',

  examples: [
    {
      title: 'Basic HTML Entities',
      input: '&lt;div&gt;Hello &amp; welcome to our &quot;website&quot;!&lt;/div&gt;',
      output: `HTML Entity Decoding Result
===================================

Decoding Summary:
• Total Entities Found: 5
• Successfully Decoded: 5
• Decoding Rate: 100%

Entity Breakdown:
• Named Entities: 5
• Numeric Entities: 0
• Hexadecimal Entities: 0

Decoded Text:
--------------------
<div>Hello & welcome to our "website"!</div>`,
      description: 'Decode common HTML entities like &lt;, &gt;, &amp;, and &quot;'
    },
    {
      title: 'Numeric and Hex Entities',
      input: 'Temperature: 25&#176;C or 77&#x2109;F &#8211; Perfect weather!',
      output: `Decoding Summary:
• Total Entities Found: 3
• Successfully Decoded: 3
• Decoding Rate: 100%

Entity Breakdown:
• Named Entities: 0
• Numeric Entities: 2
• Hexadecimal Entities: 1

Decoded Text:
--------------------
Temperature: 25°C or 77℉F – Perfect weather!`,
      description: 'Decode numeric (&#176;) and hexadecimal (&#x2109;) entities'
    },
    {
      title: 'Mixed Entity Types',
      input: 'Price: &euro;99 &nbsp;&bull;&nbsp; Rating: &#9733;&#9733;&#9733;&#9734;&#9734; &copy;2024',
      output: `Entity Breakdown:
• Named Entities: 4
• Numeric Entities: 5
• Hexadecimal Entities: 0

Decoded Text:
--------------------
Price: €99  •  Rating: ★★★☆☆ ©2024`,
      description: 'Decode a mix of named and numeric HTML entities'
    }
  ],

  useCases: [
    'Converting HTML-encoded content to readable text',
    'Processing scraped web content with encoded entities',
    'Cleaning up HTML entity-encoded strings in databases',
    'Preparing content for display in non-HTML contexts',
    'Converting legacy HTML content to plain text',
    'Processing XML/HTML feeds with encoded characters',
    'Cleaning up user-generated content with HTML entities',
    'Educational purposes for understanding HTML encoding'
  ],

  faq: [
    {
      question: 'What types of HTML entities can be decoded?',
      answer: 'The tool supports named entities (&amp;, &lt;), numeric entities (&#169;), and hexadecimal entities (&#x00A9;) covering common symbols, characters, and Unicode ranges.'
    },
    {
      question: 'How does the tool handle unknown or invalid entities?',
      answer: 'Unknown entities can either be preserved as-is or removed, depending on your configuration. The tool will report all unknown entities found during processing.'
    },
    {
      question: 'Can it validate the HTML structure after decoding?',
      answer: 'Yes, the tool can optionally validate the decoded content for proper HTML structure and detect potentially dangerous patterns like XSS attempts.'
    },
    {
      question: 'What output formats are supported?',
      answer: 'You can output as plain text, HTML-escaped text for display, or JavaScript-escaped text for use in code. Each format serves different use cases.'
    },
    {
      question: 'Does it handle Unicode characters properly?',
      answer: 'Yes, the tool properly handles Unicode characters through numeric and hexadecimal entities, supporting the full Unicode range including emojis and special symbols.'
    }
  ],

  commonErrors: [
    'Incomplete entity syntax (missing semicolon)',
    'Invalid numeric or hexadecimal character codes',
    'Unknown named entities not in the HTML specification',
    'Malformed entity references in source content',
    'Unicode characters outside valid ranges'
  ],

  relatedTools: ['html-entity-encoder', 'url-decoder', 'base64-decoder', 'text-escape-tool', 'unicode-converter']
};