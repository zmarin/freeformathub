import React from 'react';

// Formatter components
import { JsonFormatter } from '../components/tools/formatters/JsonFormatter';
import { XmlFormatter } from '../components/tools/formatters/XmlFormatter';
import { YamlFormatter } from '../components/tools/formatters/YamlFormatter';
import { CssBeautifier } from '../components/tools/formatters/CssBeautifier';
import { JsBeautifier } from '../components/tools/formatters/JsBeautifier';
import { SqlFormatter } from '../components/tools/formatters/SqlFormatter';
import { CsvFormatter } from '../components/tools/formatters/CsvFormatter';
// import { HtmlBeautifier } from '../components/tools/formatters/HtmlBeautifier'; // Temporarily disabled due to syntax error

// Encoder components
import { Base64Encoder } from '../components/tools/encoders/Base64Encoder';
import { UrlEncoder } from '../components/tools/encoders/UrlEncoder';
import { JwtDecoder } from '../components/tools/encoders/JwtDecoder';
import { StringEscape } from '../components/tools/encoders/StringEscape';

// Converter components
import { MarkdownConverter } from '../components/tools/converters/MarkdownConverter';
import { ColorConverter } from '../components/tools/converters/ColorConverter';
import { NumberBaseConverter } from '../components/tools/converters/NumberBaseConverter';
import { UnitConverter } from '../components/tools/converters/UnitConverter';

// Crypto components
import { HashGenerator } from '../components/tools/crypto/HashGenerator';
import { PasswordGenerator } from '../components/tools/crypto/PasswordGenerator';

// Network components
import { IpSubnetCalculator } from '../components/tools/network/IpSubnetCalculator';

// Generator components
import { UuidGenerator } from '../components/tools/generators/UuidGenerator';

// Validator components
import { EmailValidator } from '../components/tools/validators/EmailValidator';
import { JsonSchemaValidator } from '../components/tools/validators/JsonSchemaValidator';
import { Html5Validator } from '../components/tools/validators/Html5Validator';

// Text components
import { TextCaseConverter } from '../components/tools/text/TextCaseConverter';
import { RegexTester } from '../components/tools/text/RegexTester';
import { TextStatistics } from '../components/tools/text/TextStatistics';
import { DiffChecker } from '../components/tools/text/DiffChecker';
import { LoremIpsumGenerator } from '../components/tools/text/LoremIpsumGenerator';

// Web components
import { CssMinifier } from '../components/tools/web/CssMinifier';
import { JsMinifier } from '../components/tools/web/JsMinifier';
import { UrlParser } from '../components/tools/web/UrlParser';
import { HttpStatusCodes } from '../components/tools/web/HttpStatusCodes';
import { UserAgentParser } from '../components/tools/web/UserAgentParser';
import { HtmlVisualizer } from '../components/tools/web/HtmlVisualizer';

// Additional crypto components
import { EncryptionTool } from '../components/tools/crypto/EncryptionTool';

// Additional validators
import { PhoneNumberValidator } from '../components/tools/validators/PhoneNumberValidator';
import { CreditCardValidator } from '../components/tools/validators/CreditCardValidator';
import { UrlValidator } from '../components/tools/validators/UrlValidator';

// Additional generators
import { QrCodeGenerator } from '../components/tools/generators/QrCodeGenerator';
import { MockDataGenerator } from '../components/tools/generators/MockDataGenerator';

// Network tools
import { DnsLookup } from '../components/tools/network/DnsLookup';
import { WhoisLookup } from '../components/tools/network/WhoisLookup';

// Date/Time tools
import { TimestampConverter } from '../components/tools/datetime/TimestampConverter';
import { CronGenerator } from '../components/tools/datetime/CronGenerator';
import { TimeDecimalConverter } from '../components/tools/datetime/TimeDecimalConverter';

export type ToolComponent = React.ComponentType<any>;

export const TOOL_COMPONENTS: Record<string, ToolComponent> = {
  // Formatters
  'json-formatter': JsonFormatter,
  'xml-formatter': XmlFormatter,
  'yaml-formatter': YamlFormatter,
  'css-beautifier': CssBeautifier,
  'js-beautifier': JsBeautifier,
  'sql-formatter': SqlFormatter,
  'csv-formatter': CsvFormatter,
  // 'html-beautifier': HtmlBeautifier, // Temporarily disabled due to syntax error

  // Encoders
  'base64-encoder': Base64Encoder,
  'url-encoder': UrlEncoder,
  'jwt-decoder': JwtDecoder,
  'string-escape': StringEscape,

  // Converters - Critical missing tools
  'markdown-converter': MarkdownConverter,
  'color-converter': ColorConverter,
  'number-base-converter': NumberBaseConverter,
  'unit-converter': UnitConverter,

  // Crypto
  'hash-generator': HashGenerator,
  'password-generator': PasswordGenerator,

  // Network
  'ip-subnet-calculator': IpSubnetCalculator,

  // Generators
  'uuid-generator': UuidGenerator,

  // Validators
  'email-validator': EmailValidator,
  'json-schema-validator': JsonSchemaValidator,
  'html5-validator': Html5Validator,

  // Text tools
  'text-case-converter': TextCaseConverter,
  'regex-tester': RegexTester,
  'text-statistics': TextStatistics,
  'diff-checker': DiffChecker,
  'lorem-ipsum-generator': LoremIpsumGenerator,

  // Web tools
  'css-minifier': CssMinifier,
  'js-minifier': JsMinifier,
  'url-parser': UrlParser,
  'http-status-codes': HttpStatusCodes,
  'user-agent-parser': UserAgentParser,
  'html-visualizer': HtmlVisualizer,

  // Additional crypto
  'encryption-tool': EncryptionTool,

  // Additional validators
  'phone-number-validator': PhoneNumberValidator,
  'credit-card-validator': CreditCardValidator,
  'url-validator': UrlValidator,

  // Additional generators
  'qr-code-generator': QrCodeGenerator,
  'mock-data-generator': MockDataGenerator,

  // Additional network tools
  'dns-lookup': DnsLookup,
  'whois-lookup': WhoisLookup,

  // Date/Time tools
  'timestamp-converter': TimestampConverter,
  'cron-generator': CronGenerator,
  'time-decimal-converter': TimeDecimalConverter,
};

export function getToolComponent(slug: string): ToolComponent | null {
  return TOOL_COMPONENTS[slug] || null;
}

export function hasToolComponent(slug: string): boolean {
  return slug in TOOL_COMPONENTS;
}
