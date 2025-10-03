import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  processCsvFormatter,
  type CsvFormatterConfig,
  type ToolResult,
  type ValidationError,
} from '../../../tools/formatters/csv-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce, formatNumber } from '../../../lib/utils';
import { InputPanel, OutputPanel, OptionsPanel, SplitPanelLayout } from '../../ui';
import { openFormatterInNewWindow } from '../../../lib/utils/window-manager';

interface CsvFormatterProps {
  className?: string;
}

type CsvStats = NonNullable<ToolResult['stats']>;

const DEFAULT_CONFIG: CsvFormatterConfig = {
  mode: 'format',
  delimiter: ',',
  customDelimiter: '|',
  quoteChar: 'auto',
  escapeChar: 'auto',
  hasHeader: true,
  strictValidation: false,
  trimWhitespace: true,
  handleEmptyRows: 'remove',
  outputFormat: 'csv',
  sortBy: '',
  sortOrder: 'asc',
  filterColumn: '',
  filterValue: '',
  addRowNumbers: false,
  detectTypes: true,
};

const EXAMPLES = [
  {
    title: 'Basic CSV',
    value: 'name,age,city,country\nJohn Doe,25,New York,USA\nJane Smith,30,London,UK\nBob Johnson,35,Paris,France',
  },
  {
    title: 'Semicolon Delimited',
    value: 'product;price;category;stock\n"Laptop, Gaming";999.99;Electronics;5\n"Book, Programming";29.99;Education;12',
  },
  {
    title: 'Tab Separated',
    value: 'Name\tDepartment\tSalary\tYears\nJohn Smith\tEngineering\t75000\t5\nJane Doe\tMarketing\t65000\t3',
  },
  {
    title: 'Validation Data',
    value: 'email,age,phone,date\njohn@example.com,25,555-1234,2023-01-01\ninvalid-email,thirty,invalid-phone,not-a-date',
  },
];

const ADVANCED_OPTIONS = [
  {
    key: 'strictValidation',
    label: 'Strict Validation',
    type: 'boolean' as const,
    default: DEFAULT_CONFIG.strictValidation,
    description: 'Treat column mismatches and malformed rows as errors.',
  },
  {
    key: 'handleEmptyRows',
    label: 'Empty Rows',
    type: 'select' as const,
    default: DEFAULT_CONFIG.handleEmptyRows,
    options: [
      { value: 'remove', label: 'Remove silently' },
      { value: 'keep', label: 'Keep in output' },
      { value: 'error', label: 'Report as validation error' },
    ],
    description: 'Choose how empty rows should be handled.',
  },
  {
    key: 'sortBy',
    label: 'Sort By Column',
    type: 'string' as const,
    default: DEFAULT_CONFIG.sortBy,
    description: 'Provide a header name or column index to sort by.',
  },
  {
    key: 'sortOrder',
    label: 'Sort Order',
    type: 'select' as const,
    default: DEFAULT_CONFIG.sortOrder,
    options: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
    showWhen: (cfg) => Boolean((cfg as CsvFormatterConfig).sortBy?.length),
  },
  {
    key: 'filterColumn',
    label: 'Filter Column',
    type: 'string' as const,
    default: DEFAULT_CONFIG.filterColumn,
    description: 'Column header to filter on (case-insensitive match).',
  },
  {
    key: 'filterValue',
    label: 'Filter Value',
    type: 'string' as const,
    default: DEFAULT_CONFIG.filterValue,
    description: 'Substring to match when filtering rows.',
    showWhen: (cfg) => Boolean((cfg as CsvFormatterConfig).filterColumn?.length),
  },
] as const;

