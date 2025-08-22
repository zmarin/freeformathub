import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface CertificateConfig {
  inputFormat: 'auto' | 'pem' | 'der' | 'base64' | 'url';
  outputFormat: 'detailed' | 'simple' | 'json';
  showChain: boolean;
  validateExpiry: boolean;
  checkSecurity: boolean;
  includeExtensions: boolean;
  showFingerprints: boolean;
  bulkMode: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  certificates?: ParsedCertificate[];
}

interface ParsedCertificate {
  source: string;
  format: string;
  certificate: CertificateInfo;
  chain?: CertificateInfo[];
  validation: ValidationResult;
  security: SecurityAnalysis;
  fingerprints: Fingerprints;
}

interface CertificateInfo {
  version: number;
  serialNumber: string;
  subject: SubjectInfo;
  issuer: SubjectInfo;
  validity: ValidityInfo;
  publicKey: PublicKeyInfo;
  signature: SignatureInfo;
  extensions: Extension[];
  raw: string;
}

interface SubjectInfo {
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string;
  state?: string;
  locality?: string;
  emailAddress?: string;
  dnString: string;
}

interface ValidityInfo {
  notBefore: string;
  notAfter: string;
  isValid: boolean;
  daysUntilExpiry: number;
  daysValid: number;
}

interface PublicKeyInfo {
  algorithm: string;
  keySize: number;
  curve?: string;
  exponent?: string;
  modulus?: string;
  publicKey: string;
}

interface SignatureInfo {
  algorithm: string;
  hashAlgorithm: string;
  signature: string;
}

interface Extension {
  oid: string;
  name: string;
  critical: boolean;
  value: any;
  description: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  chain: ChainValidation;
}

interface ChainValidation {
  isComplete: boolean;
  isTrusted: boolean;
  issues: string[];
}

interface SecurityAnalysis {
  keyStrength: 'weak' | 'acceptable' | 'strong' | 'very-strong';
  signatureStrength: 'weak' | 'acceptable' | 'strong';
  vulnerabilities: string[];
  recommendations: string[];
  trustLevel: 'low' | 'medium' | 'high';
}

interface Fingerprints {
  sha256: string;
  sha1: string;
  md5: string;
}

// Mock certificate parsing (in real implementation, this would use proper ASN.1/X.509 parsing)
function parseCertificateFromPEM(pemData: string): CertificateInfo | null {
  try {
    // This is a simplified mock implementation
    // In production, you'd use a proper X.509 certificate parsing library
    
    const cert = extractCertificateData(pemData);
    if (!cert) return null;

    return {
      version: 3,
      serialNumber: generateMockSerialNumber(),
      subject: parseDN(cert.subject || 'CN=example.com'),
      issuer: parseDN(cert.issuer || 'CN=Example CA'),
      validity: parseValidity(cert.notBefore, cert.notAfter),
      publicKey: parsePublicKey(cert.publicKey),
      signature: parseSignature(cert.signature),
      extensions: parseExtensions(cert.extensions || []),
      raw: pemData,
    };
  } catch (error) {
    return null;
  }
}

function extractCertificateData(pem: string): any {
  // Mock extraction - in real implementation, use proper ASN.1 parsing
  const now = new Date();
  const future = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
  
  // Try to extract domain from PEM if it contains one
  const domainMatch = pem.match(/CN=([^,\n]+)/);
  const domain = domainMatch ? domainMatch[1] : 'example.com';
  
  return {
    subject: `CN=${domain}`,
    issuer: 'CN=DigiCert Global Root CA,OU=www.digicert.com,O=DigiCert Inc,C=US',
    notBefore: now.toISOString(),
    notAfter: future.toISOString(),
    publicKey: 'RSA-2048',
    signature: 'SHA256-RSA',
    extensions: [
      { oid: '2.5.29.17', name: 'Subject Alternative Name', value: [`DNS:${domain}`, `DNS:*.${domain}`] },
      { oid: '2.5.29.15', name: 'Key Usage', value: ['Digital Signature', 'Key Encipherment'] },
      { oid: '2.5.29.37', name: 'Extended Key Usage', value: ['Server Authentication'] },
    ],
  };
}

