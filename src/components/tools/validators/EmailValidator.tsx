import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { validateEmail, type EmailValidatorConfig } from '../../../tools/validators/email-validator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface EmailValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: EmailValidatorConfig = {
  checkMxRecord: false,
  allowInternational: true,
  strictMode: false,
  checkDisposable: true,
};

const OPTIONS = [
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Use stricter validation rules (less permissive)',
  },
  {
    key: 'allowInternational',
    label: 'Allow International Domains',
    type: 'boolean' as const,
    default: true,
    description: 'Accept international domain names (IDN) with Unicode characters',
  },
  {
    key: 'checkDisposable',
    label: 'Check for Disposable Emails',
    type: 'boolean' as const,
    default: true,
    description: 'Warn about known disposable/temporary email services',
  },
  {
    key: 'checkMxRecord',
    label: 'Check MX Record',
    type: 'boolean' as const,
    default: false,
    description: 'Verify domain has mail exchange records (requires internet)',
  },
];

const SAMPLE_EMAILS = [
  'user@example.com',
  'test.email+tag@subdomain.domain.org',
  'firstname.lastname@company.co.uk',
  'user123@gmail.com',
  'invalid-email@',
  'user@тест.com',
];

export function EmailValidator({ className = '' }: EmailValidatorProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<EmailValidatorConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ReturnType<typeof validateEmail> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToHistory } = useToolStore();

  const debouncedValidate = useMemo(
    () => debounce((value: string, config: EmailValidatorConfig) => {
      if (!value.trim()) {
        setResult(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      try {
        const validationResult = validateEmail(value, config);
        setResult(validationResult);
        
        if (validationResult.success && validationResult.output) {
          addToHistory({
            tool: 'email-validator',
            input: value,
            output: validationResult.output,
            config
          });
        }
      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Validation failed'
        });
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    debouncedValidate(input, config);
  }, [input, config, debouncedValidate]);

  const handleSampleClick = (sample: string) => {
    setInput(sample);
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getStatusIcon = () => {
    if (isProcessing) return '⏳';
    if (!result) return '📧';
    return result.metadata?.valid ? '✅' : '❌';
  };

  const getStatusColor = () => {
    if (isProcessing) return 'text-yellow-600';
    if (!result) return 'text-gray-500';
    return result.metadata?.valid ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InputPanel
            title="Email Address"
            value={input}
            onChange={setInput}
            placeholder="Enter email address to validate (e.g., user@example.com)"
            language="text"
            height="120px"
            maxLength={320}
            onClear={handleClear}
            statusIcon={getStatusIcon()}
            statusColor={getStatusColor()}
            footer={
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Sample emails:</span>
                {SAMPLE_EMAILS.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleClick(sample)}
                    className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            }
          />

          <OutputPanel
            title="Validation Result"
            value={result?.output || ''}
            error={result?.error}
            language="text"
            height="300px"
            isLoading={isProcessing}
            metadata={result?.metadata}
            showMetadata={true}
            downloads={result?.success ? [
              {
                label: 'Download Report',
                filename: 'email-validation-report.txt',
                content: result.output || '',
                type: 'text/plain'
              }
            ] : undefined}
          />
        </div>

        <div className="space-y-6">
          <OptionsPanel
            title="Validation Options"
            options={OPTIONS}
            values={config}
            onChange={handleConfigChange}
          />

          {result?.metadata && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Email Analysis
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={result.metadata.valid ? 'text-green-600' : 'text-red-600'}>
                    {result.metadata.valid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Length:</span>
                  <span>{result.metadata.length} chars</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Issues:</span>
                  <span className={result.metadata.issues > 0 ? 'text-red-600' : 'text-green-600'}>
                    {result.metadata.issues}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Warnings:</span>
                  <span className={result.metadata.warnings > 0 ? 'text-yellow-600' : 'text-green-600'}>
                    {result.metadata.warnings}
                  </span>
                </div>
                {result.metadata.features && result.metadata.features.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Features:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {result.metadata.features.map((feature: string, index: number) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.metadata.isDisposable && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠️ Disposable email detected
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Validation Tips
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Valid emails need exactly one @ symbol</li>
              <li>• Domain must have at least one dot</li>
              <li>• Local part can't start/end with dots</li>
              <li>• No consecutive dots allowed</li>
              <li>• Maximum length is 320 characters</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}