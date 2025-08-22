import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface TimestampConverterConfig {
  inputFormat: 'auto' | 'unix-seconds' | 'unix-milliseconds' | 'iso' | 'custom';
  outputFormat: 'unix-seconds' | 'unix-milliseconds' | 'iso' | 'readable' | 'custom' | 'all';
  timezone: 'utc' | 'local' | 'custom';
  customTimezone: string;
  customInputFormat: string;
  customOutputFormat: string;
  showRelativeTime: boolean;
  batchConversion: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  conversions?: TimestampConversion[];
  error?: string;
  stats?: {
    inputCount: number;
    successCount: number;
    errorCount: number;
    timezone: string;
  };
}

export interface TimestampConversion {
  input: string;
  unixSeconds: number;
  unixMilliseconds: number;
  iso: string;
  readable: string;
  relative: string;
  customFormat?: string;
  error?: string;
}

const TIMEZONE_OFFSETS: { [key: string]: number } = {
  'UTC': 0,
  'EST': -5, 'CST': -6, 'MST': -7, 'PST': -8,
  'EDT': -4, 'CDT': -5, 'MDT': -6, 'PDT': -7,
  'GMT': 0, 'CET': 1, 'EET': 2, 'JST': 9,
  'IST': 5.5, 'CST_CHINA': 8, 'AEST': 10
};

function detectTimestampFormat(input: string): 'unix-seconds' | 'unix-milliseconds' | 'iso' | 'unknown' {
  const trimmed = input.trim();
  
  // Check for Unix timestamps (numbers only)
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed);
    
    // Unix seconds (10 digits, reasonable range: 1970-2038)
    if (trimmed.length === 10 && num >= 0 && num < 2147483648) {
      return 'unix-seconds';
    }
    
    // Unix milliseconds (13 digits, reasonable range)
    if (trimmed.length === 13 && num >= 0 && num < 2147483648000) {
      return 'unix-milliseconds';
    }
  }
  
  // Check for ISO format (simplified)
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return 'iso';
  }
  
  // Check if it's a valid date string that Date can parse
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return 'iso';
  }
  
  return 'unknown';
}

