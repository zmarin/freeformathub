import React, { useState, useCallback, useMemo } from 'react'
import { Shield, FileText, Code, Book, Settings, Download, Info, CheckCircle } from 'lucide-react'
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui'
import { 
  processPasswordPolicyGenerator, 
  type PasswordPolicyGeneratorConfig 
} from '../../../tools/crypto/password-policy-generator'
import { useToolStore } from '../../../lib/store/toolStore'
import { debounce } from '../../../lib/utils'

const DEFAULT_CONFIG: PasswordPolicyGeneratorConfig = {
  policyType: 'corporate',
  complianceStandards: ['NIST'],
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  forbiddenPatterns: ['password', '123456', 'qwerty', 'admin'],
  maxRepeatingChars: 3,
  preventCommonPasswords: true,
  preventUserInfo: true,
  preventKeyboardPatterns: true,
  passwordHistory: 12,
  expirationDays: 90,
  lockoutAttempts: 5,
  lockoutDuration: 30,
  requireMFA: false,
  allowPasswordManager: true,
  outputFormat: 'policy-document',
  includeExamples: true,
  includeRationale: true
}

const POLICY_TYPE_OPTIONS = [
  { value: 'corporate', label: 'Corporate/Enterprise' },
  { value: 'government', label: 'Government/Federal' },
  { value: 'banking', label: 'Banking/Financial' },
  { value: 'healthcare', label: 'Healthcare/HIPAA' },
  { value: 'education', label: 'Education/Academic' },
  { value: 'startup', label: 'Startup/SMB' },
  { value: 'custom', label: 'Custom Policy' }
]

const COMPLIANCE_OPTIONS = [
  { value: 'NIST', label: 'NIST Cybersecurity Framework' },
  { value: 'ISO27001', label: 'ISO 27001' },
  { value: 'SOX', label: 'Sarbanes-Oxley (SOX)' },
  { value: 'HIPAA', label: 'HIPAA/HITECH' },
  { value: 'PCI-DSS', label: 'PCI DSS' },
  { value: 'GDPR', label: 'GDPR' }
]

const OUTPUT_FORMAT_OPTIONS = [
  { value: 'policy-document', label: 'Policy Document (Markdown)' },
  { value: 'json-config', label: 'JSON Configuration' },
  { value: 'regex-patterns', label: 'Regex Validation Patterns' },
  { value: 'implementation-guide', label: 'Implementation Guide' }
]

