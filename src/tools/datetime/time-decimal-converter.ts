import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface TimeDecimalConfig extends ToolConfig {
  inputFormat: 'time' | 'decimal' | 'auto';
  outputFormat: 'both' | 'decimal' | 'time' | 'auto';
  decimalPrecision: 1 | 2 | 3 | 4;
  roundingMode: 'standard' | 'legal' | 'payroll' | 'quarter' | 'tenth';
  timeFormat: '24hour' | '12hour';
  includeSeconds: boolean;
  hourlyRate?: number;
  calculatePayroll: boolean;
  batchMode: boolean;
  showBreakdown: boolean;
}

export interface TimeConversion {
  input: string;
  decimal: number;
  formatted: string;
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  totalSeconds: number;
  payrollAmount?: number;
  breakdown?: string;
  detectedInputType?: 'time' | 'decimal';
}

export const TIME_DECIMAL_CONVERTER_TOOL: Tool = {
  id: 'time-decimal-converter',
  name: 'Time to Decimal Hours Converter',
  description: 'Convert between time formats (8:30) and decimal hours (8.5) with payroll calculations, timesheet processing, and billing features. Perfect for HR, payroll, legal billing, and time tracking.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!.subcategories!.find(sub => sub.id === 'time-conversion')!,
  slug: 'time-decimal-converter',
  icon: '⏰',
  keywords: [
    'time converter', 'decimal hours', 'timesheet calculator', 'hour calculator', 'time to decimal',
    'decimal to time', 'payroll calculator', 'billing hours', 'legal billing', 'consulting hours',
    'time tracking', 'work hours', 'timesheet converter', 'hr calculator', 'overtime calculator',
    'project time', 'freelance billing', 'time arithmetic', 'hourly rate calculator'
  ],
  seoTitle: 'Time to Decimal Hours Converter - Timesheet & Payroll Calculator | Free Online Tool',
  seoDescription: 'Convert time formats (8:30) to decimal hours (8.5) instantly. Features payroll calculation, legal billing increments, batch timesheet processing, and overtime calculations. Perfect for HR, freelancers, and consultants.',

  examples: [
    {
      title: 'Basic Time to Decimal Conversion',
      input: '8:30',
      output: '8.5',
      description: 'Convert 8 hours 30 minutes to 8.5 decimal hours for payroll systems'
    },
    {
      title: 'Decimal to Time Format',
      input: '7.75',
      output: '7:45',
      description: 'Convert 7.75 decimal hours back to 7 hours 45 minutes time format'
    },
    {
      title: 'Legal Billing Increment (6-minute)',
      input: '2:23',
      output: '2.4',
      description: 'Round to legal billing increments (6-minute = 0.1 hour blocks)'
    },
    {
      title: 'Payroll Calculation',
      input: '8.5 hours × $25/hour',
      output: '$212.50',
      description: 'Calculate total pay for decimal hours worked at hourly rate'
    },
    {
      title: 'Weekly Timesheet Total',
      input: 'Mon: 8:15, Tue: 7:45, Wed: 8:30, Thu: 8:00, Fri: 7:30',
      output: '40.0 hours = $1,000.00',
      description: 'Process multiple daily entries for weekly timesheet calculations'
    },
    {
      title: 'Overtime Calculation',
      input: '45.5 hours (40 regular + 5.5 overtime)',
      output: 'Regular: $800, Overtime: $206.25, Total: $1,006.25',
      description: 'Calculate regular and overtime pay with 1.5x overtime rate'
    },
    {
      title: 'Project Time Tracking',
      input: 'Task A: 2:15, Task B: 1:45, Task C: 3:30',
      output: '7.5 total hours',
      description: 'Track and sum time spent on different project tasks'
    },
    {
      title: 'Manufacturing Shift Time',
      input: '6:45 AM - 3:15 PM (30 min lunch)',
      output: '8.0 working hours',
      description: 'Calculate net working hours excluding break time'
    }
  ],

  useCases: [
    'Calculate payroll for hourly employees with precise decimal hours',
    'Convert timesheet entries from time format to decimal for payroll systems',
    'Legal billing in 6-minute (0.1 hour) increments for law firms',
    'Consulting and freelance work billing with accurate time tracking',
    'Project management time allocation and budget tracking',
    'Manufacturing production time calculations and efficiency metrics',
    'Healthcare shift scheduling and overtime calculations',
    'Academic credit hour calculations and course time requirements',
    'HR time and attendance system integration',
    'Construction and field work time tracking for billing',
    'Call center agent time tracking and performance metrics',
    'Research project time allocation and grant reporting',
    'Event planning time estimation and vendor billing',
    'Maintenance and service work time documentation',
    'Training and certification hour tracking for compliance',
    'Remote work time tracking for distributed teams',
    'Contract work billing with multiple hourly rates',
    'Government contractor time reporting and compliance',
    'Non-profit volunteer hour tracking and reporting',
    'Retail and service industry shift time calculations'
  ],

  commonErrors: [
    'Confusing decimal hours (8.5) with time notation (8:50)',
    'Incorrect rounding for legal billing (should use 6-minute increments)',
    'Not accounting for break time in shift calculations',
    'Using wrong decimal precision for payroll systems',
    'Forgetting overtime rate multipliers in calculations',
    'Mixing 12-hour and 24-hour time formats in batch processing',
    'Not validating time input formats before conversion',
    'Incorrect handling of midnight and noon in 12-hour format',
    'Rounding errors when converting very small time increments',
    'Not considering time zone differences in distributed team calculations'
  ],

  faq: [
    {
      question: 'How do I convert 8:30 to decimal hours?',
      answer: '8:30 means 8 hours and 30 minutes. Since 30 minutes = 0.5 hours (30÷60), the result is 8.5 decimal hours. Use this for payroll and billing systems.'
    },
    {
      question: 'What are legal billing increments and why use them?',
      answer: 'Legal billing uses 6-minute increments (0.1 hour = 6 minutes). This means 1-6 minutes = 0.1 hours, 7-12 minutes = 0.2 hours, etc. This standardizes billing across the legal industry.'
    },
    {
      question: 'How do I calculate overtime pay with decimal hours?',
      answer: 'For hours over 40/week: Regular pay = 40 × hourly rate. Overtime pay = (total hours - 40) × hourly rate × 1.5. Total = regular + overtime pay.'
    },
    {
      question: 'What decimal precision should I use for payroll?',
      answer: 'Most payroll systems use 2 decimal places (8.50 hours). Some use 3 decimals for high precision. Legal billing typically uses 1 decimal (8.5 hours).'
    },
    {
      question: 'How do I handle break time in time calculations?',
      answer: 'Subtract break time from total shift time. Example: 9:00 AM - 5:00 PM = 8 hours, minus 30-minute lunch = 7.5 working hours = 7.50 decimal hours.'
    },
    {
      question: 'Can I convert multiple time entries at once?',
      answer: 'Yes, use batch mode to process multiple entries. Enter each time on a new line (8:30, 7:45, 8:15) and get totals plus individual conversions.'
    },
    {
      question: 'What\'s the difference between rounding modes?',
      answer: 'Standard: normal rounding. Legal: 6-minute increments. Payroll: company-specific rules. Quarter: 15-minute blocks. Tenth: 6-minute blocks.'
    },
    {
      question: 'How do I handle AM/PM time formats?',
      answer: 'Enter times as "8:30 AM" or "2:15 PM". The tool automatically converts to 24-hour format (08:30, 14:15) then to decimal hours.'
    },
    {
      question: 'Can I calculate pay for different hourly rates?',
      answer: 'Yes, enter your hourly rate and the tool calculates total pay automatically. For multiple rates, process each rate category separately.'
    },
    {
      question: 'How accurate are the decimal conversions?',
      answer: 'Conversions are mathematically precise. 1 minute = 0.016667 hours, but display rounds to your chosen precision (1-4 decimal places).'
    }
  ],

  relatedTools: [
    'timestamp-converter',
    'timestamp-formatter',
    'cron-generator',
    'unit-converter',
    'number-base-converter'
  ]
};

