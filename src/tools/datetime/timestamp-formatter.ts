import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface TimestampFormatterConfig {
  mode: 'format' | 'convert' | 'calculate';
  inputFormat: 'unix' | 'iso8601' | 'rfc2822' | 'custom' | 'auto';
  outputFormat: 'unix' | 'iso8601' | 'rfc2822' | 'custom' | 'relative' | 'all';
  inputTimezone: string;
  outputTimezone: string;
  customInputFormat: string;
  customOutputFormat: string;
  locale: string;
  includeMilliseconds: boolean;
  useUtc: boolean;
  showRelativeTime: boolean;
  batchProcessing: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  info?: TimestampInfo;
  results?: BatchResult[];
}

interface TimestampInfo {
  originalInput: string;
  parsedTimestamp: number;
  inputFormat: string;
  outputFormat: string;
  timezone: string;
  relativeTime: string;
  dayOfWeek: string;
  isValid: boolean;
}

interface BatchResult {
  input: string;
  output: string;
  error?: string;
  info?: TimestampInfo;
}

// Common timestamp formats with examples
export const TIMESTAMP_FORMATS = [
  {
    id: 'unix',
    name: 'Unix Timestamp',
    description: 'Seconds since January 1, 1970 UTC',
    example: '1701234567',
    pattern: /^\d{10}$/
  },
  {
    id: 'unix-ms',
    name: 'Unix Timestamp (milliseconds)',
    description: 'Milliseconds since January 1, 1970 UTC',
    example: '1701234567890',
    pattern: /^\d{13}$/
  },
  {
    id: 'iso8601',
    name: 'ISO 8601',
    description: 'International standard date format',
    example: '2023-11-29T12:36:07.890Z',
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
  },
  {
    id: 'rfc2822',
    name: 'RFC 2822',
    description: 'Email and HTTP date format',
    example: 'Wed, 29 Nov 2023 12:36:07 GMT',
    pattern: /^[A-Za-z]{3},?\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+[A-Z]{3,4}$/
  },
  {
    id: 'american',
    name: 'American Format',
    description: 'MM/DD/YYYY format',
    example: '11/29/2023 12:36:07 PM',
    pattern: /^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?)?$/i
  },
  {
    id: 'european',
    name: 'European Format',
    description: 'DD/MM/YYYY format',
    example: '29/11/2023 12:36:07',
    pattern: /^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{2}(:\d{2})?)?$/
  }
];

// Common timezones
export const COMMON_TIMEZONES = [
  { id: 'UTC', name: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { id: 'America/New_York', name: 'Eastern Time (US)', offset: '-05:00/-04:00' },
  { id: 'America/Chicago', name: 'Central Time (US)', offset: '-06:00/-05:00' },
  { id: 'America/Denver', name: 'Mountain Time (US)', offset: '-07:00/-06:00' },
  { id: 'America/Los_Angeles', name: 'Pacific Time (US)', offset: '-08:00/-07:00' },
  { id: 'Europe/London', name: 'Greenwich Mean Time', offset: '+00:00/+01:00' },
  { id: 'Europe/Paris', name: 'Central European Time', offset: '+01:00/+02:00' },
  { id: 'Europe/Berlin', name: 'Central European Time', offset: '+01:00/+02:00' },
  { id: 'Asia/Tokyo', name: 'Japan Standard Time', offset: '+09:00' },
  { id: 'Asia/Shanghai', name: 'China Standard Time', offset: '+08:00' },
  { id: 'Asia/Kolkata', name: 'India Standard Time', offset: '+05:30' },
  { id: 'Australia/Sydney', name: 'Australian Eastern Time', offset: '+10:00/+11:00' }
];

// Locale options
export const LOCALES = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'en-GB', name: 'English (UK)' },
  { id: 'de-DE', name: 'German' },
  { id: 'fr-FR', name: 'French' },
  { id: 'es-ES', name: 'Spanish' },
  { id: 'ja-JP', name: 'Japanese' },
  { id: 'zh-CN', name: 'Chinese (Simplified)' },
  { id: 'ru-RU', name: 'Russian' }
];

function detectTimestampFormat(input: string): string {
  const trimmed = input.trim();
  
  // Unix timestamp (10 digits)
  if (/^\d{10}$/.test(trimmed)) {
    return 'unix';
  }
  
  // Unix timestamp with milliseconds (13 digits)
  if (/^\d{13}$/.test(trimmed)) {
    return 'unix-ms';
  }
  
  // ISO 8601
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(trimmed)) {
    return 'iso8601';
  }
  
  // RFC 2822
  if (/^[A-Za-z]{3},?\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+[A-Z]{3,4}$/.test(trimmed)) {
    return 'rfc2822';
  }
  
  // Try to parse as a general date format
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return 'auto';
  }
  
  return 'unknown';
}

