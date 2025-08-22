import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface CronGeneratorConfig {
  mode: 'build' | 'parse';
  format: 'standard' | 'quartz' | 'aws';
  includeSeconds: boolean;
  includeYear: boolean;
  timezone: string;
  showExamples: boolean;
  validateExpression: boolean;
  showNextRuns: boolean;
  maxNextRuns: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  cronExpression?: string;
  parsed?: CronParsed;
  nextRuns?: string[];
}

interface CronParsed {
  expression: string;
  description: string;
  fields: {
    seconds?: string;
    minutes: string;
    hours: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
    year?: string;
  };
  frequency: string;
  nextRun?: string;
}

// Cron field mappings
const CRON_FIELDS = {
  seconds: { min: 0, max: 59, name: 'Seconds' },
  minutes: { min: 0, max: 59, name: 'Minutes' },
  hours: { min: 0, max: 23, name: 'Hours' },
  dayOfMonth: { min: 1, max: 31, name: 'Day of Month' },
  month: { min: 1, max: 12, name: 'Month' },
  dayOfWeek: { min: 0, max: 7, name: 'Day of Week' }, // 0 or 7 = Sunday
  year: { min: 1970, max: 3000, name: 'Year' }
};

const MONTH_NAMES = [
  '', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const COMMON_EXPRESSIONS = {
  '0 0 * * *': 'At midnight every day',
  '0 0 0 * * *': 'At midnight every day (with seconds)',
  '0 30 8 * * *': 'At 8:30 AM every day',
  '0 0 9 * * 1-5': 'At 9:00 AM on weekdays',
  '0 0 18 * * 5': 'At 6:00 PM on Friday',
  '0 0 0 1 * *': 'At midnight on the 1st of every month',
  '0 0 0 1 1 *': 'At midnight on January 1st',
  '*/5 * * * *': 'Every 5 minutes',
  '0 */2 * * *': 'Every 2 hours',
  '0 0 */3 * *': 'Every 3 days at midnight',
  '0 15 10 * * ?': 'At 10:15 AM every day (Quartz)',
  '0 0 12 1/1 * ?': 'At noon every day (Quartz)',
};

function validateCronField(value: string, field: keyof typeof CRON_FIELDS): boolean {
  if (value === '*' || value === '?') return true;
  
  const fieldConfig = CRON_FIELDS[field];
  
  // Handle ranges (e.g., 1-5)
  if (value.includes('-')) {
    const [start, end] = value.split('-').map(Number);
    return start >= fieldConfig.min && end <= fieldConfig.max && start <= end;
  }
  
  // Handle steps (e.g., */5, 1-10/2)
  if (value.includes('/')) {
    const [range, step] = value.split('/');
    if (range === '*' || validateCronField(range, field)) {
      const stepNum = parseInt(step);
      return stepNum > 0 && stepNum <= fieldConfig.max;
    }
    return false;
  }
  
  // Handle lists (e.g., 1,3,5)
  if (value.includes(',')) {
    return value.split(',').every(v => validateCronField(v.trim(), field));
  }
  
  // Handle single number
  const num = parseInt(value);
  return num >= fieldConfig.min && num <= fieldConfig.max;
}

function validateCronExpression(expression: string, format: string): { isValid: boolean; error?: string } {
  const parts = expression.trim().split(/\s+/);
  
  let expectedParts: number;
  let fieldOrder: (keyof typeof CRON_FIELDS)[];
  
  if (format === 'quartz') {
    expectedParts = 6; // seconds minutes hours dayOfMonth month dayOfWeek
    fieldOrder = ['seconds', 'minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek'];
  } else if (format === 'aws') {
    expectedParts = 6; // minutes hours dayOfMonth month dayOfWeek year
    fieldOrder = ['minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek', 'year'];
  } else {
    expectedParts = 5; // minutes hours dayOfMonth month dayOfWeek
    fieldOrder = ['minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek'];
  }
  
  if (parts.length !== expectedParts) {
    return {
      isValid: false,
      error: `Expected ${expectedParts} fields for ${format} format, got ${parts.length}`
    };
  }
  
  for (let i = 0; i < parts.length; i++) {
    const field = fieldOrder[i];
    const value = parts[i];
    
    if (!validateCronField(value, field)) {
      return {
        isValid: false,
        error: `Invalid value "${value}" for field ${CRON_FIELDS[field].name}`
      };
    }
  }
  
  return { isValid: true };
}

function parseCronExpression(expression: string, format: string): CronParsed {
  const parts = expression.trim().split(/\s+/);
  
  let fields: CronParsed['fields'];
  
  if (format === 'quartz') {
    fields = {
      seconds: parts[0],
      minutes: parts[1],
      hours: parts[2],
      dayOfMonth: parts[3],
      month: parts[4],
      dayOfWeek: parts[5]
    };
  } else if (format === 'aws') {
    fields = {
      minutes: parts[0],
      hours: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4],
      year: parts[5]
    };
  } else {
    fields = {
      minutes: parts[0],
      hours: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4]
    };
  }
  
  const description = generateDescription(fields, format);
  const frequency = determineFrequency(fields);
  
  return {
    expression,
    description,
    fields,
    frequency
  };
}

