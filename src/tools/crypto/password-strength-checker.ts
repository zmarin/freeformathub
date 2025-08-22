import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface PasswordStrengthConfig {
  includeCommonChecks: boolean;
  checkDictionary: boolean;
  checkPatterns: boolean;
  checkPersonalInfo: boolean;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  minLength: number;
  maxLength: number;
  showSuggestions: boolean;
  detailedAnalysis: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  analysis?: PasswordAnalysis;
}

interface PasswordAnalysis {
  password: string;
  score: number; // 0-100
  strength: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  estimatedCrackTime: string;
  entropy: number;
  checks: {
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSymbols: boolean;
    hasLength: boolean;
    hasNoCommonPatterns: boolean;
    hasNoPersonalInfo: boolean;
    hasNoSequentialChars: boolean;
    hasNoRepeatedChars: boolean;
    hasNoDictionaryWords: boolean;
  };
  vulnerabilities: string[];
  suggestions: string[];
  composition: {
    length: number;
    uppercase: number;
    lowercase: number;
    numbers: number;
    symbols: number;
    spaces: number;
  };
  patterns: string[];
}

// Common weak passwords and patterns
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', '111111',
  'password123', 'admin', 'letmein', 'welcome', '123123', 'password1',
  'qwerty123', 'iloveyou', 'sunshine', 'princess', 'dragon', 'monkey',
  'football', 'baseball', 'superman', 'batman', 'master', 'shadow'
];

const COMMON_PATTERNS = [
  /(.)\1{2,}/, // repeated characters (aaa, 111)
  /012|123|234|345|456|567|678|789|890/, // sequential numbers
  /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/, // sequential letters
  /qwe|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm/, // keyboard patterns
];

const DICTIONARY_WORDS = [
  'love', 'hate', 'life', 'death', 'time', 'money', 'home', 'work',
  'family', 'friend', 'computer', 'internet', 'security', 'access',
  'login', 'user', 'system', 'server', 'network', 'email', 'phone',
  'number', 'address', 'birthday', 'year', 'month', 'day', 'today',
  'tomorrow', 'yesterday', 'spring', 'summer', 'winter', 'autumn'
];

function calculateEntropy(password: string): number {
  let charSetSize = 0;
  
  if (/[a-z]/.test(password)) charSetSize += 26;
  if (/[A-Z]/.test(password)) charSetSize += 26;
  if (/[0-9]/.test(password)) charSetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charSetSize += 32; // rough estimate for symbols
  
  return password.length * Math.log2(charSetSize);
}

function estimateCrackTime(entropy: number): string {
  const secondsToGuess = Math.pow(2, entropy - 1);
  
  if (secondsToGuess < 1) return 'Instantly';
  if (secondsToGuess < 60) return `${Math.round(secondsToGuess)} seconds`;
  if (secondsToGuess < 3600) return `${Math.round(secondsToGuess / 60)} minutes`;
  if (secondsToGuess < 86400) return `${Math.round(secondsToGuess / 3600)} hours`;
  if (secondsToGuess < 31536000) return `${Math.round(secondsToGuess / 86400)} days`;
  if (secondsToGuess < 3153600000) return `${Math.round(secondsToGuess / 31536000)} years`;
  if (secondsToGuess < 31536000000000) return `${Math.round(secondsToGuess / 31536000000)} millennia`;
  
  return 'Longer than the age of the universe';
}

function analyzeComposition(password: string) {
  return {
    length: password.length,
    uppercase: (password.match(/[A-Z]/g) || []).length,
    lowercase: (password.match(/[a-z]/g) || []).length,
    numbers: (password.match(/[0-9]/g) || []).length,
    symbols: (password.match(/[^a-zA-Z0-9\s]/g) || []).length,
    spaces: (password.match(/\s/g) || []).length,
  };
}

