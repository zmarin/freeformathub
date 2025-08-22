import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processFileHashIntegrityChecker, type FileHashIntegrityCheckerConfig, HASH_ALGORITHMS, CHECKSUM_FORMATS } from '../../../tools/crypto/file-hash-integrity-checker';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface FileHashIntegrityCheckerProps {
  className?: string;
}

const DEFAULT_CONFIG: FileHashIntegrityCheckerConfig = {
  mode: 'generate',
  hashAlgorithms: ['sha256'],
  outputFormat: 'list',
  includeFileInfo: true,
  caseSensitive: false,
  showProgress: false,
  generateChecksumFile: false,
  validateFormat: true,
  allowPartialMatches: false,
  sortResults: true,
};

const MODE_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'generate',
    options: [
      { value: 'generate', label: '🔧 Generate - Create hashes for data' },
      { value: 'verify', label: '✅ Verify - Check against expected hash' },
      { value: 'compare', label: '⚖️ Compare - Compare two files/data' },
      { value: 'batch', label: '📦 Batch - Process checksum files' },
    ],
    description: 'Operation mode for hash processing',
  },
] as const;

const ALGORITHM_OPTIONS = HASH_ALGORITHMS.map(alg => ({
  key: 'hashAlgorithms',
  value: alg.id,
  label: alg.name,
  description: alg.description,
  recommended: alg.recommended,
  deprecated: alg.deprecated
}));

const OUTPUT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'list',
    options: [
      { value: 'list', label: '📋 List - Simple algorithm: hash format' },
      { value: 'table', label: '📊 Table - Formatted table with timing' },
      { value: 'checksum', label: '📁 Checksum - Standard checksum file format' },
      { value: 'json', label: '🔧 JSON - Machine-readable output' },
    ],
    description: 'Format for hash output display',
  },
  {
    key: 'includeFileInfo',
    label: 'Include Performance Info',
    type: 'checkbox' as const,
    default: true,
    description: 'Show processing time and performance metrics',
  },
  {
    key: 'sortResults',
    label: 'Sort Results',
    type: 'checkbox' as const,
    default: true,
    description: 'Sort hash results by algorithm name',
  },
  {
    key: 'validateFormat',
    label: 'Validate Hash Format',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate hash format and length',
  },
] as const;

