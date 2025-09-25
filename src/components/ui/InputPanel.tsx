import { useState, useCallback, type ChangeEvent } from 'react';

interface ExampleItem {
  title: string;
  value: string;
}

interface InputPanelProps {
  value?: string;
  input?: string;
  onChange?: (value: string) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  title?: string;
  description?: string;
  accept?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
  syntax?: string;
  language?: string;
  examples?: ExampleItem[];
  onExampleClick?: (example: ExampleItem) => void;
}

export function InputPanel({
  value,
  input,
  onChange,
  onInputChange,
  placeholder = 'Enter your input here...',
  label,
  title,
  description,
  accept,
  maxLength,
  rows = 10,
  className = '',
  syntax,
  language,
  examples = [],
  onExampleClick,
}: InputPanelProps) {
  const resolvedValue = value ?? input ?? '';
  const handleChange = onChange ?? onInputChange ?? (() => {});
  const displayLabel = title ?? label ?? 'Input';
  const displaySyntax = syntax ?? language;
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    handleChange(e.target.value);
  }, [handleChange]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (maxLength && file.size > maxLength) {
      alert(`File size exceeds maximum limit of ${maxLength} characters`);
      return;
    }

    try {
      const content = await file.text();
      handleChange(content);
    } catch (error) {
      alert('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [handleChange, maxLength]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleChange(text);
    } catch (error) {
      alert('Failed to read from clipboard. Please make sure you have granted clipboard permissions.');
    }
  }, [handleChange]);

  const loadExample = useCallback((example: ExampleItem) => {
    if (onExampleClick) {
      onExampleClick(example);
    } else {
      handleChange(example.value);
    }
  }, [handleChange, onExampleClick]);

  const clear = useCallback(() => {
    handleChange('');
  }, [handleChange]);

  const panelClassName = ['tool-panel', className].filter(Boolean).join(' ');

  return (
    <div className={panelClassName}>
      <div className="tool-panel__header">
        <div className="tool-panel__title">
          <span>{displayLabel}</span>
          {resolvedValue && (
            <span className="tool-panel__meta">
              {resolvedValue.length} characters
            </span>
          )}
        </div>

        <div className="tool-panel__actions">
          {examples.length > 0 && (
            <select
              className="tool-panel__select"
              onChange={(e) => {
                const example = examples[parseInt(e.target.value, 10)];
                if (example) loadExample(example);
                e.target.value = '';
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Examples
              </option>
              {examples.map((example, index) => (
                <option key={index} value={index}>
                  {example.title}
                </option>
              ))}
            </select>
          )}

          <label className="btn btn-outline btn-sm" role="button">
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              hidden
            />
            Upload
          </label>

          <button
            onClick={handlePaste}
            className="btn btn-outline btn-sm"
            type="button"
          >
            Paste
          </button>

          {resolvedValue && (
            <button
              onClick={clear}
              className="btn btn-outline btn-sm tool-panel__button-danger"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {description && (
        <div className="tool-panel__description">
          {description}
        </div>
      )}

      <div
        className={`tool-panel__body${dragActive ? ' tool-panel__body--drag' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
      >
        <textarea
          value={resolvedValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="tool-panel__textarea"
          style={{ minHeight: `${rows * 1.5}rem` }}
        />

        {dragActive && (
          <div className="tool-panel__drop-hint">
            <div>
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto var(--space-sm)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Drop file here</p>
            </div>
          </div>
        )}
      </div>

      {(maxLength || displaySyntax) && (
        <div className="tool-panel__status">
          <div className="tool-panel__status-group">
            {displaySyntax && (
              <span>Syntax: {displaySyntax}</span>
            )}
          </div>
          {maxLength && (
            <span className={resolvedValue.length > maxLength * 0.9 ? 'tool-panel__status-warning' : ''}>
              {resolvedValue.length} / {maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
