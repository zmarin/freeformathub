import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processPhoneNumberValidator, type PhoneNumberValidatorConfig } from '../../../tools/validators/phone-number-validator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface PhoneNumberValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: PhoneNumberValidatorConfig = {
  validateFormat: true,
  validateLength: true,
  validateCountryCode: true,
  validateAreaCode: true,
  strictFormat: false,
  allowInternational: true,
  allowNational: true,
  allowLocal: false,
  requireCountryCode: false,
  formatOutput: true,
  detectPhoneType: true,
  validateCarrier: false,
  checkRegion: true,
  allowTollFree: true,
  allowPremium: false,
};

const FORMAT_OPTIONS = [
  {
    key: 'validateFormat',
    label: 'Validate Format',
    type: 'checkbox' as const,
    default: true,
    description: 'Check phone number format and structure',
  },
  {
    key: 'validateLength',
    label: 'Validate Length',
    type: 'checkbox' as const,
    default: true,
    description: 'Verify phone number length requirements',
  },
  {
    key: 'validateCountryCode',
    label: 'Validate Country Code',
    type: 'checkbox' as const,
    default: true,
    description: 'Check country code validity',
  },
  {
    key: 'validateAreaCode',
    label: 'Validate Area Code',
    type: 'checkbox' as const,
    default: true,
    description: 'Verify area code for supported regions',
  },
] as const;

const ACCEPTANCE_OPTIONS = [
  {
    key: 'allowInternational',
    label: 'Allow International',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept international format (+1234567890)',
  },
  {
    key: 'allowNational',
    label: 'Allow National',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept national format (123-456-7890)',
  },
  {
    key: 'allowLocal',
    label: 'Allow Local',
    type: 'checkbox' as const,
    default: false,
    description: 'Accept local format (456-7890)',
  },
  {
    key: 'allowTollFree',
    label: 'Allow Toll-Free',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept toll-free numbers (800, 888, etc.)',
  },
  {
    key: 'allowPremium',
    label: 'Allow Premium',
    type: 'checkbox' as const,
    default: false,
    description: 'Accept premium numbers (900, etc.)',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'strictFormat',
    label: 'Strict Format',
    type: 'checkbox' as const,
    default: false,
    description: 'Require exact formatting with separators',
  },
  {
    key: 'requireCountryCode',
    label: 'Require Country Code',
    type: 'checkbox' as const,
    default: false,
    description: 'Must include country code prefix',
  },
  {
    key: 'formatOutput',
    label: 'Format Output',
    type: 'checkbox' as const,
    default: true,
    description: 'Display formatted versions of valid numbers',
  },
  {
    key: 'detectPhoneType',
    label: 'Detect Phone Type',
    type: 'checkbox' as const,
    default: true,
    description: 'Identify mobile, landline, toll-free types',
  },
  {
    key: 'checkRegion',
    label: 'Check Region',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate region and timezone information',
  },
] as const;

export function PhoneNumberValidator({ className = '' }: PhoneNumberValidatorProps) {
  const [input, setInput] = useState('+1 (555) 123-4567');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<PhoneNumberValidatorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: PhoneNumberValidatorConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processPhoneNumberValidator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setValidation(result.validation);
          setAnalysis(result.analysis);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'phone-number-validator',
            input: currentInput.substring(0, 20) + (currentInput.length > 20 ? '...' : ''),
            output: result.validation?.isValid ? 'VALID' : 'INVALID',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to validate phone number');
          setOutput('');
          setValidation(null);
          setAnalysis(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during phone number validation');
        setOutput('');
        setValidation(null);
        setAnalysis(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('phone-number-validator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'us' | 'uk' | 'international' | 'tollfree' | 'mobile' | 'invalid' | 'multiple') => {
    const examples = {
      us: '+1 (555) 123-4567',
      uk: '+44 20 7946 0958',
      international: '+33 1 42 86 83 26',
      tollfree: '1-800-555-0199',
      mobile: '+1-555-123-4567',
      invalid: '123-45-67890',
      multiple: `+1 (555) 123-4567
+44 20 7946 0958
+49 30 12345678
1-800-555-0199`,
    };
    
    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...FORMAT_OPTIONS,
    ...ACCEPTANCE_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  // Validation status colors
  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100';
  };

  const getPhoneTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile': return 'text-blue-800 bg-blue-100';
      case 'landline': return 'text-purple-800 bg-purple-100';
      case 'toll-free': return 'text-green-800 bg-green-100';
      case 'premium': return 'text-orange-800 bg-orange-100';
      case 'voip': return 'text-indigo-800 bg-indigo-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getPhoneTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile': return '📱';
      case 'landline': return '📞';
      case 'toll-free': return '📞🆓';
      case 'premium': return '💰';
      case 'voip': return '💻';
      default: return '📞';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Phone Number Status */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Validation Status</h3>
            <div className={`p-4 rounded-lg border-2 ${getValidationColor(validation.isValid)}`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {validation.isValid ? '✅' : '❌'}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {validation.isValid ? 'VALID' : 'INVALID'}
                  </div>
                  <div className="text-xs opacity-80">
                    {validation.countryName || 'Unknown Region'}
                  </div>
                </div>
                {validation.phoneType && (
                  <div className="ml-auto">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPhoneTypeColor(validation.phoneType)}`}>
                      {getPhoneTypeIcon(validation.phoneType)} {validation.phoneType.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Test Numbers */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Test Numbers</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('us')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🇺🇸 US Number
            </button>
            <button
              onClick={() => handleQuickExample('uk')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              🇬🇧 UK Number
            </button>
            <button
              onClick={() => handleQuickExample('international')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              🌍 International
            </button>
            <button
              onClick={() => handleQuickExample('tollfree')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              📞🆓 Toll-Free
            </button>
            <button
              onClick={() => handleQuickExample('mobile')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              📱 Mobile
            </button>
            <button
              onClick={() => handleQuickExample('invalid')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-left"
            >
              ❌ Invalid Number
            </button>
            <button
              onClick={() => handleQuickExample('multiple')}
              className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-left"
            >
              📋 Multiple Numbers
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Validation Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Validation Details */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Validation Details</h3>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.formatValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Format:</span>
                <span className={validation.formatValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.formatValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.lengthValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Length:</span>
                <span className={validation.lengthValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.lengthValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.countryCodeValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Country Code:</span>
                <span className={validation.countryCodeValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.countryCodeValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className={`flex justify-between text-xs p-2 rounded ${
                validation.areaCodeValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Area Code:</span>
                <span className={validation.areaCodeValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.areaCodeValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Phone Components */}
        {validation && validation.components && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Phone Components</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="space-y-1">
                {validation.components.countryCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country Code:</span>
                    <span className="text-gray-800 font-medium font-mono">+{validation.components.countryCode}</span>
                  </div>
                )}
                {validation.components.areaCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area Code:</span>
                    <span className="text-gray-800 font-medium font-mono">{validation.components.areaCode}</span>
                  </div>
                )}
                {validation.components.exchange && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exchange:</span>
                    <span className="text-gray-800 font-medium font-mono">{validation.components.exchange}</span>
                  </div>
                )}
                {validation.components.number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number:</span>
                    <span className="text-gray-800 font-medium font-mono">{validation.components.number}</span>
                  </div>
                )}
                {validation.components.extension && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extension:</span>
                    <span className="text-gray-800 font-medium font-mono">{validation.components.extension}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phone Analysis */}
        {analysis && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Phone Analysis</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-600">Type:</span>
                  <span className="text-blue-800 font-medium uppercase">{analysis.phoneType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Region:</span>
                  <span className="text-blue-800 font-medium">{analysis.region || 'Unknown'}</span>
                </div>
                {analysis.timezone && (
                  <div className="flex justify-between">
                    <span className="text-blue-600">Timezone:</span>
                    <span className="text-blue-800 font-medium">{analysis.timezone}</span>
                  </div>
                )}
                {analysis.carrier && (
                  <div className="flex justify-between">
                    <span className="text-blue-600">Carrier:</span>
                    <span className="text-blue-800 font-medium">{analysis.carrier}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-blue-600">Possible:</span>
                  <span className={analysis.isPossible ? 'text-green-800' : 'text-red-800'}>
                    {analysis.isPossible ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Format Examples */}
        {validation && validation.formats && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Format Examples</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="space-y-1">
                {validation.formats.international && (
                  <div className="flex justify-between">
                    <span className="text-green-600">International:</span>
                    <span className="text-green-800 font-medium font-mono">{validation.formats.international}</span>
                  </div>
                )}
                {validation.formats.national && (
                  <div className="flex justify-between">
                    <span className="text-green-600">National:</span>
                    <span className="text-green-800 font-medium font-mono">{validation.formats.national}</span>
                  </div>
                )}
                {validation.formats.e164 && (
                  <div className="flex justify-between">
                    <span className="text-green-600">E.164:</span>
                    <span className="text-green-800 font-medium font-mono">{validation.formats.e164}</span>
                  </div>
                )}
                {validation.formats.rfc3966 && (
                  <div className="flex justify-between">
                    <span className="text-green-600">RFC3966:</span>
                    <span className="text-green-800 font-medium font-mono text-xs truncate max-w-32">
                      {validation.formats.rfc3966}
                    </span>
                  </div>
                )}
              </div>
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

        {/* Phone Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Phone Information</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">📞 About Phone Numbers</div>
              <div className="space-y-1">
                <div>• E.164: International standard format</div>
                <div>• NANP: North American Numbering Plan</div>
                <div>• Mobile vs Landline detection</div>
                <div>• Country and region identification</div>
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
          title="Phone Number to Validate"
          value={input}
          onChange={setInput}
          placeholder="Enter phone number(s) to validate (e.g., +1-555-123-4567)..."
          language="text"
        />

        <OutputPanel
          title="Validation Result"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="Phone number validation results will appear here..."
          processingMessage="Validating phone number..."
          customActions={
            output && validation ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Results
                </button>
                {validation.formats && (
                  <button
                    onClick={() => {
                      const formats = Object.entries(validation.formats)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                      navigator.clipboard?.writeText(formats);
                    }}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    📋 Copy Formats
                  </button>
                )}
                <div className={`px-3 py-1 text-xs font-medium rounded ${getValidationColor(validation.isValid)}`}>
                  {validation.isValid ? '✅ VALID' : '❌ INVALID'}
                </div>
                {validation.phoneType && (
                  <div className={`px-3 py-1 text-xs font-medium rounded ${getPhoneTypeColor(validation.phoneType)}`}>
                    {getPhoneTypeIcon(validation.phoneType)} {validation.phoneType.toUpperCase()}
                  </div>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}