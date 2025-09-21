import { useState, useCallback, useMemo } from 'react';
import { parseCsvData, type CsvTableViewerConfig, type CsvData, type CsvStats } from '../../../tools/data/csv-table-viewer';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard, downloadFile } from '../../../lib/utils';

interface CsvTableViewerProps {
  className?: string;
}

const DEFAULT_CONFIG: CsvTableViewerConfig = {
  delimiter: ',',
  hasHeader: true,
  showLineNumbers: true,
  enableSearch: true,
  enableSorting: true,
  enableFiltering: false,
  showRowCount: true,
  showColumnCount: true,
  enableExport: true,
  maxDisplayRows: 1000,
  customDelimiter: '',
  treatEmptyAsNull: true,
  trimWhitespace: true,
  showStats: true,
};

export function CsvTableViewer({ className = '' }: CsvTableViewerProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<CsvTableViewerConfig>(DEFAULT_CONFIG);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [stats, setStats] = useState<CsvStats | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<number>(-1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const { addToHistory } = useToolStore();

  const handleParse = useCallback(() => {
    if (!input.trim()) {
      alert('Please enter CSV data to view.');
      return;
    }

    setIsProcessing(true);
    setError('');

    const result = parseCsvData(input, config);

    if (result.success) {
      setCsvData(result.data || null);
      setStats(result.stats || null);
      setCurrentPage(1);

      addToHistory({
        tool: 'csv-table-viewer',
        input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
        output: result.output || '',
        timestamp: Date.now()
      });
    } else {
      setError(result.error || 'Unknown error');
      setCsvData(null);
      setStats(null);
    }
    setIsProcessing(false);
  }, [input, config, addToHistory]);

  const handleClear = useCallback(() => {
    setInput('');
    setCsvData(null);
    setStats(null);
    setError('');
    setSearchTerm('');
    setSortColumn(-1);
    setCurrentPage(1);
  }, []);

  const handleConfigChange = useCallback((key: keyof CsvTableViewerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSort = useCallback((columnIndex: number) => {
    if (!config.enableSorting || !csvData) return;

    if (sortColumn === columnIndex) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortColumn, config.enableSorting, csvData]);

  const filteredAndSortedData = useMemo(() => {
    if (!csvData) return { rows: [], totalRows: 0 };

    let rows = [...csvData.rows];

    // Apply search filter
    if (searchTerm && config.enableSearch) {
      rows = rows.filter(row =>
        row.some(cell =>
          cell.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn >= 0 && config.enableSorting) {
      rows.sort((a, b) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';

        // Try numeric comparison first
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Fallback to string comparison
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return { rows, totalRows: rows.length };
  }, [csvData, searchTerm, sortColumn, sortDirection, config.enableSearch, config.enableSorting]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedData.rows.slice(startIndex, endIndex);
  }, [filteredAndSortedData.rows, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.totalRows / rowsPerPage);

  const handleExportCsv = useCallback(() => {
    if (!csvData) return;

    let csvContent = '';

    // Add headers
    if (config.hasHeader) {
      csvContent += csvData.headers.join(',') + '\n';
    }

    // Add data rows (filtered and sorted)
    filteredAndSortedData.rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    downloadFile(csvContent, 'table-data.csv');
  }, [csvData, filteredAndSortedData.rows, config.hasHeader]);

  const handleExampleLoad = useCallback((example: string) => {
    setInput(example);
  }, []);

  return (
    <div className={`csv-table-viewer-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button
            onClick={handleParse}
            disabled={!input.trim() || isProcessing}
            className="btn btn-primary"
            style={{ minWidth: '120px' }}
          >
            {isProcessing ? 'Parsing...' : 'View Table'}
          </button>

          <button
            onClick={handleClear}
            className="btn btn-outline"
            disabled={!input && !csvData}
          >
            Clear
          </button>

          {csvData && (
            <>
              <button onClick={handleExportCsv} className="btn btn-outline">
                📁 Export CSV
              </button>

              {config.enableSearch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="text"
                    placeholder="Search table..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ width: '200px' }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="btn btn-sm btn-outline"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Quick stats */}
          {stats && (
            <div style={{
              marginLeft: 'auto',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              gap: 'var(--space-md)',
              flexWrap: 'wrap'
            }}>
              <span><strong>{stats.totalRows.toLocaleString()}</strong> rows</span>
              <span><strong>{stats.totalColumns}</strong> columns</span>
              {searchTerm && (
                <span><strong>{filteredAndSortedData.totalRows.toLocaleString()}</strong> filtered</span>
              )}
            </div>
          )}

          {/* Quick examples */}
          <div style={{ marginLeft: stats ? 'var(--space-md)' : 'auto', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExampleLoad(`Name,Age,City
John Doe,25,New York
Jane Smith,30,Los Angeles
Bob Johnson,35,Chicago`)}
              className="btn btn-sm btn-outline"
            >
              Sample Data
            </button>
            <button
              onClick={() => handleExampleLoad(`Product;Price;Category
Laptop;999.99;Electronics
Mouse;29.99;Electronics
Keyboard;79.99;Electronics`)}
              className="btn btn-sm btn-outline"
            >
              Semicolon CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid-responsive" style={{ minHeight: '500px' }}>
        {/* Input Panel */}
        <div style={{ position: 'relative' }} className="grid-responsive-item"
             data-mobile-border="bottom"
             data-desktop-border="right">
          {/* Input Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              CSV Data Input
            </h3>
            {input && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {input.split('\n').length.toLocaleString()} lines
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your CSV data here...

Example:
Name,Department,Salary
John Smith,Engineering,75000
Jane Doe,Marketing,65000
Bob Johnson,Sales,55000"
              className="form-textarea"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                resize: 'vertical',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
        </div>

        {/* Table Display Panel */}
        <div className="grid-responsive-item">
          {/* Table Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              Table View
            </h3>
            {csvData && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {filteredAndSortedData.totalRows.toLocaleString()} rows × {csvData.headers.length} columns
              </div>
            )}
          </div>

          {/* Table Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)', overflow: 'auto' }}>
            {error ? (
              <div style={{
                color: 'var(--color-error)',
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--color-error-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-error)'
              }}>
                Error: {error}
              </div>
            ) : csvData ? (
              <div>
                {/* Table */}
                <div style={{
                  overflowX: 'auto',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {/* Headers */}
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                        {config.showLineNumbers && (
                          <th style={{
                            padding: 'var(--space-sm)',
                            borderBottom: '1px solid var(--color-border)',
                            borderRight: '1px solid var(--color-border)',
                            fontWeight: 600,
                            textAlign: 'center',
                            minWidth: '60px'
                          }}>
                            #
                          </th>
                        )}
                        {csvData.headers.map((header, index) => (
                          <th
                            key={index}
                            onClick={() => handleSort(index)}
                            style={{
                              padding: 'var(--space-sm)',
                              borderBottom: '1px solid var(--color-border)',
                              borderRight: index < csvData.headers.length - 1 ? '1px solid var(--color-border)' : 'none',
                              fontWeight: 600,
                              textAlign: 'left',
                              cursor: config.enableSorting ? 'pointer' : 'default',
                              position: 'relative',
                              minWidth: '100px'
                            }}
                          >
                            {header}
                            {config.enableSorting && sortColumn === index && (
                              <span style={{ marginLeft: 'var(--space-xs)' }}>
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* Data Rows */}
                    <tbody>
                      {paginatedData.map((row, rowIndex) => {
                        const actualRowIndex = (currentPage - 1) * rowsPerPage + rowIndex;
                        return (
                          <tr
                            key={actualRowIndex}
                            style={{
                              backgroundColor: rowIndex % 2 === 0 ? 'transparent' : 'var(--color-surface-secondary)'
                            }}
                          >
                            {config.showLineNumbers && (
                              <td style={{
                                padding: 'var(--space-sm)',
                                borderBottom: '1px solid var(--color-border)',
                                borderRight: '1px solid var(--color-border)',
                                textAlign: 'center',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 500
                              }}>
                                {actualRowIndex + 1}
                              </td>
                            )}
                            {csvData.headers.map((_, cellIndex) => (
                              <td
                                key={cellIndex}
                                style={{
                                  padding: 'var(--space-sm)',
                                  borderBottom: '1px solid var(--color-border)',
                                  borderRight: cellIndex < csvData.headers.length - 1 ? '1px solid var(--color-border)' : 'none',
                                  wordBreak: 'break-word',
                                  maxWidth: '200px'
                                }}
                              >
                                {row[cellIndex] || (config.treatEmptyAsNull ? '—' : '')}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    marginTop: 'var(--space-lg)',
                    padding: 'var(--space-md)'
                  }}>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-sm btn-outline"
                    >
                      ← Previous
                    </button>

                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="btn btn-sm btn-outline"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                <div>
                  <p>Enter CSV data and click "View Table" to see an interactive table.</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-md)' }}>
                    ✅ Interactive table with search and sort<br />
                    ✅ Automatic delimiter detection<br />
                    ✅ Detailed data statistics and analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-lg)'
      }}>
        <details open>
          <summary style={{
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: 'var(--space-md)',
            color: 'var(--color-text-primary)'
          }}>
            Table Options
          </summary>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {/* Parsing Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Parsing Options:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                    Delimiter:
                  </label>
                  <select
                    value={config.delimiter}
                    onChange={(e) => handleConfigChange('delimiter', e.target.value)}
                    className="form-select"
                    style={{ width: '100%' }}
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab</option>
                    <option value="|">Pipe (|)</option>
                    <option value="auto">Auto-detect</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.hasHeader}
                    onChange={(e) => handleConfigChange('hasHeader', e.target.checked)}
                  />
                  First row contains headers
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.trimWhitespace}
                    onChange={(e) => handleConfigChange('trimWhitespace', e.target.checked)}
                  />
                  Trim whitespace from cells
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.treatEmptyAsNull}
                    onChange={(e) => handleConfigChange('treatEmptyAsNull', e.target.checked)}
                  />
                  Show empty cells as "—"
                </label>
              </div>
            </div>

            {/* Display Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Display Options:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.showLineNumbers}
                    onChange={(e) => handleConfigChange('showLineNumbers', e.target.checked)}
                  />
                  Show line numbers
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.enableSearch}
                    onChange={(e) => handleConfigChange('enableSearch', e.target.checked)}
                  />
                  Enable search functionality
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.enableSorting}
                    onChange={(e) => handleConfigChange('enableSorting', e.target.checked)}
                  />
                  Enable column sorting
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.showStats}
                    onChange={(e) => handleConfigChange('showStats', e.target.checked)}
                  />
                  Show data statistics
                </label>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                    Max display rows:
                  </label>
                  <input
                    type="number"
                    value={config.maxDisplayRows}
                    onChange={(e) => handleConfigChange('maxDisplayRows', parseInt(e.target.value) || 1000)}
                    className="form-input"
                    style={{ width: '100%' }}
                    min="10"
                    max="10000"
                    step="10"
                  />
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Statistics Panel */}
      {stats && config.showStats && (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          margin: 'var(--space-lg)',
          fontSize: 'var(--font-size-sm)'
        }}>
          <h6 style={{ margin: 0, marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Data Statistics:</h6>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            <div><strong>Total rows:</strong> {stats.totalRows.toLocaleString()}</div>
            <div><strong>Columns:</strong> {stats.totalColumns.toLocaleString()}</div>
            <div><strong>Total cells:</strong> {stats.totalCells.toLocaleString()}</div>
            <div><strong>Filled cells:</strong> {stats.filledCells.toLocaleString()}</div>
            <div><strong>Empty cells:</strong> {stats.emptyCells.toLocaleString()}</div>
            <div><strong>Data completeness:</strong> {((stats.filledCells / stats.totalCells) * 100).toFixed(1)}%</div>
            <div><strong>Processing time:</strong> {stats.processingTime.toFixed(2)}ms</div>
            <div><strong>Memory usage:</strong> {stats.memoryUsage}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CsvTableViewer;