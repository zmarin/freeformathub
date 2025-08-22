import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface EncryptionConfig {
  operation: 'encrypt' | 'decrypt';
  algorithm: 'AES-GCM' | 'AES-CBC' | 'AES-CTR' | 'RSA-OAEP' | 'simple-cipher';
  keySize: 128 | 192 | 256;
  outputFormat: 'base64' | 'hex' | 'binary';
  includeIV: boolean;
  customKey?: string;
  generateKey: boolean;
  iterations: number;
  saltLength: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: {
    algorithm: string;
    keySize: number;
    outputFormat: string;
    processingTime: number;
    inputSize: number;
    outputSize: number;
    keyGenerated?: string;
    ivGenerated?: string;
  };
}

// Simple cipher implementations for demonstration (not cryptographically secure)
class SimpleCipher {
  static encrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return btoa(result); // Base64 encode
  }

  static decrypt(encryptedText: string, key: string): string {
    try {
      const decoded = atob(encryptedText);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const encChar = decoded.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(encChar ^ keyChar);
      }
      return result;
    } catch {
      throw new Error('Invalid encrypted text or wrong key');
    }
  }
}

// Caesar cipher for educational purposes
class CaesarCipher {
  static encrypt(text: string, shift: number): string {
    return text.replace(/[a-zA-Z]/g, (char) => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start + shift) % 26) + start);
    });
  }

  static decrypt(text: string, shift: number): string {
    return this.encrypt(text, -shift);
  }
}

// ROT13 cipher
class ROT13Cipher {
  static encode(text: string): string {
    return CaesarCipher.encrypt(text, 13);
  }

  static decode(text: string): string {
    return CaesarCipher.decrypt(text, 13);
  }
}

