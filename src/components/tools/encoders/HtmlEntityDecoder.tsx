import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processHtmlEntityDecoder, type HtmlEntityDecoderConfig } from '../../../tools/encoders/html-entity-decoder';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface HtmlEntityDecoderProps {
  className?: string;
}

const DEFAULT_CONFIG: HtmlEntityDecoderConfig = {
  decodeNamed: true,
  decodeNumeric: true,
  decodeHex: true,
  strictMode: false,
  preserveUnknown: true,
  validateHtml: false,
  outputFormat: 'text',
  maxLength: 10000,
};

const DECODING_OPTIONS = [
  {
    key: 'decodeNamed',
    label: 'Decode Named Entities',
    type: 'checkbox' as const,
    default: true,
    description: 'Decode named entities like &amp;, &lt;, &gt;',
  },
  {
    key: 'decodeNumeric',
    label: 'Decode Numeric Entities',
    type: 'checkbox' as const,
    default: true,
    description: 'Decode numeric entities like &#169;, &#8364;',
  },
  {
    key: 'decodeHex',
    label: 'Decode Hex Entities',
    type: 'checkbox' as const,
    default: true,
    description: 'Decode hexadecimal entities like &#x00A9;',
  },
  {
    key: 'preserveUnknown',
    label: 'Preserve Unknown',
    type: 'checkbox' as const,
    default: true,
    description: 'Keep unknown entities as-is instead of removing',
  },
] as const;

const OUTPUT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'text',
    options: [
      { value: 'text', label: 'Plain Text' },
      { value: 'html', label: 'HTML Escaped' },
      { value: 'escaped', label: 'JavaScript Escaped' },
    ],
    description: 'Choose output text formatting',
  },
  {
    key: 'validateHtml',
    label: 'Validate HTML',
    type: 'checkbox' as const,
    default: false,
    description: 'Check for HTML structure issues and XSS',
  },
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Fail on unknown or invalid entities',
  },
  {
    key: 'maxLength',
    label: 'Max Input Length',
    type: 'number' as const,
    default: 10000,
    min: 100,
    max: 50000,
    description: 'Maximum input length (characters)',
  },
] as const;

