import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface EncryptionKeyConfig {
  keySize: 128 | 192 | 256 | 512;
  format: 'base64url' | 'base64' | 'hex' | 'raw';
  count: number;
  includeEnvFormat: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: {
    keySize: number;
    format: string;
    count: number;
    entropyBits: number;
    generationTime: number;
    keys: Array<{
      key: string;
      envFormat?: string;
      bytes: number;
    }>;
  };
}

function generateSecureRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function bytesToRaw(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => String.fromCharCode(b)).join('');
}

function formatKeyForEnv(key: string, format: string): string {
  switch (format) {
    case 'base64url':
    case 'base64':
      return `SECRET_KEY="${key}"`;
    case 'hex':
      return `SECRET_KEY="${key}"`;
    default:
      return `SECRET_KEY="${key}"`;
  }
}

export async function generateEncryptionKeys(config: EncryptionKeyConfig): Promise<ToolResult> {
  const startTime = performance.now();

  try {
    if (config.count < 1 || config.count > 50) {
      return {
        success: false,
        error: 'Key count must be between 1 and 50'
      };
    }

    const keyBytes = Math.floor(config.keySize / 8);
    const keys: Array<{ key: string; envFormat?: string; bytes: number }> = [];
    const outputs: string[] = [];

    for (let i = 0; i < config.count; i++) {
      const randomBytes = generateSecureRandomBytes(keyBytes);

      let key: string;
      switch (config.format) {
        case 'base64url':
          key = bytesToBase64Url(randomBytes);
          break;
        case 'base64':
          key = bytesToBase64(randomBytes);
          break;
        case 'hex':
          key = bytesToHex(randomBytes);
          break;
        case 'raw':
          key = bytesToRaw(randomBytes);
          break;
        default:
          key = bytesToBase64Url(randomBytes);
      }

      const keyData = {
        key,
        bytes: keyBytes
      } as any;

      if (config.includeEnvFormat) {
        keyData.envFormat = formatKeyForEnv(key, config.format);
      }

      keys.push(keyData);
    }

    // Format output
    if (config.count === 1) {
      const singleKey = keys[0];
      if (config.includeEnvFormat) {
        outputs.push(`Generated Key:\n${singleKey.key}\n\nEnvironment File Format:\n${singleKey.envFormat}`);
      } else {
        outputs.push(singleKey.key);
      }
    } else {
      if (config.includeEnvFormat) {
        outputs.push('Generated Keys:\n');
        keys.forEach((keyData, index) => {
          outputs.push(`Key ${index + 1}: ${keyData.key}`);
        });
        outputs.push('\nEnvironment File Format:');
        keys.forEach((keyData, index) => {
          outputs.push(`# Key ${index + 1}\n${keyData.envFormat}`);
        });
      } else {
        keys.forEach((keyData, index) => {
          outputs.push(`${keyData.key}`);
        });
      }
    }

    const endTime = performance.now();
    const generationTime = Math.round((endTime - startTime) * 100) / 100;

    return {
      success: true,
      output: outputs.join('\n'),
      metadata: {
        keySize: config.keySize,
        format: config.format,
        count: config.count,
        entropyBits: config.keySize,
        generationTime,
        keys
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate encryption keys'
    };
  }
}

export const ENCRYPTION_KEY_GENERATOR_TOOL: Tool = {
  id: 'encryption-key-generator',
  name: 'Encryption Key Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!.subcategories!.find(sub => sub.id === 'encryption')!,
  slug: 'encryption-key-generator',
  icon: '🔑',
  keywords: ['encryption', 'key', 'generator', 'secret', 'random', 'base64', 'hex', 'env', 'jwt', 'api', 'security'],
  seoTitle: 'Encryption Key Generator - Generate Secure Random Keys | FreeFormatHub',
  seoDescription: 'Generate cryptographically secure encryption keys in multiple formats (Base64, Hex). Perfect for JWT secrets, API keys, and environment files.',
  description: 'Generate cryptographically secure encryption keys for JWT secrets, API keys, database encryption, and environment variables. Supports multiple formats and key sizes.',

  examples: [
    {
      title: '256-bit URL-Safe Base64 Key',
      input: 'Key Size: 256 bits, Format: URL-Safe Base64',
      output: `Generated Key:
kJ8vN2mP9qR3sT6wX0bE5dG8hK1lO4pU7yA9cF2eH6i

Environment File Format:
SECRET_KEY="kJ8vN2mP9qR3sT6wX0bE5dG8hK1lO4pU7yA9cF2eH6i"

**Metadata:**
- Key Size: 256 bits (32 bytes)
- Format: URL-Safe Base64
- Entropy: 256 bits
- Generation Time: 2.1ms`,
      description: 'Generate a 32-byte key perfect for JWT secrets and API authentication'
    },
    {
      title: 'Multiple 128-bit Hex Keys',
      input: 'Key Size: 128 bits, Format: Hex, Count: 3',
      output: `Generated Keys:
a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2
f2e1d0c9b8a796857463524110fedcba
123456789abcdef0fedcba9876543210

Environment File Format:
# Key 1
SECRET_KEY="a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2"
# Key 2
SECRET_KEY="f2e1d0c9b8a796857463524110fedcba"
# Key 3
SECRET_KEY="123456789abcdef0fedcba9876543210"

**Metadata:**
- Keys Generated: 3
- Key Size: 128 bits each
- Format: Hexadecimal
- Total Entropy: 384 bits`,
      description: 'Generate multiple keys for different environments (dev, staging, prod)'
    }
  ],

  useCases: [
    'JWT secret keys for authentication systems',
    'API keys and access tokens',
    'Database encryption keys',
    'Session secrets for web applications',
    'Environment variable secrets',
    'Encryption keys for data at rest',
    'HMAC signing keys',
    'Webhook signature verification keys'
  ],

  faq: [
    {
      question: 'What key size should I use?',
      answer: '256-bit keys are recommended for most applications as they provide excellent security. Use 128-bit for legacy systems, 512-bit for maximum security or when required by specific standards.'
    },
    {
      question: 'What\'s the difference between Base64 and URL-Safe Base64?',
      answer: 'URL-Safe Base64 replaces + with -, / with _, and removes padding (=). This makes keys safe to use in URLs, filenames, and environment variables without encoding issues.'
    },
    {
      question: 'Are these keys cryptographically secure?',
      answer: 'Yes! The tool uses the Web Crypto API\'s crypto.getRandomValues() which provides cryptographically secure pseudorandom numbers suitable for cryptographic purposes.'
    },
    {
      question: 'How should I store these keys?',
      answer: 'Store keys in environment variables, secure key management systems, or encrypted configuration files. Never commit keys to version control or share them in plain text.'
    },
    {
      question: 'Can I use these keys for production systems?',
      answer: 'Yes, these keys are suitable for production use. However, implement proper key rotation, access controls, and follow security best practices for your specific use case.'
    }
  ],

  commonErrors: [
    'Using insufficient key sizes for security requirements',
    'Storing keys in version control or unsecured locations',
    'Using wrong format for specific applications (e.g., standard Base64 in URLs)',
    'Not implementing proper key rotation policies',
    'Sharing keys through insecure channels'
  ],

  relatedTools: ['encryption-tool', 'jwt-generator', 'password-generator', 'hash-generator', 'base64-encoder']
};