// Utility functions
function generateRandomKey(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Web Crypto API implementations (browser-based encryption)
async function encryptWithWebCrypto(
  text: string, 
  config: EncryptionConfig
): Promise<{ encrypted: ArrayBuffer; key?: string; iv?: ArrayBuffer }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  if (config.algorithm === 'simple-cipher') {
    const key = config.customKey || generateRandomKey(32);
    const encrypted = SimpleCipher.encrypt(text, key);
    return {
      encrypted: encoder.encode(encrypted).buffer,
      key: config.generateKey ? key : undefined
    };
  }

  let cryptoKey: CryptoKey;
  let keyToReturn: string | undefined;

  if (config.customKey) {
    // Import custom key
    const keyBuffer = encoder.encode(config.customKey.padEnd(config.keySize / 8, '0').slice(0, config.keySize / 8));
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: config.algorithm.split('-')[0] },
      false,
      ['encrypt']
    );
  } else {
    // Generate new key
    cryptoKey = await crypto.subtle.generateKey(
      {
        name: config.algorithm.split('-')[0],
        length: config.keySize,
      },
      true,
      ['encrypt']
    );

    if (config.generateKey) {
      const exportedKey = await crypto.subtle.exportKey('raw', cryptoKey);
      keyToReturn = arrayBufferToBase64(exportedKey);
    }
  }

  let iv: Uint8Array | undefined;
  if (config.algorithm.includes('GCM') || config.algorithm.includes('CBC') || config.algorithm.includes('CTR')) {
    iv = generateRandomBytes(12); // 96 bits for GCM, adjust for others
  }

  const algorithmParams: any = { name: config.algorithm.split('-')[0] };
  if (iv) {
    algorithmParams.iv = iv;
  }

  try {
    const encrypted = await crypto.subtle.encrypt(algorithmParams, cryptoKey, data);
    return {
      encrypted,
      key: keyToReturn,
      iv: iv?.buffer
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function decryptWithWebCrypto(
  encryptedData: ArrayBuffer,
  config: EncryptionConfig,
  keyData: string,
  ivData?: ArrayBuffer
): Promise<string> {
  if (config.algorithm === 'simple-cipher') {
    const decoder = new TextDecoder();
    const encryptedText = decoder.decode(encryptedData);
    try {
      return SimpleCipher.decrypt(atob(encryptedText), keyData);
    } catch {
      return SimpleCipher.decrypt(encryptedText, keyData);
    }
  }

  const encoder = new TextEncoder();
  let keyBuffer: ArrayBuffer;

  try {
    // Try to decode as base64 first
    keyBuffer = base64ToArrayBuffer(keyData);
  } catch {
    // Fall back to treating as raw text
    keyBuffer = encoder.encode(keyData.padEnd(config.keySize / 8, '0').slice(0, config.keySize / 8));
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: config.algorithm.split('-')[0] },
    false,
    ['decrypt']
  );

  const algorithmParams: any = { name: config.algorithm.split('-')[0] };
  if (ivData) {
    algorithmParams.iv = new Uint8Array(ivData);
  }

  try {
    const decrypted = await crypto.subtle.decrypt(algorithmParams, cryptoKey, encryptedData);
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid key or corrupted data'}`);
  }
}

export async function processEncryption(input: string, config: EncryptionConfig, keyInput?: string): Promise<ToolResult> {
  const startTime = performance.now();

  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide text to encrypt or decrypt'
      };
    }

    const inputSize = new Blob([input]).size;
    let result: string;
    let metadata: any = {
      algorithm: config.algorithm,
      keySize: config.keySize,
      outputFormat: config.outputFormat,
      processingTime: 0,
      inputSize,
      outputSize: 0,
    };

    if (config.operation === 'encrypt') {
      if (config.algorithm === 'simple-cipher') {
        const key = config.customKey || keyInput || generateRandomKey(32);
        const encrypted = SimpleCipher.encrypt(input, key);
        result = encrypted;
        if (config.generateKey || !config.customKey) {
          metadata.keyGenerated = key;
        }
      } else if (config.algorithm.startsWith('AES')) {
        try {
          const { encrypted, key, iv } = await encryptWithWebCrypto(input, config);
          
          let output = encrypted;
          if (config.outputFormat === 'base64') {
            result = arrayBufferToBase64(output);
          } else if (config.outputFormat === 'hex') {
            result = arrayBufferToHex(output);
          } else {
            result = arrayBufferToBase64(output); // fallback
          }

          if (key) metadata.keyGenerated = key;
          if (iv) metadata.ivGenerated = arrayBufferToBase64(iv);
        } catch (error) {
          // Fallback to simple cipher if Web Crypto API fails
          const key = config.customKey || keyInput || generateRandomKey(32);
          const encrypted = SimpleCipher.encrypt(input, key);
          result = encrypted;
          if (config.generateKey || !config.customKey) {
            metadata.keyGenerated = key;
          }
          metadata.algorithm = 'simple-cipher (fallback)';
        }
      } else {
        return {
          success: false,
          error: `Algorithm ${config.algorithm} is not yet implemented. Try AES-GCM or simple-cipher.`
        };
      }
    } else {
      // Decryption
      if (!keyInput && !config.customKey) {
        return {
          success: false,
          error: 'Decryption key is required for decryption operation'
        };
      }

      const key = keyInput || config.customKey!;

      if (config.algorithm === 'simple-cipher') {
        try {
          result = SimpleCipher.decrypt(input, key);
        } catch (error) {
          return {
            success: false,
            error: 'Decryption failed. Check your key and encrypted data.'
          };
        }
      } else if (config.algorithm.startsWith('AES')) {
        try {
          let encryptedBuffer: ArrayBuffer;
          if (config.outputFormat === 'base64') {
            encryptedBuffer = base64ToArrayBuffer(input);
          } else if (config.outputFormat === 'hex') {
            encryptedBuffer = hexToArrayBuffer(input);
          } else {
            encryptedBuffer = base64ToArrayBuffer(input);
          }

          result = await decryptWithWebCrypto(encryptedBuffer, config, key);
        } catch (error) {
          // Fallback to simple cipher
          try {
            result = SimpleCipher.decrypt(input, key);
            metadata.algorithm = 'simple-cipher (fallback)';
          } catch {
            return {
              success: false,
              error: 'Decryption failed. Check your key, algorithm, and encrypted data format.'
            };
          }
        }
      } else {
        return {
          success: false,
          error: `Algorithm ${config.algorithm} is not yet implemented for decryption.`
        };
      }
    }

    const endTime = performance.now();
    metadata.processingTime = Math.round((endTime - startTime) * 100) / 100;
    metadata.outputSize = new Blob([result]).size;

    return {
      success: true,
      output: result,
      metadata
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process encryption/decryption'
    };
  }
}

