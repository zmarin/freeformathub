/**
 * Syntax highlighter for escape sequences in strings
 * Provides color-coded highlighting for different escape sequence types
 */

export interface HighlightedSegment {
  text: string;
  type: 'normal' | 'escape' | 'unicode' | 'hex' | 'octal' | 'entity' | 'url' | 'special';
  description?: string;
}

export interface EscapeSequenceMatch {
  sequence: string;
  type: string;
  position: number;
  description: string;
}

/**
 * Detect and categorize escape sequences in text
 */
export function detectEscapeSequences(text: string, escapeType: string): EscapeSequenceMatch[] {
  const matches: EscapeSequenceMatch[] = [];

  switch (escapeType) {
    case 'javascript':
    case 'json':
    case 'python':
      // JavaScript/JSON/Python escape sequences
      const jsRegex = /\\(?:['"\\nrtbfv0]|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2})/g;
      let match;
      while ((match = jsRegex.exec(text)) !== null) {
        matches.push({
          sequence: match[0],
          type: getJsEscapeType(match[0]),
          position: match.index,
          description: getEscapeDescription(match[0], 'javascript'),
        });
      }
      break;

    case 'html':
    case 'xml':
      // HTML/XML entities
      const htmlRegex = /&(?:[a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);/g;
      while ((match = htmlRegex.exec(text)) !== null) {
        matches.push({
          sequence: match[0],
          type: 'entity',
          position: match.index,
          description: getEscapeDescription(match[0], 'html'),
        });
      }
      break;

    case 'url':
      // URL percent encoding
      const urlRegex = /%[0-9a-fA-F]{2}/g;
      while ((match = urlRegex.exec(text)) !== null) {
        matches.push({
          sequence: match[0],
          type: 'url',
          position: match.index,
          description: `URL-encoded: ${String.fromCharCode(parseInt(match[0].slice(1), 16))}`,
        });
      }
      break;

    case 'regex':
      // RegEx escape sequences
      const regexEscapeRegex = /\\[.*+?^${}()|[\]\\]/g;
      while ((match = regexEscapeRegex.exec(text)) !== null) {
        matches.push({
          sequence: match[0],
          type: 'escape',
          position: match.index,
          description: `Escaped metacharacter: ${match[0].slice(1)}`,
        });
      }
      break;

    case 'sql':
      // SQL escape sequences
      const sqlRegex = /(?:''|\\[0nrZ\\])/g;
      while ((match = sqlRegex.exec(text)) !== null) {
        matches.push({
          sequence: match[0],
          type: 'escape',
          position: match.index,
          description: getEscapeDescription(match[0], 'sql'),
        });
      }
      break;

    case 'css':
      // CSS escape sequences
      const cssRegex = /\\(?:[0-9a-fA-F]{1,6}\s?|.)/g;
      while ((match = cssRegex.exec(text)) !== null) {
        matches.push({
          sequence: match[0],
          type: match[0].match(/\\[0-9a-fA-F]/) ? 'hex' : 'escape',
          position: match.index,
          description: getEscapeDescription(match[0], 'css'),
        });
      }
      break;
  }

  return matches;
}

function getJsEscapeType(sequence: string): string {
  if (sequence.startsWith('\\u')) return 'unicode';
  if (sequence.startsWith('\\x')) return 'hex';
  return 'escape';
}

function getEscapeDescription(sequence: string, type: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    javascript: {
      '\\n': 'Newline',
      '\\r': 'Carriage return',
      '\\t': 'Tab',
      '\\b': 'Backspace',
      '\\f': 'Form feed',
      '\\v': 'Vertical tab',
      '\\0': 'Null character',
      '\\"': 'Double quote',
      "\\'": 'Single quote',
      '\\\\': 'Backslash',
    },
    html: {
      '&lt;': 'Less than (<)',
      '&gt;': 'Greater than (>)',
      '&amp;': 'Ampersand (&)',
      '&quot;': 'Double quote (")',
      '&#x27;': "Single quote (')",
      '&#x2F;': 'Forward slash (/)',
    },
    sql: {
      "''": "Escaped single quote",
      '\\0': 'Null character',
      '\\n': 'Newline',
      '\\r': 'Carriage return',
      '\\Z': 'EOF character',
      '\\\\': 'Backslash',
    },
  };

  if (sequence.startsWith('\\u')) {
    const code = parseInt(sequence.slice(2), 16);
    return `Unicode: U+${code.toString(16).toUpperCase()} (${String.fromCharCode(code)})`;
  }

  if (sequence.startsWith('\\x')) {
    const code = parseInt(sequence.slice(2), 16);
    return `Hex: 0x${code.toString(16).toUpperCase()} (${String.fromCharCode(code)})`;
  }

  if (sequence.startsWith('%')) {
    const code = parseInt(sequence.slice(1), 16);
    return `URL: ${String.fromCharCode(code)}`;
  }

  if (sequence.startsWith('&#x')) {
    const code = parseInt(sequence.slice(3, -1), 16);
    return `HTML Hex Entity: ${String.fromCharCode(code)}`;
  }

  if (sequence.startsWith('&#')) {
    const code = parseInt(sequence.slice(2, -1), 10);
    return `HTML Decimal Entity: ${String.fromCharCode(code)}`;
  }

  return descriptions[type]?.[sequence] || sequence;
}

/**
 * Highlight text with escape sequences
 */
export function highlightEscapeSequences(text: string, escapeType: string): HighlightedSegment[] {
  const matches = detectEscapeSequences(text, escapeType);
  const segments: HighlightedSegment[] = [];

  if (matches.length === 0) {
    return [{ text, type: 'normal' }];
  }

  let lastIndex = 0;

  for (const match of matches) {
    // Add normal text before the escape sequence
    if (match.position > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.position),
        type: 'normal',
      });
    }

    // Add the escape sequence
    segments.push({
      text: match.sequence,
      type: match.type as HighlightedSegment['type'],
      description: match.description,
    });

    lastIndex = match.position + match.sequence.length;
  }

  // Add remaining normal text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      type: 'normal',
    });
  }

  return segments;
}

/**
 * Get statistics about escape sequences in text
 */
export interface EscapeStatistics {
  totalEscapes: number;
  byType: Record<string, number>;
  commonEscapes: Array<{ sequence: string; count: number; description: string }>;
  complexEscapes: number; // unicode, hex
  simpleEscapes: number; // quotes, newlines
}

export function getEscapeStatistics(text: string, escapeType: string): EscapeStatistics {
  const matches = detectEscapeSequences(text, escapeType);
  const byType: Record<string, number> = {};
  const sequenceCounts: Record<string, { count: number; description: string }> = {};

  let complexEscapes = 0;
  let simpleEscapes = 0;

  for (const match of matches) {
    byType[match.type] = (byType[match.type] || 0) + 1;

    if (!sequenceCounts[match.sequence]) {
      sequenceCounts[match.sequence] = { count: 0, description: match.description };
    }
    sequenceCounts[match.sequence].count++;

    if (match.type === 'unicode' || match.type === 'hex') {
      complexEscapes++;
    } else {
      simpleEscapes++;
    }
  }

  const commonEscapes = Object.entries(sequenceCounts)
    .map(([sequence, data]) => ({
      sequence,
      count: data.count,
      description: data.description,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEscapes: matches.length,
    byType,
    commonEscapes,
    complexEscapes,
    simpleEscapes,
  };
}
