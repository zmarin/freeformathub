import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface CreditCardValidatorConfig {
  strictMode: boolean;
  allowSpaces: boolean;
  allowDashes: boolean;
  validateLuhn: boolean;
  checkExpiry: boolean;
  requireCVV: boolean;
  showCardDetails: boolean;
  maskNumber: boolean;
  validateBIN: boolean;
  checkLength: boolean;
  allowTestCards: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  validation?: CardValidation;
  cardInfo?: CardInfo;
  warnings?: string[];
}

interface CardValidation {
  isValid: boolean;
  cardType: string;
  brand: string;
  luhnValid: boolean;
  lengthValid: boolean;
  formatValid: boolean;
  expiryValid?: boolean;
  cvvValid?: boolean;
  binValid?: boolean;
  isTestCard: boolean;
}

interface CardInfo {
  maskedNumber: string;
  cardType: string;
  brand: string;
  length: number;
  issuer: string;
  country: string;
  binRange: string;
  category: string;
  level: string;
  currency: string[];
}

// Card brand patterns and info
const CARD_PATTERNS = {
  visa: {
    pattern: /^4[0-9]{12}(?:[0-9]{3})?$/,
    lengths: [13, 16, 19],
    cvvLength: 3,
    name: 'Visa',
    color: '#1A1F71',
    prefix: ['4'],
  },
  mastercard: {
    pattern: /^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/,
    lengths: [16],
    cvvLength: 3,
    name: 'Mastercard',
    color: '#EB001B',
    prefix: ['51', '52', '53', '54', '55', '2221-2720'],
  },
  amex: {
    pattern: /^3[47][0-9]{13}$/,
    lengths: [15],
    cvvLength: 4,
    name: 'American Express',
    color: '#006FCF',
    prefix: ['34', '37'],
  },
  discover: {
    pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    lengths: [16],
    cvvLength: 3,
    name: 'Discover',
    color: '#FF6000',
    prefix: ['6011', '622126-622925', '644-649', '65'],
  },
  jcb: {
    pattern: /^(?:2131|1800|35\d{3})\d{11}$/,
    lengths: [16],
    cvvLength: 3,
    name: 'JCB',
    color: '#006C44',
    prefix: ['35', '2131', '1800'],
  },
  dinersclub: {
    pattern: /^3[0689][0-9]{12,15}$/,
    lengths: [14, 16, 17, 18, 19],
    cvvLength: 3,
    name: 'Diners Club',
    color: '#0079BE',
    prefix: ['300-305', '36', '38', '54', '55'],
  },
  unionpay: {
    pattern: /^(62[0-9]{14,17})$/,
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    name: 'UnionPay',
    color: '#E21836',
    prefix: ['62'],
  },
  maestro: {
    pattern: /^(?:5[0678]\d\d|6304|6390|67\d\d)\d{8,15}$/,
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    cvvLength: 3,
    name: 'Maestro',
    color: '#6C6BBD',
    prefix: ['5018', '5020', '5038', '6304', '6759', '6761', '6763'],
  },
};

// Test card numbers for various brands
const TEST_CARDS = {
  visa: [
    '4111111111111111',
    '4012888888881881',
    '4222222222222',
  ],
  mastercard: [
    '5555555555554444',
    '5105105105105100',
    '2223003122003222',
  ],
  amex: [
    '378282246310005',
    '371449635398431',
    '378734493671000',
  ],
  discover: [
    '6011111111111117',
    '6011000990139424',
  ],
  jcb: [
    '3530111333300000',
    '3566002020360505',
  ],
  dinersclub: [
    '30569309025904',
    '38520000023237',
  ],
};

// BIN (Bank Identification Number) ranges for major issuers
const BIN_RANGES: Record<string, any> = {
  'Chase': { ranges: ['414720', '424631', '453974'], country: 'US' },
  'Bank of America': { ranges: ['450875', '485910', '542418'], country: 'US' },
  'Wells Fargo': { ranges: ['414937', '451377', '485493'], country: 'US' },
  'Citi': { ranges: ['424750', '479164', '542943'], country: 'US' },
  'Capital One': { ranges: ['414755', '424631', '479164'], country: 'US' },
};

