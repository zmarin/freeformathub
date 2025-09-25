import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processNumberBaseConverter, type NumberBaseConverterConfig } from '../../../tools/converters/number-base-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface NumberBaseConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: NumberBaseConverterConfig = {
  inputBase: 10,
  outputBases: [2, 8, 16],
  showAllBases: true,
  groupDigits: true,
  showPrefix: true,
  uppercase: false,
  batchConversion: false,
  validateInput: true,
};

const BASE_OPTIONS = [
  { value: 2, label: 'Binary (2)' },
  { value: 3, label: 'Ternary (3)' },
  { value: 4, label: 'Quaternary (4)' },
  { value: 5, label: 'Quinary (5)' },
  { value: 6, label: 'Senary (6)' },
  { value: 7, label: 'Septenary (7)' },
  { value: 8, label: 'Octal (8)' },
  { value: 9, label: 'Nonary (9)' },
  { value: 10, label: 'Decimal (10)' },
  { value: 11, label: 'Undecimal (11)' },
  { value: 12, label: 'Duodecimal (12)' },
  { value: 13, label: 'Tridecimal (13)' },
  { value: 14, label: 'Tetradecimal (14)' },
  { value: 15, label: 'Pentadecimal (15)' },
  { value: 16, label: 'Hexadecimal (16)' },
  { value: 20, label: 'Vigesimal (20)' },
  { value: 32, label: 'Base32 (32)' },
  { value: 36, label: 'Base36 (36)' },
];

const OPTIONS = [
  {
    key: 'inputBase',
    label: 'Input Base',
    type: 'select' as const,
    default: 10,
    options: BASE_OPTIONS,
    description: 'Base of the input number (auto-detected from prefixes)',
  },
  {
    key: 'showAllBases',
    label: 'Show All Common Bases',
    type: 'boolean' as const,
    default: true,
    description: 'Show Binary, Octal, Decimal, and Hexadecimal outputs',
  },
  {
    key: 'outputBases',
    label: 'Output Bases',
    type: 'multiselect' as const,
    default: [2, 8, 16],
    options: BASE_OPTIONS,
    description: 'Specific bases to convert to (when not showing all)',
  },
  {
    key: 'groupDigits',
    label: 'Group Digits',
    type: 'boolean' as const,
    default: true,
    description: 'Add spaces to group digits for better readability',
  },
  {
    key: 'showPrefix',
    label: 'Show Base Prefixes',
    type: 'boolean' as const,
    default: true,
    description: 'Add prefixes like 0b, 0x, 0o to identify bases',
  },
  {
    key: 'uppercase',
    label: 'Uppercase Letters',
    type: 'boolean' as const,
    default: false,
    description: 'Use uppercase letters for bases > 10 (A-Z instead of a-z)',
  },
  {
    key: 'batchConversion',
    label: 'Batch Conversion',
    type: 'boolean' as const,
    default: false,
    description: 'Process multiple numbers (one per line)',
  },
  {
    key: 'validateInput',
    label: 'Validate Input',
    type: 'boolean' as const,
    default: true,
    description: 'Check that input contains valid digits for the specified base',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Decimal 255',
    input: '255',
    config: { ...DEFAULT_CONFIG, inputBase: 10, showAllBases: true }
  },
  {
    name: 'Binary Number',
    input: '0b11111111',
    config: { ...DEFAULT_CONFIG, showAllBases: true }
  },
  {
    name: 'Hexadecimal',
    input: '0xFF',
    config: { ...DEFAULT_CONFIG, showAllBases: true }
  },
  {
    name: 'Mixed Batch',
    input: `42\n0b1010\n0xFF\n0o777`,
    config: { ...DEFAULT_CONFIG, batchConversion: true, showAllBases: true }
  },
];

export function NumberBaseConverter({ className = '' }: NumberBaseConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<NumberBaseConverterConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    inputCount: number;
    successCount: number;
    errorCount: number;
    inputBase: number;
    outputBases: number[];
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: NumberBaseConverterConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processNumberBaseConverter(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'number-base-converter',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
            setStats(null);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to convert number');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 200);
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: NumberBaseConverterConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig(example.config);
  };

  const insertRandomNumber = (base: number) => {
    let randomNum: string;
    
    switch (base) {
      case 2:
        randomNum = '0b' + Math.floor(Math.random() * 256).toString(2);
        break;
      case 8:
        randomNum = '0o' + Math.floor(Math.random() * 512).toString(8);
        break;
      case 16:
        randomNum = '0x' + Math.floor(Math.random() * 4096).toString(16).toUpperCase();
        break;
      default:
        randomNum = Math.floor(Math.random() * 1000).toString();
        break;
    }
    
    setInput(randomNum);
  };

  const getValidDigits = (base: number): string => {
    const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, base);
    return base <= 10 ? digits : `${digits.slice(0, 10)}, ${digits.slice(10)}`;
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div >
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={`Number Input ${config.batchConversion ? '(One per line)' : ''}`}
          placeholder={config.batchConversion ? 
            `Enter numbers, one per line:

255
0b11111111
0xFF
0o377
42` :
            `Enter a number to convert:

Examples:
255 (decimal)
0b11111111 (binary with prefix)
0xFF (hexadecimal with prefix)
0o377 (octal with prefix)
16rFF (base 16 with base prefix)`}
          syntax="text"
          examples={[
            {
              title: 'Decimal Number',
              value: '255',
            },
            {
              title: 'Binary with Prefix',
              value: '0b11111111',
            },
            {
              title: 'Hexadecimal',
              value: '0xFF',
            },
          ]}
        />

        {/* Quick Actions */}
        <div >
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => insertRandomNumber(10)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Random Dec
            </button>
            <button
              onClick={() => insertRandomNumber(2)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Random Bin
            </button>
            <button
              onClick={() => insertRandomNumber(16)}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
            >
              Random Hex
            </button>
            <button
              onClick={() => insertRandomNumber(8)}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              Random Oct
            </button>
          </div>

          {/* Base Info */}
          <div >
            <div >
              Current Settings:
            </div>
            <div >
              <div>Input Base: {config.inputBase} (Valid digits: {getValidDigits(config.inputBase)})</div>
              <div>
                Output: {config.showAllBases ? 
                  'All common bases (2, 8, 10, 16)' : 
                  `Bases ${config.outputBases.join(', ')}`
                }
              </div>
              <div>Format: {config.showPrefix ? 'With prefixes' : 'No prefixes'} • {config.groupDigits ? 'Grouped' : 'Ungrouped'}</div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mb-4">
            <label >
              Quick Examples:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  onClick={() => insertExample(example)}
                  
                >
                  <div className="font-medium">{example.name}</div>
                  <div >
                    {example.input.length > 30 ? 
                      example.input.substring(0, 30) + '...' : 
                      example.input
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div >
              <div >
                Conversion Results:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span >Processed:</span>
                    <span className="font-mono">{stats.inputCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span >Successful:</span>
                    <span className="font-mono">{stats.successCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span >Errors:</span>
                    <span className="font-mono">{stats.errorCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span >Input Base:</span>
                    <span className="font-mono">{stats.inputBase}</span>
                  </div>
                </div>
              </div>
              
              <div >
                <div >
                  Output Bases: {stats.outputBases.join(', ')}
                </div>
              </div>
            </div>
          )}
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
        label="Converted Numbers"
        syntax="text"
        downloadFilename="number-conversions.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}