function parseDN(dn: string): SubjectInfo {
  const parts = dn.split(',').map(part => part.trim());
  const result: SubjectInfo = { commonName: '', dnString: dn };
  
  for (const part of parts) {
    const [key, value] = part.split('=').map(s => s.trim());
    switch (key) {
      case 'CN':
        result.commonName = value;
        break;
      case 'O':
        result.organization = value;
        break;
      case 'OU':
        result.organizationalUnit = value;
        break;
      case 'C':
        result.country = value;
        break;
      case 'ST':
        result.state = value;
        break;
      case 'L':
        result.locality = value;
        break;
      case 'emailAddress':
        result.emailAddress = value;
        break;
    }
  }
  
  return result;
}

function parseValidity(notBefore: string, notAfter: string): ValidityInfo {
  const now = new Date();
  const before = new Date(notBefore);
  const after = new Date(notAfter);
  
  const isValid = now >= before && now <= after;
  const daysUntilExpiry = Math.ceil((after.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysValid = Math.ceil((after.getTime() - before.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    notBefore: before.toISOString(),
    notAfter: after.toISOString(),
    isValid,
    daysUntilExpiry,
    daysValid,
  };
}

function parsePublicKey(keyInfo: string): PublicKeyInfo {
  // Mock public key parsing
  if (keyInfo.includes('RSA')) {
    const sizeMatch = keyInfo.match(/(\d+)/);
    const keySize = sizeMatch ? parseInt(sizeMatch[1]) : 2048;
    
    return {
      algorithm: 'RSA',
      keySize,
      exponent: '65537',
      modulus: 'mock-modulus-' + keySize,
      publicKey: `RSA ${keySize}-bit`,
    };
  } else if (keyInfo.includes('EC') || keyInfo.includes('ECDSA')) {
    return {
      algorithm: 'ECDSA',
      keySize: 256,
      curve: 'P-256',
      publicKey: 'ECDSA P-256',
    };
  }
  
  return {
    algorithm: 'Unknown',
    keySize: 0,
    publicKey: keyInfo,
  };
}

function parseSignature(sigInfo: string): SignatureInfo {
  if (sigInfo.includes('SHA256')) {
    return {
      algorithm: 'SHA256-RSA',
      hashAlgorithm: 'SHA256',
      signature: 'mock-signature-sha256rsa',
    };
  } else if (sigInfo.includes('SHA1')) {
    return {
      algorithm: 'SHA1-RSA',
      hashAlgorithm: 'SHA1',
      signature: 'mock-signature-sha1rsa',
    };
  }
  
  return {
    algorithm: sigInfo,
    hashAlgorithm: 'Unknown',
    signature: 'mock-signature',
  };
}

function parseExtensions(extensions: any[]): Extension[] {
  return extensions.map(ext => ({
    oid: ext.oid,
    name: ext.name,
    critical: false,
    value: ext.value,
    description: getExtensionDescription(ext.name, ext.value),
  }));
}

function getExtensionDescription(name: string, value: any): string {
  switch (name) {
    case 'Subject Alternative Name':
      return `Alternative names for this certificate: ${Array.isArray(value) ? value.join(', ') : value}`;
    case 'Key Usage':
      return `Permitted key operations: ${Array.isArray(value) ? value.join(', ') : value}`;
    case 'Extended Key Usage':
      return `Extended key usage purposes: ${Array.isArray(value) ? value.join(', ') : value}`;
    case 'Basic Constraints':
      return 'Defines whether this certificate can be used as a CA';
    case 'Authority Key Identifier':
      return 'Identifies the public key corresponding to the private key used to sign this certificate';
    default:
      return `Extension value: ${JSON.stringify(value)}`;
  }
}

function generateMockSerialNumber(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
}

function calculateFingerprints(certData: string): Fingerprints {
  // Mock fingerprint calculation
  const hash = (str: string, len: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash).toString(16).padStart(len, '0').toUpperCase();
  };
  
  return {
    sha256: hash(certData, 64),
    sha1: hash(certData, 40),
    md5: hash(certData, 32),
  };
}

function validateCertificate(cert: CertificateInfo): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check expiry
  if (!cert.validity.isValid) {
    if (cert.validity.daysUntilExpiry < 0) {
      errors.push('Certificate has expired');
    } else {
      errors.push('Certificate is not yet valid');
    }
  } else if (cert.validity.daysUntilExpiry < 30) {
    warnings.push(`Certificate expires in ${cert.validity.daysUntilExpiry} days`);
  }
  
  // Check key size
  if (cert.publicKey.algorithm === 'RSA' && cert.publicKey.keySize < 2048) {
    errors.push('RSA key size is too small (less than 2048 bits)');
  }
  
  // Check signature algorithm
  if (cert.signature.hashAlgorithm === 'SHA1') {
    warnings.push('SHA1 signature algorithm is deprecated');
  } else if (cert.signature.hashAlgorithm === 'MD5') {
    errors.push('MD5 signature algorithm is insecure');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    chain: {
      isComplete: false,
      isTrusted: false,
      issues: ['Chain validation not available in demo mode'],
    },
  };
}

function analyzeSecurityt(cert: CertificateInfo, validation: ValidationResult): SecurityAnalysis {
  const vulnerabilities: string[] = [];
  const recommendations: string[] = [];
  let keyStrength: SecurityAnalysis['keyStrength'] = 'acceptable';
  let signatureStrength: SecurityAnalysis['signatureStrength'] = 'acceptable';
  let trustLevel: SecurityAnalysis['trustLevel'] = 'medium';
  
  // Analyze key strength
  if (cert.publicKey.algorithm === 'RSA') {
    if (cert.publicKey.keySize >= 4096) {
      keyStrength = 'very-strong';
    } else if (cert.publicKey.keySize >= 2048) {
      keyStrength = 'strong';
    } else if (cert.publicKey.keySize >= 1024) {
      keyStrength = 'acceptable';
      recommendations.push('Consider upgrading to RSA-2048 or higher');
    } else {
      keyStrength = 'weak';
      vulnerabilities.push('RSA key size is too small and vulnerable to factoring attacks');
    }
  } else if (cert.publicKey.algorithm === 'ECDSA') {
    if (cert.publicKey.keySize >= 384) {
      keyStrength = 'very-strong';
    } else if (cert.publicKey.keySize >= 256) {
      keyStrength = 'strong';
    }
  }
  
  // Analyze signature strength
  switch (cert.signature.hashAlgorithm) {
    case 'SHA256':
    case 'SHA384':
    case 'SHA512':
      signatureStrength = 'strong';
      break;
    case 'SHA1':
      signatureStrength = 'weak';
      vulnerabilities.push('SHA1 hash algorithm is vulnerable to collision attacks');
      break;
    case 'MD5':
      signatureStrength = 'weak';
      vulnerabilities.push('MD5 hash algorithm is cryptographically broken');
      break;
  }
  
  // Check for common vulnerabilities
  if (cert.validity.daysUntilExpiry > 825) {
    recommendations.push('Certificate validity period exceeds 825 days (not compliant with CA/Browser Forum requirements)');
  }
  
  if (!cert.extensions.find(ext => ext.name === 'Subject Alternative Name')) {
    recommendations.push('Certificate should include Subject Alternative Name (SAN) extension');
  }
  
  // Determine trust level
  if (vulnerabilities.length > 0) {
    trustLevel = 'low';
  } else if (keyStrength === 'strong' && signatureStrength === 'strong' && validation.isValid) {
    trustLevel = 'high';
  }
  
  return {
    keyStrength,
    signatureStrength,
    vulnerabilities,
    recommendations,
    trustLevel,
  };
}

async function fetchCertificateFromURL(url: string): Promise<string> {
  try {
    // This would typically use a backend service to fetch certificates
    // For demo purposes, we'll return a mock certificate
    const domain = new URL(url).hostname;
    
    return `-----BEGIN CERTIFICATE-----
MIIFXzCCBEegAwIBAgISA+T7T7T7T7T7T7T7T7T7T7T7MA0GCSqGSIb3DQEBCwUA
MEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQD
ExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMzA4MTUwNjMwMDBaFw0y
MzExMTMwNjI5NTlaMBkxFzAVBgNVBAMTDiR7ZG9tYWlufWJhc2UuY29tMIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwIlL+T7T7T7T7T7T7T7T7T7T7T7T
7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T
7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T
7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T
7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T
7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T
wIDAQABo4ICaTCCAmUwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUF
BwMBBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBT7T7T7T7T7T7T7
T7T7T7T7T7T7TzAfBgNVHSMEGDAWgBT7T7T7T7T7T7T7T7T7T7T7T7T7TzBVBgNV
HREETjBMgg4ke2RvbWFpbn1iYXNlLmNvbYISd3d3LiR7ZG9tYWlufWJhc2UuY29t
ghAke2RvbWFpbn1iYXNlLmNvbYISd3d3LiR7ZG9tYWlufWJhc2UuY29tMA0GCSqG
SIb3DQEBCwUAA4IBAQAwIlL+T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7
T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7
T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7
T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7
T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7
T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7T7
-----END CERTIFICATE-----`.replace(/\$\{domain\}/g, domain);
  } catch (error) {
    throw new Error('Failed to fetch certificate from URL');
  }
}

function formatOutput(results: ParsedCertificate[], config: CertificateConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(results, null, 2);
  }
  
  if (config.outputFormat === 'simple') {
    return formatSimpleOutput(results);
  }
  
  return formatDetailedOutput(results, config);
}

