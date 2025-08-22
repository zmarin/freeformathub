import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processPasswordGeneration, type PasswordGeneratorConfig } from '../../../tools/crypto/password-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface PasswordGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: PasswordGeneratorConfig = {
  length: 12,
  count: 1,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  customCharacters: '',
  enforceRules: true,
};

const OPTIONS = [
  {
    key: 'length',
    label: 'Password Length',
    type: 'number' as const,
    default: 12,
    min: 4,
    max: 256,
    description: 'Number of characters in password (4-256)',
  },
  {
    key: 'count',
    label: 'Number of Passwords',
    type: 'number' as const,
    default: 1,
    min: 1,
    max: 100,
    description: 'How many passwords to generate (1-100)',
  },
  {
    key: 'includeUppercase',
    label: 'Include Uppercase (A-Z)',
    type: 'boolean' as const,
    default: true,
    description: 'Include uppercase letters',
  },
  {
    key: 'includeLowercase',
    label: 'Include Lowercase (a-z)',
    type: 'boolean' as const,
    default: true,
    description: 'Include lowercase letters',
  },
  {
    key: 'includeNumbers',
    label: 'Include Numbers (0-9)',
    type: 'boolean' as const,
    default: true,
    description: 'Include numeric digits',
  },
  {
    key: 'includeSymbols',
    label: 'Include Symbols (!@#$)',
    type: 'boolean' as const,
    default: true,
    description: 'Include special characters and symbols',
  },
  {
    key: 'excludeSimilar',
    label: 'Exclude Similar Characters',
    type: 'boolean' as const,
    default: false,
    description: 'Exclude 0, O, 1, l, I for clarity',
  },
  {
    key: 'excludeAmbiguous',
    label: 'Exclude Ambiguous Characters',
    type: 'boolean' as const,
    default: false,
    description: 'Exclude {}[]()\\/"\'`~,;.<>',
  },
  {
    key: 'enforceRules',
    label: 'Enforce Character Diversity',
    type: 'boolean' as const,
    default: true,
    description: 'Ensure at least one character from each enabled set',
  },
];

const PRESET_CONFIGS = [
  {
    name: 'Ultra Secure (16 chars)',
    config: { ...DEFAULT_CONFIG, length: 16, includeSymbols: true, enforceRules: true }
  },
  {
    name: 'Standard (12 chars)',
    config: { ...DEFAULT_CONFIG, length: 12, includeSymbols: true }
  },
  {
    name: 'Simple (8 chars, no symbols)',
    config: { ...DEFAULT_CONFIG, length: 8, includeSymbols: false }
  },
  {
    name: 'PIN (4 digits only)',
    config: { 
      ...DEFAULT_CONFIG, 
      length: 4, 
      includeUppercase: false, 
      includeLowercase: false, 
      includeNumbers: true, 
      includeSymbols: false 
    }
  },
];

export function PasswordGenerator({ className = '' }: PasswordGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<PasswordGeneratorConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  // Generate passwords immediately when config changes
  const generatePasswords = useMemo(
    () => debounce((cfg: PasswordGeneratorConfig) => {
      // Validate at least one character type is selected
      if (!cfg.includeUppercase && !cfg.includeLowercase && !cfg.includeNumbers && !cfg.includeSymbols && !cfg.customCharacters) {
        setError('Please select at least one character type');
        setOutput('');
        return;
      }

      if (cfg.length < 4 || cfg.length > 256) {
        setError('Password length must be between 4 and 256 characters');
        setOutput('');
        return;
      }

      if (cfg.count < 1 || cfg.count > 100) {
        setError('Password count must be between 1 and 100');
        setOutput('');
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        try {
          const result = processPasswordGeneration('', cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            
            // Add to history for successful operations
            addToHistory({
              toolId: 'password-generator',
              input: `Generate ${cfg.count} password(s) of ${cfg.length} characters`,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to generate passwords');
        }
        
        setIsLoading(false);
      }, 100);
    }, 100),
    [addToHistory]
  );

  // Auto-generate when component mounts or config changes
  useEffect(() => {
    generatePasswords(config);
  }, [config, generatePasswords]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: PasswordGeneratorConfig) => {
    setConfig(newConfig);
  };

  const handleGenerate = () => {
    generatePasswords(config);
  };

  const handlePresetSelect = (presetConfig: PasswordGeneratorConfig) => {
    setConfig(presetConfig);
  };

  const getStrengthColor = () => {
    const hasMultipleTypes = [
      config.includeUppercase,
      config.includeLowercase,
      config.includeNumbers,
      config.includeSymbols
    ].filter(Boolean).length;

    if (config.length >= 16 && hasMultipleTypes >= 3) return 'text-green-600 dark:text-green-400';
    if (config.length >= 12 && hasMultipleTypes >= 3) return 'text-blue-600 dark:text-blue-400';
    if (config.length >= 8 && hasMultipleTypes >= 2) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStrengthText = () => {
    const hasMultipleTypes = [
      config.includeUppercase,
      config.includeLowercase,
      config.includeNumbers,
      config.includeSymbols
    ].filter(Boolean).length;

    if (config.length >= 16 && hasMultipleTypes >= 3) return 'Very Strong';
    if (config.length >= 12 && hasMultipleTypes >= 3) return 'Strong';
    if (config.length >= 8 && hasMultipleTypes >= 2) return 'Fair';
    return 'Weak';
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="Password Generator"
          placeholder="Passwords will be generated automatically..."
          syntax="text"
          examples={[
            { title: 'Auto-Generated', value: 'Click "Generate New Passwords" below' },
            { title: 'Secure Storage', value: 'Copy passwords to your password manager' },
            { title: 'Best Practices', value: 'Use unique passwords for each account' },
          ]}
          readonly={true}
          showFileUpload={false}
        />
        
        {/* Generate Button & Presets */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mb-4"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate New Passwords'}
          </button>
          
          {/* Strength Indicator */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password Strength:
              </span>
              <span className={`text-sm font-semibold ${getStrengthColor()}`}>
                {getStrengthText()}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Length: {config.length} chars • Types: {[
                config.includeUppercase && 'A-Z',
                config.includeLowercase && 'a-z', 
                config.includeNumbers && '0-9',
                config.includeSymbols && '!@#'
              ].filter(Boolean).join(', ')}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Presets:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_CONFIGS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset.config)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  {preset.name}
                </button>
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
        label="Generated Passwords"
        syntax="text"
        downloadFilename="passwords.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}