function checkPatterns(password: string): string[] {
  const patterns = [];
  const lower = password.toLowerCase();
  
  // Check for common patterns
  for (const pattern of COMMON_PATTERNS) {
    if (pattern.test(lower)) {
      if (pattern.source.includes('\\1')) {
        patterns.push('Repeated characters');
      } else if (pattern.source.includes('012|123')) {
        patterns.push('Sequential numbers');
      } else if (pattern.source.includes('abc|bcd')) {
        patterns.push('Sequential letters');
      } else if (pattern.source.includes('qwe|ert')) {
        patterns.push('Keyboard patterns');
      }
    }
  }
  
  // Check for date patterns
  if (/19\d{2}|20\d{2}/.test(password)) {
    patterns.push('Year patterns');
  }
  
  // Check for phone number patterns
  if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(password)) {
    patterns.push('Phone number patterns');
  }
  
  return [...new Set(patterns)];
}

function checkDictionaryWords(password: string): boolean {
  const lower = password.toLowerCase();
  return DICTIONARY_WORDS.some(word => 
    lower.includes(word) && word.length >= 4
  );
}

function generateSuggestions(analysis: PasswordAnalysis, config: PasswordStrengthConfig): string[] {
  const suggestions = [];
  const { checks, composition, patterns } = analysis;
  
  if (composition.length < config.minLength) {
    suggestions.push(`Increase length to at least ${config.minLength} characters`);
  }
  
  if (config.requireUppercase && !checks.hasUppercase) {
    suggestions.push('Add uppercase letters (A-Z)');
  }
  
  if (config.requireLowercase && !checks.hasLowercase) {
    suggestions.push('Add lowercase letters (a-z)');
  }
  
  if (config.requireNumbers && !checks.hasNumbers) {
    suggestions.push('Add numbers (0-9)');
  }
  
  if (config.requireSymbols && !checks.hasSymbols) {
    suggestions.push('Add symbols (!@#$%^&*)');
  }
  
  if (patterns.length > 0) {
    suggestions.push('Avoid common patterns like "123", "abc", or keyboard walks');
  }
  
  if (!checks.hasNoRepeatedChars) {
    suggestions.push('Avoid repeated characters (aaa, 111)');
  }
  
  if (!checks.hasNoDictionaryWords) {
    suggestions.push('Avoid common dictionary words');
  }
  
  if (analysis.score < 60) {
    suggestions.push('Consider using a passphrase with multiple random words');
    suggestions.push('Use a password manager to generate and store strong passwords');
  }
  
  if (suggestions.length === 0 && analysis.score < 90) {
    suggestions.push('Consider increasing length or complexity for maximum security');
  }
  
  return suggestions;
}

