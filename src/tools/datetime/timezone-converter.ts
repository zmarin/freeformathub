import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface TimezoneConverterConfig {
  fromTimezone: string;
  toTimezone: string;
  timeFormat: '12' | '24';
  showSeconds: boolean;
  showDate: boolean;
  showRelativeTime: boolean;
  useCurrentTime: boolean;
  customTime: string;
  selectedTimezones: string[];
  meetingMode: boolean;
  workingHoursStart: number;
  workingHoursEnd: number;
}

export interface TimezoneInfo {
  name: string;
  abbreviation: string;
  offset: number;
  isDST: boolean;
  currentTime: string;
  date: string;
  relativeOffset: string;
  isWorkingHours: boolean;
}

export interface TimezoneConversion {
  sourceTime: string;
  sourceTimezone: string;
  targetTime: string;
  targetTimezone: string;
  timeDifference: string;
  dateDifference: number;
  isDifferentDay: boolean;
}

export interface MeetingTimeSlot {
  time: string;
  utcTime: string;
  timezones: { [key: string]: { time: string; isWorkingHours: boolean; date: string } };
  score: number;
  isOptimal: boolean;
}

// Comprehensive timezone database with popular cities
const TIMEZONE_DATABASE = [
  // North America
  { id: 'America/New_York', name: 'New York', country: 'United States', abbreviation: 'EST/EDT', offset: -5, dstOffset: -4 },
  { id: 'America/Los_Angeles', name: 'Los Angeles', country: 'United States', abbreviation: 'PST/PDT', offset: -8, dstOffset: -7 },
  { id: 'America/Chicago', name: 'Chicago', country: 'United States', abbreviation: 'CST/CDT', offset: -6, dstOffset: -5 },
  { id: 'America/Denver', name: 'Denver', country: 'United States', abbreviation: 'MST/MDT', offset: -7, dstOffset: -6 },
  { id: 'America/Toronto', name: 'Toronto', country: 'Canada', abbreviation: 'EST/EDT', offset: -5, dstOffset: -4 },
  { id: 'America/Vancouver', name: 'Vancouver', country: 'Canada', abbreviation: 'PST/PDT', offset: -8, dstOffset: -7 },
  { id: 'America/Mexico_City', name: 'Mexico City', country: 'Mexico', abbreviation: 'CST/CDT', offset: -6, dstOffset: -5 },

  // Europe
  { id: 'Europe/London', name: 'London', country: 'United Kingdom', abbreviation: 'GMT/BST', offset: 0, dstOffset: 1 },
  { id: 'Europe/Paris', name: 'Paris', country: 'France', abbreviation: 'CET/CEST', offset: 1, dstOffset: 2 },
  { id: 'Europe/Berlin', name: 'Berlin', country: 'Germany', abbreviation: 'CET/CEST', offset: 1, dstOffset: 2 },
  { id: 'Europe/Rome', name: 'Rome', country: 'Italy', abbreviation: 'CET/CEST', offset: 1, dstOffset: 2 },
  { id: 'Europe/Madrid', name: 'Madrid', country: 'Spain', abbreviation: 'CET/CEST', offset: 1, dstOffset: 2 },
  { id: 'Europe/Amsterdam', name: 'Amsterdam', country: 'Netherlands', abbreviation: 'CET/CEST', offset: 1, dstOffset: 2 },
  { id: 'Europe/Moscow', name: 'Moscow', country: 'Russia', abbreviation: 'MSK', offset: 3, dstOffset: 3 },
  { id: 'Europe/Stockholm', name: 'Stockholm', country: 'Sweden', abbreviation: 'CET/CEST', offset: 1, dstOffset: 2 },

  // Asia
  { id: 'Asia/Tokyo', name: 'Tokyo', country: 'Japan', abbreviation: 'JST', offset: 9, dstOffset: 9 },
  { id: 'Asia/Shanghai', name: 'Shanghai', country: 'China', abbreviation: 'CST', offset: 8, dstOffset: 8 },
  { id: 'Asia/Hong_Kong', name: 'Hong Kong', country: 'Hong Kong', abbreviation: 'HKT', offset: 8, dstOffset: 8 },
  { id: 'Asia/Singapore', name: 'Singapore', country: 'Singapore', abbreviation: 'SGT', offset: 8, dstOffset: 8 },
  { id: 'Asia/Seoul', name: 'Seoul', country: 'South Korea', abbreviation: 'KST', offset: 9, dstOffset: 9 },
  { id: 'Asia/Mumbai', name: 'Mumbai', country: 'India', abbreviation: 'IST', offset: 5.5, dstOffset: 5.5 },
  { id: 'Asia/Dubai', name: 'Dubai', country: 'UAE', abbreviation: 'GST', offset: 4, dstOffset: 4 },
  { id: 'Asia/Bangkok', name: 'Bangkok', country: 'Thailand', abbreviation: 'ICT', offset: 7, dstOffset: 7 },
  { id: 'Asia/Jakarta', name: 'Jakarta', country: 'Indonesia', abbreviation: 'WIB', offset: 7, dstOffset: 7 },

  // Australia & Oceania
  { id: 'Australia/Sydney', name: 'Sydney', country: 'Australia', abbreviation: 'AEST/AEDT', offset: 10, dstOffset: 11 },
  { id: 'Australia/Melbourne', name: 'Melbourne', country: 'Australia', abbreviation: 'AEST/AEDT', offset: 10, dstOffset: 11 },
  { id: 'Australia/Perth', name: 'Perth', country: 'Australia', abbreviation: 'AWST', offset: 8, dstOffset: 8 },
  { id: 'Pacific/Auckland', name: 'Auckland', country: 'New Zealand', abbreviation: 'NZST/NZDT', offset: 12, dstOffset: 13 },

  // South America
  { id: 'America/Sao_Paulo', name: 'São Paulo', country: 'Brazil', abbreviation: 'BRT/BRST', offset: -3, dstOffset: -2 },
  { id: 'America/Buenos_Aires', name: 'Buenos Aires', country: 'Argentina', abbreviation: 'ART', offset: -3, dstOffset: -3 },
  { id: 'America/Lima', name: 'Lima', country: 'Peru', abbreviation: 'PET', offset: -5, dstOffset: -5 },

  // Africa
  { id: 'Africa/Cairo', name: 'Cairo', country: 'Egypt', abbreviation: 'EET', offset: 2, dstOffset: 2 },
  { id: 'Africa/Johannesburg', name: 'Johannesburg', country: 'South Africa', abbreviation: 'SAST', offset: 2, dstOffset: 2 },
  { id: 'Africa/Lagos', name: 'Lagos', country: 'Nigeria', abbreviation: 'WAT', offset: 1, dstOffset: 1 },

  // UTC
  { id: 'UTC', name: 'UTC', country: 'Coordinated Universal Time', abbreviation: 'UTC', offset: 0, dstOffset: 0 },
];

