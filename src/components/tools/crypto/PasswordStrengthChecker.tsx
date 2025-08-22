import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processPasswordStrengthCheck, type PasswordStrengthConfig } from '../../../tools/crypto/password-strength-checker';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface PasswordStrengthCheckerProps {
  className?: string;
}

const DEFAULT_CONFIG: PasswordStrengthConfig = {
  includeCommonChecks: true,
  checkDictionary: true,
  checkPatterns: true,
  checkPersonalInfo: false,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  minLength: 8,
  maxLength: 128,
  showSuggestions: true,
  detailedAnalysis: true,
};

const BASIC_OPTIONS = [
  {
    key: 'detailedAnalysis',
    label: 'Detailed Analysis',
    type: 'checkbox' as const,
    default: true,
    description: 'Show comprehensive breakdown of password composition',
  },
  {
    key: 'showSuggestions',
    label: 'Show Suggestions',
    type: 'checkbox' as const,
    default: true,
    description: 'Provide improvement recommendations',
  },
  {
    key: 'includeCommonChecks',
    label: 'Check Common Passwords',
    type: 'checkbox' as const,
    default: true,
    description: 'Test against common password databases',
  },
  {
    key: 'checkDictionary',
    label: 'Dictionary Word Check',
    type: 'checkbox' as const,
    default: true,
    description: 'Detect common dictionary words',
  },
  {
    key: 'checkPatterns',
    label: 'Pattern Detection',
    type: 'checkbox' as const,
    default: true,
    description: 'Identify predictable patterns (123, abc, qwerty)',
  },
] as const;

const REQUIREMENTS_OPTIONS = [
  {
    key: 'requireUppercase',
    label: 'Require Uppercase',
    type: 'checkbox' as const,
    default: true,
    description: 'Password must contain uppercase letters',
  },
  {
    key: 'requireLowercase',
    label: 'Require Lowercase',
    type: 'checkbox' as const,
    default: true,
    description: 'Password must contain lowercase letters',
  },
  {
    key: 'requireNumbers',
    label: 'Require Numbers',
    type: 'checkbox' as const,
    default: true,
    description: 'Password must contain numeric digits',
  },
  {
    key: 'requireSymbols',
    label: 'Require Symbols',
    type: 'checkbox' as const,
    default: true,
    description: 'Password must contain special characters',
  },
] as const;

const LENGTH_OPTIONS = [
  {
    key: 'minLength',
    label: 'Minimum Length',
    type: 'range' as const,
    default: 8,
    min: 4,
    max: 20,
    step: 1,
    description: 'Minimum required password length',
  },
  {
    key: 'maxLength',
    label: 'Maximum Length',
    type: 'range' as const,
    default: 128,
    min: 20,
    max: 256,
    step: 8,
    description: 'Maximum allowed password length',
  },
] as const;

function getStrengthColor(strength: string): string {
  switch (strength) {
    case 'Very Strong': return 'text-green-600 bg-green-50 border-green-200';
    case 'Strong': return 'text-green-600 bg-green-50 border-green-200';
    case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'Fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'Weak': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'Very Weak': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-green-400';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function PasswordStrengthChecker({ className = '' }: PasswordStrengthCheckerProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<PasswordStrengthConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: PasswordStrengthConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setAnalysis(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processPasswordStrengthCheck(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setAnalysis(result.analysis);
          
          // Add to history with masked password
          addToHistory({
            toolId: 'password-strength-checker',
            input: `[Password - ${inputValue.length} characters]`,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to analyze password strength');
          setOutput('');
          setAnalysis(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during password analysis');
        setOutput('');
        setAnalysis(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('password-strength-checker');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  // Example passwords for testing
  const examples = [
    {
      label: 'Very Weak - Common',
      value: 'password123',
    },
    {
      label: 'Weak - Sequential',
      value: 'abc123456',
    },
    {
      label: 'Fair - Basic Mix',
      value: 'MyPass123',
    },
    {
      label: 'Good - Complex',
      value: 'MyP@ssw0rd2024!',
    },
    {
      label: 'Strong - Passphrase',
      value: 'Coffee$Horse#Music#2024',
    },
    {
      label: 'Test Your Password',
      value: '',
    },
  ];

  // Build all options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...REQUIREMENTS_OPTIONS,
    ...LENGTH_OPTIONS,
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Password to Analyze
            </label>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your password here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500">
            Your password is analyzed locally and never sent to any server
          </p>
        </div>

        {/* Quick example buttons */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Test Examples</h3>
          <div className="grid gap-1">
            {examples.slice(0, -1).map((example, index) => (
              <button
                key={index}
                onClick={() => handleExample(example.value)}
                className="px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded transition-colors"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time strength indicator */}
        {analysis && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Strength Meter</h3>
            <div className="space-y-2">
              <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getStrengthColor(analysis.strength)}`}>
                {analysis.strength} ({analysis.score}/100)
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getScoreColor(analysis.score)}`}
                  style={{ width: `${analysis.score}%` }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-600">
                <div>Crack Time: {analysis.estimatedCrackTime}</div>
                <div>Entropy: {analysis.entropy.toFixed(1)} bits</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick checks display */}
        {analysis && config.detailedAnalysis && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Security Checks</h3>
            <div className="space-y-1 text-xs">
              <div className={`flex items-center gap-2 ${analysis.checks.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                <span>{analysis.checks.hasUppercase ? '✅' : '❌'}</span>
                <span>Uppercase Letters</span>
              </div>
              <div className={`flex items-center gap-2 ${analysis.checks.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                <span>{analysis.checks.hasLowercase ? '✅' : '❌'}</span>
                <span>Lowercase Letters</span>
              </div>
              <div className={`flex items-center gap-2 ${analysis.checks.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                <span>{analysis.checks.hasNumbers ? '✅' : '❌'}</span>
                <span>Numbers</span>
              </div>
              <div className={`flex items-center gap-2 ${analysis.checks.hasSymbols ? 'text-green-600' : 'text-red-600'}`}>
                <span>{analysis.checks.hasSymbols ? '✅' : '❌'}</span>
                <span>Symbols</span>
              </div>
              <div className={`flex items-center gap-2 ${analysis.checks.hasLength ? 'text-green-600' : 'text-red-600'}`}>
                <span>{analysis.checks.hasLength ? '✅' : '❌'}</span>
                <span>Adequate Length</span>
              </div>
              <div className={`flex items-center gap-2 ${analysis.checks.hasNoCommonPatterns ? 'text-green-600' : 'text-red-600'}`}>
                <span>{analysis.checks.hasNoCommonPatterns ? '✅' : '❌'}</span>
                <span>No Common Patterns</span>
              </div>
            </div>
          </div>
        )}
        
        <OptionsPanel
          title="Analysis Options"
          options={BASIC_OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />

        <OptionsPanel
          title="Requirements"
          options={[...REQUIREMENTS_OPTIONS, ...LENGTH_OPTIONS]}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Security Tips */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <div className="flex items-start gap-2">
            <span className="text-blue-600">💡</span>
            <div>
              <div className="font-medium text-blue-800">Security Tips</div>
              <div className="text-blue-700 mt-1 space-y-1">
                <div>• Length matters more than complexity</div>
                <div>• Use unique passwords for each account</div>
                <div>• Consider using a password manager</div>
                <div>• Enable 2FA wherever possible</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Password Analysis Report"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Enter a password to analyze its strength and security..."
          processingMessage="Analyzing password security..."
        />
      </div>
    </div>
  );
}