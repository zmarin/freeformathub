import { useState, type KeyboardEvent } from 'react';
import type { ToolConfig } from '../../types';

interface Option {
  key: string;
  label: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'text';
  default: any;
  options?: Array<{ value: string; label: string }>;
  description?: string;
  min?: number;
  max?: number;
  showWhen?: (config: ToolConfig) => boolean;
}

interface OptionsPanelProps {
  options: Option[];
  config: ToolConfig;
  onChange: (config: ToolConfig) => void;
  className?: string;
}

export function OptionsPanel({
  options,
  config,
  onChange,
  className = '',
}: OptionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(prev => !prev);

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded();
    }
  };

  const handleChange = (key: string, value: any) => {
    onChange({ ...(config || {}), [key]: value });
  };

  const resetToDefaults = () => {
    const defaultConfig: ToolConfig = {};
    (options || []).forEach(option => {
      defaultConfig[option.key] = option.default;
    });
    onChange(defaultConfig);
  };

  const hasNonDefaultValues = config && (options || []).some(option => 
    config[option.key] !== undefined && config[option.key] !== option.default
  );

  // Filter options based on showWhen
  const visibleOptions = (options || []).filter(option => {
    if (!option.showWhen) return true;
    if (!config) return true; // Show all options if config is undefined (during SSR)
    try {
      return option.showWhen(config);
    } catch {
      return true; // Show option if showWhen throws an error
    }
  });

  if (visibleOptions.length === 0) return null;

  const panelClassName = ['tool-panel', className].filter(Boolean).join(' ');

  return (
    <div className={panelClassName}>
      <div
        className="tool-panel__header tool-panel__header--interactive"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
        onKeyDown={handleHeaderKeyDown}
      >
        <div className="tool-panel__title">
          <span>Options</span>
          {hasNonDefaultValues && (
            <span className="tool-panel__badge">Modified</span>
          )}
        </div>
        <div className="tool-panel__actions">
          {hasNonDefaultValues && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                resetToDefaults();
              }}
              className="btn btn-outline btn-sm tool-options__reset"
              type="button"
            >
              Reset
            </button>
          )}
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              width: '1.25rem',
              height: '1.25rem',
              color: 'var(--color-text-secondary)',
              transition: 'transform var(--transition-fast)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)'
            }}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="tool-options">
          {visibleOptions.map((option) => {
            const value = (config && config[option.key]) ?? option.default;
            const optionId = `tool-option-${option.key.replace(/[^a-zA-Z0-9_-]/g, '')}`;

            return (
              <div key={option.key} className="tool-options__item">
                <label className="tool-options__label" htmlFor={optionId}>
                  {option.label}
                </label>

                {option.type === 'boolean' && (
                  <div className="tool-options__checkbox-row">
                    <input
                      id={optionId}
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) => handleChange(option.key, e.target.checked)}
                      className="tool-options__checkbox"
                    />
                    {option.description && (
                      <span className="tool-options__description">{option.description}</span>
                    )}
                  </div>
                )}

                {(option.type === 'string' || option.type === 'text') && (
                  <input
                    id={optionId}
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(option.key, e.target.value)}
                    className="form-input"
                    placeholder={option.description}
                  />
                )}

                {option.type === 'number' && (
                  <input
                    id={optionId}
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(option.key, parseInt(e.target.value, 10) || option.default)}
                    min={option.min}
                    max={option.max}
                    className="form-input"
                  />
                )}

                {option.type === 'select' && option.options && (
                  <select
                    id={optionId}
                    value={value}
                    onChange={(e) => handleChange(option.key, e.target.value)}
                    className="form-select"
                  >
                    {option.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {option.description && option.type !== 'boolean' && (
                  <p className="tool-options__description">{option.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
