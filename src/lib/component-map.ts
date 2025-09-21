import React from 'react';

// Color components
import { AdvancedColorPaletteGenerator } from '../components/tools/color/AdvancedColorPaletteGenerator';
import ColorBlindnessSimulator from '../components/tools/color/ColorBlindnessSimulator';

// Converter components
import { ColorConverter } from '../components/tools/converters/ColorConverter';
import { CssToTailwindConverter } from '../components/tools/converters/CssToTailwindConverter';
import { CsvToJson } from '../components/tools/converters/CsvToJson';
import { DataFormatTransformer } from '../components/tools/converters/DataFormatTransformer';
import { DataUriConverter } from '../components/tools/converters/DataUriConverter';
import { ImageFormatConverter } from '../components/tools/converters/ImageFormatConverter';
import { ImageToBase64Converter } from '../components/tools/converters/ImageToBase64Converter';
import { JsonToCsv } from '../components/tools/converters/JsonToCsv';
import { JsonToTypescript } from '../components/tools/converters/JsonToTypescript';
import { JsonToXmlConverter } from '../components/tools/converters/JsonToXmlConverter';
import { MarkdownConverter } from '../components/tools/converters/MarkdownConverter';
import { NumberBaseConverter } from '../components/tools/converters/NumberBaseConverter';
import { UnitConverter } from '../components/tools/converters/UnitConverter';
import { WebPConverter } from '../components/tools/converters/WebPConverter';
import { XmlToJsonConverter } from '../components/tools/converters/XmlToJsonConverter';
import PdfTextExtractor from '../components/tools/converters/PdfTextExtractor';
import ExcelToJsonConverter from '../components/tools/converters/ExcelToJsonConverter';
import JsonToExcelConverter from '../components/tools/converters/JsonToExcelConverter';

// Crypto components
import { EncryptionTool } from '../components/tools/crypto/EncryptionTool';
import { FileHashIntegrityChecker } from '../components/tools/crypto/FileHashIntegrityChecker';
import { HashGenerator } from '../components/tools/crypto/HashGenerator';
import JWTGenerator from '../components/tools/crypto/JWTGenerator';
import { PasswordGenerator } from '../components/tools/crypto/PasswordGenerator';
import { PasswordPolicyGenerator } from '../components/tools/crypto/PasswordPolicyGenerator';
import { PasswordStrengthChecker } from '../components/tools/crypto/PasswordStrengthChecker';

// Data components
import { BinaryHexViewer } from '../components/tools/data/BinaryHexViewer';
import { CsvSplitter } from '../components/tools/data/CsvSplitter';
import CsvTableViewer from '../components/tools/data/CsvTableViewer';
import { ImageCompressor } from '../components/tools/data/ImageCompressor';
import { ImageMetadataExtractor } from '../components/tools/data/ImageMetadataExtractor';
import PdfTools from '../components/tools/data/PdfTools';

// Date/Time components
import { CronGenerator } from '../components/tools/datetime/CronGenerator';
import { TimeDecimalConverter } from '../components/tools/datetime/TimeDecimalConverter';
import { TimestampConverter } from '../components/tools/datetime/TimestampConverter';
import { TimestampFormatter } from '../components/tools/datetime/TimestampFormatter';
import { TimezoneConverter } from '../components/tools/datetime/TimezoneConverter';

// Development components
import { DatabaseQueryOptimizer } from '../components/tools/development/DatabaseQueryOptimizer';
import { DatabaseSchemaVisualizer } from '../components/tools/development/DatabaseSchemaVisualizer';
import { JsonPathExtractor } from '../components/tools/development/JsonPathExtractor';
import { LoadTestingConfigGenerator } from '../components/tools/development/LoadTestingConfigGenerator';
import { PerformanceBudgetCalculator } from '../components/tools/development/PerformanceBudgetCalculator';
import { SqlQueryBuilder } from '../components/tools/development/SqlQueryBuilder';
import { YamlValidator } from '../components/tools/development/YamlValidator';