function parseTimestamp(input: string, format: string): Date | null {
  const trimmed = input.trim();
  
  try {
    switch (format) {
      case 'auto':
        const detectedFormat = detectTimestampFormat(trimmed);
        if (detectedFormat === 'unknown') return null;
        return parseTimestamp(trimmed, detectedFormat);
        
      case 'unix-seconds':
        const seconds = parseInt(trimmed);
        if (isNaN(seconds)) return null;
        return new Date(seconds * 1000);
        
      case 'unix-milliseconds':
        const ms = parseInt(trimmed);
        if (isNaN(ms)) return null;
        return new Date(ms);
        
      case 'iso':
        const date = new Date(trimmed);
        return isNaN(date.getTime()) ? null : date;
        
      case 'custom':
        // For now, treat custom as ISO - can be extended later
        const customDate = new Date(trimmed);
        return isNaN(customDate.getTime()) ? null : customDate;
        
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function formatTimestamp(date: Date, format: string, timezone: string, customFormat?: string): string {
  try {
    const utcTime = date.getTime();
    let adjustedDate = date;
    
    // Apply timezone adjustment if needed
    if (timezone === 'utc') {
      // Already in UTC
    } else if (timezone === 'local') {
      // Use local timezone (default Date behavior)
    } else if (timezone === 'custom' && customFormat) {
      // Apply custom timezone offset
      const offset = TIMEZONE_OFFSETS[customFormat.toUpperCase()];
      if (offset !== undefined) {
        adjustedDate = new Date(utcTime + (offset * 60 * 60 * 1000));
      }
    }
    
    switch (format) {
      case 'unix-seconds':
        return Math.floor(adjustedDate.getTime() / 1000).toString();
        
      case 'unix-milliseconds':
        return adjustedDate.getTime().toString();
        
      case 'iso':
        if (timezone === 'utc') {
          return adjustedDate.toISOString();
        }
        // For local/custom, format as local ISO string
        const year = adjustedDate.getFullYear();
        const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = adjustedDate.getDate().toString().padStart(2, '0');
        const hours = adjustedDate.getHours().toString().padStart(2, '0');
        const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
        const seconds = adjustedDate.getSeconds().toString().padStart(2, '0');
        const milliseconds = adjustedDate.getMilliseconds().toString().padStart(3, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
        
      case 'readable':
        return adjustedDate.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: timezone === 'utc' ? 'UTC' : undefined
        });
        
      case 'custom':
        if (customFormat) {
          return formatCustomTimestamp(adjustedDate, customFormat);
        }
        return adjustedDate.toString();
        
      default:
        return adjustedDate.toString();
    }
  } catch {
    return 'Error formatting date';
  }
}

function formatCustomTimestamp(date: Date, format: string): string {
  const replacements: { [key: string]: string } = {
    'YYYY': date.getFullYear().toString(),
    'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
    'DD': date.getDate().toString().padStart(2, '0'),
    'HH': date.getHours().toString().padStart(2, '0'),
    'mm': date.getMinutes().toString().padStart(2, '0'),
    'ss': date.getSeconds().toString().padStart(2, '0'),
    'SSS': date.getMilliseconds().toString().padStart(3, '0')
  };
  
  let result = format;
  for (const [pattern, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(pattern, 'g'), value);
  }
  
  return result;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (Math.abs(diffSeconds) < 10) {
    return 'just now';
  } else if (Math.abs(diffSeconds) < 60) {
    return diffSeconds > 0 ? `${diffSeconds} seconds ago` : `in ${Math.abs(diffSeconds)} seconds`;
  } else if (Math.abs(diffMinutes) < 60) {
    return diffMinutes > 0 ? `${diffMinutes} minutes ago` : `in ${Math.abs(diffMinutes)} minutes`;
  } else if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `${diffHours} hours ago` : `in ${Math.abs(diffHours)} hours`;
  } else if (Math.abs(diffDays) < 7) {
    return diffDays > 0 ? `${diffDays} days ago` : `in ${Math.abs(diffDays)} days`;
  } else if (Math.abs(diffWeeks) < 4) {
    return diffWeeks > 0 ? `${diffWeeks} weeks ago` : `in ${Math.abs(diffWeeks)} weeks`;
  } else if (Math.abs(diffMonths) < 12) {
    return diffMonths > 0 ? `${diffMonths} months ago` : `in ${Math.abs(diffMonths)} months`;
  } else {
    return diffYears > 0 ? `${diffYears} years ago` : `in ${Math.abs(diffYears)} years`;
  }
}

function convertSingleTimestamp(input: string, config: TimestampConverterConfig): TimestampConversion {
  const date = parseTimestamp(input, config.inputFormat);
  
  if (!date) {
    return {
      input,
      unixSeconds: 0,
      unixMilliseconds: 0,
      iso: '',
      readable: '',
      relative: '',
      error: 'Unable to parse timestamp'
    };
  }
  
  const unixSeconds = Math.floor(date.getTime() / 1000);
  const unixMilliseconds = date.getTime();
  const iso = formatTimestamp(date, 'iso', config.timezone, config.customTimezone);
  const readable = formatTimestamp(date, 'readable', config.timezone, config.customTimezone);
  const relative = config.showRelativeTime ? getRelativeTime(date) : '';
  const customFormat = config.outputFormat === 'custom' ? 
    formatTimestamp(date, 'custom', config.timezone, config.customOutputFormat) : undefined;
  
  return {
    input,
    unixSeconds,
    unixMilliseconds,
    iso,
    readable,
    relative,
    customFormat
  };
}

export function processTimestampConverter(input: string, config: TimestampConverterConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide a timestamp to convert'
      };
    }
    
    const inputs = config.batchConversion ? 
      input.split('\n').filter(line => line.trim().length > 0) : 
      [input.trim()];
    
    const conversions: TimestampConversion[] = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const inputLine of inputs) {
      const conversion = convertSingleTimestamp(inputLine.trim(), config);
      conversions.push(conversion);
      
      if (conversion.error) {
        errorCount++;
      } else {
        successCount++;
      }
    }
    
    // Generate output based on format
    let output = '';
    
    if (config.outputFormat === 'all') {
      // Show all formats
      for (const conv of conversions) {
        if (conv.error) {
          output += `Input: ${conv.input}\nError: ${conv.error}\n\n`;
        } else {
          output += `Input: ${conv.input}\n`;
          output += `Unix Seconds: ${conv.unixSeconds}\n`;
          output += `Unix Milliseconds: ${conv.unixMilliseconds}\n`;
          output += `ISO Format: ${conv.iso}\n`;
          output += `Readable: ${conv.readable}\n`;
          if (config.showRelativeTime) {
            output += `Relative: ${conv.relative}\n`;
          }
          output += '\n';
        }
      }
    } else {
      // Show specific format
      for (const conv of conversions) {
        if (conv.error) {
          output += `Error: ${conv.error}\n`;
        } else {
          switch (config.outputFormat) {
            case 'unix-seconds':
              output += `${conv.unixSeconds}\n`;
              break;
            case 'unix-milliseconds':
              output += `${conv.unixMilliseconds}\n`;
              break;
            case 'iso':
              output += `${conv.iso}\n`;
              break;
            case 'readable':
              output += `${conv.readable}\n`;
              break;
            case 'custom':
              output += `${conv.customFormat || conv.readable}\n`;
              break;
          }
        }
      }
    }
    
    const timezoneDisplay = config.timezone === 'utc' ? 'UTC' :
                           config.timezone === 'local' ? 'Local' :
                           config.customTimezone || 'Custom';
    
    return {
      success: true,
      output: output.trim(),
      conversions,
      stats: {
        inputCount: inputs.length,
        successCount,
        errorCount,
        timezone: timezoneDisplay
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert timestamp'
    };
  }
}

