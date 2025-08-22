import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processCreditCardValidator, type CreditCardValidatorConfig } from '../../../tools/validators/credit-card-validator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CreditCardValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: CreditCardValidatorConfig = {
  strictMode: false,
  allowSpaces: true,
  allowDashes: true,
  validateLuhn: true,
  checkExpiry: false,
  requireCVV: false,
  showCardDetails: true,
  maskNumber: true,
  validateBIN: true,
  checkLength: true,
  allowTestCards: true,
};

const VALIDATION_OPTIONS = [
  {
    key: 'validateLuhn',
    label: 'Validate Luhn Algorithm',
    type: 'checkbox' as const,
    default: true,
    description: 'Check card number using Luhn checksum algorithm',
  },
  {
    key: 'checkLength',
    label: 'Check Length',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate card number length for detected brand',
  },
  {
    key: 'validateBIN',
    label: 'Validate BIN',
    type: 'checkbox' as const,
    default: true,
    description: 'Check Bank Identification Number information',
  },
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Require all validations to pass for valid result',
  },
] as const;

const FORMAT_OPTIONS = [
  {
    key: 'allowSpaces',
    label: 'Allow Spaces',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept card numbers with spaces (4111 1111 1111 1111)',
  },
  {
    key: 'allowDashes',
    label: 'Allow Dashes',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept card numbers with dashes (4111-1111-1111-1111)',
  },
  {
    key: 'maskNumber',
    label: 'Mask Card Number',
    type: 'checkbox' as const,
    default: true,
    description: 'Show only last 4 digits for security',
  },
] as const;

const ADDITIONAL_OPTIONS = [
  {
    key: 'checkExpiry',
    label: 'Check Expiry Date',
    type: 'checkbox' as const,
    default: false,
    description: 'Validate expiry date if provided (MM/YY format)',
  },
  {
    key: 'requireCVV',
    label: 'Require CVV',
    type: 'checkbox' as const,
    default: false,
    description: 'Validate CVV code if provided (3-4 digits)',
  },
  {
    key: 'showCardDetails',
    label: 'Show Card Details',
    type: 'checkbox' as const,
    default: true,
    description: 'Display issuer, country, and BIN information',
  },
  {
    key: 'allowTestCards',
    label: 'Allow Test Cards',
    type: 'checkbox' as const,
    default: true,
    description: 'Accept well-known test card numbers',
  },
] as const;