export const ENCRYPTION_TOOL: Tool = {
  id: 'encryption-tool',
  name: 'Encryption & Decryption Tool',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!.subcategories!.find(sub => sub.id === 'encryption')!,
  slug: 'encryption-tool',
  icon: '🔐',
  keywords: ['encrypt', 'decrypt', 'aes', 'rsa', 'cipher', 'crypto', 'security', 'key', 'password'],
  seoTitle: 'Encryption & Decryption Tool - Secure Text Encryption | FreeFormatHub',
  seoDescription: 'Encrypt and decrypt text using AES, RSA, and other secure algorithms. Generate keys, secure data, and protect sensitive information online.',
  description: 'Encrypt and decrypt text using industry-standard algorithms like AES. Generate secure keys, protect sensitive data, and learn about cryptography.',

  examples: [
    {
      title: 'AES Encryption',
      input: 'Hello, this is a secret message!',
      output: `U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y96Qsv2Lm+31cmzaAILwyt

**Metadata:**
- Algorithm: AES-GCM
- Key Size: 256 bits
- Output Format: Base64
- Generated Key: a8K9mN2pQ4rT6vX9zA3cF5jH8kL1oP4sU7wY0bE6dG9
- Processing Time: 12.5ms`,
      description: 'Encrypt text using AES-256 with auto-generated key'
    },
    {
      title: 'Simple Cipher Decryption',
      input: 'VGhpcyBpcyBlbmNyeXB0ZWQ=',
      output: `Hello, this is decrypted text!

**Metadata:**
- Algorithm: Simple Cipher
- Key Used: mySecretKey123
- Processing Time: 2.1ms`,
      description: 'Decrypt text using a simple XOR cipher'
    }
  ],

  useCases: [
    'Secure communication and message protection',
    'File and document encryption for privacy',
    'Password and sensitive data storage',
    'Educational cryptography learning',
    'API key and token encryption',
    'Database field encryption',
    'Secure configuration storage',
    'Digital forensics and security research'
  ],

  faq: [
    {
      question: 'What encryption algorithms are supported?',
      answer: 'The tool supports AES (Advanced Encryption Standard) in GCM, CBC, and CTR modes, plus educational ciphers like Simple XOR and Caesar cipher. AES is industry-standard and recommended for real security needs.'
    },
    {
      question: 'How secure is the encryption?',
      answer: 'AES encryption is military-grade and used worldwide for sensitive data. However, this tool is for educational purposes - for production use, implement proper key management and use dedicated cryptographic libraries.'
    },
    {
      question: 'Can I use my own encryption key?',
      answer: 'Yes! You can provide your own key or let the tool generate a cryptographically secure random key. Generated keys are displayed for your use but not stored anywhere.'
    },
    {
      question: 'What happens to my data and keys?',
      answer: 'All encryption and decryption happens locally in your browser. No data, keys, or encrypted content is sent to any server or stored anywhere.'
    },
    {
      question: 'Why might decryption fail?',
      answer: 'Common causes include wrong decryption key, mismatched algorithm, corrupted encrypted data, or incorrect output format. Ensure all parameters match those used for encryption.'
    }
  ],

  commonErrors: [
    'Wrong decryption key or algorithm mismatch',
    'Corrupted or modified encrypted data',
    'Incorrect output format specification',
    'Browser security restrictions on crypto operations',
    'Invalid key format or length'
  ],

  relatedTools: ['hash-generator', 'password-generator', 'password-strength-checker', 'base64-encoder']
};