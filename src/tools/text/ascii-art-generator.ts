import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface ASCIIArtConfig {
  width: number;
  font: 'standard' | 'small' | 'big' | 'block' | 'banner' | 'digital';
  style: 'outline' | 'filled' | 'shadow' | 'double' | 'gradient';
  alignment: 'left' | 'center' | 'right';
  includeColors: boolean;
  colorScheme: 'none' | 'rainbow' | 'gradient' | 'custom';
  customColor: string;
  backgroundChar: string;
  foregroundChar: string;
  spacing: number;
  verticalSpacing: number;
}

interface ASCIIArtResult {
  asciiArt: string;
  dimensions: {
    width: number;
    height: number;
    characters: number;
  };
  fontInfo: {
    name: string;
    characterHeight: number;
    characterWidth: number;
  };
  stats: {
    lines: number;
    uniqueCharacters: number;
    totalCharacters: number;
    density: number;
  };
}

// Simple ASCII art fonts (basic character mappings)
const ASCII_FONTS = {
  standard: {
    height: 5,
    width: 5,
    chars: {
      'A': [
        ' ▄▀█ ',
        ' █▀█ ',
        ' ▀ ▀ '
      ],
      'B': [
        ' █▀▄ ',
        ' █▀▄ ',
        ' ▀▀  '
      ],
      'C': [
        ' ▄▀█ ',
        ' █▄▄ ',
        ' ▀▀▀ '
      ],
      'D': [
        ' █▀▄ ',
        ' █ █ ',
        ' ▀▀  '
      ],
      'E': [
        ' █▀▀ ',
        ' █▀▀ ',
        ' ▀▀▀ '
      ],
      'F': [
        ' █▀▀ ',
        ' █▀▀ ',
        ' ▀   '
      ],
      'G': [
        ' ▄▀█ ',
        ' █▄█ ',
        ' ▀▀▀ '
      ],
      'H': [
        ' █ █ ',
        ' █▀█ ',
        ' ▀ ▀ '
      ],
      'I': [
        ' ███ ',
        '  █  ',
        ' ███ '
      ],
      'J': [
        ' ▄▄█ ',
        '   █ ',
        ' ██  '
      ],
      'K': [
        ' █ █ ',
        ' ██  ',
        ' █ █ '
      ],
      'L': [
        ' █   ',
        ' █   ',
        ' ███ '
      ],
      'M': [
        ' █▄█ ',
        ' █▀█ ',
        ' ▀ ▀ '
      ],
      'N': [
        ' █▄█ ',
        ' █▀█ ',
        ' ▀ █ '
      ],
      'O': [
        ' ▄▀█ ',
        ' █ █ ',
        ' ▀▀▀ '
      ],
      'P': [
        ' █▀▄ ',
        ' █▀  ',
        ' ▀   '
      ],
      'Q': [
        ' ▄▀█ ',
        ' █ █ ',
        ' ▀▀█ '
      ],
      'R': [
        ' █▀▄ ',
        ' █▀▄ ',
        ' ▀ █ '
      ],
      'S': [
        ' ▄▀▀ ',
        ' ▀▀▄ ',
        ' ▀▀  '
      ],
      'T': [
        ' ███ ',
        '  █  ',
        '  ▀  '
      ],
      'U': [
        ' █ █ ',
        ' █ █ ',
        ' ▀▀▀ '
      ],
      'V': [
        ' █ █ ',
        ' █ █ ',
        '  ▀  '
      ],
      'W': [
        ' █ █ ',
        ' █▄█ ',
        ' ▀▀▀ '
      ],
      'X': [
        ' █ █ ',
        '  ▀  ',
        ' █ █ '
      ],
      'Y': [
        ' █ █ ',
        '  █  ',
        '  ▀  '
      ],
      'Z': [
        ' ███ ',
        '  ▀  ',
        ' ███ '
      ],
      '0': [
        ' ▄▀█ ',
        ' █ █ ',
        ' ▀▀▀ '
      ],
      '1': [
        '  █  ',
        '  █  ',
        ' ███ '
      ],
      '2': [
        ' ▀▀█ ',
        ' ▄▀  ',
        ' ███ '
      ],
      '3': [
        ' ▀▀█ ',
        ' ▀▀█ ',
        ' ▀▀  '
      ],
      '4': [
        ' █ █ ',
        ' ▀▀█ ',
        '   ▀ '
      ],
      '5': [
        ' ███ ',
        ' ▀▀█ ',
        ' ▀▀  '
      ],
      '6': [
        ' ▄▀▀ ',
        ' █▀█ ',
        ' ▀▀▀ '
      ],
      '7': [
        ' ███ ',
        '   █ ',
        '   ▀ '
      ],
      '8': [
        ' ▄▀█ ',
        ' █▀█ ',
        ' ▀▀▀ '
      ],
      '9': [
        ' ▄▀█ ',
        ' ▀▀█ ',
        ' ▀▀  '
      ],
      ' ': [
        '     ',
        '     ',
        '     '
      ],
      '!': [
        '  █  ',
        '  █  ',
        '  ▀  '
      ],
      '?': [
        ' ▀▀█ ',
        '  ▀  ',
        '  ▀  '
      ],
      '.': [
        '     ',
        '     ',
        '  ▀  '
      ],
      ',': [
        '     ',
        '     ',
        '  █  '
      ],
      ':': [
        '  ▀  ',
        '     ',
        '  ▀  '
      ],
      ';': [
        '  ▀  ',
        '     ',
        '  █  '
      ],
      '-': [
        '     ',
        ' ─── ',
        '     '
      ],
      '_': [
        '     ',
        '     ',
        ' ███ '
      ],
      '=': [
        ' ─── ',
        '     ',
        ' ─── '
      ],
      '+': [
        '  █  ',
        ' ███ ',
        '  █  '
      ],
      '*': [
        ' █ █ ',
        '  █  ',
        ' █ █ '
      ],
      '/': [
        '   █ ',
        '  █  ',
        ' █   '
      ],
      '\\': [
        ' █   ',
        '  █  ',
        '   █ '
      ],
      '(': [
        '  █  ',
        ' █   ',
        '  █  '
      ],
      ')': [
        '  █  ',
        '   █ ',
        '  █  '
      ],
      '[': [
        ' ██  ',
        ' █   ',
        ' ██  '
      ],
      ']': [
        '  ██ ',
        '   █ ',
        '  ██ '
      ],
      '{': [
        '  ██ ',
        ' █   ',
        '  ██ '
      ],
      '}': [
        ' ██  ',
        '   █ ',
        ' ██  '
      ],
      '<': [
        '   █ ',
        ' ██  ',
        '   █ '
      ],
      '>': [
        ' █   ',
        '  ██ ',
        ' █   '
      ],
      '@': [
        ' ▄▀█ ',
        ' █▄█ ',
        ' ▀▀▀ '
      ],
      '#': [
        ' █▄█ ',
        ' █▄█ ',
        ' ▀▀▀ '
      ],
      '$': [
        ' ▄██ ',
        ' ██▄ ',
        ' ▀▀  '
      ],
      '%': [
        ' █ █ ',
        '  █  ',
        ' █ █ '
      ],
      '^': [
        '  ▀  ',
        ' █ █ ',
        '     '
      ],
      '&': [
        ' ▄▀▀ ',
        ' █▄█ ',
        ' ▀▀▀ '
      ]
    }
  },
  small: {
    height: 1,
    width: 1,
    chars: {} // Small font uses original characters
  },
  big: {
    height: 7,
    width: 8,
    chars: {
      'A': [
        '   ██   ',
        '  ████  ',
        ' ██  ██ ',
        ' ██████ ',
        ' ██  ██ ',
        ' ██  ██ ',
        '        '
      ],
      'B': [
        ' ██████ ',
        ' ██  ██ ',
        ' ██████ ',
        ' ██████ ',
        ' ██  ██ ',
        ' ██████ ',
        '        '
      ],
      'C': [
        '  ██████',
        ' ██     ',
        ' ██     ',
        ' ██     ',
        ' ██     ',
        '  ██████',
        '        '
      ]
    }
  }
};

