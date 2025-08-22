import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface IbanValidatorConfig {
  validateCountry: boolean;
  validateLength: boolean;
  validateMod97: boolean;
  formatIban: boolean;
  allowSpaces: boolean;
  showBankDetails: boolean;
  strictMode: boolean;
  validateBIC: boolean;
  checkBlacklist: boolean;
  includeExample: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  validation?: IbanValidation;
  bankInfo?: BankInfo;
  warnings?: string[];
}

interface IbanValidation {
  isValid: boolean;
  country: string;
  countryName: string;
  bankCode: string;
  accountNumber: string;
  checkDigits: string;
  formatValid: boolean;
  lengthValid: boolean;
  mod97Valid: boolean;
  countrySupported: boolean;
}

interface BankInfo {
  country: string;
  countryName: string;
  bankCode: string;
  bankName?: string;
  bic?: string;
  domesticFormat?: string;
  sepaSupport: boolean;
  currency: string;
  example: string;
}

// IBAN country specifications
const IBAN_COUNTRIES: Record<string, any> = {
  AD: { name: 'Andorra', length: 24, format: 'AD kk bbbb cccc cccc cccc', example: 'AD1200012030200359100100' },
  AE: { name: 'UAE', length: 23, format: 'AE kk bbbb cccc cccc cccc c', example: 'AE070331234567890123456' },
  AL: { name: 'Albania', length: 28, format: 'AL kk bbbc cccc cccc cccc cccc cccc', example: 'AL47212110090000000235698741' },
  AT: { name: 'Austria', length: 20, format: 'AT kk bbbb cccc cccc cccc', example: 'AT611904300234573201' },
  AZ: { name: 'Azerbaijan', length: 28, format: 'AZ kk bbbb cccc cccc cccc cccc cccc', example: 'AZ21NABZ00000000137010001944' },
  BA: { name: 'Bosnia and Herzegovina', length: 20, format: 'BA kk bbbc cccc cccc cccc', example: 'BA391290079401028494' },
  BE: { name: 'Belgium', length: 16, format: 'BE kk bbbc cccc ccxx', example: 'BE68539007547034' },
  BG: { name: 'Bulgaria', length: 22, format: 'BG kk bbbb cccc cccc cccc cc', example: 'BG80BNBG96611020345678' },
  BH: { name: 'Bahrain', length: 22, format: 'BH kk bbbb cccc cccc cccc cc', example: 'BH67BMAG00001299123456' },
  BR: { name: 'Brazil', length: 29, format: 'BR kk bbbb bbbb cccc cccc cccc cccc c', example: 'BR9700360305000010009795493P1' },
  BY: { name: 'Belarus', length: 28, format: 'BY kk bbbb aaaa cccc cccc cccc cccc', example: 'BY13NBRB3600900000002Z00AB00' },
  CH: { name: 'Switzerland', length: 21, format: 'CH kk bbbb cccc cccc cccc c', example: 'CH9300762011623852957' },
  CR: { name: 'Costa Rica', length: 22, format: 'CR kk bbbb cccc cccc cccc cc', example: 'CR72012300000171549015' },
  CY: { name: 'Cyprus', length: 28, format: 'CY kk bbbc cccc cccc cccc cccc cccc', example: 'CY17002001280000001200527600' },
  CZ: { name: 'Czech Republic', length: 24, format: 'CZ kk bbbb cccc cccc cccc cccc', example: 'CZ6508000000192000145399' },
  DE: { name: 'Germany', length: 22, format: 'DE kk bbbb bbbb cccc cccc cc', example: 'DE89370400440532013000' },
  DK: { name: 'Denmark', length: 18, format: 'DK kk bbbb cccc cccc cc', example: 'DK5000400440116243' },
  DO: { name: 'Dominican Republic', length: 28, format: 'DO kk bbbb cccc cccc cccc cccc cccc', example: 'DO28BAGR00000001212453611324' },
  EE: { name: 'Estonia', length: 20, format: 'EE kk bbcc cccc cccc cccx', example: 'EE382200221020145685' },
  EG: { name: 'Egypt', length: 29, format: 'EG kk bbbb cccc cccc cccc cccc cccc c', example: 'EG380019000500000000263180002' },
  ES: { name: 'Spain', length: 24, format: 'ES kk bbbb gggg xxcc cccc cccc', example: 'ES9121000418450200051332' },
  FI: { name: 'Finland', length: 18, format: 'FI kk bbbb bbcc cccc cx', example: 'FI2112345600000785' },
  FO: { name: 'Faroe Islands', length: 18, format: 'FO kk bbbb cccc cccc cx', example: 'FO6264600001631634' },
  FR: { name: 'France', length: 27, format: 'FR kk bbbb bggg ggcc cccc cccc cxx', example: 'FR1420041010050500013M02606' },
  GB: { name: 'United Kingdom', length: 22, format: 'GB kk bbbb cccc cccc cccc cc', example: 'GB29NWBK60161331926819' },
  GE: { name: 'Georgia', length: 22, format: 'GE kk bbcc cccc cccc cccc cc', example: 'GE29NB0000000101904917' },
  GI: { name: 'Gibraltar', length: 23, format: 'GI kk bbbb cccc cccc cccc ccc', example: 'GI75NWBK000000007099453' },
  GL: { name: 'Greenland', length: 18, format: 'GL kk bbbb cccc cccc cc', example: 'GL8964710001000206' },
  GR: { name: 'Greece', length: 27, format: 'GR kk bbbb bbbc cccc cccc cccc ccc', example: 'GR1601101250000000012300695' },
  GT: { name: 'Guatemala', length: 28, format: 'GT kk bbbb mmtt cccc cccc cccc cccc', example: 'GT82TRAJ01020000001210029690' },
  HR: { name: 'Croatia', length: 21, format: 'HR kk bbbb bbbc cccc cccc c', example: 'HR1210010051863000160' },
  HU: { name: 'Hungary', length: 28, format: 'HU kk bbbs sssk cccc cccc cccc cccx', example: 'HU42117730161111101800000000' },
  IE: { name: 'Ireland', length: 22, format: 'IE kk aaaa bbbb bbcc cccc cc', example: 'IE29AIBK93115212345678' },
  IL: { name: 'Israel', length: 23, format: 'IL kk bbbn nncc cccc cccc ccc', example: 'IL620108000000099999999' },
  IS: { name: 'Iceland', length: 26, format: 'IS kk bbbb sscc cccc iiii iiii ii', example: 'IS140159260076545510730339' },
  IT: { name: 'Italy', length: 27, format: 'IT kk xaaa aabb bbbc cccc cccc ccc', example: 'IT60X0542811101000000123456' },
  JO: { name: 'Jordan', length: 30, format: 'JO kk bbbb ssss cccc cccc cccc cccc cc', example: 'JO94CBJO0010000000000131000302' },
  KW: { name: 'Kuwait', length: 30, format: 'KW kk bbbb cccc cccc cccc cccc cccc cc', example: 'KW81CBKU0000000000001234560101' },
  KZ: { name: 'Kazakhstan', length: 20, format: 'KZ kk bbbc cccc cccc cccc', example: 'KZ86125KZT5004100100' },
  LB: { name: 'Lebanon', length: 28, format: 'LB kk bbbb cccc cccc cccc cccc cccc', example: 'LB62099900000001001901229114' },
  LC: { name: 'Saint Lucia', length: 32, format: 'LC kk bbbb cccc cccc cccc cccc cccc cccc', example: 'LC55HEMM000100010012001200023015' },
  LI: { name: 'Liechtenstein', length: 21, format: 'LI kk bbbb cccc cccc cccc c', example: 'LI21088100002324013AA' },
  LT: { name: 'Lithuania', length: 20, format: 'LT kk bbbb bccc cccc cccc', example: 'LT121000011101001000' },
  LU: { name: 'Luxembourg', length: 20, format: 'LU kk bbbc cccc cccc cccc', example: 'LU280019400644750000' },
  LV: { name: 'Latvia', length: 21, format: 'LV kk bbbb cccc cccc cccc c', example: 'LV80BANK0000435195001' },
  MC: { name: 'Monaco', length: 27, format: 'MC kk bbbb bggg ggcc cccc cccc cxx', example: 'MC5811222000010123456789030' },
  MD: { name: 'Moldova', length: 24, format: 'MD kk bbcc cccc cccc cccc cccc', example: 'MD24AG000225100013104168' },
  ME: { name: 'Montenegro', length: 22, format: 'ME kk bbbc cccc cccc cccc xx', example: 'ME25505000012345678951' },
  MK: { name: 'North Macedonia', length: 19, format: 'MK kk bbbc cccc cccc cxx', example: 'MK07250120000058984' },
  MR: { name: 'Mauritania', length: 27, format: 'MR13 bbbb bsss sscc cccc cccc cxx', example: 'MR1300020001010000123456753' },
  MT: { name: 'Malta', length: 31, format: 'MT kk bbbb ssss cccc cccc cccc cccc ccc', example: 'MT84MALT011000012345MTLCAST001S' },
  MU: { name: 'Mauritius', length: 30, format: 'MU kk bbbb bbss cccc cccc cccc cccc cc', example: 'MU17BOMM0101101030300200000MUR' },
  NL: { name: 'Netherlands', length: 18, format: 'NL kk bbbb cccc cccc cc', example: 'NL91ABNA0417164300' },
  NO: { name: 'Norway', length: 15, format: 'NO kk bbbb cccc ccx', example: 'NO9386011117947' },
  PK: { name: 'Pakistan', length: 24, format: 'PK kk bbbb cccc cccc cccc cccc', example: 'PK36SCBL0000001123456702' },
  PL: { name: 'Poland', length: 28, format: 'PL kk bbbs sssc cccc cccc cccc cccc', example: 'PL61109010140000071219812874' },
  PS: { name: 'Palestinian Territory', length: 29, format: 'PS kk bbbb xxxx xxxx xccc cccc cccc c', example: 'PS92PALS000000000400123456702' },
  PT: { name: 'Portugal', length: 25, format: 'PT kk bbbb ssss cccc cccc cccx x', example: 'PT50000201231234567890154' },
  QA: { name: 'Qatar', length: 29, format: 'QA kk bbbb cccc cccc cccc cccc cccc c', example: 'QA58DOHB00001234567890ABCDEFG' },
  RO: { name: 'Romania', length: 24, format: 'RO kk bbbb cccc cccc cccc cccc', example: 'RO49AAAA1B31007593840000' },
  RS: { name: 'Serbia', length: 22, format: 'RS kk bbbc cccc cccc cccc xx', example: 'RS35260005601001611379' },
  SA: { name: 'Saudi Arabia', length: 24, format: 'SA kk bbcc cccc cccc cccc cccc', example: 'SA0380000000608010167519' },
  SE: { name: 'Sweden', length: 24, format: 'SE kk bbbb cccc cccc cccc cccc', example: 'SE4550000000058398257466' },
  SI: { name: 'Slovenia', length: 19, format: 'SI kk bbss sccc cccc cxx', example: 'SI56263300012039086' },
  SK: { name: 'Slovakia', length: 24, format: 'SK kk bbbb ssss sscc cccc cccc', example: 'SK3112000000198742637541' },
  SM: { name: 'San Marino', length: 27, format: 'SM kk xaaa aabb bbbc cccc cccc ccc', example: 'SM86U0322509800000000270100' },
  TN: { name: 'Tunisia', length: 24, format: 'TN59 bbss sccc cccc cccc cccc', example: 'TN5910006035183598478831' },
  TR: { name: 'Turkey', length: 26, format: 'TR kk bbbb bxcc cccc cccc cccc cc', example: 'TR330006100519786457841326' },
  UA: { name: 'Ukraine', length: 29, format: 'UA kk bbbb bbcc cccc cccc cccc cccc c', example: 'UA213223130000026007233566001' },
  VG: { name: 'British Virgin Islands', length: 24, format: 'VG kk bbbb cccc cccc cccc cccc', example: 'VG96VPVG0000012345678901' },
  XK: { name: 'Kosovo', length: 20, format: 'XK kk bbbb cccc cccc cccc', example: 'XK051212012345678906' },
};