const OPTIONS = [
  {
    key: 'policyType',
    label: 'Policy Type',
    type: 'select' as const,
    default: 'corporate',
    options: POLICY_TYPE_OPTIONS,
    description: 'Choose a pre-configured policy template'
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'policy-document',
    options: OUTPUT_FORMAT_OPTIONS,
    description: 'Format for the generated policy'
  },
  {
    key: 'minLength',
    label: 'Minimum Password Length',
    type: 'number' as const,
    default: 12,
    min: 6,
    max: 50,
    description: 'Minimum number of characters required'
  },
  {
    key: 'maxLength',
    label: 'Maximum Password Length',
    type: 'number' as const,
    default: 128,
    min: 20,
    max: 256,
    description: 'Maximum number of characters allowed'
  },
  {
    key: 'requireUppercase',
    label: 'Require Uppercase Letters',
    type: 'boolean' as const,
    default: true,
    description: 'Must contain at least one uppercase letter (A-Z)'
  },
  {
    key: 'requireLowercase',
    label: 'Require Lowercase Letters',
    type: 'boolean' as const,
    default: true,
    description: 'Must contain at least one lowercase letter (a-z)'
  },
  {
    key: 'requireNumbers',
    label: 'Require Numbers',
    type: 'boolean' as const,
    default: true,
    description: 'Must contain at least one numeric digit (0-9)'
  },
  {
    key: 'requireSpecialChars',
    label: 'Require Special Characters',
    type: 'boolean' as const,
    default: true,
    description: 'Must contain at least one special/symbol character'
  },
  {
    key: 'allowedSpecialChars',
    label: 'Allowed Special Characters',
    type: 'text' as const,
    default: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    description: 'Characters considered as special/symbols',
    showWhen: (config: PasswordPolicyGeneratorConfig) => config.requireSpecialChars
  },
  {
    key: 'maxRepeatingChars',
    label: 'Max Repeating Characters',
    type: 'number' as const,
    default: 3,
    min: 0,
    max: 10,
    description: 'Maximum allowed consecutive identical characters'
  },
  {
    key: 'preventCommonPasswords',
    label: 'Prevent Common Passwords',
    type: 'boolean' as const,
    default: true,
    description: 'Reject passwords from common password lists'
  },
  {
    key: 'preventUserInfo',
    label: 'Prevent Personal Information',
    type: 'boolean' as const,
    default: true,
    description: 'Reject passwords containing username or personal info'
  },
  {
    key: 'preventKeyboardPatterns',
    label: 'Prevent Keyboard Patterns',
    type: 'boolean' as const,
    default: true,
    description: 'Reject common keyboard patterns (qwerty, 123456, etc.)'
  },
  {
    key: 'passwordHistory',
    label: 'Password History Count',
    type: 'number' as const,
    default: 12,
    min: 0,
    max: 50,
    description: 'Number of previous passwords to remember'
  },
  {
    key: 'expirationDays',
    label: 'Password Expiration (Days)',
    type: 'number' as const,
    default: 90,
    min: 0,
    max: 365,
    description: 'Days until password must be changed (0 = never expires)'
  },
  {
    key: 'lockoutAttempts',
    label: 'Account Lockout Attempts',
    type: 'number' as const,
    default: 5,
    min: 1,
    max: 20,
    description: 'Failed login attempts before account lockout'
  },
  {
    key: 'lockoutDuration',
    label: 'Lockout Duration (Minutes)',
    type: 'number' as const,
    default: 30,
    min: 1,
    max: 1440,
    description: 'Minutes account remains locked after failed attempts'
  },
  {
    key: 'requireMFA',
    label: 'Require Multi-Factor Authentication',
    type: 'boolean' as const,
    default: false,
    description: 'Mandate MFA in addition to password'
  },
  {
    key: 'allowPasswordManager',
    label: 'Allow Password Managers',
    type: 'boolean' as const,
    default: true,
    description: 'Permit use of password management tools'
  },
  {
    key: 'includeExamples',
    label: 'Include Password Examples',
    type: 'boolean' as const,
    default: true,
    description: 'Add valid/invalid password examples to policy'
  },
  {
    key: 'includeRationale',
    label: 'Include Security Rationale',
    type: 'boolean' as const,
    default: true,
    description: 'Explain reasoning behind each requirement'
  }
]

