import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processAdvancedColorPaletteGenerator, type AdvancedColorPaletteGeneratorConfig } from '../../../tools/color/advanced-color-palette-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface AdvancedColorPaletteGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: AdvancedColorPaletteGeneratorConfig = {
  mode: 'harmony',
  harmonyType: 'complementary',
  colorCount: 5,
  baseColor: '#3498db',
  saturationRange: [30, 90],
  lightnessRange: [20, 80],
  includeNeutral: false,
  accessibilityLevel: 'AA',
  contrastRatio: 4.5,
  outputFormat: 'hex',
  includeNames: true,
  sortBy: 'hue',
  exportFormat: 'palette',
  temperatureBalance: 'mixed',
};

const MODE_OPTIONS = [
  {
    key: 'mode',
    label: 'Generation Mode',
    type: 'select' as const,
    default: 'harmony',
    options: [
      { value: 'harmony', label: '🎯 Harmony - Color theory relationships' },
      { value: 'gradient', label: '🌈 Gradient - Smooth color transitions' },
      { value: 'random', label: '🎲 Random - Controlled randomization' },
      { value: 'accessibility', label: '♿ Accessibility - WCAG compliant' },
      { value: 'brand', label: '🏢 Brand - Professional palettes' },
    ],
    description: 'Method for generating color palette',
  },
] as const;

const HARMONY_OPTIONS = [
  {
    key: 'harmonyType',
    label: 'Harmony Type',
    type: 'select' as const,
    default: 'complementary',
    options: [
      { value: 'monochromatic', label: '🔵 Monochromatic - Single hue variations' },
      { value: 'analogous', label: '🌊 Analogous - Adjacent hues (30°)' },
      { value: 'complementary', label: '⚖️ Complementary - Opposite hues (180°)' },
      { value: 'triadic', label: '🔺 Triadic - Three equidistant hues (120°)' },
      { value: 'tetradic', label: '🟦 Tetradic - Four hues (90°)' },
      { value: 'split-complementary', label: '✂️ Split-Complementary - Base + split opposites' },
    ],
    description: 'Color wheel relationship pattern',
  },
] as const;

const PALETTE_OPTIONS = [
  {
    key: 'colorCount',
    label: 'Color Count',
    type: 'number' as const,
    default: 5,
    min: 2,
    max: 20,
    description: 'Number of colors in the palette',
  },
  {
    key: 'includeNeutral',
    label: 'Include Neutrals',
    type: 'checkbox' as const,
    default: false,
    description: 'Add neutral colors (grays, black, white)',
  },
  {
    key: 'sortBy',
    label: 'Sort Colors By',
    type: 'select' as const,
    default: 'hue',
    options: [
      { value: 'hue', label: 'Hue (color wheel position)' },
      { value: 'saturation', label: 'Saturation (color intensity)' },
      { value: 'lightness', label: 'Lightness (brightness)' },
      { value: 'brightness', label: 'Perceived brightness' },
      { value: 'contrast', label: 'Contrast ratio' },
    ],
    description: 'How to order colors in the palette',
  },
] as const;

const ACCESSIBILITY_OPTIONS = [
  {
    key: 'accessibilityLevel',
    label: 'WCAG Level',
    type: 'select' as const,
    default: 'AA',
    options: [
      { value: 'AA', label: 'AA - Standard (4.5:1 contrast)' },
      { value: 'AAA', label: 'AAA - Enhanced (7:1 contrast)' },
    ],
    description: 'Web Content Accessibility Guidelines level',
  },
  {
    key: 'contrastRatio',
    label: 'Min Contrast Ratio',
    type: 'number' as const,
    default: 4.5,
    min: 1,
    max: 21,
    step: 0.1,
    description: 'Minimum contrast ratio for accessibility',
  },
] as const;

const OUTPUT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Color Format',
    type: 'select' as const,
    default: 'hex',
    options: [
      { value: 'hex', label: 'HEX - #RRGGBB' },
      { value: 'rgb', label: 'RGB - rgb(r, g, b)' },
      { value: 'hsl', label: 'HSL - hsl(h, s%, l%)' },
      { value: 'hsv', label: 'HSV - hsv(h, s%, v%)' },
      { value: 'lab', label: 'LAB - lab(l, a, b)' },
      { value: 'all', label: 'All formats' },
    ],
    description: 'Color value format in output',
  },
  {
    key: 'exportFormat',
    label: 'Export Format',
    type: 'select' as const,
    default: 'palette',
    options: [
      { value: 'palette', label: '🎨 Palette - Human readable' },
      { value: 'css', label: '🎯 CSS - Custom properties' },
      { value: 'scss', label: '💎 SCSS - Variables' },
      { value: 'json', label: '📊 JSON - Data format' },
    ],
    description: 'Output format for export',
  },
  {
    key: 'includeNames',
    label: 'Include Color Names',
    type: 'checkbox' as const,
    default: true,
    description: 'Show color names when available',
  },
] as const;

