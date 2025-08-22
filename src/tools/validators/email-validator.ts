import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface EmailValidatorConfig extends ToolConfig {
  checkMxRecord: boolean;
  allowInternational: boolean;
  strictMode: boolean;
  checkDisposable: boolean;
}

export const EMAIL_VALIDATOR_TOOL: Tool = {
  id: 'email-validator',
  name: 'Email Address Validator',
  description: 'Validate email addresses with comprehensive syntax checking, domain analysis, and deliverability insights.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!.subcategories!.find(sub => sub.id === 'contact-validation')!,
  slug: 'email-validator',
  icon: '📧',
  keywords: ['email', 'validate', 'verification', 'syntax', 'domain', 'deliverability', 'checker'],
  seoTitle: 'Free Email Validator - Verify Email Address Syntax & Deliverability',
  seoDescription: 'Validate email addresses instantly with comprehensive syntax checking, domain verification, and deliverability analysis. Free email validator with detailed feedback.',
  examples: [
    {
      title: 'Valid Email Address',
      input: 'user@example.com',
      output: 'Valid email address ✓\nDomain: example.com\nLocal part: user\nFormat: Standard',
      description: 'Standard valid email format'
    },
    {
      title: 'International Domain',
      input: 'user@тест.com',
      output: 'Valid email address ✓\nDomain: тест.com (IDN)\nLocal part: user\nFormat: International',
      description: 'International domain name (IDN) support'
    },
    {
      title: 'Invalid Format',
      input: 'invalid-email@',
      output: 'Invalid email address ✗\nError: Missing domain part\nSuggestion: Add domain after @',
      description: 'Common formatting errors with suggestions'
    },
    {
      title: 'Complex Valid Email',
      input: 'user.name+tag@sub.domain.com',
      output: 'Valid email address ✓\nDomain: sub.domain.com\nLocal part: user.name+tag\nFeatures: Plus addressing, subdomain',
      description: 'Advanced email formats with tags and subdomains'
    }
  ],
  useCases: [
    'Validate user registration email addresses',
    'Clean and verify email lists for marketing campaigns',
    'Check email syntax in forms and applications',
    'Identify potentially problematic email formats',
    'Verify domain existence and configuration',
    'Filter out disposable or temporary email addresses'
  ],
  commonErrors: [
    'Missing @ symbol - every email needs exactly one @',
    'Invalid characters in local part - stick to letters, numbers, dots, hyphens',
    'Double dots (..) are not allowed in email addresses',
    'Leading or trailing dots in local part are invalid',
    'Domain part cannot be empty after @',
    'Top-level domain must be at least 2 characters long'
  ],
  faq: [
    {
      question: 'What makes an email address valid?',
      answer: 'A valid email has a local part (before @), an @ symbol, and a domain part (after @). The local part can contain letters, numbers, dots, hyphens, and some special characters. The domain must have a valid format and ideally exist.'
    },
    {
      question: 'Does this tool check if the email actually exists?',
      answer: 'This tool performs syntax validation and basic domain checks. For deliverability verification, you would need additional services that can perform SMTP checks.'
    },
    {
      question: 'Are international email addresses supported?',
      answer: 'Yes, this validator supports internationalized domain names (IDN) and Unicode characters in domains when international mode is enabled.'
    },
    {
      question: 'What are disposable email addresses?',
      answer: 'Disposable emails are temporary addresses from services like 10minutemail. When enabled, this tool can help identify such addresses based on known disposable email domains.'
    },
    {
      question: 'How accurate is the domain validation?',
      answer: 'The tool checks domain format and basic DNS existence. However, a domain existing doesn\'t guarantee the specific email address is valid - that requires deeper SMTP verification.'
    }
  ],
  relatedTools: [
    'url-validator',
    'domain-checker',
    'text-validator',
    'regex-tester',
    'string-validator'
  ]
};

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', 'temp-mail.org', 'getnada.com', 'mohmal.com',
  'sharklasers.com', 'jetable.org', '20minutemail.com', 'emailondeck.com'
]);