// Encoder components
import Base32Encoder from '../components/tools/encoders/Base32Encoder';
import { Base64Encoder } from '../components/tools/encoders/Base64Encoder';
import { Base64ImageDecoder } from '../components/tools/encoders/Base64ImageDecoder';
import { Base64ImageEncoder } from '../components/tools/encoders/Base64ImageEncoder';
import { CertificateDecoder } from '../components/tools/encoders/CertificateDecoder';
import EmojiConverter from '../components/tools/encoders/EmojiConverter';
import HtmlEntityEncoder from '../components/tools/encoders/HtmlEntityEncoder';
import { HtmlEntityDecoder } from '../components/tools/encoders/HtmlEntityDecoder';
import { JwtDecoder } from '../components/tools/encoders/JwtDecoder';
import { StringEscape } from '../components/tools/encoders/StringEscape';
import { UrlEncoder } from '../components/tools/encoders/UrlEncoder';

// Formatter components
import { JsonFormatter } from '../components/tools/formatters/JsonFormatter';
import { XmlFormatter } from '../components/tools/formatters/XmlFormatter';
import { YamlFormatter } from '../components/tools/formatters/YamlFormatter';
import { CssBeautifier } from '../components/tools/formatters/CssBeautifier';
import { JsBeautifier } from '../components/tools/formatters/JsBeautifier';
import { SqlFormatter } from '../components/tools/formatters/SqlFormatter';
import { CsvFormatter } from '../components/tools/formatters/CsvFormatter';
import { HtmlBeautifier } from '../components/tools/formatters/HtmlBeautifier';

// Generator components
import { BarcodeGenerator } from '../components/tools/generators/BarcodeGenerator';
import { MockDataGenerator } from '../components/tools/generators/MockDataGenerator';
import { QrCodeGenerator } from '../components/tools/generators/QrCodeGenerator';
import { QrGenerator } from '../components/tools/generators/QrGenerator';
import { UuidGenerator } from '../components/tools/generators/UuidGenerator';

// Network components
import { ApiRateLimiterCalculator } from '../components/tools/network/ApiRateLimiterCalculator';
import { DnsLookup } from '../components/tools/network/DnsLookup';
import { IpRangeCalculator } from '../components/tools/network/IpRangeCalculator';
import { IpSubnetCalculator } from '../components/tools/network/IpSubnetCalculator';
import { PortScanner } from '../components/tools/network/PortScanner';
import { WhoisLookup } from '../components/tools/network/WhoisLookup';

// Text components
import AsciiArtGenerator from '../components/tools/text/AsciiArtGenerator';
import { DiffChecker } from '../components/tools/text/DiffChecker';
import { LoremIpsum } from '../components/tools/text/LoremIpsum';
import { LoremIpsumGenerator } from '../components/tools/text/LoremIpsumGenerator';
import { MarkdownTableGenerator } from '../components/tools/text/MarkdownTableGenerator';
import { RegexPatternAnalyzer } from '../components/tools/text/RegexPatternAnalyzer';
import { RegexTester } from '../components/tools/text/RegexTester';
import { TextAnalytics } from '../components/tools/text/TextAnalytics';
import { TextCaseConverter } from '../components/tools/text/TextCaseConverter';
import { TextDiff } from '../components/tools/text/TextDiff';
import { TextStatistics } from '../components/tools/text/TextStatistics';
import { WordCounter } from '../components/tools/text/WordCounter';
import LineDeduplicator from '../components/tools/text/LineDeduplicator';
import TextFindReplace from '../components/tools/text/TextFindReplace';
import ListSorter from '../components/tools/text/ListSorter';

// Validator components
import { CreditCardValidator } from '../components/tools/validators/CreditCardValidator';
import { EmailValidator } from '../components/tools/validators/EmailValidator';
import { Html5Validator } from '../components/tools/validators/Html5Validator';
import { IbanValidator } from '../components/tools/validators/IbanValidator';
import { JsonSchemaValidator } from '../components/tools/validators/JsonSchemaValidator';
import { PhoneNumberValidator } from '../components/tools/validators/PhoneNumberValidator';
import { UrlValidator } from '../components/tools/validators/UrlValidator';

// Web components
import { ApiDocumentationGenerator } from '../components/tools/web/ApiDocumentationGenerator';
import { ApiRequestBuilder } from '../components/tools/web/ApiRequestBuilder';
import { ApiResponseFormatter } from '../components/tools/web/ApiResponseFormatter';
import CSSGridGenerator from '../components/tools/web/CSSGridGenerator';
import { CssMinifier } from '../components/tools/web/CssMinifier';
import { CssSelectorGenerator } from '../components/tools/web/CssSelectorGenerator';
import { HtmlMinifier } from '../components/tools/web/HtmlMinifier';
import { HtmlVisualizer } from '../components/tools/web/HtmlVisualizer';
import { HttpStatusCodes } from '../components/tools/web/HttpStatusCodes';
import { JsMinifier } from '../components/tools/web/JsMinifier';
import { SecurityHeadersAnalyzer } from '../components/tools/web/SecurityHeadersAnalyzer';
import SvgEditor from '../components/tools/web/SvgEditor';
import { SVGOptimizer } from '../components/tools/web/SVGOptimizer';
import { UrlParser } from '../components/tools/web/UrlParser';
import { UrlShortener } from '../components/tools/web/UrlShortener';
import { UserAgentParser } from '../components/tools/web/UserAgentParser';
import { WebhookTestingTool } from '../components/tools/web/WebhookTestingTool';

export type ToolComponent = React.ComponentType<any>;