export function AdvancedColorPaletteGenerator({ className = '' }: AdvancedColorPaletteGeneratorProps) {
  const [input, setInput] = useState('#3498db');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<AdvancedColorPaletteGeneratorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: AdvancedColorPaletteGeneratorConfig) => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = processAdvancedColorPaletteGenerator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setPalette(result.palette);
          
          // Add to history
          addToHistory({
            toolId: 'advanced-color-palette-generator',
            input: `${currentConfig.mode}: ${currentInput}`,
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate color palette');
          setOutput('');
          setPalette(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during palette generation');
        setOutput('');
        setPalette(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('advanced-color-palette-generator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'blue' | 'sunset' | 'nature' | 'brand' | 'accessible') => {
    const examples = {
      blue: { input: '#3498db', config: { mode: 'harmony' as const, harmonyType: 'analogous' as const } },
      sunset: { input: '#ff6b6b', config: { mode: 'harmony' as const, harmonyType: 'complementary' as const } },
      nature: { input: '#27ae60', config: { mode: 'harmony' as const, harmonyType: 'triadic' as const } },
      brand: { input: '#667eea', config: { mode: 'brand' as const, includeNeutral: true } },
      accessible: { input: '#2c3e50', config: { mode: 'accessibility' as const, accessibilityLevel: 'AAA' as const } }
    };
    
    const example = examples[type];
    setInput(example.input);
    setConfig(prev => ({ ...prev, ...example.config }));
  };

  const handleColorPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleRandomColor = () => {
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setInput(randomHex);
  };

  // Build conditional options
  const allOptions = [
    ...MODE_OPTIONS,
    ...(config.mode === 'harmony' ? HARMONY_OPTIONS : []),
    ...PALETTE_OPTIONS,
    ...(config.mode === 'accessibility' ? ACCESSIBILITY_OPTIONS : []),
    ...OUTPUT_OPTIONS,
  ];

  const showHarmonyOptions = config.mode === 'harmony';
  const currentBaseColor = input || '#3498db';

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Color Picker */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Base Color</h3>
          <div className="flex items-center gap-3">
            <div 
              className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer relative overflow-hidden"
              style={{ backgroundColor: currentBaseColor }}
            >
              <input
                type="color"
                value={currentBaseColor}
                onChange={handleColorPick}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="#3498db"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleRandomColor}
                className="mt-2 w-full px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                🎲 Random Color
              </button>
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('blue')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              🔵 Ocean Blues
            </button>
            <button
              onClick={() => handleQuickExample('sunset')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              🌅 Sunset
            </button>
            <button
              onClick={() => handleQuickExample('nature')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              🌿 Nature
            </button>
            <button
              onClick={() => handleQuickExample('brand')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              🏢 Brand
            </button>
          </div>
          <button
            onClick={() => handleQuickExample('accessible')}
            className="w-full px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ♿ Accessible Palette
          </button>
        </div>

        <OptionsPanel
          title="Palette Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Palette Preview */}
        {palette && palette.colors && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Color Preview</h3>
            <div className="grid grid-cols-5 gap-2">
              {palette.colors.slice(0, 10).map((color: any, index: number) => (
                <div key={index} className="space-y-1">
                  <div 
                    className="w-full h-12 rounded border border-gray-200 cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.hex} ${color.name ? `(${color.name})` : ''}`}
                    onClick={() => navigator.clipboard?.writeText(color.hex)}
                  />
                  <div className="text-xs text-center text-gray-600 font-mono">
                    {color.hex.substring(1, 4)}
                  </div>
                </div>
              ))}
            </div>
            {palette.colors.length > 10 && (
              <div className="text-xs text-center text-gray-500">
                +{palette.colors.length - 10} more colors
              </div>
            )}
          </div>
        )}

        {/* Palette Metadata */}
        {palette && palette.metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Palette Info</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="grid gap-1">
                <div>
                  <span className="text-blue-600">Type:</span>
                  <span className="ml-1 font-medium text-blue-800 capitalize">{palette.metadata.type}</span>
                </div>
                <div>
                  <span className="text-blue-600">Colors:</span>
                  <span className="ml-1 font-medium text-blue-800">{palette.metadata.colorCount}</span>
                </div>
                {palette.metadata.harmonyType && (
                  <div>
                    <span className="text-blue-600">Harmony:</span>
                    <span className="ml-1 font-medium text-blue-800 capitalize">{palette.metadata.harmonyType}</span>
                  </div>
                )}
                <div>
                  <span className="text-blue-600">Temperature:</span>
                  <span className="ml-1 font-medium text-blue-800 capitalize">{palette.metadata.temperatureBalance}</span>
                </div>
                <div>
                  <span className="text-blue-600">Avg Saturation:</span>
                  <span className="ml-1 font-medium text-blue-800">{palette.metadata.averageSaturation.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-blue-600">Avg Lightness:</span>
                  <span className="ml-1 font-medium text-blue-800">{palette.metadata.averageLightness.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accessibility Info */}
        {palette && palette.accessibility && palette.accessibility.contrastPairs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Accessibility</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {palette.accessibility.contrastPairs.slice(0, 5).map((pair: any, index: number) => (
                <div key={index} className={`p-2 rounded text-xs ${
                  pair.rating === 'AAA' ? 'bg-green-50 border border-green-200' :
                  pair.rating === 'AA' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: pair.foreground }}
                    />
                    <span>on</span>
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: pair.background }}
                    />
                    <span className="font-medium">{pair.rating}</span>
                  </div>
                  <div className="mt-1 text-gray-600">
                    Ratio: {pair.ratio.toFixed(2)}:1
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color Theory Info */}
        {showHarmonyOptions && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Color Theory</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-800">Harmony Types</div>
                <div className="text-gray-600 mt-1">
                  <div>• Monochromatic: Same hue, different values</div>
                  <div>• Analogous: Adjacent colors on wheel</div>
                  <div>• Complementary: Opposite colors</div>
                  <div>• Triadic: 3 evenly spaced colors</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="Base Color (Hex Format)"
          value={input}
          onChange={setInput}
          placeholder="Enter hex color (e.g., #3498db)"
          language="text"
        />

        <OutputPanel
          title="Generated Color Palette"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.exportFormat === 'json' ? 'json' : config.exportFormat === 'css' ? 'css' : 'text'}
          placeholder="Enter a base color to generate a harmonious palette..."
          processingMessage="Generating color palette..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Palette
                </button>
                <button
                  onClick={() => {
                    const extension = config.exportFormat === 'json' ? 'json' :
                                     config.exportFormat === 'css' ? 'css' :
                                     config.exportFormat === 'scss' ? 'scss' : 'txt';
                    const mimeType = config.exportFormat === 'json' ? 'application/json' :
                                    config.exportFormat === 'css' ? 'text/css' : 'text/plain';
                    const blob = new Blob([output], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `color-palette.${extension}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download
                </button>
                {palette && palette.colors && (
                  <button
                    onClick={() => {
                      const hexColors = palette.colors.map((c: any) => c.hex).join('\n');
                      navigator.clipboard?.writeText(hexColors);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    📋 Copy Hex Only
                  </button>
                )}
                {palette && palette.colors && (
                  <button
                    onClick={() => {
                      const cssVars = palette.colors.map((c: any, i: number) => 
                        `  --color-${i + 1}: ${c.hex};`
                      ).join('\n');
                      const cssOutput = `:root {\n${cssVars}\n}`;
                      navigator.clipboard?.writeText(cssOutput);
                    }}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    🎯 Copy CSS
                  </button>
                )}
                {palette && (
                  <button
                    onClick={() => {
                      const report = `Color Palette Report
Generated: ${new Date().toISOString()}

Base Color: ${palette.metadata.baseColor}
Mode: ${palette.metadata.type}
Harmony: ${palette.metadata.harmonyType || 'N/A'}
Colors: ${palette.metadata.colorCount}
Temperature: ${palette.metadata.temperatureBalance}
Avg Saturation: ${palette.metadata.averageSaturation.toFixed(1)}%
Avg Lightness: ${palette.metadata.averageLightness.toFixed(1)}%

Colors:
${palette.colors.map((c: any, i: number) => 
  `${i + 1}. ${c.hex} ${c.name ? `(${c.name})` : ''} [${c.temperature}]`
).join('\n')}

${palette.accessibility.contrastPairs.length > 0 ? `
Accessibility:
${palette.accessibility.contrastPairs.slice(0, 3).map((p: any) => 
  `${p.foreground} on ${p.background}: ${p.ratio.toFixed(2)}:1 (${p.rating})`
).join('\n')}` : ''}`;
                      
                      navigator.clipboard?.writeText(report);
                    }}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    📊 Copy Report
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}