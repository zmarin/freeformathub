import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import {
  processTimezoneConverter,
  type TimezoneConverterConfig,
  TIMEZONE_DATABASE
} from '../../../tools/datetime/timezone-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface TimezoneConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: TimezoneConverterConfig = {
  fromTimezone: 'America/New_York',
  toTimezone: 'Europe/London',
  timeFormat: '24',
  showSeconds: false,
  showDate: true,
  showRelativeTime: true,
  useCurrentTime: true,
  customTime: '09:00',
  selectedTimezones: ['America/New_York', 'Europe/London', 'Asia/Tokyo'],
  meetingMode: false,
  workingHoursStart: 9,
  workingHoursEnd: 17,
};

const TIME_FORMAT_OPTIONS = [
  { value: '12', label: '12-hour (AM/PM)' },
  { value: '24', label: '24-hour' },
];

const WORKING_HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00`
}));

const POPULAR_TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC'
];

const OPTIONS = [
  {
    key: 'meetingMode',
    label: 'Meeting Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Find optimal meeting times across multiple timezones',
  },
  {
    key: 'useCurrentTime',
    label: 'Use Current Time',
    type: 'boolean' as const,
    default: true,
    description: 'Convert current time instead of custom time',
  },
  {
    key: 'timeFormat',
    label: 'Time Format',
    type: 'select' as const,
    default: '24',
    options: TIME_FORMAT_OPTIONS,
    description: 'Display format for times',
  },
  {
    key: 'showRelativeTime',
    label: 'Show Time Difference',
    type: 'boolean' as const,
    default: true,
    description: 'Display relative time differences between zones',
  },
  {
    key: 'showDate',
    label: 'Show Date',
    type: 'boolean' as const,
    default: true,
    description: 'Include date information in output',
  },
  {
    key: 'workingHoursStart',
    label: 'Working Hours Start',
    type: 'select' as const,
    default: 9,
    options: WORKING_HOURS_OPTIONS,
    description: 'Start of working hours for meeting mode',
  },
  {
    key: 'workingHoursEnd',
    label: 'Working Hours End',
    type: 'select' as const,
    default: 17,
    options: WORKING_HOURS_OPTIONS,
    description: 'End of working hours for meeting mode',
  },
];

export function TimezoneConverter({ className = '' }: TimezoneConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<TimezoneConverterConfig>(DEFAULT_CONFIG);
  const [currentTimes, setCurrentTimes] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTimezones, setFilteredTimezones] = useState(TIMEZONE_DATABASE);

  const { addToHistory } = useToolStore();

  // Filter timezones based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTimezones(TIMEZONE_DATABASE);
    } else {
      const filtered = TIMEZONE_DATABASE.filter(tz =>
        tz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTimezones(filtered);
    }
  }, [searchTerm]);

  // Update current times every second
  useEffect(() => {
    const updateCurrentTimes = () => {
      const times: { [key: string]: string } = {};
      config.selectedTimezones.forEach(tzId => {
        try {
          const tz = TIMEZONE_DATABASE.find(t => t.id === tzId);
          if (tz) {
            const now = new Date();
            // Simple timezone offset calculation
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const tzTime = new Date(utc + (tz.offset * 3600000));
            times[tzId] = tzTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: config.showSeconds ? '2-digit' : undefined,
              hour12: config.timeFormat === '12'
            });
          }
        } catch (error) {
          times[tzId] = 'Error';
        }
      });
      setCurrentTimes(times);
    };

    updateCurrentTimes();
    const interval = setInterval(updateCurrentTimes, 1000);
    return () => clearInterval(interval);
  }, [config.selectedTimezones, config.showSeconds, config.timeFormat]);

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: TimezoneConverterConfig) => {
      setIsLoading(true);

      setTimeout(() => {
        try {
          const result = processTimezoneConverter(text, cfg);

          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);

            addToHistory({
              toolId: 'timezone-converter',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to convert timezone');
        }

        setIsLoading(false);
      }, 200);
    }, 400),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: TimezoneConverterConfig) => {
    setConfig(newConfig);
  };

  const addTimezone = (timezoneId: string) => {
    if (!config.selectedTimezones.includes(timezoneId)) {
      setConfig({
        ...config,
        selectedTimezones: [...config.selectedTimezones, timezoneId]
      });
    }
  };

  const removeTimezone = (timezoneId: string) => {
    setConfig({
      ...config,
      selectedTimezones: config.selectedTimezones.filter(id => id !== timezoneId)
    });
  };

  const setFromTimezone = (timezoneId: string) => {
    setConfig({ ...config, fromTimezone: timezoneId });
  };

  const setToTimezone = (timezoneId: string) => {
    setConfig({ ...config, toTimezone: timezoneId });
  };

  const insertCurrentTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    setInput(timeString);
    setConfig({ ...config, useCurrentTime: false });
  };

  const getTimezoneDisplay = (tzId: string) => {
    const tz = TIMEZONE_DATABASE.find(t => t.id === tzId);
    return tz ? `${tz.name}, ${tz.country}` : tzId;
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={config.meetingMode ? 'Meeting Scheduler' : 'Time Input'}
          placeholder={config.meetingMode ?
            'Meeting mode enabled - select timezones below and find optimal meeting times' :
            config.useCurrentTime ?
              'Using current time - disable "Use Current Time" to enter custom time' :
              'Enter time in HH:MM format (e.g., 14:30, 09:15)'}
          syntax="text"
          disabled={config.useCurrentTime || config.meetingMode}
          examples={[
            {
              title: 'Morning Meeting',
              value: '09:00',
            },
            {
              title: 'Lunch Time',
              value: '12:30',
            },
            {
              title: 'End of Day',
              value: '17:00',
            },
          ]}
        />

        {/* Mode Selection */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setConfig({ ...config, meetingMode: false, useCurrentTime: true })}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                !config.meetingMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:ring-gray-500'
              }`}
            >
              Convert Time
            </button>
            <button
              onClick={() => setConfig({ ...config, meetingMode: true })}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                config.meetingMode
                  ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:ring-gray-500'
              }`}
            >
              Meeting Finder
            </button>
          </div>

          {!config.meetingMode && (
            <div className="space-y-4">
              {/* From/To Timezone Selection */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Timezone:
                  </label>
                  <select
                    value={config.fromTimezone}
                    onChange={(e) => setFromTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {TIMEZONE_DATABASE.map(tz => (
                      <option key={tz.id} value={tz.id}>
                        {tz.name}, {tz.country} ({tz.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Timezone:
                  </label>
                  <select
                    value={config.toTimezone}
                    onChange={(e) => setToTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {TIMEZONE_DATABASE.map(tz => (
                      <option key={tz.id} value={tz.id}>
                        {tz.name}, {tz.country} ({tz.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!config.useCurrentTime && (
                <button
                  onClick={insertCurrentTime}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Insert Current Time
                </button>
              )}
            </div>
          )}

          {/* Timezone Search and Selection */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {config.meetingMode ? 'Select Timezones for Meeting:' : 'Additional Timezones:'}
              </label>
              <span className="text-xs text-gray-500">
                {config.selectedTimezones.length} selected
              </span>
            </div>

            <input
              type="text"
              placeholder="Search cities or countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            />

            {/* Popular Timezones */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Popular:</div>
              <div className="flex flex-wrap gap-1">
                {POPULAR_TIMEZONES.map(tzId => {
                  const tz = TIMEZONE_DATABASE.find(t => t.id === tzId);
                  const isSelected = config.selectedTimezones.includes(tzId);
                  return (
                    <button
                      key={tzId}
                      onClick={() => isSelected ? removeTimezone(tzId) : addTimezone(tzId)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {tz?.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtered Timezone List */}
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              {filteredTimezones.slice(0, 10).map(tz => {
                const isSelected = config.selectedTimezones.includes(tz.id);
                return (
                  <button
                    key={tz.id}
                    onClick={() => isSelected ? removeTimezone(tz.id) : addTimezone(tz.id)}
                    className={`w-full px-3 py-2 text-left text-sm border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{tz.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {tz.country} • {tz.abbreviation}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Timezones with Current Times */}
          {config.selectedTimezones.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Times:
              </div>
              <div className="space-y-2">
                {config.selectedTimezones.map(tzId => (
                  <div key={tzId} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getTimezoneDisplay(tzId)}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-blue-600 dark:text-blue-400">
                        {currentTimes[tzId] || 'Loading...'}
                      </span>
                      <button
                        onClick={() => removeTimezone(tzId)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove timezone"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Output Panel */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label={config.meetingMode ? 'Meeting Schedule' : 'Timezone Conversion'}
        syntax="text"
        downloadFilename="timezone-conversion.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}