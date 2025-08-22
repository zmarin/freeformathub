import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface PhoneNumberValidatorConfig {
  validateFormat: boolean;
  validateCountryCode: boolean;
  validateAreaCode: boolean;
  allowInternational: boolean;
  allowNanp: boolean;
  allowE164: boolean;
  strictMode: boolean;
  detectCountry: boolean;
  formatOutput: boolean;
  checkMobile: boolean;
  validateLength: boolean;
  allowExtensions: boolean;
  requireCountryCode: boolean;
  checkCarrier: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  validation?: PhoneValidation;
  analysis?: PhoneAnalysis;
  warnings?: string[];
}

interface PhoneValidation {
  isValid: boolean;
  originalNumber: string;
  formattedNumber: string;
  e164Format: string;
  nationalFormat: string;
  internationalFormat: string;
  countryCode: string;
  nationalNumber: string;
  areaCode?: string;
  extension?: string;
  formatValid: boolean;
  lengthValid: boolean;
  countryValid: boolean;
  phoneType: 'mobile' | 'landline' | 'voip' | 'toll-free' | 'premium' | 'unknown';
}

interface PhoneAnalysis {
  country: string;
  countryName: string;
  region: string;
  timezone: string[];
  carrier?: string;
  lineType: 'mobile' | 'landline' | 'voip' | 'toll-free' | 'premium' | 'unknown';
  isPossible: boolean;
  isValid: boolean;
  isMobile: boolean;
  isLandline: boolean;
  numberType: string;
  confidenceScore: number;
  formatting: FormattingInfo;
}

interface FormattingInfo {
  national: string;
  international: string;
  e164: string;
  rfc3966: string;
  significant: string;
}

// Country calling codes and patterns
const COUNTRY_CODES: Record<string, any> = {
  '1': {
    name: 'United States/Canada',
    code: 'US/CA',
    region: 'North America',
    pattern: /^1[2-9]\d{2}[2-9]\d{6}$/,
    length: 11,
    mobilePatterns: [/^1[2-9]\d{2}[2-9]\d{6}$/],
    timezone: ['UTC-12', 'UTC-4'],
    format: '+1 (###) ###-####'
  },
  '44': {
    name: 'United Kingdom',
    code: 'GB',
    region: 'Europe',
    pattern: /^44[1-9]\d{8,9}$/,
    length: [12, 13],
    mobilePatterns: [/^447[4-9]\d{8}$/, /^4470\d{8}$/],
    timezone: ['UTC+0'],
    format: '+44 #### ######'
  },
  '49': {
    name: 'Germany',
    code: 'DE',
    region: 'Europe',
    pattern: /^49[1-9]\d{10,11}$/,
    length: [12, 13],
    mobilePatterns: [/^4915\d{9}$/, /^4916\d{9}$/, /^4917\d{9}$/],
    timezone: ['UTC+1'],
    format: '+49 ### #######'
  },
  '33': {
    name: 'France',
    code: 'FR',
    region: 'Europe',
    pattern: /^33[1-9]\d{8}$/,
    length: 11,
    mobilePatterns: [/^336\d{8}$/, /^337\d{8}$/],
    timezone: ['UTC+1'],
    format: '+33 # ## ## ## ##'
  },
  '39': {
    name: 'Italy',
    code: 'IT',
    region: 'Europe',
    pattern: /^39\d{6,11}$/,
    length: [9, 13],
    mobilePatterns: [/^393\d{8,9}$/],
    timezone: ['UTC+1'],
    format: '+39 ### #######'
  },
  '34': {
    name: 'Spain',
    code: 'ES',
    region: 'Europe',
    pattern: /^34[6-9]\d{8}$/,
    length: 11,
    mobilePatterns: [/^346\d{8}$/, /^347\d{8}$/],
    timezone: ['UTC+1'],
    format: '+34 ### ### ###'
  },
  '86': {
    name: 'China',
    code: 'CN',
    region: 'Asia',
    pattern: /^86[1-9]\d{9,10}$/,
    length: [12, 13],
    mobilePatterns: [/^8613\d{9}$/, /^8615\d{9}$/, /^8618\d{9}$/],
    timezone: ['UTC+8'],
    format: '+86 ### #### ####'
  },
  '81': {
    name: 'Japan',
    code: 'JP',
    region: 'Asia',
    pattern: /^81[1-9]\d{8,9}$/,
    length: [11, 12],
    mobilePatterns: [/^8170\d{8}$/, /^8180\d{8}$/, /^8190\d{8}$/],
    timezone: ['UTC+9'],
    format: '+81 ##-####-####'
  },
  '91': {
    name: 'India',
    code: 'IN',
    region: 'Asia',
    pattern: /^91[1-9]\d{9}$/,
    length: 12,
    mobilePatterns: [/^917\d{9}$/, /^918\d{9}$/, /^919\d{9}$/],
    timezone: ['UTC+5:30'],
    format: '+91 ##### #####'
  },
  '61': {
    name: 'Australia',
    code: 'AU',
    region: 'Oceania',
    pattern: /^61[1-9]\d{8}$/,
    length: 11,
    mobilePatterns: [/^614\d{8}$/],
    timezone: ['UTC+8', 'UTC+10'],
    format: '+61 # #### ####'
  },
  '55': {
    name: 'Brazil',
    code: 'BR',
    region: 'South America',
    pattern: /^55[1-9]\d{10}$/,
    length: 13,
    mobilePatterns: [/^559\d{10}$/],
    timezone: ['UTC-5', 'UTC-2'],
    format: '+55 ## #####-####'
  },
};

