import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import type { Tool, ToolConfig, ToolResult } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JsonSchemaValidatorConfig extends ToolConfig {
  allErrors: boolean;
  coerceTypes: boolean;
  removeAdditional: 'none' | 'failing' | 'all';
  allowUnionTypes: boolean;
  strictMode: boolean;
}

interface ValidationSummary {
  valid: boolean;
  errors: ErrorObject[];
  schemaValid: boolean;
  errorCount: number;
}

const ajvCache = new Map<string, Ajv>();

function getAjvInstance(config: JsonSchemaValidatorConfig): Ajv {
  const cacheKey = JSON.stringify({
    allErrors: config.allErrors,
    coerceTypes: config.coerceTypes,
    removeAdditional: config.removeAdditional,
    allowUnionTypes: config.allowUnionTypes,
    strictMode: config.strictMode
  });

  const existing = ajvCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const removeAdditional =
    config.removeAdditional === 'none' ? false : config.removeAdditional;

  const ajv = new Ajv({
    allErrors: config.allErrors,
    coerceTypes: config.coerceTypes,
    removeAdditional,
    allowUnionTypes: config.allowUnionTypes,
    strict: config.strictMode,
    messages: true
  });

  ajvCache.set(cacheKey, ajv);
  return ajv;
}

function runValidation(
  schemaJson: string,
  dataJson: string,
  config: JsonSchemaValidatorConfig
): ValidationSummary | never {
  let schema: unknown;
  let data: unknown;

  try {
    schema = JSON.parse(schemaJson);
  } catch (error) {
    throw new Error(
      `Schema is not valid JSON. ${(error as Error).message ?? 'Parsing failed.'}`
    );
  }

  try {
    data = dataJson.trim() ? JSON.parse(dataJson) : undefined;
  } catch (error) {
    throw new Error(
      `Data payload is not valid JSON. ${(error as Error).message ?? 'Parsing failed.'}`
    );
  }

  const ajv = getAjvInstance(config);
  let validate;

  try {
    validate = ajv.compile(schema);
  } catch (error) {
    throw new Error(
      `Schema compilation failed: ${(error as Error).message ?? 'Unknown error.'}`
    );
  }

  const valid = validate(data);
  const errors = Array.isArray(validate.errors) ? validate.errors : [];

  return {
    valid,
    errors,
    schemaValid: true,
    errorCount: errors.length
  };
}

function formatValidationOutput(
  summary: ValidationSummary,
  config: JsonSchemaValidatorConfig
): { output: string; metadata: Record<string, any> } {
  if (summary.valid) {
    const lines = [
      '✅ JSON instance is valid against the provided schema.',
      '',
      '### Validation Settings',
      `• All errors: ${config.allErrors ? 'enabled' : 'disabled'}`,
      `• Type coercion: ${config.coerceTypes ? 'enabled' : 'disabled'}`,
      `• Remove additional properties: ${config.removeAdditional}`,
      `• Allow union types: ${config.allowUnionTypes ? 'yes' : 'no'}`,
      `• Strict mode: ${config.strictMode ? 'enabled' : 'disabled'}`
    ];

    return {
      output: lines.join('\n'),
      metadata: {
        valid: true,
        errorCount: 0,
        configuration: {
          allErrors: config.allErrors,
          coerceTypes: config.coerceTypes,
          removeAdditional: config.removeAdditional,
          allowUnionTypes: config.allowUnionTypes,
          strictMode: config.strictMode
        }
      }
    };
  }

  const errorLines: string[] = [
    '❌ JSON instance failed schema validation.',
    '',
    `Total errors: ${summary.errorCount}`,
    ''
  ];

  summary.errors.forEach((error, index) => {
    const path = error.instancePath || '/';
    const keyword = error.keyword ? ` (${error.keyword})` : '';
    errorLines.push(
      `${index + 1}. Path: \`${path}\`${keyword}\n   ↳ ${error.message ?? 'Validation error.'}`
    );

    if (error.params && Object.keys(error.params).length > 0) {
      errorLines.push(`   Details: ${JSON.stringify(error.params)}`);
    }
    errorLines.push('');
  });

  return {
    output: errorLines.join('\n'),
    metadata: {
      valid: false,
      errorCount: summary.errorCount,
      errors: summary.errors.map(error => ({
        instancePath: error.instancePath,
        schemaPath: error.schemaPath,
        message: error.message,
        params: error.params
      })),
      configuration: {
        allErrors: config.allErrors,
        coerceTypes: config.coerceTypes,
        removeAdditional: config.removeAdditional,
        allowUnionTypes: config.allowUnionTypes,
        strictMode: config.strictMode
      }
    }
  };
}