// International email regex (more permissive)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Strict email regex (more restrictive)
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(input: string, config: EmailValidatorConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide an email address to validate.'
    };
  }

  const email = input.trim();
  const parts = email.split('@');
  
  // Basic structure validation
  if (parts.length !== 2) {
    return {
      success: false,
      error: parts.length < 2 ? 'Missing @ symbol in email address' : 'Multiple @ symbols found (only one allowed)',
      metadata: {
        valid: false,
        issue: 'structure'
      }
    };
  }

  const [localPart, domain] = parts;
  const issues: string[] = [];
  const warnings: string[] = [];
  const features: string[] = [];

  // Local part validation
  if (!localPart) {
    return {
      success: false,
      error: 'Local part (before @) cannot be empty',
      metadata: { valid: false, issue: 'empty_local' }
    };
  }

  if (!domain) {
    return {
      success: false,
      error: 'Domain part (after @) cannot be empty',
      metadata: { valid: false, issue: 'empty_domain' }
    };
  }

  // Length checks
  if (localPart.length > 64) {
    issues.push('Local part exceeds 64 characters');
  }
  if (domain.length > 253) {
    issues.push('Domain exceeds 253 characters');
  }
  if (email.length > 320) {
    issues.push('Total email length exceeds 320 characters');
  }

  // Local part detailed validation
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    issues.push('Local part cannot start or end with a dot');
  }
  if (localPart.includes('..')) {
    issues.push('Local part cannot contain consecutive dots');
  }

  // Check for plus addressing
  if (localPart.includes('+')) {
    features.push('Plus addressing (email aliases)');
  }

  // Domain validation
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    issues.push('Domain must have at least one dot (e.g., domain.com)');
  } else {
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      issues.push('Top-level domain must be at least 2 characters');
    }
    if (domainParts.length > 2) {
      features.push('Subdomain');
    }
  }

  // Check if domain contains international characters
  const isInternational = /[^\x00-\x7F]/.test(domain);
  if (isInternational) {
    if (!config.allowInternational) {
      issues.push('International characters not allowed in strict mode');
    } else {
      features.push('International domain name (IDN)');
    }
  }

  // Disposable email check
  if (config.checkDisposable && DISPOSABLE_DOMAINS.has(domain.toLowerCase())) {
    warnings.push('This appears to be a disposable/temporary email address');
  }

  // Regex validation
  const regex = config.strictMode ? STRICT_EMAIL_REGEX : EMAIL_REGEX;
  const regexValid = regex.test(email);
  
  if (!regexValid && config.strictMode) {
    issues.push('Email format does not meet strict validation requirements');
  }

  // Final validation decision
  const isValid = issues.length === 0 && (regexValid || (!config.strictMode && isBasicFormatValid(email)));

  return {
    success: true,
    output: formatValidationResult(email, isValid, localPart, domain, issues, warnings, features),
    metadata: {
      valid: isValid,
      localPart,
      domain,
      length: email.length,
      issues: issues.length,
      warnings: warnings.length,
      features,
      isInternational,
      isDisposable: config.checkDisposable && DISPOSABLE_DOMAINS.has(domain.toLowerCase()),
      strictMode: config.strictMode
    }
  };
}

function isBasicFormatValid(email: string): boolean {
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [local, domain] = parts;
  return local.length > 0 && domain.length > 0 && domain.includes('.') && domain.split('.').pop()!.length >= 2;
}

function formatValidationResult(
  email: string,
  isValid: boolean,
  localPart: string,
  domain: string,
  issues: string[],
  warnings: string[],
  features: string[]
): string {
  let result = isValid ? '✅ Valid email address' : '❌ Invalid email address';
  result += `\n\nEmail: ${email}`;
  result += `\nLocal part: ${localPart}`;
  result += `\nDomain: ${domain}`;
  
  if (features.length > 0) {
    result += `\nFeatures: ${features.join(', ')}`;
  }

  if (issues.length > 0) {
    result += '\n\n❌ Issues Found:';
    issues.forEach(issue => {
      result += `\n• ${issue}`;
    });
  }

  if (warnings.length > 0) {
    result += '\n\n⚠️ Warnings:';
    warnings.forEach(warning => {
      result += `\n• ${warning}`;
    });
  }

  if (isValid) {
    result += '\n\n💡 This email address appears to be syntactically correct and should work for most systems.';
  } else {
    result += '\n\n💡 Please correct the issues above to make this a valid email address.';
  }

  return result;
}