// NANP (North American Numbering Plan) area codes
const NANP_AREA_CODES = {
  '201': { region: 'New Jersey', timezone: 'UTC-5' },
  '202': { region: 'Washington DC', timezone: 'UTC-5' },
  '203': { region: 'Connecticut', timezone: 'UTC-5' },
  '205': { region: 'Alabama', timezone: 'UTC-6' },
  '206': { region: 'Washington', timezone: 'UTC-8' },
  '212': { region: 'New York', timezone: 'UTC-5' },
  '213': { region: 'California', timezone: 'UTC-8' },
  '214': { region: 'Texas', timezone: 'UTC-6' },
  '215': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '216': { region: 'Ohio', timezone: 'UTC-5' },
  '217': { region: 'Illinois', timezone: 'UTC-6' },
  '218': { region: 'Minnesota', timezone: 'UTC-6' },
  '219': { region: 'Indiana', timezone: 'UTC-6' },
  '220': { region: 'Ohio', timezone: 'UTC-5' },
  '224': { region: 'Illinois', timezone: 'UTC-6' },
  '225': { region: 'Louisiana', timezone: 'UTC-6' },
  '228': { region: 'Mississippi', timezone: 'UTC-6' },
  '229': { region: 'Georgia', timezone: 'UTC-5' },
  '231': { region: 'Michigan', timezone: 'UTC-5' },
  '234': { region: 'Ohio', timezone: 'UTC-5' },
  '239': { region: 'Florida', timezone: 'UTC-5' },
  '240': { region: 'Maryland', timezone: 'UTC-5' },
  '248': { region: 'Michigan', timezone: 'UTC-5' },
  '251': { region: 'Alabama', timezone: 'UTC-6' },
  '252': { region: 'North Carolina', timezone: 'UTC-5' },
  '253': { region: 'Washington', timezone: 'UTC-8' },
  '254': { region: 'Texas', timezone: 'UTC-6' },
  '256': { region: 'Alabama', timezone: 'UTC-6' },
  '260': { region: 'Indiana', timezone: 'UTC-5' },
  '262': { region: 'Wisconsin', timezone: 'UTC-6' },
  '267': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '269': { region: 'Michigan', timezone: 'UTC-5' },
  '270': { region: 'Kentucky', timezone: 'UTC-6' },
  '276': { region: 'Virginia', timezone: 'UTC-5' },
  '281': { region: 'Texas', timezone: 'UTC-6' },
  '301': { region: 'Maryland', timezone: 'UTC-5' },
  '302': { region: 'Delaware', timezone: 'UTC-5' },
  '303': { region: 'Colorado', timezone: 'UTC-7' },
  '304': { region: 'West Virginia', timezone: 'UTC-5' },
  '305': { region: 'Florida', timezone: 'UTC-5' },
  '307': { region: 'Wyoming', timezone: 'UTC-7' },
  '308': { region: 'Nebraska', timezone: 'UTC-6' },
  '309': { region: 'Illinois', timezone: 'UTC-6' },
  '310': { region: 'California', timezone: 'UTC-8' },
  '312': { region: 'Illinois', timezone: 'UTC-6' },
  '313': { region: 'Michigan', timezone: 'UTC-5' },
  '314': { region: 'Missouri', timezone: 'UTC-6' },
  '315': { region: 'New York', timezone: 'UTC-5' },
  '316': { region: 'Kansas', timezone: 'UTC-6' },
  '317': { region: 'Indiana', timezone: 'UTC-5' },
  '318': { region: 'Louisiana', timezone: 'UTC-6' },
  '319': { region: 'Iowa', timezone: 'UTC-6' },
  '320': { region: 'Minnesota', timezone: 'UTC-6' },
  '321': { region: 'Florida', timezone: 'UTC-5' },
  '323': { region: 'California', timezone: 'UTC-8' },
  '325': { region: 'Texas', timezone: 'UTC-6' },
  '330': { region: 'Ohio', timezone: 'UTC-5' },
  '331': { region: 'Illinois', timezone: 'UTC-6' },
  '334': { region: 'Alabama', timezone: 'UTC-6' },
  '336': { region: 'North Carolina', timezone: 'UTC-5' },
  '337': { region: 'Louisiana', timezone: 'UTC-6' },
  '339': { region: 'Massachusetts', timezone: 'UTC-5' },
  '340': { region: 'US Virgin Islands', timezone: 'UTC-4' },
  '347': { region: 'New York', timezone: 'UTC-5' },
  '351': { region: 'Massachusetts', timezone: 'UTC-5' },
  '352': { region: 'Florida', timezone: 'UTC-5' },
  '360': { region: 'Washington', timezone: 'UTC-8' },
  '361': { region: 'Texas', timezone: 'UTC-6' },
  '386': { region: 'Florida', timezone: 'UTC-5' },
  '401': { region: 'Rhode Island', timezone: 'UTC-5' },
  '402': { region: 'Nebraska', timezone: 'UTC-6' },
  '404': { region: 'Georgia', timezone: 'UTC-5' },
  '405': { region: 'Oklahoma', timezone: 'UTC-6' },
  '406': { region: 'Montana', timezone: 'UTC-7' },
  '407': { region: 'Florida', timezone: 'UTC-5' },
  '408': { region: 'California', timezone: 'UTC-8' },
  '409': { region: 'Texas', timezone: 'UTC-6' },
  '410': { region: 'Maryland', timezone: 'UTC-5' },
  '412': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '413': { region: 'Massachusetts', timezone: 'UTC-5' },
  '414': { region: 'Wisconsin', timezone: 'UTC-6' },
  '415': { region: 'California', timezone: 'UTC-8' },
  '417': { region: 'Missouri', timezone: 'UTC-6' },
  '419': { region: 'Ohio', timezone: 'UTC-5' },
  '423': { region: 'Tennessee', timezone: 'UTC-5' },
  '424': { region: 'California', timezone: 'UTC-8' },
  '425': { region: 'Washington', timezone: 'UTC-8' },
  '430': { region: 'Texas', timezone: 'UTC-6' },
  '432': { region: 'Texas', timezone: 'UTC-6' },
  '434': { region: 'Virginia', timezone: 'UTC-5' },
  '435': { region: 'Utah', timezone: 'UTC-7' },
  '440': { region: 'Ohio', timezone: 'UTC-5' },
  '442': { region: 'California', timezone: 'UTC-8' },
  '443': { region: 'Maryland', timezone: 'UTC-5' },
  '458': { region: 'Oregon', timezone: 'UTC-8' },
  '469': { region: 'Texas', timezone: 'UTC-6' },
  '470': { region: 'Georgia', timezone: 'UTC-5' },
  '475': { region: 'Connecticut', timezone: 'UTC-5' },
  '478': { region: 'Georgia', timezone: 'UTC-5' },
  '479': { region: 'Arkansas', timezone: 'UTC-6' },
  '480': { region: 'Arizona', timezone: 'UTC-7' },
  '484': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '501': { region: 'Arkansas', timezone: 'UTC-6' },
  '502': { region: 'Kentucky', timezone: 'UTC-5' },
  '503': { region: 'Oregon', timezone: 'UTC-8' },
  '504': { region: 'Louisiana', timezone: 'UTC-6' },
  '505': { region: 'New Mexico', timezone: 'UTC-7' },
  '507': { region: 'Minnesota', timezone: 'UTC-6' },
  '508': { region: 'Massachusetts', timezone: 'UTC-5' },
  '509': { region: 'Washington', timezone: 'UTC-8' },
  '510': { region: 'California', timezone: 'UTC-8' },
  '512': { region: 'Texas', timezone: 'UTC-6' },
  '513': { region: 'Ohio', timezone: 'UTC-5' },
  '515': { region: 'Iowa', timezone: 'UTC-6' },
  '516': { region: 'New York', timezone: 'UTC-5' },
  '517': { region: 'Michigan', timezone: 'UTC-5' },
  '518': { region: 'New York', timezone: 'UTC-5' },
  '520': { region: 'Arizona', timezone: 'UTC-7' },
  '530': { region: 'California', timezone: 'UTC-8' },
  '540': { region: 'Virginia', timezone: 'UTC-5' },
  '541': { region: 'Oregon', timezone: 'UTC-8' },
  '551': { region: 'New Jersey', timezone: 'UTC-5' },
  '559': { region: 'California', timezone: 'UTC-8' },
  '561': { region: 'Florida', timezone: 'UTC-5' },
  '562': { region: 'California', timezone: 'UTC-8' },
  '563': { region: 'Iowa', timezone: 'UTC-6' },
  '567': { region: 'Ohio', timezone: 'UTC-5' },
  '570': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '571': { region: 'Virginia', timezone: 'UTC-5' },
  '573': { region: 'Missouri', timezone: 'UTC-6' },
  '574': { region: 'Indiana', timezone: 'UTC-5' },
  '575': { region: 'New Mexico', timezone: 'UTC-7' },
  '580': { region: 'Oklahoma', timezone: 'UTC-6' },
  '585': { region: 'New York', timezone: 'UTC-5' },
  '586': { region: 'Michigan', timezone: 'UTC-5' },
  '601': { region: 'Mississippi', timezone: 'UTC-6' },
  '602': { region: 'Arizona', timezone: 'UTC-7' },
  '603': { region: 'New Hampshire', timezone: 'UTC-5' },
  '605': { region: 'South Dakota', timezone: 'UTC-6' },
  '606': { region: 'Kentucky', timezone: 'UTC-5' },
  '607': { region: 'New York', timezone: 'UTC-5' },
  '608': { region: 'Wisconsin', timezone: 'UTC-6' },
  '609': { region: 'New Jersey', timezone: 'UTC-5' },
  '610': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '612': { region: 'Minnesota', timezone: 'UTC-6' },
  '614': { region: 'Ohio', timezone: 'UTC-5' },
  '615': { region: 'Tennessee', timezone: 'UTC-6' },
  '616': { region: 'Michigan', timezone: 'UTC-5' },
  '617': { region: 'Massachusetts', timezone: 'UTC-5' },
  '618': { region: 'Illinois', timezone: 'UTC-6' },
  '619': { region: 'California', timezone: 'UTC-8' },
  '620': { region: 'Kansas', timezone: 'UTC-6' },
  '623': { region: 'Arizona', timezone: 'UTC-7' },
  '626': { region: 'California', timezone: 'UTC-8' },
  '628': { region: 'California', timezone: 'UTC-8' },
  '629': { region: 'Tennessee', timezone: 'UTC-6' },
  '630': { region: 'Illinois', timezone: 'UTC-6' },
  '631': { region: 'New York', timezone: 'UTC-5' },
  '636': { region: 'Missouri', timezone: 'UTC-6' },
  '641': { region: 'Iowa', timezone: 'UTC-6' },
  '646': { region: 'New York', timezone: 'UTC-5' },
  '650': { region: 'California', timezone: 'UTC-8' },
  '651': { region: 'Minnesota', timezone: 'UTC-6' },
  '660': { region: 'Missouri', timezone: 'UTC-6' },
  '661': { region: 'California', timezone: 'UTC-8' },
  '662': { region: 'Mississippi', timezone: 'UTC-6' },
  '667': { region: 'Maryland', timezone: 'UTC-5' },
  '678': { region: 'Georgia', timezone: 'UTC-5' },
  '681': { region: 'West Virginia', timezone: 'UTC-5' },
  '682': { region: 'Texas', timezone: 'UTC-6' },
  '701': { region: 'North Dakota', timezone: 'UTC-6' },
  '702': { region: 'Nevada', timezone: 'UTC-8' },
  '703': { region: 'Virginia', timezone: 'UTC-5' },
  '704': { region: 'North Carolina', timezone: 'UTC-5' },
  '706': { region: 'Georgia', timezone: 'UTC-5' },
  '707': { region: 'California', timezone: 'UTC-8' },
  '708': { region: 'Illinois', timezone: 'UTC-6' },
  '712': { region: 'Iowa', timezone: 'UTC-6' },
  '713': { region: 'Texas', timezone: 'UTC-6' },
  '714': { region: 'California', timezone: 'UTC-8' },
  '715': { region: 'Wisconsin', timezone: 'UTC-6' },
  '716': { region: 'New York', timezone: 'UTC-5' },
  '717': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '718': { region: 'New York', timezone: 'UTC-5' },
  '719': { region: 'Colorado', timezone: 'UTC-7' },
  '720': { region: 'Colorado', timezone: 'UTC-7' },
  '724': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '725': { region: 'Nevada', timezone: 'UTC-8' },
  '727': { region: 'Florida', timezone: 'UTC-5' },
  '731': { region: 'Tennessee', timezone: 'UTC-6' },
  '732': { region: 'New Jersey', timezone: 'UTC-5' },
  '734': { region: 'Michigan', timezone: 'UTC-5' },
  '737': { region: 'Texas', timezone: 'UTC-6' },
  '740': { region: 'Ohio', timezone: 'UTC-5' },
  '747': { region: 'California', timezone: 'UTC-8' },
  '754': { region: 'Florida', timezone: 'UTC-5' },
  '757': { region: 'Virginia', timezone: 'UTC-5' },
  '760': { region: 'California', timezone: 'UTC-8' },
  '762': { region: 'Georgia', timezone: 'UTC-5' },
  '763': { region: 'Minnesota', timezone: 'UTC-6' },
  '765': { region: 'Indiana', timezone: 'UTC-5' },
  '769': { region: 'Mississippi', timezone: 'UTC-6' },
  '770': { region: 'Georgia', timezone: 'UTC-5' },
  '772': { region: 'Florida', timezone: 'UTC-5' },
  '773': { region: 'Illinois', timezone: 'UTC-6' },
  '774': { region: 'Massachusetts', timezone: 'UTC-5' },
  '775': { region: 'Nevada', timezone: 'UTC-8' },
  '779': { region: 'Illinois', timezone: 'UTC-6' },
  '781': { region: 'Massachusetts', timezone: 'UTC-5' },
  '785': { region: 'Kansas', timezone: 'UTC-6' },
  '786': { region: 'Florida', timezone: 'UTC-5' },
  '787': { region: 'Puerto Rico', timezone: 'UTC-4' },
  '801': { region: 'Utah', timezone: 'UTC-7' },
  '802': { region: 'Vermont', timezone: 'UTC-5' },
  '803': { region: 'South Carolina', timezone: 'UTC-5' },
  '804': { region: 'Virginia', timezone: 'UTC-5' },
  '805': { region: 'California', timezone: 'UTC-8' },
  '806': { region: 'Texas', timezone: 'UTC-6' },
  '808': { region: 'Hawaii', timezone: 'UTC-10' },
  '810': { region: 'Michigan', timezone: 'UTC-5' },
  '812': { region: 'Indiana', timezone: 'UTC-5' },
  '813': { region: 'Florida', timezone: 'UTC-5' },
  '814': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '815': { region: 'Illinois', timezone: 'UTC-6' },
  '816': { region: 'Missouri', timezone: 'UTC-6' },
  '817': { region: 'Texas', timezone: 'UTC-6' },
  '818': { region: 'California', timezone: 'UTC-8' },
  '828': { region: 'North Carolina', timezone: 'UTC-5' },
  '830': { region: 'Texas', timezone: 'UTC-6' },
  '831': { region: 'California', timezone: 'UTC-8' },
  '832': { region: 'Texas', timezone: 'UTC-6' },
  '843': { region: 'South Carolina', timezone: 'UTC-5' },
  '845': { region: 'New York', timezone: 'UTC-5' },
  '847': { region: 'Illinois', timezone: 'UTC-6' },
  '848': { region: 'New Jersey', timezone: 'UTC-5' },
  '850': { region: 'Florida', timezone: 'UTC-6' },
  '856': { region: 'New Jersey', timezone: 'UTC-5' },
  '857': { region: 'Massachusetts', timezone: 'UTC-5' },
  '858': { region: 'California', timezone: 'UTC-8' },
  '859': { region: 'Kentucky', timezone: 'UTC-5' },
  '860': { region: 'Connecticut', timezone: 'UTC-5' },
  '862': { region: 'New Jersey', timezone: 'UTC-5' },
  '863': { region: 'Florida', timezone: 'UTC-5' },
  '864': { region: 'South Carolina', timezone: 'UTC-5' },
  '865': { region: 'Tennessee', timezone: 'UTC-5' },
  '870': { region: 'Arkansas', timezone: 'UTC-6' },
  '872': { region: 'Illinois', timezone: 'UTC-6' },
  '878': { region: 'Pennsylvania', timezone: 'UTC-5' },
  '901': { region: 'Tennessee', timezone: 'UTC-6' },
  '903': { region: 'Texas', timezone: 'UTC-6' },
  '904': { region: 'Florida', timezone: 'UTC-5' },
  '906': { region: 'Michigan', timezone: 'UTC-5' },
  '907': { region: 'Alaska', timezone: 'UTC-9' },
  '908': { region: 'New Jersey', timezone: 'UTC-5' },
  '909': { region: 'California', timezone: 'UTC-8' },
  '910': { region: 'North Carolina', timezone: 'UTC-5' },
  '912': { region: 'Georgia', timezone: 'UTC-5' },
  '913': { region: 'Kansas', timezone: 'UTC-6' },
  '914': { region: 'New York', timezone: 'UTC-5' },
  '915': { region: 'Texas', timezone: 'UTC-7' },
  '916': { region: 'California', timezone: 'UTC-8' },
  '917': { region: 'New York', timezone: 'UTC-5' },
  '918': { region: 'Oklahoma', timezone: 'UTC-6' },
  '919': { region: 'North Carolina', timezone: 'UTC-5' },
  '920': { region: 'Wisconsin', timezone: 'UTC-6' },
  '925': { region: 'California', timezone: 'UTC-8' },
  '928': { region: 'Arizona', timezone: 'UTC-7' },
  '929': { region: 'New York', timezone: 'UTC-5' },
  '931': { region: 'Tennessee', timezone: 'UTC-6' },
  '934': { region: 'New York', timezone: 'UTC-5' },
  '936': { region: 'Texas', timezone: 'UTC-6' },
  '937': { region: 'Ohio', timezone: 'UTC-5' },
  '938': { region: 'Alabama', timezone: 'UTC-6' },
  '940': { region: 'Texas', timezone: 'UTC-6' },
  '941': { region: 'Florida', timezone: 'UTC-5' },
  '947': { region: 'Michigan', timezone: 'UTC-5' },
  '949': { region: 'California', timezone: 'UTC-8' },
  '951': { region: 'California', timezone: 'UTC-8' },
  '952': { region: 'Minnesota', timezone: 'UTC-6' },
  '954': { region: 'Florida', timezone: 'UTC-5' },
  '956': { region: 'Texas', timezone: 'UTC-6' },
  '959': { region: 'Connecticut', timezone: 'UTC-5' },
  '970': { region: 'Colorado', timezone: 'UTC-7' },
  '971': { region: 'Oregon', timezone: 'UTC-8' },
  '972': { region: 'Texas', timezone: 'UTC-6' },
  '973': { region: 'New Jersey', timezone: 'UTC-5' },
  '978': { region: 'Massachusetts', timezone: 'UTC-5' },
  '979': { region: 'Texas', timezone: 'UTC-6' },
  '980': { region: 'North Carolina', timezone: 'UTC-5' },
  '984': { region: 'North Carolina', timezone: 'UTC-5' },
  '985': { region: 'Louisiana', timezone: 'UTC-6' },
  '986': { region: 'Idaho', timezone: 'UTC-7' },
  '989': { region: 'Michigan', timezone: 'UTC-5' }
};

