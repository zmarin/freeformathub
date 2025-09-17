import { useState, useEffect, useMemo, useCallback } from 'react';
import { processTimeDecimal, type TimeDecimalConfig } from '../../../tools/datetime/time-decimal-converter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface TimeDecimalConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: TimeDecimalConfig = {
  inputFormat: 'auto',
  outputFormat: 'auto',
  decimalPrecision: 2,
  roundingMode: 'standard',
  timeFormat: '24hour',
  includeSeconds: false,
  calculatePayroll: false,
  batchMode: false,
  showBreakdown: true,
};

// Quick conversion examples
const QUICK_CONVERSIONS = [
  { label: '8:30 → 8.5', input: '8:30', description: 'Standard work day start time' },
  { label: '7:45 → 7.75', input: '7:45', description: 'Common shift duration' },
  { label: '2:15 → 2.25', input: '2:15', description: 'Meeting or task time' },
  { label: '0:30 → 0.5', input: '0:30', description: 'Half hour break' },
  { label: '1:15 → 1.25', input: '1:15', description: 'Short project time' },
  { label: '12:00 → 12.0', input: '12:00', description: 'Full shift' },
];

const DECIMAL_TO_TIME = [
  { label: '8.5 → 8:30', input: '8.5', description: 'Payroll decimal to time' },
  { label: '7.75 → 7:45', input: '7.75', description: 'Timesheet entry conversion' },
  { label: '2.25 → 2:15', input: '2.25', description: 'Meeting duration conversion' },
  { label: '0.5 → 0:30', input: '0.5', description: 'Half hour break time' },
  { label: '14.5 → 2:30 PM', input: '14.5', description: 'Decimal to 12-hour format', config: { timeFormat: '12hour' } },
  { label: '40.0 → 40:00', input: '40.0', description: 'Weekly total hours' },
];

const COMMON_EXAMPLES = [
  {
    title: 'Daily Timesheet',
    value: 'Monday: 8:15\nTuesday: 7:45\nWednesday: 8:30\nThursday: 8:00\nFriday: 7:30',
    batch: true
  },
  {
    title: 'Legal Billing',
    value: '2:23',
    description: 'Rounds to 2.4 hours (6-min increments)'
  },
  {
    title: 'Project Tasks',
    value: 'Task A: 2:15\nTask B: 1:45\nTask C: 3:30',
    batch: true
  },
  {
    title: 'Consulting Hours',
    value: '4:45',
    description: 'Client billing calculation'
  },
  {
    title: 'Manufacturing Shift',
    value: '7:30',
    description: 'Production time tracking'
  },
  {
    title: 'Overtime Week',
    value: '8:30\n8:15\n9:00\n8:45\n8:30\n4:00',
    batch: true
  }
];

