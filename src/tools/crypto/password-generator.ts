import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface PasswordGeneratorConfig extends ToolConfig {
  length: number;
  count: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customCharacters: string;
  enforceRules: boolean;
}

export const PASSWORD_GENERATOR_TOOL: Tool = {
  id: 'password-generator',
  name: 'Password Generator',
  description: 'Generate secure, random passwords with customizable length, character sets, and security rules for accounts and applications.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!.subcategories!.find(sub => sub.id === 'passwords')!,
  slug: 'password-generator',
  icon: '🔐',
  keywords: ['password', 'generate', 'random', 'secure', 'strength', 'characters', 'symbols', 'security'],
  seoTitle: 'Free Password Generator Online - Generate Secure Random Passwords',
  seoDescription: 'Generate strong, secure passwords instantly. Free online password generator with customizable length, character sets, and security options. Privacy-first.',
  examples: [
    {
      title: 'Strong Password (12 chars)',
      input: 'Length: 12, All character types',
      output: 'K9#mN2$pX7@q',
      description: 'Secure password with mixed characters'
    },
    {
      title: 'Long Password (16 chars)',
      input: 'Length: 16, All character types',
      output: 'Hn8@kL2#vP9$wX3!',
      description: 'Extra secure password for sensitive accounts'
    },
    {
      title: 'Simple Password (8 chars)',
      input: 'Length: 8, Letters and numbers only',
      output: 'K9mN2pX7',
      description: 'Basic password without symbols'
    }
  ],
  useCases: [
    'Generate secure passwords for new accounts',
    'Create unique passwords for each service',
    'Replace weak or compromised passwords',
    'Generate API keys and tokens',
    'Create temporary passwords for sharing',
    'Generate secure passphrases for encryption'
  ],
  commonErrors: [
    'Using passwords that are too short (less than 8 characters)',
    'Not including mixed character types (upper, lower, numbers, symbols)',
    'Reusing the same password across multiple services',
    'Using predictable patterns or dictionary words',
    'Storing passwords in plain text files',
    'Not excluding similar-looking characters when needed'
  ],
  faq: [
    {
      question: 'How long should my password be?',
      answer: 'Use at least 12 characters for most accounts, 16+ for sensitive accounts. Longer passwords are exponentially harder to crack.'
    },
    {
      question: 'Should I include symbols in my passwords?',
      answer: 'Yes, symbols significantly increase password strength. However, some systems don\'t allow certain symbols, so check requirements first.'
    },
    {
      question: 'What does "exclude similar characters" mean?',
      answer: 'This removes characters that look similar (like 0/O, 1/l/I) to prevent confusion when typing passwords manually.'
    },
    {
      question: 'How do I remember complex passwords?',
      answer: 'Use a password manager to store unique passwords securely. Don\'t try to memorize multiple complex passwords.'
    },
    {
      question: 'Is it safe to generate passwords online?',
      answer: 'This tool generates passwords entirely in your browser - no data is sent to servers. However, for maximum security, use offline tools for critical passwords.'
    }
  ],
  relatedTools: [
    'hash-generator',
    'uuid-generator',
    'base64-encoder',
    'text-case-converter',
    'random-string-generator'
  ]
};

export function processPasswordGeneration(input: string, config: PasswordGeneratorConfig): ToolResult {
  try {
    if (config.length < 1 || config.length > 256) {
      return {
        success: false,
        error: 'Password length must be between 1 and 256 characters.'
      };
    }

    if (config.count < 1 || config.count > 100) {
      return {
        success: false,
        error: 'Password count must be between 1 and 100.'
      };
    }

    const passwords = generatePasswords(config);
    const output = formatPasswordOutput(passwords, config);
    
    return {
      success: true,
      output,
      metadata: {
        passwordCount: config.count,
        passwordLength: config.length,
        characterSets: getEnabledCharacterSets(config),
        strengthEstimate: estimatePasswordStrength(config),
        totalCombinations: calculateCombinations(config)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate passwords'
    };
  }
}

function generatePasswords(config: PasswordGeneratorConfig): string[] {
  const characterSet = buildCharacterSet(config);
  
  if (characterSet.length === 0) {
    throw new Error('No character types selected. Please enable at least one character set.');
  }

  const passwords: string[] = [];
  
  for (let i = 0; i < config.count; i++) {
    let password = '';
    
    if (config.enforceRules) {
      password = generatePasswordWithRules(config, characterSet);
    } else {
      password = generateRandomPassword(config.length, characterSet);
    }
    
    passwords.push(password);
  }
  
  return passwords;
}

function buildCharacterSet(config: PasswordGeneratorConfig): string {
  let characterSet = '';
  
  // Define character sets
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Similar characters to exclude
  const similarChars = '0O1lI|';
  // Ambiguous characters that might be confusing
  const ambiguousChars = '{}[]()\/\\\'"`~,;.<>';
  
  if (config.includeUppercase) {
    characterSet += uppercase;
  }
  
  if (config.includeLowercase) {
    characterSet += lowercase;
  }
  
  if (config.includeNumbers) {
    characterSet += numbers;
  }
  
  if (config.includeSymbols) {
    characterSet += symbols;
  }
  
  // Add custom characters if provided
  if (config.customCharacters) {
    characterSet += config.customCharacters;
  }
  
  // Remove similar characters if requested
  if (config.excludeSimilar) {
    characterSet = characterSet.split('').filter(char => !similarChars.includes(char)).join('');
  }
  
  // Remove ambiguous characters if requested
  if (config.excludeAmbiguous) {
    characterSet = characterSet.split('').filter(char => !ambiguousChars.includes(char)).join('');
  }
  
  // Remove duplicates
  characterSet = [...new Set(characterSet)].join('');
  
  return characterSet;
}

function generateRandomPassword(length: number, characterSet: string): string {
  let password = '';
  
  // Use crypto.getRandomValues for cryptographically secure random numbers
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = array[i] % characterSet.length;
    password += characterSet[randomIndex];
  }
  
  return password;
}