// Color schemes
const COLOR_SCHEMES = {
  rainbow: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],
  gradient: ['█', '▉', '▊', '▋', '▌', '▍', '▎', '▏'],
  custom: ['█']
};

function generateASCIIArt(text: string, config: ASCIIArtConfig): ASCIIArtResult {
  const font = ASCII_FONTS[config.font];
  const lines: string[] = [];
  
  // Handle different fonts
  if (config.font === 'small') {
    // Simple character-based ASCII art for small font
    const artLine = text.split('').map(char => {
      if (config.style === 'filled') return '█';
      if (config.style === 'outline') return char === ' ' ? ' ' : '▒';
      if (config.style === 'shadow') return '▓';
      return char;
    }).join(config.spacing > 0 ? ' '.repeat(config.spacing) : '');
    
    lines.push(artLine);
  } else if (config.font === 'digital') {
    // Digital-style ASCII art
    for (let i = 0; i < 3; i++) {
      let line = '';
      for (const char of text.toUpperCase()) {
        if (char === ' ') {
          line += '     ';
        } else {
          switch (i) {
            case 0: line += ' ███ '; break;
            case 1: line += '  █  '; break;
            case 2: line += ' ███ '; break;
          }
        }
        if (config.spacing > 0) {
          line += ' '.repeat(config.spacing);
        }
      }
      lines.push(line);
    }
  } else if (config.font === 'banner') {
    // Banner-style ASCII art
    const bannerLines = ['█████', '██ ██', '█████'];
    for (let i = 0; i < bannerLines.length; i++) {
      let line = '';
      for (const char of text.toUpperCase()) {
        if (char === ' ') {
          line += '      ';
        } else {
          line += bannerLines[i] + ' ';
        }
        if (config.spacing > 0) {
          line += ' '.repeat(config.spacing);
        }
      }
      lines.push(line);
    }
  } else if (config.font === 'block') {
    // Block-style ASCII art
    for (let i = 0; i < 5; i++) {
      let line = '';
      for (const char of text.toUpperCase()) {
        if (char === ' ') {
          line += '     ';
        } else {
          if (i === 0 || i === 4) {
            line += '█████';
          } else if (i === 1 || i === 3) {
            line += '█   █';
          } else {
            line += '█████';
          }
        }
        if (config.spacing > 0) {
          line += ' '.repeat(config.spacing);
        }
      }
      lines.push(line);
    }
  } else {
    // Standard font using character mappings
    const charHeight = font.height;
    
    for (let row = 0; row < charHeight; row++) {
      let line = '';
      
      for (const char of text.toUpperCase()) {
        const charArt = font.chars[char] || font.chars[' '];
        if (charArt && charArt[row]) {
          line += charArt[row];
        } else {
          line += ' '.repeat(font.width || 5);
        }
        
        if (config.spacing > 0) {
          line += ' '.repeat(config.spacing);
        }
      }
      
      lines.push(line);
      
      // Add vertical spacing
      if (row < charHeight - 1 && config.verticalSpacing > 0) {
        for (let vs = 0; vs < config.verticalSpacing; vs++) {
          lines.push(' '.repeat(line.length));
        }
      }
    }
  }
  
  // Apply styles
  const styledLines = lines.map(line => {
    let styledLine = line;
    
    switch (config.style) {
      case 'filled':
        styledLine = styledLine.replace(/[^\s]/g, config.foregroundChar || '█');
        break;
      case 'outline':
        styledLine = styledLine.replace(/[█▄▀]/g, config.foregroundChar || '▒');
        break;
      case 'shadow':
        styledLine = styledLine.replace(/[█▄▀]/g, '▓') + ' ' + styledLine.replace(/[█▄▀]/g, '▒').replace(/./g, '░');
        break;
      case 'double':
        styledLine = styledLine.replace(/[█▄▀]/g, '▓');
        break;
    }
    
    return styledLine;
  });
  
  // Apply alignment
  const maxWidth = Math.max(...styledLines.map(line => line.length));
  const alignedLines = styledLines.map(line => {
    const padding = maxWidth - line.length;
    
    switch (config.alignment) {
      case 'center':
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + line + ' '.repeat(rightPad);
      case 'right':
        return ' '.repeat(padding) + line;
      default:
        return line + ' '.repeat(padding);
    }
  });
  
  // Apply width constraint
  const finalLines = alignedLines.map(line => {
    if (line.length > config.width && config.width > 0) {
      return line.substring(0, config.width);
    }
    return line;
  });
  
  const asciiArt = finalLines.join('\n');
  
  // Calculate statistics
  const totalCharacters = asciiArt.length;
  const uniqueCharacters = new Set(asciiArt.replace(/\s/g, '')).size;
  const density = (asciiArt.replace(/\s/g, '').length / totalCharacters) * 100;
  
  return {
    asciiArt,
    dimensions: {
      width: maxWidth,
      height: finalLines.length,
      characters: totalCharacters
    },
    fontInfo: {
      name: config.font,
      characterHeight: font.height,
      characterWidth: font.width || 5
    },
    stats: {
      lines: finalLines.length,
      uniqueCharacters,
      totalCharacters,
      density
    }
  };
}