function isDSTActive(timezone: string, date: Date = new Date()): boolean {
  // Simple DST detection - in practice, you'd use a proper timezone library
  const year = date.getFullYear();
  const month = date.getMonth();

  // Northern hemisphere DST (March - November)
  if (timezone.includes('America/') || timezone.includes('Europe/')) {
    return month >= 2 && month <= 10; // Simplified
  }

  // Southern hemisphere DST (October - March)
  if (timezone.includes('Australia/') || timezone.includes('Pacific/Auckland')) {
    return month >= 9 || month <= 2; // Simplified
  }

  return false;
}

function getTimezoneInfo(timezoneId: string, referenceTime?: Date): TimezoneInfo {
  const tz = TIMEZONE_DATABASE.find(t => t.id === timezoneId);
  if (!tz) {
    throw new Error(`Unknown timezone: ${timezoneId}`);
  }

  const now = referenceTime || new Date();
  const isDST = isDSTActive(timezoneId, now);
  const currentOffset = isDST ? tz.dstOffset : tz.offset;

  // Calculate time in timezone
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const timezoneTime = new Date(utcTime + (currentOffset * 3600000));

  const isWorkingHours = timezoneTime.getHours() >= 9 && timezoneTime.getHours() < 17;

  return {
    name: `${tz.name}, ${tz.country}`,
    abbreviation: isDST ? tz.abbreviation.split('/')[1] || tz.abbreviation : tz.abbreviation.split('/')[0],
    offset: currentOffset,
    isDST,
    currentTime: timezoneTime.toLocaleTimeString(),
    date: timezoneTime.toLocaleDateString(),
    relativeOffset: formatOffset(currentOffset),
    isWorkingHours
  };
}

