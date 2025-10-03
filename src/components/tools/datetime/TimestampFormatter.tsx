import { useState, useEffect, useCallback } from 'react';
import { processTimestampFormatter, type TimestampFormatterConfig, COMMON_TIMEZONES } from '../../../tools/datetime/timestamp-formatter';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard } from '../../../lib/utils';

interface TimestampFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: TimestampFormatterConfig = {
  mode: 'format',
  inputFormat: 'auto',
  outputFormat: 'all',
  inputTimezone: 'UTC',
  outputTimezone: 'UTC',
  customInputFormat: '',
  customOutputFormat: '',
  locale: 'en-US',
  includeMilliseconds: false,
  useUtc: true,
  showRelativeTime: true,
  batchProcessing: false,
};

export function TimestampFormatter({ className = '' }: TimestampFormatterProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'unix' | 'iso' | 'rfc' | 'auto'>('auto');
  const [timezone, setTimezone] = useState('UTC');
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const { addToHistory } = useToolStore();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get list of common timezones
  const timezones = COMMON_TIMEZONES.map(tz => tz.id);

  const parseInput = useCallback((value: string, type: string) => {
    setError('');
    if (!value) {
      setParsedDate(null);
      return;
    }

    try {
      let date: Date;

      switch (type) {
        case 'unix':
          const timestamp = parseInt(value);
          // Handle both seconds and milliseconds
          date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
          break;
        case 'iso':
          date = new Date(value);
          break;
        case 'rfc':
          date = new Date(value);
          break;
        case 'auto':
        default:
          // Auto-detect format
          if (/^\d+$/.test(value)) {
            // Numeric - treat as Unix
            const ts = parseInt(value);
            date = new Date(ts > 9999999999 ? ts : ts * 1000);
          } else {
            date = new Date(value);
          }
      }

      if (isNaN(date.getTime())) {
        setError('Invalid timestamp format');
        setParsedDate(null);
      } else {
        setParsedDate(date);

        // Add to history
        addToHistory({
          toolId: 'timestamp-formatter',
          input: value,
          output: date.toISOString(),
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      setError('Error parsing timestamp');
      setParsedDate(null);
    }
  }, [addToHistory]);

  useEffect(() => {
    parseInput(inputValue, inputType);
  }, [inputValue, inputType, parseInput]);

  const formatToTimezone = (date: Date, tz: string) => {
    try {
      return date.toLocaleString('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return 'Invalid timezone';
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 30) return `${diffDay} days ago`;
    if (diffMonth < 12) return `${diffMonth} months ago`;
    return `${diffYear} years ago`;
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await copyToClipboard(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const displayDate = parsedDate || currentTime;

  const unixSeconds = Math.floor(displayDate.getTime() / 1000);
  const unixMilliseconds = displayDate.getTime();
  const isoString = displayDate.toISOString();
  const rfcString = displayDate.toUTCString();
  const localString = formatToTimezone(displayDate, timezone);
  const relativeTime = parsedDate ? getRelativeTime(parsedDate) : 'Current time';

  const ResultRow = ({ label, value, field }: { label: string; value: string; field: string }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
        <div className="text-sm font-mono text-gray-900 break-all">{value}</div>
      </div>
      <button
        onClick={() => handleCopy(value, field)}
        className="ml-3 p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded transition-colors"
        title="Copy to clipboard"
      >
        {copiedField === field ? (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className={`${className}`}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        marginBottom: 'var(--space-lg)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>Timestamp Formatter</h1>
        </div>

        <div style={{
          padding: 'var(--space-lg)',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 'var(--space-sm)', opacity: 0.9 }}>
            Current Time
          </div>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
            {currentTime.toISOString()}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
              Input Type
            </label>
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value as any)}
              className="form-select"
              style={{ width: '100%' }}
            >
              <option value="auto">Auto-detect format</option>
              <option value="unix">Unix Timestamp (seconds or milliseconds)</option>
              <option value="iso">ISO 8601</option>
              <option value="rfc">RFC 2822</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
              Input Timestamp
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                inputType === 'unix'
                  ? '1609459200 or 1609459200000'
                  : inputType === 'iso'
                  ? '2021-01-01T00:00:00Z'
                  : inputType === 'rfc'
                  ? 'Fri, 01 Jan 2021 00:00:00 GMT'
                  : 'Enter timestamp or leave empty for current time'
              }
              className="form-input"
              style={{ width: '100%', fontFamily: 'var(--font-family-mono)' }}
            />
            {error && (
              <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
              Display Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="form-select"
              style={{ width: '100%' }}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-lg)' }}>
            {parsedDate ? 'Converted Formats' : 'Current Time Formats'}
          </h2>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <ResultRow
              label="Unix Timestamp (seconds)"
              value={unixSeconds.toString()}
              field="unix-sec"
            />
            <ResultRow
              label="Unix Timestamp (milliseconds)"
              value={unixMilliseconds.toString()}
              field="unix-ms"
            />
            <ResultRow
              label="ISO 8601"
              value={isoString}
              field="iso"
            />
            <ResultRow
              label="RFC 2822"
              value={rfcString}
              field="rfc"
            />
            <ResultRow
              label={`Local Time (${timezone})`}
              value={localString}
              field="local"
            />
            <ResultRow
              label="Relative Time"
              value={relativeTime}
              field="relative"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          <button
            onClick={() => {
              setInputValue(unixSeconds.toString());
              setInputType('unix');
            }}
            className="btn btn-outline"
            style={{ justifyContent: 'center' }}
          >
            Use Unix (seconds)
          </button>
          <button
            onClick={() => {
              setInputValue(unixMilliseconds.toString());
              setInputType('unix');
            }}
            className="btn btn-outline"
            style={{ justifyContent: 'center' }}
          >
            Use Unix (ms)
          </button>
          <button
            onClick={() => {
              setInputValue(isoString);
              setInputType('iso');
            }}
            className="btn btn-outline"
            style={{ justifyContent: 'center' }}
          >
            Use ISO 8601
          </button>
          <button
            onClick={() => {
              setInputValue('');
              setParsedDate(null);
              setError('');
            }}
            className="btn btn-outline"
            style={{ justifyContent: 'center' }}
          >
            Clear Input
          </button>
        </div>
      </div>
    </div>
  );
}
