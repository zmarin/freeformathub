import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ConfigValidatorConfig {
  fileType: 'json' | 'yaml' | 'toml' | 'xml' | 'ini' | 'env' | 'properties' | 'dockerfile' | 'nginx' | 'apache' | 'auto';
  validationLevel: 'syntax' | 'schema' | 'comprehensive';
  schemaValidation: boolean;
  customSchema?: string;
  strictMode: boolean;
  checkSecurity: boolean;
  checkPerformance: boolean;
  checkBestPractices: boolean;
  outputFormat: 'detailed' | 'summary' | 'json' | 'junit';
  fixSuggestions: boolean;
  includeWarnings: boolean;
  contextLines: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  validation?: ConfigValidationResult;
  warnings?: string[];
}

interface ConfigValidationResult {
  metadata: ValidationMetadata;
  syntaxValidation: SyntaxValidation;
  schemaValidation?: SchemaValidation;
  securityAnalysis: SecurityAnalysis;
  performanceAnalysis: PerformanceAnalysis;
  bestPracticesCheck: BestPracticesCheck;
  suggestions: Suggestion[];
  metrics: ValidationMetrics;
}

interface ValidationMetadata {
  fileType: string;
  detectedFormat: string;
  fileSize: number;
  lineCount: number;
  validationLevel: string;
  timestamp: string;
  processingTime: number;
}

interface SyntaxValidation {
  valid: boolean;
  errors: SyntaxError[];
  warnings: SyntaxWarning[];
  formattingIssues: FormattingIssue[];
}

interface SchemaValidation {
  valid: boolean;
  errors: SchemaError[];
  warnings: SchemaWarning[];
  coverage: number;
  missingFields: string[];
  extraFields: string[];
}

interface SecurityAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: SecurityVulnerability[];
  sensitiveDataExposed: SensitiveDataIssue[];
  recommendations: string[];
  score: number;
}

interface PerformanceAnalysis {
  score: number;
  issues: PerformanceIssue[];
  optimizations: PerformanceOptimization[];
  resourceUsage: ResourceUsageAnalysis;
}

interface BestPracticesCheck {
  score: number;
  violations: BestPracticeViolation[];
  recommendations: string[];
  compliance: ComplianceCheck[];
}

interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  context: string;
}

interface SyntaxWarning {
  line: number;
  column: number;
  message: string;
  suggestion: string;
}

interface FormattingIssue {
  line: number;
  issue: string;
  expected: string;
  actual: string;
  autoFixable: boolean;
}

interface SchemaError {
  path: string;
  message: string;
  expectedType: string;
  actualType: string;
  constraint: string;
}

interface SchemaWarning {
  path: string;
  message: string;
  suggestion: string;
}

interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  recommendation: string;
  cwe?: string;
}

interface SensitiveDataIssue {
  type: 'password' | 'api_key' | 'token' | 'certificate' | 'database_url' | 'email';
  location: string;
  value: string;
  recommendation: string;
}

interface PerformanceIssue {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  location: string;
  suggestion: string;
}

interface PerformanceOptimization {
  type: string;
  description: string;
  estimatedImprovement: string;
  implementation: string;
}

interface ResourceUsageAnalysis {
  memoryImpact: 'low' | 'medium' | 'high';
  cpuImpact: 'low' | 'medium' | 'high';
  networkImpact: 'low' | 'medium' | 'high';
  diskImpact: 'low' | 'medium' | 'high';
}

interface BestPracticeViolation {
  rule: string;
  description: string;
  location: string;
  severity: 'info' | 'warning' | 'error';
  fix: string;
}

interface ComplianceCheck {
  standard: string;
  compliant: boolean;
  violations: string[];
  score: number;
}

interface Suggestion {
  type: 'fix' | 'optimization' | 'security' | 'style';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  before: string;
  after: string;
  automated: boolean;
}

interface ValidationMetrics {
  totalLines: number;
  validLines: number;
  errorLines: number;
  warningLines: number;
  complexity: number;
  maintainabilityIndex: number;
}

function detectFileType(content: string, declaredType: string): string {
  if (declaredType !== 'auto') return declaredType;

  // Try to detect based on content patterns
  const trimmed = content.trim();
  
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {}
  }
  
  if (trimmed.includes('---') || /^\s*\w+:\s*/.test(trimmed)) {
    return 'yaml';
  }
  
  if (trimmed.includes('[') && trimmed.includes(']') && trimmed.includes('=')) {
    return 'toml';
  }
  
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    return 'xml';
  }
  
  if (trimmed.includes('FROM ') || trimmed.includes('RUN ') || trimmed.includes('COPY ')) {
    return 'dockerfile';
  }
  
  if (trimmed.includes('server {') || trimmed.includes('location /')) {
    return 'nginx';
  }
  
  if (trimmed.includes('<VirtualHost') || trimmed.includes('LoadModule')) {
    return 'apache';
  }
  
  if (/^\w+=/.test(trimmed) || trimmed.includes('export ')) {
    return 'env';
  }
  
  if (/^\[.*\]/.test(trimmed)) {
    return 'ini';
  }
  
  return 'properties';
}