export function CsvFormatter({ className = '' }: CsvFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CsvFormatterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<CsvStats | undefined>();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [autoFormat, setAutoFormat] = useState(true);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  const latestConfigRef = useRef(config);

  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('csv-formatter') as Partial<CsvFormatterConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  useEffect(() => {
    latestConfigRef.current = config;
  }, [config]);

  const processCsv = useCallback((inputText: string = input, cfg: CsvFormatterConfig = latestConfigRef.current) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setValidationErrors([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = processCsvFormatter(inputText, cfg);

      if (result.success) {
        setOutput(result.output || '');
        setError(undefined);
        setMetadata(result.stats ?? undefined);
        setValidationErrors(result.validationErrors ?? []);

        addToHistory({
          toolId: 'csv-formatter',
          input: inputText,
          output: result.output || '',
          config: cfg,
          timestamp: Date.now(),
        });
      } else {
        setOutput('');
        setError(result.error || 'Failed to process CSV.');
        setMetadata(undefined);
        setValidationErrors(result.validationErrors ?? []);
      }
    } catch (err) {
      console.error('CSV processing failed', err);
      setOutput('');
      setError('Unexpected error while processing CSV.');
      setMetadata(undefined);
      setValidationErrors([]);
    }

    setIsLoading(false);
  }, [input, addToHistory]);

  const debouncedProcess = useMemo(() => debounce(processCsv, 350), [processCsv]);

  useEffect(() => {
    if (!autoFormat) return;
    debouncedProcess(input, latestConfigRef.current);
  }, [input, autoFormat, debouncedProcess]);

  const persistConfig = useCallback((nextConfig: CsvFormatterConfig) => {
    latestConfigRef.current = nextConfig;
    setConfig(nextConfig);
    try {
      updateSavedConfig?.('csv-formatter', nextConfig);
    } catch {}

    if (autoFormat) {
      processCsv(input, nextConfig);
    }
  }, [autoFormat, input, processCsv, updateSavedConfig]);

  const handleEssentialConfigChange = useCallback(<K extends keyof CsvFormatterConfig>(key: K, value: CsvFormatterConfig[K]) => {
    const nextConfig = { ...latestConfigRef.current, [key]: value } as CsvFormatterConfig;
    persistConfig(nextConfig);
  }, [persistConfig]);

  const handleProcessClick = useCallback(() => {
    processCsv(input, latestConfigRef.current);
  }, [input, processCsv]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(undefined);
    setMetadata(undefined);
    setValidationErrors([]);
  }, []);

  const handleAutoFormatToggle = useCallback((checked: boolean) => {
    setAutoFormat(checked);
    if (checked) {
      processCsv(input, latestConfigRef.current);
    }
  }, [input, processCsv]);

  const handleExampleClick = useCallback((example: { title: string; value: string }) => {
    setInput(example.value);
    if (autoFormat) {
      processCsv(example.value, latestConfigRef.current);
    }
  }, [autoFormat, processCsv]);

  const handleAdvancedOptionsChange = useCallback((next: Partial<CsvFormatterConfig>) => {
    const merged = { ...latestConfigRef.current, ...next } as CsvFormatterConfig;
    persistConfig(merged);
  }, [persistConfig]);

  const outputExtension = useMemo(() => {
    if (config.mode === 'validate') return 'txt';
    if (config.outputFormat === 'json') return 'json';
    if (config.outputFormat === 'tsv') return 'tsv';
    if (config.outputFormat === 'table') return 'txt';
    return 'csv';
  }, [config.mode, config.outputFormat]);

  const outputContentType = outputExtension === 'json' ? 'application/json' : 'text/plain';

  const outputLabel = useMemo(() => {
    if (config.mode === 'validate') return 'Validation Results';
    if (config.outputFormat === 'json') return 'JSON Output';
    if (config.outputFormat === 'table') return 'Table Output';
    if (config.outputFormat === 'tsv') return 'TSV Output';
    return 'CSV Output';
  }, [config.mode, config.outputFormat]);

  const statsEntries = useMemo(() => {
    if (!metadata) return [] as Array<{ label: string; value: string; highlight?: boolean }>;

    return [
      { label: 'Rows', value: formatNumber(metadata.rowCount) },
      { label: 'Columns', value: formatNumber(metadata.columnCount) },
      { label: 'Empty rows', value: formatNumber(metadata.emptyRows) },
      { label: 'Duplicate rows', value: formatNumber(metadata.duplicateRows) },
      { label: 'Total cells', value: formatNumber(metadata.totalCells) },
      { label: 'Valid cells', value: formatNumber(metadata.validCells) },
      {
        label: 'Invalid cells',
        value: formatNumber(metadata.invalidCells),
        highlight: metadata.invalidCells > 0,
      },
    ].filter((entry) => Number(entry.value.replace(/,/g, '')) > 0 || entry.label === 'Rows' || entry.label === 'Columns');
  }, [metadata]);

  const sizeSummary = useMemo(() => {
    if (!metadata) return null;
    const delta = metadata.processedSize - metadata.originalSize;
    return {
      original: metadata.originalSize,
      processed: metadata.processedSize,
      delta,
    };
  }, [metadata]);

  const dataTypeEntries = useMemo(() => {
    if (!metadata?.dataTypes) return [] as Array<[string, string]>;
    return Object.entries(metadata.dataTypes);
  }, [metadata]);

  const hasOutput = Boolean(output.trim().length);

  const handleOpenInNewWindow = useCallback(() => {
    if (!hasOutput) return;
    const language = config.mode === 'validate'
      ? 'text'
      : config.outputFormat === 'json'
        ? 'json'
        : 'text';
    const filename = config.mode === 'validate' ? 'validation-report.txt' : `processed.${outputExtension}`;
    openFormatterInNewWindow(output, language, 'CSV Formatter', filename);
  }, [hasOutput, config.mode, config.outputFormat, outputExtension, output]);

  const leftPanel = (
    <div className="flex flex-col h-full">
      <InputPanel
        value={input}
        onChange={setInput}
        label="CSV Input"
        placeholder={`Paste your CSV data here or drag & drop a file...\n\nSupports: CSV, TSV, semicolons, and custom delimiters.`}
        accept=".csv,.tsv,.txt"
        rows={18}
        examples={EXAMPLES}
        onExampleClick={handleExampleClick}
      />
    </div>
  );

  const rightPanel = (
    <div className="flex flex-col h-full">
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label={outputLabel}
        syntax={config.outputFormat === 'json' ? 'json' : 'text'}
        downloadFilename={config.mode === 'validate' ? 'validation-report.txt' : `processed.${outputExtension}`}
        downloadContentType={outputContentType}
        showLineNumbers={config.outputFormat !== 'table'}
        onOpenInNewTab={hasOutput ? handleOpenInNewWindow : undefined}
        openButtonLabel="Open full view"
      />
    </div>
  );

  return (
    <div className={className}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-sm)',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <button
          onClick={handleProcessClick}
          className="btn btn-primary btn-sm"
          disabled={!input.trim() || isLoading}
          type="button"
        >
          {isLoading ? 'Processing...' : 'Process CSV'}
        </button>

        <button
          onClick={handleClear}
          className="btn btn-outline btn-sm"
          disabled={!input.trim() && !output.trim()}
          type="button"
        >
          Clear
        </button>

        {hasOutput && (
          <button
            onClick={handleOpenInNewWindow}
            className="btn btn-outline btn-sm"
            type="button"
          >
            Open output
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => handleAutoFormatToggle(e.target.checked)}
            />
            Auto-process
          </label>
        </div>
      </div>

      <div
        style={{
          minHeight: '520px',
          height: 'min(720px, calc(100vh - 280px))',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <SplitPanelLayout
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          defaultSplitPosition={50}
          minPanelWidth={320}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-xl)',
          marginTop: 'var(--space-xl)',
        }}
      >
        <div>
          <div className="tool-panel">
            <div className="tool-panel__header">
              <div className="tool-panel__title">
                <span>Quick Settings</span>
              </div>
            </div>

            <div
              className="tool-options"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-md)',
              }}
            >
              <div className="tool-options__item">
                <label className="tool-options__label" htmlFor="csv-mode">Mode</label>
                <select
                  id="csv-mode"
                  className="form-select"
                  value={config.mode}
                  onChange={(e) => handleEssentialConfigChange('mode', e.target.value as CsvFormatterConfig['mode'])}
                >
                  <option value="format">Format CSV</option>
                  <option value="validate">Validate only</option>
                  <option value="convert">Convert format</option>
                </select>
              </div>

              {config.mode !== 'validate' && (
                <div className="tool-options__item">
                  <label className="tool-options__label" htmlFor="csv-output-format">Output Format</label>
                  <select
                    id="csv-output-format"
                    className="form-select"
                    value={config.outputFormat}
                    onChange={(e) => handleEssentialConfigChange('outputFormat', e.target.value as CsvFormatterConfig['outputFormat'])}
                  >
                    <option value="csv">CSV</option>
                    <option value="tsv">TSV</option>
                    <option value="json">JSON</option>
                    <option value="table">Plain table</option>
                  </select>
                </div>
              )}

              <div className="tool-options__item">
                <label className="tool-options__label" htmlFor="csv-delimiter">Delimiter</label>
                <select
                  id="csv-delimiter"
                  className="form-select"
                  value={config.delimiter}
                  onChange={(e) => handleEssentialConfigChange('delimiter', e.target.value as CsvFormatterConfig['delimiter'])}
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab</option>
                  <option value="|">Pipe (|)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {config.delimiter === 'custom' && (
                <div className="tool-options__item">
                  <label className="tool-options__label" htmlFor="csv-custom-delimiter">Custom Delimiter</label>
                  <input
                    id="csv-custom-delimiter"
                    type="text"
                    className="form-input"
                    value={config.customDelimiter}
                    onChange={(e) => handleEssentialConfigChange('customDelimiter', e.target.value)}
                    maxLength={4}
                    placeholder="Enter delimiter"
                  />
                  <p className="tool-options__description">Single character delimiter, e.g. ^ or ::</p>
                </div>
              )}

              <div className="tool-options__item">
                <label className="tool-options__label" htmlFor="csv-quote">Quote character</label>
                <select
                  id="csv-quote"
                  className="form-select"
                  value={config.quoteChar}
                  onChange={(e) => handleEssentialConfigChange('quoteChar', e.target.value as CsvFormatterConfig['quoteChar'])}
                >
                  <option value="auto">Auto detect</option>
                  <option value={'"'}>Double quotes (")</option>
                  <option value="'">Single quotes (')</option>
                </select>
              </div>

              <div className="tool-options__item">
                <label className="tool-options__label" htmlFor="csv-escape">Escape character</label>
                <select
                  id="csv-escape"
                  className="form-select"
                  value={config.escapeChar}
                  onChange={(e) => handleEssentialConfigChange('escapeChar', e.target.value as CsvFormatterConfig['escapeChar'])}
                >
                  <option value="auto">Match quote</option>
                  <option value={'\\'}>Backslash (\\)</option>
                  <option value={'"'}>Double quotes (")</option>
                </select>
              </div>

              <div className="tool-options__item">
                <label className="tool-options__label" htmlFor="csv-has-header">Headers</label>
                <div className="tool-options__checkbox-row">
                  <input
                    id="csv-has-header"
                    type="checkbox"
                    className="tool-options__checkbox"
                    checked={config.hasHeader}
                    onChange={(e) => handleEssentialConfigChange('hasHeader', e.target.checked)}
                  />
                  <span className="tool-options__description">Treat first row as column headers.</span>
                </div>
              </div>

              <div className="tool-options__item">
                <label className="tool-options__label" htmlFor="csv-trim">Whitespace</label>
                <div className="tool-options__checkbox-row">
                  <input
                    id="csv-trim"
                    type="checkbox"
                    className="tool-options__checkbox"
                    checked={config.trimWhitespace}
                    onChange={(e) => handleEssentialConfigChange('trimWhitespace', e.target.checked)}
                  />
                  <span className="tool-options__description">Trim leading and trailing spaces.</span>
                </div>
              </div>

              <div className="tool-options__item">
                <label className="tool-options__label" htmlFor="csv-detect-types">Type detection</label>
                <div className="tool-options__checkbox-row">
                  <input
                    id="csv-detect-types"
                    type="checkbox"
                    className="tool-options__checkbox"
                    checked={config.detectTypes}
                    onChange={(e) => handleEssentialConfigChange('detectTypes', e.target.checked)}
                  />
                  <span className="tool-options__description">Auto-tag numbers, dates, emails, etc.</span>
                </div>
              </div>

              <div className="tool-options__item">
                <label className="tool-options__label" htmlFor="csv-row-numbers">Row numbers</label>
                <div className="tool-options__checkbox-row">
                  <input
                    id="csv-row-numbers"
                    type="checkbox"
                    className="tool-options__checkbox"
                    checked={config.addRowNumbers}
                    onChange={(e) => handleEssentialConfigChange('addRowNumbers', e.target.checked)}
                  />
                  <span className="tool-options__description">Include a numbered column in the output.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <OptionsPanel
            options={ADVANCED_OPTIONS}
            config={config}
            onChange={(next) => handleAdvancedOptionsChange(next as Partial<CsvFormatterConfig>)}
          />
        </div>
      </div>

      {metadata && (
        <div className="tool-panel" style={{ marginTop: 'var(--space-xl)' }}>
          <div className="tool-panel__header">
            <div className="tool-panel__title">
              <span>Data Summary</span>
              {metadata && (
                <span className="tool-panel__meta">
                  {formatNumber(metadata.rowCount)} rows · {formatNumber(metadata.columnCount)} columns
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-md)' }}>
            {statsEntries.map((entry) => (
              <div
                key={entry.label}
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.03em', marginBottom: 'var(--space-xs)' }}>
                  {entry.label}
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: entry.highlight ? 'var(--color-danger)' : 'var(--color-text-primary)',
                  }}
                >
                  {entry.value}
                </div>
              </div>
            ))}
          </div>

          {sizeSummary && (
            <div style={{ marginTop: 'var(--space-lg)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
              <div>
                <strong>Input size:</strong> {formatNumber(sizeSummary.original)} characters
              </div>
              <div>
                <strong>Output size:</strong> {formatNumber(sizeSummary.processed)} characters
              </div>
              <div>
                <strong>Delta:</strong> {sizeSummary.delta === 0 ? 'No change' : `${sizeSummary.delta > 0 ? '+' : ''}${formatNumber(sizeSummary.delta)} characters`}
              </div>
            </div>
          )}

          {dataTypeEntries.length > 0 && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Detected column types</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
                {dataTypeEntries.map(([column, type]) => (
                  <div
                    key={column}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-secondary)',
                      border: '1px dashed var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{column}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="tool-panel" style={{ marginTop: 'var(--space-xl)' }}>
          <div className="tool-panel__header">
            <div className="tool-panel__title">
              <span>Validation Issues</span>
              <span className="tool-panel__badge tool-panel__badge--danger">{validationErrors.length}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {validationErrors.slice(0, 6).map((issue, index) => (
              <div
                key={`${issue.row}-${issue.column}-${index}`}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--color-surface-secondary)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                  <span style={{ fontWeight: 600, color: issue.severity === 'error' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                    {issue.severity === 'error' ? 'Error' : 'Warning'}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    Row {issue.row}
                    {issue.column > 0 && ` · Column ${issue.column}${issue.columnName ? ` (${issue.columnName})` : ''}`}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{issue.message}</div>
                {issue.value && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-xs)' }}>
                    Value: <code>{issue.value}</code>
                  </div>
                )}
              </div>
            ))}
          </div>

          {validationErrors.length > 6 && (
            <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Showing the first 6 issues. Export the output or switch to validation mode for the full report.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