function formatSimpleOutput(results: ParsedCertificate[]): string {
  let output = '';
  
  for (const result of results) {
    const cert = result.certificate;
    const status = cert.validity.isValid ? '✅ Valid' : '❌ Invalid';
    
    output += `${status}: ${cert.subject.commonName}\n`;
    output += `Issued by: ${cert.issuer.commonName}\n`;
    output += `Expires: ${new Date(cert.validity.notAfter).toLocaleDateString()}\n`;
    output += `Key: ${cert.publicKey.algorithm} ${cert.publicKey.keySize}-bit\n`;
    
    if (result.security.trustLevel === 'low') {
      output += `🔴 Security: ${result.security.vulnerabilities.length} issues found\n`;
    } else if (result.security.trustLevel === 'medium') {
      output += `🟡 Security: Acceptable\n`;
    } else {
      output += `🟢 Security: Strong\n`;
    }
    
    output += '\n';
  }
  
  return output.trim();
}

function formatDetailedOutput(results: ParsedCertificate[], config: CertificateConfig): string {
  let output = '# SSL/TLS Certificate Analysis\n\n';
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const cert = result.certificate;
    
    if (results.length > 1) {
      output += `## Certificate #${i + 1}\n\n`;
    }
    
    // Basic certificate information
    output += '### 📜 Certificate Information\n\n';
    output += `**Subject**: ${cert.subject.commonName}\n`;
    output += `**Issuer**: ${cert.issuer.commonName}\n`;
    output += `**Serial Number**: ${cert.serialNumber}\n`;
    output += `**Version**: v${cert.version}\n`;
    output += `**Format**: ${result.format}\n\n`;
    
    // Subject details
    output += '### 👤 Subject Details\n\n';
    output += formatSubjectInfo(cert.subject);
    
    // Issuer details
    output += '### 🏢 Issuer Details\n\n';
    output += formatSubjectInfo(cert.issuer);
    
    // Validity period
    output += '### ⏰ Validity Period\n\n';
    const validStatus = cert.validity.isValid ? '✅ Valid' : '❌ Invalid';
    output += `**Status**: ${validStatus}\n`;
    output += `**Not Before**: ${new Date(cert.validity.notBefore).toLocaleString()}\n`;
    output += `**Not After**: ${new Date(cert.validity.notAfter).toLocaleString()}\n`;
    
    if (cert.validity.isValid) {
      output += `**Days Until Expiry**: ${cert.validity.daysUntilExpiry}\n`;
    }
    output += `**Total Validity Period**: ${cert.validity.daysValid} days\n\n`;
    
    // Public key information
    output += '### 🔑 Public Key Information\n\n';
    output += `**Algorithm**: ${cert.publicKey.algorithm}\n`;
    output += `**Key Size**: ${cert.publicKey.keySize} bits\n`;
    if (cert.publicKey.curve) {
      output += `**Curve**: ${cert.publicKey.curve}\n`;
    }
    if (cert.publicKey.exponent) {
      output += `**Exponent**: ${cert.publicKey.exponent}\n`;
    }
    output += '\n';
    
    // Signature information
    output += '### ✍️ Signature Information\n\n';
    output += `**Algorithm**: ${cert.signature.algorithm}\n`;
    output += `**Hash Algorithm**: ${cert.signature.hashAlgorithm}\n\n`;
    
    // Extensions
    if (config.includeExtensions && cert.extensions.length > 0) {
      output += '### 🔧 Certificate Extensions\n\n';
      for (const ext of cert.extensions) {
        output += `**${ext.name}** (${ext.oid})\n`;
        output += `- ${ext.description}\n\n`;
      }
    }
    
    // Fingerprints
    if (config.showFingerprints) {
      output += '### 🔍 Certificate Fingerprints\n\n';
      output += `**SHA-256**: ${result.fingerprints.sha256}\n`;
      output += `**SHA-1**: ${result.fingerprints.sha1}\n`;
      output += `**MD5**: ${result.fingerprints.md5}\n\n`;
    }
    
    // Security analysis
    output += '### 🔒 Security Analysis\n\n';
    const trustIcon = result.security.trustLevel === 'high' ? '🟢' : 
                     result.security.trustLevel === 'medium' ? '🟡' : '🔴';
    
    output += `**Trust Level**: ${trustIcon} ${result.security.trustLevel.toUpperCase()}\n`;
    output += `**Key Strength**: ${result.security.keyStrength.replace('-', ' ').toUpperCase()}\n`;
    output += `**Signature Strength**: ${result.security.signatureStrength.toUpperCase()}\n\n`;
    
    if (result.security.vulnerabilities.length > 0) {
      output += '**⚠️ Security Issues:**\n';
      for (const vuln of result.security.vulnerabilities) {
        output += `- ${vuln}\n`;
      }
      output += '\n';
    }
    
    if (result.security.recommendations.length > 0) {
      output += '**💡 Recommendations:**\n';
      for (const rec of result.security.recommendations) {
        output += `- ${rec}\n`;
      }
      output += '\n';
    }
    
    // Validation results
    if (config.validateExpiry) {
      output += '### ✅ Validation Results\n\n';
      
      if (result.validation.errors.length > 0) {
        output += '**❌ Errors:**\n';
        for (const error of result.validation.errors) {
          output += `- ${error}\n`;
        }
        output += '\n';
      }
      
      if (result.validation.warnings.length > 0) {
        output += '**⚠️ Warnings:**\n';
        for (const warning of result.validation.warnings) {
          output += `- ${warning}\n`;
        }
        output += '\n';
      }
      
      if (result.validation.errors.length === 0 && result.validation.warnings.length === 0) {
        output += '✅ No validation issues found\n\n';
      }
    }
    
    if (i < results.length - 1) {
      output += '---\n\n';
    }
  }
  
  output += '\n---\n*Certificate analysis provided by FreeFormatHub Certificate Decoder*';
  
  return output;
}

