import { useState, useCallback } from 'react';
import { MarkdownGenerator } from '../../lib/markdown/MarkdownGenerator';
import type { Tool } from '../../types';
import type { FormatType } from '../../lib/markdown/types';

interface MarkdownExportButtonProps {
  tool: Tool;
  className?: string;
}

/**
 * Export button component with format selection dropdown
 *
 * Allows users to export tool documentation as Markdown in two formats:
 * - Standard: Human-friendly with full formatting
 * - AI-Friendly: Compact, structured for LLM consumption
 */
export function MarkdownExportButton({ tool, className = '' }: MarkdownExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ format: FormatType; tokens: number } | null>(null);

  const handleExport = useCallback(async (format: FormatType, action: 'download' | 'copy') => {
    setIsExporting(true);

    try {
      const generator = new MarkdownGenerator(
        { tool, siteUrl: 'https://freeformathub.com' },
        { pageType: 'tool', format }
      );

      if (action === 'download') {
        generator.download();
      } else {
        await generator.copyToClipboard();
      }

      const stats = generator.getStats();
      setLastExport({ format, tokens: stats.estimatedTokens });
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [tool]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        disabled={isExporting}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12V4m0 8l3-3m-3 3l-3-3M2 14h12" />
        </svg>
        <span>{isExporting ? 'Exporting...' : 'Export as Markdown'}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 8L2 4h8z" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export Format</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose between human-friendly or AI-optimized documentation
            </p>
          </div>

          <div className="p-2">
            {/* Standard Format */}
            <div className="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Standard</span>
                </div>
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  Human-friendly
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Full formatting with headings, tables, and examples. Best for documentation sites.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('standard', 'download')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded transition-colors"
                  disabled={isExporting}
                >
                  Download
                </button>
                <button
                  onClick={() => handleExport('standard', 'copy')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded transition-colors"
                  disabled={isExporting}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* AI-Friendly Format */}
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">AI-Friendly</span>
                </div>
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  ~60% smaller
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Structured labels, compact examples. Optimized for LLM context windows (Claude, GPT-4).
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('ai-friendly', 'download')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded transition-colors"
                  disabled={isExporting}
                >
                  Download
                </button>
                <button
                  onClick={() => handleExport('ai-friendly', 'copy')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded transition-colors"
                  disabled={isExporting}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          {lastExport && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Last export:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {lastExport.format} • ~{lastExport.tokens} tokens
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
