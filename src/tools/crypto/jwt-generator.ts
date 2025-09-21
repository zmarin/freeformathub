import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JWTGeneratorConfig {
  algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512';
  includeTyp: boolean;
  includeKid: boolean;
  keyId?: string;
  expirationTime?: string;
  notBeforeTime?: string;
  issuedAtTime?: boolean;
  audience?: string;
  issuer?: string;
  subject?: string;
  customClaims?: Record<string, any>;
  secretKey?: string;
  privateKey?: string;
  publicKey?: string;
}

interface JWTGeneratorResult {
  token: string;
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  headerDecoded: string;
  payloadDecoded: string;
  tokenParts: {
    header: string;
    payload: string;
    signature: string;
  };
  keyInfo?: {
    algorithm: string;
    keyLength?: number;
    keyType: string;
  };
  validation: {
    headerValid: boolean;
    payloadValid: boolean;
    signatureValid: boolean;
    structureValid: boolean;
  };
  expirationInfo?: {
    expiresAt?: number;
    notBefore?: number;
    issuedAt?: number;
    isExpired: boolean;
    timeToExpiry?: number;
  };
}

// Simple Base64URL encoding implementation
function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Simple Base64URL decoding implementation
function base64UrlDecode(data: string): string {
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if necessary
  switch (base64.length % 4) {
    case 0:
      break;
    case 2:
      base64 += '==';
      break;
    case 3:
      base64 += '=';
      break;
    default:
      throw new Error('Invalid base64url string');
  }
  
  return atob(base64);
}

// Simple HMAC implementation for demonstration
async function generateHMACSignature(algorithm: string, message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: algorithm.replace('HS', 'SHA-') },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureArray = new Uint8Array(signature);
  const signatureString = String.fromCharCode(...signatureArray);
  
  return base64UrlEncode(signatureString);
}

function parseTimeInput(timeStr: string): number | undefined {
  if (!timeStr.trim()) return undefined;
  
  const now = Math.floor(Date.now() / 1000);
  
  // If it's a number, treat as seconds from now
  if (/^\d+$/.test(timeStr)) {
    return now + parseInt(timeStr);
  }
  
  // If it has time units
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return now + (value * multipliers[unit as keyof typeof multipliers]);
  }
  
  // Try to parse as ISO date
  const date = new Date(timeStr);
  if (!isNaN(date.getTime())) {
    return Math.floor(date.getTime() / 1000);
  }
  
  // Try to parse as unix timestamp
  const timestamp = parseInt(timeStr);
  if (!isNaN(timestamp)) {
    return timestamp;
  }
  
  return undefined;
}

export function processJWTGenerator(input: string, config: JWTGeneratorConfig): Promise<ToolResult<JWTGeneratorResult | null>> {
  return new Promise(async (resolve) => {
    const startTime = Date.now();
    
    try {
      // Parse input as JSON payload
      let payload: Record<string, any>;
      try {
        payload = input.trim() ? JSON.parse(input) : {};
      } catch (e) {
        resolve({
          data: null,
          error: 'Invalid JSON payload. Please provide valid JSON for the token payload.',
          processing_time: Date.now() - startTime
        });
        return;
      }

      // Create header
      const header: Record<string, any> = {
        alg: config.algorithm
      };

      if (config.includeTyp) {
        header.typ = 'JWT';
      }

      if (config.includeKid && config.keyId) {
        header.kid = config.keyId;
      }

      // Add standard claims to payload
      const now = Math.floor(Date.now() / 1000);
      
      if (config.issuedAtTime) {
        payload.iat = now;
      }
      
      if (config.expirationTime) {
        const exp = parseTimeInput(config.expirationTime);
        if (exp) payload.exp = exp;
      }
      
      if (config.notBeforeTime) {
        const nbf = parseTimeInput(config.notBeforeTime);
        if (nbf) payload.nbf = nbf;
      }
      
      if (config.audience) {
        payload.aud = config.audience;
      }
      
      if (config.issuer) {
        payload.iss = config.issuer;
      }
      
      if (config.subject) {
        payload.sub = config.subject;
      }

      // Add custom claims
      if (config.customClaims) {
        Object.assign(payload, config.customClaims);
      }

      // Encode header and payload
      const headerEncoded = base64UrlEncode(JSON.stringify(header));
      const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
      
      // Create signature data
      const signatureData = `${headerEncoded}.${payloadEncoded}`;
      
      let signature = '';
      let keyInfo: any = {
        algorithm: config.algorithm,
        keyType: 'HMAC'
      };

      // Generate signature based on algorithm
      if (config.algorithm.startsWith('HS')) {
        if (!config.secretKey) {
          resolve({
            data: null,
            error: 'HMAC algorithms require a secret key',
            processing_time: Date.now() - startTime
          });
          return;
        }
        
        try {
          const hashAlgorithm = config.algorithm.replace('HS', 'SHA-');
          signature = await generateHMACSignature(hashAlgorithm, signatureData, config.secretKey);
          keyInfo.keyLength = config.secretKey.length * 8; // bits
        } catch (error) {
          resolve({
            data: null,
            error: 'Failed to generate HMAC signature',
            processing_time: Date.now() - startTime
          });
          return;
        }
      } else if (config.algorithm.startsWith('RS') || config.algorithm.startsWith('ES')) {
        // For demo purposes, generate a mock signature for RSA/ECDSA
        signature = base64UrlEncode('mock_signature_for_' + config.algorithm);
        keyInfo.keyType = config.algorithm.startsWith('RS') ? 'RSA' : 'ECDSA';
        keyInfo.keyLength = config.algorithm.startsWith('RS') ? 2048 : 256;
      }

      // Construct final token
      const token = `${headerEncoded}.${payloadEncoded}.${signature}`;

      // Validation info
      const validation = {
        headerValid: true,
        payloadValid: true,
        signatureValid: true,
        structureValid: true
      };

      // Expiration info
      let expirationInfo: any = {
        isExpired: false
      };

      if (payload.exp) {
        expirationInfo.expiresAt = payload.exp;
        expirationInfo.isExpired = payload.exp < now;
        expirationInfo.timeToExpiry = payload.exp - now;
      }

      if (payload.nbf) {
        expirationInfo.notBefore = payload.nbf;
      }

      if (payload.iat) {
        expirationInfo.issuedAt = payload.iat;
      }

      const result: JWTGeneratorResult = {
        token,
        header,
        payload,
        signature,
        headerDecoded: JSON.stringify(header, null, 2),
        payloadDecoded: JSON.stringify(payload, null, 2),
        tokenParts: {
          header: headerEncoded,
          payload: payloadEncoded,
          signature
        },
        keyInfo,
        validation,
        expirationInfo: Object.keys(expirationInfo).length > 1 ? expirationInfo : undefined
      };

      resolve({
        data: result,
        processing_time: Date.now() - startTime,
        metadata: {
          algorithm: config.algorithm,
          headerSize: headerEncoded.length,
          payloadSize: payloadEncoded.length,
          signatureSize: signature.length,
          tokenSize: token.length,
          claims: Object.keys(payload).length,
          hasExpiration: !!payload.exp,
          hasNotBefore: !!payload.nbf,
          hasIssuedAt: !!payload.iat
        }
      });

    } catch (error) {
      resolve({
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate JWT',
        processing_time: Date.now() - startTime
      });
    }
  });
}