function cleanCardNumber(cardNumber: string, allowSpaces: boolean, allowDashes: boolean): string {
  let cleaned = cardNumber.replace(/\s/g, allowSpaces ? ' ' : '');
  cleaned = cleaned.replace(/-/g, allowDashes ? '-' : '');
  return cleaned.replace(/[^0-9\s-]/g, '');
}

function normalizeCardNumber(cardNumber: string): string {
  return cardNumber.replace(/[\s-]/g, '');
}

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.split('').map(Number).reverse();
  let sum = 0;
  
  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  return sum % 10 === 0;
}

function detectCardType(cardNumber: string): { type: string; brand: any } | null {
  const normalized = normalizeCardNumber(cardNumber);
  
  for (const [type, info] of Object.entries(CARD_PATTERNS)) {
    if (info.pattern.test(normalized)) {
      return { type, brand: info };
    }
  }
  
  return null;
}

function isTestCard(cardNumber: string): boolean {
  const normalized = normalizeCardNumber(cardNumber);
  
  for (const testCards of Object.values(TEST_CARDS)) {
    if (testCards.includes(normalized)) {
      return true;
    }
  }
  
  return false;
}

function validateLength(cardNumber: string, expectedLengths: number[]): boolean {
  const normalized = normalizeCardNumber(cardNumber);
  return expectedLengths.includes(normalized.length);
}

function validateExpiry(expiry: string): boolean {
  if (!expiry) return false;
  
  const cleaned = expiry.replace(/[^\d\/]/g, '');
  const parts = cleaned.split('/');
  
  if (parts.length !== 2) return false;
  
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  
  if (month < 1 || month > 12) return false;
  
  // Handle 2-digit years
  const currentYear = new Date().getFullYear();
  const fullYear = year < 100 ? 2000 + year : year;
  const currentMonth = new Date().getMonth() + 1;
  
  if (fullYear < currentYear) return false;
  if (fullYear === currentYear && month < currentMonth) return false;
  
  return true;
}

function validateCVV(cvv: string, expectedLength: number): boolean {
  if (!cvv) return false;
  const cleaned = cvv.replace(/\D/g, '');
  return cleaned.length === expectedLength;
}

function maskCardNumber(cardNumber: string, showLast: number = 4): string {
  const normalized = normalizeCardNumber(cardNumber);
  if (normalized.length <= showLast) return normalized;
  
  const masked = '*'.repeat(normalized.length - showLast) + normalized.slice(-showLast);
  
  // Format with spaces for readability
  return masked.replace(/(.{4})/g, '$1 ').trim();
}

function getBINInfo(cardNumber: string): any {
  const normalized = normalizeCardNumber(cardNumber);
  const bin = normalized.substring(0, 6);
  
  for (const [issuer, info] of Object.entries(BIN_RANGES)) {
    for (const range of info.ranges) {
      if (bin.startsWith(range)) {
        return {
          issuer,
          country: info.country,
          binRange: range,
        };
      }
    }
  }
  
  return {
    issuer: 'Unknown',
    country: 'Unknown',
    binRange: bin,
  };
}

function formatCardNumber(cardNumber: string, cardType: string): string {
  const normalized = normalizeCardNumber(cardNumber);
  
  switch (cardType) {
    case 'amex':
      return normalized.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    case 'dinersclub':
      if (normalized.length === 14) {
        return normalized.replace(/(\d{4})(\d{6})(\d{4})/, '$1 $2 $3');
      }
      return normalized.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    default:
      return normalized.replace(/(\d{4})/g, '$1 ').trim();
  }
}