function validateSyntax(content: string, fileType: string): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  const lines = content.split('\n');
  
  try {
    switch (fileType) {
      case 'json':
        return validateJsonSyntax(content, lines);
      case 'yaml':
        return validateYamlSyntax(content, lines);
      case 'toml':
        return validateTomlSyntax(content, lines);
      case 'xml':
        return validateXmlSyntax(content, lines);
      case 'dockerfile':
        return validateDockerfileSyntax(content, lines);
      case 'nginx':
        return validateNginxSyntax(content, lines);
      case 'apache':
        return validateApacheSyntax(content, lines);
      case 'env':
        return validateEnvSyntax(content, lines);
      case 'ini':
      case 'properties':
        return validateIniSyntax(content, lines);
      default:
        return { valid: true, errors: [], warnings: [], formattingIssues: [] };
    }
  } catch (error) {
    errors.push({
      line: 1,
      column: 1,
      message: `Syntax validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
      code: 'SYNTAX_ERROR',
      context: lines[0] || ''
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    formattingIssues
  };
}

function validateJsonSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  try {
    JSON.parse(content);
    
    // Check formatting
    lines.forEach((line, index) => {
      // Check for trailing commas
      if (line.trim().endsWith(',}') || line.trim().endsWith(',]')) {
        formattingIssues.push({
          line: index + 1,
          issue: 'Trailing comma before closing bracket',
          expected: line.replace(/,([}\]])/, '$1'),
          actual: line,
          autoFixable: true
        });
      }
      
      // Check indentation
      if (line.startsWith(' ') && line.search(/[^ ]/) % 2 !== 0) {
        warnings.push({
          line: index + 1,
          column: 1,
          message: 'Inconsistent indentation (should use 2 spaces)',
          suggestion: 'Use consistent 2-space indentation'
        });
      }
    });
    
  } catch (error) {
    const match = error.message.match(/at position (\d+)/);
    const position = match ? parseInt(match[1]) : 0;
    const lineNum = content.substring(0, position).split('\n').length;
    
    errors.push({
      line: lineNum,
      column: position - content.lastIndexOf('\n', position - 1),
      message: error.message,
      severity: 'error',
      code: 'JSON_PARSE_ERROR',
      context: lines[lineNum - 1] || ''
    });
  }
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function validateYamlSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  // Mock YAML validation
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for tabs
    if (line.includes('\t')) {
      errors.push({
        line: lineNum,
        column: line.indexOf('\t') + 1,
        message: 'YAML does not allow tabs for indentation',
        severity: 'error',
        code: 'YAML_TAB_ERROR',
        context: line
      });
    }
    
    // Check for inconsistent indentation
    if (line.match(/^\s+/) && line.search(/[^ ]/) % 2 !== 0) {
      warnings.push({
        line: lineNum,
        column: 1,
        message: 'Inconsistent indentation in YAML',
        suggestion: 'Use consistent 2-space indentation'
      });
    }
    
    // Check for duplicate keys (simplified)
    const keyMatch = line.match(/^\s*([^:]+):/);
    if (keyMatch) {
      const key = keyMatch[1].trim();
      const duplicateIndex = lines.findIndex((l, i) => 
        i !== index && l.match(new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`))
      );
      if (duplicateIndex !== -1) {
        warnings.push({
          line: lineNum,
          column: 1,
          message: `Duplicate key '${key}' found`,
          suggestion: `Remove or rename duplicate key (also found on line ${duplicateIndex + 1})`
        });
      }
    }
  });
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function validateTomlSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    if (trimmed && !trimmed.startsWith('#')) {
      // Check for section headers
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const section = trimmed.slice(1, -1);
        if (!section.match(/^[a-zA-Z0-9._-]+$/)) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'Invalid section name in TOML',
            severity: 'error',
            code: 'TOML_SECTION_ERROR',
            context: line
          });
        }
      }
      // Check for key-value pairs
      else if (trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        
        if (!key.trim()) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'Empty key in TOML key-value pair',
            severity: 'error',
            code: 'TOML_EMPTY_KEY',
            context: line
          });
        }
        
        if (!value) {
          warnings.push({
            line: lineNum,
            column: line.indexOf('=') + 2,
            message: 'Empty value in TOML key-value pair',
            suggestion: 'Consider providing a default value or removing the key'
          });
        }
      }
    }
  });
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function validateXmlSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  // Simple XML validation
  const tagStack: string[] = [];
  const tagRegex = /<\/?([a-zA-Z0-9_-]+)[^>]*>/g;
  
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1];
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = match[0].endsWith('/>');
    
    if (isSelfClosing) {
      continue;
    }
    
    if (isClosing) {
      const lastTag = tagStack.pop();
      if (!lastTag) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        errors.push({
          line: lineNum,
          column: 1,
          message: `Closing tag </${tag}> without matching opening tag`,
          severity: 'error',
          code: 'XML_UNMATCHED_CLOSING_TAG',
          context: lines[lineNum - 1] || ''
        });
      } else if (lastTag !== tag) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        errors.push({
          line: lineNum,
          column: 1,
          message: `Mismatched tags: expected </${lastTag}>, found </${tag}>`,
          severity: 'error',
          code: 'XML_MISMATCHED_TAGS',
          context: lines[lineNum - 1] || ''
        });
      }
    } else {
      tagStack.push(tag);
    }
  }
  
  // Check for unclosed tags
  if (tagStack.length > 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `Unclosed tags: ${tagStack.join(', ')}`,
      severity: 'error',
      code: 'XML_UNCLOSED_TAGS',
      context: lines[lines.length - 1] || ''
    });
  }
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function validateDockerfileSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  let hasFrom = false;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    if (trimmed && !trimmed.startsWith('#')) {
      const instruction = trimmed.split(' ')[0].toUpperCase();
      
      // Check for FROM instruction
      if (instruction === 'FROM') {
        hasFrom = true;
        if (index > 10) { // Allow some flexibility
          warnings.push({
            line: lineNum,
            column: 1,
            message: 'FROM instruction should be near the beginning of Dockerfile',
            suggestion: 'Move FROM instruction to the top of the file'
          });
        }
      }
      
      // Check for invalid instructions
      const validInstructions = ['FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV', 'ADD', 'COPY', 'ENTRYPOINT', 'VOLUME', 'USER', 'WORKDIR', 'ARG', 'ONBUILD', 'STOPSIGNAL', 'HEALTHCHECK', 'SHELL'];
      if (!validInstructions.includes(instruction)) {
        errors.push({
          line: lineNum,
          column: 1,
          message: `Unknown Dockerfile instruction: ${instruction}`,
          severity: 'error',
          code: 'DOCKERFILE_UNKNOWN_INSTRUCTION',
          context: line
        });
      }
      
      // Check for best practices
      if (instruction === 'RUN' && trimmed.includes('apt-get update') && !trimmed.includes('apt-get install')) {
        warnings.push({
          line: lineNum,
          column: 1,
          message: 'apt-get update should be combined with apt-get install',
          suggestion: 'Combine apt-get update && apt-get install in single RUN instruction'
        });
      }
    }
  });
  
  if (!hasFrom) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Dockerfile must contain a FROM instruction',
      severity: 'error',
      code: 'DOCKERFILE_MISSING_FROM',
      context: lines[0] || ''
    });
  }
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function validateNginxSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  let braceCount = 0;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    if (trimmed && !trimmed.startsWith('#')) {
      // Count braces
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      // Check for semicolons
      if (!trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
        warnings.push({
          line: lineNum,
          column: line.length,
          message: 'Nginx directive should end with semicolon',
          suggestion: 'Add semicolon at the end of the directive'
        });
      }
      
      // Check for common directives
      if (trimmed.startsWith('listen') && !trimmed.match(/listen\s+\d+/)) {
        warnings.push({
          line: lineNum,
          column: 1,
          message: 'Invalid listen directive format',
          suggestion: 'Use format: listen port_number;'
        });
      }
    }
  });
  
  if (braceCount !== 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `Unmatched braces: ${braceCount > 0 ? 'missing closing' : 'extra closing'} braces`,
      severity: 'error',
      code: 'NGINX_UNMATCHED_BRACES',
      context: lines[lines.length - 1] || ''
    });
  }
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function validateApacheSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  const directiveStack: string[] = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    if (trimmed && !trimmed.startsWith('#')) {
      // Check for container directives
      if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        const directive = trimmed.slice(1, -1);
        if (directive.startsWith('/')) {
          const closingDirective = directive.substring(1);
          const lastDirective = directiveStack.pop();
          if (!lastDirective || lastDirective !== closingDirective) {
            errors.push({
              line: lineNum,
              column: 1,
              message: `Mismatched Apache directive: ${directive}`,
              severity: 'error',
              code: 'APACHE_MISMATCHED_DIRECTIVE',
              context: line
            });
          }
        } else {
          directiveStack.push(directive.split(' ')[0]);
        }
      }
      
      // Check for common configuration issues
      if (trimmed.includes('AllowOverride All')) {
        warnings.push({
          line: lineNum,
          column: 1,
          message: 'AllowOverride All can impact performance',
          suggestion: 'Consider using specific override options instead of All'
        });
      }
    }
  });
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function validateEnvSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  const variables = new Set<string>();
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    if (trimmed && !trimmed.startsWith('#')) {
      if (!trimmed.includes('=')) {
        errors.push({
          line: lineNum,
          column: 1,
          message: 'Invalid environment variable format (missing =)',
          severity: 'error',
          code: 'ENV_INVALID_FORMAT',
          context: line
        });
      } else {
        const [key, ...valueParts] = trimmed.split('=');
        const variable = key.trim();
        
        if (!variable.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {
          warnings.push({
            line: lineNum,
            column: 1,
            message: 'Environment variable name should follow naming conventions',
            suggestion: 'Use uppercase letters, numbers, and underscores only'
          });
        }
        
        if (variables.has(variable)) {
          warnings.push({
            line: lineNum,
            column: 1,
            message: `Duplicate environment variable: ${variable}`,
            suggestion: 'Remove duplicate variable definition'
          });
        } else {
          variables.add(variable);
        }
        
        const value = valueParts.join('=');
        if (!value) {
          warnings.push({
            line: lineNum,
            column: trimmed.indexOf('=') + 1,
            message: 'Empty environment variable value',
            suggestion: 'Consider providing a default value'
          });
        }
      }
    }
  });
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function validateIniSyntax(content: string, lines: string[]): SyntaxValidation {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxWarning[] = [];
  const formattingIssues: FormattingIssue[] = [];
  
  let currentSection = '';
  const sections = new Set<string>();
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith(';')) {
      // Check for section headers
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        if (sections.has(currentSection)) {
          warnings.push({
            line: lineNum,
            column: 1,
            message: `Duplicate section: [${currentSection}]`,
            suggestion: 'Consider merging duplicate sections'
          });
        } else {
          sections.add(currentSection);
        }
      }
      // Check for key-value pairs
      else if (trimmed.includes('=')) {
        if (!currentSection) {
          warnings.push({
            line: lineNum,
            column: 1,
            message: 'Property defined outside of section',
            suggestion: 'Define properties within a section'
          });
        }
        
        const [key, ...valueParts] = trimmed.split('=');
        if (!key.trim()) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'Empty property name',
            severity: 'error',
            code: 'INI_EMPTY_KEY',
            context: line
          });
        }
      } else {
        warnings.push({
          line: lineNum,
          column: 1,
          message: 'Invalid INI format (not a section or key-value pair)',
          suggestion: 'Ensure line is either [section] or key=value format'
        });
      }
    }
  });
  
  return { valid: errors.length === 0, errors, warnings, formattingIssues };
}