export function HtmlEntityDecoder({ className = '' }: HtmlEntityDecoderProps) {
  const [input, setInput] = useState('&lt;div&gt;Welcome to our &quot;website&quot;! &amp; thanks for visiting.&lt;/div&gt;\n\n&copy; 2024 &bull; Price: &euro;99 &nbsp;&bull;&nbsp; Rating: &#9733;&#9733;&#9733;&#9734;&#9734;\n\nTemperature: 25&#176;C or 77&#x2109;F &#8211; Perfect weather!');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<HtmlEntityDecoderConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: HtmlEntityDecoderConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processHtmlEntityDecoder(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setDecoding(result.decoding);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'html-entity-decoder',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.decoding ? `${result.decoding.totalEntities} entities` : 'Decoded',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to decode HTML entities');
          setOutput('');
          setDecoding(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during HTML entity decoding');
        setOutput('');
        setDecoding(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('html-entity-decoder');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'basic' | 'symbols' | 'numeric' | 'mixed' | 'unicode' | 'malformed' | 'xss') => {
    const examples = {
      basic: '&lt;p&gt;Hello &amp; welcome to our &quot;awesome&quot; website!&lt;/p&gt;\n\n&lt;strong&gt;Bold text&lt;/strong&gt; and &lt;em&gt;italic text&lt;/em&gt;',
      symbols: '&copy; 2024 Company Name &bull; All Rights Reserved &reg;\n\n&hearts; Love &spades; &clubs; &diams; Card Suits\n\n&larr; &uarr; &rarr; &darr; Arrows &harr;',
      numeric: 'Temperature: 25&#176;C &#8211; Perfect!\n\nMath: 2 &#215; 3 &#247; 2 &#177; 1\n\nFractions: &#189; &#188; &#190;',
      mixed: '&lt;div class=&quot;price&quot;&gt;\n  &euro;99.99 &nbsp;&bull;&nbsp; &pound;89.99\n&lt;/div&gt;\n\nRating: &#9733;&#9733;&#9733;&#9734;&#9734; (3/5 stars)',
      unicode: 'Emoji via entities: &#128512; &#128525; &#128151;\n\nGreek: &alpha;&beta;&gamma; &Delta;&Theta;&Lambda;\n\nMath: &sum; &prod; &int; &radic; &infin;',
      malformed: '&lt;div&gt;Valid entity&lt;/div&gt;\n\n&invalidEntity; &amp &lt &gt;\n\n&#999999; &#xZZZZ; &unknown;',
      xss: '&lt;script&gt;alert(&quot;XSS&quot;);&lt;/script&gt;\n\n&lt;img src=x onerror=alert(1)&gt;\n\n&lt;iframe src=javascript:alert(1)&gt;&lt;/iframe&gt;'
    };
    
    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...DECODING_OPTIONS,
    ...OUTPUT_OPTIONS,
  ];

  // Get entity type colors
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'named': return 'text-blue-800 bg-blue-100';
      case 'numeric': return 'text-green-800 bg-green-100';
      case 'hex': return 'text-purple-800 bg-purple-100';
      case 'unknown': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'named': return '🏷️';
      case 'numeric': return '🔢';
      case 'hex': return '🔣';
      case 'unknown': return '❓';
      default: return '📝';
    }
  };

  const getDecodingRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-800 bg-green-100';
    if (rate >= 80) return 'text-yellow-800 bg-yellow-100';
    return 'text-red-800 bg-red-100';
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Decoding Statistics */}
        {decoding && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Decoding Statistics</h3>
            <div className={`p-4 rounded-lg border-2 ${getDecodingRateColor(decoding.decodingStats.decodingRate)}`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {decoding.decodingStats.decodingRate >= 95 ? '✅' : 
                   decoding.decodingStats.decodingRate >= 80 ? '⚠️' : '❌'}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {decoding.decodingStats.decodingRate}% Decoded
                  </div>
                  <div className="text-xs opacity-80">
                    {decoding.totalEntities} entities found
                  </div>
                </div>
                <div className="ml-auto">
                  <div className="text-xs font-medium">
                    {decoding.decodingStats.entitiesDecoded}/{decoding.totalEntities}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('basic')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🏷️ Basic HTML Tags
            </button>
            <button
              onClick={() => handleQuickExample('symbols')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              ©️ Symbols & Copyright
            </button>
            <button
              onClick={() => handleQuickExample('numeric')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              🔢 Numeric Entities
            </button>
            <button
              onClick={() => handleQuickExample('mixed')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              🌟 Mixed Types
            </button>
            <button
              onClick={() => handleQuickExample('unicode')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              🌍 Unicode & Emoji
            </button>
            <button
              onClick={() => handleQuickExample('malformed')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              ❓ Malformed Entities
            </button>
            <button
              onClick={() => handleQuickExample('xss')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-left"
            >
              🚨 Security Test
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Decoding Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Entity Breakdown */}
        {decoding && decoding.totalEntities > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Entity Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-blue-50 rounded">
                <span className="text-blue-600">Named Entities:</span>
                <span className="text-blue-800 font-medium">{decoding.namedEntities}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-green-50 rounded">
                <span className="text-green-600">Numeric Entities:</span>
                <span className="text-green-800 font-medium">{decoding.numericEntities}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-purple-50 rounded">
                <span className="text-purple-600">Hex Entities:</span>
                <span className="text-purple-800 font-medium">{decoding.hexEntities}</span>
              </div>
              {decoding.unknownEntities.length > 0 && (
                <div className="flex justify-between text-xs p-2 bg-red-50 rounded">
                  <span className="text-red-600">Unknown Entities:</span>
                  <span className="text-red-800 font-medium">{decoding.unknownEntities.length}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Found Entities Preview */}
        {decoding && decoding.entitiesFound.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Found Entities</h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {decoding.entitiesFound.slice(0, 10).map((entity: any, index: number) => (
                <div key={index} className={`p-2 rounded text-xs ${getEntityTypeColor(entity.type)}`}>
                  <div className="flex items-center gap-2">
                    <span>{getEntityTypeIcon(entity.type)}</span>
                    <span className="font-mono">{entity.entity}</span>
                    <span>→</span>
                    <span className="font-medium">{entity.decoded}</span>
                  </div>
                </div>
              ))}
              {decoding.entitiesFound.length > 10 && (
                <div className="text-xs text-gray-600 px-2">
                  ... and {decoding.entitiesFound.length - 10} more entities
                </div>
              )}
            </div>
          </div>
        )}

        {/* Unknown Entities */}
        {decoding && decoding.unknownEntities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Unknown Entities</h3>
            <div className="space-y-1">
              {decoding.unknownEntities.slice(0, 5).map((entity: string, index: number) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">❓</span>
                    <span className="text-red-800 font-mono">{entity}</span>
                  </div>
                </div>
              ))}
              {decoding.unknownEntities.length > 5 && (
                <div className="text-xs text-gray-600 px-2">
                  ... and {decoding.unknownEntities.length - 5} more unknown
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

        {/* HTML Entity Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">HTML Entity Info</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🔓 About HTML Entities</div>
              <div className="space-y-1">
                <div>• Named: &amp;lt; &amp;gt; &amp;amp; &amp;quot;</div>
                <div>• Numeric: &amp;#169; &amp;#8364; &amp;#176;</div>
                <div>• Hex: &amp;#x00A9; &amp;#x20AC; &amp;#x00B0;</div>
                <div>• Used to display special characters safely</div>
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
          title="HTML Content with Entities"
          value={input}
          onChange={setInput}
          placeholder="Enter HTML content with entities to decode..."
          language="html"
        />

        <OutputPanel
          title="Decoded Text"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'html' ? 'html' : 
                   config.outputFormat === 'escaped' ? 'javascript' : 'text'}
          placeholder="Decoded HTML entities will appear here..."
          processingMessage="Decoding HTML entities..."
          customActions={
            output && decoding ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(decoding.decodedText)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Decoded
                </button>
                <button
                  onClick={() => {
                    const entityList = decoding.entitiesFound
                      .map((e: any) => `${e.entity} → ${e.decoded}`)
                      .join('\n');
                    navigator.clipboard?.writeText(entityList);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📝 Copy Entity List
                </button>
                <button
                  onClick={() => {
                    const report = `HTML Entity Decoding Report
Generated: ${new Date().toISOString()}

Decoding Summary:
- Total Entities Found: ${decoding.totalEntities}
- Successfully Decoded: ${decoding.decodingStats.entitiesDecoded}
- Decoding Rate: ${decoding.decodingStats.decodingRate}%

Entity Breakdown:
- Named Entities: ${decoding.namedEntities}
- Numeric Entities: ${decoding.numericEntities}
- Hexadecimal Entities: ${decoding.hexEntities}
- Unknown Entities: ${decoding.unknownEntities.length}

${decoding.entitiesFound.length > 0 ? `\nDecoded Entities:\n${decoding.entitiesFound.map((e: any) => `- ${e.entity} → ${e.decoded} (${e.type})`).join('\n')}` : ''}

${decoding.unknownEntities.length > 0 ? `\nUnknown Entities:\n${decoding.unknownEntities.map((e: string) => `- ${e}`).join('\n')}` : ''}

${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}

Original Text:
${decoding.originalText}

Decoded Text:
${decoding.decodedText}`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getDecodingRateColor(decoding.decodingStats.decodingRate)}`}>
                  {decoding.decodingStats.decodingRate}% Decoded
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {decoding.totalEntities} Entities
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}