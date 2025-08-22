import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface UserAgentConfig {
  outputFormat: 'detailed' | 'simple' | 'json';
  showFeatures: boolean;
  detectBots: boolean;
  includeVersionHistory: boolean;
  bulkMode: boolean;
  showRawData: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  results?: ParsedUserAgent[];
}

interface ParsedUserAgent {
  original: string;
  browser: BrowserInfo;
  os: OSInfo;
  device: DeviceInfo;
  engine: EngineInfo;
  isBot: boolean;
  botInfo?: BotInfo;
  features: string[];
  security: SecurityInfo;
  categories: string[];
}

interface BrowserInfo {
  name: string;
  version: string;
  major: string;
  vendor?: string;
  mobile: boolean;
}

interface OSInfo {
  name: string;
  version: string;
  platform: string;
  architecture?: string;
}

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'tv' | 'wearable' | 'console' | 'embedded' | 'unknown';
  brand?: string;
  model?: string;
  vendor?: string;
}

interface EngineInfo {
  name: string;
  version: string;
}

interface BotInfo {
  name: string;
  category: string;
  url?: string;
  purpose: string;
}

interface SecurityInfo {
  httpVersion?: string;
  encryption?: string;
  vulnerabilities: string[];
  privacyFlags: string[];
}

// Browser detection patterns
const BROWSER_PATTERNS = [
  // Modern browsers
  { pattern: /Edg\/([0-9.]+)/, name: 'Microsoft Edge', vendor: 'Microsoft' },
  { pattern: /Chrome\/([0-9.]+)/, name: 'Google Chrome', vendor: 'Google' },
  { pattern: /Firefox\/([0-9.]+)/, name: 'Mozilla Firefox', vendor: 'Mozilla' },
  { pattern: /Safari\/([0-9.]+)/, name: 'Safari', vendor: 'Apple' },
  { pattern: /Opera\/([0-9.]+)/, name: 'Opera', vendor: 'Opera Software' },
  
  // Mobile browsers
  { pattern: /CriOS\/([0-9.]+)/, name: 'Chrome Mobile', vendor: 'Google' },
  { pattern: /FxiOS\/([0-9.]+)/, name: 'Firefox Mobile', vendor: 'Mozilla' },
  { pattern: /EdgiOS\/([0-9.]+)/, name: 'Edge Mobile', vendor: 'Microsoft' },
  
  // Legacy browsers
  { pattern: /MSIE ([0-9.]+)/, name: 'Internet Explorer', vendor: 'Microsoft' },
  { pattern: /Trident.*rv:([0-9.]+)/, name: 'Internet Explorer', vendor: 'Microsoft' },
  
  // Other browsers
  { pattern: /Vivaldi\/([0-9.]+)/, name: 'Vivaldi', vendor: 'Vivaldi Technologies' },
  { pattern: /Brave\/([0-9.]+)/, name: 'Brave', vendor: 'Brave Software' },
  { pattern: /DuckDuckGo\/([0-9.]+)/, name: 'DuckDuckGo', vendor: 'DuckDuckGo' },
];

// Operating system patterns
const OS_PATTERNS = [
  { pattern: /Windows NT 10\.0/, name: 'Windows 10', platform: 'Windows' },
  { pattern: /Windows NT 6\.3/, name: 'Windows 8.1', platform: 'Windows' },
  { pattern: /Windows NT 6\.2/, name: 'Windows 8', platform: 'Windows' },
  { pattern: /Windows NT 6\.1/, name: 'Windows 7', platform: 'Windows' },
  { pattern: /Windows NT 6\.0/, name: 'Windows Vista', platform: 'Windows' },
  { pattern: /Windows NT 5\.1/, name: 'Windows XP', platform: 'Windows' },
  
  { pattern: /Mac OS X ([0-9_]+)/, name: 'macOS', platform: 'macOS' },
  { pattern: /iPhone OS ([0-9_]+)/, name: 'iOS', platform: 'iOS' },
  { pattern: /Android ([0-9.]+)/, name: 'Android', platform: 'Android' },
  
  { pattern: /Ubuntu/, name: 'Ubuntu', platform: 'Linux' },
  { pattern: /CentOS/, name: 'CentOS', platform: 'Linux' },
  { pattern: /Fedora/, name: 'Fedora', platform: 'Linux' },
  { pattern: /Linux/, name: 'Linux', platform: 'Linux' },
  
  { pattern: /FreeBSD/, name: 'FreeBSD', platform: 'Unix' },
  { pattern: /OpenBSD/, name: 'OpenBSD', platform: 'Unix' },
];

// Device type detection
const DEVICE_PATTERNS = [
  { pattern: /iPhone/, type: 'mobile', brand: 'Apple' },
  { pattern: /iPad/, type: 'tablet', brand: 'Apple' },
  { pattern: /Android.*Mobile/, type: 'mobile' },
  { pattern: /Android/, type: 'tablet' },
  { pattern: /BlackBerry/, type: 'mobile', brand: 'BlackBerry' },
  { pattern: /Windows Phone/, type: 'mobile', brand: 'Microsoft' },
  { pattern: /PlayStation/, type: 'console', brand: 'Sony' },
  { pattern: /Xbox/, type: 'console', brand: 'Microsoft' },
  { pattern: /Smart-TV/, type: 'tv' },
  { pattern: /AppleTV/, type: 'tv', brand: 'Apple' },
];

// Bot detection patterns
const BOT_PATTERNS = [
  { pattern: /Googlebot/, name: 'Googlebot', category: 'Search Engine', purpose: 'Web crawling and indexing' },
  { pattern: /Bingbot/, name: 'Bingbot', category: 'Search Engine', purpose: 'Web crawling and indexing' },
  { pattern: /Slurp/, name: 'Yahoo Slurp', category: 'Search Engine', purpose: 'Web crawling and indexing' },
  { pattern: /DuckDuckBot/, name: 'DuckDuckBot', category: 'Search Engine', purpose: 'Web crawling and indexing' },
  { pattern: /facebookexternalhit/, name: 'Facebook Crawler', category: 'Social Media', purpose: 'Link preview generation' },
  { pattern: /Twitterbot/, name: 'Twitterbot', category: 'Social Media', purpose: 'Link preview generation' },
  { pattern: /LinkedInBot/, name: 'LinkedInBot', category: 'Social Media', purpose: 'Link preview generation' },
  { pattern: /WhatsApp/, name: 'WhatsApp Crawler', category: 'Messaging', purpose: 'Link preview generation' },
  { pattern: /TelegramBot/, name: 'Telegram Bot', category: 'Messaging', purpose: 'Link processing' },
  { pattern: /Applebot/, name: 'Applebot', category: 'Search Engine', purpose: 'Siri and Spotlight search' },
  { pattern: /YandexBot/, name: 'YandexBot', category: 'Search Engine', purpose: 'Web crawling and indexing' },
  { pattern: /Baiduspider/, name: 'Baiduspider', category: 'Search Engine', purpose: 'Web crawling and indexing' },
  { pattern: /SemrushBot/, name: 'SemrushBot', category: 'SEO Tool', purpose: 'SEO analysis and monitoring' },
  { pattern: /AhrefsBot/, name: 'AhrefsBot', category: 'SEO Tool', purpose: 'SEO analysis and backlink discovery' },
  { pattern: /MJ12bot/, name: 'MJ12bot', category: 'SEO Tool', purpose: 'Web crawling for Majestic SEO' },
];

// Render engine patterns
const ENGINE_PATTERNS = [
  { pattern: /Blink/, name: 'Blink' },
  { pattern: /WebKit/, name: 'WebKit' },
  { pattern: /Gecko/, name: 'Gecko' },
  { pattern: /Trident/, name: 'Trident' },
  { pattern: /EdgeHTML/, name: 'EdgeHTML' },
  { pattern: /Presto/, name: 'Presto' },
];

function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.trim();
  
  // Parse browser
  const browser = parseBrowser(ua);
  
  // Parse OS
  const os = parseOS(ua);
  
  // Parse device
  const device = parseDevice(ua);
  
  // Parse engine
  const engine = parseEngine(ua);
  
  // Detect bot
  const { isBot, botInfo } = parseBot(ua);
  
  // Extract features
  const features = parseFeatures(ua);
  
  // Security analysis
  const security = parseSecurity(ua);
  
  // Categorize
  const categories = categorizeUserAgent(browser, os, device, isBot);

  return {
    original: ua,
    browser,
    os,
    device,
    engine,
    isBot,
    botInfo,
    features,
    security,
    categories,
  };
}