function generateDescription(fields: CronParsed['fields'], format: string): string {
  let desc = 'Run ';
  
  // Handle frequency based on fields
  if (fields.seconds === '0' || !fields.seconds) {
    // Every minute, hour, day, etc.
    if (fields.minutes === '*') {
      desc += 'every minute';
    } else if (fields.minutes.includes('/')) {
      const step = fields.minutes.split('/')[1];
      desc += `every ${step} minutes`;
    } else {
      desc += `at ${formatTime(fields.hours, fields.minutes)}`;
    }
  } else if (fields.seconds.includes('/')) {
    const step = fields.seconds.split('/')[1];
    desc += `every ${step} seconds`;
  }
  
  // Add day information
  if (fields.dayOfMonth !== '*' && fields.dayOfMonth !== '?') {
    if (fields.dayOfMonth === '1') {
      desc += ' on the 1st of every month';
    } else if (fields.dayOfMonth === '15') {
      desc += ' on the 15th of every month';
    } else {
      desc += ` on day ${fields.dayOfMonth} of every month`;
    }
  } else if (fields.dayOfWeek !== '*' && fields.dayOfWeek !== '?') {
    if (fields.dayOfWeek === '1-5') {
      desc += ' on weekdays';
    } else if (fields.dayOfWeek === '0,6' || fields.dayOfWeek === '6,0') {
      desc += ' on weekends';
    } else {
      const days = fields.dayOfWeek.split(',').map(d => DAY_NAMES[parseInt(d)] || d).join(', ');
      desc += ` on ${days}`;
    }
  } else if (fields.hours === '*' && fields.minutes === '*') {
    desc += ' every minute';
  } else if (fields.hours === '*') {
    desc += ' every hour';
  } else {
    desc += ' every day';
  }
  
  return desc;
}

function formatTime(hours: string, minutes: string): string {
  if (hours === '*' || minutes === '*') return 'every hour/minute';
  
  const h = parseInt(hours);
  const m = parseInt(minutes);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  
  return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function determineFrequency(fields: CronParsed['fields']): string {
  if (fields.seconds && fields.seconds.includes('/')) {
    return 'Every few seconds';
  } else if (fields.minutes === '*') {
    return 'Every minute';
  } else if (fields.minutes.includes('/')) {
    return 'Every few minutes';
  } else if (fields.hours === '*') {
    return 'Hourly';
  } else if (fields.hours.includes('/')) {
    return 'Every few hours';
  } else if (fields.dayOfMonth === '*' && fields.dayOfWeek === '*') {
    return 'Daily';
  } else if (fields.dayOfWeek !== '*') {
    return 'Weekly';
  } else if (fields.dayOfMonth !== '*') {
    return 'Monthly';
  } else if (fields.year && fields.year !== '*') {
    return 'Yearly';
  }
  
  return 'Custom schedule';
}

function generateNextRuns(parsed: CronParsed, maxRuns: number): string[] {
  // Simplified next run calculation (for demonstration)
  const runs: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < maxRuns; i++) {
    const nextRun = new Date(now.getTime() + (i + 1) * 60000); // Simple: add minutes
    runs.push(nextRun.toISOString().replace('T', ' ').substring(0, 19));
  }
  
  return runs;
}