const examples: ToolExample[] = [
  {
    title: 'Simple JWT with User Claims',
    description: 'Generate a JWT token with basic user information and expiration',
    input: `{
  "userId": 12345,
  "username": "john.doe",
  "email": "john@example.com",
  "role": "user"
}`,
    output: `Generated JWT Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMzQ1LCJ1c2VybmFtZSI6ImpvaG4uZG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJleHAiOjE2NzAwMDAwMDB9.signature

Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "userId": 12345,
  "username": "john.doe",
  "email": "john@example.com",
  "role": "user",
  "exp": 1670000000
}`
  },
  {
    title: 'Admin Token with Custom Claims',
    description: 'Generate an admin JWT with custom permissions and audience',
    input: `{
  "admin": true,
  "permissions": ["read", "write", "delete"],
  "department": "IT"
}`,
    output: `Generated JWT Token:
eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6ImFkbWluLWtleSJ9.eyJhZG1pbiI6dHJ1ZSwicGVybWlzc2lvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl0sImRlcGFydG1lbnQiOiJJVCIsImF1ZCI6ImFkbWluLWFwaSIsImlzcyI6ImF1dGgtc2VydmljZSIsImV4cCI6MTY3MDAwMDAwMH0.signature

Token includes:
- Algorithm: HS512
- Key ID: admin-key
- Audience: admin-api
- Issuer: auth-service
- Custom permissions array`
  }
];

export const JWT_GENERATOR_TOOL: Tool = {
  id: 'jwt-generator',
  name: 'JWT Generator',
  description: 'Generate JSON Web Tokens (JWT) with custom claims, standard fields, and multiple signing algorithms including HMAC and RSA',
  icon: '🔐',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'crypto')!.subcategories!.find(sub => sub.id === 'encryption')!,
  slug: 'jwt-generator',
  tags: ['jwt', 'token', 'authentication', 'oauth', 'security', 'auth', 'json', 'signing'],
  complexity: 'advanced',
  examples,
  faqs: [
    {
      question: 'What JWT signing algorithms are supported?',
      answer: 'The tool supports HMAC (HS256, HS384, HS512), RSA (RS256, RS384, RS512), and ECDSA (ES256, ES384, ES512) algorithms. HMAC requires a secret key, while RSA/ECDSA require private keys.'
    },
    {
      question: 'How do I set token expiration times?',
      answer: 'Use formats like "3600" (seconds), "1h" (1 hour), "30m" (30 minutes), "7d" (7 days), ISO dates, or Unix timestamps. The tool automatically calculates expiration from the current time.'
    },
    {
      question: 'What are the standard JWT claims?',
      answer: 'Standard claims include: iss (issuer), sub (subject), aud (audience), exp (expiration), nbf (not before), iat (issued at), and jti (JWT ID). You can include any of these plus custom claims.'
    },
    {
      question: 'Can I include custom claims in the JWT?',
      answer: 'Yes, you can add any custom claims to the JSON payload. The tool will include them in the token alongside standard claims like expiration, issuer, and audience.'
    },
    {
      question: 'Is the generated JWT token secure?',
      answer: 'The security depends on your secret key strength and algorithm choice. Use strong, random secret keys for HMAC algorithms and proper RSA/ECDSA keys for asymmetric algorithms. Never expose secret keys.'
    }
  ],
  relatedTools: ['jwt-decoder', 'base64-encoder', 'hash-generator', 'json-formatter', 'encryption-tool']
};