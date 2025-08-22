import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processCssToTailwindConverter, type CssToTailwindConfig } from '../../../tools/converters/css-to-tailwind-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CssToTailwindConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: CssToTailwindConfig = {
  preserveComments: false,
  useShorthandClasses: true,
  generateUtilityClasses: true,
  includeResponsiveVariants: false,
  includeHoverStates: false,
  includeFocusStates: false,
  includeActiveStates: false,
  useArbitraryValues: true,
  convertFlexbox: true,
  convertGrid: true,
  convertPositioning: true,
  convertSpacing: true,
  convertColors: true,
  convertTypography: true,
  convertBorders: true,
  convertBackgrounds: true,
  convertShadows: true,
  convertTransitions: true,
  generateComponentClasses: false,
  outputFormat: 'classes',
};

const CONVERSION_OPTIONS = [
  {
    key: 'convertFlexbox',
    label: 'Convert Flexbox',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert flexbox layout properties',
  },
  {
    key: 'convertGrid',
    label: 'Convert Grid',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert CSS Grid layout properties',
  },
  {
    key: 'convertPositioning',
    label: 'Convert Positioning',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert position, top, right, bottom, left',
  },
  {
    key: 'convertSpacing',
    label: 'Convert Spacing',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert margin, padding properties',
  },
  {
    key: 'convertColors',
    label: 'Convert Colors',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert color, background-color properties',
  },
  {
    key: 'convertTypography',
    label: 'Convert Typography',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert font, text properties',
  },
  {
    key: 'convertBorders',
    label: 'Convert Borders',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert border properties',
  },
  {
    key: 'convertBackgrounds',
    label: 'Convert Backgrounds',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert background properties',
  },
  {
    key: 'convertShadows',
    label: 'Convert Shadows',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert box-shadow properties',
  },
  {
    key: 'convertTransitions',
    label: 'Convert Transitions',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert transition properties',
  },
] as const;

const VARIANT_OPTIONS = [
  {
    key: 'includeResponsiveVariants',
    label: 'Responsive Variants',
    type: 'checkbox' as const,
    default: false,
    description: 'Generate responsive breakpoint variants',
  },
  {
    key: 'includeHoverStates',
    label: 'Hover States',
    type: 'checkbox' as const,
    default: false,
    description: 'Generate hover: variants',
  },
  {
    key: 'includeFocusStates',
    label: 'Focus States',
    type: 'checkbox' as const,
    default: false,
    description: 'Generate focus: variants',
  },
  {
    key: 'includeActiveStates',
    label: 'Active States',
    type: 'checkbox' as const,
    default: false,
    description: 'Generate active: variants',
  },
] as const;

const FORMAT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'classes',
    options: [
      { value: 'classes', label: 'Classes Only' },
      { value: 'html', label: 'HTML Example' },
      { value: 'react', label: 'React/JSX' },
      { value: 'vue', label: 'Vue Template' },
    ],
    description: 'Choose output format style',
  },
  {
    key: 'useShorthandClasses',
    label: 'Use Shorthand',
    type: 'checkbox' as const,
    default: true,
    description: 'Prefer shorthand classes (p-4 vs px-4 py-4)',
  },
  {
    key: 'useArbitraryValues',
    label: 'Arbitrary Values',
    type: 'checkbox' as const,
    default: true,
    description: 'Use arbitrary values for custom properties',
  },
  {
    key: 'preserveComments',
    label: 'Preserve Comments',
    type: 'checkbox' as const,
    default: false,
    description: 'Keep CSS comments in processing',
  },
] as const;