export const JSON_SCHEMA_VALIDATOR_TOOL: Tool = {
  id: 'json-schema-validator',
  name: 'JSON Schema Validator',
  description:
    'Validate JSON payloads against JSON Schema drafts using Ajv with configurable strictness, coercion, and error reporting — all offline in your browser.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!.subcategories!.find(
    sub => sub.id === 'format-validation'
  )!,
  slug: 'json-schema-validator',
  icon: '📐',
  keywords: [
    'json schema validation',
    'json validator',
    'schema validator',
    'ajv',
    'json rules',
    'data validation',
    'json schema draft',
    'schema checker'
  ],
  seoTitle: 'JSON Schema Validator Online - Validate JSON with Ajv',
  seoDescription:
    'Validate JSON against JSON Schema drafts in your browser. Supports Ajv options like allErrors, type coercion, and removing additional properties. Instant, private validation.',
  examples: [
    {
      title: 'User Profile Schema',
      input: JSON.stringify(
        {
          schema: {
            type: 'object',
            required: ['id', 'email'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              age: { type: 'integer', minimum: 18 }
            }
          },
          data: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            email: 'user@example.com',
            age: 27
          }
        },
        null,
        2
      ),
      output: '✅ JSON instance is valid against the provided schema.',
      description: 'Validate a simple user profile object with required fields.'
    },
    {
      title: 'Invalid Payload Example',
      input: JSON.stringify(
        {
          schema: {
            type: 'object',
            properties: {
              price: { type: 'number', minimum: 0 },
              tags: {
                type: 'array',
                items: { type: 'string' },
                uniqueItems: true
              }
            },
            additionalProperties: false
          },
          data: {
            price: -5,
            tags: ['sale', 'sale']
          }
        },
        null,
        2
      ),
      output: '❌ JSON instance failed schema validation.',
      description: 'Demonstrate error reporting for invalid numeric range and duplicate items.'
    }
  ],
  useCases: [
    'Validate API responses against published schemas before releasing changes',
    'Check configuration files submitted by customers or integration partners',
    'Embed into QA workflows to catch schema regressions early',
    'Generate documentation examples that pass strict schema validation',
    'Normalize data ingestion pipelines with type coercion and property removal'
  ],
  commonErrors: [
    'Schema JSON is invalid or uses unsupported draft keywords',
    'Data payload is not valid JSON or does not satisfy the schema',
    'Strict mode rejects unknown keywords or format usage',
    'Removing additional properties hides fields required downstream',
    'Coercing types changes numeric or boolean precision unexpectedly'
  ],
  faq: [
    {
      question: 'Which JSON Schema drafts are supported?',
      answer: 'Ajv supports draft-04 through draft-2020-12. Provide a $schema property in your schema to target a specific draft when needed.'
    },
    {
      question: 'Can I validate without providing data?',
      answer: 'Yes. Leave the data panel empty to validate only the schema structure and catch compile-time issues.'
    },
    {
      question: 'What does removing additional properties do?',
      answer: 'It strips properties not defined in the schema. Use with caution if you need to surface unexpected fields instead of silently dropping them.'
    },
    {
      question: 'How do I validate multiple documents?',
      answer: 'Run each JSON instance individually or paste an array of objects if your schema expects an array. The validator processes exactly what you provide.'
    },
    {
      question: 'Does the tool send my data anywhere?',
      answer: 'No. Validation runs entirely in your browser using Ajv, so schemas and payloads never leave your device.'
    }
  ],
  relatedTools: [
    'json-formatter',
    'json-to-typescript',
    'api-response-formatter',
    'regex-tester',
    'markdown-converter'
  ],
  howItWorks: [
    {
      title: 'Provide Schema & JSON Payload',
      icon: '📥',
      description:
        'Paste or upload your JSON Schema on the left and the JSON document you want to validate on the right. Leave the payload empty to validate the schema alone.',
      keywords: ['paste schema', 'json payload', 'schema only validation', 'upload json', 'client side']
    },
    {
      title: 'Configure Validation Rules',
      icon: '⚙️',
      description:
        'Toggle allErrors, type coercion, additional property handling, and strict mode to match your environment or API contract expectations.',
      keywords: ['ajv options', 'allErrors', 'coerce types', 'remove additional', 'strict mode']
    },
    {
      title: 'Run Ajv Validation Instantly',
      icon: '⚡',
      description:
        'Validation executes locally via Ajv, returning readable summaries with instance paths, failing keywords, and contextual parameters for each issue.',
      keywords: ['ajv validation', 'instance path', 'keyword failure', 'local processing', 'error summary']
    },
    {
      title: 'Export or Share Results',
      icon: '📤',
      description:
        'Copy the formatted report, download the results, or store the run in tool history for audit trails, QA reports, or regression test artifacts.',
      keywords: ['copy results', 'download report', 'history', 'audit trail', 'qa workflow']
    }
  ],
  problemsSolved: [
    {
      problem:
        'Schema mismatches reach production because teams lack a quick way to validate JSON payloads against updated contracts.',
      solution:
        'Catch contract violations before deploys with instant, browser-based Ajv validation that highlights failing paths and keywords.',
      icon: '🚨',
      keywords: ['contract testing', 'api regression', 'schema mismatch', 'pre deployment', 'ci cd']
    },
    {
      problem:
        'Maintaining strict schemas across microservices is difficult when optional features rely on different validation rules.',
      solution:
        'Toggle Ajv options like allowUnionTypes, removeAdditional, and strict mode per environment to mirror staging and production behavior.',
      icon: '🔧',
      keywords: ['microservices', 'environment parity', 'ajv configuration', 'schema governance']
    },
    {
      problem:
        'Debugging Ajv errors can be cryptic when instance paths and params are buried in the console.',
      solution:
        'Readable error summaries with instance paths, keyword context, and structured metadata make triaging validation failures fast for any teammate.',
      icon: '🧭',
      keywords: ['error readability', 'debugging', 'instance path', 'keyword context', 'team collaboration']
    }
  ],
  whyChoose: [
    {
      title: 'Powered by Ajv',
      description:
        'Leverages the industry-standard Ajv validator with configurable drafts and options, so results match modern backend implementations.',
      icon: '🛠️',
      keywords: ['ajv', 'json schema', 'industry standard', 'backend parity']
    },
    {
      title: 'Privacy-First Validation',
      description:
        'Schemas and payloads never leave your browser, making it safe for regulated data and pre-release APIs.',
      icon: '🔒',
      keywords: ['local validation', 'secure tool', 'no upload', 'regulated data']
    },
    {
      title: 'Actionable Reporting',
      description:
        'Readable Markdown output, structured metadata, and history tracking help teams document issues and automate regression checks.',
      icon: '📊',
      keywords: ['markdown report', 'structured metadata', 'history', 'regression testing']
    },
    {
      title: 'Developer-Friendly UX',
      description:
        'Dual editors, copy/download helpers, and auto-validation keep productivity high when iterating on schemas or onboarding teammates.',
      icon: '💡',
      keywords: ['dual editor', 'auto validation', 'copy helper', 'developer productivity']
    }
  ]
};

export function validateJsonSchema(
  schema: string,
  data: string,
  config: JsonSchemaValidatorConfig
): ToolResult {
  try {
    const summary = runValidation(schema, data, config);
    const { output, metadata } = formatValidationOutput(summary, config);

    return {
      success: summary.valid,
      output,
      metadata
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'JSON Schema validation failed.'
    };
  }
}