export function processTimeDecimal(input: string, config: TimeDecimalConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide time or decimal hours to convert.'
    };
  }

  try {
    let conversions: TimeConversion[] = [];

    if (config.batchMode) {
      const lines = input.split('\n').map(line => line.trim()).filter(Boolean);
      conversions = lines.map(line => convertSingleEntry(line, config));

      // Calculate totals
      const totalDecimal = conversions.reduce((sum, conv) => sum + conv.decimal, 0);
      const totalPay = config.calculatePayroll && config.hourlyRate
        ? totalDecimal * config.hourlyRate
        : undefined;

      return {
        success: true,
        output: formatBatchResults(conversions, totalDecimal, totalPay, config),
        metadata: {
          totalEntries: conversions.length,
          totalDecimalHours: totalDecimal,
          totalPay,
          averageHours: totalDecimal / conversions.length,
          inputFormat: config.inputFormat,
          outputFormat: config.outputFormat,
          precision: config.decimalPrecision
        }
      };
    } else {
      const conversion = convertSingleEntry(input, config);
      conversions = [conversion];

      return {
        success: true,
        output: formatSingleResult(conversion, config),
        metadata: {
          decimalHours: conversion.decimal,
          formattedTime: conversion.formatted,
          totalMinutes: conversion.totalMinutes,
          payrollAmount: conversion.payrollAmount,
          breakdown: conversion.breakdown,
          detectedInputType: conversion.detectedInputType,
          inputFormat: config.inputFormat,
          outputFormat: config.outputFormat,
          precision: config.decimalPrecision
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert time/decimal hours'
    };
  }
}

function convertSingleEntry(input: string, config: TimeDecimalConfig): TimeConversion {
  const trimmed = input.trim();
  let decimal: number;
  let hours: number;
  let minutes: number;
  let seconds: number = 0;
  let detectedInputType: 'time' | 'decimal';

  // Auto-detect input format
  let actualInputFormat = config.inputFormat;
  if (config.inputFormat === 'auto') {
    if (/^\d+\.?\d*$/.test(trimmed)) {
      actualInputFormat = 'decimal';
      detectedInputType = 'decimal';
    } else {
      actualInputFormat = 'time';
      detectedInputType = 'time';
    }
  } else {
    detectedInputType = config.inputFormat as 'time' | 'decimal';
  }

  if (actualInputFormat === 'decimal') {
    // Parse decimal hours
    decimal = parseFloat(trimmed);
    if (isNaN(decimal)) {
      throw new Error(`Invalid decimal number: ${trimmed}`);
    }

    hours = Math.floor(decimal);
    const fractionalHours = decimal - hours;
    minutes = Math.floor(fractionalHours * 60);
    seconds = config.includeSeconds ? Math.floor((fractionalHours * 3600) % 60) : 0;
  } else {
    // Parse time format and preserve original parsed values
    const parsed = parseTimeString(trimmed);
    hours = parsed.hours;
    minutes = parsed.minutes;
    seconds = parsed.seconds;

    decimal = hours + (minutes / 60) + (seconds / 3600);
  }

  // Apply rounding to decimal only (preserve original time components)
  if (config.roundingMode === 'standard' && config.includeSeconds) {
    // Don't round when including seconds in standard mode to preserve precision
    decimal = parseFloat(decimal.toFixed(4)); // Use higher precision for seconds
  } else {
    decimal = applyRounding(decimal, config.roundingMode, config.decimalPrecision);
  }

  // Only recalculate time components if input was decimal
  // For time input, keep the original parsed values to avoid precision loss
  if (actualInputFormat === 'decimal') {
    hours = Math.floor(decimal);
    const fractionalHours = decimal - hours;
    minutes = Math.floor(fractionalHours * 60);
    seconds = config.includeSeconds ? Math.floor((fractionalHours * 3600) % 60) : 0;
  }

  const formatted = formatTime(hours, minutes, seconds, config.timeFormat, config.includeSeconds);
  const totalMinutes = Math.floor(decimal * 60);
  const totalSeconds = Math.floor(decimal * 3600);

  const payrollAmount = config.calculatePayroll && config.hourlyRate
    ? decimal * config.hourlyRate
    : undefined;

  const breakdown = config.showBreakdown
    ? `${hours}h ${minutes}m${config.includeSeconds ? ` ${seconds}s` : ''} = ${decimal.toFixed(config.decimalPrecision)} hours`
    : undefined;

  return {
    input: trimmed,
    decimal,
    formatted,
    hours,
    minutes,
    seconds,
    totalMinutes,
    totalSeconds,
    payrollAmount,
    breakdown,
    detectedInputType
  };
}

function parseTimeString(timeStr: string): { hours: number; minutes: number; seconds: number } {
  // Handle AM/PM format
  let normalized = timeStr.toUpperCase();
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (ampmMatch) {
    hours = parseInt(ampmMatch[1]);
    minutes = parseInt(ampmMatch[2]);
    seconds = ampmMatch[3] ? parseInt(ampmMatch[3]) : 0;
    const ampm = ampmMatch[4];

    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  } else {
    // Handle 24-hour format
    const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1]);
      minutes = parseInt(timeMatch[2]);
      seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    } else {
      throw new Error(`Invalid time format: ${timeStr}. Use formats like 8:30, 14:45, 2:30 PM`);
    }
  }

  if (hours < 0 || hours > 23) throw new Error(`Invalid hours: ${hours}`);
  if (minutes < 0 || minutes > 59) throw new Error(`Invalid minutes: ${minutes}`);
  if (seconds < 0 || seconds > 59) throw new Error(`Invalid seconds: ${seconds}`);

  return { hours, minutes, seconds };
}