export const TOOL_COMPONENTS: Record<string, ToolComponent> = {
  // Color tools
  'advanced-color-palette-generator': AdvancedColorPaletteGenerator,
  'color-blindness-simulator': ColorBlindnessSimulator,

  // Converter tools
  'json-to-csv': JsonToCsv,
  'csv-to-json': CsvToJson,
  'json-to-typescript': JsonToTypescript,
  'json-to-xml-converter': JsonToXmlConverter,
  'xml-to-json-converter': XmlToJsonConverter,
  'markdown-converter': MarkdownConverter,
  'color-converter': ColorConverter,
  'number-base-converter': NumberBaseConverter,
  'unit-converter': UnitConverter,
  'css-to-tailwind-converter': CssToTailwindConverter,
  'data-format-transformer': DataFormatTransformer,
  'data-uri-converter': DataUriConverter,
  'image-format-converter': ImageFormatConverter,
  'image-to-base64-converter': ImageToBase64Converter,
  'webp-converter': WebPConverter,
  'pdf-text-extractor': PdfTextExtractor,
  'excel-to-json': ExcelToJsonConverter,
  'json-to-excel': JsonToExcelConverter,

  // Crypto tools
  'hash-generator': HashGenerator,
  'encryption-tool': EncryptionTool,
  'password-generator': PasswordGenerator,
  'password-policy-generator': PasswordPolicyGenerator,
  'password-strength-checker': PasswordStrengthChecker,
  'file-hash-integrity-checker': FileHashIntegrityChecker,
  'jwt-generator': JWTGenerator,

  // Data tools
  'binary-hex-viewer': BinaryHexViewer,
  'csv-splitter': CsvSplitter,
  'csv-table-viewer': CsvTableViewer,
  'image-compressor': ImageCompressor,
  'image-metadata-extractor': ImageMetadataExtractor,
  'pdf-tools': PdfTools,

  // Date/Time tools
  'timestamp-converter': TimestampConverter,
  'timestamp-formatter': TimestampFormatter,
  'cron-generator': CronGenerator,
  'time-decimal-converter': TimeDecimalConverter,
  'timezone-converter': TimezoneConverter,

  // Development tools
  'database-query-optimizer': DatabaseQueryOptimizer,
  'database-schema-visualizer': DatabaseSchemaVisualizer,
  'json-path-extractor': JsonPathExtractor,
  'load-testing-config-generator': LoadTestingConfigGenerator,
  'performance-budget-calculator': PerformanceBudgetCalculator,
  'sql-query-builder': SqlQueryBuilder,
  'yaml-validator': YamlValidator,

  // Encoder tools
  'base32-encoder': Base32Encoder,
  'base64-encoder': Base64Encoder,
  'base64-image-decoder': Base64ImageDecoder,
  'base64-image-encoder': Base64ImageEncoder,
  'certificate-decoder': CertificateDecoder,
  'emoji-converter': EmojiConverter,
  'html-entity-decoder': HtmlEntityDecoder,
  'html-entity-encoder': HtmlEntityEncoder,
  'jwt-decoder': JwtDecoder,
  'string-escape': StringEscape,
  'url-encoder': UrlEncoder,

  // Formatter tools
  'json-formatter': JsonFormatter,
  'xml-formatter': XmlFormatter,
  'yaml-formatter': YamlFormatter,
  'css-beautifier': CssBeautifier,
  'js-beautifier': JsBeautifier,
  'sql-formatter': SqlFormatter,
  'csv-formatter': CsvFormatter,
  'html-beautifier': HtmlBeautifier,

  // Generator tools
  'barcode-generator': BarcodeGenerator,
  'mock-data-generator': MockDataGenerator,
  'qr-code-generator': QrCodeGenerator,
  'qr-generator': QrGenerator,
  'uuid-generator': UuidGenerator,

  // Network tools
  'api-rate-limiter-calculator': ApiRateLimiterCalculator,
  'dns-lookup': DnsLookup,
  'ip-range-calculator': IpRangeCalculator,
  'ip-subnet-calculator': IpSubnetCalculator,
  'port-scanner': PortScanner,
  'whois-lookup': WhoisLookup,

  // Text tools
  'text-case-converter': TextCaseConverter,
  'regex-tester': RegexTester,
  'regex-pattern-analyzer': RegexPatternAnalyzer,
  'text-analytics': TextAnalytics,
  'text-diff': TextDiff,
  'text-statistics': TextStatistics,
  'word-counter': WordCounter,
  'diff-checker': DiffChecker,
  'ascii-art-generator': AsciiArtGenerator,
  'lorem-ipsum-generator': LoremIpsumGenerator,
  'lorem-ipsum': LoremIpsum,
  'markdown-table-generator': MarkdownTableGenerator,
  'line-deduplicator': LineDeduplicator,
  'text-find-replace': TextFindReplace,
  'list-sorter': ListSorter,

  // Validator tools
  'email-validator': EmailValidator,
  'json-schema-validator': JsonSchemaValidator,
  'html5-validator': Html5Validator,
  'credit-card-validator': CreditCardValidator,
  'phone-number-validator': PhoneNumberValidator,
  'iban-validator': IbanValidator,
  'url-validator': UrlValidator,

  // Web tools
  'api-documentation-generator': ApiDocumentationGenerator,
  'api-request-builder': ApiRequestBuilder,
  'api-response-formatter': ApiResponseFormatter,
  'css-minifier': CssMinifier,
  'css-selector-generator': CssSelectorGenerator,
  'css-grid-generator': CSSGridGenerator,
  'html-minifier': HtmlMinifier,
  'html-visualizer': HtmlVisualizer,
  'http-status-codes': HttpStatusCodes,
  'js-minifier': JsMinifier,
  'security-headers-analyzer': SecurityHeadersAnalyzer,
  'svg-editor': SvgEditor,
  'svg-optimizer': SVGOptimizer,
  'url-parser': UrlParser,
  'url-shortener': UrlShortener,
  'user-agent-parser': UserAgentParser,
  'webhook-testing-tool': WebhookTestingTool,

  // Web utilities still considered web
  // 'html-beautifier': HtmlBeautifier,
};

export function getToolComponent(slug: string): ToolComponent | null {
  return TOOL_COMPONENTS[slug] || null;
}

export function hasToolComponent(slug: string): boolean {
  return slug in TOOL_COMPONENTS;
}
