import React, { useState, useCallback, useMemo } from 'react';
import { Lock, ArrowRightLeft, CheckCircle, AlertTriangle, Info, Copy, Download, Hash, FileText } from 'lucide-react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processBase32Encoder } from '../../../tools/encoders/base32-encoder';
import type { Base32EncoderOptions, Base32EncoderResult } from '../../../tools/encoders/base32-encoder';

const Base32Encoder: React.FC = () => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Base32EncoderOptions>({
    operation: 'encode',
    variant: 'standard',
    padding: true,
    lowercase: false,
    chunkSize: 64,
    lineBreaks: false,
    removeWhitespace: true
  });

  const result = useMemo(() => {
    if (!input) return null;
    
    try {
      return processBase32Encoder({ content: input, options });
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

  const handleOptionsChange = useCallback((newOptions: Partial<Base32EncoderOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const handleOperationToggle = useCallback(() => {
    setOptions(prev => ({ 
      ...prev, 
      operation: prev.operation === 'encode' ? 'decode' : 'encode' 
    }));
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
      a.download = `base32-${options.operation}d.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [result, options.operation]);

  const getVariantDescription = () => {
    switch (options.variant) {
      case 'standard': return 'RFC 4648 standard (A-Z, 2-7)';
      case 'extended-hex': return 'Base32hex (0-9, A-V) - URL/filename safe';
      case 'z-base32': return 'Z-Base32 - human-oriented alphabet';
      case 'crockford': return 'Crockford - excludes ambiguous characters';
      default: return '';
    }
  };

  const getVariantIcon = () => {
    switch (options.variant) {
      case 'standard': return <FileText className="w-4 h-4" />;
      case 'extended-hex': return <Hash className="w-4 h-4" />;
      case 'z-base32': return <Info className="w-4 h-4" />;
      case 'crockford': return <CheckCircle className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const inputStats = input ? {
    characters: input.length,
    bytes: new TextEncoder().encode(input).length,
    lines: input.split('\n').length,
    words: input.split(/\s+/).filter(word => word.length > 0).length
  } : null;

  const getExampleForVariant = () => {
    const examples = {
      'standard': 'JBSWY3DPEBLW64TMMQQQ====',
      'extended-hex': '91IMOR3F41BMP2L66G6G====',
      'z-base32': 'pb1sa5dxfoo8q2tmmggq',
      'crockford': 'D1NPXS3F41HMA2YMMGG6'
    };
    return examples[options.variant] || examples.standard;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Base32 Encoder/Decoder</h1>
        <p className="text-lg text-gray-600">
          Encode and decode text using Base32 with multiple variant support
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <InputPanel
            title={options.operation === 'encode' ? 'Text to Encode' : 'Base32 to Decode'}
            subtitle={options.operation === 'encode' ? 'Enter plain text' : 'Enter Base32 encoded string'}
          >
            <div className="space-y-4">
              {/* Operation Toggle */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleOperationToggle}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Switch to {options.operation === 'encode' ? 'Decode' : 'Encode'}
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={
                  options.operation === 'encode' 
                    ? 'Hello World!' 
                    : getExampleForVariant()
                }
                className="w-full h-48 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
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
                      <div className="font-medium text-gray-900">{inputStats.bytes}</div>
                      <div>Bytes</div>
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
                  {options.operation === 'encode' ? [
                    'Hello World!',
                    'Base32 Encoding Test',
                    'Special chars: @#$%^&*()',
                    '1234567890'
                  ] : [
                    getExampleForVariant(),
                    'MFRGG43FMJQW2===',
                    'NBSWY3DPFQQHO33SNRQXE===',
                    'GEZDGNBVGY3TQOJQ'
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
          <OptionsPanel title="Base32 Options">
            <div className="space-y-4">
              {/* Variant Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    {getVariantIcon()}
                    Base32 Variant
                  </div>
                </label>
                <select
                  value={options.variant}
                  onChange={(e) => handleOptionsChange({ variant: e.target.value as Base32EncoderOptions['variant'] })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="standard">Standard (RFC 4648)</option>
                  <option value="extended-hex">Extended Hex</option>
                  <option value="z-base32">Z-Base32</option>
                  <option value="crockford">Crockford</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getVariantDescription()}
                </p>
              </div>

              {/* Encoding Options */}
              {options.operation === 'encode' && (
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.padding}
                      onChange={(e) => handleOptionsChange({ padding: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Add padding (=)</span>
                  </label>

                  {options.variant === 'standard' && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.lowercase}
                        onChange={(e) => handleOptionsChange({ lowercase: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Use lowercase</span>
                    </label>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.lineBreaks}
                      onChange={(e) => handleOptionsChange({ lineBreaks: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Add line breaks</span>
                  </label>

                  {options.lineBreaks && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chunk Size: {options.chunkSize}
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="128"
                        step="8"
                        value={options.chunkSize || 64}
                        onChange={(e) => handleOptionsChange({ chunkSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>16</span>
                        <span>64</span>
                        <span>128</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Decoding Options */}
              {options.operation === 'decode' && (
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.removeWhitespace}
                      onChange={(e) => handleOptionsChange({ removeWhitespace: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remove whitespace</span>
                  </label>
                </div>
              )}

              {/* Variant Examples */}
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Variant Examples</h4>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-medium text-purple-800">Standard:</span>
                    <code className="ml-1 text-purple-700">JBSWY3DP...</code>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Extended Hex:</span>
                    <code className="ml-1 text-purple-700">91IMOR3F...</code>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Z-Base32:</span>
                    <code className="ml-1 text-purple-700">pb1sa5dx...</code>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Crockford:</span>
                    <code className="ml-1 text-purple-700">D1NPXS3F...</code>
                  </div>
                </div>
              </div>
            </div>
          </OptionsPanel>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-1">
          <OutputPanel title={`${options.operation === 'encode' ? 'Encoded' : 'Decoded'} Result`}>
            {!result ? (
              <div className="text-center py-8">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Enter text to see {options.operation}d result</p>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{options.operation === 'encode' ? 'Encoding' : 'Decoding'} completed successfully!</span>
                </div>

                {/* Processing Statistics */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Processing Statistics</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Input size:</span>
                      <span className="font-mono text-green-900">{result.originalSize} bytes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Output size:</span>
                      <span className="font-mono text-green-900">{result.resultSize} bytes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Size change:</span>
                      <span className={`font-mono ${result.compressionRatio! > 0 ? 'text-orange-600' : 'text-green-900'}`}>
                        {result.compressionRatio! > 0 ? '+' : ''}{result.compressionRatio}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Variant:</span>
                      <span className="font-mono text-green-900">{result.variant}</span>
                    </div>
                    {result.chunks && result.chunks > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Chunks:</span>
                        <span className="font-mono text-green-900">{result.chunks}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Output Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{options.operation === 'encode' ? 'Encoded' : 'Decoded'} Text</h3>
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
                    value={result.result || ''}
                    readOnly
                    className="w-full h-48 p-3 border border-gray-300 rounded font-mono text-sm bg-gray-50 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">{options.operation === 'encode' ? 'Encoding' : 'Decoding'} failed</span>
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
            <h3 className="font-medium text-blue-900">Base32 Information</h3>
            <div className="text-blue-800 text-sm mt-1 space-y-1">
              <p>• Base32 uses 32 characters (A-Z, 2-7 in standard variant) for encoding</p>
              <p>• Output is approximately 60% longer than the original data</p>
              <p>• More human-readable than Base64 and case-insensitive in most variants</p>
              <p>• Crockford variant excludes ambiguous characters (0, 1, I, L, O)</p>
              <p>• Commonly used in backup codes, TOTP secrets, and distributed systems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Base32Encoder;