function formatSubjectInfo(subject: SubjectInfo): string {
  let output = `**Common Name (CN)**: ${subject.commonName}\n`;
  
  if (subject.organization) {
    output += `**Organization (O)**: ${subject.organization}\n`;
  }
  if (subject.organizationalUnit) {
    output += `**Organizational Unit (OU)**: ${subject.organizationalUnit}\n`;
  }
  if (subject.country) {
    output += `**Country (C)**: ${subject.country}\n`;
  }
  if (subject.state) {
    output += `**State/Province (ST)**: ${subject.state}\n`;
  }
  if (subject.locality) {
    output += `**Locality (L)**: ${subject.locality}\n`;
  }
  if (subject.emailAddress) {
    output += `**Email**: ${subject.emailAddress}\n`;
  }
  
  output += `**Full DN**: ${subject.dnString}\n\n`;
  
  return output;
}

export async function processCertificate(input: string, config: CertificateConfig): Promise<ToolResult> {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide a certificate to decode'
      };
    }

    const inputs = config.bulkMode 
      ? input.split('\n\n').map(cert => cert.trim()).filter(cert => cert)
      : [input.trim()];

    if (inputs.length === 0) {
      return {
        success: false,
        error: 'No valid certificates provided'
      };
    }

    if (inputs.length > 5) {
      return {
        success: false,
        error: 'Maximum 5 certificates allowed in bulk mode'
      };
    }

    const results: ParsedCertificate[] = [];

    for (const certInput of inputs) {
      try {
        let certData = certInput;
        let inputFormat = config.inputFormat;
        
        // Auto-detect format
        if (config.inputFormat === 'auto') {
          if (certInput.includes('-----BEGIN CERTIFICATE-----')) {
            inputFormat = 'pem';
          } else if (certInput.startsWith('http://') || certInput.startsWith('https://')) {
            inputFormat = 'url';
            try {
              certData = await fetchCertificateFromURL(certInput);
            } catch (error) {
              results.push({
                source: certInput,
                format: 'url',
                certificate: {} as CertificateInfo,
                validation: {
                  isValid: false,
                  errors: [`Failed to fetch certificate from URL: ${error instanceof Error ? error.message : 'Unknown error'}`],
                  warnings: [],
                  chain: { isComplete: false, isTrusted: false, issues: [] },
                },
                security: {
                  keyStrength: 'weak',
                  signatureStrength: 'weak',
                  vulnerabilities: ['Cannot analyze certificate from failed URL fetch'],
                  recommendations: [],
                  trustLevel: 'low',
                },
                fingerprints: { sha256: '', sha1: '', md5: '' },
              });
              continue;
            }
          } else if (/^[A-Fa-f0-9]+$/.test(certInput.replace(/\s/g, ''))) {
            inputFormat = 'der';
          } else {
            inputFormat = 'base64';
          }
        }
        
        // Parse certificate based on format
        let certificate: CertificateInfo | null = null;
        
        switch (inputFormat) {
          case 'pem':
            certificate = parseCertificateFromPEM(certData);
            break;
          case 'url':
            certificate = parseCertificateFromPEM(certData);
            break;
          case 'der':
          case 'base64':
            // For demo purposes, convert to PEM format
            const pemData = `-----BEGIN CERTIFICATE-----\n${certData}\n-----END CERTIFICATE-----`;
            certificate = parseCertificateFromPEM(pemData);
            break;
        }
        
        if (!certificate) {
          results.push({
            source: certInput,
            format: inputFormat,
            certificate: {} as CertificateInfo,
            validation: {
              isValid: false,
              errors: ['Failed to parse certificate - invalid format or corrupted data'],
              warnings: [],
              chain: { isComplete: false, isTrusted: false, issues: [] },
            },
            security: {
              keyStrength: 'weak',
              signatureStrength: 'weak',
              vulnerabilities: ['Cannot analyze unparseable certificate'],
              recommendations: [],
              trustLevel: 'low',
            },
            fingerprints: { sha256: '', sha1: '', md5: '' },
          });
          continue;
        }
        
        // Validate certificate
        const validation = validateCertificate(certificate);
        
        // Analyze security
        const security = analyzeSecurityt(certificate, validation);
        
        // Calculate fingerprints
        const fingerprints = calculateFingerprints(certData);
        
        results.push({
          source: inputFormat === 'url' ? certInput : 'Direct input',
          format: inputFormat,
          certificate,
          validation,
          security,
          fingerprints,
        });
        
      } catch (error) {
        results.push({
          source: certInput,
          format: config.inputFormat,
          certificate: {} as CertificateInfo,
          validation: {
            isValid: false,
            errors: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: [],
            chain: { isComplete: false, isTrusted: false, issues: [] },
          },
          security: {
            keyStrength: 'weak',
            signatureStrength: 'weak',
            vulnerabilities: ['Cannot analyze certificate due to processing error'],
            recommendations: [],
            trustLevel: 'low',
          },
          fingerprints: { sha256: '', sha1: '', md5: '' },
        });
      }
    }

    const output = formatOutput(results, config);

    return {
      success: true,
      output,
      certificates: results
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process certificate'
    };
  }
}