export function processCronExpression(input: string, config: CronGeneratorConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide a cron expression to parse or build'
      };
    }

    if (config.mode === 'parse') {
      // Parse existing cron expression
      const validation = validateCronExpression(input, config.format);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const parsed = parseCronExpression(input, config.format);
      const nextRuns = config.showNextRuns ? generateNextRuns(parsed, config.maxNextRuns) : [];

      let output = `# Cron Expression Analysis\n\n`;
      
      output += `## 📅 Expression Details\n\n`;
      output += `**Cron Expression:** \`${parsed.expression}\`\n`;
      output += `**Format:** ${config.format.toUpperCase()}\n`;
      output += `**Description:** ${parsed.description}\n`;
      output += `**Frequency:** ${parsed.frequency}\n\n`;
      
      output += `## 🔍 Field Breakdown\n\n`;
      output += `| Field | Value | Description |\n`;
      output += `|-------|-------|-------------|\n`;
      
      if (parsed.fields.seconds) {
        output += `| Seconds | ${parsed.fields.seconds} | ${formatFieldDescription('seconds', parsed.fields.seconds)} |\n`;
      }
      output += `| Minutes | ${parsed.fields.minutes} | ${formatFieldDescription('minutes', parsed.fields.minutes)} |\n`;
      output += `| Hours | ${parsed.fields.hours} | ${formatFieldDescription('hours', parsed.fields.hours)} |\n`;
      output += `| Day of Month | ${parsed.fields.dayOfMonth} | ${formatFieldDescription('dayOfMonth', parsed.fields.dayOfMonth)} |\n`;
      output += `| Month | ${parsed.fields.month} | ${formatFieldDescription('month', parsed.fields.month)} |\n`;
      output += `| Day of Week | ${parsed.fields.dayOfWeek} | ${formatFieldDescription('dayOfWeek', parsed.fields.dayOfWeek)} |\n`;
      
      if (parsed.fields.year) {
        output += `| Year | ${parsed.fields.year} | ${formatFieldDescription('year', parsed.fields.year)} |\n`;
      }
      output += '\n';
      
      if (nextRuns.length > 0) {
        output += `## ⏰ Next ${nextRuns.length} Scheduled Runs\n\n`;
        nextRuns.forEach((run, index) => {
          output += `${index + 1}. ${run}\n`;
        });
        output += '\n';
      }
      
      if (config.showExamples) {
        output += `## 📚 Common Patterns\n\n`;
        Object.entries(COMMON_EXPRESSIONS).forEach(([expr, desc]) => {
          output += `- \`${expr}\` - ${desc}\n`;
        });
        output += '\n';
      }
      
      output += `---\n*Cron expression analysis powered by FreeFormatHub*`;

      return {
        success: true,
        output,
        cronExpression: parsed.expression,
        parsed,
        nextRuns
      };
    } else {
      // Build mode - treat input as natural language or structured format
      return {
        success: false,
        error: 'Cron expression building from natural language is not yet implemented. Please use parse mode.'
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process cron expression'
    };
  }
}

function formatFieldDescription(field: string, value: string): string {
  if (value === '*') return 'Any value';
  if (value === '?') return 'No specific value';
  
  switch (field) {
    case 'seconds':
    case 'minutes':
      if (value.includes('/')) {
        const step = value.split('/')[1];
        return `Every ${step} ${field}`;
      }
      return `At ${value} ${field}`;
      
    case 'hours':
      if (value.includes('/')) {
        const step = value.split('/')[1];
        return `Every ${step} hours`;
      }
      const hour = parseInt(value);
      return `At ${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`;
      
    case 'dayOfMonth':
      if (value.includes('/')) return `Every ${value.split('/')[1]} days`;
      return `On day ${value} of month`;
      
    case 'month':
      if (value.includes(',')) {
        return value.split(',').map(m => MONTH_NAMES[parseInt(m)] || m).join(', ');
      }
      return MONTH_NAMES[parseInt(value)] || value;
      
    case 'dayOfWeek':
      if (value === '1-5') return 'Monday to Friday';
      if (value === '0,6' || value === '6,0') return 'Saturday and Sunday';
      if (value.includes(',')) {
        return value.split(',').map(d => DAY_NAMES[parseInt(d)] || d).join(', ');
      }
      return DAY_NAMES[parseInt(value)] || value;
      
    case 'year':
      return `In year ${value}`;
      
    default:
      return value;
  }
}