function parseBrowser(ua: string): BrowserInfo {
  // Check for mobile browsers first
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  
  for (const browserPattern of BROWSER_PATTERNS) {
    const match = ua.match(browserPattern.pattern);
    if (match) {
      const version = match[1] || 'Unknown';
      const major = version.split('.')[0];
      
      return {
        name: browserPattern.name,
        version,
        major,
        vendor: browserPattern.vendor,
        mobile: isMobile,
      };
    }
  }
  
  return {
    name: 'Unknown Browser',
    version: 'Unknown',
    major: 'Unknown',
    mobile: isMobile,
  };
}

function parseOS(ua: string): OSInfo {
  for (const osPattern of OS_PATTERNS) {
    const match = ua.match(osPattern.pattern);
    if (match) {
      let version = 'Unknown';
      if (match[1]) {
        version = match[1].replace(/_/g, '.');
      }
      
      // Detect architecture
      let architecture: string | undefined;
      if (/x64|x86_64|WOW64/.test(ua)) {
        architecture = 'x64';
      } else if (/x86|i686/.test(ua)) {
        architecture = 'x86';
      } else if (/arm64|aarch64/.test(ua)) {
        architecture = 'ARM64';
      } else if (/arm/.test(ua)) {
        architecture = 'ARM';
      }
      
      return {
        name: osPattern.name,
        version,
        platform: osPattern.platform,
        architecture,
      };
    }
  }
  
  return {
    name: 'Unknown OS',
    version: 'Unknown',
    platform: 'Unknown',
  };
}

function parseDevice(ua: string): DeviceInfo {
  for (const devicePattern of DEVICE_PATTERNS) {
    if (devicePattern.pattern.test(ua)) {
      const device: DeviceInfo = {
        type: devicePattern.type as DeviceInfo['type'],
      };
      
      if (devicePattern.brand) {
        device.brand = devicePattern.brand;
      }
      
      // Try to extract model for mobile devices
      if (devicePattern.type === 'mobile' || devicePattern.type === 'tablet') {
        const modelMatch = ua.match(/\b([A-Z][A-Z0-9-]+)\b/);
        if (modelMatch) {
          device.model = modelMatch[1];
        }
      }
      
      return device;
    }
  }
  
  // Default to desktop if no mobile indicators
  if (!/Mobile|Android|iPhone|iPad/.test(ua)) {
    return { type: 'desktop' };
  }
  
  return { type: 'unknown' };
}

function parseEngine(ua: string): EngineInfo {
  for (const enginePattern of ENGINE_PATTERNS) {
    if (enginePattern.pattern.test(ua)) {
      // Try to extract version
      const versionMatch = ua.match(new RegExp(`${enginePattern.name}/([0-9.]+)`));
      const version = versionMatch ? versionMatch[1] : 'Unknown';
      
      return {
        name: enginePattern.name,
        version,
      };
    }
  }
  
  return {
    name: 'Unknown Engine',
    version: 'Unknown',
  };
}

function parseBot(ua: string): { isBot: boolean; botInfo?: BotInfo } {
  // General bot indicators
  const botIndicators = /bot|crawler|spider|scraper|curl|wget|python-requests|http|api/i;
  
  for (const botPattern of BOT_PATTERNS) {
    if (botPattern.pattern.test(ua)) {
      return {
        isBot: true,
        botInfo: {
          name: botPattern.name,
          category: botPattern.category,
          purpose: botPattern.purpose,
        },
      };
    }
  }
  
  if (botIndicators.test(ua)) {
    return {
      isBot: true,
      botInfo: {
        name: 'Unknown Bot',
        category: 'Unknown',
        purpose: 'Automated requests',
      },
    };
  }
  
  return { isBot: false };
}

function parseFeatures(ua: string): string[] {
  const features: string[] = [];
  
  // HTML5 features
  if (/HTML5/.test(ua)) features.push('HTML5');
  
  // JavaScript engine
  if (/V8/.test(ua)) features.push('V8 JavaScript Engine');
  
  // Security features
  if (/SEC-/.test(ua)) features.push('Security Headers Support');
  
  // WebRTC
  if (/WebRTC/.test(ua)) features.push('WebRTC');
  
  // PWA support
  if (/ServiceWorker/.test(ua)) features.push('Service Workers');
  
  // Mobile features
  if (/Touch/.test(ua)) features.push('Touch Support');
  
  return features;
}

function parseSecurity(ua: string): SecurityInfo {
  const vulnerabilities: string[] = [];
  const privacyFlags: string[] = [];
  
  // Check for outdated browsers
  const ieMatch = ua.match(/MSIE ([0-9]+)/);
  if (ieMatch && parseInt(ieMatch[1]) < 11) {
    vulnerabilities.push('Outdated Internet Explorer - Multiple security vulnerabilities');
  }
  
  // Check for very old Chrome/Firefox
  const chromeMatch = ua.match(/Chrome\/([0-9]+)/);
  if (chromeMatch && parseInt(chromeMatch[1]) < 80) {
    vulnerabilities.push('Outdated Chrome version - May have known security issues');
  }
  
  const firefoxMatch = ua.match(/Firefox\/([0-9]+)/);
  if (firefoxMatch && parseInt(firefoxMatch[1]) < 70) {
    vulnerabilities.push('Outdated Firefox version - May have known security issues');
  }
  
  // Privacy features
  if (/DNT/.test(ua)) privacyFlags.push('Do Not Track enabled');
  if (/Privacy/.test(ua)) privacyFlags.push('Privacy mode indicators');
  
  return {
    vulnerabilities,
    privacyFlags,
  };
}

function categorizeUserAgent(browser: BrowserInfo, os: OSInfo, device: DeviceInfo, isBot: boolean): string[] {
  const categories: string[] = [];
  
  if (isBot) {
    categories.push('Bot/Crawler');
  } else {
    categories.push('Human User');
  }
  
  // Device category
  categories.push(`${device.type.charAt(0).toUpperCase() + device.type.slice(1)} Device`);
  
  // Platform category
  categories.push(`${os.platform} Platform`);
  
  // Browser family
  if (browser.vendor) {
    categories.push(`${browser.vendor} Browser`);
  }
  
  // Mobile/Desktop
  if (browser.mobile) {
    categories.push('Mobile Browser');
  } else {
    categories.push('Desktop Browser');
  }
  
  return categories;
}

// Format output
function formatOutput(results: ParsedUserAgent[], config: UserAgentConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(results, null, 2);
  }
  
  if (config.outputFormat === 'simple') {
    return formatSimpleOutput(results);
  }
  
  return formatDetailedOutput(results, config);
}

function formatSimpleOutput(results: ParsedUserAgent[]): string {
  let output = '';
  
  for (const result of results) {
    output += `${result.browser.name} ${result.browser.version} on ${result.os.name}\n`;
    output += `Device: ${result.device.type}${result.device.brand ? ` (${result.device.brand})` : ''}\n`;
    if (result.isBot && result.botInfo) {
      output += `🤖 Bot: ${result.botInfo.name} - ${result.botInfo.purpose}\n`;
    }
    output += '\n';
  }
  
  return output.trim();
}

