import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processColor, type ColorConverterConfig } from '../../../tools/converters/color-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface ColorConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: ColorConverterConfig = {
  inputFormat: 'auto',
  outputFormats: [], // Empty array means show all formats
  includeAlpha: true,
  uppercaseHex: false,
  showColorPreview: true,
};

const OPTIONS = [
  {
    key: 'inputFormat',
    label: 'Input Format',
    type: 'select' as const,
    default: 'auto',
    options: [
      { value: 'auto', label: 'Auto-detect' },
      { value: 'hex', label: 'HEX (#RRGGBB)' },
      { value: 'rgb', label: 'RGB (r, g, b)' },
      { value: 'hsl', label: 'HSL (h, s%, l%)' },
      { value: 'hsv', label: 'HSV (h, s%, v%)' },
      { value: 'cmyk', label: 'CMYK (c%, m%, y%, k%)' },
      { value: 'named', label: 'Named Colors' },
    ],
    description: 'Specify input color format or auto-detect',
  },
  {
    key: 'outputFormats',
    label: 'Output Formats',
    type: 'multiselect' as const,
    default: [],
    options: [
      { value: 'hex', label: 'HEX' },
      { value: 'rgb', label: 'RGB' },
      { value: 'hsl', label: 'HSL' },
      { value: 'hsv', label: 'HSV' },
      { value: 'cmyk', label: 'CMYK' },
      { value: 'lab', label: 'LAB' },
      { value: 'named', label: 'Named' },
    ],
    description: 'Select output formats (empty = all formats)',
  },
  {
    key: 'uppercaseHex',
    label: 'Uppercase HEX',
    type: 'boolean' as const,
    default: false,
    description: 'Use uppercase letters in HEX output',
  },
  {
    key: 'showColorPreview',
    label: 'Show Preview',
    type: 'boolean' as const,
    default: true,
    description: 'Display color preview in output',
  },
];

const EXAMPLES = [
  {
    title: 'HEX Color',
    value: '#ff5733',
  },
  {
    title: 'RGB Color',
    value: 'rgb(64, 128, 255)',
  },
  {
    title: 'RGBA with Alpha',
    value: 'rgba(255, 87, 51, 0.8)',
  },
  {
    title: 'HSL Color',
    value: 'hsl(240, 100%, 50%)',
  },
  {
    title: 'HSV Color',
    value: 'hsv(120, 50%, 75%)',
  },
  {
    title: 'CMYK Color',
    value: 'cmyk(50%, 0%, 100%, 0%)',
  },
  {
    title: 'Named Color',
    value: 'coral',
  },
  {
    title: 'HEX with Alpha',
    value: '#ff573380',
  },
];

export function ColorConverter({ className = '' }: ColorConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ColorConverterConfig>(DEFAULT_CONFIG);
  const [colorPreview, setColorPreview] = useState<string>('#ffffff');

  const { addToHistory } = useToolStore();

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: ColorConverterConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        setColorPreview('#ffffff');
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = processColor(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          
          // Extract color for preview
          if (result.metadata?.colorPreview) {
            setColorPreview(result.metadata.colorPreview as string);
          }
          
          // Add to history for successful operations
          addToHistory({
            toolId: 'color-converter',
            input: inputText,
            output: result.output || '',
            config: cfg,
            timestamp: Date.now(),
          });
        } else {
          setOutput('');
          setError(result.error);
          setColorPreview('#ffffff');
        }
        
        setIsLoading(false);
      }, 100);
    }, 300),
    [addToHistory]
  );

  // Process input when it changes
  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: ColorConverterConfig) => {
    setConfig(newConfig);
  };

  const getInputFormatHint = () => {
    switch (config.inputFormat) {
      case 'hex': return 'Enter HEX color (e.g., #ff5733, #f53)';
      case 'rgb': return 'Enter RGB color (e.g., rgb(255, 87, 51))';
      case 'hsl': return 'Enter HSL color (e.g., hsl(14, 100%, 60%))';
      case 'hsv': return 'Enter HSV color (e.g., hsv(14, 80%, 100%))';
      case 'cmyk': return 'Enter CMYK color (e.g., cmyk(0%, 66%, 80%, 0%))';
      case 'named': return 'Enter named color (e.g., coral, blue, red)';
      default: return 'Enter any color format...';
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="Color Input"
          placeholder={getInputFormatHint()}
          syntax="text"
          examples={EXAMPLES}
          accept=".txt,.css,.scss"
        />
        
        {/* Color Preview */}
        {input && !error && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Preview:
              </label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                  style={{ backgroundColor: colorPreview }}
                  title={colorPreview}
                />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="font-mono">{colorPreview}</div>
                  <div className="text-xs mt-1">Click to copy</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Quick Color Picker */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Colors:
            </label>
            <div className="grid grid-cols-8 gap-1">
              {[
                '#ff0000', '#00ff00', '#0000ff', '#ffff00',
                '#ff00ff', '#00ffff', '#ffa500', '#800080',
                '#ffc0cb', '#8b4513', '#000000', '#ffffff',
                '#808080', '#ff6347', '#32cd32', '#4169e1'
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => setInput(color)}
                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Output Panel */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label="Color Formats"
        syntax="text"
        downloadFilename="color-formats.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}