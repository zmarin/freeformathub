import { useState, useCallback, type ChangeEvent } from 'react';
import { copyToClipboard } from '../../lib/utils';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  accept?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
  syntax?: string;
  examples?: Array<{ title: string; value: string }>;
}

export function InputPanel({
  value,
  onChange,
  placeholder = 'Enter your input here...',
  label = 'Input',
  accept,
  maxLength,
  rows = 10,
  className = '',
  syntax,
  examples = [],
}: InputPanelProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (maxLength && file.size > maxLength) {
      alert(`File size exceeds maximum limit of ${maxLength} characters`);
      return;
    }

    try {
      const content = await file.text();
      onChange(content);
    } catch (error) {
      alert('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [onChange, maxLength]);

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
      onChange(text);
    } catch (error) {
      alert('Failed to read from clipboard. Please make sure you have granted clipboard permissions.');
    }
  }, [onChange]);

  const loadExample = useCallback((example: { title: string; value: string }) => {
    onChange(example.value);
  }, [onChange]);

  const clear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={`bg-white dark:bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </h3>
          {value && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {value.length} characters
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Examples dropdown */}
          {examples.length > 0 && (
            <div className="relative">
              <select
                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 
                          bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const example = examples[parseInt(e.target.value)];
                  if (example) loadExample(example);
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="">Examples</option>
                {examples.map((example, index) => (
                  <option key={index} value={index}>
                    {example.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File upload */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                           px-3 py-1 rounded border transition-colors
                           text-gray-700 dark:text-gray-300">
              Upload
            </div>
          </label>

          {/* Paste button */}
          <button
            onClick={handlePaste}
            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                      px-3 py-1 rounded border transition-colors
                      text-gray-700 dark:text-gray-300"
          >
            Paste
          </button>

          {/* Clear button */}
          {value && (
            <button
              onClick={clear}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 
                        px-2 py-1 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Input area */}
      <div
        className={`relative ${dragActive ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
      >
        <textarea
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="w-full p-4 text-sm font-mono bg-transparent border-none resize-none 
                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-0"
          style={{ minHeight: `${rows * 1.5}rem` }}
        />
        
        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-blue-600 dark:text-blue-400 text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Drop file here</p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      {(maxLength || syntax) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400 
                       border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            {syntax && (
              <span>Syntax: {syntax}</span>
            )}
          </div>
          {maxLength && (
            <span className={value.length > maxLength * 0.9 ? 'text-yellow-600 dark:text-yellow-400' : ''}>
              {value.length} / {maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}