// Common bank codes for major countries (simplified for demo)
const BANK_CODES: Record<string, Record<string, string>> = {
  DE: {
    '10010010': 'Postbank',
    '37040044': 'Commerzbank',
    '50010517': 'ING-DiBa',
    '60050101': 'Baden-Württembergische Bank',
    '70150000': 'Stadtsparkasse München',
  },
  GB: {
    'ABNA': 'ABN AMRO Bank N.V.',
    'BARC': 'Barclays Bank PLC',
    'NWBK': 'National Westminster Bank PLC',
    'LOYD': 'Lloyds Bank PLC',
    'HBUK': 'HSBC UK Bank PLC',
  },
  FR: {
    '20041': 'BRED Banque Populaire',
    '30002': 'Crédit Lyonnais',
    '30003': 'Crédit Industriel et Commercial',
    '20005': 'BNP Paribas',
  },
  IT: {
    '05428': 'Banca Intesa Sanpaolo',
    '03069': 'Intesa Sanpaolo',
    '08327': 'Credito Valtellinese',
  },
};

// Blacklisted patterns or known invalid IBANs
const BLACKLISTED_PATTERNS = [
  /^[A-Z]{2}00/, // Check digits 00 are invalid
  /^XX/, // Invalid country code
];

function cleanIban(iban: string, allowSpaces: boolean): string {
  if (allowSpaces) {
    return iban.replace(/[^A-Z0-9\s]/gi, '').toUpperCase();
  }
  return iban.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function formatIban(iban: string): string {
  const cleaned = iban.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

function validateIbanStructure(iban: string): boolean {
  // IBAN must start with 2 letters followed by 2 digits
  return /^[A-Z]{2}\d{2}[A-Z0-9]+$/i.test(iban);
}

function validateCountryCode(countryCode: string): boolean {
  return countryCode in IBAN_COUNTRIES;
}

function validateIbanLength(iban: string, countryCode: string): boolean {
  const expectedLength = IBAN_COUNTRIES[countryCode]?.length;
  return expectedLength ? iban.length === expectedLength : false;
}

function calculateMod97(iban: string): number {
  // Move the first 4 characters to the end
  const rearranged = iban.substring(4) + iban.substring(0, 4);
  
  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (const char of rearranged) {
    if (/[A-Z]/.test(char)) {
      numericString += (char.charCodeAt(0) - 55).toString();
    } else {
      numericString += char;
    }
  }
  
  // Calculate mod 97
  let remainder = 0;
  for (const digit of numericString) {
    remainder = (remainder * 10 + parseInt(digit)) % 97;
  }
  
  return remainder;
}

function validateMod97Check(iban: string): boolean {
  return calculateMod97(iban) === 1;
}

function extractIbanComponents(iban: string): any {
  const countryCode = iban.substring(0, 2);
  const checkDigits = iban.substring(2, 4);
  const bankCode = iban.substring(4, 8);
  const accountNumber = iban.substring(8);
  
  return {
    countryCode,
    checkDigits,
    bankCode,
    accountNumber,
  };
}

function getBankInfo(countryCode: string, bankCode: string): any {
  const countryInfo = IBAN_COUNTRIES[countryCode];
  const bankName = BANK_CODES[countryCode]?.[bankCode];
  
  return {
    country: countryCode,
    countryName: countryInfo?.name || 'Unknown',
    bankCode,
    bankName: bankName || 'Unknown Bank',
    sepaSupport: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB'].includes(countryCode),
    currency: getCurrency(countryCode),
    example: countryInfo?.example || '',
  };
}

function getCurrency(countryCode: string): string {
  const euroCodes = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'];
  
  if (euroCodes.includes(countryCode)) return 'EUR';
  
  const currencies: Record<string, string> = {
    GB: 'GBP',
    CH: 'CHF',
    NO: 'NOK',
    SE: 'SEK',
    DK: 'DKK',
    PL: 'PLN',
    CZ: 'CZK',
    HU: 'HUF',
    RO: 'RON',
    BG: 'BGN',
    HR: 'HRK',
    IS: 'ISK',
    TR: 'TRY',
    IL: 'ILS',
    SA: 'SAR',
    AE: 'AED',
    QA: 'QAR',
    KW: 'KWD',
    BH: 'BHD',
    JO: 'JOD',
    LB: 'LBP',
    EG: 'EGP',
    TN: 'TND',
    MA: 'MAD',
    PK: 'PKR',
    BR: 'BRL',
    CR: 'CRC',
    DO: 'DOP',
    GT: 'GTQ',
    MU: 'MUR',
  };
  
  return currencies[countryCode] || 'Unknown';
}

function isBlacklisted(iban: string): boolean {
  return BLACKLISTED_PATTERNS.some(pattern => pattern.test(iban));
}

export function processIbanValidator(input: string, config: IbanValidatorConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'IBAN is required'
      };
    }
    
    const cleanedIban = cleanIban(input, config.allowSpaces);
    const normalizedIban = cleanedIban.replace(/\s/g, '');
    const warnings: string[] = [];
    
    // Basic format check
    if (!validateIbanStructure(normalizedIban)) {
      return {
        success: false,
        error: 'Invalid IBAN format. IBAN must start with 2 letters followed by 2 digits.'
      };
    }
    
    const components = extractIbanComponents(normalizedIban);
    const countryCode = components.countryCode;
    const checkDigits = components.checkDigits;
    const bankCode = components.bankCode;
    const accountNumber = components.accountNumber;
    
    // Validate country
    const countrySupported = config.validateCountry ? validateCountryCode(countryCode) : true;
    if (config.validateCountry && !countrySupported) {
      return {
        success: false,
        error: `Country code '${countryCode}' is not supported or invalid.`
      };
    }
    
    // Validate length
    const lengthValid = config.validateLength ? validateIbanLength(normalizedIban, countryCode) : true;
    if (config.validateLength && !lengthValid && countrySupported) {
      const expectedLength = IBAN_COUNTRIES[countryCode]?.length;
      return {
        success: false,
        error: `Invalid IBAN length for ${countryCode}. Expected ${expectedLength} characters, got ${normalizedIban.length}.`
      };
    }
    
    // Validate mod-97 check
    const mod97Valid = config.validateMod97 ? validateMod97Check(normalizedIban) : true;
    if (config.validateMod97 && !mod97Valid) {
      return {
        success: false,
        error: 'IBAN fails mod-97 validation check. The check digits are incorrect.'
      };
    }
    
    // Check blacklist
    if (config.checkBlacklist && isBlacklisted(normalizedIban)) {
      warnings.push('This IBAN matches known invalid patterns');
    }
    
    // Overall validation
    const formatValid = validateIbanStructure(normalizedIban);
    const isValid = formatValid && countrySupported && lengthValid && mod97Valid;
    
    if (config.strictMode && !isValid) {
      warnings.push('Strict mode enabled - all validations must pass');
    }
    
    // Create validation result
    const validation: IbanValidation = {
      isValid,
      country: countryCode,
      countryName: IBAN_COUNTRIES[countryCode]?.name || 'Unknown',
      bankCode,
      accountNumber,
      checkDigits,
      formatValid,
      lengthValid,
      mod97Valid,
      countrySupported,
    };
    
    // Get bank information
    const bankInfo: BankInfo = getBankInfo(countryCode, bankCode);
    
    // Generate output
    let output = `IBAN Validation Result\n`;
    output += `${'='.repeat(30)}\n\n`;
    output += `IBAN: ${config.formatIban ? formatIban(normalizedIban) : normalizedIban}\n`;
    output += `Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
    
    output += `Details:\n`;
    output += `• Country: ${validation.countryName} (${validation.country})\n`;
    output += `• Check Digits: ${validation.checkDigits}\n`;
    output += `• Bank Code: ${validation.bankCode}\n`;
    output += `• Account Number: ${validation.accountNumber}\n\n`;
    
    output += `Validation Checks:\n`;
    output += `• Format: ${validation.formatValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Country: ${validation.countrySupported ? '✅ Supported' : '❌ Unsupported'}\n`;
    output += `• Length: ${validation.lengthValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Checksum: ${validation.mod97Valid ? '✅ Valid' : '❌ Invalid'}\n`;
    
    if (config.showBankDetails && countrySupported) {
      output += `\nBank Information:\n`;
      output += `• Bank: ${bankInfo.bankName}\n`;
      output += `• Currency: ${bankInfo.currency}\n`;
      output += `• SEPA Support: ${bankInfo.sepaSupport ? '✅ Yes' : '❌ No'}\n`;
      
      if (config.includeExample && bankInfo.example) {
        output += `• Example IBAN: ${formatIban(bankInfo.example)}\n`;
      }
    }
    
    // Add warnings
    if (normalizedIban.length < 15 || normalizedIban.length > 34) {
      warnings.push('IBAN length is outside typical range (15-34 characters)');
    }
    
    if (!countrySupported) {
      warnings.push('Country not in our database - validation may be limited');
    }
    
    if (!bankInfo.sepaSupport) {
      warnings.push('This country may not support SEPA payments');
    }
    
    return {
      success: true,
      output,
      validation,
      bankInfo,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const IBAN_VALIDATOR_TOOL: Tool = {
  id: 'iban-validator',
  name: 'IBAN Validator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!.subcategories!.find(sub => sub.id === 'financial-validation')!,
  slug: 'iban-validator',
  icon: '🏦',
  keywords: ['iban', 'bank', 'validate', 'international', 'account', 'sepa', 'mod97', 'finance'],
  seoTitle: 'IBAN Validator - Validate International Bank Account Numbers | FreeFormatHub',
  seoDescription: 'Validate IBAN (International Bank Account Numbers) with mod-97 checksum verification, country support, and bank information lookup.',
  description: 'Validate International Bank Account Numbers (IBAN) using mod-97 algorithm, check country codes, lengths, and provide bank information.',

  examples: [
    {
      title: 'German IBAN',
      input: 'DE89 3704 0044 0532 0130 00',
      output: `IBAN Validation Result
==============================

IBAN: DE89 3704 0044 0532 0130 00
Status: ✅ VALID

Details:
• Country: Germany (DE)
• Check Digits: 89
• Bank Code: 3704
• Account Number: 00440532013000

Validation Checks:
• Format: ✅ Valid
• Country: ✅ Supported
• Length: ✅ Valid
• Checksum: ✅ Valid`,
      description: 'Validate a German IBAN with bank details'
    },
    {
      title: 'UK IBAN',
      input: 'GB29NWBK60161331926819',
      output: `IBAN Validation Result
==============================

IBAN: GB29 NWBK 6016 1331 9268 19
Status: ✅ VALID

Details:
• Country: United Kingdom (GB)
• Check Digits: 29
• Bank Code: NWBK
• Account Number: 60161331926819

Bank Information:
• Bank: National Westminster Bank PLC
• Currency: GBP
• SEPA Support: ✅ Yes`,
      description: 'Validate a UK IBAN with bank information'
    },
    {
      title: 'Invalid IBAN',
      input: 'DE89 3704 0044 0532 0130 01',
      output: `IBAN Validation Result
==============================

IBAN: DE89 3704 0044 0532 0130 01
Status: ❌ INVALID

Validation Checks:
• Format: ✅ Valid
• Country: ✅ Supported
• Length: ✅ Valid
• Checksum: ❌ Invalid`,
      description: 'Example of invalid IBAN failing checksum validation'
    }
  ],

  useCases: [
    'Validating IBAN numbers in banking and financial applications',
    'Verifying international bank account details for SEPA payments',
    'Processing bank account information in e-commerce platforms',
    'Implementing payment validation in accounting systems',
    'Checking IBAN format before submitting international transfers',
    'Building financial compliance and anti-fraud systems',
    'Validating bank details in customer onboarding processes',
    'Educational purposes for understanding IBAN structure'
  ],

  faq: [
    {
      question: 'How does IBAN validation work?',
      answer: 'IBAN validation uses the mod-97 algorithm defined in ISO 13616. The algorithm checks the mathematical relationship between the account number and check digits to ensure accuracy.'
    },
    {
      question: 'Which countries support IBAN?',
      answer: 'Over 70 countries support IBAN, including all EU/SEPA countries plus many others like Brazil, Saudi Arabia, and Turkey. The tool supports all major IBAN countries.'
    },
    {
      question: 'What is the difference between IBAN and BIC?',
      answer: 'IBAN identifies the specific bank account, while BIC (Bank Identifier Code) identifies the bank itself. For SEPA payments, IBAN alone is usually sufficient.'
    },
    {
      question: 'Can I use this for SEPA payments?',
      answer: 'Yes, the tool indicates SEPA support for each country. SEPA countries can receive EUR payments using just the IBAN without requiring a BIC code.'
    },
    {
      question: 'Is the bank information lookup accurate?',
      answer: 'Bank information is based on publicly available data and may not be complete for all banks. For critical applications, verify with official banking databases.'
    }
  ],

  commonErrors: [
    'Invalid IBAN format or structure',
    'Incorrect country code (first 2 letters)',
    'Wrong IBAN length for the specified country',
    'Invalid check digits failing mod-97 validation',
    'Unsupported country codes or regions'
  ],

  relatedTools: ['bic-validator', 'credit-card-validator', 'bank-validator', 'sepa-checker', 'financial-validator']
};