export function FileHashIntegrityChecker({ className = '' }: FileHashIntegrityCheckerProps) {
  const [input, setInput] = useState('');
  const [expectedHash, setExpectedHash] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<FileHashIntegrityCheckerConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (currentInput: string, currentExpectedHash: string, currentConfig: FileHashIntegrityCheckerConfig) => {
      if (!currentInput.trim()) {
        setOutput('');
        setResults(null);
        setError(null);
        setIsProcessing(false);
        return;
      }

      if (currentConfig.mode === 'verify' && !currentExpectedHash.trim()) {
        setOutput('');
        setResults(null);
        setError(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await processFileHashIntegrityChecker(currentInput, currentExpectedHash, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setResults(result.hashes || result.verification);
          
          // Add to history
          addToHistory({
            toolId: 'file-hash-integrity-checker',
            input: `${currentConfig.mode}: ${currentInput.substring(0, 50)}${currentInput.length > 50 ? '...' : ''}`,
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process hash operation');
          setOutput('');
          setResults(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during hash processing');
        setOutput('');
        setResults(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('file-hash-integrity-checker');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, expectedHash, config);
  }, [input, expectedHash, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    if (key === 'hashAlgorithms') {
      // Handle multi-select for algorithms
      setConfig(prev => {
        const current = prev.hashAlgorithms;
        const updated = current.includes(value) 
          ? current.filter(alg => alg !== value)
          : [...current, value];
        return { ...prev, hashAlgorithms: updated };
      });
    } else {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleQuickExample = (type: 'simple' | 'verify' | 'checksum' | 'security') => {
    const examples = {
      simple: {
        input: 'Hello, World!',
        expected: '',
        config: { mode: 'generate' as const, hashAlgorithms: ['sha256'] }
      },
      verify: {
        input: 'Hello, World!',
        expected: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
        config: { mode: 'verify' as const, hashAlgorithms: ['sha256'] }
      },
      checksum: {
        input: `a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e  hello.txt
2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae  world.txt
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  empty.txt`,
        expected: '',
        config: { mode: 'batch' as const, outputFormat: 'table' as const }
      },
      security: {
        input: 'This is sensitive data that needs integrity verification.',
        expected: '',
        config: { mode: 'generate' as const, hashAlgorithms: ['sha256', 'sha512', 'blake2b'] }
      }
    };
    
    const example = examples[type];
    setInput(example.input);
    setExpectedHash(example.expected);
    setConfig(prev => ({ ...prev, ...example.config }));
  };

  const handleAlgorithmToggle = (algorithmId: string) => {
    handleConfigChange('hashAlgorithms', algorithmId);
  };

  const handleSelectRecommended = () => {
    const recommended = HASH_ALGORITHMS.filter(alg => alg.recommended).map(alg => alg.id);
    setConfig(prev => ({ ...prev, hashAlgorithms: recommended }));
  };

  const handleSelectAll = () => {
    const all = HASH_ALGORITHMS.map(alg => alg.id);
    setConfig(prev => ({ ...prev, hashAlgorithms: all }));
  };

  // Build conditional options
  const allOptions = [
    ...MODE_OPTIONS,
    ...OUTPUT_OPTIONS,
  ];

  const showExpectedHash = config.mode === 'verify';
  const showAlgorithmSelection = config.mode !== 'batch';

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('simple')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              🔧 Generate Hash
            </button>
            <button
              onClick={() => handleQuickExample('verify')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              ✅ Verify Hash
            </button>
            <button
              onClick={() => handleQuickExample('checksum')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              📦 Checksum File
            </button>
            <button
              onClick={() => handleQuickExample('security')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              🔒 Security Hashes
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Hash Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Algorithm Selection */}
        {showAlgorithmSelection && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Hash Algorithms</h3>
              <div className="flex gap-1">
                <button
                  onClick={handleSelectRecommended}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Recommended
                </button>
                <button
                  onClick={handleSelectAll}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  All
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {HASH_ALGORITHMS.map(algorithm => (
                <div
                  key={algorithm.id}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    config.hashAlgorithms.includes(algorithm.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAlgorithmToggle(algorithm.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.hashAlgorithms.includes(algorithm.id)}
                        onChange={() => handleAlgorithmToggle(algorithm.id)}
                        className="rounded"
                      />
                      <span className="font-medium text-sm">{algorithm.name}</span>
                      {algorithm.recommended && (
                        <span className="px-1 rounded text-xs bg-green-100 text-green-800">
                          ⭐
                        </span>
                      )}
                      {algorithm.deprecated && (
                        <span className="px-1 rounded text-xs bg-red-100 text-red-800">
                          ⚠️
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {algorithm.outputLength/4} chars
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{algorithm.description}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              Selected: {config.hashAlgorithms.length} algorithm{config.hashAlgorithms.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Hash Results Summary */}
        {results && Array.isArray(results) && config.mode === 'generate' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Generation Results</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="grid gap-1">
                <div>
                  <span className="text-green-600">Algorithms:</span>
                  <span className="ml-1 font-medium text-green-800">{results.length}</span>
                </div>
                <div>
                  <span className="text-green-600">Total Time:</span>
                  <span className="ml-1 font-medium text-green-800">
                    {results.reduce((sum, r) => sum + (r.processingTime || 0), 0).toFixed(2)}ms
                  </span>
                </div>
                <div>
                  <span className="text-green-600">Fastest:</span>
                  <span className="ml-1 font-medium text-green-800">
                    {Math.min(...results.map(r => r.processingTime || 0)).toFixed(2)}ms
                  </span>
                </div>
                <div>
                  <span className="text-green-600">Status:</span>
                  <span className="ml-1 font-medium text-green-800">
                    ✅ All hashes generated
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Results */}
        {results && !Array.isArray(results) && config.mode === 'verify' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Verification Result</h3>
            <div className={`p-3 border rounded-lg text-xs ${
              results.isValid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {results.isValid ? '✅' : '❌'}
                </span>
                <span className={`font-medium ${
                  results.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {results.isValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
              <div className={`grid gap-1 ${
                results.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                <div>Algorithm: {results.algorithm}</div>
                <div>Confidence: {(results.confidence * 100).toFixed(1)}%</div>
                <div>Details: {results.details}</div>
              </div>
            </div>
          </div>
        )}

        {/* Format Reference */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Checksum Formats</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {CHECKSUM_FORMATS.map(format => (
              <div key={format.name} className="p-2 bg-gray-50 rounded text-xs">
                <div className="font-medium text-gray-800">{format.name}</div>
                <div className="text-gray-600 font-mono text-xs mt-1">{format.format}</div>
                <div className="text-gray-500">Extension: {format.extension}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Security Tips</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-yellow-50 rounded">
              <div className="font-medium text-yellow-800">Deprecated Algorithms</div>
              <div className="text-yellow-700">Avoid MD5 and SHA-1 for security-critical applications</div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="font-medium text-green-800">Recommended</div>
              <div className="text-green-700">Use SHA-256, SHA-512, or BLAKE2b for new projects</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">Performance</div>
              <div className="text-blue-700">BLAKE2b is fastest, SHA-256 is widely supported</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title={config.mode === 'batch' ? 'Checksum File Content' : 'Data to Hash'}
          value={input}
          onChange={setInput}
          placeholder={
            config.mode === 'batch'
              ? 'Paste checksum file content:\na591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e  file1.txt\n2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae  file2.txt'
              : 'Enter text, binary data, or file content to generate hashes...'
          }
          language={config.mode === 'batch' ? 'text' : 'text'}
        />

        {showExpectedHash && (
          <InputPanel
            title="Expected Hash"
            value={expectedHash}
            onChange={setExpectedHash}
            placeholder="Enter the expected hash value to verify against..."
            language="text"
          />
        )}

        <OutputPanel
          title="Hash Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'text'}
          placeholder="Configure options and input data to generate or verify hashes..."
          processingMessage="Processing hash operation..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Result
                </button>
                <button
                  onClick={() => {
                    const extension = config.outputFormat === 'json' ? 'json' : 
                                     config.outputFormat === 'checksum' ? 'sum' : 'txt';
                    const mimeType = config.outputFormat === 'json' ? 'application/json' : 'text/plain';
                    const blob = new Blob([output], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `hashes.${extension}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download
                </button>
                {results && Array.isArray(results) && (
                  <button
                    onClick={() => {
                      const hashList = results.map(r => r.hash).join('\n');
                      navigator.clipboard?.writeText(hashList);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    📋 Copy Hashes Only
                  </button>
                )}
                {config.mode === 'generate' && results && Array.isArray(results) && (
                  <button
                    onClick={() => {
                      const checksumContent = results.map(r => `${r.hash}  input`).join('\n');
                      const blob = new Blob([checksumContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'checksums.sum';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    💾 Checksum File
                  </button>
                )}
                {results && !Array.isArray(results) && config.mode === 'verify' && (
                  <button
                    onClick={() => {
                      const report = `Hash Verification Report
Generated: ${new Date().toISOString()}

Input: ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}
Algorithm: ${results.algorithm}
Expected: ${results.expectedHash}
Actual: ${results.actualHash}
Result: ${results.isValid ? 'VALID ✅' : 'INVALID ❌'}
Confidence: ${(results.confidence * 100).toFixed(1)}%
Details: ${results.details}`;
                      
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