export function CssToTailwindConverter({ className = '' }: CssToTailwindConverterProps) {
  const [input, setInput] = useState(`.card {
  background-color: #ffffff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}`);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversion, setConversion] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<CssToTailwindConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: CssToTailwindConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processCssToTailwindConverter(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setConversion(result.conversion);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'css-to-tailwind-converter',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.conversion ? `${result.conversion.conversionStats.generatedClasses} classes` : 'Converted',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to convert CSS to Tailwind');
          setOutput('');
          setConversion(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during CSS conversion');
        setOutput('');
        setConversion(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('css-to-tailwind-converter');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'card' | 'button' | 'flexbox' | 'grid' | 'responsive' | 'animation' | 'complex') => {
    const examples = {
      card: `.card {
  background-color: #ffffff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}`,
      button: `.btn {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #2563eb;
}`,
      flexbox: `.flex-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  height: 100vh;
  padding: 20px;
}`,
      grid: `.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 24px;
}`,
      responsive: `.responsive-text {
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

@media (min-width: 768px) {
  .responsive-text {
    font-size: 16px;
    line-height: 1.625;
  }
}`,
      animation: `.animated-box {
  width: 100px;
  height: 100px;
  background-color: #f59e0b;
  border-radius: 8px;
  transition: all 0.3s ease;
  transform: scale(1);
}

.animated-box:hover {
  transform: scale(1.1);
  background-color: #d97706;
}`,
      complex: `.component {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.component::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #f093fb 0%, #f5576c 50%, #4facfe 100%);
  border-radius: 14px;
  z-index: -1;
}`,
    };
    
    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...CONVERSION_OPTIONS,
    ...VARIANT_OPTIONS,
    ...FORMAT_OPTIONS,
  ];

  // Conversion stats colors
  const getConversionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-800 bg-green-100';
    if (rate >= 70) return 'text-yellow-800 bg-yellow-100';
    return 'text-red-800 bg-red-100';
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Conversion Statistics */}
        {conversion && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Conversion Statistics</h3>
            <div className={`p-4 rounded-lg border-2 ${getConversionRateColor(conversion.conversionStats.conversionRate)}`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {conversion.conversionStats.conversionRate >= 90 ? '✅' : 
                   conversion.conversionStats.conversionRate >= 70 ? '⚠️' : '❌'}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {conversion.conversionStats.conversionRate}% Converted
                  </div>
                  <div className="text-xs opacity-80">
                    {conversion.conversionStats.generatedClasses} classes generated
                  </div>
                </div>
                <div className="ml-auto">
                  <div className="text-xs font-medium">
                    {conversion.conversionStats.convertedRules}/{conversion.conversionStats.totalRules} rules
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick CSS Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick CSS Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('card')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🃏 Card Component
            </button>
            <button
              onClick={() => handleQuickExample('button')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              🔘 Button Styles
            </button>
            <button
              onClick={() => handleQuickExample('flexbox')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              📐 Flexbox Layout
            </button>
            <button
              onClick={() => handleQuickExample('grid')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              🏗️ Grid Layout
            </button>
            <button
              onClick={() => handleQuickExample('responsive')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              📱 Responsive CSS
            </button>
            <button
              onClick={() => handleQuickExample('animation')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              ✨ Animation
            </button>
            <button
              onClick={() => handleQuickExample('complex')}
              className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-left"
            >
              🎨 Complex Styles
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Conversion Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Conversion Details */}
        {conversion && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Conversion Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-blue-50 rounded">
                <span className="text-blue-600">Generated Classes:</span>
                <span className="text-blue-800 font-medium">{conversion.conversionStats.generatedClasses}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-green-50 rounded">
                <span className="text-green-600">Utility Classes:</span>
                <span className="text-green-800 font-medium">{conversion.utilityClasses.length}</span>
              </div>
              {conversion.responsiveVariants.length > 0 && (
                <div className="flex justify-between text-xs p-2 bg-purple-50 rounded">
                  <span className="text-purple-600">Responsive Variants:</span>
                  <span className="text-purple-800 font-medium">{conversion.responsiveVariants.length}</span>
                </div>
              )}
              {conversion.interactiveStates.length > 0 && (
                <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                  <span className="text-indigo-600">Interactive States:</span>
                  <span className="text-indigo-800 font-medium">{conversion.interactiveStates.length}</span>
                </div>
              )}
              {conversion.arbitraryValues.length > 0 && (
                <div className="flex justify-between text-xs p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-600">Arbitrary Values:</span>
                  <span className="text-yellow-800 font-medium">{conversion.arbitraryValues.length}</span>
                </div>
              )}
              {conversion.unconvertedRules.length > 0 && (
                <div className="flex justify-between text-xs p-2 bg-red-50 rounded">
                  <span className="text-red-600">Unconverted Rules:</span>
                  <span className="text-red-800 font-medium">{conversion.unconvertedRules.length}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tailwind Classes Preview */}
        {conversion && conversion.tailwindClasses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Tailwind Classes</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="font-mono text-gray-800 break-all">
                {conversion.tailwindClasses.join(' ')}
              </div>
            </div>
          </div>
        )}

        {/* Arbitrary Values */}
        {conversion && conversion.arbitraryValues.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Arbitrary Values</h3>
            <div className="space-y-1">
              {conversion.arbitraryValues.slice(0, 5).map((value: string, index: number) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">⚡</span>
                    <span className="text-yellow-800 font-mono">{value}</span>
                  </div>
                </div>
              ))}
              {conversion.arbitraryValues.length > 5 && (
                <div className="text-xs text-gray-600 px-2">
                  ... and {conversion.arbitraryValues.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Warnings</h3>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-800">{warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tailwind Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Tailwind CSS Info</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🎨 About Tailwind CSS</div>
              <div className="space-y-1">
                <div>• Utility-first CSS framework</div>
                <div>• Responsive design with breakpoint prefixes</div>
                <div>• Interactive states with hover:, focus:</div>
                <div>• Arbitrary values for custom properties</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🗑️ Clear Data
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="CSS to Convert"
          value={input}
          onChange={setInput}
          placeholder="Enter CSS styles to convert to Tailwind classes..."
          language="css"
        />

        <OutputPanel
          title="Tailwind Conversion Result"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'classes' ? 'text' : 
                   config.outputFormat === 'react' ? 'jsx' :
                   config.outputFormat === 'vue' ? 'html' : 'html'}
          placeholder="Tailwind CSS conversion results will appear here..."
          processingMessage="Converting CSS to Tailwind..."
          customActions={
            output && conversion ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(conversion.tailwindClasses.join(' '))}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Classes
                </button>
                {conversion.htmlOutput && (
                  <button
                    onClick={() => navigator.clipboard?.writeText(conversion.htmlOutput)}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    📋 Copy {config.outputFormat.toUpperCase()}
                  </button>
                )}
                <button
                  onClick={() => {
                    const report = `CSS to Tailwind Conversion Report
Generated: ${new Date().toISOString()}

Conversion Statistics:
- Total CSS Rules: ${conversion.conversionStats.totalRules}
- Converted Rules: ${conversion.conversionStats.convertedRules}
- Conversion Rate: ${conversion.conversionStats.conversionRate}%
- Generated Classes: ${conversion.conversionStats.generatedClasses}

Tailwind Classes:
${conversion.tailwindClasses.join(' ')}

${conversion.responsiveVariants.length > 0 ? `\nResponsive Variants:
${conversion.responsiveVariants.join(' ')}` : ''}

${conversion.interactiveStates.length > 0 ? `\nInteractive States:
${conversion.interactiveStates.join(' ')}` : ''}

${conversion.arbitraryValues.length > 0 ? `\nArbitrary Values:
${conversion.arbitraryValues.join('\n')}` : ''}

${conversion.unconvertedRules.length > 0 ? `\nUnconverted CSS Rules:
${conversion.unconvertedRules.join('\n')}` : ''}`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getConversionRateColor(conversion.conversionStats.conversionRate)}`}>
                  {conversion.conversionStats.conversionRate}% Converted
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {conversion.conversionStats.generatedClasses} Classes
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}