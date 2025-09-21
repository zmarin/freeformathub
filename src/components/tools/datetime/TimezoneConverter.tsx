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
    <div className={`w-full h-full ${className}`}>
      {/* Stylish Timezone Converter Container */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 p-6 rounded-2xl shadow-xl h-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg h-full overflow-y-auto">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🌍 Timezone Calculator</h1>
            <p className="text-gray-600">Convert times across different time zones instantly</p>
          </div>

          {/* Current Time Display */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </div>
              <div className="text-sm text-gray-600">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
            </div>
          </div>
          {/* Amount Input */}
          <div className="mb-4">
            <label className="block font-medium text-gray-700 mb-2">Time Input</label>
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={config.useCurrentTime ? 'Using current time...' : 'Enter time in HH:MM format'}
              disabled={config.useCurrentTime}
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-300 bg-white shadow-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Process input
                }
              }}
            />
          </div>

          {/* Timezone Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* From Timezone */}
            <div>
              <label className="block font-medium text-gray-700 mb-2">From Timezone</label>
              <select
                value={config.fromTimezone}
                onChange={(e) => setFromTimezone(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-300 bg-white cursor-pointer shadow-sm"
              >
                {TIMEZONE_DATABASE.map(tz => (
                  <option key={tz.id} value={tz.id}>
                    {tz.name}, {tz.country}
                  </option>
                ))}
              </select>
            </div>

            {/* To Timezone */}
            <div>
              <label className="block font-medium text-gray-700 mb-2">To Timezone</label>
              <select
                value={config.toTimezone}
                onChange={(e) => setToTimezone(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-300 bg-white cursor-pointer shadow-sm"
              >
                {TIMEZONE_DATABASE.map(tz => (
                  <option key={tz.id} value={tz.id}>
                    {tz.name}, {tz.country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Selection Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <button
              onClick={() => setConfig({ ...config, meetingMode: false, useCurrentTime: true })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                !config.meetingMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:ring-gray-500'
              }`}
            >
              Convert Time
            </button>
            <button
              onClick={() => setConfig({ ...config, meetingMode: true })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                config.meetingMode
                  ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:ring-gray-500'
              }`}
            >
              Meeting Finder
            </button>
            <button
              onClick={() => setConfig({ ...config, useCurrentTime: !config.useCurrentTime })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                config.useCurrentTime
                  ? 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:ring-gray-500'
              }`}
            >
              {config.useCurrentTime ? 'Use Custom Time' : 'Use Current Time'}
            </button>
          </div>

          {/* Convert Button */}
          <button
            onClick={() => {
              const currentInput = config.useCurrentTime ?
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                input;
              debouncedProcess(currentInput, config);
            }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md focus:outline-none"
          >
            {config.meetingMode ? 'Find Best Meeting Time' : 'Convert Time'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-center text-sm">{error}</p>
            </div>
          )}

          {/* Result Display */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg min-h-[100px] flex flex-col justify-center items-center shadow-inner">
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Converting...</span>
              </div>
            ) : output ? (
              <div className="text-center w-full">
                <div className="text-lg font-bold text-blue-600 mb-2">Conversion Result:</div>
                <div className="text-gray-600 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {output}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                <div className="text-sm">
                  {config.meetingMode ? 'Select timezones and click Find Best Meeting Time' : 'Enter a time and click Convert'}
                </div>
              </div>
            )}
          </div>

          {/* Additional Timezones */}
          {config.selectedTimezones.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-700 mb-3">Current Times in Selected Timezones:</h4>
              <div className="grid grid-cols-1 gap-2">
                {config.selectedTimezones.map(tzId => (
                  <div key={tzId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{getTimezoneDisplay(tzId)}</span>
                    <span className="font-mono text-blue-600">
                      {currentTimes[tzId] || 'Loading...'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
