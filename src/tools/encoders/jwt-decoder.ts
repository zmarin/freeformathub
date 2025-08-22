import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JwtDecoderConfig extends ToolConfig {
  validateSignature: boolean;
  showRawHeader: boolean;
  showRawPayload: boolean;
  formatJson: boolean;
}

export interface JwtParts {
  header: any;
  payload: any;
  signature: string;
  rawHeader: string;
  rawPayload: string;
}

export const JWT_DECODER_TOOL: Tool = {
  id: 'jwt-decoder',
  name: 'JWT Decoder & Validator',
  description: 'Decode and validate JSON Web Tokens (JWT) with detailed header and payload inspection.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'crypto-encoding')!,
  slug: 'jwt-decoder',
  icon: '🎫',
  keywords: ['jwt', 'json web token', 'decode', 'validate', 'auth', 'authorization', 'security', 'token'],
  seoTitle: 'Free JWT Decoder & Validator Online - Decode JSON Web Tokens',
  seoDescription: 'Decode and validate JWT tokens instantly. Free online JWT decoder with header and payload inspection, signature validation, and detailed token analysis. Privacy-first.',
  examples: [
    {
      title: 'Standard JWT Token',
      input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      output: '{\n  "header": {\n    "alg": "HS256",\n    "typ": "JWT"\n  },\n  "payload": {\n    "sub": "1234567890",\n    "name": "John Doe",\n    "iat": 1516239022\n  }\n}',
      description: 'Decode a standard JWT with header and payload'
    },
    {
      title: 'JWT with Expiration',
      input: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNjA5NDU5MjAwLCJleHAiOjE2MDk0NjI4MDB9.signature',
      output: '{\n  "header": {\n    "alg": "RS256",\n    "typ": "JWT"\n  },\n  "payload": {\n    "sub": "user123",\n    "name": "Jane Doe",\n    "iat": 1609459200,\n    "exp": 1609462800\n  }\n}',
      description: 'JWT with expiration time and issued at claims'
    }
  ],
  useCases: [
    'Debug authentication issues in web applications',
    'Inspect JWT token structure and claims',
    'Validate token expiration and issued dates',
    'Verify token format and encoding',
    'Analyze token payload for troubleshooting',
    'Educational purposes for understanding JWT structure'
  ],
  commonErrors: [
    'Invalid JWT format - must have 3 parts separated by dots',
    'Invalid Base64 encoding in header or payload',
    'Malformed JSON in header or payload sections',
    'Missing required claims like iss, sub, or exp',
    'Token signature cannot be verified without secret key',
    'Expired tokens (exp claim is in the past)'
  ],
  faq: [
    {
      question: 'What is a JWT?',
      answer: 'JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. It consists of three Base64-encoded parts: header, payload, and signature.'
    },
    {
      question: 'Can this tool verify JWT signatures?',
      answer: 'This tool can decode and inspect JWT structure but cannot verify signatures since that requires the secret key or public key used for signing, which should never be shared.'
    },
    {
      question: 'What are the three parts of a JWT?',
      answer: 'Header (contains algorithm and token type), Payload (contains claims/data), and Signature (verifies the token hasn\'t been tampered with).'
    },
    {
      question: 'What are JWT claims?',
      answer: 'Claims are statements about an entity (typically the user) and additional data. Standard claims include iss (issuer), sub (subject), aud (audience), exp (expiration), and iat (issued at).'
    },
    {
      question: 'Is it safe to decode JWTs online?',
      answer: 'For production tokens with sensitive data, use local tools. This decoder works client-side only, but avoid pasting real tokens with personal or sensitive information.'
    }
  ],
  relatedTools: [
    'base64-encoder',
    'json-formatter',
    'url-encoder',
    'hash-generator',
    'uuid-generator'
  ]
};

export function processJwt(input: string, config: JwtDecoderConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide a JWT token to decode.'
    };
  }

  try {
    const decodedJwt = decodeJwt(input.trim());
    
    if (!decodedJwt) {
      return {
        success: false,
        error: 'Invalid JWT format. JWT must have 3 parts separated by dots (header.payload.signature).'
      };
    }

    const result = formatJwtOutput(decodedJwt, config);
    
    return {
      success: true,
      output: result,
      metadata: {
        algorithm: decodedJwt.header.alg || 'unknown',
        tokenType: decodedJwt.header.typ || 'unknown',
        issuer: decodedJwt.payload.iss || 'none',
        subject: decodedJwt.payload.sub || 'none',
        audience: decodedJwt.payload.aud || 'none',
        issuedAt: decodedJwt.payload.iat ? new Date(decodedJwt.payload.iat * 1000).toISOString() : 'none',
        expiresAt: decodedJwt.payload.exp ? new Date(decodedJwt.payload.exp * 1000).toISOString() : 'none',
        isExpired: decodedJwt.payload.exp ? decodedJwt.payload.exp * 1000 < Date.now() : false,
        hasSignature: !!decodedJwt.signature
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode JWT token'
    };
  }
}

function decodeJwt(token: string): JwtParts | null {
  // Remove any whitespace
  const cleanToken = token.replace(/\s/g, '');
  
  // Split into parts
  const parts = cleanToken.split('.');
  
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format. JWT must have exactly 3 parts separated by dots.');
  }

  try {
    // Decode header
    const rawHeader = parts[0];
    const headerJson = base64UrlDecode(rawHeader);
    const header = JSON.parse(headerJson);

    // Decode payload
    const rawPayload = parts[1];
    const payloadJson = base64UrlDecode(rawPayload);
    const payload = JSON.parse(payloadJson);

    // Signature (not decoded, just stored)
    const signature = parts[2];

    return {
      header,
      payload,
      signature,
      rawHeader,
      rawPayload
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      throw new Error('Invalid JWT: Header or payload contains malformed JSON.');
    }
    throw new Error('Invalid JWT: Failed to decode Base64 data. Check for invalid characters.');
  }
}

function base64UrlDecode(str: string): string {
  // Add padding if needed
  let padded = str;
  while (padded.length % 4) {
    padded += '=';
  }
  
  // Convert Base64URL to Base64
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    throw new Error('Invalid Base64URL encoding in JWT.');
  }
}

function formatJwtOutput(jwt: JwtParts, config: JwtDecoderConfig): string {
  const sections: string[] = [];
  
  // Header section
  sections.push('=== HEADER ===');
  if (config.showRawHeader) {
    sections.push(`Raw: ${jwt.rawHeader}`);
    sections.push('');
  }
  sections.push(config.formatJson ? JSON.stringify(jwt.header, null, 2) : JSON.stringify(jwt.header));
  
  sections.push('');
  
  // Payload section
  sections.push('=== PAYLOAD ===');
  if (config.showRawPayload) {
    sections.push(`Raw: ${jwt.rawPayload}`);
    sections.push('');
  }
  sections.push(config.formatJson ? JSON.stringify(jwt.payload, null, 2) : JSON.stringify(jwt.payload));
  
  sections.push('');
  
  // Signature section
  sections.push('=== SIGNATURE ===');
  sections.push(jwt.signature || 'No signature present');
  
  // Add validation notes if requested
  if (config.validateSignature) {
    sections.push('');
    sections.push('=== VALIDATION NOTES ===');
    sections.push('⚠️  Signature verification requires the secret key or public key.');
    sections.push('⚠️  This tool can only decode and inspect JWT structure.');
    
    if (jwt.payload.exp) {
      const isExpired = jwt.payload.exp * 1000 < Date.now();
      const expDate = new Date(jwt.payload.exp * 1000).toISOString();
      sections.push(`🕒 Expires: ${expDate} ${isExpired ? '(EXPIRED)' : '(Valid)'}`);
    }
    
    if (jwt.payload.iat) {
      const issuedDate = new Date(jwt.payload.iat * 1000).toISOString();
      sections.push(`📅 Issued: ${issuedDate}`);
    }
  }
  
  return sections.join('\n');
}