function formatDetailedOutput(results: ParsedUserAgent[], config: UserAgentConfig): string {
  let output = '# User Agent Analysis\n\n';
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    
    if (results.length > 1) {
      output += `## User Agent #${i + 1}\n\n`;
    }
    
    if (config.showRawData) {
      output += '### Raw User Agent String\n\n';
      output += '```\n';
      output += result.original;
      output += '\n```\n\n';
    }
    
    // Bot detection
    if (result.isBot && result.botInfo) {
      output += '### 🤖 Bot Detection\n\n';
      output += `**Bot Name**: ${result.botInfo.name}\n`;
      output += `**Category**: ${result.botInfo.category}\n`;
      output += `**Purpose**: ${result.botInfo.purpose}\n\n`;
    }
    
    // Browser information
    output += '### 🌐 Browser Information\n\n';
    output += `**Name**: ${result.browser.name}\n`;
    output += `**Version**: ${result.browser.version}\n`;
    output += `**Major Version**: ${result.browser.major}\n`;
    if (result.browser.vendor) {
      output += `**Vendor**: ${result.browser.vendor}\n`;
    }
    output += `**Mobile**: ${result.browser.mobile ? 'Yes' : 'No'}\n\n`;
    
    // Operating system
    output += '### 💻 Operating System\n\n';
    output += `**Name**: ${result.os.name}\n`;
    output += `**Version**: ${result.os.version}\n`;
    output += `**Platform**: ${result.os.platform}\n`;
    if (result.os.architecture) {
      output += `**Architecture**: ${result.os.architecture}\n`;
    }
    output += '\n';
    
    // Device information
    output += '### 📱 Device Information\n\n';
    output += `**Type**: ${result.device.type}\n`;
    if (result.device.brand) {
      output += `**Brand**: ${result.device.brand}\n`;
    }
    if (result.device.model) {
      output += `**Model**: ${result.device.model}\n`;
    }
    output += '\n';
    
    // Rendering engine
    output += '### ⚙️ Rendering Engine\n\n';
    output += `**Engine**: ${result.engine.name}\n`;
    output += `**Version**: ${result.engine.version}\n\n`;
    
    // Features
    if (config.showFeatures && result.features.length > 0) {
      output += '### ✨ Detected Features\n\n';
      for (const feature of result.features) {
        output += `- ${feature}\n`;
      }
      output += '\n';
    }
    
    // Security analysis
    output += '### 🔒 Security Analysis\n\n';
    if (result.security.vulnerabilities.length > 0) {
      output += '**⚠️ Potential Vulnerabilities:**\n';
      for (const vuln of result.security.vulnerabilities) {
        output += `- ${vuln}\n`;
      }
      output += '\n';
    } else {
      output += '✅ No known vulnerabilities detected\n\n';
    }
    
    if (result.security.privacyFlags.length > 0) {
      output += '**🛡️ Privacy Features:**\n';
      for (const flag of result.security.privacyFlags) {
        output += `- ${flag}\n`;
      }
      output += '\n';
    }
    
    // Categories
    output += '### 📊 Categories\n\n';
    for (const category of result.categories) {
      output += `- ${category}\n`;
    }
    
    if (i < results.length - 1) {
      output += '\n---\n\n';
    }
  }
  
  output += '\n---\n*Analysis provided by FreeFormatHub User Agent Parser*';
  
  return output;
}

export function processUserAgent(input: string, config: UserAgentConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide a user agent string to parse'
      };
    }

    // Parse user agents from input
    const userAgents = config.bulkMode 
      ? input.split('\n').map(ua => ua.trim()).filter(ua => ua)
      : [input.trim()];

    if (userAgents.length === 0) {
      return {
        success: false,
        error: 'No valid user agent strings provided'
      };
    }

    if (userAgents.length > 20) {
      return {
        success: false,
        error: 'Maximum 20 user agent strings allowed in bulk mode'
      };
    }

    const results: ParsedUserAgent[] = [];

    for (const userAgent of userAgents) {
      if (userAgent.length > 2000) {
        results.push({
          original: userAgent,
          browser: { name: 'Invalid', version: 'N/A', major: 'N/A', mobile: false },
          os: { name: 'Invalid', version: 'N/A', platform: 'N/A' },
          device: { type: 'unknown' },
          engine: { name: 'Invalid', version: 'N/A' },
          isBot: false,
          features: [],
          security: { vulnerabilities: ['User agent string too long'], privacyFlags: [] },
          categories: ['Invalid Input'],
        });
        continue;
      }

      const parsed = parseUserAgent(userAgent);
      results.push(parsed);
    }

    const output = formatOutput(results, config);

    return {
      success: true,
      output,
      results
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse user agent'
    };
  }
}