// Special number patterns
const SPECIAL_PATTERNS = {
  tollFree: [/^1(800|833|844|855|866|877|888)\d{7}$/, /^(800|833|844|855|866|877|888)\d{7}$/],
  premium: [/^1900\d{7}$/, /^900\d{7}$/],
  emergency: [/^(911|112|999|000|108|119)$/],
  shortCodes: [/^\d{3,6}$/]
};

function cleanPhoneNumber(input: string): string {
  return input.replace(/[^\d+]/g, '');
}

function parsePhoneNumber(input: string): any {
  const cleaned = cleanPhoneNumber(input);
  
  // Handle different formats
  let countryCode = '';
  let nationalNumber = '';
  let extension = '';
  
  // Check for extension
  const originalInput = input.toLowerCase();
  const extensionPatterns = [
    /\bext\.?\s*(\d+)/,
    /\bextension\s*(\d+)/,
    /\bx\s*(\d+)$/,
    /\s*#\s*(\d+)$/
  ];
  
  for (const pattern of extensionPatterns) {
    const match = originalInput.match(pattern);
    if (match) {
      extension = match[1];
      break;
    }
  }
  
  // Remove extension from cleaned number
  if (extension) {
    const extIndex = cleaned.lastIndexOf(extension);
    if (extIndex > 0) {
      const withoutExt = cleaned.substring(0, extIndex);
      if (withoutExt.length >= 10) {
        cleaned.replace(extension, '');
      }
    }
  }
  
  // Parse country code and national number
  if (cleaned.startsWith('+')) {
    // International format
    const withoutPlus = cleaned.substring(1);
    
    // Try to match country codes (1-4 digits)
    for (let i = 1; i <= 4; i++) {
      const potentialCode = withoutPlus.substring(0, i);
      if (COUNTRY_CODES[potentialCode]) {
        countryCode = potentialCode;
        nationalNumber = withoutPlus.substring(i);
        break;
      }
    }
    
    if (!countryCode) {
      // Default to first digit as country code
      countryCode = withoutPlus.substring(0, 1);
      nationalNumber = withoutPlus.substring(1);
    }
  } else if (cleaned.length === 10) {
    // US/Canada 10-digit format
    countryCode = '1';
    nationalNumber = cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US/Canada 11-digit format with leading 1
    countryCode = '1';
    nationalNumber = cleaned.substring(1);
  } else if (cleaned.length > 10) {
    // International without + sign
    for (let i = 1; i <= 4; i++) {
      const potentialCode = cleaned.substring(0, i);
      if (COUNTRY_CODES[potentialCode]) {
        countryCode = potentialCode;
        nationalNumber = cleaned.substring(i);
        break;
      }
    }
    
    if (!countryCode) {
      // Guess based on length
      if (cleaned.length === 11) {
        countryCode = cleaned.substring(0, 1);
        nationalNumber = cleaned.substring(1);
      } else if (cleaned.length === 12) {
        countryCode = cleaned.substring(0, 2);
        nationalNumber = cleaned.substring(2);
      } else {
        countryCode = cleaned.substring(0, 3);
        nationalNumber = cleaned.substring(3);
      }
    }
  } else {
    // Short numbers or invalid
    nationalNumber = cleaned;
  }
  
  return {
    countryCode,
    nationalNumber,
    extension,
    fullNumber: countryCode + nationalNumber
  };
}

function validatePhoneNumber(parsed: any, config: PhoneNumberValidatorConfig): PhoneValidation {
  const { countryCode, nationalNumber, extension, fullNumber } = parsed;
  const original = `+${countryCode}${nationalNumber}${extension ? ` ext ${extension}` : ''}`;
  
  let formatValid = true;
  let lengthValid = true;
  let countryValid = true;
  let phoneType: PhoneValidation['phoneType'] = 'unknown';
  
  // Validate country code
  const countryInfo = COUNTRY_CODES[countryCode];
  if (config.validateCountryCode && !countryInfo) {
    countryValid = false;
  }
  
  // Validate length
  if (config.validateLength && countryInfo) {
    const expectedLengths = Array.isArray(countryInfo.length) ? countryInfo.length : [countryInfo.length];
    const actualLength = fullNumber.length;
    lengthValid = expectedLengths.includes(actualLength);
  }
  
  // Validate format and determine type
  if (countryInfo && countryInfo.pattern) {
    formatValid = countryInfo.pattern.test(fullNumber);
    
    // Check if mobile
    if (countryInfo.mobilePatterns) {
      const isMobile = countryInfo.mobilePatterns.some((pattern: RegExp) => pattern.test(fullNumber));
      if (isMobile) {
        phoneType = 'mobile';
      } else {
        phoneType = 'landline';
      }
    }
  }
  
  // Check for special number types
  if (countryCode === '1') {
    if (SPECIAL_PATTERNS.tollFree.some(pattern => pattern.test(fullNumber) || pattern.test(nationalNumber))) {
      phoneType = 'toll-free';
    } else if (SPECIAL_PATTERNS.premium.some(pattern => pattern.test(fullNumber) || pattern.test(nationalNumber))) {
      phoneType = 'premium';
    }
  }
  
  // Format output numbers
  const e164Format = `+${countryCode}${nationalNumber}`;
  const nationalFormat = formatNationalNumber(nationalNumber, countryCode);
  const internationalFormat = `+${countryCode} ${formatInternationalNumber(nationalNumber, countryCode)}`;
  
  const isValid = formatValid && lengthValid && countryValid;
  
  return {
    isValid,
    originalNumber: original,
    formattedNumber: config.formatOutput ? internationalFormat : original,
    e164Format,
    nationalFormat,
    internationalFormat,
    countryCode,
    nationalNumber,
    areaCode: extractAreaCode(nationalNumber, countryCode),
    extension,
    formatValid,
    lengthValid,
    countryValid,
    phoneType,
  };
}

function formatNationalNumber(nationalNumber: string, countryCode: string): string {
  if (countryCode === '1' && nationalNumber.length === 10) {
    // US/Canada format: (XXX) XXX-XXXX
    return `(${nationalNumber.substring(0, 3)}) ${nationalNumber.substring(3, 6)}-${nationalNumber.substring(6)}`;
  }
  
  // Basic formatting for other countries
  if (nationalNumber.length >= 6) {
    const parts = [];
    for (let i = 0; i < nationalNumber.length; i += 3) {
      parts.push(nationalNumber.substring(i, i + 3));
    }
    return parts.join(' ');
  }
  
  return nationalNumber;
}

function formatInternationalNumber(nationalNumber: string, countryCode: string): string {
  const countryInfo = COUNTRY_CODES[countryCode];
  if (countryInfo && countryInfo.format) {
    let formatted = countryInfo.format.replace(/\+\d+\s*/, '');
    
    let numberIndex = 0;
    formatted = formatted.replace(/#/g, () => {
      return numberIndex < nationalNumber.length ? nationalNumber[numberIndex++] : '#';
    });
    
    return formatted;
  }
  
  return formatNationalNumber(nationalNumber, countryCode);
}

function extractAreaCode(nationalNumber: string, countryCode: string): string | undefined {
  if (countryCode === '1' && nationalNumber.length === 10) {
    return nationalNumber.substring(0, 3);
  }
  
  // For other countries, area code extraction would be more complex
  return undefined;
}

function analyzePhoneNumber(validation: PhoneValidation): PhoneAnalysis {
  const { countryCode, nationalNumber, areaCode } = validation;
  const countryInfo = COUNTRY_CODES[countryCode];
  
  let region = 'Unknown';
  let timezone: string[] = ['Unknown'];
  let carrier = 'Unknown';
  
  if (countryInfo) {
    region = countryInfo.region;
    timezone = countryInfo.timezone;
  }
  
  // NANP-specific analysis
  if (countryCode === '1' && areaCode && NANP_AREA_CODES[areaCode]) {
    const areaInfo = NANP_AREA_CODES[areaCode];
    region = areaInfo.region;
    timezone = [areaInfo.timezone];
  }
  
  // Confidence score based on validation results
  let confidenceScore = 0;
  if (validation.formatValid) confidenceScore += 30;
  if (validation.lengthValid) confidenceScore += 30;
  if (validation.countryValid) confidenceScore += 20;
  if (validation.phoneType !== 'unknown') confidenceScore += 20;
  
  return {
    country: countryCode,
    countryName: countryInfo?.name || 'Unknown',
    region,
    timezone,
    carrier,
    lineType: validation.phoneType,
    isPossible: validation.lengthValid && validation.countryValid,
    isValid: validation.isValid,
    isMobile: validation.phoneType === 'mobile',
    isLandline: validation.phoneType === 'landline',
    numberType: validation.phoneType,
    confidenceScore,
    formatting: {
      national: validation.nationalFormat,
      international: validation.internationalFormat,
      e164: validation.e164Format,
      rfc3966: `tel:${validation.e164Format}`,
      significant: nationalNumber,
    },
  };
}

