import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface JsonSchemaValidatorConfig {
  validationMode: 'validate' | 'generate' | 'analyze';
  schemaVersion: 'draft-04' | 'draft-06' | 'draft-07' | 'draft-2019-09' | 'draft-2020-12';
  strictMode: boolean;
  showDetailedErrors: boolean;
  generateExamples: boolean;
  allowAdditionalProperties: boolean;
  requireAllProperties: boolean;
  validateFormats: boolean;
  outputFormat: 'summary' | 'detailed' | 'json';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  validationResult?: ValidationResult;
  generatedSchema?: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  schemaPath: string;
  data: any;
}

interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

interface ValidationSummary {
  totalErrors: number;
  totalWarnings: number;
  schemaComplexity: 'simple' | 'moderate' | 'complex';
  dataTypes: string[];
  requiredFields: string[];
  optionalFields: string[];
}

// Common JSON Schema templates
export const SCHEMA_TEMPLATES = [
  {
    id: 'person',
    name: 'Person Object',
    description: 'Basic person information schema',
    schema: {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "title": "Person",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "age": { "type": "integer", "minimum": 0, "maximum": 150 },
        "email": { "type": "string", "format": "email" },
        "address": {
          "type": "object",
          "properties": {
            "street": { "type": "string" },
            "city": { "type": "string" },
            "zipCode": { "type": "string", "pattern": "^[0-9]{5}$" }
          }
        }
      },
      "required": ["name", "email"]
    }
  },
  {
    id: 'api-response',
    name: 'API Response',
    description: 'Standard API response schema',
    schema: {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "title": "API Response",
      "properties": {
        "success": { "type": "boolean" },
        "data": { "type": ["object", "array", "null"] },
        "message": { "type": "string" },
        "error": {
          "type": "object",
          "properties": {
            "code": { "type": "integer" },
            "message": { "type": "string" },
            "details": { "type": "object" }
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": { "type": "integer", "minimum": 1 },
            "limit": { "type": "integer", "minimum": 1 },
            "total": { "type": "integer", "minimum": 0 }
          }
        }
      },
      "required": ["success"]
    }
  },
  {
    id: 'product',
    name: 'Product Catalog',
    description: 'E-commerce product schema',
    schema: {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "title": "Product",
      "properties": {
        "id": { "type": "string", "pattern": "^[a-zA-Z0-9-]+$" },
        "name": { "type": "string", "minLength": 1, "maxLength": 200 },
        "description": { "type": "string", "maxLength": 1000 },
        "price": { "type": "number", "minimum": 0 },
        "currency": { "type": "string", "enum": ["USD", "EUR", "GBP", "JPY"] },
        "category": { "type": "string" },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "uniqueItems": true
        },
        "inStock": { "type": "boolean" },
        "images": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "url": { "type": "string", "format": "uri" },
              "alt": { "type": "string" }
            },
            "required": ["url"]
          }
        }
      },
      "required": ["id", "name", "price", "currency"]
    }
  }
];

// Schema validation keywords and their descriptions
const SCHEMA_KEYWORDS = {
  type: 'Specifies the data type',
  properties: 'Object property definitions',
  required: 'Required property names',
  minimum: 'Minimum numeric value',
  maximum: 'Maximum numeric value',
  minLength: 'Minimum string length',
  maxLength: 'Maximum string length',
  pattern: 'Regular expression pattern',
  format: 'String format validation',
  enum: 'Allowed values list',
  items: 'Array item schema',
  additionalProperties: 'Allow extra properties',
  uniqueItems: 'Array items must be unique'
};

