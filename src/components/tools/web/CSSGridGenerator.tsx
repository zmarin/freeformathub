import React, { useState, useCallback } from 'react';
import { Grid, Settings, Code, Eye, Download, Plus, Minus, Copy, Monitor } from 'lucide-react';
import { processCSSGridGenerator, type CSSGridGeneratorConfig } from '../../../tools/web/css-grid-generator';

const CSSGridGenerator: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'html'>('visual');
  const [config, setConfig] = useState<CSSGridGeneratorConfig>({
    columns: 3,
    rows: 3,
    columnGap: 16,
    rowGap: 16,
    columnSizes: ['1fr', '1fr', '1fr'],
    rowSizes: ['auto', 'auto', 'auto'],
    customColumnValues: ['', '', ''],
    customRowValues: ['', '', ''],
    gridTemplateAreas: [
      ['.', '.', '.'],
      ['.', '.', '.'],
      ['.', '.', '.']
    ],
    useGridAreas: false,
    containerWidth: 'auto',
    containerHeight: 'auto',
    padding: 0,
    justifyItems: 'stretch',
    alignItems: 'stretch',
    justifyContent: 'start',
    alignContent: 'start',
    generateResponsive: false,
    breakpoints: {
      mobile: { columns: 1, rows: 3 },
      tablet: { columns: 2, rows: 2 },
      desktop: { columns: 3, rows: 3 }
    },
    includeComments: true,
    outputFormat: 'css',
    useCSSSuffixes: false,
    gridItemPlacements: []
  });

  const generateGrid = useCallback(async () => {
    setLoading(true);
    try {
      const gridResult = await processCSSGridGenerator(config);
      setResult(gridResult);
    } catch (error) {
      setResult({
        data: null,
        error: error instanceof Error ? error.message : 'Grid generation failed'
      });
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Auto-generate when config changes
  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generateGrid();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [generateGrid]);

  const updateGridDimensions = (type: 'columns' | 'rows', value: number) => {
    const newValue = Math.max(1, Math.min(12, value));
    
    if (type === 'columns') {
      const newColumnSizes = Array(newValue).fill('1fr').map((_, i) => 
        config.columnSizes[i] || '1fr'
      );
      const newCustomColumnValues = Array(newValue).fill('').map((_, i) =>
        config.customColumnValues[i] || ''
      );
      
      // Update grid areas if using them
      const newGridTemplateAreas = config.gridTemplateAreas.map(row => {
        const newRow = Array(newValue).fill('.').map((_, i) => row[i] || '.');
        return newRow;
      });
      
      setConfig({
        ...config,
        columns: newValue,
        columnSizes: newColumnSizes,
        customColumnValues: newCustomColumnValues,
        gridTemplateAreas: newGridTemplateAreas
      });
    } else {
      const newRowSizes = Array(newValue).fill('auto').map((_, i) =>
        config.rowSizes[i] || 'auto'
      );
      const newCustomRowValues = Array(newValue).fill('').map((_, i) =>
        config.customRowValues[i] || ''
      );
      
      // Update grid areas if using them
      const newGridTemplateAreas = Array(newValue).fill(null).map((_, i) => {
        return config.gridTemplateAreas[i] || Array(config.columns).fill('.');
      });
      
      setConfig({
        ...config,
        rows: newValue,
        rowSizes: newRowSizes,
        customRowValues: newCustomRowValues,
        gridTemplateAreas: newGridTemplateAreas
      });
    }
  };

  const updateTrackSize = (type: 'columns' | 'rows', index: number, size: string) => {
    if (type === 'columns') {
      const newSizes = [...config.columnSizes];
      newSizes[index] = size as any;
      setConfig({ ...config, columnSizes: newSizes });
    } else {
      const newSizes = [...config.rowSizes];
      newSizes[index] = size as any;
      setConfig({ ...config, rowSizes: newSizes });
    }
  };

  const updateCustomValue = (type: 'columns' | 'rows', index: number, value: string) => {
    if (type === 'columns') {
      const newValues = [...config.customColumnValues];
      newValues[index] = value;
      setConfig({ ...config, customColumnValues: newValues });
    } else {
      const newValues = [...config.customRowValues];
      newValues[index] = value;
      setConfig({ ...config, customRowValues: newValues });
    }
  };

  const updateGridArea = (row: number, col: number, value: string) => {
    const newAreas = config.gridTemplateAreas.map((r, rIndex) =>
      rIndex === row ? r.map((c, cIndex) => cIndex === col ? value : c) : r
    );
    setConfig({ ...config, gridTemplateAreas: newAreas });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Grid className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            CSS Grid Generator
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Create responsive CSS Grid layouts with visual editor and code generation
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Grid Configuration
              </h2>
            </div>
            
            <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
              {/* Grid Dimensions */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Dimensions</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Columns
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateGridDimensions('columns', config.columns - 1)}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={config.columns}
                        onChange={(e) => updateGridDimensions('columns', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => updateGridDimensions('columns', config.columns + 1)}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rows
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateGridDimensions('rows', config.rows - 1)}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={config.rows}
                        onChange={(e) => updateGridDimensions('rows', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => updateGridDimensions('rows', config.rows + 1)}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gaps */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Gaps</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Column Gap: {config.columnGap}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={config.columnGap}
                      onChange={(e) => setConfig({...config, columnGap: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Row Gap: {config.rowGap}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={config.rowGap}
                      onChange={(e) => setConfig({...config, rowGap: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Column Sizes */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Column Sizes</h3>
                {config.columnSizes.map((size, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                      {index + 1}:
                    </span>
                    <select
                      value={size}
                      onChange={(e) => updateTrackSize('columns', index, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="fr">1fr</option>
                      <option value="auto">auto</option>
                      <option value="minmax">minmax</option>
                      <option value="fit-content">fit-content</option>
                      <option value="custom">custom</option>
                    </select>
                    {size === 'custom' && (
                      <input
                        type="text"
                        placeholder="200px"
                        value={config.customColumnValues[index]}
                        onChange={(e) => updateCustomValue('columns', index, e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Row Sizes */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Row Sizes</h3>
                {config.rowSizes.map((size, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                      {index + 1}:
                    </span>
                    <select
                      value={size}
                      onChange={(e) => updateTrackSize('rows', index, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="auto">auto</option>
                      <option value="fr">1fr</option>
                      <option value="minmax">minmax</option>
                      <option value="fit-content">fit-content</option>
                      <option value="custom">custom</option>
                    </select>
                    {size === 'custom' && (
                      <input
                        type="text"
                        placeholder="100px"
                        value={config.customRowValues[index]}
                        onChange={(e) => updateCustomValue('rows', index, e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Alignment */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Alignment</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Justify Items
                    </label>
                    <select
                      value={config.justifyItems}
                      onChange={(e) => setConfig({...config, justifyItems: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="start">start</option>
                      <option value="end">end</option>
                      <option value="center">center</option>
                      <option value="stretch">stretch</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Align Items
                    </label>
                    <select
                      value={config.alignItems}
                      onChange={(e) => setConfig({...config, alignItems: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="start">start</option>
                      <option value="end">end</option>
                      <option value="center">center</option>
                      <option value="stretch">stretch</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Options</h3>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.useGridAreas}
                    onChange={(e) => setConfig({...config, useGridAreas: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Use Named Grid Areas
                  </span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.generateResponsive}
                    onChange={(e) => setConfig({...config, generateResponsive: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Generate Responsive CSS
                  </span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.includeComments}
                    onChange={(e) => setConfig({...config, includeComments: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Include CSS Comments
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'visual'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Eye className="w-4 h-4 mr-2 inline" />
                  Visual Preview
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'code'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Code className="w-4 h-4 mr-2 inline" />
                  CSS Code
                </button>
                <button
                  onClick={() => setActiveTab('html')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'html'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Monitor className="w-4 h-4 mr-2 inline" />
                  HTML
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'visual' && (
                <div className="space-y-4">
                  {result?.data && (
                    <>
                      {/* Grid Preview */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: result.data.gridVisualization.columns.map((col: any) => {
                              switch (col.size) {
                                case 'fr': return '1fr';
                                case 'auto': return 'auto';
                                case 'minmax': return 'minmax(min-content, 1fr)';
                                case 'fit-content': return 'fit-content(200px)';
                                default: return col.size;
                              }
                            }).join(' '),
                            gridTemplateRows: result.data.gridVisualization.rows.map((row: any) => {
                              switch (row.size) {
                                case 'auto': return 'auto';
                                case 'fr': return '1fr';
                                case 'minmax': return 'minmax(min-content, 1fr)';
                                case 'fit-content': return 'fit-content(100px)';
                                default: return row.size;
                              }
                            }).join(' '),
                            gap: `${config.rowGap}px ${config.columnGap}px`,
                            padding: `${config.padding}px`,
                            justifyItems: config.justifyItems,
                            alignItems: config.alignItems,
                            justifyContent: config.justifyContent,
                            alignContent: config.alignContent,
                            minHeight: '300px'
                          }}
                          className="border border-dashed border-gray-300 dark:border-gray-600"
                        >
                          {Array.from({ length: config.columns * config.rows }).map((_, index) => (
                            <div
                              key={index}
                              className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded p-3 flex items-center justify-center text-sm font-medium text-blue-800 dark:text-blue-200 min-h-[60px]"
                            >
                              Item {index + 1}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Grid Areas Editor */}
                      {config.useGridAreas && (
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">Grid Template Areas</h3>
                          <div className="space-y-2">
                            {config.gridTemplateAreas.map((row, rowIndex) => (
                              <div key={rowIndex} className="flex gap-2">
                                {row.map((cell, colIndex) => (
                                  <input
                                    key={`${rowIndex}-${colIndex}`}
                                    type="text"
                                    value={cell}
                                    onChange={(e) => updateGridArea(rowIndex, colIndex, e.target.value)}
                                    placeholder="."
                                    className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Use area names (e.g., "header", "main", "sidebar") or "." for empty cells
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'code' && result?.data && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">Generated CSS</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(result.data.css)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={() => downloadFile(result.data.css, 'grid-layout.css')}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{result.data.css}</code>
                  </pre>

                  {config.outputFormat === 'tailwind' && result.data.tailwindClasses && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Tailwind Classes</h3>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <code className="text-sm">
                          {result.data.tailwindClasses.join(' ')}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'html' && result?.data && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">Sample HTML</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(result.data.html)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={() => downloadFile(result.data.html, 'grid-layout.html')}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{result.data.html}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          {result?.data && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Grid Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {result.data.gridStats.totalCells}
                  </div>
                  <div className="text-blue-800 dark:text-blue-200">Total Cells</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {config.columns}×{config.rows}
                  </div>
                  <div className="text-blue-800 dark:text-blue-200">Dimensions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {result.data.gridStats.namedAreas}
                  </div>
                  <div className="text-blue-800 dark:text-blue-200">Named Areas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {result.data.gridStats.hasGaps ? 'Yes' : 'No'}
                  </div>
                  <div className="text-blue-800 dark:text-blue-200">Has Gaps</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSSGridGenerator;