import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface HashGeneratorConfig extends ToolConfig {
  algorithms: string[]; // Array of selected algorithms
  outputFormat: 'hex' | 'base64';
  includeLength: boolean;
  uppercaseHex: boolean;
}

export const HASH_GENERATOR_TOOL: Tool = {
  id: 'hash-generator',
  name: 'Hash Generator (MD5, SHA-1, SHA-256)',
  description: 'Generate cryptographic hashes using MD5, SHA-1, SHA-256, and other algorithms with multiple output formats.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!.subcategories!.find(sub => sub.id === 'hashing')!,
  slug: 'hash-generator',
  icon: '🔐',
  keywords: ['hash', 'md5', 'sha1', 'sha256', 'checksum', 'digest', 'crypto', 'security', 'integrity'],
  seoTitle: 'Free Hash Generator Online - MD5, SHA-1, SHA-256 Hash Calculator',
  seoDescription: 'Generate cryptographic hashes instantly with MD5, SHA-1, SHA-256 algorithms. Free online hash calculator with hex and Base64 output formats. Privacy-first.',
  examples: [
    {
      title: 'Simple Text Hashing',
      input: 'Hello, World!',
      output: 'MD5: 65a8e27d8879283831b664bd8b7f0ad4\nSHA-1: 0a0a9f2a6772942557ab5355d76af442f8f65e01\nSHA-256: dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f',
      description: 'Generate multiple hash types for simple text'
    },
    {
      title: 'Password Hashing',
      input: 'mySecurePassword123!',
      output: 'SHA-256: 8d23cf6c86e834a7aa6eded54c26ce2bb2e74903538c61bdd5d2197997ab2f72',
      description: 'Hash a password using SHA-256'
    },
    {
      title: 'File Integrity Check',
      input: 'The quick brown fox jumps over the lazy dog',
      output: 'MD5: 9e107d9d372bb6826bd81d3542a419d6\nSHA-256: d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
      description: 'Generate checksums for integrity verification'
    }
  ],
  useCases: [
    'Verify file integrity and detect tampering',
    'Generate password hashes for storage',
    'Create checksums for data validation',
    'Compare file versions using hash comparison',
    'Generate unique identifiers from content',
    'Implement cache keys and ETags for web development'
  ],
  commonErrors: [
    'Using MD5 for security purposes - MD5 is broken for cryptographic use',
    'Not salting passwords before hashing',
    'Comparing hashes with different algorithms',
    'Using SHA-1 for new security applications',
    'Not handling Unicode text encoding consistently',
    'Storing passwords as plain hashes without proper salting'
  ],
  faq: [
    {
      question: 'Which hash algorithm should I use?',
      answer: 'For new applications, use SHA-256 or higher. MD5 and SHA-1 are deprecated for security use but still useful for checksums and non-cryptographic purposes.'
    },
    {
      question: 'Is MD5 secure for passwords?',
      answer: 'No, MD5 is cryptographically broken and should never be used for passwords. Use bcrypt, scrypt, or Argon2 for password hashing instead.'
    },
    {
      question: 'What\'s the difference between hex and Base64 output?',
      answer: 'Hex uses 0-9 and A-F characters (longer), while Base64 uses A-Z, a-z, 0-9, +, / (shorter). Both represent the same hash data in different formats.'
    },
    {
      question: 'Can I reverse a hash to get the original data?',
      answer: 'No, cryptographic hashes are one-way functions. You cannot reverse them to get the original data, but you can verify if input matches by comparing hashes.'
    },
    {
      question: 'Why do I get different hashes for the same text?',
      answer: 'Make sure you\'re using the same algorithm and text encoding. Different algorithms or character encodings will produce different hashes.'
    }
  ],
  relatedTools: [
    'base64-encoder',
    'uuid-generator',
    'jwt-decoder',
    'password-generator',
    'checksum-validator'
  ]
};

export function processHash(input: string, config: HashGeneratorConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide text to hash.'
    };
  }

  if (!config.algorithms || config.algorithms.length === 0) {
    return {
      success: false,
      error: 'No algorithms selected. Please choose at least one hash algorithm.'
    };
  }

  try {
    const results = generateHashes(input, config);
    const output = formatHashOutput(results, config);
    
    return {
      success: true,
      output,
      metadata: {
        inputLength: input.length,
        algorithms: config.algorithms.join(', '),
        outputFormat: config.outputFormat,
        hashCount: config.algorithms.length,
        totalOutputLength: output.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate hashes'
    };
  }
}