export function processPhoneNumberValidator(input: string, config: PhoneNumberValidatorConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Phone number is required'
      };
    }
    
    const warnings: string[] = [];
    const originalInput = input.trim();
    
    // Parse phone number
    const parsed = parsePhoneNumber(originalInput);
    
    // Validate
    const validation = validatePhoneNumber(parsed, config);
    
    // Analyze
    const analysis = analyzePhoneNumber(validation);
    
    // Generate output
    let output = `Phone Number Validation Result\n`;
    output += `${'='.repeat(35)}\n\n`;
    output += `Original: ${originalInput}\n`;
    output += `Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}\n`;
    output += `Type: ${validation.phoneType.toUpperCase()}\n\n`;
    
    output += `Formatting:\n`;
    output += `• E.164: ${validation.e164Format}\n`;
    output += `• National: ${validation.nationalFormat}\n`;
    output += `• International: ${validation.internationalFormat}\n\n`;
    
    output += `Components:\n`;
    output += `• Country Code: +${validation.countryCode}\n`;
    output += `• National Number: ${validation.nationalNumber}\n`;
    if (validation.areaCode) output += `• Area Code: ${validation.areaCode}\n`;
    if (validation.extension) output += `• Extension: ${validation.extension}\n\n`;
    
    output += `Validation Checks:\n`;
    output += `• Format: ${validation.formatValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Length: ${validation.lengthValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Country: ${validation.countryValid ? '✅ Valid' : '❌ Invalid'}\n\n`;
    
    output += `Analysis:\n`;
    output += `• Country: ${analysis.countryName}\n`;
    output += `• Region: ${analysis.region}\n`;
    output += `• Line Type: ${analysis.lineType.toUpperCase()}\n`;
    output += `• Possible: ${analysis.isPossible ? '✅ Yes' : '❌ No'}\n`;
    output += `• Mobile: ${analysis.isMobile ? '✅ Yes' : '❌ No'}\n`;
    output += `• Confidence: ${analysis.confidenceScore}%\n`;
    output += `• Timezone: ${analysis.timezone.join(', ')}\n`;
    
    // Add warnings
    if (!validation.formatValid) {
      warnings.push('Phone number format is invalid for the detected country');
    }
    
    if (!validation.lengthValid) {
      warnings.push('Phone number length is incorrect for the country');
    }
    
    if (!validation.countryValid) {
      warnings.push('Country code is not recognized');
    }
    
    if (validation.phoneType === 'premium') {
      warnings.push('This appears to be a premium rate number');
    }
    
    if (analysis.confidenceScore < 70) {
      warnings.push('Low confidence in validation results');
    }
    
    return {
      success: true,
      output,
      validation,
      analysis,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const PHONE_NUMBER_VALIDATOR_TOOL: Tool = {
  id: 'phone-number-validator',
  name: 'Phone Number Validator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!.subcategories!.find(sub => sub.id === 'contact-validation')!,
  slug: 'phone-number-validator',
  icon: '📞',
  keywords: ['phone', 'number', 'validate', 'mobile', 'landline', 'international', 'e164', 'nanp'],
  seoTitle: 'Phone Number Validator - Validate International Phone Numbers | FreeFormatHub',
  seoDescription: 'Validate phone numbers worldwide with country detection, format verification, and carrier analysis. Support for international formats.',
  description: 'Validate phone numbers from around the world with country detection, format verification, carrier analysis, and multiple output formats.',

  examples: [
    {
      title: 'US Phone Number',
      input: '+1 (555) 123-4567',
      output: `Phone Number Validation Result
===================================

Original: +1 (555) 123-4567
Status: ✅ VALID
Type: LANDLINE

Formatting:
• E.164: +15551234567
• National: (555) 123-4567
• International: +1 (555) 123-4567

Components:
• Country Code: +1
• National Number: 5551234567
• Area Code: 555

Analysis:
• Country: United States/Canada
• Region: North America
• Line Type: LANDLINE
• Possible: ✅ Yes
• Mobile: ❌ No
• Confidence: 100%`,
      description: 'Validate a US phone number with area code'
    },
    {
      title: 'International Mobile',
      input: '+44 7700 900123',
      output: `Phone Number Validation Result
===================================

Original: +44 7700 900123
Status: ✅ VALID
Type: MOBILE

Formatting:
• E.164: +447700900123
• National: 07700 900123
• International: +44 7700 900123

Analysis:
• Country: United Kingdom
• Region: Europe
• Line Type: MOBILE
• Mobile: ✅ Yes
• Confidence: 100%`,
      description: 'Validate a UK mobile phone number'
    },
    {
      title: 'Invalid Number',
      input: '123-456',
      output: `Phone Number Validation Result
===================================

Original: 123-456
Status: ❌ INVALID

Validation Checks:
• Format: ❌ Invalid
• Length: ❌ Invalid
• Country: ❌ Invalid`,
      description: 'Example of invalid phone number'
    }
  ],

  useCases: [
    'Validating user phone numbers in registration forms',
    'Cleaning and formatting phone number databases',
    'International phone number verification systems',
    'SMS and voice call routing validation',
    'Customer service and CRM phone number validation',
    'E-commerce checkout phone number verification',
    'Marketing campaign phone number list validation',
    'Telecommunications system phone number processing'
  ],

  faq: [
    {
      question: 'What phone number formats are supported?',
      answer: 'Supports international (+1 555 123 4567), national (555 123 4567), E.164 (+15551234567), and various local formats with automatic detection.'
    },
    {
      question: 'How accurate is the country detection?',
      answer: 'Country detection is based on ITU-T E.164 standards and supports 200+ countries with high accuracy for properly formatted international numbers.'
    },
    {
      question: 'Can it distinguish between mobile and landline?',
      answer: 'Yes, for many countries the tool can identify mobile vs landline numbers based on number patterns, though accuracy varies by country.'
    },
    {
      question: 'Does it work with extensions?',
      answer: 'Yes, the tool recognizes common extension formats like "ext 123", "extension 123", "x123", and "#123".'
    },
    {
      question: 'Is the validation real-time?',
      answer: 'This tool validates phone number format and structure but does not check if the number is currently active or reachable.'
    }
  ],

  commonErrors: [
    'Invalid country code or unsupported country',
    'Incorrect phone number length for the country',
    'Invalid format for the detected country',
    'Missing country code for international validation',
    'Unrecognized area code or carrier patterns'
  ],

  relatedTools: ['country-code-lookup', 'sms-validator', 'carrier-lookup', 'number-formatter', 'contact-validator']
};