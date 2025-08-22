import React, { useState, useCallback, useMemo } from 'react';
import { Smile, ArrowRightLeft, Search, BarChart3, Copy, Download, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processEmojiConverter } from '../../../tools/encoders/emoji-converter';
import type { EmojiConverterOptions, EmojiConverterResult } from '../../../tools/encoders/emoji-converter';

const EmojiConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<EmojiConverterOptions>({
    operation: 'to-unicode',
    format: 'hex',
    includeVariants: true,
    includeSkinTones: true,
    outputFormat: 'list',
    searchQuery: ''
  });

  const result = useMemo(() => {
    if (!input && options.operation !== 'search') return null;
    if (options.operation === 'search' && !options.searchQuery && !input) return null;
    
    try {
      return processEmojiConverter({ 
        content: input, 
        options: {
          ...options,
          searchQuery: options.operation === 'search' ? (options.searchQuery || input) : undefined
        }
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }, [input, options]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleOptionsChange = useCallback((newOptions: Partial<EmojiConverterOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    if (result?.success && result.result) {
      try {
        await navigator.clipboard.writeText(result.result);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }, [result]);

  const handleDownload = useCallback(() => {
    if (result?.success && result.result) {
      const blob = new Blob([result.result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emoji-${options.operation}-result.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [result, options.operation]);

  const getOperationDescription = () => {
    switch (options.operation) {
      case 'to-unicode': return 'Convert emojis to Unicode codepoints';
      case 'from-unicode': return 'Convert Unicode codepoints to emojis';
      case 'to-shortcode': return 'Convert emojis to shortcodes (:smile:)';
      case 'from-shortcode': return 'Convert shortcodes to emojis';
      case 'analyze': return 'Analyze emoji usage and statistics';
      case 'search': return 'Search emoji database by keywords';
      default: return '';
    }
  };

  const getOperationIcon = () => {
    switch (options.operation) {
      case 'to-unicode': return <ArrowRightLeft className="w-4 h-4" />;
      case 'from-unicode': return <ArrowRightLeft className="w-4 h-4 rotate-180" />;
      case 'to-shortcode': return <ArrowRightLeft className="w-4 h-4" />;
      case 'from-shortcode': return <ArrowRightLeft className="w-4 h-4 rotate-180" />;
      case 'analyze': return <BarChart3 className="w-4 h-4" />;
      case 'search': return <Search className="w-4 h-4" />;
      default: return <Smile className="w-4 h-4" />;
    }
  };

  const getFormatDescription = () => {
    switch (options.format) {
      case 'decimal': return 'HTML decimal entities (&#128512;)';
      case 'hex': return 'HTML hex entities (&#x1F600;)';
      case 'css': return 'CSS escape sequences (\\1f600)';
      case 'html': return 'HTML hex entities (&#x1F600;)';
      case 'javascript': return 'JavaScript Unicode (\\u{1F600})';
      case 'python': return 'Python Unicode (\\U0001F600)';
      default: return '';
    }
  };

  const renderStatistics = () => {
    if (!result?.success || !result.statistics) return null;

    const { statistics } = result;
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Emoji Statistics</h3>
        <div className="bg-blue-50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Total emojis:</span>
            <span className="font-mono text-blue-900">{statistics.totalEmojis}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Unique emojis:</span>
            <span className="font-mono text-blue-900">{statistics.uniqueEmojis}</span>
          </div>
          
          {Object.keys(statistics.categories).length > 0 && (
            <div>
              <div className="text-xs font-medium text-blue-800 mb-1">Categories:</div>
              {Object.entries(statistics.categories).map(([category, count]) => (
                <div key={category} className="flex justify-between text-xs">
                  <span className="text-blue-700">{category}:</span>
                  <span className="text-blue-900">{count}</span>
                </div>
              ))}
            </div>
          )}

          {statistics.mostUsed && statistics.mostUsed.length > 0 && (
            <div>
              <div className="text-xs font-medium text-blue-800 mb-1">Most used:</div>
              {statistics.mostUsed.slice(0, 5).map(({ emoji, count }, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-blue-700">{emoji}:</span>
                  <span className="text-blue-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmojiList = () => {
    if (!result?.success || !result.emojis || result.emojis.length === 0) return null;

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {options.operation === 'search' ? 'Search Results' : 'Found Emojis'}
        </h3>
        <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
          <div className="space-y-2">
            {result.emojis.slice(0, 20).map((emoji, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{emoji.emoji}</span>
                  <span className="text-gray-700">{emoji.name}</span>
                </div>
                <code className="text-xs bg-white px-2 py-1 rounded text-purple-600">
                  {emoji.shortcode}
                </code>
              </div>
            ))}
            {result.emojis.length > 20 && (
              <div className="text-xs text-gray-500 text-center pt-2">
                ...and {result.emojis.length - 20} more
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const inputStats = input ? {
    characters: input.length,
    emojis: (input.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length,
    lines: input.split('\n').length,
    words: input.split(/\s+/).filter(word => word.length > 0).length
  } : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Smile className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emoji Converter</h1>
        <p className="text-lg text-gray-600">
          Convert between emoji formats, analyze usage, and search emoji database
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <InputPanel
            title={
              options.operation === 'search' 
                ? 'Search Query' 
                : options.operation === 'analyze' 
                  ? 'Text to Analyze' 
                  : 'Input Text'
            }
            subtitle={
              options.operation === 'search' 
                ? 'Enter emoji name or keyword' 
                : 'Enter text with emojis or Unicode'
            }
          >
            <div className="space-y-4">
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={
                  options.operation === 'search' ? 'happy, smile, heart, rocket...' :
                  options.operation === 'to-unicode' ? 'Hello 😀 World! 🎉' :
                  options.operation === 'from-unicode' ? 'Hello \\u{1F600} World! U+1F389' :
                  options.operation === 'to-shortcode' ? 'Hello 😀 World! 🎉' :
                  options.operation === 'from-shortcode' ? 'Hello :grinning: World! :tada:' :
                  'Text with emojis to analyze 😀🎉🚀'
                }
                className="w-full h-48 p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
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
                      <div className="font-medium text-gray-900">{inputStats.emojis}</div>
                      <div>Emojis</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.words}</div>
                      <div>Words</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.lines}</div>
                      <div>Lines</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Examples */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Examples</h3>
                <div className="space-y-2">
                  {options.operation === 'search' ? [
                    'happy',
                    'heart',
                    'fire',
                    'rocket'
                  ] : options.operation === 'from-unicode' ? [
                    'U+1F600',
                    '\\u{1F600}',
                    '&#x1F600;',
                    '&#128512;'
                  ] : options.operation === 'from-shortcode' ? [
                    ':grinning: :heart: :fire:',
                    'Hello :smile: World!',
                    ':thumbs_up: :rocket: :100:',
                    ':tada: Party time! :star2:'
                  ] : [
                    'Hello 😀 World!',
                    '🎉 Celebration time! 🚀',
                    '❤️ Love this! 💯',
                    'On fire 🔥 Amazing! ⭐'
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(example)}
                      className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                    >
                      <span className="text-orange-600">{example}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </InputPanel>
        </div>

        {/* Options Panel */}
        <div className="lg:col-span-1">
          <OptionsPanel title="Conversion Options">
            <div className="space-y-4">
              {/* Operation Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    {getOperationIcon()}
                    Operation
                  </div>
                </label>
                <select
                  value={options.operation}
                  onChange={(e) => handleOptionsChange({ operation: e.target.value as EmojiConverterOptions['operation'] })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="to-unicode">To Unicode</option>
                  <option value="from-unicode">From Unicode</option>
                  <option value="to-shortcode">To Shortcode</option>
                  <option value="from-shortcode">From Shortcode</option>
                  <option value="analyze">Analyze Emojis</option>
                  <option value="search">Search Emojis</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getOperationDescription()}
                </p>
              </div>

              {/* Search Query for Search Operation */}
              {options.operation === 'search' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={options.searchQuery || ''}
                    onChange={(e) => handleOptionsChange({ searchQuery: e.target.value })}
                    placeholder="Enter emoji name or keyword..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              )}

              {/* Format Selection for Unicode Operations */}
              {(options.operation === 'to-unicode' || options.operation === 'from-unicode') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unicode Format
                  </label>
                  <select
                    value={options.format}
                    onChange={(e) => handleOptionsChange({ format: e.target.value as EmojiConverterOptions['format'] })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="hex">HTML Hex (&#x1F600;)</option>
                    <option value="decimal">HTML Decimal (&#128512;)</option>
                    <option value="javascript">JavaScript (Unicode)</option>
                    <option value="python">Python (\\U0001F600)</option>
                    <option value="css">CSS (\\1f600)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getFormatDescription()}
                  </p>
                </div>
              )}

              {/* Output Format for Analyze and Search */}
              {(options.operation === 'analyze' || options.operation === 'search') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <select
                    value={options.outputFormat}
                    onChange={(e) => handleOptionsChange({ outputFormat: e.target.value as EmojiConverterOptions['outputFormat'] })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="list">List Format</option>
                    <option value="table">Table Format</option>
                    <option value="json">JSON Format</option>
                  </select>
                </div>
              )}

              {/* Advanced Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeVariants}
                    onChange={(e) => handleOptionsChange({ includeVariants: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include emoji variants</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeSkinTones}
                    onChange={(e) => handleOptionsChange({ includeSkinTones: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include skin tone variants</span>
                </label>
              </div>

              {/* Format Examples */}
              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-orange-900 mb-2">Format Examples</h4>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-medium text-orange-800">Emoji:</span>
                    <span className="ml-1 text-orange-700">😀</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-800">Unicode:</span>
                    <code className="ml-1 text-orange-700">U+1F600</code>
                  </div>
                  <div>
                    <span className="font-medium text-orange-800">Shortcode:</span>
                    <code className="ml-1 text-orange-700">:grinning:</code>
                  </div>
                  <div>
                    <span className="font-medium text-orange-800">HTML:</span>
                    <code className="ml-1 text-orange-700">&#x1F600;</code>
                  </div>
                </div>
              </div>
            </div>
          </OptionsPanel>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-1">
          <OutputPanel title="Conversion Result">
            {!result ? (
              <div className="text-center py-8">
                <Smile className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Enter {options.operation === 'search' ? 'a search query' : 'text'} to see results
                </p>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Conversion completed successfully!</span>
                </div>

                {/* Statistics */}
                {renderStatistics()}

                {/* Emoji List */}
                {renderEmojiList()}

                {/* Output Content */}
                {result.result && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Result</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyToClipboard}
                          className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={result.result}
                      readOnly
                      className="w-full h-48 p-3 border border-gray-300 rounded font-mono text-sm bg-gray-50 resize-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Conversion failed</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 text-sm">{result.error}</p>
                </div>
              </div>
            )}
          </OutputPanel>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Emoji Conversion Guide</h3>
            <div className="text-blue-800 text-sm mt-1 space-y-1">
              <p>• <strong>To Unicode:</strong> Convert emojis to codepoints for programming use</p>
              <p>• <strong>From Unicode:</strong> Convert codepoints back to displayable emojis</p>
              <p>• <strong>Shortcodes:</strong> Text representations like :smile: used in platforms like GitHub</p>
              <p>• <strong>Analyze:</strong> Get detailed statistics about emoji usage in text</p>
              <p>• <strong>Search:</strong> Find emojis by name, keywords, or category</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiConverter;