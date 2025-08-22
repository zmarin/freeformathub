import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processIbanValidator, type IbanValidatorConfig } from '../../../tools/validators/iban-validator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface IbanValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: IbanValidatorConfig = {
  validateCountry: true,
  validateLength: true,
  validateMod97: true,
  formatIban: true,
  allowSpaces: true,
  showBankDetails: true,
  strictMode: false,
  validateBIC: false,
  checkBlacklist: true,
  includeExample: true,
};

const VALIDATION_OPTIONS = [
  {
    key: 'validateCountry',
    label: 'Validate Country Code',
    type: 'checkbox' as const,
    default: true,
    description: 'Check if country code is supported',
  },
  {
    key: 'validateLength',
    label: 'Validate Length',
    type: 'checkbox' as const,
    default: true,
    description: 'Verify IBAN length for the country',
  },
  {
    key: 'validateMod97',
    label: 'Validate Checksum (Mod-97)',
    type: 'checkbox' as const,
    default: true,
    description: 'Perform mod-97 algorithm validation',
  },
  {
    key: 'checkBlacklist',
    label: 'Check Blacklist',
    type: 'checkbox' as const,
    default: true,
    description: 'Check against known invalid patterns',
  },
] as const;

const FORMAT_OPTIONS = [
  {
    key: 'allowSpaces',
    label: 'Allow Spaces',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept IBANs with spaces (DE89 3704 0044...)',
  },
  {
    key: 'formatIban',
    label: 'Format Output',
    type: 'checkbox' as const,
    default: true,
    description: 'Display IBAN with proper spacing',
  },
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Require all validations to pass',
  },
] as const;

const DISPLAY_OPTIONS = [
  {
    key: 'showBankDetails',
    label: 'Show Bank Details',
    type: 'checkbox' as const,
    default: true,
    description: 'Display bank name and country information',
  },
  {
    key: 'includeExample',
    label: 'Include Example IBAN',
    type: 'checkbox' as const,
    default: true,
    description: 'Show example IBAN for the country',
  },
] as const;

export function IbanValidator({ className = '' }: IbanValidatorProps) {
  const [input, setInput] = useState('DE89 3704 0044 0532 0130 00');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<IbanValidatorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: IbanValidatorConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processIbanValidator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setValidation(result.validation);
          setBankInfo(result.bankInfo);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'iban-validator',
            input: `${result.validation?.country || 'Unknown'} IBAN validation`,
            output: result.validation?.isValid ? 'VALID' : 'INVALID',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to validate IBAN');
          setOutput('');
          setValidation(null);
          setBankInfo(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during IBAN validation');
        setOutput('');
        setValidation(null);
        setBankInfo(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('iban-validator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'germany' | 'uk' | 'france' | 'spain' | 'netherlands' | 'invalid') => {
    const examples = {
      germany: 'DE89 3704 0044 0532 0130 00',
      uk: 'GB29 NWBK 6016 1331 9268 19',
      france: 'FR14 2004 1010 0505 0001 3M02 606',
      spain: 'ES91 2100 0418 4502 0005 1332',
      netherlands: 'NL91 ABNA 0417 1643 00',
      invalid: 'DE89 3704 0044 0532 0130 01', // Invalid checksum
    };
    
    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...VALIDATION_OPTIONS,
    ...FORMAT_OPTIONS,
    ...DISPLAY_OPTIONS,
  ];

  // Country colors for UI
  const getCountryColor = (countryCode: string) => {
    const colors: Record<string, string> = {
      DE: '#000000', // Germany - Black
      GB: '#012169', // UK - Navy Blue
      FR: '#002395', // France - Blue
      ES: '#AA151B', // Spain - Red
      IT: '#009246', // Italy - Green
      NL: '#FF9200', // Netherlands - Orange
    };
    return colors[countryCode] || '#0066CC';
  };

  const validationStatus = validation?.isValid ? 'valid' : 'invalid';

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Country Detection */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Country Detection</h3>
            <div 
              className="p-4 rounded-lg border-2"
              style={{ 
                borderColor: getCountryColor(validation.country),
                backgroundColor: `${getCountryColor(validation.country)}10`
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: getCountryColor(validation.country) }}
                >
                  {validation.country}
                </div>
                <div>
                  <div 
                    className="font-medium text-sm"
                    style={{ color: getCountryColor(validation.country) }}
                  >
                    {validation.countryName}
                  </div>
                  <div className="text-xs text-gray-600">
                    {validation.country} - IBAN Country
                  </div>
                </div>
                <div className="ml-auto">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    validation.isValid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {validation.isValid ? '✅ VALID' : '❌ INVALID'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Test IBANs */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Test IBANs</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('germany')}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
            >
              🇩🇪 Germany
            </button>
            <button
              onClick={() => handleQuickExample('uk')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              🇬🇧 UK
            </button>
            <button
              onClick={() => handleQuickExample('france')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              🇫🇷 France
            </button>
            <button
              onClick={() => handleQuickExample('spain')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            >
              🇪🇸 Spain
            </button>
            <button
              onClick={() => handleQuickExample('netherlands')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              🇳🇱 Netherlands
            </button>
            <button
              onClick={() => handleQuickExample('invalid')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            >
              ❌ Invalid
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
            <h3 className="text-sm font-medium text-gray-700">Validation Results</h3>
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
                validation.countrySupported ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Country:</span>
                <span className={validation.countrySupported ? 'text-green-800' : 'text-red-800'}>
                  {validation.countrySupported ? '✅ Supported' : '❌ Unsupported'}
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
                validation.mod97Valid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Checksum:</span>
                <span className={validation.mod97Valid ? 'text-green-800' : 'text-red-800'}>
                  {validation.mod97Valid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* IBAN Components */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">IBAN Components</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Country:</span>
                  <span className="text-gray-800 font-medium font-mono">{validation.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check Digits:</span>
                  <span className="text-gray-800 font-medium font-mono">{validation.checkDigits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank Code:</span>
                  <span className="text-gray-800 font-medium font-mono">{validation.bankCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="text-gray-800 font-medium font-mono text-xs truncate">
                    {validation.accountNumber.length > 12 
                      ? validation.accountNumber.substring(0, 12) + '...'
                      : validation.accountNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Information */}
        {bankInfo && config.showBankDetails && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Bank Information</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-600">Bank:</span>
                  <span className="text-blue-800 font-medium text-right max-w-32 truncate">
                    {bankInfo.bankName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Currency:</span>
                  <span className="text-blue-800 font-medium">{bankInfo.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">SEPA:</span>
                  <span className={bankInfo.sepaSupport ? 'text-green-800' : 'text-orange-800'}>
                    {bankInfo.sepaSupport ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                {config.includeExample && bankInfo.example && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="text-blue-600 mb-1">Example IBAN:</div>
                    <div className="text-blue-800 font-mono text-xs bg-white p-1 rounded">
                      {bankInfo.example.replace(/(.{4})/g, '$1 ').trim()}
                    </div>
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

        {/* IBAN Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">IBAN Information</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🏦 About IBAN</div>
              <div className="space-y-1">
                <div>• International Bank Account Number</div>
                <div>• Up to 34 characters (country-specific)</div>
                <div>• Uses mod-97 checksum validation</div>
                <div>• Required for SEPA payments</div>
                <div>• Format: CC kk bbbb cccc cccc cccc</div>
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

        {/* Mod-97 Algorithm Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Validation Algorithm</h3>
          <div className="text-xs space-y-1">
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800 mb-1">Mod-97 Algorithm</div>
              <div className="text-gray-600 space-y-1">
                <div>1. Move first 4 chars to end</div>
                <div>2. Replace letters with numbers (A=10...Z=35)</div>
                <div>3. Calculate remainder when divided by 97</div>
                <div>4. Valid IBAN has remainder = 1</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="IBAN Number"
          value={input}
          onChange={setInput}
          placeholder="Enter IBAN number (spaces allowed)..."
          language="text"
        />

        <OutputPanel
          title="Validation Result"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="IBAN validation results will appear here..."
          processingMessage="Validating IBAN..."
          customActions={
            output && validation ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Results
                </button>
                <button
                  onClick={() => {
                    const report = `IBAN Validation Report
Generated: ${new Date().toISOString()}

IBAN: ${input}
Status: ${validation.isValid ? 'VALID' : 'INVALID'}
Country: ${validation.countryName} (${validation.country})

Components:
- Check Digits: ${validation.checkDigits}
- Bank Code: ${validation.bankCode}
- Account Number: ${validation.accountNumber}

Validation Details:
- Format: ${validation.formatValid ? 'Valid' : 'Invalid'}
- Country: ${validation.countrySupported ? 'Supported' : 'Unsupported'}
- Length: ${validation.lengthValid ? 'Valid' : 'Invalid'}
- Checksum: ${validation.mod97Valid ? 'Valid' : 'Invalid'}

${bankInfo && config.showBankDetails ? `Bank Information:
- Bank Name: ${bankInfo.bankName}
- Currency: ${bankInfo.currency}
- SEPA Support: ${bankInfo.sepaSupport ? 'Yes' : 'No'}
${config.includeExample && bankInfo.example ? `- Example IBAN: ${bankInfo.example}` : ''}` : ''}

${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}

DISCLAIMER: This validation is for informational purposes. Always verify with your bank for actual transactions.`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${
                  validation.isValid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validation.isValid ? '✅ VALID IBAN' : '❌ INVALID IBAN'}
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}