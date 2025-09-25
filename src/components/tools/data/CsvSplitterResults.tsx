import { useState, useCallback } from 'react';
import {
  FileText,
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
  Package,
  BarChart3,
  Clock,
  HardDrive,
  Files,
  Check,
  Table
} from 'lucide-react';
import { copyToClipboard, downloadFile } from '../../../lib/utils';
import JSZip from 'jszip';
import type { CsvSplitResult } from '../../../tools/data/csv-splitter';

interface CsvSplitterResultsProps {
  splits: CsvSplitResult[];
  metadata?: {
    totalFiles: number;
    totalRows: number;
    originalSize: number;
    compressedSize?: number;
    processingTime: number;
  };
  zipOutput: boolean;
  showPreview: boolean;
  className?: string;
  onError?: (message: string) => void;
}

interface FileCardState {
  isExpanded: boolean;
  isCopied: boolean;
  showTable: boolean;
}

export function CsvSplitterResults({
  splits,
  metadata,
  zipOutput,
  showPreview,
  className = '',
  onError
}: CsvSplitterResultsProps) {
  const [fileStates, setFileStates] = useState<{ [key: string]: FileCardState }>({});
  const [downloadProgress, setDownloadProgress] = useState<string | undefined>();

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  const getFileState = (filename: string): FileCardState => {
    return fileStates[filename] || { isExpanded: false, isCopied: false, showTable: false };
  };

  const updateFileState = (filename: string, updates: Partial<FileCardState>) => {
    setFileStates(prev => ({
      ...prev,
      [filename]: { ...getFileState(filename), ...updates }
    }));
  };

  const handleCopy = useCallback(async (content: string, filename: string) => {
    try {
      await copyToClipboard(content);
      updateFileState(filename, { isCopied: true });
      setTimeout(() => {
        updateFileState(filename, { isCopied: false });
      }, 2000);
    } catch (error) {
      onError?.('Failed to copy to clipboard');
    }
  }, [onError]);

  const handleDownloadFile = useCallback((split: CsvSplitResult) => {
    downloadFile(split.content, split.filename, 'text/csv');
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (splits.length === 0) return;

    try {
      setDownloadProgress('Creating ZIP archive...');
      const zip = new JSZip();

      splits.forEach((split) => {
        zip.file(split.filename, split.content);
      });

      setDownloadProgress('Generating download...');
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      setDownloadProgress('Starting download...');
      downloadFile(content, 'csv_splits.zip', 'application/zip');
      setDownloadProgress(undefined);
    } catch (error) {
      onError?.('Failed to create ZIP file');
      setDownloadProgress(undefined);
    }
  }, [splits, onError]);

  const toggleFileExpanded = (filename: string) => {
    const currentState = getFileState(filename);
    updateFileState(filename, { isExpanded: !currentState.isExpanded });
  };

  const parseCSVRow = (row: string, delimiter: string = ','): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const renderTablePreview = (split: CsvSplitResult) => {
    if (!split.preview || split.preview.length === 0) return null;

    const rows = split.preview.map(row => parseCSVRow(row));
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);

    return (
      <div >
        <div className="overflow-x-auto max-h-64">
          <table >
            <thead >
              <tr>
                {headers.map((header, index) => (
                  <th key={index} >
                    {header.replace(/^"(.*)"$/, '$1')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody >
              {dataRows.map((row, rowIndex) => (
                <tr key={rowIndex} >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} >
                      <div className="max-w-32 truncate" title={cell.replace(/^"(.*)"$/, '$1')}>
                        {cell.replace(/^"(.*)"$/, '$1')}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div >
          Showing first {Math.min(dataRows.length, 10)} rows of {split.rowCount} total
        </div>
      </div>
    );
  };

  if (splits.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div >
        <div className="flex items-center space-x-2">
          <BarChart3  />
          <h3 >
            Split Results
          </h3>
          <span >
            {splits.length} files created
          </span>
        </div>

        {zipOutput && (
          <button
            onClick={handleDownloadZip}
            disabled={!!downloadProgress}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700
                      disabled:bg-blue-400 text-white rounded-md transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Package className="w-4 h-4" />
            <span>{downloadProgress || 'Download ZIP'}</span>
          </button>
        )}
      </div>

      {/* Metadata Stats */}
      {metadata && (
        <div >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Files  />
              <div>
                <div >
                  {metadata.totalFiles}
                </div>
                <div >Files</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3  />
              <div>
                <div >
                  {metadata.totalRows?.toLocaleString()}
                </div>
                <div >Rows</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive  />
              <div>
                <div >
                  {formatFileSize(metadata.originalSize)}
                </div>
                <div >Original Size</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock  />
              <div>
                <div >
                  {metadata.processingTime}ms
                </div>
                <div >Processing</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split Files List */}
      <div >
        {splits.map((split, index) => {
          const fileState = getFileState(split.filename);

          return (
            <div key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={() => toggleFileExpanded(split.filename)}
                    
                  >
                    {fileState.isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <FileText  />
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4 >
                      {split.filename}
                    </h4>
                    <div >
                      <span>{split.rowCount?.toLocaleString()} rows</span>
                      <span>{formatFileSize(split.size)}</span>
                      {split.preview && (
                        <span>{split.preview.length} preview lines</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(split.content, split.filename)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600
                              hover:text-gray-900 hover:bg-gray-100
                              rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {fileState.isCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadFile(split)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600
                              hover:text-gray-900 hover:bg-gray-100
                              rounded transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {fileState.isExpanded && showPreview && split.preview && split.preview.length > 0 && (
                <div className="mt-4 ml-7">
                  <div className="flex items-center justify-between mb-3">
                    <h5 >
                      File Preview
                    </h5>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateFileState(split.filename, { showTable: false })}
                        className={`px-2 py-1 text-xs rounded transition-colors
                          ${!fileState.showTable
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        Raw
                      </button>
                      <button
                        onClick={() => updateFileState(split.filename, { showTable: true })}
                        className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors
                          ${fileState.showTable
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        <Table className="w-3 h-3" />
                        <span>Table</span>
                      </button>
                    </div>
                  </div>

                  {fileState.showTable ? (
                    renderTablePreview(split)
                  ) : (
                    <div >
                      <pre >
                        {split.preview.slice(0, 5).map((row, rowIndex) => (
                          <div key={rowIndex} >
                            {row}
                          </div>
                        ))}
                        {split.preview.length > 5 && (
                          <div >
                            ... and {split.preview.length - 5} more lines
                          </div>
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}