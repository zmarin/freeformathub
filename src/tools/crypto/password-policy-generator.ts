import type { Tool, ToolResult, ToolExample } from '../types'
import { TOOL_CATEGORIES } from '../../lib/tools/registry'

export interface PasswordPolicyGeneratorConfig {
  policyType: 'corporate' | 'government' | 'banking' | 'healthcare' | 'education' | 'startup' | 'custom'
  complianceStandards: ('NIST' | 'ISO27001' | 'SOX' | 'HIPAA' | 'PCI-DSS' | 'GDPR')[]
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  allowedSpecialChars: string
  forbiddenPatterns: string[]
  maxRepeatingChars: number
  preventCommonPasswords: boolean
  preventUserInfo: boolean
  preventKeyboardPatterns: boolean
  passwordHistory: number
  expirationDays: number
  lockoutAttempts: number
  lockoutDuration: number
  requireMFA: boolean
  allowPasswordManager: boolean
  outputFormat: 'policy-document' | 'json-config' | 'regex-patterns' | 'implementation-guide'
  includeExamples: boolean
  includeRationale: boolean
}

export const PASSWORD_POLICY_GENERATOR_CONFIG: PasswordPolicyGeneratorConfig = {
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

interface PolicyTemplate {
  title: string
  description: string
  requirements: {
    length: { min: number; max: number; rationale: string }
    complexity: {
      uppercase: boolean
      lowercase: boolean
      numbers: boolean
      symbols: boolean
      rationale: string
    }
    restrictions: {
      repeating: number
      common: boolean
      personal: boolean
      keyboard: boolean
      rationale: string
    }
    lifecycle: {
      history: number
      expiration: number
      rationale: string
    }
    security: {
      lockout: { attempts: number; duration: number }
      mfa: boolean
      rationale: string
    }
  }
  compliance: string[]
  implementation: string[]
}

const POLICY_TEMPLATES: Record<string, PolicyTemplate> = {
  corporate: {
    title: 'Corporate Password Policy',
    description: 'Standard enterprise password policy for business environments',
    requirements: {
      length: { min: 12, max: 128, rationale: 'Balances security and usability for business users' },
      complexity: {
        uppercase: true, lowercase: true, numbers: true, symbols: true,
        rationale: 'Multi-character class requirement increases entropy and resistance to attacks'
      },
      restrictions: {
        repeating: 3, common: true, personal: true, keyboard: true,
        rationale: 'Prevents predictable patterns that reduce password strength'
      },
      lifecycle: {
        history: 12, expiration: 90,
        rationale: 'Quarterly rotation with sufficient history to prevent reuse'
      },
      security: {
        lockout: { attempts: 5, duration: 30 }, mfa: false,
        rationale: 'Progressive lockout prevents brute force while maintaining accessibility'
      }
    },
    compliance: ['NIST', 'ISO27001'],
    implementation: [
      'Deploy via Active Directory Group Policy',
      'Integrate with Single Sign-On (SSO) solutions',
      'Implement password complexity validation in applications',
      'Configure account lockout policies in identity management systems'
    ]
  },
  government: {
    title: 'Government/Federal Password Policy',
    description: 'High-security password policy for government and federal agencies',
    requirements: {
      length: { min: 15, max: 128, rationale: 'Extended length requirement for classified system access' },
      complexity: {
        uppercase: true, lowercase: true, numbers: true, symbols: true,
        rationale: 'Maximum complexity required for national security systems'
      },
      restrictions: {
        repeating: 2, common: true, personal: true, keyboard: true,
        rationale: 'Strict pattern restrictions for high-security environments'
      },
      lifecycle: {
        history: 24, expiration: 60,
        rationale: 'Frequent rotation with extensive history for maximum security'
      },
      security: {
        lockout: { attempts: 3, duration: 60 }, mfa: true,
        rationale: 'Aggressive lockout with mandatory MFA for critical systems'
      }
    },
    compliance: ['NIST', 'FISMA', 'Common Criteria'],
    implementation: [
      'Implement in CAC/PIV card systems',
      'Configure with LDAP/Active Directory for federal systems',
      'Integrate with government PKI infrastructure',
      'Deploy with mandatory smart card authentication'
    ]
  },
  banking: {
    title: 'Financial Services Password Policy',
    description: 'Banking-grade password policy for financial institutions',
    requirements: {
      length: { min: 14, max: 128, rationale: 'Financial regulatory compliance requirements' },
      complexity: {
        uppercase: true, lowercase: true, numbers: true, symbols: true,
        rationale: 'Full complexity required for financial data protection'
      },
      restrictions: {
        repeating: 2, common: true, personal: true, keyboard: true,
        rationale: 'Prevents patterns that could be exploited for financial fraud'
      },
      lifecycle: {
        history: 18, expiration: 60,
        rationale: 'Frequent rotation required for PCI-DSS compliance'
      },
      security: {
        lockout: { attempts: 3, duration: 45 }, mfa: true,
        rationale: 'Strict controls required for financial transaction security'
      }
    },
    compliance: ['PCI-DSS', 'SOX', 'FFIEC', 'Basel III'],
    implementation: [
      'Integrate with core banking systems',
      'Configure for online banking platforms',
      'Implement in payment processing systems',
      'Deploy with transaction monitoring systems'
    ]
  },
  healthcare: {
    title: 'Healthcare Password Policy (HIPAA)',
    description: 'HIPAA-compliant password policy for healthcare organizations',
    requirements: {
      length: { min: 12, max: 128, rationale: 'HIPAA Security Rule minimum requirements' },
      complexity: {
        uppercase: true, lowercase: true, numbers: true, symbols: true,
        rationale: 'Required for PHI (Protected Health Information) access controls'
      },
      restrictions: {
        repeating: 3, common: true, personal: true, keyboard: true,
        rationale: 'Prevents unauthorized access to patient records'
      },
      lifecycle: {
        history: 12, expiration: 90,
        rationale: 'Quarterly rotation standard for healthcare compliance'
      },
      security: {
        lockout: { attempts: 5, duration: 30 }, mfa: false,
        rationale: 'Balanced security that maintains clinical workflow efficiency'
      }
    },
    compliance: ['HIPAA', 'HITECH', 'ISO27001'],
    implementation: [
      'Configure in Electronic Health Record (EHR) systems',
      'Implement in Practice Management systems',
      'Deploy with medical device access controls',
      'Integrate with healthcare identity management'
    ]
  },
  education: {
    title: 'Educational Institution Password Policy',
    description: 'Academic password policy for schools and universities',
    requirements: {
      length: { min: 10, max: 128, rationale: 'Student-friendly while maintaining security' },
      complexity: {
        uppercase: true, lowercase: true, numbers: true, symbols: false,
        rationale: 'Simplified complexity for diverse user technical skills'
      },
      restrictions: {
        repeating: 4, common: true, personal: true, keyboard: true,
        rationale: 'Basic protections suitable for educational environment'
      },
      lifecycle: {
        history: 6, expiration: 180,
        rationale: 'Semester-based rotation aligned with academic calendar'
      },
      security: {
        lockout: { attempts: 8, duration: 15 }, mfa: false,
        rationale: 'Lenient lockout policy for educational accessibility'
      }
    },
    compliance: ['FERPA', 'COPPA'],
    implementation: [
      'Deploy in Student Information Systems (SIS)',
      'Configure for Learning Management Systems (LMS)',
      'Implement in campus Wi-Fi authentication',
      'Integrate with library and lab access systems'
    ]
  },
  startup: {
    title: 'Startup/SMB Password Policy',
    description: 'Practical password policy for small businesses and startups',
    requirements: {
      length: { min: 10, max: 128, rationale: 'Practical minimum for small team environments' },
      complexity: {
        uppercase: true, lowercase: true, numbers: true, symbols: false,
        rationale: 'Essential complexity without over-complicating for small teams'
      },
      restrictions: {
        repeating: 4, common: true, personal: false, keyboard: true,
        rationale: 'Core protections with practical implementation considerations'
      },
      lifecycle: {
        history: 6, expiration: 180,
        rationale: 'Manageable rotation schedule for resource-constrained environments'
      },
      security: {
        lockout: { attempts: 10, duration: 10 }, mfa: false,
        rationale: 'User-friendly approach with basic protection'
      }
    },
    compliance: ['Basic Security'],
    implementation: [
      'Configure in cloud-based productivity suites',
      'Implement in startup SaaS applications',
      'Deploy with password manager integration',
      'Set up in team collaboration tools'
    ]
  }
}

export function generatePasswordPolicy(config: PasswordPolicyGeneratorConfig): any {
  const template = POLICY_TEMPLATES[config.policyType] || POLICY_TEMPLATES.corporate
  
  // Create custom policy based on config
  const policy = {
    ...template,
    requirements: {
      length: {
        min: config.minLength,
        max: config.maxLength,
        rationale: template.requirements.length.rationale
      },
      complexity: {
        uppercase: config.requireUppercase,
        lowercase: config.requireLowercase,
        numbers: config.requireNumbers,
        symbols: config.requireSpecialChars,
        allowedSymbols: config.allowedSpecialChars,
        rationale: template.requirements.complexity.rationale
      },
      restrictions: {
        repeating: config.maxRepeatingChars,
        common: config.preventCommonPasswords,
        personal: config.preventUserInfo,
        keyboard: config.preventKeyboardPatterns,
        forbidden: config.forbiddenPatterns,
        rationale: template.requirements.restrictions.rationale
      },
      lifecycle: {
        history: config.passwordHistory,
        expiration: config.expirationDays,
        rationale: template.requirements.lifecycle.rationale
      },
      security: {
        lockout: {
          attempts: config.lockoutAttempts,
          duration: config.lockoutDuration
        },
        mfa: config.requireMFA,
        passwordManager: config.allowPasswordManager,
        rationale: template.requirements.security.rationale
      }
    },
    compliance: config.complianceStandards.length > 0 ? config.complianceStandards : template.compliance
  }

  return policy
}

export function generateRegexPattern(config: PasswordPolicyGeneratorConfig): string {
  let pattern = '^'
  
  // Positive lookaheads for required character classes
  if (config.requireLowercase) {
    pattern += '(?=.*[a-z])'
  }
  if (config.requireUppercase) {
    pattern += '(?=.*[A-Z])'
  }
  if (config.requireNumbers) {
    pattern += '(?=.*\\d)'
  }
  if (config.requireSpecialChars) {
    const escapedChars = config.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    pattern += `(?=.*[${escapedChars}])`
  }
  
  // Length constraint
  pattern += `.{${config.minLength},${config.maxLength}}`
  
  // Negative lookahead for repeating characters
  if (config.maxRepeatingChars > 0) {
    pattern += `(?!.*(.)\\1{${config.maxRepeatingChars - 1},})`
  }
  
  pattern += '$'
  
  return pattern
}

export function generatePolicyDocument(policy: any, config: PasswordPolicyGeneratorConfig): string {
  let document = `# ${policy.title}\n\n`
  document += `${policy.description}\n\n`
  
  document += `## Password Requirements\n\n`
  
  // Length requirements
  document += `### Length Requirements\n`
  document += `- **Minimum Length**: ${policy.requirements.length.min} characters\n`
  document += `- **Maximum Length**: ${policy.requirements.length.max} characters\n`
  if (config.includeRationale) {
    document += `- **Rationale**: ${policy.requirements.length.rationale}\n`
  }
  document += `\n`
  
  // Complexity requirements
  document += `### Complexity Requirements\n`
  if (policy.requirements.complexity.uppercase) document += `- Must contain at least one uppercase letter (A-Z)\n`
  if (policy.requirements.complexity.lowercase) document += `- Must contain at least one lowercase letter (a-z)\n`
  if (policy.requirements.complexity.numbers) document += `- Must contain at least one number (0-9)\n`
  if (policy.requirements.complexity.symbols) {
    document += `- Must contain at least one special character: ${policy.requirements.complexity.allowedSymbols}\n`
  }
  if (config.includeRationale) {
    document += `- **Rationale**: ${policy.requirements.complexity.rationale}\n`
  }
  document += `\n`
  
  // Restrictions
  document += `### Restrictions\n`
  document += `- Cannot contain more than ${policy.requirements.restrictions.repeating} consecutive identical characters\n`
  if (policy.requirements.restrictions.common) document += `- Cannot be a commonly used password\n`
  if (policy.requirements.restrictions.personal) document += `- Cannot contain personal information (name, username, etc.)\n`
  if (policy.requirements.restrictions.keyboard) document += `- Cannot contain keyboard patterns (qwerty, 123456, etc.)\n`
  if (policy.requirements.restrictions.forbidden.length > 0) {
    document += `- Cannot contain the following patterns: ${policy.requirements.restrictions.forbidden.join(', ')}\n`
  }
  if (config.includeRationale) {
    document += `- **Rationale**: ${policy.requirements.restrictions.rationale}\n`
  }
  document += `\n`
  
  // Lifecycle management
  document += `### Password Lifecycle\n`
  document += `- **Password History**: Cannot reuse last ${policy.requirements.lifecycle.history} passwords\n`
  document += `- **Expiration**: Passwords must be changed every ${policy.requirements.lifecycle.expiration} days\n`
  if (config.includeRationale) {
    document += `- **Rationale**: ${policy.requirements.lifecycle.rationale}\n`
  }
  document += `\n`
  
  // Security controls
  document += `### Security Controls\n`
  document += `- **Account Lockout**: Account locked after ${policy.requirements.security.lockout.attempts} failed attempts for ${policy.requirements.security.lockout.duration} minutes\n`
  document += `- **Multi-Factor Authentication**: ${policy.requirements.security.mfa ? 'Required' : 'Optional'}\n`
  document += `- **Password Managers**: ${policy.requirements.security.passwordManager ? 'Allowed and encouraged' : 'Not permitted'}\n`
  if (config.includeRationale) {
    document += `- **Rationale**: ${policy.requirements.security.rationale}\n`
  }
  document += `\n`
  
  // Compliance
  if (policy.compliance.length > 0) {
    document += `## Compliance Standards\n`
    document += `This policy aligns with the following standards:\n`
    policy.compliance.forEach((standard: string) => {
      document += `- ${standard}\n`
    })
    document += `\n`
  }
  
  // Implementation
  if (policy.implementation && policy.implementation.length > 0) {
    document += `## Implementation Guidelines\n`
    policy.implementation.forEach((guideline: string) => {
      document += `- ${guideline}\n`
    })
    document += `\n`
  }
  
  // Examples
  if (config.includeExamples) {
    document += `## Password Examples\n\n`
    document += `### Valid Passwords\n`
    document += `- \`MySecureP@ssw0rd2024!\`\n`
    document += `- \`Tr0ub4dor&3\`\n`
    document += `- \`C0rrect-H0rse-Battery-St@ple\`\n\n`
    
    document += `### Invalid Passwords\n`
    document += `- \`password123\` (too common)\n`
    document += `- \`12345678\` (no complexity)\n`
    document += `- \`qwerty123\` (keyboard pattern)\n`
    document += `- \`aaaaaa111\` (repeating characters)\n\n`
  }
  
  return document
}

export function generateJSONConfig(policy: any, config: PasswordPolicyGeneratorConfig): object {
  return {
    policyName: policy.title,
    version: "1.0",
    effectiveDate: new Date().toISOString().split('T')[0],
    requirements: {
      minLength: policy.requirements.length.min,
      maxLength: policy.requirements.length.max,
      requireUppercase: policy.requirements.complexity.uppercase,
      requireLowercase: policy.requirements.complexity.lowercase,
      requireNumbers: policy.requirements.complexity.numbers,
      requireSpecialChars: policy.requirements.complexity.symbols,
      allowedSpecialChars: policy.requirements.complexity.allowedSymbols,
      maxRepeatingChars: policy.requirements.restrictions.repeating,
      preventCommonPasswords: policy.requirements.restrictions.common,
      preventPersonalInfo: policy.requirements.restrictions.personal,
      preventKeyboardPatterns: policy.requirements.restrictions.keyboard,
      forbiddenPatterns: policy.requirements.restrictions.forbidden,
      passwordHistory: policy.requirements.lifecycle.history,
      expirationDays: policy.requirements.lifecycle.expiration,
      lockoutAttempts: policy.requirements.security.lockout.attempts,
      lockoutDuration: policy.requirements.security.lockout.duration,
      requireMFA: policy.requirements.security.mfa,
      allowPasswordManager: policy.requirements.security.passwordManager
    },
    compliance: policy.compliance,
    implementation: policy.implementation || []
  }
}

export function generateImplementationGuide(policy: any, config: PasswordPolicyGeneratorConfig): string {
  let guide = `# ${policy.title} - Implementation Guide\n\n`
  
  guide += `## Technical Implementation\n\n`
  
  guide += `### Regular Expression Pattern\n`
  guide += `\`\`\`regex\n${generateRegexPattern(config)}\`\`\`\n\n`
  
  guide += `### JavaScript Validation Example\n`
  guide += `\`\`\`javascript\n`
  guide += `function validatePassword(password) {\n`
  guide += `  const minLength = ${policy.requirements.length.min};\n`
  guide += `  const maxLength = ${policy.requirements.length.max};\n`
  guide += `  \n`
  guide += `  // Length check\n`
  guide += `  if (password.length < minLength || password.length > maxLength) {\n`
  guide += `    return { valid: false, message: 'Password must be between ' + minLength + ' and ' + maxLength + ' characters' };\n`
  guide += `  }\n`
  guide += `  \n`
  
  if (policy.requirements.complexity.uppercase) {
    guide += `  // Uppercase check\n`
    guide += `  if (!/[A-Z]/.test(password)) {\n`
    guide += `    return { valid: false, message: 'Password must contain at least one uppercase letter' };\n`
    guide += `  }\n`
    guide += `  \n`
  }
  
  if (policy.requirements.complexity.lowercase) {
    guide += `  // Lowercase check\n`
    guide += `  if (!/[a-z]/.test(password)) {\n`
    guide += `    return { valid: false, message: 'Password must contain at least one lowercase letter' };\n`
    guide += `  }\n`
    guide += `  \n`
  }
  
  if (policy.requirements.complexity.numbers) {
    guide += `  // Number check\n`
    guide += `  if (!/\\d/.test(password)) {\n`
    guide += `    return { valid: false, message: 'Password must contain at least one number' };\n`
    guide += `  }\n`
    guide += `  \n`
  }
  
  if (policy.requirements.complexity.symbols) {
    guide += `  // Special character check\n`
    guide += `  if (!/[${policy.requirements.complexity.allowedSymbols.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]/.test(password)) {\n`
    guide += `    return { valid: false, message: 'Password must contain at least one special character' };\n`
    guide += `  }\n`
    guide += `  \n`
  }
  
  guide += `  return { valid: true, message: 'Password is valid' };\n`
  guide += `}\n`
  guide += `\`\`\`\n\n`
  
  guide += `### SQL Schema for Password History\n`
  guide += `\`\`\`sql\n`
  guide += `CREATE TABLE password_history (\n`
  guide += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`
  guide += `  user_id INT NOT NULL,\n`
  guide += `  password_hash VARCHAR(255) NOT NULL,\n`
  guide += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`
  guide += `  INDEX idx_user_id (user_id),\n`
  guide += `  INDEX idx_created_at (created_at)\n`
  guide += `);\n`
  guide += `\`\`\`\n\n`
  
  guide += `### Account Lockout Configuration\n`
  guide += `\`\`\`json\n`
  guide += `{\n`
  guide += `  "accountLockout": {\n`
  guide += `    "maxFailedAttempts": ${policy.requirements.security.lockout.attempts},\n`
  guide += `    "lockoutDurationMinutes": ${policy.requirements.security.lockout.duration},\n`
  guide += `    "resetCounterAfterMinutes": ${policy.requirements.security.lockout.duration * 2}\n`
  guide += `  }\n`
  guide += `}\n`
  guide += `\`\`\`\n\n`
  
  if (policy.implementation && policy.implementation.length > 0) {
    guide += `## Platform-Specific Implementation\n\n`
    policy.implementation.forEach((impl: string, index: number) => {
      guide += `${index + 1}. ${impl}\n`
    })
    guide += `\n`
  }
  
  return guide
}

export async function processPasswordPolicyGenerator(
  config: PasswordPolicyGeneratorConfig
): Promise<ToolResult> {
  try {
    const startTime = performance.now()
    
    // Generate the policy
    const policy = generatePasswordPolicy(config)
    
    let output: string | object
    let contentType: string
    let filename: string
    
    switch (config.outputFormat) {
      case 'policy-document':
        output = generatePolicyDocument(policy, config)
        contentType = 'text/markdown'
        filename = 'password-policy.md'
        break
        
      case 'json-config':
        output = generateJSONConfig(policy, config)
        contentType = 'application/json'
        filename = 'password-policy.json'
        break
        
      case 'regex-patterns':
        output = `# Password Validation Patterns\n\n`
        output += `## Primary Validation Regex\n`
        output += `\`\`\`regex\n${generateRegexPattern(config)}\`\`\`\n\n`
        output += `## Individual Component Patterns\n`
        if (config.requireLowercase) output += `- Lowercase: \`(?=.*[a-z])\`\n`
        if (config.requireUppercase) output += `- Uppercase: \`(?=.*[A-Z])\`\n`
        if (config.requireNumbers) output += `- Numbers: \`(?=.*\\d)\`\n`
        if (config.requireSpecialChars) {
          const escapedChars = config.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          output += `- Special chars: \`(?=.*[${escapedChars}])\`\n`
        }
        output += `- Length: \`.{${config.minLength},${config.maxLength}}\`\n`
        if (config.maxRepeatingChars > 0) {
          output += `- No repeating: \`(?!.*(.)\\1{${config.maxRepeatingChars - 1},})\`\n`
        }
        contentType = 'text/markdown'
        filename = 'password-regex.md'
        break
        
      case 'implementation-guide':
        output = generateImplementationGuide(policy, config)
        contentType = 'text/markdown'
        filename = 'implementation-guide.md'
        break
        
      default:
        output = generatePolicyDocument(policy, config)
        contentType = 'text/markdown'
        filename = 'password-policy.md'
    }
    
    const processingTime = performance.now() - startTime
    
    return {
      success: true,
      data: {
        output,
        policy,
        regexPattern: generateRegexPattern(config),
        filename,
        contentType,
        stats: {
          policyType: config.policyType,
          complianceStandards: config.complianceStandards.length,
          outputFormat: config.outputFormat,
          minLength: config.minLength,
          maxLength: config.maxLength,
          complexityRequirements: [
            config.requireUppercase && 'Uppercase',
            config.requireLowercase && 'Lowercase', 
            config.requireNumbers && 'Numbers',
            config.requireSpecialChars && 'Special Characters'
          ].filter(Boolean).length
        }
      },
      processing_time: Math.round(processingTime)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password policy generation failed'
    }
  }
}

const examples: ToolExample[] = [
  {
    title: 'Corporate Password Policy',
    input: 'Corporate environment with NIST compliance, 12-char minimum',
    output: 'Complete password policy document with implementation guidelines'
  },
  {
    title: 'Healthcare HIPAA Policy',
    input: 'Healthcare setting with HIPAA requirements and PHI protection',
    output: 'HIPAA-compliant password policy with medical workflow considerations'
  },
  {
    title: 'Banking Security Policy',
    input: 'Financial institution with PCI-DSS and SOX compliance',
    output: 'High-security banking password policy with fraud prevention'
  },
  {
    title: 'Custom Regex Generation',
    input: 'Custom requirements: 14+ chars, all complexity, no repeating',
    output: 'Regular expression pattern for password validation implementation'
  }
]

export const PASSWORD_POLICY_GENERATOR_TOOL: Tool = {
  id: 'password-policy-generator',
  name: 'Password Policy Generator',
  description: 'Generate comprehensive password policies with compliance standards, validation rules, and implementation guides for different organizational needs',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!.subcategories!.find(sub => sub.id === 'passwords')!,
  slug: 'password-policy-generator',
  icon: '🔐',
  keywords: ['password', 'policy', 'security', 'compliance', 'validation', 'NIST', 'HIPAA', 'PCI-DSS'],
  seoTitle: 'Password Policy Generator - Create Secure Password Policies with Compliance Standards',
  seoDescription: 'Generate comprehensive password policies with industry compliance standards like NIST, HIPAA, PCI-DSS. Create validation rules and implementation guides for organizational security.',
  examples,
  relatedTools: ['password-generator', 'password-strength-checker', 'regex-tester', 'encryption-tool'],
  useCases: [
    'Creating organization-wide password policies',
    'Ensuring compliance with industry standards (NIST, HIPAA, PCI-DSS)',
    'Generating validation rules for applications',
    'Implementing security best practices across systems',
    'Documenting password requirements for audits'
  ],
  commonErrors: [
    'Password policy too restrictive causing user frustration',
    'Missing compliance requirements for industry standards',
    'Inadequate password complexity validation',
    'Password policies not enforced across all systems'
  ],
  faq: [
    {
      question: 'What compliance standards are supported?',
      answer: 'The tool supports NIST, ISO27001, SOX, HIPAA, PCI-DSS, GDPR, FISMA, and other major compliance frameworks with pre-configured templates for different industries.'
    },
    {
      question: 'Can I customize the policy requirements?',
      answer: 'Yes, you can fully customize length requirements, complexity rules, restrictions, lockout policies, and expiration settings while maintaining compliance with selected standards.'
    },
    {
      question: 'What output formats are available?',
      answer: 'Generate policy documents (Markdown), JSON configuration files, regex patterns for validation, and complete implementation guides with code examples.'
    },
    {
      question: 'How do I implement the generated policies?',
      answer: 'The tool provides implementation guides with code examples, database schemas, and platform-specific instructions for Active Directory, LDAP, and application integration.'
    }
  ]
}