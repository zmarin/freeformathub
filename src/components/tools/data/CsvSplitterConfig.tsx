import { Settings, HelpCircle } from 'lucide-react';
import type { CsvSplitterConfig } from '../../../tools/data/csv-splitter';

interface CsvSplitterConfigProps {
  config: CsvSplitterConfig;
  onChange: (config: CsvSplitterConfig) => void;
  className?: string;
  availableColumns?: string[];
}

export function CsvSplitterConfig({
  config,
  onChange,
  className = '',
  availableColumns = []
}: CsvSplitterConfigProps) {
  const handleChange = (key: keyof CsvSplitterConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div >
        <div className="flex items-center space-x-2">
          <Settings  />
          <h3 >
            Split Configuration
          </h3>
        </div>
      </div>

      {/* Configuration Options */}
      <div className="p-4 space-y-6">
        {/* Split Mode */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <label >
              Split Method
            </label>
            <div className="group relative">
              <HelpCircle  />
              <div className="invisible group-hover:visible absolute bottom-6 left-1/2 transform -translate-x-1/2
                             bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Choose how to split your CSV file
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50
                              ${config.splitMode === 'rows' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200'}`}>
              <input
                type="radio"
                name="splitMode"
                value="rows"
                checked={config.splitMode === 'rows'}
                onChange={(e) => handleChange('splitMode', e.target.value)}
                className="sr-only"
              />
              <div>
                <div >By Row Count</div>
                <div >Split every N rows</div>
              </div>
            </label>
            <label className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50
                              ${config.splitMode === 'size' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200'}`}>
              <input
                type="radio"
                name="splitMode"
                value="size"
                checked={config.splitMode === 'size'}
                onChange={(e) => handleChange('splitMode', e.target.value)}
                className="sr-only"
              />
              <div>
                <div >By File Size</div>
                <div >Split by max file size</div>
              </div>
            </label>
            <label className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50
                              ${config.splitMode === 'column' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200'}`}>
              <input
                type="radio"
                name="splitMode"
                value="column"
                checked={config.splitMode === 'column'}
                onChange={(e) => handleChange('splitMode', e.target.value)}
                className="sr-only"
              />
              <div>
                <div >By Column</div>
                <div >Separate unique values</div>
              </div>
            </label>
          </div>
        </div>

        {/* Split Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.splitMode === 'rows' && (
            <div>
              <label >
                Rows Per File
              </label>
              <input
                type="number"
                min="1"
                max="1000000"
                value={config.rowsPerFile}
                onChange={(e) => handleChange('rowsPerFile', parseInt(e.target.value) || 1000)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                          bg-white text-gray-900
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {config.splitMode === 'size' && (
            <>
              <div>
                <label >
                  Max File Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.maxFileSize}
                  onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value) || 1024)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                            bg-white text-gray-900
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label >
                  Size Unit
                </label>
                <select
                  value={config.fileSizeUnit}
                  onChange={(e) => handleChange('fileSizeUnit', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                            bg-white text-gray-900
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
            </>
          )}

          {config.splitMode === 'column' && (
            <div className="md:col-span-2">
              <label >
                Split Column
              </label>
              {availableColumns.length > 0 ? (
                <select
                  value={config.splitColumn}
                  onChange={(e) => handleChange('splitColumn', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                            bg-white text-gray-900
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a column...</option>
                  {availableColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={config.splitColumn}
                  onChange={(e) => handleChange('splitColumn', e.target.value)}
                  placeholder="Column name (e.g., region, category)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                            bg-white text-gray-900
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          )}
        </div>

        {/* CSV Format Settings */}
        <div >
          <h4 >
            CSV Format
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label >
                Delimiter
              </label>
              <select
                value={config.delimiter}
                onChange={(e) => handleChange('delimiter', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                          bg-white text-gray-900
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {config.delimiter === 'custom' && (
              <div>
                <label >
                  Custom Delimiter
                </label>
                <input
                  type="text"
                  value={config.customDelimiter}
                  onChange={(e) => handleChange('customDelimiter', e.target.value)}
                  placeholder="Enter delimiter"
                  maxLength={1}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                            bg-white text-gray-900
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label >
                Filename Pattern
              </label>
              <input
                type="text"
                value={config.filenamePattern}
                onChange={(e) => handleChange('filenamePattern', e.target.value)}
                placeholder="part_{n} (use {n} for number)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                          bg-white text-gray-900
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p >
                Use {'{n}'} for file number, {'{date}'} for timestamp
              </p>
            </div>
          </div>
        </div>

        {/* Output Options */}
        <div >
          <h4 >
            Output Options
          </h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.keepHeaders}
                onChange={(e) => handleChange('keepHeaders', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
"
              />
              <span >
                Keep headers in each file
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.zipOutput}
                onChange={(e) => handleChange('zipOutput', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
"
              />
              <span >
                Download as ZIP file
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.previewSplits}
                onChange={(e) => handleChange('previewSplits', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
"
              />
              <span >
                Show file previews
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}