export function processCreditCardValidator(
  input: string,
  config: CreditCardValidatorConfig,
  expiry?: string,
  cvv?: string
): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Credit card number is required'
      };
    }
    
    const cardNumber = cleanCardNumber(input, config.allowSpaces, config.allowDashes);
    const normalized = normalizeCardNumber(cardNumber);
    const warnings: string[] = [];
    
    // Basic format validation
    if (!/^\d+$/.test(normalized)) {
      return {
        success: false,
        error: 'Card number must contain only digits'
      };
    }
    
    if (normalized.length < 8 || normalized.length > 19) {
      return {
        success: false,
        error: 'Card number must be between 8 and 19 digits'
      };
    }
    
    // Detect card type
    const cardTypeInfo = detectCardType(cardNumber);
    const cardType = cardTypeInfo?.type || 'unknown';
    const brand = cardTypeInfo?.brand || { name: 'Unknown', cvvLength: 3, lengths: [], color: '#666666' };
    
    // Validate Luhn algorithm
    const luhnValid = config.validateLuhn ? luhnCheck(normalized) : true;
    
    // Validate length
    const lengthValid = config.checkLength && brand.lengths.length > 0 
      ? validateLength(cardNumber, brand.lengths) 
      : true;
    
    // Check if it's a test card
    const isTestCardFlag = isTestCard(cardNumber);
    
    if (isTestCardFlag && !config.allowTestCards) {
      warnings.push('This appears to be a test card number');
    }
    
    // Validate expiry if provided
    let expiryValid: boolean | undefined;
    if (config.checkExpiry && expiry) {
      expiryValid = validateExpiry(expiry);
    }
    
    // Validate CVV if provided
    let cvvValid: boolean | undefined;
    if (config.requireCVV && cvv) {
      cvvValid = validateCVV(cvv, brand.cvvLength);
    }
    
    // Get BIN information
    const binInfo = config.validateBIN ? getBINInfo(cardNumber) : null;
    
    // Overall validation
    const formatValid = cardType !== 'unknown';
    const isValid = formatValid && luhnValid && lengthValid && 
                   (expiryValid !== false) && (cvvValid !== false);
    
    // Create validation result
    const validation: CardValidation = {
      isValid,
      cardType,
      brand: brand.name,
      luhnValid,
      lengthValid,
      formatValid,
      expiryValid,
      cvvValid,
      binValid: binInfo ? binInfo.issuer !== 'Unknown' : undefined,
      isTestCard: isTestCardFlag,
    };
    
    // Create card info
    const cardInfo: CardInfo = {
      maskedNumber: config.maskNumber ? maskCardNumber(cardNumber) : formatCardNumber(cardNumber, cardType),
      cardType,
      brand: brand.name,
      length: normalized.length,
      issuer: binInfo?.issuer || 'Unknown',
      country: binInfo?.country || 'Unknown',
      binRange: binInfo?.binRange || normalized.substring(0, 6),
      category: isTestCardFlag ? 'Test Card' : 'Live Card',
      level: 'Standard', // Could be enhanced with more BIN data
      currency: ['USD'], // Default, could be enhanced
    };
    
    // Generate output
    let output = `Credit Card Validation Result\n`;
    output += `${'='.repeat(35)}\n\n`;
    output += `Card Number: ${cardInfo.maskedNumber}\n`;
    output += `Brand: ${validation.brand}\n`;
    output += `Type: ${cardType.toUpperCase()}\n`;
    output += `Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
    
    output += `Validation Details:\n`;
    output += `• Format: ${validation.formatValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Luhn Check: ${validation.luhnValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Length: ${validation.lengthValid ? '✅ Valid' : '❌ Invalid'} (${cardInfo.length} digits)\n`;
    
    if (validation.expiryValid !== undefined) {
      output += `• Expiry: ${validation.expiryValid ? '✅ Valid' : '❌ Invalid'}\n`;
    }
    
    if (validation.cvvValid !== undefined) {
      output += `• CVV: ${validation.cvvValid ? '✅ Valid' : '❌ Invalid'}\n`;
    }
    
    if (config.showCardDetails) {
      output += `\nCard Details:\n`;
      output += `• Issuer: ${cardInfo.issuer}\n`;
      output += `• Country: ${cardInfo.country}\n`;
      output += `• BIN Range: ${cardInfo.binRange}\n`;
      output += `• Category: ${cardInfo.category}\n`;
      
      if (isTestCardFlag) {
        output += `• ⚠️ Test Card Detected\n`;
      }
    }
    
    // Add warnings for common issues
    if (!validation.luhnValid) {
      warnings.push('Card number fails Luhn algorithm check');
    }
    
    if (!validation.lengthValid && brand.lengths.length > 0) {
      warnings.push(`Invalid length for ${brand.name} (expected: ${brand.lengths.join(' or ')} digits)`);
    }
    
    if (config.strictMode && !validation.isValid) {
      warnings.push('Strict mode enabled - all validations must pass');
    }
    
    return {
      success: true,
      output,
      validation,
      cardInfo,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const CREDIT_CARD_VALIDATOR_TOOL: Tool = {
  id: 'credit-card-validator',
  name: 'Credit Card Validator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!.subcategories!.find(sub => sub.id === 'financial-validation')!,
  slug: 'credit-card-validator',
  icon: '💳',
  keywords: ['credit', 'card', 'validate', 'luhn', 'visa', 'mastercard', 'amex', 'payment', 'bin'],
  seoTitle: 'Credit Card Validator - Validate Card Numbers & Check Luhn Algorithm | FreeFormatHub',
  seoDescription: 'Validate credit card numbers using Luhn algorithm, detect card brands (Visa, Mastercard, AmEx), and verify card details securely.',
  description: 'Validate credit card numbers using industry-standard algorithms, detect card brands, verify expiry dates, and check BIN information.',

  examples: [
    {
      title: 'Visa Card Validation',
      input: '4111 1111 1111 1111',
      output: `Credit Card Validation Result
===================================

Card Number: 4111 1111 1111 1111
Brand: Visa
Type: VISA
Status: ✅ VALID

Validation Details:
• Format: ✅ Valid
• Luhn Check: ✅ Valid
• Length: ✅ Valid (16 digits)`,
      description: 'Validate a Visa credit card number'
    },
    {
      title: 'Mastercard with Details',
      input: '5555555555554444',
      output: `Credit Card Validation Result
===================================

Card Number: **** **** **** 4444
Brand: Mastercard
Type: MASTERCARD
Status: ✅ VALID

Card Details:
• Issuer: Unknown
• Country: Unknown
• Category: Test Card`,
      description: 'Validate Mastercard with masked number and details'
    },
    {
      title: 'American Express',
      input: '378282246310005',
      output: `Credit Card Validation Result
===================================

Card Number: 3782 822463 10005
Brand: American Express
Type: AMEX
Status: ✅ VALID

Validation Details:
• Format: ✅ Valid
• Luhn Check: ✅ Valid
• Length: ✅ Valid (15 digits)`,
      description: 'Validate AmEx card with proper 15-digit formatting'
    }
  ],

  useCases: [
    'Validating credit card numbers in e-commerce applications',
    'Detecting card brand for payment processing integration',
    'Implementing client-side card validation for better UX',
    'Testing payment forms with various card number formats',
    'Verifying card details before API submission',
    'Building PCI-compliant card validation systems',
    'Educational purposes for understanding card number structure',
    'Debugging payment integration issues'
  ],

  faq: [
    {
      question: 'How does the Luhn algorithm work?',
      answer: 'The Luhn algorithm validates card numbers using a checksum formula. Starting from the right, every second digit is doubled. If the result is greater than 9, subtract 9. Sum all digits - if divisible by 10, the number is valid.'
    },
    {
      question: 'Are test card numbers safe to use?',
      answer: 'Yes, test card numbers are specifically designed for testing and will never be charged. They pass validation but are not connected to real accounts. Always use test cards for development.'
    },
    {
      question: 'What card brands are supported?',
      answer: 'Supports Visa, Mastercard, American Express, Discover, JCB, Diners Club, UnionPay, and Maestro with their specific formatting and validation rules.'
    },
    {
      question: 'Does this tool store card information?',
      answer: 'No, all validation happens client-side in your browser. No card information is transmitted to servers or stored anywhere. The tool is designed for privacy and security.'
    },
    {
      question: 'Can I validate expiry dates and CVV codes?',
      answer: 'Yes, the tool can validate expiry dates (MM/YY or MM/YYYY format) and CVV codes (3-4 digits depending on card type) when provided as additional inputs.'
    }
  ],

  commonErrors: [
    'Invalid card number format or non-numeric characters',
    'Card number fails Luhn algorithm validation',
    'Incorrect card number length for the detected brand',
    'Expired or invalid expiry date format',
    'CVV code length mismatch for card type'
  ],

  relatedTools: ['luhn-calculator', 'payment-validator', 'bin-checker', 'number-formatter', 'data-validator']
};