export function processASCIIArtGenerator(text: string, config: ASCIIArtConfig): Promise<ToolResult<ASCIIArtResult | null>> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      if (!text.trim()) {
        resolve({
          data: null,
          error: 'Please enter text to convert to ASCII art',
          processing_time: 0
        });
        return;
      }
      
      // Validate text length
      if (text.length > 100) {
        resolve({
          data: null,
          error: 'Text too long. Please use 100 characters or fewer.',
          processing_time: Date.now() - startTime
        });
        return;
      }
      
      const result = generateASCIIArt(text, config);
      
      resolve({
        data: result,
        processing_time: Date.now() - startTime,
        metadata: {
          textLength: text.length,
          font: config.font,
          style: config.style,
          alignment: config.alignment,
          outputLines: result.stats.lines,
          outputCharacters: result.stats.totalCharacters,
          density: Math.round(result.stats.density * 100) / 100
        }
      });
      
    } catch (error) {
      resolve({
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate ASCII art',
        processing_time: Date.now() - startTime
      });
    }
  });
}

const examples: ToolExample[] = [
  {
    title: 'Welcome Banner',
    description: 'Create a bold welcome banner with block font',
    input: 'WELCOME',
    output: `█████ █████ █     █████ █████ █   █ █████
█     █   █ █     █     █   █ ██ ██ █    
████  █████ █     █     █   █ █ █ █ ████ 
█     █     █     █     █   █ █   █ █    
█     █     █████ █████ █████ █   █ █████`
  },
  {
    title: 'Company Logo',
    description: 'Generate ASCII art for branding with shadow effect',
    input: 'ACME',
    output: `  █████       ██████    ██████   ██████
 ███████     ██████    ██████   ██████
███   ███   ██        ██    ██ ██    
███████████ ██        ██    ██ ██████ 
███     ███  ██████    ██████   ██████
▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒    ▒▒▒▒▒▒   ▒▒▒▒▒▒`
  }
];