function applyRounding(decimal: number, mode: string, precision: number): number {
  switch (mode) {
    case 'legal':
      // Round to 6-minute increments (0.1 hours)
      return Math.round(decimal * 10) / 10;

    case 'payroll':
      // Round to nearest minute
      return Math.round(decimal * 60) / 60;

    case 'quarter':
      // Round to 15-minute increments (0.25 hours)
      return Math.round(decimal * 4) / 4;

    case 'tenth':
      // Round to 6-minute increments (same as legal)
      return Math.round(decimal * 10) / 10;

    case 'standard':
    default:
      return parseFloat(decimal.toFixed(precision));
  }
}

function formatTime(hours: number, minutes: number, seconds: number, format: string, includeSeconds: boolean): string {
  if (format === '12hour') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')}`;
    return includeSeconds
      ? `${timeStr}:${seconds.toString().padStart(2, '0')} ${period}`
      : `${timeStr} ${period}`;
  } else {
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return includeSeconds
      ? `${timeStr}:${seconds.toString().padStart(2, '0')}`
      : timeStr;
  }
}

function formatSingleResult(conversion: TimeConversion, config: TimeDecimalConfig): string {
  let result = '# Time Conversion Result\n\n';

  // Determine smart output format
  let actualOutputFormat = config.outputFormat;
  if (config.outputFormat === 'auto') {
    // Smart output: show the opposite of what was detected as input
    actualOutputFormat = conversion.detectedInputType === 'time' ? 'decimal' : 'time';
  }

  // Show input type detection info
  if (conversion.detectedInputType) {
    const arrow = conversion.detectedInputType === 'time' ? '→ Decimal Hours' : '→ Time Format';
    result += `**Detected**: ${conversion.detectedInputType === 'time' ? 'Time Format' : 'Decimal Hours'} ${arrow}\n\n`;
  }

  if (actualOutputFormat === 'both' || actualOutputFormat === 'decimal') {
    const isMainResult = actualOutputFormat === 'decimal' || (actualOutputFormat === 'both' && conversion.detectedInputType === 'time');
    result += `**${isMainResult ? '✓ ' : ''}Decimal Hours**: ${conversion.decimal.toFixed(config.decimalPrecision)}\n`;
  }

  if (actualOutputFormat === 'both' || actualOutputFormat === 'time') {
    const isMainResult = actualOutputFormat === 'time' || (actualOutputFormat === 'both' && conversion.detectedInputType === 'decimal');
    result += `**${isMainResult ? '✓ ' : ''}Time Format**: ${conversion.formatted}\n`;
  }

  if (config.showBreakdown && conversion.breakdown && actualOutputFormat !== 'time') {
    result += `**Breakdown**: ${conversion.breakdown}\n`;
  }

  result += `\n**Details**:\n`;
  result += `- Hours: ${conversion.hours}\n`;
  result += `- Minutes: ${conversion.minutes}\n`;
  if (config.includeSeconds) {
    result += `- Seconds: ${conversion.seconds}\n`;
  }
  result += `- Total Minutes: ${conversion.totalMinutes}\n`;

  if (conversion.payrollAmount !== undefined) {
    result += `\n**Payroll Calculation**:\n`;
    result += `- Hours: ${conversion.decimal.toFixed(config.decimalPrecision)}\n`;
    result += `- Rate: $${config.hourlyRate!.toFixed(2)}/hour\n`;
    result += `- **Total Pay**: $${conversion.payrollAmount.toFixed(2)}\n`;
  }

  return result;
}