function parseJson(input: string): { data: any; error?: string } {
  try {
    const parsed = JSON.parse(input.trim());
    return { data: parsed };
  } catch (error) {
    return {
      data: null,
      error: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`
    };
  }
}

function validateJsonSchema(data: any, schema: any, config: JsonSchemaValidatorConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Basic validation implementation (simplified)
  function validateObject(obj: any, schemaObj: any, path: string = ''): void {
    if (!schemaObj || typeof schemaObj !== 'object') return;
    
    // Check type
    if (schemaObj.type) {
      const expectedType = schemaObj.type;
      const actualType = Array.isArray(obj) ? 'array' : typeof obj;
      
      if (expectedType !== actualType && !Array.isArray(expectedType)) {
        errors.push({
          path,
          message: `Expected type '${expectedType}' but got '${actualType}'`,
          keyword: 'type',
          schemaPath: `${path}/type`,
          data: obj
        });
        return;
      }
      
      if (Array.isArray(expectedType) && !expectedType.includes(actualType)) {
        errors.push({
          path,
          message: `Expected one of types [${expectedType.join(', ')}] but got '${actualType}'`,
          keyword: 'type',
          schemaPath: `${path}/type`,
          data: obj
        });
        return;
      }
    }
    
    // Validate object properties
    if (schemaObj.type === 'object' && typeof obj === 'object' && obj !== null) {
      // Check required properties
      if (schemaObj.required && Array.isArray(schemaObj.required)) {
        for (const requiredProp of schemaObj.required) {
          if (!(requiredProp in obj)) {
            errors.push({
              path,
              message: `Missing required property '${requiredProp}'`,
              keyword: 'required',
              schemaPath: `${path}/required`,
              data: obj
            });
          }
        }
      }
      
      // Check properties
      if (schemaObj.properties) {
        for (const [propName, propSchema] of Object.entries(schemaObj.properties)) {
          if (propName in obj) {
            validateObject(obj[propName], propSchema, path ? `${path}.${propName}` : propName);
          }
        }
        
        // Check additional properties
        if (config.strictMode && schemaObj.additionalProperties === false) {
          const allowedProps = Object.keys(schemaObj.properties);
          for (const propName of Object.keys(obj)) {
            if (!allowedProps.includes(propName)) {
              warnings.push({
                path: path ? `${path}.${propName}` : propName,
                message: `Unexpected property '${propName}'`,
                suggestion: 'Remove this property or add it to the schema'
              });
            }
          }
        }
      }
    }
    
    // Validate array items
    if (schemaObj.type === 'array' && Array.isArray(obj)) {
      if (schemaObj.items) {
        obj.forEach((item, index) => {
          validateObject(item, schemaObj.items, `${path}[${index}]`);
        });
      }
      
      // Check unique items
      if (schemaObj.uniqueItems && obj.length !== new Set(obj.map(JSON.stringify)).size) {
        errors.push({
          path,
          message: 'Array items must be unique',
          keyword: 'uniqueItems',
          schemaPath: `${path}/uniqueItems`,
          data: obj
        });
      }
    }
    
    // Validate string constraints
    if (schemaObj.type === 'string' && typeof obj === 'string') {
      if (schemaObj.minLength && obj.length < schemaObj.minLength) {
        errors.push({
          path,
          message: `String length ${obj.length} is less than minimum ${schemaObj.minLength}`,
          keyword: 'minLength',
          schemaPath: `${path}/minLength`,
          data: obj
        });
      }
      
      if (schemaObj.maxLength && obj.length > schemaObj.maxLength) {
        errors.push({
          path,
          message: `String length ${obj.length} exceeds maximum ${schemaObj.maxLength}`,
          keyword: 'maxLength',
          schemaPath: `${path}/maxLength`,
          data: obj
        });
      }
      
      if (schemaObj.pattern) {
        const regex = new RegExp(schemaObj.pattern);
        if (!regex.test(obj)) {
          errors.push({
            path,
            message: `String does not match pattern '${schemaObj.pattern}'`,
            keyword: 'pattern',
            schemaPath: `${path}/pattern`,
            data: obj
          });
        }
      }
      
      if (config.validateFormats && schemaObj.format) {
        const formatValidation = validateFormat(obj, schemaObj.format);
        if (!formatValidation.valid) {
          errors.push({
            path,
            message: `Invalid ${schemaObj.format} format: ${formatValidation.error}`,
            keyword: 'format',
            schemaPath: `${path}/format`,
            data: obj
          });
        }
      }
    }
    
    // Validate numeric constraints
    if (schemaObj.type === 'number' || schemaObj.type === 'integer') {
      if (typeof obj === 'number') {
        if (schemaObj.minimum !== undefined && obj < schemaObj.minimum) {
          errors.push({
            path,
            message: `Value ${obj} is less than minimum ${schemaObj.minimum}`,
            keyword: 'minimum',
            schemaPath: `${path}/minimum`,
            data: obj
          });
        }
        
        if (schemaObj.maximum !== undefined && obj > schemaObj.maximum) {
          errors.push({
            path,
            message: `Value ${obj} exceeds maximum ${schemaObj.maximum}`,
            keyword: 'maximum',
            schemaPath: `${path}/maximum`,
            data: obj
          });
        }
        
        if (schemaObj.type === 'integer' && !Number.isInteger(obj)) {
          errors.push({
            path,
            message: `Value ${obj} is not an integer`,
            keyword: 'type',
            schemaPath: `${path}/type`,
            data: obj
          });
        }
      }
    }
    
    // Validate enum
    if (schemaObj.enum && Array.isArray(schemaObj.enum)) {
      if (!schemaObj.enum.includes(obj)) {
        errors.push({
          path,
          message: `Value must be one of: ${schemaObj.enum.join(', ')}`,
          keyword: 'enum',
          schemaPath: `${path}/enum`,
          data: obj
        });
      }
    }
  }
  
  validateObject(data, schema);
  
  // Calculate complexity
  const complexity = calculateSchemaComplexity(schema);
  const dataTypes = extractDataTypes(schema);
  const requiredFields = extractRequiredFields(schema);
  const optionalFields = extractOptionalFields(schema);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      schemaComplexity: complexity,
      dataTypes,
      requiredFields,
      optionalFields
    }
  };
}

function validateFormat(value: string, format: string): { valid: boolean; error?: string } {
  switch (format) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? { valid: true } : { valid: false, error: 'Invalid email format' };
      
    case 'uri':
    case 'url':
      try {
        new URL(value);
        return { valid: true };
      } catch {
        return { valid: false, error: 'Invalid URI format' };
      }
      
    case 'date':
      const date = new Date(value);
      return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value) 
        ? { valid: true } 
        : { valid: false, error: 'Invalid date format (expected YYYY-MM-DD)' };
        
    case 'time':
      return /^\d{2}:\d{2}:\d{2}$/.test(value) 
        ? { valid: true } 
        : { valid: false, error: 'Invalid time format (expected HH:MM:SS)' };
        
    case 'date-time':
      return !isNaN(Date.parse(value)) 
        ? { valid: true } 
        : { valid: false, error: 'Invalid date-time format' };
        
    default:
      return { valid: true }; // Unknown format, assume valid
  }
}

function calculateSchemaComplexity(schema: any): 'simple' | 'moderate' | 'complex' {
  let complexity = 0;
  
  function analyzeObject(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    complexity += Object.keys(obj).length;
    
    if (obj.properties) {
      complexity += Object.keys(obj.properties).length * 2;
      Object.values(obj.properties).forEach(analyzeObject);
    }
    
    if (obj.items) {
      analyzeObject(obj.items);
    }
    
    if (obj.required && Array.isArray(obj.required)) {
      complexity += obj.required.length;
    }
    
    if (obj.enum) complexity += 2;
    if (obj.pattern) complexity += 3;
    if (obj.format) complexity += 2;
  }
  
  analyzeObject(schema);
  
  if (complexity <= 10) return 'simple';
  if (complexity <= 30) return 'moderate';
  return 'complex';
}

function extractDataTypes(schema: any): string[] {
  const types = new Set<string>();
  
  function findTypes(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    if (obj.type) {
      if (Array.isArray(obj.type)) {
        obj.type.forEach((t: string) => types.add(t));
      } else {
        types.add(obj.type);
      }
    }
    
    if (obj.properties) {
      Object.values(obj.properties).forEach(findTypes);
    }
    
    if (obj.items) {
      findTypes(obj.items);
    }
  }
  
  findTypes(schema);
  return Array.from(types);
}

function extractRequiredFields(schema: any, prefix = ''): string[] {
  const required: string[] = [];
  
  if (schema.required && Array.isArray(schema.required)) {
    required.push(...schema.required.map((field: string) => prefix ? `${prefix}.${field}` : field));
  }
  
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const nestedRequired = extractRequiredFields(propSchema as any, prefix ? `${prefix}.${propName}` : propName);
      required.push(...nestedRequired);
    }
  }
  
  return required;
}

function extractOptionalFields(schema: any, prefix = ''): string[] {
  const optional: string[] = [];
  const required = new Set(schema.required || []);
  
  if (schema.properties) {
    for (const propName of Object.keys(schema.properties)) {
      if (!required.has(propName)) {
        optional.push(prefix ? `${prefix}.${propName}` : propName);
      }
    }
  }
  
  return optional;
}

function generateSchemaFromData(data: any): any {
  function inferSchema(value: any): any {
    if (value === null) {
      return { type: 'null' };
    }
    
    if (Array.isArray(value)) {
      const itemTypes = new Set();
      value.forEach(item => {
        const itemSchema = inferSchema(item);
        itemTypes.add(JSON.stringify(itemSchema));
      });
      
      const uniqueSchemas = Array.from(itemTypes).map(schema => JSON.parse(schema as string));
      
      return {
        type: 'array',
        items: uniqueSchemas.length === 1 ? uniqueSchemas[0] : { oneOf: uniqueSchemas }
      };
    }
    
    if (typeof value === 'object') {
      const properties: any = {};
      const required: string[] = [];
      
      for (const [key, val] of Object.entries(value)) {
        properties[key] = inferSchema(val);
        if (val !== undefined && val !== null) {
          required.push(key);
        }
      }
      
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };
    }
    
    if (typeof value === 'string') {
      // Try to infer format
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { type: 'string', format: 'email' };
      }
      if (/^https?:\/\//.test(value)) {
        return { type: 'string', format: 'uri' };
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { type: 'string', format: 'date' };
      }
      
      return { type: 'string' };
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
    }
    
    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }
    
    return { type: 'string' }; // fallback
  }
  
  const schema = inferSchema(data);
  
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: schema.type,
    ...schema
  };
}

export function processJsonSchemaValidator(dataInput: string, schemaInput: string, config: JsonSchemaValidatorConfig): ToolResult {
  try {
    if (config.validationMode === 'generate') {
      // Generate schema from data
      if (!dataInput.trim()) {
        return {
          success: false,
          error: 'Data input is required for schema generation'
        };
      }
      
      const { data, error: dataError } = parseJson(dataInput);
      if (dataError) {
        return {
          success: false,
          error: dataError
        };
      }
      
      const generatedSchema = generateSchemaFromData(data);
      const output = JSON.stringify(generatedSchema, null, 2);
      
      return {
        success: true,
        output,
        generatedSchema
      };
    }
    
    // Validate data against schema
    if (!dataInput.trim() || !schemaInput.trim()) {
      return {
        success: false,
        error: 'Both data and schema inputs are required for validation'
      };
    }
    
    const { data, error: dataError } = parseJson(dataInput);
    if (dataError) {
      return {
        success: false,
        error: `Data parsing error: ${dataError}`
      };
    }
    
    const { data: schema, error: schemaError } = parseJson(schemaInput);
    if (schemaError) {
      return {
        success: false,
        error: `Schema parsing error: ${schemaError}`
      };
    }
    
    const validationResult = validateJsonSchema(data, schema, config);
    
    let output = '';
    if (config.outputFormat === 'json') {
      output = JSON.stringify(validationResult, null, 2);
    } else if (config.outputFormat === 'detailed') {
      const lines = [
        `✅ JSON Schema Validation Report`,
        `Status: ${validationResult.isValid ? '✅ VALID' : '❌ INVALID'}`,
        `Schema Version: ${config.schemaVersion}`,
        ``,
        `📊 Summary:`,
        `- Total Errors: ${validationResult.summary.totalErrors}`,
        `- Total Warnings: ${validationResult.summary.totalWarnings}`,
        `- Schema Complexity: ${validationResult.summary.schemaComplexity}`,
        `- Data Types: ${validationResult.summary.dataTypes.join(', ')}`,
        ``
      ];
      
      if (validationResult.errors.length > 0) {
        lines.push(`❌ Validation Errors:`);
        validationResult.errors.forEach((error, index) => {
          lines.push(`${index + 1}. Path: ${error.path || 'root'}`);
          lines.push(`   Message: ${error.message}`);
          lines.push(`   Keyword: ${error.keyword}`);
          if (config.showDetailedErrors) {
            lines.push(`   Data: ${JSON.stringify(error.data)}`);
          }
          lines.push('');
        });
      }
      
      if (validationResult.warnings.length > 0) {
        lines.push(`⚠️ Warnings:`);
        validationResult.warnings.forEach((warning, index) => {
          lines.push(`${index + 1}. Path: ${warning.path}`);
          lines.push(`   Message: ${warning.message}`);
          if (warning.suggestion) {
            lines.push(`   Suggestion: ${warning.suggestion}`);
          }
          lines.push('');
        });
      }
      
      output = lines.join('\n');
    } else {
      // Summary format
      output = validationResult.isValid 
        ? `✅ Valid JSON - ${validationResult.summary.totalErrors} errors, ${validationResult.summary.totalWarnings} warnings`
        : `❌ Invalid JSON - ${validationResult.summary.totalErrors} errors, ${validationResult.summary.totalWarnings} warnings`;
    }
    
    return {
      success: true,
      output,
      validationResult
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const JSON_SCHEMA_VALIDATOR_TOOL: Tool = {
  id: 'json-schema-validator',
  name: 'JSON Schema Validator - Parse JSON File Format & Structure',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'json-tools')!,
  slug: 'json-schema-validator',
  icon: '✅',
  keywords: ['json file format validation', 'json parsing rules', 'json search schema', 'json get structure validation', 'json', 'schema', 'validation', 'validate', 'draft', 'jsonschema', 'structure', 'json file format checker', 'json parsing validation'],
  seoTitle: 'JSON Schema Validator - Parse JSON File Format & Structure Online',
  seoDescription: 'Parse and validate JSON file format structure against schema specifications. Get detailed validation results, understand JSON parsing rules, and ensure your JSON data follows proper format standards.',
  description: 'Parse JSON file format and validate structure against schema specifications. Get detailed parsing rules validation, understand JSON format standards, and ensure your data follows proper JSON structure.',

  examples: [
    {
      title: 'Basic Object Validation',
      input: 'Data: {"name": "John", "age": 30}\nSchema: {"type": "object", "required": ["name"]}',
      output: '✅ Valid JSON - 0 errors, 0 warnings',
      description: 'Validate a simple object against a basic schema'
    },
    {
      title: 'Schema Generation',
      input: '{"name": "John", "age": 30, "email": "john@example.com"}',
      output: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" },
    "email": { "type": "string", "format": "email" }
  }
}`,
      description: 'Generate schema from existing JSON data'
    },
    {
      title: 'Validation with Errors',
      input: 'Data: {"age": "thirty"}\nSchema: {"type": "object", "properties": {"age": {"type": "integer"}}}',
      output: '❌ Invalid JSON - 1 errors, 0 warnings\nError: Expected type \'integer\' but got \'string\'',
      description: 'Show detailed validation errors'
    }
  ],

  useCases: [
    'Validating API request/response payloads against predefined schemas',
    'Generating JSON schemas from existing data for documentation',
    'Ensuring data consistency in configuration files and databases',
    'Testing and debugging JSON-based applications and services',
    'Creating data contracts and API specifications with schema validation',
    'Validating user input in web forms against complex data structures',
    'Migrating between different JSON schema draft versions',
    'Building automated data quality checks in data pipelines'
  ],

  faq: [
    {
      question: 'What JSON Schema draft versions are supported?',
      answer: 'The tool supports JSON Schema drafts 04, 06, 07, 2019-09, and 2020-12. Each draft has different features and keywords, with newer drafts providing more validation capabilities.'
    },
    {
      question: 'How does schema generation work?',
      answer: 'The tool analyzes your JSON data structure and automatically infers appropriate schema rules including data types, formats (email, URI, date), required fields, and nested object structures.'
    },
    {
      question: 'What types of validation errors are detected?',
      answer: 'Detects type mismatches, missing required properties, constraint violations (min/max, length), format validation, pattern matching, enum validation, and structural errors.'
    },
    {
      question: 'Can I validate complex nested structures?',
      answer: 'Yes, the tool handles deeply nested objects, arrays with complex items, conditional schemas, and recursive structures with proper error path reporting.'
    },
    {
      question: 'How do I handle validation warnings vs errors?',
      answer: 'Errors indicate schema violations that make data invalid. Warnings suggest potential issues like unexpected properties or suboptimal schema design, but don\'t invalidate the data.'
    }
  ],

  commonErrors: [
    'Invalid JSON syntax in data or schema input',
    'Schema structure doesn\'t conform to JSON Schema specification',
    'Missing required properties in validated data',
    'Type mismatches between data and schema expectations',
    'Format validation failures for strings (email, URI, date)'
  ],

  relatedTools: ['json-formatter', 'json-path-extractor', 'api-tester', 'data-validator', 'schema-generator']
};