import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface UuidGeneratorConfig extends ToolConfig {
  version: 'v1' | 'v4' | 'v7' | 'nil';
  count: number;
  format: 'standard' | 'compact' | 'uppercase' | 'braces';
  includeTimestamp: boolean;
}

export const UUID_GENERATOR_TOOL: Tool = {
  id: 'uuid-generator',
  name: 'UUID/GUID Generator',
  description: 'Generate UUID (Universally Unique Identifier) and GUID strings in various formats including v1, v4, and v7.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'generators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'generators')!.subcategories!.find(sub => sub.id === 'identifiers')!,
  slug: 'uuid-generator',
  icon: '🆔',
  keywords: ['uuid', 'guid', 'identifier', 'unique', 'random', 'v1', 'v4', 'v7', 'generator'],
  seoTitle: 'Free UUID/GUID Generator Online - Generate UUID v1, v4, v7',
  seoDescription: 'Generate UUID and GUID identifiers instantly. Free online UUID generator with v1, v4, v7 support and multiple output formats. Privacy-first.',
  examples: [
    {
      title: 'UUID v4 (Random)',
      input: 'Generate v4 UUID',
      output: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      description: 'Random UUID suitable for most applications'
    },
    {
      title: 'UUID v1 (Timestamp)',
      input: 'Generate v1 UUID',
      output: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      description: 'Timestamp-based UUID with MAC address'
    },
    {
      title: 'Multiple UUIDs',
      input: 'Generate 5 UUIDs',
      output: 'f47ac10b-58cc-4372-a567-0e02b2c3d479\n550e8400-e29b-41d4-a716-446655440000\n6ba7b814-9dad-11d1-80b4-00c04fd430c8',
      description: 'Generate multiple UUIDs at once'
    }
  ],
  useCases: [
    'Generate unique identifiers for database records',
    'Create session IDs for web applications',
    'Generate API keys and request tracking IDs',
    'Create unique filenames and folder names',
    'Generate correlation IDs for distributed systems',
    'Create test data with unique identifiers'
  ],
  commonErrors: [
    'Using UUID v1 in privacy-sensitive applications (contains MAC address)',
    'Not storing UUIDs in binary format for database efficiency',
    'Assuming UUID collision will never happen (extremely rare but possible)',
    'Using UUIDs as security tokens without additional entropy',
    'Comparing UUIDs as strings instead of using proper comparison',
    'Not considering UUID version for specific use cases'
  ],
  faq: [
    {
      question: 'What\'s the difference between UUID versions?',
      answer: 'v1 uses timestamp + MAC address (traceable), v4 is random (most common), v7 is timestamp-based but more privacy-friendly than v1.'
    },
    {
      question: 'Are UUIDs truly unique?',
      answer: 'UUIDs have extremely low collision probability. v4 UUIDs have about 1 in 5.3 billion chance of collision when generating 1 billion UUIDs.'
    },
    {
      question: 'Should I use UUID or GUID?',
      answer: 'UUID and GUID are essentially the same thing. GUID is Microsoft\'s term, UUID is the RFC standard term. They\'re interchangeable.'
    },
    {
      question: 'Which UUID version should I use?',
      answer: 'Use v4 for general purposes (random), v1 if you need time ordering but don\'t mind MAC address exposure, v7 for time-ordered with better privacy.'
    },
    {
      question: 'Can I use UUIDs as database primary keys?',
      answer: 'Yes, but consider performance implications. UUIDs are larger than integers and can cause index fragmentation. Use binary storage format when possible.'
    }
  ],
  relatedTools: [
    'hash-generator',
    'password-generator',
    'random-string-generator',
    'base64-encoder',
    'jwt-decoder'
  ]
};

export function processUuid(input: string, config: UuidGeneratorConfig): ToolResult {
  try {
    const uuids = generateUuids(config);
    const output = formatUuidOutput(uuids, config);
    
    return {
      success: true,
      output,
      metadata: {
        version: config.version,
        count: config.count,
        format: config.format,
        totalLength: output.length,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate UUIDs'
    };
  }
}

function generateUuids(config: UuidGeneratorConfig): string[] {
  const uuids: string[] = [];
  
  for (let i = 0; i < config.count; i++) {
    switch (config.version) {
      case 'v1':
        uuids.push(generateUuidV1());
        break;
      case 'v4':
        uuids.push(generateUuidV4());
        break;
      case 'v7':
        uuids.push(generateUuidV7());
        break;
      case 'nil':
        uuids.push('00000000-0000-0000-0000-000000000000');
        break;
      default:
        throw new Error(`Unsupported UUID version: ${config.version}`);
    }
  }
  
  return uuids;
}

function generateUuidV4(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateUuidV1(): string {
  // Simplified v1 implementation
  // Note: This doesn't use actual MAC address for privacy
  const timestamp = Date.now();
  const clockSeq = Math.floor(Math.random() * 0x4000);
  const node = Math.floor(Math.random() * 0xffffffffffff);
  
  // Convert timestamp to UUID v1 format (100-nanosecond intervals since UUID epoch)
  const uuidTime = (timestamp * 10000) + 0x01b21dd213814000;
  
  const timeLow = (uuidTime & 0xffffffff).toString(16).padStart(8, '0');
  const timeMid = ((uuidTime >>> 32) & 0xffff).toString(16).padStart(4, '0');
  const timeHigh = (((uuidTime >>> 48) & 0x0fff) | 0x1000).toString(16).padStart(4, '0');
  const clockSeqHigh = ((clockSeq >>> 8) | 0x80).toString(16).padStart(2, '0');
  const clockSeqLow = (clockSeq & 0xff).toString(16).padStart(2, '0');
  const nodeStr = node.toString(16).padStart(12, '0');
  
  return `${timeLow}-${timeMid}-${timeHigh}-${clockSeqHigh}${clockSeqLow}-${nodeStr}`;
}

function generateUuidV7(): string {
  // UUID v7 implementation (timestamp-based with random data)
  const timestamp = Date.now();
  const randomA = Math.floor(Math.random() * 0x1000); // 12 bits
  const randomB = Math.floor(Math.random() * 0x3fffffffffffffff); // 62 bits
  
  const timestampHex = timestamp.toString(16).padStart(12, '0');
  const randomAHex = ((randomA & 0x0fff) | 0x7000).toString(16).padStart(4, '0');
  const randomBHex = ((randomB >>> 32) | 0x80000000).toString(16).padStart(8, '0') + 
                     (randomB & 0xffffffff).toString(16).padStart(8, '0');
  
  return `${timestampHex.slice(0, 8)}-${timestampHex.slice(8, 12)}-${randomAHex}-${randomBHex.slice(0, 4)}-${randomBHex.slice(4, 16)}`;
}

function formatUuidOutput(uuids: string[], config: UuidGeneratorConfig): string {
  let formattedUuids = uuids.map(uuid => {
    switch (config.format) {
      case 'standard':
        return uuid.toLowerCase();
      case 'compact':
        return uuid.replace(/-/g, '').toLowerCase();
      case 'uppercase':
        return uuid.toUpperCase();
      case 'braces':
        return `{${uuid.toLowerCase()}}`;
      default:
        return uuid.toLowerCase();
    }
  });
  
  let output = formattedUuids.join('\n');
  
  if (config.includeTimestamp && config.count <= 10) {
    const timestamp = new Date().toISOString();
    output += `\n\n// Generated at: ${timestamp}`;
    output += `\n// Version: UUID ${config.version.toUpperCase()}`;
    output += `\n// Format: ${config.format}`;
    output += `\n// Count: ${config.count}`;
  }
  
  return output;
}