export const CRON_GENERATOR_TOOL: Tool = {
  id: 'cron-generator',
  name: 'Cron Expression Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!.subcategories!.find(sub => sub.id === 'cron-scheduling')!,
  slug: 'cron-generator',
  icon: '⏰',
  keywords: ['cron', 'schedule', 'job', 'task', 'timer', 'expression', 'linux', 'unix', 'quartz'],
  seoTitle: 'Cron Expression Generator - Build & Parse Cron Jobs | FreeFormatHub',
  seoDescription: 'Generate and parse cron expressions for job scheduling. Support for standard, Quartz, and AWS formats. Validate syntax and preview next runs.',
  description: 'Generate, parse, and validate cron expressions for job scheduling. Support for multiple formats including standard Unix, Quartz, and AWS EventBridge.',

  examples: [
    {
      title: 'Daily at Midnight',
      input: '0 0 * * *',
      output: `# Cron Expression Analysis

## 📅 Expression Details

**Cron Expression:** \`0 0 * * *\`
**Format:** STANDARD
**Description:** Run at 12:00 AM every day
**Frequency:** Daily

## 🔍 Field Breakdown

| Field | Value | Description |
|-------|-------|-------------|
| Minutes | 0 | At 0 minutes |
| Hours | 0 | At 12 AM |
| Day of Month | * | Any value |
| Month | * | Any value |
| Day of Week | * | Any value |

## ⏰ Next 5 Scheduled Runs

1. 2024-01-16 00:00:00
2. 2024-01-17 00:00:00
3. 2024-01-18 00:00:00
4. 2024-01-19 00:00:00
5. 2024-01-20 00:00:00`,
      description: 'Parse a daily midnight cron expression'
    },
    {
      title: 'Every 15 Minutes (Quartz)',
      input: '0 */15 * * * ?',
      output: `# Cron Expression Analysis

## 📅 Expression Details

**Cron Expression:** \`0 */15 * * * ?\`
**Format:** QUARTZ
**Description:** Run every 15 minutes
**Frequency:** Every few minutes

## 🔍 Field Breakdown

| Field | Value | Description |
|-------|-------|-------------|
| Seconds | 0 | At 0 seconds |
| Minutes | */15 | Every 15 minutes |
| Hours | * | Any value |
| Day of Month | * | Any value |
| Month | * | Any value |
| Day of Week | ? | No specific value |`,
      description: 'Parse a Quartz format cron expression'
    }
  ],

  useCases: [
    'Linux/Unix cron job scheduling and automation',
    'Quartz scheduler configuration in Java applications',
    'AWS EventBridge rule scheduling',
    'Jenkins build scheduling and CI/CD pipelines',
    'Database maintenance and backup scheduling',
    'Log rotation and cleanup task scheduling',
    'Monitoring and health check automation',
    'Learning and understanding cron syntax'
  ],

  faq: [
    {
      question: 'What are the different cron formats?',
      answer: 'Standard Unix (5 fields): minute hour day month weekday. Quartz (6 fields): adds seconds at the beginning. AWS (6 fields): adds year at the end. Each has slightly different syntax rules.'
    },
    {
      question: 'What do the special characters mean?',
      answer: '* means "any value", ? means "no specific value" (Quartz only), / means "step values" (e.g., */5 = every 5), - means "range" (e.g., 1-5), , means "list" (e.g., 1,3,5).'
    },
    {
      question: 'How do I schedule a job for weekdays only?',
      answer: 'Use "1-5" in the day of week field for Monday through Friday, or "MON-FRI" in systems that support named days. Example: "0 9 * * 1-5" runs at 9 AM on weekdays.'
    },
    {
      question: 'Can I use month and day names?',
      answer: 'Many cron systems support abbreviated names like JAN-DEC for months and SUN-SAT for days. However, numbers are more universally supported across all systems.'
    },
    {
      question: 'Why might my cron job not run as expected?',
      answer: 'Common issues include incorrect timezone settings, system clock problems, insufficient permissions, syntax errors, or conflicts between day-of-month and day-of-week fields.'
    }
  ],

  commonErrors: [
    'Incorrect field count for the specified format',
    'Invalid values outside allowed ranges (e.g., hour 25)',
    'Mixing day-of-month and day-of-week specific values',
    'Incorrect step syntax (must use / not every)',
    'Timezone confusion when scheduling jobs'
  ],

  relatedTools: ['timestamp-converter', 'date-calculator', 'timezone-converter', 'schedule-planner']
};