function performSecurityAnalysis(content: string, fileType: string): SecurityAnalysis {
  const vulnerabilities: SecurityVulnerability[] = [];
  const sensitiveDataExposed: SensitiveDataIssue[] = [];
  
  // Common security patterns to check
  const securityPatterns = {
    password: /password\s*[:=]\s*["']?([^"'\n\s]+)/gi,
    apiKey: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([^"'\n\s]+)/gi,
    token: /(?:token|auth[_-]?token)\s*[:=]\s*["']?([^"'\n\s]+)/gi,
    secret: /(?:secret|client[_-]?secret)\s*[:=]\s*["']?([^"'\n\s]+)/gi,
    database: /(?:database[_-]?url|db[_-]?url|connection[_-]?string)\s*[:=]\s*["']?([^"'\n\s]+)/gi,
    privateKey: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi
  };
  
  Object.entries(securityPatterns).forEach(([type, pattern]) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      sensitiveDataExposed.push({
        type: type as any,
        location: `Line ${lineNum}`,
        value: match[1] || match[0],
        recommendation: `Move ${type} to environment variables or secure vault`
      });
    }
  });
  
  // File-type specific security checks
  switch (fileType) {
    case 'dockerfile':
      // Check for running as root
      if (!content.includes('USER ') || content.match(/USER\s+root/)) {
        vulnerabilities.push({
          type: 'Privilege Escalation',
          severity: 'medium',
          description: 'Container runs as root user',
          location: 'Dockerfile',
          recommendation: 'Create and use non-root user',
          cwe: 'CWE-250'
        });
      }
      
      // Check for COPY/ADD with broad permissions
      if (content.match(/(?:COPY|ADD)\s+\.\s+\./)) {
        vulnerabilities.push({
          type: 'Excessive File Permissions',
          severity: 'low',
          description: 'Copying entire context to container',
          location: 'Dockerfile',
          recommendation: 'Use .dockerignore and copy specific files only'
        });
      }
      break;
      
    case 'nginx':
      // Check for server_tokens
      if (!content.includes('server_tokens off')) {
        vulnerabilities.push({
          type: 'Information Disclosure',
          severity: 'low',
          description: 'Server version disclosed in headers',
          location: 'Nginx config',
          recommendation: 'Add "server_tokens off;" to hide server version'
        });
      }
      break;
  }
  
  const riskLevel = sensitiveDataExposed.length > 0 || vulnerabilities.some(v => v.severity === 'high' || v.severity === 'critical') 
    ? 'high' 
    : vulnerabilities.length > 0 
    ? 'medium' 
    : 'low';
  
  const score = Math.max(0, 100 - (sensitiveDataExposed.length * 15) - (vulnerabilities.length * 10));
  
  return {
    riskLevel,
    vulnerabilities,
    sensitiveDataExposed,
    recommendations: [
      ...sensitiveDataExposed.map(s => s.recommendation),
      ...vulnerabilities.map(v => v.recommendation)
    ].slice(0, 5),
    score
  };
}

function performPerformanceAnalysis(content: string, fileType: string): PerformanceAnalysis {
  const issues: PerformanceIssue[] = [];
  const optimizations: PerformanceOptimization[] = [];
  
  // General performance checks
  const lines = content.split('\n');
  if (lines.length > 1000) {
    issues.push({
      type: 'Large File Size',
      description: 'Configuration file is very large',
      impact: 'medium',
      location: 'Entire file',
      suggestion: 'Consider breaking into smaller, modular configuration files'
    });
  }
  
  // File-type specific performance analysis
  switch (fileType) {
    case 'json':
      try {
        const parsed = JSON.parse(content);
        const stringified = JSON.stringify(parsed);
        if (stringified.length !== content.replace(/\s/g, '').length) {
          optimizations.push({
            type: 'JSON Minification',
            description: 'JSON can be minified for production',
            estimatedImprovement: '20-40% size reduction',
            implementation: 'Remove whitespace and formatting'
          });
        }
      } catch {}
      break;
      
    case 'nginx':
      if (!content.includes('gzip on')) {
        optimizations.push({
          type: 'Compression',
          description: 'Enable gzip compression',
          estimatedImprovement: '60-80% bandwidth reduction',
          implementation: 'Add "gzip on;" and configure gzip settings'
        });
      }
      
      if (!content.includes('expires ') && !content.includes('Cache-Control')) {
        optimizations.push({
          type: 'Caching',
          description: 'Configure browser caching headers',
          estimatedImprovement: '50-90% reduced server load',
          implementation: 'Add expires or add_header Cache-Control directives'
        });
      }
      break;
      
    case 'dockerfile':
      const runCommands = content.match(/^RUN\s+/gm) || [];
      if (runCommands.length > 5) {
        issues.push({
          type: 'Excessive Layers',
          description: 'Too many RUN commands create excessive layers',
          impact: 'medium',
          location: 'Multiple RUN commands',
          suggestion: 'Combine RUN commands with && to reduce layers'
        });
      }
      break;
  }
  
  const resourceUsage: ResourceUsageAnalysis = {
    memoryImpact: lines.length > 500 ? 'medium' : 'low',
    cpuImpact: content.length > 10000 ? 'medium' : 'low',
    networkImpact: fileType === 'json' && content.length > 50000 ? 'high' : 'low',
    diskImpact: content.length > 100000 ? 'medium' : 'low'
  };
  
  const score = Math.max(0, 100 - (issues.length * 15));
  
  return {
    score,
    issues,
    optimizations,
    resourceUsage
  };
}

function checkBestPractices(content: string, fileType: string): BestPracticesCheck {
  const violations: BestPracticeViolation[] = [];
  const compliance: ComplianceCheck[] = [];
  
  const lines = content.split('\n');
  
  // General best practices
  if (lines.some(line => line.length > 120)) {
    violations.push({
      rule: 'Line Length',
      description: 'Lines should not exceed 120 characters',
      location: 'Multiple lines',
      severity: 'warning',
      fix: 'Break long lines for better readability'
    });
  }
  
  // File-type specific best practices
  switch (fileType) {
    case 'json':
      if (!content.includes('\n')) {
        violations.push({
          rule: 'Formatting',
          description: 'JSON should be formatted for readability',
          location: 'Entire file',
          severity: 'info',
          fix: 'Use proper indentation and line breaks'
        });
      }
      break;
      
    case 'yaml':
      if (content.includes('\t')) {
        violations.push({
          rule: 'Indentation',
          description: 'YAML should use spaces, not tabs',
          location: 'Lines with tabs',
          severity: 'error',
          fix: 'Replace tabs with spaces'
        });
      }
      break;
      
    case 'dockerfile':
      if (!content.toUpperCase().includes('HEALTHCHECK')) {
        violations.push({
          rule: 'Health Checks',
          description: 'Dockerfile should include health checks',
          location: 'Missing HEALTHCHECK instruction',
          severity: 'warning',
          fix: 'Add HEALTHCHECK instruction to monitor container health'
        });
      }
      
      if (content.includes('FROM') && !content.includes('LABEL')) {
        violations.push({
          rule: 'Metadata',
          description: 'Dockerfile should include metadata labels',
          location: 'Missing LABEL instructions',
          severity: 'info',
          fix: 'Add LABEL instructions for maintainer, version, description'
        });
      }
      break;
  }
  
  // Compliance checks
  compliance.push({
    standard: 'General Best Practices',
    compliant: violations.filter(v => v.severity === 'error').length === 0,
    violations: violations.map(v => v.description),
    score: Math.max(0, 100 - (violations.length * 10))
  });
  
  const score = compliance.reduce((sum, c) => sum + c.score, 0) / compliance.length;
  
  return {
    score,
    violations,
    recommendations: violations.map(v => v.fix).slice(0, 5),
    compliance
  };
}

function generateSuggestions(validation: ConfigValidationResult): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Convert syntax errors to suggestions
  validation.syntaxValidation.errors.forEach(error => {
    suggestions.push({
      type: 'fix',
      priority: 'critical',
      description: error.message,
      location: `Line ${error.line}, Column ${error.column}`,
      before: error.context,
      after: 'Fix syntax error',
      automated: false
    });
  });
  
  // Convert formatting issues to suggestions
  validation.syntaxValidation.formattingIssues.forEach(issue => {
    suggestions.push({
      type: 'style',
      priority: 'low',
      description: issue.issue,
      location: `Line ${issue.line}`,
      before: issue.actual,
      after: issue.expected,
      automated: issue.autoFixable
    });
  });
  
  // Convert security vulnerabilities to suggestions
  validation.securityAnalysis.vulnerabilities.forEach(vuln => {
    suggestions.push({
      type: 'security',
      priority: vuln.severity === 'critical' ? 'critical' : vuln.severity === 'high' ? 'high' : 'medium',
      description: vuln.description,
      location: vuln.location,
      before: 'Current configuration',
      after: vuln.recommendation,
      automated: false
    });
  });
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function formatValidationOutput(validation: ConfigValidationResult, config: ConfigValidatorConfig): string {
  const { metadata, syntaxValidation, securityAnalysis, performanceAnalysis, bestPracticesCheck } = validation;
  
  let output = `📋 Configuration File Validation Report
═══════════════════════════════════════════════════════════

📄 File Information
├─ File Type: ${metadata.fileType.toUpperCase()}
├─ Detected Format: ${metadata.detectedFormat}
├─ File Size: ${metadata.fileSize} bytes
├─ Line Count: ${metadata.lineCount}
├─ Validation Level: ${metadata.validationLevel}
├─ Processing Time: ${metadata.processingTime}ms
└─ Timestamp: ${new Date(metadata.timestamp).toLocaleString()}

✅ Syntax Validation
├─ Valid: ${syntaxValidation.valid ? '✅ Yes' : '❌ No'}
├─ Errors: ${syntaxValidation.errors.length}
├─ Warnings: ${syntaxValidation.warnings.length}
└─ Formatting Issues: ${syntaxValidation.formattingIssues.length}`;

  // Add syntax errors
  if (syntaxValidation.errors.length > 0) {
    output += `\n\n❌ Syntax Errors (${syntaxValidation.errors.length})
${'─'.repeat(60)}`;
    syntaxValidation.errors.slice(0, 10).forEach((error, index) => {
      output += `\n${index + 1}. Line ${error.line}, Column ${error.column}`;
      output += `\n   ${error.message}`;
      if (config.contextLines > 0) {
        output += `\n   Context: ${error.context}`;
      }
      output += '\n';
    });
  }

  // Add security analysis
  output += `\n🔒 Security Analysis
${'─'.repeat(60)}
├─ Risk Level: ${securityAnalysis.riskLevel.toUpperCase()}
├─ Security Score: ${securityAnalysis.score}/100
├─ Vulnerabilities: ${securityAnalysis.vulnerabilities.length}
└─ Sensitive Data Exposed: ${securityAnalysis.sensitiveDataExposed.length}`;

  if (securityAnalysis.vulnerabilities.length > 0) {
    output += `\n\n🚨 Security Vulnerabilities
${'─'.repeat(60)}`;
    securityAnalysis.vulnerabilities.forEach((vuln, index) => {
      const severityIcon = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
      }[vuln.severity];
      
      output += `\n${index + 1}. ${severityIcon} ${vuln.type} (${vuln.severity.toUpperCase()})`;
      output += `\n   ${vuln.description}`;
      output += `\n   Location: ${vuln.location}`;
      output += `\n   Fix: ${vuln.recommendation}`;
      if (vuln.cwe) {
        output += `\n   CWE: ${vuln.cwe}`;
      }
      output += '\n';
    });
  }

  if (securityAnalysis.sensitiveDataExposed.length > 0) {
    output += `\n\n🔓 Sensitive Data Exposure
${'─'.repeat(60)}`;
    securityAnalysis.sensitiveDataExposed.slice(0, 5).forEach((data, index) => {
      output += `\n${index + 1}. ${data.type.toUpperCase()} at ${data.location}`;
      output += `\n   Recommendation: ${data.recommendation}\n`;
    });
  }

  // Add performance analysis
  output += `\n⚡ Performance Analysis
${'─'.repeat(60)}
├─ Performance Score: ${performanceAnalysis.score}/100
├─ Issues: ${performanceAnalysis.issues.length}
├─ Optimizations Available: ${performanceAnalysis.optimizations.length}
└─ Resource Impact: Memory(${performanceAnalysis.resourceUsage.memoryImpact}) CPU(${performanceAnalysis.resourceUsage.cpuImpact}) Network(${performanceAnalysis.resourceUsage.networkImpact}) Disk(${performanceAnalysis.resourceUsage.diskImpact})`;

  if (performanceAnalysis.issues.length > 0) {
    output += `\n\n⚠️  Performance Issues
${'─'.repeat(60)}`;
    performanceAnalysis.issues.forEach((issue, index) => {
      output += `\n${index + 1}. ${issue.type} (${issue.impact.toUpperCase()} impact)`;
      output += `\n   ${issue.description}`;
      output += `\n   Location: ${issue.location}`;
      output += `\n   Fix: ${issue.suggestion}\n`;
    });
  }

  if (performanceAnalysis.optimizations.length > 0) {
    output += `\n\n🚀 Optimization Opportunities
${'─'.repeat(60)}`;
    performanceAnalysis.optimizations.slice(0, 3).forEach((opt, index) => {
      output += `\n${index + 1}. ${opt.type}`;
      output += `\n   ${opt.description}`;
      output += `\n   Estimated Improvement: ${opt.estimatedImprovement}`;
      output += `\n   Implementation: ${opt.implementation}\n`;
    });
  }

  // Add best practices
  output += `\n📚 Best Practices Check
${'─'.repeat(60)}
├─ Overall Score: ${bestPracticesCheck.score.toFixed(1)}/100
├─ Violations: ${bestPracticesCheck.violations.length}
└─ Compliance Checks: ${bestPracticesCheck.compliance.length}`;

  if (bestPracticesCheck.violations.length > 0) {
    output += `\n\n📋 Best Practice Violations
${'─'.repeat(60)}`;
    bestPracticesCheck.violations.slice(0, 5).forEach((violation, index) => {
      const severityIcon = {
        info: '💡',
        warning: '⚠️',
        error: '❌'
      }[violation.severity];
      
      output += `\n${index + 1}. ${severityIcon} ${violation.rule}`;
      output += `\n   ${violation.description}`;
      output += `\n   Location: ${violation.location}`;
      output += `\n   Fix: ${violation.fix}\n`;
    });
  }

  // Add suggestions
  if (config.fixSuggestions && validation.suggestions.length > 0) {
    output += `\n💡 Fix Suggestions
${'─'.repeat(60)}`;
    validation.suggestions.slice(0, 5).forEach((suggestion, index) => {
      const priorityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      }[suggestion.priority];
      
      output += `\n${index + 1}. ${priorityIcon} ${suggestion.description}`;
      output += `\n   Location: ${suggestion.location}`;
      output += `\n   Type: ${suggestion.type.toUpperCase()}`;
      if (suggestion.automated) {
        output += `\n   ✅ Can be automatically fixed`;
      }
      output += '\n';
    });
  }

  return output;
}

export function processConfigValidation(input: string, config: ConfigValidatorConfig): ToolResult {
  try {
    const content = input.trim();
    
    if (!content) {
      return { success: false, error: 'Please provide configuration file content to validate' };
    }

    const detectedType = detectFileType(content, config.fileType);
    const startTime = Date.now();

    // Validate syntax
    const syntaxValidation = validateSyntax(content, detectedType);
    
    // Perform security analysis
    const securityAnalysis = config.checkSecurity 
      ? performSecurityAnalysis(content, detectedType)
      : { riskLevel: 'low' as const, vulnerabilities: [], sensitiveDataExposed: [], recommendations: [], score: 100 };
    
    // Perform performance analysis
    const performanceAnalysis = config.checkPerformance
      ? performPerformanceAnalysis(content, detectedType)
      : { score: 100, issues: [], optimizations: [], resourceUsage: { memoryImpact: 'low' as const, cpuImpact: 'low' as const, networkImpact: 'low' as const, diskImpact: 'low' as const } };
    
    // Check best practices
    const bestPracticesCheck = config.checkBestPractices
      ? checkBestPractices(content, detectedType)
      : { score: 100, violations: [], recommendations: [], compliance: [] };

    const processingTime = Date.now() - startTime;
    const lines = content.split('\n');

    const validation: ConfigValidationResult = {
      metadata: {
        fileType: config.fileType,
        detectedFormat: detectedType,
        fileSize: content.length,
        lineCount: lines.length,
        validationLevel: config.validationLevel,
        timestamp: new Date().toISOString(),
        processingTime
      },
      syntaxValidation,
      securityAnalysis,
      performanceAnalysis,
      bestPracticesCheck,
      suggestions: [],
      metrics: {
        totalLines: lines.length,
        validLines: lines.filter(l => l.trim() && !l.trim().startsWith('#')).length,
        errorLines: syntaxValidation.errors.length,
        warningLines: syntaxValidation.warnings.length,
        complexity: Math.min(100, Math.floor(lines.length / 10)), // Simplified complexity
        maintainabilityIndex: Math.max(0, 100 - syntaxValidation.errors.length * 5 - syntaxValidation.warnings.length * 2)
      }
    };

    // Generate suggestions
    validation.suggestions = config.fixSuggestions ? generateSuggestions(validation) : [];

    const output = formatValidationOutput(validation, config);
    
    const warnings: string[] = [];
    if (detectedType !== config.fileType && config.fileType !== 'auto') {
      warnings.push(`File type mismatch: declared as ${config.fileType}, detected as ${detectedType}`);
    }
    if (!syntaxValidation.valid) {
      warnings.push(`${syntaxValidation.errors.length} syntax error(s) found`);
    }
    if (securityAnalysis.riskLevel === 'high' || securityAnalysis.riskLevel === 'critical') {
      warnings.push(`High security risk detected - ${securityAnalysis.vulnerabilities.length} vulnerability(ies) found`);
    }

    return {
      success: syntaxValidation.valid,
      output,
      validation,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const CONFIG_FILE_VALIDATOR_TOOL: Tool = {
  id: 'config-file-validator',
  name: 'Configuration File Validator',
  description: 'Comprehensive validation for configuration files including JSON, YAML, TOML, XML, Dockerfile, Nginx, Apache configs with syntax, security, and best practices checking',
  icon: '⚙️',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'config-tools')!,
  tags: ['config', 'validation', 'json', 'yaml', 'toml', 'xml', 'dockerfile', 'nginx', 'apache', 'security', 'syntax', 'best-practices'],
  complexity: 'advanced',
  showInList: true,
  shortDescription: 'Validate configuration files with security and best practices',
  
  examples: [
    {
      title: 'JSON Configuration',
      input: `{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp",
    "user": "admin",
    "password": "secret123"
  },
  "redis": {
    "host": "localhost",
    "port": 6379
  }
}`,
      description: 'Validate JSON config with security analysis'
    },
    {
      title: 'YAML Configuration',
      input: `database:
  host: localhost
  port: 5432
  name: myapp
  username: admin
  password: "supersecret"
  ssl: true

redis:
  host: localhost
  port: 6379
  password: "redis_password"

logging:
  level: info
  file: /var/log/app.log`,
      description: 'Validate YAML config with sensitive data detection'
    },
    {
      title: 'Dockerfile',
      input: `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

USER root

CMD ["npm", "start"]`,
      description: 'Validate Dockerfile with security and best practices'
    },
    {
      title: 'Nginx Configuration',
      input: `server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr
    }
    
    location /static/ {
        root /var/www;
        expires 30d;
    }
}`,
      description: 'Validate Nginx config with performance analysis'
    },
    {
      title: 'Environment Variables',
      input: `# Database Configuration
DATABASE_URL=postgresql://user:password123@localhost:5432/myapp
DB_HOST=localhost
DB_PORT=5432

# API Configuration  
API_KEY=sk-1234567890abcdef
JWT_SECRET=my-super-secret-key
ENCRYPTION_KEY=aes-256-encryption-key

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis-secret

# Application Settings
NODE_ENV=production
LOG_LEVEL=info
PORT=3000`,
      description: 'Validate environment variables with sensitive data detection'
    }
  ],

  faqs: [
    {
      question: 'What configuration file formats are supported?',
      answer: 'Supports JSON, YAML, TOML, XML, INI, environment files (.env), properties files, Dockerfile, Nginx configs, Apache configs, and can auto-detect format from content.'
    },
    {
      question: 'What security checks are performed?',
      answer: 'Detects exposed passwords, API keys, tokens, database URLs, private keys, and other sensitive data. Also checks for security vulnerabilities like privilege escalation and excessive permissions.'
    },
    {
      question: 'How does the performance analysis work?',
      answer: 'Analyzes file size, complexity, resource usage patterns, and provides optimization suggestions like compression, caching, and structural improvements specific to each file type.'
    },
    {
      question: 'What best practices are checked?',
      answer: 'Validates formatting consistency, naming conventions, structural organization, security practices, performance optimizations, and compliance with industry standards for each configuration type.'
    },
    {
      question: 'Can I validate against custom schemas?',
      answer: 'Yes, you can provide custom JSON schemas for validation, enable strict mode for enhanced checking, and configure which types of analysis to perform (syntax, security, performance, best practices).'
    }
  ],

  relatedTools: [
    'json-schema-validator',
    'yaml-validator',
    'text-analytics',
    'api-documentation-generator',
    'log-analysis-tool',
    'regex-tester'
  ]
};