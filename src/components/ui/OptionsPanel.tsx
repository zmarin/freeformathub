import { useState } from 'react';
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

  return (
    <div className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                  transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Options
          </span>
          {hasNonDefaultValues && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
              Modified
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasNonDefaultValues && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetToDefaults();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                        px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Options */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
          {visibleOptions.map((option) => {
            const value = (config && config[option.key]) ?? option.default;

            return (
              <div key={option.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {option.label}
                </label>
                
                {option.type === 'boolean' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleChange(option.key, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
                                dark:border-gray-600 dark:bg-gray-700"
                    />
                    {option.description && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </span>
                    )}
                  </div>
                )}

                {(option.type === 'string' || option.type === 'text') && (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(option.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={option.description}
                  />
                )}

                {option.type === 'number' && (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(option.key, parseInt(e.target.value) || option.default)}
                    min={option.min}
                    max={option.max}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                {option.type === 'select' && option.options && (
                  <select
                    value={value}
                    onChange={(e) => handleChange(option.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {option.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {option.description && option.type !== 'boolean' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}