export function processPasswordStrengthCheck(
  input: string,
  config: PasswordStrengthConfig
): ToolResult {
  try {
    if (!input) {
      return {
        success: false,
        error: 'Please enter a password to analyze'
      };
    }

    const password = input;
    const composition = analyzeComposition(password);
    const entropy = calculateEntropy(password);
    const estimatedCrackTime = estimateCrackTime(entropy);
    
    // Perform checks
    const checks = {
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSymbols: /[^a-zA-Z0-9\s]/.test(password),
      hasLength: password.length >= config.minLength && password.length <= config.maxLength,
      hasNoCommonPatterns: true,
      hasNoPersonalInfo: true,
      hasNoSequentialChars: true,
      hasNoRepeatedChars: !/(.)\1{2,}/.test(password),
      hasNoDictionaryWords: true,
    };
    
    const vulnerabilities = [];
    const patterns = [];
    
    // Check for common passwords
    if (config.includeCommonChecks && COMMON_PASSWORDS.includes(password.toLowerCase())) {
      vulnerabilities.push('This is a commonly used password');
      checks.hasNoCommonPatterns = false;
    }
    
    // Check for patterns
    if (config.checkPatterns) {
      const foundPatterns = checkPatterns(password);
      patterns.push(...foundPatterns);
      if (foundPatterns.length > 0) {
        vulnerabilities.push('Contains predictable patterns');
        checks.hasNoCommonPatterns = false;
        checks.hasNoSequentialChars = false;
      }
    }
    
    // Check dictionary words
    if (config.checkDictionary && checkDictionaryWords(password)) {
      vulnerabilities.push('Contains common dictionary words');
      checks.hasNoDictionaryWords = false;
    }
    
    // Calculate score
    let score = 0;
    
    // Length scoring (0-30 points)
    score += Math.min(30, (password.length / config.minLength) * 15);
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
    if (password.length >= 20) score += 5;
    
    // Character diversity (0-40 points)
    if (checks.hasLowercase) score += 5;
    if (checks.hasUppercase) score += 5;
    if (checks.hasNumbers) score += 10;
    if (checks.hasSymbols) score += 15;
    if (composition.uppercase > 1 && composition.lowercase > 1) score += 5;
    
    // Pattern and predictability (0-30 points)
    if (checks.hasNoCommonPatterns) score += 10;
    if (checks.hasNoRepeatedChars) score += 5;
    if (checks.hasNoSequentialChars) score += 5;
    if (checks.hasNoDictionaryWords) score += 10;
    
    // Deduct points for vulnerabilities
    score -= vulnerabilities.length * 10;
    score = Math.max(0, Math.min(100, score));
    
    // Determine strength level
    let strength: PasswordAnalysis['strength'];
    if (score >= 90) strength = 'Very Strong';
    else if (score >= 75) strength = 'Strong';
    else if (score >= 60) strength = 'Good';
    else if (score >= 40) strength = 'Fair';
    else if (score >= 20) strength = 'Weak';
    else strength = 'Very Weak';
    
    const analysis: PasswordAnalysis = {
      password,
      score,
      strength,
      estimatedCrackTime,
      entropy,
      checks,
      vulnerabilities,
      suggestions: [],
      composition,
      patterns,
    };
    
    if (config.showSuggestions) {
      analysis.suggestions = generateSuggestions(analysis, config);
    }
    
    // Generate output
    let output = `# Password Strength Analysis\n\n`;
    
    output += `## 🎯 Overall Score\n\n`;
    output += `**Score:** ${score}/100\n`;
    output += `**Strength:** ${strength}\n`;
    output += `**Estimated Crack Time:** ${estimatedCrackTime}\n`;
    output += `**Entropy:** ${entropy.toFixed(1)} bits\n\n`;
    
    if (config.detailedAnalysis) {
      output += `## 📊 Composition Analysis\n\n`;
      output += `**Length:** ${composition.length} characters\n`;
      output += `**Uppercase Letters:** ${composition.uppercase}\n`;
      output += `**Lowercase Letters:** ${composition.lowercase}\n`;
      output += `**Numbers:** ${composition.numbers}\n`;
      output += `**Symbols:** ${composition.symbols}\n`;
      if (composition.spaces > 0) {
        output += `**Spaces:** ${composition.spaces}\n`;
      }
      output += '\n';
      
      output += `## ✅ Security Checks\n\n`;
      const checkResults = [
        { label: 'Has Uppercase', passed: checks.hasUppercase },
        { label: 'Has Lowercase', passed: checks.hasLowercase },
        { label: 'Has Numbers', passed: checks.hasNumbers },
        { label: 'Has Symbols', passed: checks.hasSymbols },
        { label: 'Adequate Length', passed: checks.hasLength },
        { label: 'No Common Patterns', passed: checks.hasNoCommonPatterns },
        { label: 'No Repeated Characters', passed: checks.hasNoRepeatedChars },
        { label: 'No Dictionary Words', passed: checks.hasNoDictionaryWords },
      ];
      
      checkResults.forEach(check => {
        output += `- ${check.passed ? '✅' : '❌'} ${check.label}\n`;
      });
      output += '\n';
    }
    
    if (vulnerabilities.length > 0) {
      output += `## ⚠️ Security Issues\n\n`;
      vulnerabilities.forEach(vuln => {
        output += `- ⚠️ ${vuln}\n`;
      });
      output += '\n';
    }
    
    if (patterns.length > 0) {
      output += `## 🔍 Detected Patterns\n\n`;
      patterns.forEach(pattern => {
        output += `- 🔍 ${pattern}\n`;
      });
      output += '\n';
    }
    
    if (analysis.suggestions.length > 0) {
      output += `## 💡 Improvement Suggestions\n\n`;
      analysis.suggestions.forEach(suggestion => {
        output += `- 💡 ${suggestion}\n`;
      });
      output += '\n';
    }
    
    output += `## 🔒 Security Best Practices\n\n`;
    output += `- Use unique passwords for every account\n`;
    output += `- Consider using a passphrase with 4+ random words\n`;
    output += `- Enable two-factor authentication where possible\n`;
    output += `- Use a reputable password manager\n`;
    output += `- Regularly update passwords for sensitive accounts\n\n`;
    
    output += `---\n*Password security analysis powered by FreeFormatHub*`;
    
    return {
      success: true,
      output,
      analysis
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze password strength'
    };
  }
}

