import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processSVGOptimization, type SVGOptimizerConfig } from '../../../tools/web/svg-optimizer';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface SVGOptimizerProps {
  className?: string;
}

const DEFAULT_CONFIG: SVGOptimizerConfig = {
  removeComments: true,
  removeMetadata: true,
  removeUnusedNS: true,
  removeEditorsNS: true,
  removeEmptyAttrs: true,
  removeEmptyText: true,
  removeEmptyContainers: true,
  removeUnknownsAndDefaults: true,
  removeNonInheritableGroupAttrs: true,
  removeUselessStrokeAndFill: true,
  removeUnusedID: false,
  removeDimensions: false,
  convertStyleToAttrs: true,
  convertColors: true,
  convertPathData: true,
  convertTransform: true,
  removeHiddenElems: true,
  mergePaths: false,
  convertShapeToPath: false,
  sortAttrs: true,
  removeTitleAndDesc: false,
  minifyStyles: true,
  precision: 2,
};

const BASIC_OPTIONS = [
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove HTML comments from SVG',
  },
  {
    key: 'removeMetadata',
    label: 'Remove Metadata',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove <metadata>, <title>, and <desc> elements',
  },
  {
    key: 'removeTitleAndDesc',
    label: 'Remove Title & Description',
    type: 'checkbox' as const,
    default: false,
    description: 'Remove title and description elements (affects accessibility)',
  },
  {
    key: 'removeEmptyAttrs',
    label: 'Remove Empty Attributes',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove attributes with empty values',
  },
  {
    key: 'removeEmptyContainers',
    label: 'Remove Empty Containers',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove empty <g>, <defs>, and similar elements',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'convertStyleToAttrs',
    label: 'Convert Styles to Attributes',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert style attributes to individual attributes',
  },
  {
    key: 'convertColors',
    label: 'Optimize Colors',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert rgb() to hex when shorter',
  },
  {
    key: 'convertPathData',
    label: 'Optimize Path Data',
    type: 'checkbox' as const,
    default: true,
    description: 'Reduce precision in path coordinates',
  },
  {
    key: 'removeUselessStrokeAndFill',
    label: 'Remove Useless Stroke/Fill',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove stroke="none" and fill="none" when not needed',
  },
  {
    key: 'removeDimensions',
    label: 'Remove Width/Height',
    type: 'checkbox' as const,
    default: false,
    description: 'Remove width and height attributes (makes SVG responsive)',
  },
  {
    key: 'sortAttrs',
    label: 'Sort Attributes',
    type: 'checkbox' as const,
    default: true,
    description: 'Sort attributes alphabetically for consistency',
  },
] as const;

const PRECISION_OPTION = {
  key: 'precision',
  label: 'Path Precision',
  type: 'range' as const,
  default: 2,
  min: 0,
  max: 5,
  step: 1,
  description: 'Decimal places for path coordinates (lower = smaller file)',
};

const NAMESPACE_OPTIONS = [
  {
    key: 'removeUnusedNS',
    label: 'Remove Unused Namespaces',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove unused namespace declarations',
  },
  {
    key: 'removeEditorsNS',
    label: 'Remove Editor Namespaces',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove Sketch, Figma, Adobe-specific attributes',
  },
] as const;

export function SVGOptimizer({ className = '' }: SVGOptimizerProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<SVGOptimizerConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: SVGOptimizerConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setMetadata(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processSVGOptimization(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setMetadata(result.metadata);
          
          // Add to history
          addToHistory({
            toolId: 'svg-optimizer',
            input: inputValue.substring(0, 200) + (inputValue.length > 200 ? '...' : ''),
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to optimize SVG');
          setOutput('');
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during SVG optimization');
        setOutput('');
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('svg-optimizer');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
        setError('Please select a valid SVG file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setInput(result);
      };
      reader.readAsText(file);
    }
  }, []);

  const downloadOptimized = () => {
    if (!output) return;

    const blob = new Blob([output], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'optimized.svg';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  // Example SVG files
  const examples = [
    {
      label: 'Simple SVG with Metadata',
      value: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <!-- This is a comment -->
  <title>My SVG Icon</title>
  <desc>A simple red square</desc>
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:creator>Designer Name</dc:creator>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
  <g fill="none" stroke="none">
    <rect width="50" height="50" fill="#ff0000" stroke="none" x="25" y="25"/>
  </g>
</svg>`,
    },
    {
      label: 'Complex SVG with Inefficiencies',
      value: `<svg width="200px" height="200px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs></defs>
  <g style="fill: rgb(255, 0, 0); stroke: none;">
    <circle cx="100.000" cy="100.000" r="50.000" fill="rgb(255, 0, 0)"/>
    <g>
      <path d="M10.000,20.000 L30.000,40.000 L50.000,20.000 Z" style="fill: rgb(0, 255, 0);"/>
    </g>
  </g>
</svg>`,
    },
    {
      label: 'Upload SVG File',
      value: '',
    },
  ];

  // Build all options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...ADVANCED_OPTIONS,
    ...NAMESPACE_OPTIONS,
    PRECISION_OPTION,
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* File Upload Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Upload SVG File</h3>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500">
              Upload an SVG file or paste SVG code below
            </p>
          </div>
        </div>

        <InputPanel
          title="SVG Code"
          value={input}
          onChange={setInput}
          placeholder="<svg>...</svg>"
          description="Paste your SVG code here or upload a file above"
          examples={examples}
          onExampleClick={handleExample}
          language="xml"
          rows={8}
        />
        
        <OptionsPanel
          title="Basic Optimizations"
          options={BASIC_OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />

        <OptionsPanel
          title="Advanced Options"
          options={[...ADVANCED_OPTIONS, PRECISION_OPTION]}
          values={config}
          onChange={handleConfigChange}
        />

        <OptionsPanel
          title="Namespace Cleanup"
          options={NAMESPACE_OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Optimization Stats */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Optimization Results</h3>
            <div className="p-3 bg-gray-50 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">Original:</span>
                  <div className="font-medium">{(metadata.originalSize / 1024).toFixed(1)} KB</div>
                </div>
                <div>
                  <span className="text-gray-600">Optimized:</span>
                  <div className="font-medium text-green-600">{(metadata.optimizedSize / 1024).toFixed(1)} KB</div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Reduction:</span>
                  <div className="font-medium text-blue-600">{metadata.compressionRatio.toFixed(1)}% smaller</div>
                </div>
              </div>
              {metadata.elementsRemoved.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Removed:</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {metadata.elementsRemoved.join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfig({
                ...DEFAULT_CONFIG,
                removeTitleAndDesc: false,
                removeDimensions: false,
                precision: 2
              })}
              className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              🛡️ Safe Optimization
            </button>
            <button
              onClick={() => setConfig({
                ...DEFAULT_CONFIG,
                removeTitleAndDesc: true,
                removeDimensions: true,
                precision: 1
              })}
              className="px-3 py-2 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            >
              🗜️ Maximum Compression
            </button>
            <button
              onClick={() => setConfig({
                ...DEFAULT_CONFIG,
                removeDimensions: true,
                precision: 2
              })}
              className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              🌐 Web Optimized
            </button>
            <button
              onClick={() => setConfig({
                ...DEFAULT_CONFIG,
                removeTitleAndDesc: false,
                removeMetadata: false,
                precision: 3
              })}
              className="px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
            >
              🎨 Design Preserve
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Optimized SVG"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="xml"
          placeholder="Upload an SVG file or paste SVG code to start optimization..."
          processingMessage="Optimizing SVG..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={downloadOptimized}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download SVG
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Code
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}