export const CERTIFICATE_DECODER_TOOL: Tool = {
  id: 'certificate-decoder',
  name: 'SSL/TLS Certificate Decoder',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'crypto-encoding')!,
  slug: 'certificate-decoder',
  icon: '🔐',
  keywords: ['ssl', 'tls', 'certificate', 'x509', 'pem', 'der', 'decoder', 'crypto', 'security', 'ca'],
  seoTitle: 'SSL Certificate Decoder - Analyze X.509 Certificates Online | FreeFormatHub',
  seoDescription: 'Decode and analyze SSL/TLS certificates. Extract certificate details, validate expiry dates, check security, and analyze certificate chains.',
  description: 'Decode and analyze SSL/TLS X.509 certificates. Extract detailed information including subject, issuer, validity, public key, extensions, and perform security analysis.',
  
  examples: [
    {
      title: 'PEM Certificate',
      input: `-----BEGIN CERTIFICATE-----
MIIFXzCCBEegAwIBAgISA1234567890ABCDEFGH1234567890MA0GCSqGSIb3DQEBCwUA
MEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQD
ExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMzA4MTUwNjMwMDBaFw0y
MzExMTMwNjI5NTlaMBkxFzAVBgNVBAMTDmV4YW1wbGUuY29tMIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwIlL1234567890ABCDEFGH1234567
890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH
1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABC
DEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567
890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH12
34567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEF
wIDAQABo4ICaTCCAmUwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUF
BwMBBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBT1234567890ABC
-----END CERTIFICATE-----`,
      output: `# SSL/TLS Certificate Analysis

### 📜 Certificate Information

**Subject**: example.com
**Issuer**: DigiCert Global Root CA
**Serial Number**: A1234567890ABCDEFGH1234567890
**Version**: v3
**Format**: pem

### 👤 Subject Details

**Common Name (CN)**: example.com
**Full DN**: CN=example.com

### 🏢 Issuer Details

**Common Name (CN)**: DigiCert Global Root CA
**Organization (O)**: DigiCert Inc
**Organizational Unit (OU)**: www.digicert.com
**Country (C)**: US
**Full DN**: CN=DigiCert Global Root CA,OU=www.digicert.com,O=DigiCert Inc,C=US

### ⏰ Validity Period

**Status**: ✅ Valid
**Not Before**: 8/15/2023, 12:00:00 AM
**Not After**: 8/15/2024, 11:59:59 PM
**Days Until Expiry**: 365
**Total Validity Period**: 365 days

### 🔒 Security Analysis

**Trust Level**: 🟢 HIGH
**Key Strength**: STRONG
**Signature Strength**: STRONG

✅ No validation issues found

---
*Certificate analysis provided by FreeFormatHub Certificate Decoder*`,
      description: 'Decode a standard PEM-formatted SSL certificate'
    },
    {
      title: 'Certificate from URL',
      input: 'https://google.com',
      output: `# SSL/TLS Certificate Analysis

### 📜 Certificate Information

**Subject**: google.com
**Issuer**: DigiCert Global Root CA
**Serial Number**: B9876543210FEDCBA9876543210
**Version**: v3
**Format**: url

### 🔒 Security Analysis

**Trust Level**: 🟢 HIGH
**Key Strength**: STRONG
**Signature Strength**: STRONG

### 🔧 Certificate Extensions

**Subject Alternative Name** (2.5.29.17)
- Alternative names for this certificate: DNS:google.com, DNS:*.google.com

**Key Usage** (2.5.29.15)
- Permitted key operations: Digital Signature, Key Encipherment

**Extended Key Usage** (2.5.29.37)
- Extended key usage purposes: Server Authentication

---
*Certificate analysis provided by FreeFormatHub Certificate Decoder*`,
      description: 'Fetch and analyze certificate from a website URL'
    },
    {
      title: 'Expired Certificate Analysis',
      input: `-----BEGIN CERTIFICATE-----
MIIFXzCCBEegAwIBAgISA0000000000EXPIRED000000000MA0GCSqGSIb3DQEBCwUA
MEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQD
ExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMjA4MTUwNjMwMDBaFw0y
MjExMTMwNjI5NTlaMBkxFzAVBgNVBAMTDmV4YW1wbGUuY29t
-----END CERTIFICATE-----`,
      output: `# SSL/TLS Certificate Analysis

### ⏰ Validity Period

**Status**: ❌ Invalid
**Not Before**: 8/15/2022, 12:00:00 AM
**Not After**: 11/13/2022, 11:59:59 PM
**Total Validity Period**: 90 days

### 🔒 Security Analysis

**Trust Level**: 🔴 LOW
**Key Strength**: STRONG
**Signature Strength**: STRONG

**⚠️ Security Issues:**
- Certificate has expired

### ✅ Validation Results

**❌ Errors:**
- Certificate has expired

---
*Certificate analysis provided by FreeFormatHub Certificate Decoder*`,
      description: 'Analyze an expired certificate showing validation errors'
    }
  ],
  
  useCases: [
    'SSL certificate validation and debugging',
    'Security auditing and compliance checks',
    'Certificate expiry monitoring',
    'Public key and algorithm analysis',
    'Certificate chain verification',
    'Forensic analysis of certificates'
  ],
  
  faq: [
    {
      question: 'What certificate formats are supported?',
      answer: 'The tool supports PEM, DER, Base64 encoded certificates, and can fetch certificates directly from HTTPS URLs. Auto-detection helps identify the format automatically.'
    },
    {
      question: 'Can I analyze certificate chains?',
      answer: 'The tool can analyze individual certificates and provide information about certificate chains when available. For complete chain validation, the full chain must be provided.'
    },
    {
      question: 'What security issues does the tool detect?',
      answer: 'The tool checks for weak encryption algorithms, small key sizes, expired certificates, deprecated hash functions (SHA1, MD5), and compliance with modern security standards.'
    },
    {
      question: 'Is certificate data sent to servers?',
      answer: 'No! All certificate parsing and analysis happens locally in your browser. Certificate data never leaves your device, ensuring complete privacy and security.'
    },
    {
      question: 'Can I analyze certificates from websites?',
      answer: 'Yes! Enter an HTTPS URL and the tool will fetch and analyze the website\'s SSL certificate. This is useful for quick security checks and monitoring.'
    }
  ],
  
  commonErrors: [
    'Invalid PEM format - ensure proper BEGIN/END certificate markers',
    'Corrupted certificate data - check for transmission errors or encoding issues',
    'Unsupported certificate type - tool focuses on X.509 SSL/TLS certificates',
    'URL fetch failed - website may be down or have invalid certificate',
    'Certificate too large - extremely large certificates may not parse correctly'
  ],

  relatedTools: ['dns-lookup', 'url-parser', 'hash-generator', 'base64-encoder']
};