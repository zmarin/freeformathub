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
  description: 'Generate cryptographically strong passwords with custom length, character sets, exclusion rules, entropy estimates, and bulk export — all processed locally.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!.subcategories!.find(sub => sub.id === 'passwords')!,
  slug: 'password-generator',
  icon: '🔐',
  keywords: ['password', 'generate', 'random', 'secure', 'strength', 'characters', 'symbols', 'security'],
  seoTitle: 'Free Password Generator Online - Generate Secure Random Passwords',
  seoDescription: 'Create secure passwords instantly. Choose length, character sets, exclusion rules, entropy targets, and export-ready lists — private, client-side generation.',
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
  ],
  howItWorks: [
    {
      title: 'Set Security Requirements',
      icon: '🧩',
      description: 'Choose password length, quantity, and which character sets to include. Toggle options to exclude similar or ambiguous characters and add custom sets when policies demand them.',
      keywords: ['password length', 'character sets', 'exclude similar', 'custom characters', 'compliance']
    },
    {
      title: 'Enforce Complexity Rules',
      icon: '⚙️',
      description: 'Enable rule enforcement to guarantee that each password contains uppercase, lowercase, numbers, and symbols as required by corporate policies.',
      keywords: ['complexity rules', 'uppercase requirement', 'symbol requirement', 'policy compliance', 'strong passwords']
    },
    {
      title: 'Generate & Inspect Strength',
      icon: '🔐',
      description: 'Passwords are generated with secure randomness in the browser. View entropy estimates, total combination counts, and configuration snapshots to document strength.',
      keywords: ['entropy estimate', 'secure random', 'password strength', 'combinations', 'security report']
    },
    {
      title: 'Export & Store Safely',
      icon: '📤',
      description: 'Copy passwords, download lists, or log runs in tool history for auditing. Pair with a password manager to store and share credentials securely.',
      keywords: ['copy passwords', 'download list', 'tool history', 'password manager', 'secure storage']
    }
  ],
  problemsSolved: [
    {
      problem: 'Manually crafting strong passwords wastes time and often results in weak or reused credentials.',
      solution: 'Generate dozens of unique, high-entropy passwords in seconds with flexible length controls so every account stays unique.',
      icon: '⚡',
      keywords: ['password automation', 'unique passwords', 'high entropy', 'security hygiene', 'productivity']
    },
    {
      problem: 'Security policies forbid similar or ambiguous characters, yet many generators offer no way to exclude them.',
      solution: 'Toggle exclusions for lookalike and ambiguous characters to produce user-friendly passwords that still meet strength requirements.',
      icon: '✅',
      keywords: ['policy compliance', 'exclude ambiguous', 'user friendly', 'password policy', 'accessibility']
    },
    {
      problem: 'Teams need auditable evidence that generated passwords meet entropy targets for audits and compliance.',
      solution: 'Entropy estimates, combination counts, and configuration snapshots accompany each run for easy export into audit logs or ticketing systems.',
      icon: '📊',
      keywords: ['entropy reporting', 'audit trail', 'compliance', 'security documentation', 'password strength']
    }
  ],
  whyChoose: [
    {
      title: 'Local-Only Generation',
      description: 'All randomness is produced client-side, so sensitive credentials never leave your device — critical for regulated environments.',
      icon: '🔒',
      keywords: ['client-side', 'secure generator', 'no upload', 'regulated industries']
    },
    {
      title: 'Enterprise Flexibility',
      description: 'Custom character sets, rule enforcement, and bulk output support the password policies of SaaS platforms, IT teams, and MSPs.',
      icon: '🏢',
      keywords: ['enterprise password', 'bulk generation', 'custom sets', 'managed services']
    },
    {
      title: 'Actionable Metrics',
      description: 'Strength estimations, combination math, and configuration summaries help security teams justify policy changes and educate stakeholders.',
      icon: '📈',
      keywords: ['strength metrics', 'combination math', 'security education', 'policy insight']
    },
    {
      title: 'Productivity-Focused UX',
      description: 'Keyboard shortcuts, auto-processing, copy/download buttons, and stored history streamline onboarding and credential rotations.',
      icon: '🧑‍💻',
      keywords: ['keyboard shortcuts', 'auto generate', 'copy password', 'credential rotation', 'onboarding']
    }
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
