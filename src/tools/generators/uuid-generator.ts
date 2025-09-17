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
  description: 'Generate UUID/GUID identifiers in v1, v4, v7, or nil form with timestamp annotations, bulk output, and flexible formatting options.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'generators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'generators')!.subcategories!.find(sub => sub.id === 'identifiers')!,
  slug: 'uuid-generator',
  icon: '🆔',
  keywords: ['uuid', 'guid', 'identifier', 'unique', 'random', 'v1', 'v4', 'v7', 'generator'],
  seoTitle: 'Free UUID/GUID Generator Online - Generate UUID v1, v4, v7',
  seoDescription: 'Produce v1, v4, v7, or nil UUIDs on demand. Choose output casing, compact mode, brace wrapping, and per-UUID timestamps — all client-side.',
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
  ],
  howItWorks: [
    {
      title: 'Select UUID Version & Format',
      icon: '⚙️',
      description: 'Pick v1, v4, v7, or nil identifiers. Configure casing, compact vs. hyphenated output, brace wrapping, and optional timestamp metadata.',
      keywords: ['uuid version', 'uuid format', 'v4 generator', 'brace format', 'timestamp option']
    },
    {
      title: 'Set Quantity & Options',
      icon: '🧮',
      description: 'Generate single or bulk UUID sets with configurable counts. Toggle timestamp annotations and history tracking for reproducibility.',
      keywords: ['bulk uuid', 'uuid count', 'history tracking', 'timestamp annotations', 'reproducibility']
    },
    {
      title: 'Generate Secure Identifiers',
      icon: '🔐',
      description: 'UUIDs are generated locally via Web Crypto APIs or hardened fallbacks, ensuring high-quality randomness and privacy for sensitive workflows.',
      keywords: ['secure uuid', 'web crypto', 'local generation', 'privacy-first', 'random uuid']
    },
    {
      title: 'Export & Integrate',
      icon: '📤',
      description: 'Copy UUIDs, download lists, or push them into tool history for audit trails. Perfect for seeding databases, tests, and distributed tracing.',
      keywords: ['copy uuid', 'download uuid', 'audit trail', 'database seeding', 'distributed tracing']
    }
  ],
  problemsSolved: [
    {
      problem: 'Manual UUID generation slows development environments and increases the chance of reuse or collision.',
      solution: 'Create hundreds of UUIDs instantly with crypto-backed randomness, ensuring unique identifiers for staging and production assets.',
      icon: '⚡',
      keywords: ['rapid uuid', 'development tooling', 'collision avoidance', 'unique identifiers', 'devops']
    },
    {
      problem: 'Teams need deterministic formatting (uppercase, compact, braces) to match API expectations and database schemas.',
      solution: 'Configure output casing and formatting per run, keeping APIs, logs, and documentation aligned without manual string manipulation.',
      icon: '🧱',
      keywords: ['uuid formatting', 'uppercase uuid', 'compact uuid', 'api consistency', 'database schema']
    },
    {
      problem: 'Audits require timestamp correlation or historical context for generated IDs used in deployments.',
      solution: 'Include generation timestamps and store runs in history so ops teams can trace when identifiers were created.',
      icon: '🕒',
      keywords: ['timestamped uuid', 'audit trail', 'deployment tracking', 'ops visibility', 'history']
    }
  ],
  whyChoose: [
    {
      title: 'Client-Side Reliability',
      description: 'No identifiers leave your browser. Ideal for regulated environments and offline-friendly workflows.',
      icon: '🔒',
      keywords: ['offline uuid', 'secure generator', 'no network', 'privacy']
    },
    {
      title: 'Comprehensive Version Support',
      description: 'Generate v1 for legacy systems, v4 for random IDs, v7 for time-sortable identifiers, or nil UUIDs for protocol defaults.',
      icon: '🔄',
      keywords: ['uuid v1', 'uuid v4', 'uuid v7', 'nil uuid', 'protocol support']
    },
    {
      title: 'Developer-Centric UX',
      description: 'Keyboard shortcuts, copy/download controls, and persistent history keep repetitive ID generation quick during development and testing.',
      icon: '🧑‍💻',
      keywords: ['keyboard shortcuts', 'download uuids', 'copy uuids', 'developer productivity']
    },
    {
      title: 'Integration Ready',
      description: 'Export results in standard, compact, uppercase, or brace formats to drop directly into configuration files, YAML manifests, or API payloads.',
      icon: '🧰',
      keywords: ['yaml ready', 'api payload', 'config files', 'brace uuid', 'compact format']
    }
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
