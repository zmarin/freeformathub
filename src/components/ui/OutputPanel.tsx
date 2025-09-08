import { useState, useCallback } from 'react';
import { copyToClipboard, downloadFile } from '../../lib/utils';

interface OutputPanelProps {
  value: string;
  label?: string;
  error?: string;
  isLoading?: boolean;
  className?: string;
  syntax?: string;
  downloadFilename?: string;
  downloadContentType?: string;
  showLineNumbers?: boolean;
  onOpenInNewTab?: () => void;
  openButtonLabel?: string;
}

export function OutputPanel({
  value,
  label = 'Output',
  error,
  isLoading = false,
  className = '',
  syntax,
  downloadFilename = 'output.txt',
  downloadContentType = 'text/plain',
  showLineNumbers = false,
  onOpenInNewTab,
  openButtonLabel = 'Open in New Tab',
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  }, [value]);

  const handleDownload = useCallback(() => {
    downloadFile(value, downloadFilename, downloadContentType);
  }, [value, downloadFilename, downloadContentType]);

  const lines = showLineNumbers ? value.split('\n') : [];

  return (
    <div className={`bg-white dark:bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </h3>
          {value && !error && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {value.length} characters
            </span>
          )}
          {error && (
            <span className="text-xs text-red-600 dark:text-red-400">
              Error
            </span>
          )}
        </div>
        
        {value && !error && !isLoading && (
          <div className="flex items-center space-x-2">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded 
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                        px-3 py-1 rounded border transition-colors
                        text-gray-700 dark:text-gray-300"
            >
              Download
            </button>

            {/* Open in new tab */}
            {onOpenInNewTab && (
              <button
                onClick={onOpenInNewTab}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                          px-3 py-1 rounded border transition-colors
                          text-gray-700 dark:text-gray-300"
              >
                {openButtonLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Output area */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm">Processing...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-start space-x-2 text-red-600 dark:text-red-400">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : value ? (
          <div className="relative">
            {showLineNumbers && (
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 dark:bg-gray-900 
                             border-r border-gray-200 dark:border-gray-700 flex flex-col">
                {lines.map((_, index) => (
                  <div 
                    key={index + 1}
                    className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 text-right 
                              leading-normal select-none"
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            )}
            <pre className={`overflow-auto p-4 text-sm font-mono text-gray-900 dark:text-gray-100 
                            ${showLineNumbers ? 'pl-16' : ''} whitespace-pre-wrap break-words`}>
              <code>{value}</code>
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Output will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      {(syntax || (value && !error)) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400 
                       border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            {syntax && (
              <span>Format: {syntax}</span>
            )}
            {value && !error && (
              <span>Ready</span>
            )}
          </div>
          {value && !error && (
            <div className="flex items-center space-x-4">
              <span>{value.split('\n').length} lines</span>
              <span>{value.split(' ').filter(w => w).length} words</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
