import React, { useState, useCallback, useMemo } from 'react';
import { Type, Palette, AlignLeft, AlignCenter, AlignRight, Settings, Copy, Download, Sparkles, Eye } from 'lucide-react';
import { processASCIIArtGenerator } from '../../../tools/text/ascii-art-generator';
import type { ASCIIArtConfig } from '../../../tools/text/ascii-art-generator';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { debounce } from '../../../lib/utils';

interface ASCIIArtGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: ASCIIArtConfig = {
  width: 80,
  font: 'standard',
  style: 'filled',
  alignment: 'left',
  includeColors: false,
  colorScheme: 'none',
  customColor: '#000000',
  backgroundChar: ' ',
  foregroundChar: '█',
  spacing: 0,
  verticalSpacing: 0
};

export default function ASCIIArtGenerator({ className = '' }: ASCIIArtGeneratorProps) {
  const [input, setInput] = useState('HELLO');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<ASCIIArtConfig>(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState(false);

  const processInput = useMemo(
    () => debounce(async (currentInput: string, currentConfig: ASCIIArtConfig) => {
      if (!currentInput.trim()) {
        setResult(null);
        setError('');
        return;
      }

      setIsProcessing(true);
      setError('');

      try {
        const toolResult = await processASCIIArtGenerator(currentInput, currentConfig);
        
        if (toolResult.data) {
          setResult(toolResult);
          setError('');
        } else {
          setError(toolResult.error || 'Failed to generate ASCII art');
          setResult(null);
        }
      } catch (err) {
        setError('Error generating ASCII art');
        setResult(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    []
  );

  React.useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = useCallback((key: keyof ASCIIArtConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleQuickExample = (type: 'welcome' | 'logo' | 'title' | 'banner' | 'name' | 'number') => {
    const examples = {
      welcome: { text: 'WELCOME', config: { font: 'banner' as const, style: 'filled' as const, alignment: 'center' as const } },
      logo: { text: 'ACME', config: { font: 'big' as const, style: 'shadow' as const, alignment: 'center' as const } },
      title: { text: 'TITLE', config: { font: 'block' as const, style: 'outline' as const, spacing: 1 } },
      banner: { text: 'SUCCESS', config: { font: 'standard' as const, style: 'double' as const, alignment: 'center' as const } },
      name: { text: 'JOHN DOE', config: { font: 'digital' as const, style: 'filled' as const, spacing: 1 } },
      number: { text: '2024', config: { font: 'big' as const, style: 'filled' as const, alignment: 'center' as const } }
    };

    const example = examples[type];
    setInput(example.text);
    setConfig(prev => ({ ...prev, ...example.config }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadASCII = () => {
    if (!result?.data?.asciiArt) return;
    
    const blob = new Blob([result.data.asciiArt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascii-art-${input.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAlignmentIcon = (alignment: string) => {
    switch (alignment) {
      case 'center': return <AlignCenter className="w-4 h-4" />;
      case 'right': return <AlignRight className="w-4 h-4" />;
      default: return <AlignLeft className="w-4 h-4" />;
    }
  };

  const getFontDescription = (font: string) => {
    const descriptions = {
      standard: 'Multi-line block letters with character details',
      small: 'Single character height, compact style',
      big: 'Large block letters, bold appearance',
      block: 'Solid rectangular blocks',
      banner: 'Decorative banner style',
      digital: 'Digital LCD display style'
    };
    return descriptions[font as keyof typeof descriptions] || 'Custom font style';
  };

  const getStatistics = () => {
    if (!result?.data) return [];
    
    const stats = [];
    const { data, metadata } = result;
    
    stats.push({ label: 'Font', value: data.fontInfo.name });
    stats.push({ label: 'Style', value: config.style });
    stats.push({ label: 'Dimensions', value: `${data.dimensions.width}×${data.dimensions.height}` });
    stats.push({ label: 'Lines', value: data.stats.lines.toString() });
    stats.push({ label: 'Characters', value: data.stats.totalCharacters.toString() });
    stats.push({ label: 'Unique Chars', value: data.stats.uniqueCharacters.toString() });
    stats.push({ label: 'Density', value: `${data.stats.density.toFixed(1)}%` });
    stats.push({ label: 'Processing Time', value: `${result.processing_time}ms` });
    
    return stats;
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-8 ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Type className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">ASCII Art Generator</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate beautiful ASCII art from text with multiple fonts, styles, and customization options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Input Panel */}
          <InputPanel
            title="Text to Convert"
            value={input}
            onChange={setInput}
            placeholder="Enter text to convert to ASCII art..."
            language="text"
            height="120px"
          />

          {/* Output Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">ASCII Art Output</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>{previewMode ? 'Code' : 'Preview'}</span>
                </button>
                {result?.data && (
                  <>
                    <button
                      onClick={() => copyToClipboard(result.data.asciiArt)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={downloadASCII}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <OutputPanel
              title=""
              content={result?.data?.asciiArt || ''}
              isProcessing={isProcessing}
              error={error}
              language={previewMode ? 'text' : 'text'}
              height="400px"
              showCopy={false}
              className={previewMode ? 'font-mono text-xs' : 'font-mono text-sm'}
            />

            {/* ASCII Art Info */}
            {result?.data && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Dimensions:</span>
                    <div className="text-blue-800">{result.data.dimensions.width} × {result.data.dimensions.height}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Lines:</span>
                    <div className="text-blue-800">{result.data.stats.lines}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Characters:</span>
                    <div className="text-blue-800">{result.data.stats.totalCharacters}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Density:</span>
                    <div className="text-blue-800">{result.data.stats.density.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Examples */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Quick Examples
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'welcome', label: 'Welcome', icon: '👋', desc: 'Banner style' },
                { id: 'logo', label: 'Logo', icon: '🏢', desc: 'Company branding' },
                { id: 'title', label: 'Title', icon: '📝', desc: 'Document header' },
                { id: 'banner', label: 'Banner', icon: '🎉', desc: 'Success message' },
                { id: 'name', label: 'Name', icon: '👤', desc: 'Personal name' },
                { id: 'number', label: 'Year', icon: '📅', desc: 'Year/number' }
              ].map(({ id, label, icon, desc }) => (
                <button
                  key={id}
                  onClick={() => handleQuickExample(id as any)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <OptionsPanel title="ASCII Art Settings">
            <div className="space-y-4">
              {/* Font Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Style
                </label>
                <select
                  value={config.font}
                  onChange={(e) => handleConfigChange('font', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="small">Small</option>
                  <option value="big">Big</option>
                  <option value="block">Block</option>
                  <option value="banner">Banner</option>
                  <option value="digital">Digital</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getFontDescription(config.font)}
                </p>
              </div>

              {/* Style Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style Effect
                </label>
                <select
                  value={config.style}
                  onChange={(e) => handleConfigChange('style', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="filled">Filled</option>
                  <option value="outline">Outline</option>
                  <option value="shadow">Shadow</option>
                  <option value="double">Double</option>
                  <option value="gradient">Gradient</option>
                </select>
              </div>

              {/* Alignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Alignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => handleConfigChange('alignment', align)}
                      className={`flex items-center justify-center space-x-1 p-2 border rounded transition-colors ${
                        config.alignment === align
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {getAlignmentIcon(align)}
                      <span className="text-xs capitalize">{align}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Character Customization */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Character Options</h4>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Foreground Character
                  </label>
                  <div className="grid grid-cols-6 gap-1">
                    {['█', '▓', '▒', '░', '#', '*'].map((char) => (
                      <button
                        key={char}
                        onClick={() => handleConfigChange('foregroundChar', char)}
                        className={`p-2 border rounded text-center font-mono transition-colors ${
                          config.foregroundChar === char
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Custom Foreground
                  </label>
                  <input
                    type="text"
                    value={config.foregroundChar}
                    onChange={(e) => handleConfigChange('foregroundChar', e.target.value.slice(0, 1))}
                    maxLength={1}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono text-center"
                  />
                </div>
              </div>

              {/* Spacing Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Spacing</h4>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Character Spacing: {config.spacing}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={config.spacing}
                    onChange={(e) => handleConfigChange('spacing', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Line Spacing: {config.verticalSpacing}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={config.verticalSpacing}
                    onChange={(e) => handleConfigChange('verticalSpacing', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Width Constraint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Width: {config.width === 0 ? 'Unlimited' : config.width}
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={config.width}
                  onChange={(e) => handleConfigChange('width', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 (No limit)</span>
                  <span>120 chars</span>
                </div>
              </div>
            </div>
          </OptionsPanel>

          {/* Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Generation Statistics</h3>
            <div className="space-y-2">
              {getStatistics().map((stat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{stat.label}:</span>
                  <span className="font-medium text-gray-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Font Preview */}
          {result?.data && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Font Info
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Font:</span>
                  <span className="font-medium capitalize">{result.data.fontInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Character Size:</span>
                  <span className="font-medium">{result.data.fontInfo.characterWidth}×{result.data.fontInfo.characterHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Style:</span>
                  <span className="font-medium capitalize">{config.style}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Alignment:</span>
                  <div className="flex items-center space-x-1">
                    {getAlignmentIcon(config.alignment)}
                    <span className="font-medium capitalize">{config.alignment}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}