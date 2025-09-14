import React, { useState, useCallback, useMemo } from 'react';
import { Lock, CheckCircle, AlertTriangle, Info, Copy, Download, Hash, FileText } from 'lucide-react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processHTMLEntityEncoder } from '../../../tools/encoders/html-entity-encoder';
import type { HTMLEntityEncoderOptions, HTMLEntityEncoderResult } from '../../../tools/encoders/html-entity-encoder';

const HtmlEntityEncoder: React.FC = () => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<HTMLEntityEncoderOptions>({
    mode: 'smart',
    encodeAll: false,
    encodeSpaces: false,
    encodeQuotes: true,
    encodeAmpersands: true,
    useShortNames: true,
    preserveLineBreaks: true
  });

  const result = useMemo(() => {
    if (!input) return null;
    
    try {
      return processHTMLEntityEncoder({ text: input, options });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encoding failed'
      };
    }
  }, [input, options]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleOptionsChange = useCallback((newOptions: Partial<HTMLEntityEncoderOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    if (result?.success && result.encoded) {
      try {
        await navigator.clipboard.writeText(result.encoded);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }, [result]);

  const handleDownload = useCallback(() => {
    if (result?.success && result.encoded) {
      downloadFile(result.encoded, 'encoded-html.txt', 'text/html');
    }
  }, [result]);

  const getEncodingModeDescription = () => {
    switch (options.mode) {
      case 'named': return 'Use named entities like &copy; for better readability';
      case 'numeric': return 'Use numeric entities like &#169; for maximum compatibility';
      case 'hex': return 'Use hexadecimal entities like &#xA9; for compact representation';
      case 'smart': return 'Mix of named and numeric entities for optimal balance';
      default: return '';
    }
  };

  const getEncodingModeIcon = () => {
    switch (options.mode) {
      case 'named': return <FileText className="w-4 h-4" />;
      case 'numeric': return <Hash className="w-4 h-4" />;
      case 'hex': return <Hash className="w-4 h-4" />;
      case 'smart': return <CheckCircle className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const renderUsedEntities = () => {
    if (!result?.success || !result.usedEntities || Object.keys(result.usedEntities).length === 0) {
      return null;
    }

    const sortedEntities = Object.entries(result.usedEntities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Show top 10 most used entities

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Used Entities</h3>
        <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
          <div className="space-y-1">
            {sortedEntities.map(([entity, count], index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <code className="bg-white px-2 py-1 rounded font-mono text-purple-700 border">
                  {entity}
                </code>
                <span className="text-gray-600 font-medium">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const inputStats = input ? {
    characters: input.length,
    lines: input.split('\n').length,
    words: input.split(/\s+/).filter(word => word.length > 0).length,
    specialChars: (input.match(/[<>&"']/g) || []).length
  } : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HTML Entity Encoder</h1>
        <p className="text-lg text-gray-600">
          Encode text to HTML entities for safe display and XSS prevention
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <InputPanel
            title="Text to Encode"
            subtitle="Enter text with special characters"
          >
            <div className="space-y-4">
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Copyright © 2024 &quot;Company Name&quot; <script>alert('test')</script>"
                className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />

              {/* Input Statistics */}
              {inputStats && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Input Statistics</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.characters}</div>
                      <div>Characters</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.words}</div>
                      <div>Words</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.lines}</div>
                      <div>Lines</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.specialChars}</div>
                      <div>Special chars</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Examples */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Examples</h3>
                <div className="space-y-2">
                  {[
                    'Copyright © 2024 & Trademark™',
                    '<script>alert("XSS")</script>',
                    'Price: €100 — Special "quotes"',
                    'Math: α + β = γ'
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(example)}
                      className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                    >
                      <code className="text-purple-600">{example}</code>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </InputPanel>
        </div>

        {/* Options Panel */}
        <div className="lg:col-span-1">
          <OptionsPanel title="Encoding Options">
            <div className="space-y-4">
              {/* Encoding Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    {getEncodingModeIcon()}
                    Encoding Mode
                  </div>
                </label>
                <select
                  value={options.mode}
                  onChange={(e) => handleOptionsChange({ mode: e.target.value as HTMLEntityEncoderOptions['mode'] })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="smart">Smart (Mixed)</option>
                  <option value="named">Named Entities</option>
                  <option value="numeric">Numeric Entities</option>
                  <option value="hex">Hexadecimal Entities</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getEncodingModeDescription()}
                </p>
              </div>

              {/* Encoding Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.encodeAll}
                    onChange={(e) => handleOptionsChange({ encodeAll: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Encode all non-ASCII characters</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.encodeSpaces}
                    onChange={(e) => handleOptionsChange({ encodeSpaces: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Encode spaces as &nbsp;</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.encodeQuotes}
                    onChange={(e) => handleOptionsChange({ encodeQuotes: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Encode quotes</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.encodeAmpersands}
                    onChange={(e) => handleOptionsChange({ encodeAmpersands: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Encode ampersands</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.preserveLineBreaks}
                    onChange={(e) => handleOptionsChange({ preserveLineBreaks: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Preserve line breaks</span>
                </label>
              </div>

              {/* Mode Examples */}
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Mode Examples</h4>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-medium text-purple-800">Named:</span>
                    <code className="ml-1 text-purple-700">&amp;copy;</code>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Numeric:</span>
                    <code className="ml-1 text-purple-700">&amp;#169;</code>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Hex:</span>
                    <code className="ml-1 text-purple-700">&amp;#xA9;</code>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Smart:</span>
                    <code className="ml-1 text-purple-700">Mixed approach</code>
                  </div>
                </div>
              </div>
            </div>
          </OptionsPanel>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-1">
          <OutputPanel title="Encoded Result">
            {!result ? (
              <div className="text-center py-8">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Enter text to see encoded result</p>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Encoding completed successfully!</span>
                </div>

                {/* Encoding Statistics */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Encoding Statistics</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Original length:</span>
                      <span className="font-mono text-green-900">{result.originalLength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Encoded length:</span>
                      <span className="font-mono text-green-900">{result.encodedLength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Entities used:</span>
                      <span className="font-mono text-green-900">{result.entitiesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Size change:</span>
                      <span className={`font-mono ${result.encodingRatio! > 0 ? 'text-orange-600' : 'text-green-900'}`}>
                        {result.encodingRatio! > 0 ? '+' : ''}{result.encodingRatio}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Used Entities */}
                {renderUsedEntities()}

                {/* Encoded Output */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Encoded Text</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyToClipboard}
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={result.encoded || ''}
                    readOnly
                    className="w-full h-48 p-3 border border-gray-300 rounded font-mono text-sm bg-gray-50 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Encoding failed</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 text-sm">{result.error}</p>
                </div>
              </div>
            )}
          </OutputPanel>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">Security Best Practices</h3>
            <div className="text-yellow-800 text-sm mt-1 space-y-1">
              <p>• Always encode user input before displaying in HTML to prevent XSS attacks</p>
              <p>• Essential HTML characters (&lt;, &gt;, &amp;) are always encoded for safety</p>
              <p>• Use quote encoding when placing text inside HTML attributes</p>
              <p>• Consider context-specific encoding for JavaScript, CSS, or URL contexts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HtmlEntityEncoder;