function generatePasswordWithRules(config: PasswordGeneratorConfig, characterSet: string): string {
  // Ensure at least one character from each enabled set
  let password = '';
  const requiredChars: string[] = [];
  
  if (config.includeUppercase) {
    const uppers = characterSet.match(/[A-Z]/g) || [];
    if (uppers.length > 0) {
      requiredChars.push(uppers[Math.floor(Math.random() * uppers.length)]);
    }
  }
  
  if (config.includeLowercase) {
    const lowers = characterSet.match(/[a-z]/g) || [];
    if (lowers.length > 0) {
      requiredChars.push(lowers[Math.floor(Math.random() * lowers.length)]);
    }
  }
  
  if (config.includeNumbers) {
    const nums = characterSet.match(/[0-9]/g) || [];
    if (nums.length > 0) {
      requiredChars.push(nums[Math.floor(Math.random() * nums.length)]);
    }
  }
  
  if (config.includeSymbols) {
    const syms = characterSet.match(/[^A-Za-z0-9]/g) || [];
    if (syms.length > 0) {
      requiredChars.push(syms[Math.floor(Math.random() * syms.length)]);
    }
  }
  
  // Add required characters first
  password = requiredChars.join('');
  
  // Fill remaining length with random characters
  const remainingLength = config.length - password.length;
  if (remainingLength > 0) {
    password += generateRandomPassword(remainingLength, characterSet);
  }
  
  // Shuffle the password to avoid predictable patterns
  return shuffleString(password);
}

function shuffleString(str: string): string {
  const array = str.split('');
  
  // Fisher-Yates shuffle algorithm with crypto random
  for (let i = array.length - 1; i > 0; i--) {
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const j = randomBytes[0] % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array.join('');
}

function getEnabledCharacterSets(config: PasswordGeneratorConfig): string[] {
  const sets: string[] = [];
  
  if (config.includeUppercase) sets.push('Uppercase');
  if (config.includeLowercase) sets.push('Lowercase');
  if (config.includeNumbers) sets.push('Numbers');
  if (config.includeSymbols) sets.push('Symbols');
  if (config.customCharacters) sets.push('Custom');
  
  return sets;
}

function estimatePasswordStrength(config: PasswordGeneratorConfig): string {
  const characterSet = buildCharacterSet(config);
  const entropy = Math.log2(Math.pow(characterSet.length, config.length));
  
  if (entropy < 30) return 'Very Weak';
  if (entropy < 50) return 'Weak';
  if (entropy < 70) return 'Fair';
  if (entropy < 90) return 'Strong';
  return 'Very Strong';
}

function calculateCombinations(config: PasswordGeneratorConfig): string {
  const characterSet = buildCharacterSet(config);
  const combinations = Math.pow(characterSet.length, config.length);
  
  if (combinations > 1e15) {
    return (combinations / 1e15).toFixed(1) + ' quadrillion';
  } else if (combinations > 1e12) {
    return (combinations / 1e12).toFixed(1) + ' trillion';
  } else if (combinations > 1e9) {
    return (combinations / 1e9).toFixed(1) + ' billion';
  } else if (combinations > 1e6) {
    return (combinations / 1e6).toFixed(1) + ' million';
  } else if (combinations > 1e3) {
    return (combinations / 1e3).toFixed(1) + ' thousand';
  } else {
    return combinations.toFixed(0);
  }
}

function formatPasswordOutput(passwords: string[], config: PasswordGeneratorConfig): string {
  const lines: string[] = [];
  
  // Add passwords
  passwords.forEach((password, index) => {
    if (config.count > 1) {
      lines.push(`${index + 1}. ${password}`);
    } else {
      lines.push(password);
    }
  });
  
  // Add security information
  if (config.count <= 10) {
    lines.push('');
    lines.push('=== PASSWORD STRENGTH INFO ===');
    lines.push(`Length: ${config.length} characters`);
    lines.push(`Character sets: ${getEnabledCharacterSets(config).join(', ')}`);
    lines.push(`Estimated strength: ${estimatePasswordStrength(config)}`);
    lines.push(`Possible combinations: ${calculateCombinations(config)}`);
    
    if (config.excludeSimilar) {
      lines.push('✓ Similar characters excluded');
    }
    
    if (config.excludeAmbiguous) {
      lines.push('✓ Ambiguous characters excluded');
    }
    
    if (config.enforceRules) {
      lines.push('✓ Character diversity enforced');
    }
    
    lines.push('');
    lines.push('⚠️  Security Tips:');
    lines.push('• Use unique passwords for each account');
    lines.push('• Store passwords in a password manager');
    lines.push('• Enable two-factor authentication when available');
    lines.push('• Never share passwords via email or text');
  }
  
  return lines.join('\n');
}