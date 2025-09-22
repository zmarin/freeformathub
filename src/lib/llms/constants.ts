import type { Tool } from '../../types/tool';

export const FREEFORMATHUB_BASE_URL = 'https://freeformathub.com';

export const LLMS_CATEGORY_IDS = ['json-tools', 'text-tools', 'data-converters', 'password-tools'] as const;
export type LlmsCategoryId = typeof LLMS_CATEGORY_IDS[number];

export const CATEGORY_FEATURED_TOOL_IDS: Record<LlmsCategoryId, string[]> = {
  'json-tools': [
    'json-formatter',
    'json-to-csv',
    'csv-to-json',
    'json-to-xml-converter',
    'xml-to-json-converter',
    'json-to-typescript',
    'json-path-extractor',
    'json-schema-validator'
  ],
  'text-tools': [
    'text-statistics',
    'word-counter',
    'text-case-converter',
    'text-diff',
    'regex-tester',
    'line-deduplicator',
    'text-find-replace',
    'list-sorter'
  ],
  'data-converters': [
    'json-to-csv',
    'csv-to-json',
    'json-to-xml-converter',
    'xml-to-json-converter',
    'excel-to-json',
    'json-to-excel',
    'json-to-typescript',
    'base64-encoder'
  ],
  'password-tools': [
    'password-generator',
    'password-strength-checker',
    'password-policy-generator',
    'hash-generator',
    'encryption-tool',
    'jwt-generator',
    'jwt-decoder',
    'file-hash-integrity-checker'
  ]
};

export const CATEGORY_USE_CASES: Record<LlmsCategoryId, string[]> = {
  'json-tools': [
    'Debug API responses with instant validation, linting, and tree views.',
    'Convert JSON payloads into CSV, XML, or Excel for analysts and stakeholders.',
    'Generate TypeScript types and JSON Schema definitions directly from sample data.'
  ],
  'text-tools': [
    'Run readability checks, density metrics, and content QA before publishing.',
    'Normalize casing, trim whitespace, and clean copy for ingestion pipelines.',
    'Compare revisions with diff tools and prototype regex extractions safely.'
  ],
  'data-converters': [
    'Translate raw JSON exports into analyst-friendly CSV or Excel reports.',
    'Move data across JSON, XML, SQL, and Markdown ecosystems without manual fixes.',
    'Prepare assets for the web with Base64, Data URI, and WebP conversion utilities.'
  ],
  'password-tools': [
    'Generate long, compliant passwords and rotation policies in seconds.',
    'Audit password strength and entropy with instant scoring and feedback.',
    'Sign, decode, and verify JWT or API tokens without leaving the browser.'
  ]
};

export const LLMS_PRIORITY_TOOL_IDS: string[] = [
  'json-formatter',
  'json-to-csv',
  'csv-to-json',
  'json-to-typescript',
  'unit-converter',
  'base64-encoder',
  'url-encoder',
  'jwt-decoder',
  'password-generator',
  'sql-formatter',
  'csv-formatter',
  'xml-formatter',
  'yaml-formatter',
  'html-beautifier',
  'text-case-converter',
  'color-converter'
];

export type ToolSelector = (tool: Tool) => boolean;