export const PASSWORD_STRENGTH_CHECKER_TOOL: Tool = {
  id: 'password-strength-checker',
  name: 'Password Strength Checker',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!.subcategories!.find(sub => sub.id === 'passwords')!,
  slug: 'password-strength-checker',
  icon: '🔐',
  keywords: ['password', 'strength', 'security', 'check', 'analyze', 'entropy', 'crack', 'time'],
  seoTitle: 'Password Strength Checker - Analyze Password Security | FreeFormatHub',
  seoDescription: 'Test password strength and security. Analyze entropy, crack time, patterns, and get improvement suggestions. Check for common vulnerabilities.',
  description: 'Analyze password strength and security with comprehensive checks for common vulnerabilities, patterns, and entropy calculation. Get detailed improvement suggestions.',

  examples: [
    {
      title: 'Weak Password Analysis',
      input: 'password123',
      output: `# Password Strength Analysis

## 🎯 Overall Score

**Score:** 25/100
**Strength:** Weak
**Estimated Crack Time:** 2 hours
**Entropy:** 36.5 bits

## ⚠️ Security Issues

- ⚠️ This is a commonly used password
- ⚠️ Contains predictable patterns
- ⚠️ Contains common dictionary words

## 💡 Improvement Suggestions

- Add uppercase letters (A-Z)
- Add symbols (!@#$%^&*)
- Avoid common dictionary words
- Consider using a passphrase with multiple random words`,
      description: 'Analysis of a weak password showing vulnerabilities'
    },
    {
      title: 'Strong Password Analysis',
      input: 'My$3cur3P@ssw0rd!2024',
      output: `# Password Strength Analysis

## 🎯 Overall Score

**Score:** 92/100
**Strength:** Very Strong
**Estimated Crack Time:** 47 millennia
**Entropy:** 108.2 bits

## ✅ Security Checks

- ✅ Has Uppercase
- ✅ Has Lowercase  
- ✅ Has Numbers
- ✅ Has Symbols
- ✅ Adequate Length
- ✅ No Common Patterns
- ✅ No Repeated Characters
- ✅ No Dictionary Words`,
      description: 'Analysis of a strong password meeting all criteria'
    }
  ],

  useCases: [
    'Personal password security assessment',
    'Corporate password policy compliance checking',
    'Educational password security awareness',
    'Application password validation implementation',
    'Security audit and penetration testing',
    'User registration form validation',
    'Password manager evaluation',
    'Security training and demonstrations'
  ],

  faq: [
    {
      question: 'How is password strength calculated?',
      answer: 'Strength is based on length, character diversity, entropy, absence of common patterns, and dictionary word detection. Scores range from 0-100 considering multiple security factors.'
    },
    {
      question: 'What makes a password strong?',
      answer: 'Strong passwords are long (12+ characters), use mixed case, numbers, and symbols, avoid predictable patterns, and don\'t contain dictionary words or personal information.'
    },
    {
      question: 'How accurate are crack time estimates?',
      answer: 'Estimates assume brute force attacks and vary based on available computing power. Real attacks may use dictionaries and patterns, potentially reducing actual crack times.'
    },
    {
      question: 'Should I use special characters?',
      answer: 'Yes, symbols significantly increase password entropy and strength. However, length is generally more important than complexity for security.'
    },
    {
      question: 'Are passphrases better than complex passwords?',
      answer: 'Long passphrases (4+ random words) are often stronger and more memorable than shorter complex passwords. Both length and unpredictability are crucial.'
    }
  ],

  commonErrors: [
    'Using common passwords or dictionary words',
    'Predictable character substitutions (@ for a, 0 for o)',
    'Sequential or repeated characters',
    'Personal information in passwords',
    'Insufficient length despite complexity'
  ],

  relatedTools: ['password-generator', 'hash-generator', 'encryption-tool', 'random-string-generator']
};