export function TimeDecimalConverter({ className = '' }: TimeDecimalConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<TimeDecimalConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('time-decimal-converter') as Partial<TimeDecimalConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process time function
  const processTime = useCallback((inputText: string = input, cfg: TimeDecimalConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const result = processTimeDecimal(inputText, cfg);

    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);

      // Add to history for successful operations
      addToHistory({
        toolId: 'time-decimal-converter',
        input: inputText,
        output: result.output || '',
        config: cfg,
        timestamp: Date.now(),
      });
    } else {
      setOutput('');
      setError(result.error);
      setMetadata(undefined);
    }

    setIsLoading(false);
  }, [input, config, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processTime, 300),
    [processTime]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      setConfig(prev => ({ ...prev, batchMode: true }));
      if (autoFormat) {
        processTime(content, { ...config, batchMode: true });
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, config, processTime]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [output]);

  // Download handler
  const handleDownload = useCallback(() => {
    const filename = config.batchMode ? 'timesheet-conversion.txt' : 'time-conversion.txt';
    downloadFile(output, filename, 'text/plain');
  }, [output, config.batchMode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: Partial<TimeDecimalConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    try { updateSavedConfig?.('time-decimal-converter', updatedConfig); } catch {}

    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processTime(input, updatedConfig);
  };

  // Quick action handlers
  const handleQuickConversion = useCallback((value: string, batch: boolean = false, configOverride?: Partial<TimeDecimalConfig>) => {
    setInput(value);
    const newConfig = { ...config, ...(configOverride || {}), batchMode: batch };

    // Apply config changes if provided
    if (configOverride) {
      handleConfigChange({ ...configOverride, batchMode: batch });
    } else if (batch !== config.batchMode) {
      handleConfigChange({ batchMode: batch });
    }

    if (autoFormat) {
      processTime(value, newConfig);
    }
  }, [config, autoFormat, processTime, handleConfigChange]);

  // Toggle payroll calculation
  const togglePayroll = useCallback(() => {
    handleConfigChange({ calculatePayroll: !config.calculatePayroll });
  }, [config.calculatePayroll, handleConfigChange]);

  // Swap input/output functionality
  const handleSwap = useCallback(() => {
    if (!metadata || !output) return;

    // Extract the converted value based on detected input type
    let swapValue = '';
    if (metadata.detectedInputType === 'time') {
      // Input was time, output was decimal, so use decimal value
      swapValue = metadata.decimalHours?.toFixed(config.decimalPrecision) || '';
    } else {
      // Input was decimal, output was time, so use time value
      swapValue = metadata.formattedTime || '';
    }

    if (swapValue) {
      setInput(swapValue);
      if (autoFormat) {
        processTime(swapValue, config);
      }
    }
  }, [metadata, output, config, autoFormat, processTime]);

  // Calculate text statistics
  const getTextStats = (text: string) => {
    if (!text) return { chars: 0, words: 0, lines: 0 };
    return {
      chars: text.length,
      words: text.trim().split(/\s+/).filter(w => w.length > 0).length,
      lines: text.split('\n').length,
    };
  };

  const inputStats = getTextStats(input);
  const outputStats = getTextStats(output);

  return (
    <div className={`${className}`}>
      {/* Header Controls */}
      <div style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', alignItems: 'center' }}>
            <span>Input: <strong>{inputStats.lines} entries</strong></span>
            {metadata?.totalDecimalHours && (
              <span>Total: <strong>{metadata.totalDecimalHours.toFixed(config.decimalPrecision)}h</strong></span>
            )}
            {metadata?.totalPay && (
              <span>Pay: <strong>${metadata.totalPay.toFixed(2)}</strong></span>
            )}
            {error ? (
              <span className="status-indicator status-invalid">✗ Error</span>
            ) : output ? (
              <span className="status-indicator status-valid">✓ Converted</span>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={config.batchMode}
                onChange={(e) => handleConfigChange({ batchMode: e.target.checked })}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Batch Mode
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={autoFormat}
                onChange={(e) => setAutoFormat(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Auto-convert
            </label>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        minHeight: '500px'
      }} className="lg:grid-cols-1">

        {/* Left Side - Input/Output */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Input Section */}
          <div style={{ flex: 1, borderRight: '1px solid var(--color-border)' }} className="lg:border-r-0 lg:border-b lg:border-b-gray-200">
            <div style={{
              backgroundColor: 'var(--color-surface-secondary)',
              borderBottom: '1px solid var(--color-border)',
              padding: 'var(--space-lg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {config.batchMode ? 'Time Entries (one per line)' : 'Time or Decimal Hours'}
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setInput(text);
                  } catch (error) {
                    console.warn('Failed to paste from clipboard');
                  }
                }} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  Paste
                </button>
                <label className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  Upload
                  <input
                    type="file"
                    accept=".txt,.csv,.tsv"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                </label>
                {input && (
                  <button onClick={() => setInput('')} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div
              style={{ position: 'relative', height: '250px' }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.batchMode
                  ? "Enter time entries (one per line):\n8:30\n7:45\n8:15\n\nOr decimal hours:\n8.5\n7.75\n8.25"
                  : "Enter time (8:30, 2:15 PM) or decimal hours (8.5, 2.25)..."
                }
                className="form-textarea"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 0,
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'none',
                  padding: 'var(--space-lg)'
                }}
                spellCheck={false}
              />
              {dragActive && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)'
                }}>
                  Drop timesheet file here
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: 'var(--color-surface-secondary)',
              borderBottom: '1px solid var(--color-border)',
              padding: 'var(--space-lg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Conversion Results
              </span>
              {output && (
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  {metadata?.detectedInputType && !config.batchMode && (
                    <button
                      onClick={handleSwap}
                      className="btn btn-outline"
                      style={{
                        padding: 'var(--space-xs) var(--space-sm)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-xs)'
                      }}
                      title="Use result as new input"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                      </svg>
                      ⇄ Swap
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    className={copied ? 'btn btn-secondary' : 'btn btn-outline'}
                    style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={copied ? "M9 12l2 2 4-4" : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"}/>
                    </svg>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={handleDownload} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    </svg>
                    Download
                  </button>
                </div>
              )}
            </div>

            <div style={{ height: '250px', position: 'relative' }}>
              {error ? (
                <div style={{
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-danger-light)',
                  color: 'var(--color-danger)',
                  borderRadius: 'var(--radius-lg)',
                  margin: 'var(--space-lg)',
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  <strong>Conversion Error:</strong><br />
                  {error}
                </div>
              ) : (
                <textarea
                  value={output}
                  readOnly
                  placeholder="Conversion results will appear here..."
                  className="form-textarea"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: 0,
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'none',
                    padding: 'var(--space-lg)',
                    backgroundColor: 'var(--color-surface)'
                  }}
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Controls & Quick Actions */}
        <div style={{ backgroundColor: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', padding: 'var(--space-lg)' }} className="lg:border-l-0">

          {/* Configuration Panel */}
          <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <h4 style={{ margin: '0 0 var(--space-md) 0', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>Configuration</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-primary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Input Format
                </label>
                <select
                  value={config.inputFormat}
                  onChange={(e) => handleConfigChange({ inputFormat: e.target.value as any })}
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '100%' }}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="time">Time format (8:30)</option>
                  <option value="decimal">Decimal hours (8.5)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-primary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Output Format
                </label>
                <select
                  value={config.outputFormat}
                  onChange={(e) => handleConfigChange({ outputFormat: e.target.value as any })}
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '100%' }}
                >
                  <option value="auto">Smart (adapts to input)</option>
                  <option value="both">Both formats</option>
                  <option value="decimal">Decimal only</option>
                  <option value="time">Time only</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-primary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Rounding Mode
                </label>
                <select
                  value={config.roundingMode}
                  onChange={(e) => handleConfigChange({ roundingMode: e.target.value as any })}
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '100%' }}
                >
                  <option value="standard">Standard</option>
                  <option value="legal">Legal (6-min)</option>
                  <option value="payroll">Payroll (1-min)</option>
                  <option value="quarter">Quarter (15-min)</option>
                  <option value="tenth">Tenth (6-min)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-primary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Decimal Precision
                </label>
                <select
                  value={config.decimalPrecision}
                  onChange={(e) => handleConfigChange({ decimalPrecision: parseInt(e.target.value) as any })}
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '100%' }}
                >
                  <option value={1}>1 decimal (8.5)</option>
                  <option value={2}>2 decimals (8.50)</option>
                  <option value={3}>3 decimals (8.500)</option>
                  <option value={4}>4 decimals (8.5000)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={config.timeFormat === '12hour'}
                    onChange={(e) => handleConfigChange({ timeFormat: e.target.checked ? '12hour' : '24hour' })}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  12-hour format (AM/PM)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={config.includeSeconds}
                    onChange={(e) => handleConfigChange({ includeSeconds: e.target.checked })}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  Include seconds
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={config.showBreakdown}
                    onChange={(e) => handleConfigChange({ showBreakdown: e.target.checked })}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  Show breakdown
                </label>
              </div>
            </div>
          </div>

          {/* Payroll Calculator */}
          <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <h4 style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                💰 Payroll Calculator
              </h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={config.calculatePayroll}
                  onChange={togglePayroll}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                Enable
              </label>
            </div>

            {config.calculatePayroll && (
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-primary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={config.hourlyRate || ''}
                  onChange={(e) => handleConfigChange({ hourlyRate: parseFloat(e.target.value) || undefined })}
                  placeholder="25.00"
                  className="form-input"
                  style={{ fontSize: '0.75rem', width: '100%' }}
                  step="0.01"
                  min="0"
                />
              </div>
            )}
          </div>

          {/* Quick Conversions */}
          <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <h4 style={{ margin: '0 0 var(--space-md) 0', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
              ⚡ Quick Conversions
            </h4>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <h5 style={{ fontSize: '0.75rem', fontWeight: 500, marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>Time → Decimal</h5>
              <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                {QUICK_CONVERSIONS.map((conv, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickConversion(conv.input)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.625rem', padding: 'var(--space-xs)', justifyContent: 'flex-start', fontFamily: 'var(--font-family-mono)' }}
                    title={conv.description}
                  >
                    {conv.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h5 style={{ fontSize: '0.75rem', fontWeight: 500, marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>Decimal → Time</h5>
              <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                {DECIMAL_TO_TIME.map((conv, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickConversion(conv.input, false, (conv as any).config)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.625rem', padding: 'var(--space-xs)', justifyContent: 'flex-start', fontFamily: 'var(--font-family-mono)' }}
                    title={conv.description}
                  >
                    {conv.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Manual Convert Button for non-auto mode */}
          {!autoFormat && (
            <button
              onClick={() => processTime()}
              disabled={!input.trim() || isLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 'var(--space-lg)' }}
            >
              {isLoading ? (
                <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75"/>
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              )}
              {isLoading ? 'Converting...' : 'Convert'}
            </button>
          )}
        </div>
      </div>

      {/* Examples Section */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--space-lg)'
      }}>
        <h3 style={{ margin: '0 0 var(--space-lg) 0', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          Common Use Cases
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
          {COMMON_EXAMPLES.map((example, idx) => (
            <div key={idx} className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                {example.title}
              </div>
              <div style={{
                backgroundColor: 'var(--color-surface-secondary)',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.75rem',
                marginBottom: 'var(--space-sm)',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-line',
                maxHeight: '80px',
                overflow: 'auto'
              }}>
                {example.value}
              </div>
              {example.description && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-sm) 0' }}>
                  {example.description}
                </p>
              )}
              <button
                onClick={() => handleQuickConversion(example.value, example.batch)}
                className="btn btn-outline"
                style={{ width: '100%', fontSize: '0.75rem' }}
              >
                Try Example
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}