export function CreditCardValidator({ className = '' }: CreditCardValidatorProps) {
  const [input, setInput] = useState('4111111111111111');
  const [expiry, setExpiry] = useState('12/25');
  const [cvv, setCvv] = useState('123');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<CreditCardValidatorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: CreditCardValidatorConfig, currentExpiry: string, currentCvv: string) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processCreditCardValidator(
          currentInput, 
          currentConfig,
          currentConfig.checkExpiry ? currentExpiry : undefined,
          currentConfig.requireCVV ? currentCvv : undefined
        );
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setValidation(result.validation);
          setCardInfo(result.cardInfo);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'credit-card-validator',
            input: `${result.validation?.brand || 'Unknown'} card validation`,
            output: result.validation?.isValid ? 'VALID' : 'INVALID',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to validate credit card');
          setOutput('');
          setValidation(null);
          setCardInfo(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during credit card validation');
        setOutput('');
        setValidation(null);
        setCardInfo(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('credit-card-validator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config, expiry, cvv);
  }, [input, config, expiry, cvv, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'visa' | 'mastercard' | 'amex' | 'discover' | 'invalid' | 'test') => {
    const examples = {
      visa: { 
        card: '4111 1111 1111 1111', 
        expiry: '12/25', 
        cvv: '123',
        description: 'Valid Visa test card'
      },
      mastercard: { 
        card: '5555 5555 5555 4444', 
        expiry: '12/25', 
        cvv: '123',
        description: 'Valid Mastercard test card'
      },
      amex: { 
        card: '378282246310005', 
        expiry: '12/25', 
        cvv: '1234',
        description: 'Valid AmEx test card (15 digits, 4-digit CVV)'
      },
      discover: { 
        card: '6011111111111117', 
        expiry: '12/25', 
        cvv: '123',
        description: 'Valid Discover test card'
      },
      invalid: { 
        card: '4111 1111 1111 1112', 
        expiry: '12/20', 
        cvv: '12',
        description: 'Invalid card (fails Luhn, expired, wrong CVV length)'
      },
      test: { 
        card: '4000000000000002', 
        expiry: '12/25', 
        cvv: '123',
        description: 'Generic test card for testing'
      },
    };
    
    const example = examples[type];
    setInput(example.card);
    setExpiry(example.expiry);
    setCvv(example.cvv);
  };

  const handleClearSensitiveData = () => {
    setInput('');
    setExpiry('');
    setCvv('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...VALIDATION_OPTIONS,
    ...FORMAT_OPTIONS,
    ...ADDITIONAL_OPTIONS,
  ];

  // Card brand colors for UI
  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      'Visa': '#1A1F71',
      'Mastercard': '#EB001B',
      'American Express': '#006FCF',
      'Discover': '#FF6000',
      'JCB': '#006C44',
      'Diners Club': '#0079BE',
      'UnionPay': '#E21836',
      'Maestro': '#6C6BBD',
    };
    return colors[brand] || '#666666';
  };

  const validationStatus = validation?.isValid ? 'valid' : 'invalid';

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Card Brand Detection */}
        {validation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Card Detection</h3>
            <div 
              className="p-4 rounded-lg border-2"
              style={{ 
                borderColor: getBrandColor(validation.brand),
                backgroundColor: `${getBrandColor(validation.brand)}10`
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: getBrandColor(validation.brand) }}
                >
                  💳
                </div>
                <div>
                  <div 
                    className="font-medium text-sm"
                    style={{ color: getBrandColor(validation.brand) }}
                  >
                    {validation.brand}
                  </div>
                  <div className="text-xs text-gray-600">
                    {validation.cardType.toUpperCase()}
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

        {/* Quick Test Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Test Cards</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('visa')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              💳 Visa
            </button>
            <button
              onClick={() => handleQuickExample('mastercard')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            >
              💳 Mastercard
            </button>
            <button
              onClick={() => handleQuickExample('amex')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              💳 AmEx
            </button>
            <button
              onClick={() => handleQuickExample('discover')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              💳 Discover
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('invalid')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            >
              ❌ Invalid Card
            </button>
            <button
              onClick={() => handleQuickExample('test')}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
            >
              🧪 Test Card
            </button>
          </div>
        </div>

        {/* Additional Inputs */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Additional Validation</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Expiry Date (MM/YY)
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="12/25"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!config.checkExpiry}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                CVV Code
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                maxLength={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!config.requireCVV}
              />
            </div>
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
                validation.luhnValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-600">Luhn Check:</span>
                <span className={validation.luhnValid ? 'text-green-800' : 'text-red-800'}>
                  {validation.luhnValid ? '✅ Valid' : '❌ Invalid'}
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
              {validation.expiryValid !== undefined && (
                <div className={`flex justify-between text-xs p-2 rounded ${
                  validation.expiryValid ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <span className="text-gray-600">Expiry:</span>
                  <span className={validation.expiryValid ? 'text-green-800' : 'text-red-800'}>
                    {validation.expiryValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
              )}
              {validation.cvvValid !== undefined && (
                <div className={`flex justify-between text-xs p-2 rounded ${
                  validation.cvvValid ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <span className="text-gray-600">CVV:</span>
                  <span className={validation.cvvValid ? 'text-green-800' : 'text-red-800'}>
                    {validation.cvvValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Information */}
        {cardInfo && config.showCardDetails && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Card Information</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Issuer:</span>
                  <span className="text-gray-800 font-medium">{cardInfo.issuer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Country:</span>
                  <span className="text-gray-800 font-medium">{cardInfo.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BIN:</span>
                  <span className="text-gray-800 font-medium">{cardInfo.binRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Length:</span>
                  <span className="text-gray-800 font-medium">{cardInfo.length} digits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className={`font-medium ${
                    cardInfo.category === 'Test Card' ? 'text-orange-600' : 'text-gray-800'
                  }`}>
                    {cardInfo.category}
                  </span>
                </div>
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

        {/* Security Notice */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Security Notice</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🔒 Privacy Protected</div>
              <div className="space-y-1">
                <div>• All validation happens in your browser</div>
                <div>• No data is sent to any server</div>
                <div>• Use only test cards for development</div>
                <div>• Never enter real card details online</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearSensitiveData}
            className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🗑️ Clear All Data
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="Credit Card Number"
          value={input}
          onChange={setInput}
          placeholder="Enter credit card number (spaces and dashes allowed)..."
          language="text"
        />

        <OutputPanel
          title="Validation Result"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="Card validation results will appear here..."
          processingMessage="Validating credit card..."
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
                    const report = `Credit Card Validation Report
Generated: ${new Date().toISOString()}

Card Number: ${cardInfo?.maskedNumber || 'N/A'}
Brand: ${validation.brand}
Type: ${validation.cardType.toUpperCase()}
Status: ${validation.isValid ? 'VALID' : 'INVALID'}

Validation Details:
- Format: ${validation.formatValid ? 'Valid' : 'Invalid'}
- Luhn Check: ${validation.luhnValid ? 'Valid' : 'Invalid'}
- Length: ${validation.lengthValid ? 'Valid' : 'Invalid'} (${cardInfo?.length || 0} digits)
${validation.expiryValid !== undefined ? `- Expiry: ${validation.expiryValid ? 'Valid' : 'Invalid'}` : ''}
${validation.cvvValid !== undefined ? `- CVV: ${validation.cvvValid ? 'Valid' : 'Invalid'}` : ''}

${cardInfo && config.showCardDetails ? `Card Information:
- Issuer: ${cardInfo.issuer}
- Country: ${cardInfo.country}
- BIN Range: ${cardInfo.binRange}
- Category: ${cardInfo.category}` : ''}

${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}

SECURITY NOTICE: This validation was performed client-side. Never share real card details.`;
                    
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
                  {validation.isValid ? '✅ VALID CARD' : '❌ INVALID CARD'}
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}