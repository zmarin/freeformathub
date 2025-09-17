import { useState, useEffect, useMemo, useCallback } from 'react';
import { Scissors, Play } from 'lucide-react';
import { processCsvSplitter, type CsvSplitterConfig, type CsvSplitResult } from '../../../tools/data/csv-splitter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';
import { InputPanel } from '../../ui/InputPanel';
import { CsvSplitterConfig } from './CsvSplitterConfig';
import { CsvSplitterResults } from './CsvSplitterResults';

interface CsvSplitterProps {
  className?: string;
}

const DEFAULT_CONFIG: CsvSplitterConfig = {
  splitMode: 'rows',
  rowsPerFile: 1000,
  maxFileSize: 1024,
  fileSizeUnit: 'KB',
  splitColumn: '',
  uniqueValues: true,
  keepHeaders: true,
  delimiter: ',',
  customDelimiter: '|',
  outputFormat: 'csv',
  filenamePattern: 'part_{n}',
  zipOutput: true,
  previewSplits: true,
  maxPreviewRows: 3,
};

const EXAMPLES = [
  {
    title: 'Sales Data by Region',
    value: `name,region,sales,quarter
John,North,15000,Q1
Jane,South,18000,Q1
Bob,North,22000,Q1
Alice,South,19000,Q1
Charlie,East,16000,Q1
David,West,21000,Q1
Emma,North,19000,Q1
Frank,South,17000,Q1`,
  },
  {
    title: 'Large Product Catalog',
    value: `id,name,category,price,stock,supplier
1,"Gaming Laptop","Electronics",1299.99,25,"TechCorp Inc"
2,"Office Chair","Furniture",249.99,150,"FurnishPro"
3,"Programming Book","Education",49.99,75,"BookWorld"
4,"Wireless Mouse","Electronics",29.99,200,"TechCorp Inc"
5,"Standing Desk","Furniture",599.99,50,"FurnishPro"
6,"Python Course","Education",199.99,0,"EduTech"`,
  },
  {
    title: 'Employee Records',
    value: `employee_id,name,department,hire_date,salary,status
1001,"John Smith","Engineering","2020-01-15",75000,"Active"
1002,"Jane Doe","Marketing","2019-05-20",65000,"Active"
1003,"Bob Johnson","Sales","2021-03-10",55000,"Active"
1004,"Alice Brown","Engineering","2018-11-05",80000,"Active"
1005,"Charlie Davis","Marketing","2020-09-15",60000,"On Leave"`,
  },
];

export function CsvSplitter({ className = '' }: CsvSplitterProps) {
  const [input, setInput] = useState('');
  const [splits, setSplits] = useState<CsvSplitResult[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CsvSplitterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('csv-splitter') as Partial<CsvSplitterConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process CSV function
  const processCsv = useCallback((inputText: string = input, cfg: CsvSplitterConfig = config) => {
    if (!inputText.trim()) {
      setSplits([]);
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const result = processCsvSplitter(inputText, cfg);

    if (result.success && result.splits) {
      setSplits(result.splits);
      setError(undefined);
      setMetadata({
        totalFiles: result.totalFiles,
        totalRows: result.totalRows,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        processingTime: result.processingTime,
      });

      addToHistory({
        toolId: 'csv-splitter',
        input: inputText,
        output: `Split into ${result.totalFiles} files`,
        config: cfg,
        timestamp: Date.now(),
      });
    } else {
      setSplits([]);
      setError(result.error);
      setMetadata(undefined);
    }

    setIsLoading(false);
  }, [input, config, addToHistory]);

  // Debounced processing
  const debouncedProcess = useMemo(
    () => debounce(processCsv, 1000),
    [processCsv]
  );

  // Process input when it changes
  useEffect(() => {
    if (input.trim()) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess]);

  // Parse CSV headers for column detection
  const parseCSVHeaders = useCallback((csvContent: string) => {
    if (!csvContent.trim()) return [];

    const delimiter = config.delimiter === 'custom' ? config.customDelimiter : config.delimiter;
    const firstLine = csvContent.split('\n')[0];

    if (!firstLine) return [];

    // Simple CSV parsing for headers
    const headers = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < firstLine.length; i++) {
      const char = firstLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        headers.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    headers.push(current.trim().replace(/^"|"$/g, ''));

    return headers.filter(h => h.length > 0);
  }, [config.delimiter, config.customDelimiter]);

  // Update available columns when input or config changes
  useEffect(() => {
    if (input.trim()) {
      const columns = parseCSVHeaders(input);
      setAvailableColumns(columns);
    } else {
      setAvailableColumns([]);
    }
  }, [input, parseCSVHeaders]);


  // Handle config changes
  const handleConfigChange = useCallback((key: keyof CsvSplitterConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateSavedConfig?.('csv-splitter', newConfig);
  }, [config, updateSavedConfig]);

  // Manual process trigger
  const handleManualProcess = useCallback(() => {
    processCsv(input, config);
  }, [input, config, processCsv]);


  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input Section */}
      <InputPanel
        value={input}
        onChange={setInput}
        label="CSV Input"
        placeholder="Paste your CSV data here or drag and drop a CSV file..."
        accept=".csv,text/csv"
        examples={EXAMPLES}
        rows={12}
        syntax="csv"
      />

      {/* Configuration Section */}
      <div className="space-y-4">
        <CsvSplitterConfig
          config={config}
          onChange={handleConfigChange}
          availableColumns={availableColumns}
        />

        {/* Process Button and Preview Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualProcess}
                disabled={isLoading || !input.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                          disabled:bg-blue-400 text-white rounded-md transition-colors font-medium
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Splitting...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    <span>Split CSV</span>
                  </>
                )}
              </button>

              {splits.length > 0 && (
                <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
                              dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span>Show file previews</span>
                </label>
              )}
            </div>

            {availableColumns.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">{availableColumns.length}</span> columns detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-2 text-red-800 dark:text-red-200">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {splits.length > 0 && (
        <CsvSplitterResults
          splits={splits}
          metadata={metadata}
          zipOutput={config.zipOutput}
          showPreview={showPreview}
          onError={setError}
        />
      )}
    </div>
  );
}