function parseTimestamp(input: string, format: string, customFormat?: string): { timestamp: number; error?: string } {
  const trimmed = input.trim();
  
  try {
    switch (format) {
      case 'unix':
        const unixSeconds = parseInt(trimmed);
        if (isNaN(unixSeconds)) {
          throw new Error('Invalid Unix timestamp');
        }
        return { timestamp: unixSeconds * 1000 };
        
      case 'unix-ms':
        const unixMs = parseInt(trimmed);
        if (isNaN(unixMs)) {
          throw new Error('Invalid Unix timestamp (ms)');
        }
        return { timestamp: unixMs };
        
      case 'iso8601':
      case 'rfc2822':
      case 'auto':
        const date = new Date(trimmed);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid ${format} format`);
        }
        return { timestamp: date.getTime() };
        
      case 'custom':
        // Simple custom format parsing (basic implementation)
        if (customFormat) {
          const date = new Date(trimmed);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid custom format or date');
          }
          return { timestamp: date.getTime() };
        }
        throw new Error('Custom format pattern not provided');
        
      default:
        throw new Error(`Unsupported input format: ${format}`);
    }
  } catch (error) {
    return { 
      timestamp: 0, 
      error: error instanceof Error ? error.message : 'Failed to parse timestamp' 
    };
  }
}

function formatTimestamp(timestamp: number, format: string, timezone: string, locale: string, customFormat?: string): string {
  const date = new Date(timestamp);
  
  // Create timezone-specific date if needed
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone !== 'local' ? timezone : undefined
  };
  
  try {
    switch (format) {
      case 'unix':
        return Math.floor(timestamp / 1000).toString();
        
      case 'unix-ms':
        return timestamp.toString();
        
      case 'iso8601':
        return timezone === 'UTC' || timezone === 'local' ? 
          date.toISOString() : 
          new Intl.DateTimeFormat('en-CA', {
            ...options,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).format(date).replace(/(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:$6');
          
      case 'rfc2822':
        return date.toUTCString();
        
      case 'relative':
        return getRelativeTime(timestamp);
        
      case 'custom':
        if (customFormat) {
          // Simple custom format implementation
          return new Intl.DateTimeFormat(locale, {
            ...options,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
          }).format(date);
        }
        return date.toString();
        
      case 'all':
        const formats = [
          `Unix: ${Math.floor(timestamp / 1000)}`,
          `Unix (ms): ${timestamp}`,
          `ISO 8601: ${date.toISOString()}`,
          `RFC 2822: ${date.toUTCString()}`,
          `Local: ${date.toLocaleString(locale, options)}`,
          `Relative: ${getRelativeTime(timestamp)}`
        ];
        return formats.join('\n');
        
      default:
        return new Intl.DateTimeFormat(locale, {
          ...options,
          dateStyle: 'full',
          timeStyle: 'long'
        }).format(date);
    }
  } catch (error) {
    return `Error formatting timestamp: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const absDiff = Math.abs(diff);
  
  const units = [
    { unit: 'year', ms: 31536000000 },
    { unit: 'month', ms: 2592000000 },
    { unit: 'week', ms: 604800000 },
    { unit: 'day', ms: 86400000 },
    { unit: 'hour', ms: 3600000 },
    { unit: 'minute', ms: 60000 },
    { unit: 'second', ms: 1000 }
  ];
  
  for (const { unit, ms } of units) {
    if (absDiff >= ms) {
      const value = Math.floor(absDiff / ms);
      const suffix = diff > 0 ? 'ago' : 'from now';
      return `${value} ${unit}${value !== 1 ? 's' : ''} ${suffix}`;
    }
  }
  
  return 'just now';
}

function getCurrentTimestamp(includeMs: boolean): number {
  const now = Date.now();
  return includeMs ? now : Math.floor(now / 1000);
}

export function processTimestampFormatter(input: string, config: TimestampFormatterConfig): ToolResult {
  try {
    // Handle current timestamp generation
    if (!input.trim() && config.mode === 'format') {
      const currentTime = getCurrentTimestamp(config.includeMilliseconds);
      const output = formatTimestamp(
        config.includeMilliseconds ? currentTime : currentTime * 1000,
        config.outputFormat,
        config.outputTimezone,
        config.locale,
        config.customOutputFormat
      );
      
      return {
        success: true,
        output,
        info: {
          originalInput: 'Current time',
          parsedTimestamp: config.includeMilliseconds ? currentTime : currentTime * 1000,
          inputFormat: 'current',
          outputFormat: config.outputFormat,
          timezone: config.outputTimezone,
          relativeTime: 'now',
          dayOfWeek: new Date().toLocaleDateString(config.locale, { weekday: 'long' }),
          isValid: true
        }
      };
    }
    
    if (!input.trim()) {
      return {
        success: false,
        error: 'Input is required'
      };
    }
    
    // Handle batch processing
    if (config.batchProcessing && input.includes('\n')) {
      const lines = input.split('\n').filter(line => line.trim());
      const results: BatchResult[] = [];
      
      for (const line of lines) {
        try {
          const singleResult = processTimestampFormatter(line.trim(), { ...config, batchProcessing: false });
          results.push({
            input: line.trim(),
            output: singleResult.output || '',
            error: singleResult.error,
            info: singleResult.info
          });
        } catch (error) {
          results.push({
            input: line.trim(),
            output: '',
            error: error instanceof Error ? error.message : 'Processing failed'
          });
        }
      }
      
      const output = results.map(r => r.error ? `Error: ${r.error}` : r.output).join('\n');
      return {
        success: true,
        output,
        results
      };
    }
    
    // Detect input format if auto
    const inputFormat = config.inputFormat === 'auto' ? detectTimestampFormat(input) : config.inputFormat;
    
    if (inputFormat === 'unknown') {
      return {
        success: false,
        error: 'Unable to detect timestamp format. Please specify the input format manually.'
      };
    }
    
    // Parse the input timestamp
    const { timestamp, error: parseError } = parseTimestamp(input, inputFormat, config.customInputFormat);
    
    if (parseError) {
      return {
        success: false,
        error: parseError
      };
    }
    
    // Format the output
    const output = formatTimestamp(
      timestamp,
      config.outputFormat,
      config.outputTimezone,
      config.locale,
      config.customOutputFormat
    );
    
    // Get additional info
    const date = new Date(timestamp);
    const info: TimestampInfo = {
      originalInput: input.trim(),
      parsedTimestamp: timestamp,
      inputFormat,
      outputFormat: config.outputFormat,
      timezone: config.outputTimezone,
      relativeTime: getRelativeTime(timestamp),
      dayOfWeek: date.toLocaleDateString(config.locale, { weekday: 'long' }),
      isValid: !isNaN(date.getTime())
    };
    
    return {
      success: true,
      output,
      info
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const TIMESTAMP_FORMATTER_TOOL: Tool = {
  id: 'timestamp-formatter',
  name: 'Timestamp Formatter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!.subcategories!.find(sub => sub.id === 'timestamp-tools')!,
  slug: 'timestamp-formatter',
  icon: '⏰',
  keywords: ['timestamp', 'time', 'date', 'unix', 'iso8601', 'rfc2822', 'timezone', 'format', 'convert'],
  seoTitle: 'Timestamp Formatter - Convert Unix, ISO 8601, RFC 2822 | FreeFormatHub',
  seoDescription: 'Convert timestamps between Unix, ISO 8601, RFC 2822 formats. Timezone support, relative time, batch processing, and current timestamp generation.',
  description: 'Convert and format timestamps between different formats including Unix, ISO 8601, and RFC 2822 with timezone support and relative time calculation.',

  examples: [
    {
      title: 'Unix Timestamp Conversion',
      input: '1701234567',
      output: '2023-11-29T12:36:07.000Z',
      description: 'Convert Unix timestamp to ISO 8601 format'
    },
    {
      title: 'ISO 8601 to Relative Time',
      input: '2023-11-29T12:36:07.890Z',
      output: '2 hours ago',
      description: 'Show timestamp as relative time from now'
    },
    {
      title: 'Timezone Conversion',
      input: '2023-11-29T12:36:07Z',
      output: 'Wednesday, November 29, 2023 at 7:36:07 AM EST',
      description: 'Convert UTC timestamp to Eastern Time'
    }
  ],

  useCases: [
    'Converting Unix timestamps from APIs to human-readable formats',
    'Converting between different timestamp formats for data migration',
    'Debugging time-related issues in applications and logs',
    'Batch processing of timestamp data from files or databases',
    'Converting timestamps between different timezones',
    'Generating current timestamps in various formats',
    'Calculating time differences and relative time displays',
    'Validating timestamp formats in data processing pipelines'
  ],

  faq: [
    {
      question: 'What is a Unix timestamp and how does it work?',
      answer: 'A Unix timestamp is the number of seconds since January 1, 1970, 00:00:00 UTC. It provides a standardized way to represent time across systems and timezones.'
    },
    {
      question: 'What\'s the difference between Unix timestamp and milliseconds?',
      answer: 'Standard Unix timestamps use seconds (10 digits), while JavaScript and some systems use milliseconds (13 digits). The tool automatically detects and converts between both formats.'
    },
    {
      question: 'How does timezone conversion work?',
      answer: 'The tool uses IANA timezone identifiers (e.g., America/New_York) to accurately convert timestamps while accounting for daylight saving time and regional time rules.'
    },
    {
      question: 'What timestamp formats are supported?',
      answer: 'Supports Unix (seconds/milliseconds), ISO 8601, RFC 2822, and custom formats. Auto-detection identifies the most likely format from input patterns.'
    },
    {
      question: 'Can I process multiple timestamps at once?',
      answer: 'Yes, enable batch processing mode and enter one timestamp per line. The tool will process all timestamps and show results or errors for each input.'
    }
  ],

  commonErrors: [
    'Invalid Unix timestamp format or out of valid range',
    'Malformed ISO 8601 or RFC 2822 timestamp strings',
    'Unknown or unsupported timezone identifier',
    'Custom format pattern doesn\'t match input data',
    'Timestamp value results in invalid date (e.g., too large)'
  ],

  relatedTools: ['date-calculator', 'timezone-converter', 'cron-generator', 'duration-calculator', 'time-tracker']
};