export const TIMESTAMP_CONVERTER_TOOL: Tool = {
  id: 'timestamp-converter',
  name: 'Timestamp Converter',
  description: 'Convert between different timestamp formats including Unix timestamps, ISO dates, and human-readable formats. Supports timezone conversion, relative time display, and batch processing.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!.subcategories!.find(sub => sub.id === 'timestamp-tools')!,
  slug: 'timestamp-converter',
  icon: 'Clock',
  tags: ['timestamp', 'date', 'time', 'unix', 'iso', 'timezone', 'convert'],
  complexity: 'intermediate',
  keywords: ['timestamp', 'date', 'time', 'unix', 'iso', 'timezone', 'convert', 'utc', 'epoch'],
  
  examples: [
    {
      title: 'Unix Timestamp to Readable',
      input: '1672531200',
      output: 'Sunday, January 1, 2023 at 12:00:00 AM UTC',
      description: 'Convert Unix timestamp (seconds) to human-readable format'
    },
    {
      title: 'ISO Date to Unix',
      input: '2023-01-01T00:00:00.000Z',
      output: '1672531200',
      description: 'Convert ISO format date to Unix timestamp'
    },
    {
      title: 'Batch Conversion',
      input: `1672531200
2023-06-15T12:30:00Z
1687693800
2023-12-25T18:00:00.000Z`,
      output: `1672531200 -> Sunday, January 1, 2023 at 12:00:00 AM UTC
1687693800 -> Sunday, June 25, 2023 at 12:30:00 PM UTC
1687693800 -> Sunday, June 25, 2023 at 12:30:00 PM UTC
1703530800 -> Monday, December 25, 2023 at 06:00:00 PM UTC`,
      description: 'Convert multiple timestamps at once'
    }
  ],
  
  useCases: [
    'Converting Unix timestamps from APIs and databases',
    'Formatting dates for different systems and applications',
    'Timezone conversion for global applications',
    'Debugging timestamp-related issues',
    'Batch processing of timestamp data'
  ],
  
  faq: [
    {
      question: 'What timestamp formats are supported?',
      answer: 'The tool supports Unix timestamps (seconds and milliseconds), ISO 8601 format, and most common date strings that JavaScript can parse. Auto-detection helps identify the input format.'
    },
    {
      question: 'How does timezone conversion work?',
      answer: 'You can convert between UTC, local time, and specific timezones. The tool adjusts the timestamp accordingly and displays the result in your chosen timezone.'
    },
    {
      question: 'What is relative time?',
      answer: 'Relative time shows how long ago (or in the future) a timestamp is from now, like "2 hours ago" or "in 3 days". This is useful for understanding recent events.'
    },
    {
      question: 'Can I process multiple timestamps at once?',
      answer: 'Yes, enable batch conversion and enter one timestamp per line. The tool will process all of them and show results in your chosen format.'
    },
    {
      question: 'What\'s the difference between Unix seconds and milliseconds?',
      answer: 'Unix seconds count seconds since January 1, 1970 (10 digits). Unix milliseconds include fractional seconds for more precision (13 digits). Most systems use seconds.'
    }
  ],
  
  commonErrors: [
    'Unable to parse timestamp',
    'Invalid date range',
    'Timezone conversion failed'
  ],
  
  relatedTools: ['date-calculator', 'timezone-converter', 'epoch-converter'],
  seoTitle: 'Timestamp Converter - Unix, ISO, and Date Format Converter',
  seoDescription: 'Convert between Unix timestamps, ISO dates, and human-readable formats. Supports timezone conversion and batch processing.'
};