function formatBatchResults(conversions: TimeConversion[], totalDecimal: number, totalPay: number | undefined, config: TimeDecimalConfig): string {
  let result = '# Batch Time Conversion Results\n\n';

  result += '## Individual Conversions\n\n';
  conversions.forEach((conv, index) => {
    result += `**Entry ${index + 1}**: ${conv.input} → ${conv.decimal.toFixed(config.decimalPrecision)} hours`;
    if (conv.payrollAmount !== undefined) {
      result += ` ($${conv.payrollAmount.toFixed(2)})`;
    }
    result += '\n';
  });

  result += `\n## Summary\n\n`;
  result += `**Total Entries**: ${conversions.length}\n`;
  result += `**Total Hours**: ${totalDecimal.toFixed(config.decimalPrecision)}\n`;
  result += `**Average Hours**: ${(totalDecimal / conversions.length).toFixed(config.decimalPrecision)}\n`;

  if (totalPay !== undefined) {
    result += `**Total Pay**: $${totalPay.toFixed(2)}\n`;
    result += `**Average Pay**: $${(totalPay / conversions.length).toFixed(2)}\n`;
  }

  // Formatted time for total
  const totalHours = Math.floor(totalDecimal);
  const totalMinutes = Math.floor((totalDecimal - totalHours) * 60);
  const totalFormatted = formatTime(totalHours, totalMinutes, 0, config.timeFormat, false);
  result += `**Total Time**: ${totalFormatted}\n`;

  return result;
}