export const USER_AGENT_PARSER_TOOL: Tool = {
  id: 'user-agent-parser',
  name: 'User Agent Parser',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'api-tools')!,
  slug: 'user-agent-parser',
  icon: '🕵️',
  keywords: ['user-agent', 'parser', 'browser', 'detection', 'os', 'device', 'bot', 'crawler', 'mobile'],
  seoTitle: 'User Agent Parser - Analyze Browser & Device Information | FreeFormatHub',
  seoDescription: 'Parse and analyze user agent strings to identify browsers, operating systems, devices, and bots. Extract detailed information about web clients.',
  description: 'Parse and analyze user agent strings to extract detailed information about browsers, operating systems, devices, and detect bots and crawlers.',
  
  examples: [
    {
      title: 'Chrome Desktop',
      input: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      output: `# User Agent Analysis

### 🌐 Browser Information

**Name**: Google Chrome
**Version**: 91.0.4472.124
**Major Version**: 91
**Vendor**: Google
**Mobile**: No

### 💻 Operating System

**Name**: Windows 10
**Version**: Unknown
**Platform**: Windows
**Architecture**: x64

### 📱 Device Information

**Type**: desktop

### ⚙️ Rendering Engine

**Engine**: WebKit
**Version**: 537.36

### 🔒 Security Analysis

✅ No known vulnerabilities detected

### 📊 Categories

- Human User
- Desktop Device
- Windows Platform
- Google Browser
- Desktop Browser

---
*Analysis provided by FreeFormatHub User Agent Parser*`,
      description: 'Parse a typical desktop Chrome browser user agent'
    },
    {
      title: 'Mobile Safari',
      input: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      output: `# User Agent Analysis

### 🌐 Browser Information

**Name**: Safari
**Version**: 604.1
**Major Version**: 604
**Vendor**: Apple
**Mobile**: Yes

### 💻 Operating System

**Name**: iOS
**Version**: 14.7.1
**Platform**: iOS

### 📱 Device Information

**Type**: mobile
**Brand**: Apple

### ⚙️ Rendering Engine

**Engine**: WebKit
**Version**: 605.1.15

### 🔒 Security Analysis

✅ No known vulnerabilities detected

### 📊 Categories

- Human User
- Mobile Device
- iOS Platform
- Apple Browser
- Mobile Browser

---
*Analysis provided by FreeFormatHub User Agent Parser*`,
      description: 'Parse an iPhone Safari user agent string'
    },
    {
      title: 'Googlebot Crawler',
      input: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      output: `# User Agent Analysis

### 🤖 Bot Detection

**Bot Name**: Googlebot
**Category**: Search Engine
**Purpose**: Web crawling and indexing

### 🌐 Browser Information

**Name**: Google Chrome
**Version**: W.X.Y.Z
**Major Version**: W
**Vendor**: Google
**Mobile**: Yes

### 💻 Operating System

**Name**: Android
**Version**: 6.0.1
**Platform**: Android

### 📱 Device Information

**Type**: mobile

### 🔒 Security Analysis

✅ No known vulnerabilities detected

### 📊 Categories

- Bot/Crawler
- Mobile Device
- Android Platform
- Google Browser
- Mobile Browser

---
*Analysis provided by FreeFormatHub User Agent Parser*`,
      description: 'Identify and analyze a search engine bot'
    }
  ],
  
  useCases: [
    'Web analytics and visitor analysis',
    'Bot and crawler detection',
    'Responsive web design testing',
    'Security monitoring and fraud detection',
    'Browser compatibility analysis',
    'Mobile vs desktop traffic analysis'
  ],
  
  faq: [
    {
      question: 'What information can be extracted from user agents?',
      answer: 'User agents contain browser name and version, operating system, device type, rendering engine, and various capabilities. Our parser also detects bots and potential security issues.'
    },
    {
      question: 'How accurate is bot detection?',
      answer: 'Our bot detection includes patterns for major search engines, social media crawlers, and common bot indicators. However, sophisticated bots may evade detection by spoofing user agents.'
    },
    {
      question: 'Can user agents be spoofed?',
      answer: 'Yes, user agents can be easily modified or spoofed. They should not be relied upon for security decisions, but are useful for analytics and content optimization.'
    },
    {
      question: 'What security vulnerabilities are detected?',
      answer: 'The tool identifies outdated browsers with known security issues, particularly old versions of Internet Explorer, Chrome, and Firefox that may have unpatched vulnerabilities.'
    },
    {
      question: 'Does the tool work with bulk analysis?',
      answer: 'Yes! Enable bulk mode to analyze up to 20 user agent strings at once. Simply enter each user agent on a separate line.'
    }
  ],
  
  commonErrors: [
    'Empty user agent string - some browsers or tools may send blank user agents',
    'Malformed user agent - truncated or corrupted strings may not parse correctly',
    'Unknown browser/OS - very new or obscure clients may not be recognized',
    'User agent too long - extremely long strings (>2000 chars) are rejected',
    'Bot misclassification - some legitimate browsers may be flagged as bots'
  ],

  relatedTools: ['dns-lookup', 'http-status-codes', 'url-parser', 'api-response-formatter']
};