export function PasswordPolicyGenerator() {
  const [result, setResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>(['NIST'])
  
  const { getConfig, updateConfig } = useToolStore()
  const config = getConfig('password-policy-generator') as PasswordPolicyGeneratorConfig || DEFAULT_CONFIG

  const debouncedProcess = useMemo(
    () => debounce(async (currentConfig: PasswordPolicyGeneratorConfig) => {
      setIsProcessing(true)
      
      try {
        const configWithCompliance = {
          ...currentConfig,
          complianceStandards: selectedCompliance as any
        }
        
        const toolResult = await processPasswordPolicyGenerator(configWithCompliance)
        setResult(toolResult.data)
      } catch (error) {
        console.error('Policy generation failed:', error)
        setResult(null)
      } finally {
        setIsProcessing(false)
      }
    }, 500),
    [selectedCompliance]
  )

  const handleConfigChange = useCallback((newConfig: PasswordPolicyGeneratorConfig) => {
    updateConfig('password-policy-generator', newConfig)
    debouncedProcess(newConfig)
  }, [updateConfig, debouncedProcess])

  const handleComplianceChange = useCallback((standards: string[]) => {
    setSelectedCompliance(standards)
    debouncedProcess({ ...config, complianceStandards: standards as any })
  }, [config, debouncedProcess])

  const handleDownload = useCallback(() => {
    if (!result) return

    const content = typeof result.output === 'string' 
      ? result.output 
      : JSON.stringify(result.output, null, 2)
    
    const blob = new Blob([content], { type: result.contentType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [result])

  // Initial generation
  React.useEffect(() => {
    debouncedProcess(config)
  }, [])

  const policyTypeInfo = {
    corporate: 'Standard enterprise policy balancing security and usability',
    government: 'High-security policy for federal and government systems',
    banking: 'Financial services policy with regulatory compliance',
    healthcare: 'HIPAA-compliant policy for healthcare organizations',
    education: 'Academic-friendly policy for educational institutions',
    startup: 'Practical policy for small businesses and startups',
    custom: 'Fully customizable policy for specific requirements'
  }

  return (
    <div className="space-y-6">
      {/* Policy Configuration */}
      <InputPanel
        title="Policy Configuration"
        className="min-h-[300px]"
        rightActions={
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              {config.policyType.charAt(0).toUpperCase() + config.policyType.slice(1)} Policy
            </span>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Policy Type Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  {POLICY_TYPE_OPTIONS.find(opt => opt.value === config.policyType)?.label || 'Policy Type'}
                </h3>
                <p className="text-sm text-blue-800">
                  {policyTypeInfo[config.policyType as keyof typeof policyTypeInfo]}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Standards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Compliance Standards
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COMPLIANCE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCompliance.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleComplianceChange([...selectedCompliance, option.value])
                      } else {
                        handleComplianceChange(selectedCompliance.filter(s => s !== option.value))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">{config.minLength}-{config.maxLength}</div>
              <div className="text-sm text-gray-600">Length Range</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">
                {[config.requireUppercase, config.requireLowercase, config.requireNumbers, config.requireSpecialChars].filter(Boolean).length}
              </div>
              <div className="text-sm text-gray-600">Complexity Rules</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">{config.expirationDays}</div>
              <div className="text-sm text-gray-600">Expires (Days)</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">{selectedCompliance.length}</div>
              <div className="text-sm text-gray-600">Standards</div>
            </div>
          </div>
        </div>
      </InputPanel>

      {/* Options Panel */}
      <OptionsPanel
        options={OPTIONS}
        config={config}
        onChange={handleConfigChange}
      />

      {/* Output Panel */}
      <OutputPanel
        title="Generated Password Policy"
        rightActions={
          result && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download {result.filename}
            </button>
          )
        }
      >
        {isProcessing ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Generating password policy...</span>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Policy Preview */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  {config.outputFormat === 'policy-document' && <FileText className="w-5 h-5 text-blue-500" />}
                  {config.outputFormat === 'json-config' && <Code className="w-5 h-5 text-green-500" />}
                  {config.outputFormat === 'regex-patterns' && <Code className="w-5 h-5 text-purple-500" />}
                  {config.outputFormat === 'implementation-guide' && <Book className="w-5 h-5 text-orange-500" />}
                  <h3 className="font-medium text-gray-900">
                    {OUTPUT_FORMAT_OPTIONS.find(opt => opt.value === config.outputFormat)?.label}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                  {typeof result.output === 'string' 
                    ? result.output 
                    : JSON.stringify(result.output, null, 2)
                  }
                </pre>
              </div>
            </div>

            {/* Policy Statistics */}
            {result.stats && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Policy Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Policy Type:</span>
                    <div className="text-gray-800 capitalize">{result.stats.policyType}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Output Format:</span>
                    <div className="text-gray-800">{result.stats.outputFormat}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Length Range:</span>
                    <div className="text-gray-800">{result.stats.minLength}-{result.stats.maxLength} chars</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Complexity Rules:</span>
                    <div className="text-gray-800">{result.stats.complexityRequirements} types</div>
                  </div>
                </div>
              </div>
            )}

            {/* Regex Pattern Display */}
            {result.regexPattern && config.outputFormat !== 'regex-patterns' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Validation Regex Pattern
                </h3>
                <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono text-sm break-all">
                  {result.regexPattern}
                </code>
                <p className="text-xs text-purple-700 mt-2">
                  Use this pattern for client-side or server-side password validation
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Configure your password policy settings to generate the policy document</p>
          </div>
        )}
      </OutputPanel>
    </div>
  )
}