async function generateHashes(input: string, config: HashGeneratorConfig): Promise<Record<string, string>> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const results: Record<string, string> = {};

  for (const algorithm of config.algorithms) {
    try {
      let hashBuffer: ArrayBuffer;
      
      switch (algorithm.toLowerCase()) {
        case 'md5':
          hashBuffer = await generateMD5(data);
          break;
        case 'sha-1':
        case 'sha1':
          hashBuffer = await crypto.subtle.digest('SHA-1', data);
          break;
        case 'sha-256':
        case 'sha256':
          hashBuffer = await crypto.subtle.digest('SHA-256', data);
          break;
        case 'sha-384':
        case 'sha384':
          hashBuffer = await crypto.subtle.digest('SHA-384', data);
          break;
        case 'sha-512':
        case 'sha512':
          hashBuffer = await crypto.subtle.digest('SHA-512', data);
          break;
        default:
          throw new Error(`Unsupported hash algorithm: ${algorithm}`);
      }

      const hashArray = new Uint8Array(hashBuffer);
      
      if (config.outputFormat === 'base64') {
        results[algorithm] = btoa(String.fromCharCode(...hashArray));
      } else {
        // Hex format
        const hexString = Array.from(hashArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        results[algorithm] = config.uppercaseHex ? hexString.toUpperCase() : hexString;
      }
    } catch (error) {
      results[algorithm] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  return results;
}

// MD5 implementation since it's not in Web Crypto API
async function generateMD5(data: Uint8Array): Promise<ArrayBuffer> {
  // Simple MD5 implementation for educational purposes
  // Note: This is a basic implementation - for production use, consider a proper crypto library
  
  function md5(bytes: Uint8Array): Uint8Array {
    // MD5 constants
    const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
               5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
               4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
               6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];

    const K = [
      0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
      0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
      0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
      0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
      0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
      0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
      0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
      0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
      0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
      0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
      0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
      0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
      0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
      0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
      0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
      0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ];

    // Initialize hash values
    let h0 = 0x67452301;
    let h1 = 0xefcdab89;
    let h2 = 0x98badcfe;
    let h3 = 0x10325476;

    // Pre-processing: adding padding bits
    const msgLen = bytes.length;
    const paddedLen = Math.ceil((msgLen + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLen);
    padded.set(bytes);
    padded[msgLen] = 0x80;
    
    // Append length in bits as 64-bit little-endian
    const bitLen = msgLen * 8;
    for (let i = 0; i < 8; i++) {
      padded[paddedLen - 8 + i] = (bitLen >>> (i * 8)) & 0xff;
    }

    // Process in 512-bit chunks
    for (let chunk = 0; chunk < paddedLen; chunk += 64) {
      const w = new Uint32Array(16);
      for (let i = 0; i < 16; i++) {
        w[i] = padded[chunk + i * 4] |
               (padded[chunk + i * 4 + 1] << 8) |
               (padded[chunk + i * 4 + 2] << 16) |
               (padded[chunk + i * 4 + 3] << 24);
      }

      let a = h0, b = h1, c = h2, d = h3;

      for (let i = 0; i < 64; i++) {
        let f, g;
        if (i < 16) {
          f = (b & c) | (~b & d);
          g = i;
        } else if (i < 32) {
          f = (d & b) | (~d & c);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          f = b ^ c ^ d;
          g = (3 * i + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * i) % 16;
        }

        const temp = d;
        d = c;
        c = b;
        b = (b + leftRotate((a + f + K[i] + w[g]) >>> 0, s[i])) >>> 0;
        a = temp;
      }

      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
    }

    // Produce final hash as little-endian
    const result = new Uint8Array(16);
    [h0, h1, h2, h3].forEach((h, i) => {
      result[i * 4] = h & 0xff;
      result[i * 4 + 1] = (h >>> 8) & 0xff;
      result[i * 4 + 2] = (h >>> 16) & 0xff;
      result[i * 4 + 3] = (h >>> 24) & 0xff;
    });

    return result;
  }

  function leftRotate(value: number, amount: number): number {
    return (value << amount) | (value >>> (32 - amount));
  }

  const result = md5(data);
  return result.buffer;
}

function formatHashOutput(results: Record<string, string>, config: HashGeneratorConfig): string {
  const lines: string[] = [];
  
  for (const [algorithm, hash] of Object.entries(results)) {
    const label = algorithm.toUpperCase();
    if (config.includeLength) {
      const length = hash.includes('Error:') ? 0 : hash.length;
      lines.push(`${label} (${length} chars): ${hash}`);
    } else {
      lines.push(`${label}: ${hash}`);
    }
  }
  
  if (config.algorithms.length > 1) {
    lines.push('');
    lines.push(`Generated ${config.algorithms.length} hash${config.algorithms.length > 1 ? 'es' : ''} in ${config.outputFormat.toUpperCase()} format`);
  }
  
  return lines.join('\n');
}