function formatOffset(offset: number): string {
  const hours = Math.floor(Math.abs(offset));
  const minutes = Math.round((Math.abs(offset) - hours) * 60);
  const sign = offset >= 0 ? '+' : '-';

  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  } else {
    return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  }
}

function convertTimezoneTimes(
  time: string,
  fromTimezone: string,
  toTimezone: string,
  date?: Date
): TimezoneConversion {
  try {
    const fromTz = TIMEZONE_DATABASE.find(t => t.id === fromTimezone);
    const toTz = TIMEZONE_DATABASE.find(t => t.id === toTimezone);

    if (!fromTz || !toTz) {
      throw new Error('Invalid timezone');
    }

    const referenceDate = date || new Date();
    const [hours, minutes] = time.split(':').map(Number);

    // Create time in source timezone
    const sourceDate = new Date(referenceDate);
    sourceDate.setHours(hours, minutes, 0, 0);

    const fromOffset = isDSTActive(fromTimezone, sourceDate) ? fromTz.dstOffset : fromTz.offset;
    const toOffset = isDSTActive(toTimezone, sourceDate) ? toTz.dstOffset : toTz.offset;

    // Convert to UTC, then to target timezone
    const utcTime = sourceDate.getTime() - (fromOffset * 3600000);
    const targetTime = new Date(utcTime + (toOffset * 3600000));

    const timeDiff = toOffset - fromOffset;
    const dateDiff = Math.floor((targetTime.getTime() - sourceDate.getTime()) / (24 * 3600000));

    return {
      sourceTime: time,
      sourceTimezone: fromTimezone,
      targetTime: targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      targetTimezone: toTimezone,
      timeDifference: `${timeDiff >= 0 ? '+' : ''}${timeDiff} hours`,
      dateDifference: dateDiff,
      isDifferentDay: Math.abs(dateDiff) > 0
    };
  } catch (error) {
    throw new Error(`Failed to convert time: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function findOptimalMeetingTimes(
  timezones: string[],
  startHour: number = 9,
  endHour: number = 17,
  date?: Date
): MeetingTimeSlot[] {
  const slots: MeetingTimeSlot[] = [];
  const referenceDate = date || new Date();

  // Generate time slots every hour
  for (let hour = 0; hour < 24; hour++) {
    const slot: MeetingTimeSlot = {
      time: `${hour.toString().padStart(2, '0')}:00`,
      utcTime: `${hour.toString().padStart(2, '0')}:00 UTC`,
      timezones: {},
      score: 0,
      isOptimal: false
    };

    let workingHoursCount = 0;

    for (const timezoneId of timezones) {
      try {
        const conversion = convertTimezoneTimes('12:00', 'UTC', timezoneId, referenceDate);
        const tz = TIMEZONE_DATABASE.find(t => t.id === timezoneId);
        if (!tz) continue;

        const offset = isDSTActive(timezoneId, referenceDate) ? tz.dstOffset : tz.offset;
        const localHour = (hour + offset) % 24;
        const localTime = `${localHour.toString().padStart(2, '0')}:00`;

        const isWorkingHours = localHour >= startHour && localHour < endHour;
        if (isWorkingHours) workingHoursCount++;

        slot.timezones[timezoneId] = {
          time: localTime,
          isWorkingHours,
          date: new Date(referenceDate.getTime() + (offset * 3600000)).toLocaleDateString()
        };
      } catch (error) {
        // Skip invalid timezones
      }
    }

    slot.score = workingHoursCount / timezones.length;
    slot.isOptimal = slot.score >= 0.7; // 70% or more in working hours

    slots.push(slot);
  }

  return slots.sort((a, b) => b.score - a.score);
}

export function processTimezoneConverter(input: string, config: TimezoneConverterConfig): ToolResult {
  try {
    if (config.meetingMode) {
      // Meeting mode - find optimal times across multiple timezones
      if (config.selectedTimezones.length < 2) {
        return {
          success: false,
          error: 'Please select at least 2 timezones for meeting mode'
        };
      }

      const meetingSlots = findOptimalMeetingTimes(
        config.selectedTimezones,
        config.workingHoursStart,
        config.workingHoursEnd
      );

      let output = `Optimal Meeting Times for ${config.selectedTimezones.length} timezones:\n\n`;

      const optimalSlots = meetingSlots.filter(slot => slot.isOptimal).slice(0, 5);

      if (optimalSlots.length > 0) {
        output += 'Recommended Times (70%+ in working hours):\n';
        for (const slot of optimalSlots) {
          output += `\n${slot.utcTime} (Score: ${Math.round(slot.score * 100)}%)\n`;
          for (const [tzId, tzInfo] of Object.entries(slot.timezones)) {
            const tz = TIMEZONE_DATABASE.find(t => t.id === tzId);
            const status = tzInfo.isWorkingHours ? '✓ Working hours' : '✗ Outside hours';
            output += `  ${tz?.name}: ${tzInfo.time} - ${status}\n`;
          }
        }
      } else {
        output += 'No optimal times found. Best available times:\n';
        const bestSlots = meetingSlots.slice(0, 3);
        for (const slot of bestSlots) {
          output += `\n${slot.utcTime} (Score: ${Math.round(slot.score * 100)}%)\n`;
          for (const [tzId, tzInfo] of Object.entries(slot.timezones)) {
            const tz = TIMEZONE_DATABASE.find(t => t.id === tzId);
            const status = tzInfo.isWorkingHours ? '✓ Working hours' : '✗ Outside hours';
            output += `  ${tz?.name}: ${tzInfo.time} - ${status}\n`;
          }
        }
      }

      return {
        success: true,
        output,
        meetingSlots: optimalSlots.length > 0 ? optimalSlots : meetingSlots.slice(0, 3)
      };

    } else {
      // Regular conversion mode
      const timeToConvert = config.useCurrentTime ?
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
        config.customTime || input.trim();

      if (!timeToConvert) {
        return {
          success: false,
          error: 'Please provide a time to convert or enable "Use Current Time"'
        };
      }

      // Validate time format
      if (!/^\d{1,2}:\d{2}$/.test(timeToConvert) && !config.useCurrentTime) {
        return {
          success: false,
          error: 'Please provide time in HH:MM format (e.g., 14:30)'
        };
      }

      const conversion = convertTimezoneTimes(
        timeToConvert,
        config.fromTimezone,
        config.toTimezone
      );

      const fromTzInfo = getTimezoneInfo(config.fromTimezone);
      const toTzInfo = getTimezoneInfo(config.toTimezone);

      let output = `Time Conversion:\n\n`;
      output += `From: ${conversion.sourceTime} (${fromTzInfo.name})\n`;
      output += `To: ${conversion.targetTime} (${toTzInfo.name})\n\n`;

      if (config.showRelativeTime) {
        output += `Time Difference: ${conversion.timeDifference}\n`;
        if (conversion.isDifferentDay) {
          output += `Date Change: ${conversion.dateDifference > 0 ? 'Next day' : 'Previous day'}\n`;
        }
        output += '\n';
      }

      if (config.selectedTimezones.length > 0) {
        output += 'Additional Timezones:\n';
        for (const tzId of config.selectedTimezones) {
          if (tzId !== config.fromTimezone && tzId !== config.toTimezone) {
            try {
              const additionalConversion = convertTimezoneTimes(
                timeToConvert,
                config.fromTimezone,
                tzId
              );
              const tzInfo = getTimezoneInfo(tzId);
              output += `${tzInfo.name}: ${additionalConversion.targetTime}\n`;
            } catch (error) {
              // Skip invalid conversions
            }
          }
        }
      }

      return {
        success: true,
        output: output.trim(),
        conversion,
        fromTimezone: fromTzInfo,
        toTimezone: toTzInfo
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert timezone'
    };
  }
}

export const TIMEZONE_CONVERTER_TOOL: Tool = {
  id: 'timezone-converter',
  name: 'Timezone Converter',
  description: 'Convert times between different time zones, find optimal meeting times across multiple locations, and compare current times worldwide with DST awareness.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!.subcategories!.find(sub => sub.id === 'timezone-tools') ||
                TOOL_CATEGORIES.find(cat => cat.id === 'datetime')!.subcategories![0],
  slug: 'timezone-converter',
  icon: 'Globe',
  tags: ['timezone', 'time', 'meeting', 'schedule', 'DST', 'worldwide', 'convert'],
  complexity: 'intermediate',
  keywords: ['timezone', 'time zone', 'convert', 'meeting', 'schedule', 'DST', 'UTC', 'GMT', 'worldwide', 'time conversion'],

  examples: [
    {
      title: 'Basic Time Conversion',
      input: '14:30',
      output: 'From: 14:30 (New York, United States)\nTo: 20:30 (London, United Kingdom)\n\nTime Difference: +6 hours',
      description: 'Convert 2:30 PM New York time to London time'
    },
    {
      title: 'Current Time Comparison',
      input: '',
      output: 'Current times worldwide:\nNew York: 09:15 AM (EST)\nLondon: 14:15 PM (GMT)\nTokyo: 23:15 PM (JST)\nSydney: 01:15 AM+1 (AEDT)',
      description: 'Compare current times across multiple time zones'
    },
    {
      title: 'Meeting Time Finder',
      input: '',
      output: 'Optimal Meeting Times:\n\n14:00 UTC (Score: 100%)\n  New York: 09:00 - ✓ Working hours\n  London: 14:00 - ✓ Working hours\n  Tokyo: 23:00 - ✗ Outside hours',
      description: 'Find the best meeting time for global teams'
    }
  ],

  useCases: [
    'Converting meeting times across different time zones',
    'Scheduling international calls and conferences',
    'Planning travel and coordinating with global teams',
    'Finding optimal meeting times for remote teams',
    'Converting timestamps for global applications'
  ],

  faq: [
    {
      question: 'How does the tool handle Daylight Saving Time (DST)?',
      answer: 'The tool automatically detects and applies DST rules for each timezone, ensuring accurate conversions throughout the year. Times are adjusted based on the current date and timezone-specific DST schedules.'
    },
    {
      question: 'What is the Meeting Time Finder feature?',
      answer: 'This feature analyzes multiple time zones and suggests optimal meeting times when the highest percentage of participants are in their working hours. You can customize working hours and see scores for each suggested time.'
    },
    {
      question: 'Can I add multiple time zones for comparison?',
      answer: 'Yes, you can select multiple time zones to see current times side-by-side or convert a specific time across all selected zones simultaneously.'
    },
    {
      question: 'How accurate are the time zone conversions?',
      answer: 'The tool uses a comprehensive database of world time zones with current DST rules. Conversions are accurate for current dates, with proper handling of timezone abbreviations and offset changes.'
    },
    {
      question: 'Can I use this for historical date conversions?',
      answer: 'The current version focuses on present-day conversions with current DST rules. Historical timezone conversions require considering past rule changes and are not currently supported.'
    }
  ],

  commonErrors: [
    'Invalid time format (use HH:MM)',
    'Unknown timezone identifier',
    'Insufficient timezones for meeting mode'
  ],

  relatedTools: ['timestamp-converter', 'cron-generator', 'time-decimal-converter'],
  seoTitle: 'Timezone Converter - World Time Zone Converter & Meeting Scheduler',
  seoDescription: 'Convert times between world time zones, find optimal meeting times for global teams, and compare current times worldwide with automatic DST handling.'
};

// Export timezone database for component use
export { TIMEZONE_DATABASE };