export const ASCII_ART_GENERATOR_TOOL: Tool = {
  id: 'ascii-art-generator',
  name: 'ASCII Art Generator',
  description: 'Generate beautiful ASCII art from text with multiple fonts, styles, and customization options including alignment, spacing, and effects',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'text')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'text')!.subcategories!.find(sub => sub.id === 'text-generation')!,
  slug: 'ascii-art-generator',
  icon: '🎨',
  keywords: ['ascii', 'art', 'text', 'banner', 'logo', 'font', 'design', 'typography'],
  seoTitle: 'ASCII Art Generator - Create Text Art Online | FreeFormatHub',
  seoDescription: 'Generate beautiful ASCII art from text with multiple fonts, styles, and customization options. Create banners, logos, and text art for free.',
  examples,
  useCases: [
    'Create eye-catching banners for terminal applications',
    'Generate logos and headers for documentation',
    'Create decorative text for social media posts',
    'Design ASCII art for email signatures',
    'Generate retro-style text graphics for presentations'
  ],
  commonErrors: [
    'Text too long for selected font',
    'Special characters not supported in font',
    'Output width exceeds display limits',
    'Font rendering issues with certain characters'
  ],
  faq: [
    {
      question: 'What font styles are available?',
      answer: 'Available fonts include: Standard (multi-line block letters), Small (single character), Big (large block style), Block (solid rectangles), Banner (decorative style), and Digital (LCD-style display).'
    },
    {
      question: 'How can I customize the appearance?',
      answer: 'You can customize alignment (left, center, right), spacing between characters, vertical spacing, style effects (filled, outline, shadow, double), and choose different foreground/background characters.'
    },
    {
      question: 'What text length is supported?',
      answer: 'The tool supports text up to 100 characters. Longer text may be truncated or cause performance issues. For best results, use shorter phrases or single words.'
    },
    {
      question: 'Can I use special characters?',
      answer: 'Most fonts support letters, numbers, and common punctuation. Special characters may be displayed as spaces or simplified versions depending on the font.'
    },
    {
      question: 'How do I save the ASCII art?',
      answer: 'Use the copy button to copy the ASCII art to your clipboard, or the download button to save it as a text file. The art preserves formatting when pasted into text editors.'
    }
  ],
  relatedTools: ['text-formatter', 'banner-generator', 'logo-creator', 'text-art', 'character-converter']
};