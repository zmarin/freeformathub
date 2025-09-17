import { registerTool } from './registry';

// Formatter tools
import { JSON_FORMATTER_TOOL } from '../../tools/formatters/json-formatter';
import { XML_FORMATTER_TOOL } from '../../tools/formatters/xml-formatter';
import { YAML_FORMATTER_TOOL } from '../../tools/formatters/yaml-formatter';
import { CSS_BEAUTIFIER_TOOL } from '../../tools/formatters/css-beautifier';
import { HTML_BEAUTIFIER_TOOL } from '../../tools/formatters/html-beautifier';
import { JS_BEAUTIFIER_TOOL } from '../../tools/formatters/js-beautifier';
import { SQL_FORMATTER_TOOL } from '../../tools/formatters/sql-formatter';
import { CSV_FORMATTER_TOOL } from '../../tools/formatters/csv-formatter';

// Converter tools
import { JSON_TO_CSV_TOOL } from '../../tools/converters/json-to-csv';
import { CSV_TO_JSON_TOOL } from '../../tools/converters/csv-to-json';
import { JSON_TO_XML_CONVERTER_TOOL } from '../../tools/converters/json-to-xml-converter';
import { XML_TO_JSON_CONVERTER_TOOL } from '../../tools/converters/xml-to-json-converter';
import { JSON_TO_TYPESCRIPT_TOOL } from '../../tools/converters/json-to-typescript';
import { MARKDOWN_CONVERTER_TOOL } from '../../tools/converters/markdown-converter';
import { DATA_FORMAT_TRANSFORMER_TOOL } from '../../tools/converters/data-format-transformer';
import { CSS_TO_TAILWIND_CONVERTER_TOOL } from '../../tools/converters/css-to-tailwind-converter';
import { IMAGE_FORMAT_CONVERTER_TOOL } from '../../tools/converters/image-format-converter';
import { WEBP_CONVERTER_TOOL } from '../../tools/converters/webp-converter';
import { IMAGE_TO_BASE64_CONVERTER_TOOL } from '../../tools/converters/image-to-base64-converter';
import { DATA_URI_CONVERTER_TOOL } from '../../tools/converters/data-uri-converter';
import { UNIT_CONVERTER_TOOL } from '../../tools/converters/unit-converter';
import { NUMBER_BASE_CONVERTER_TOOL } from '../../tools/converters/number-base-converter';
import { COLOR_CONVERTER_TOOL } from '../../tools/converters/color-converter';

// Encoder/Decoder tools
import { BASE64_ENCODER_TOOL } from '../../tools/encoders/base64-encoder';
import { BASE32_ENCODER_TOOL } from '../../tools/encoders/base32-encoder';
import { URL_ENCODER_TOOL } from '../../tools/encoders/url-encoder';
import { HTML_ENTITY_ENCODER_TOOL } from '../../tools/encoders/html-entity-encoder';
import { HTML_ENTITY_DECODER_TOOL } from '../../tools/encoders/html-entity-decoder';
import { JWT_DECODER_TOOL } from '../../tools/encoders/jwt-decoder';
import { STRING_ESCAPE_TOOL } from '../../tools/encoders/string-escape';
import { EMOJI_CONVERTER_TOOL } from '../../tools/encoders/emoji-converter';
import { CERTIFICATE_DECODER_TOOL } from '../../tools/encoders/certificate-decoder';
import { BASE64_IMAGE_ENCODER_TOOL } from '../../tools/encoders/base64-image-encoder';
import { BASE64_IMAGE_DECODER_TOOL } from '../../tools/encoders/base64-image-decoder';

// Text tools
import { TEXT_CASE_CONVERTER_TOOL } from '../../tools/text/text-case-converter';
import { TEXT_DIFF_TOOL } from '../../tools/text/text-diff';
import { DIFF_CHECKER_TOOL } from '../../tools/text/diff-checker';
import { TEXT_STATISTICS_TOOL } from '../../tools/text/text-statistics';
import { TEXT_ANALYTICS_TOOL } from '../../tools/text/text-analytics';
import { LOREM_IPSUM_GENERATOR_TOOL } from '../../tools/text/lorem-ipsum-generator';
import { LOREM_IPSUM_TOOL } from '../../tools/text/lorem-ipsum';
import { REGEX_TESTER_TOOL } from '../../tools/text/regex-tester';
import { REGEX_PATTERN_ANALYZER_TOOL } from '../../tools/text/regex-pattern-analyzer';
import { MARKDOWN_TABLE_GENERATOR_TOOL } from '../../tools/text/markdown-table-generator';
import { ASCII_ART_GENERATOR_TOOL } from '../../tools/text/ascii-art-generator';

// Crypto tools
import { HASH_GENERATOR_TOOL } from '../../tools/crypto/hash-generator';
import { ENCRYPTION_TOOL } from '../../tools/crypto/encryption-tool';
import { PASSWORD_GENERATOR_TOOL } from '../../tools/crypto/password-generator';
import { PASSWORD_STRENGTH_CHECKER_TOOL } from '../../tools/crypto/password-strength-checker';
import { PASSWORD_POLICY_GENERATOR_TOOL } from '../../tools/crypto/password-policy-generator';
import { FILE_HASH_INTEGRITY_CHECKER_TOOL } from '../../tools/crypto/file-hash-integrity-checker';
import { JWT_GENERATOR_TOOL } from '../../tools/crypto/jwt-generator';

// Web development tools
import { CSS_MINIFIER_TOOL } from '../../tools/web/css-minifier';
import { HTML_MINIFIER_TOOL } from '../../tools/web/html-minifier';
import { JS_MINIFIER_TOOL } from '../../tools/web/js-minifier';
import { CSS_SELECTOR_GENERATOR_TOOL } from '../../tools/web/css-selector-generator';
import { CSS_GRID_GENERATOR_TOOL } from '../../tools/web/css-grid-generator';
import { SVG_OPTIMIZER_TOOL } from '../../tools/web/svg-optimizer';
import { SVG_EDITOR_TOOL } from '../../tools/web/svg-editor';
import { HTML_VISUALIZER_TOOL } from '../../tools/web/html-visualizer';
import { API_REQUEST_BUILDER_TOOL } from '../../tools/web/api-request-builder';
import { API_RESPONSE_FORMATTER_TOOL } from '../../tools/web/api-response-formatter';
import { API_DOCUMENTATION_GENERATOR_TOOL } from '../../tools/web/api-documentation-generator';
import { WEBHOOK_TESTING_TOOL } from '../../tools/web/webhook-testing-tool';
import { HTTP_STATUS_CODES_TOOL } from '../../tools/web/http-status-codes';
import { USER_AGENT_PARSER_TOOL } from '../../tools/web/user-agent-parser';
import { SECURITY_HEADERS_ANALYZER_TOOL } from '../../tools/web/security-headers-analyzer';

// Color tools
import { ADVANCED_COLOR_PALETTE_GENERATOR_TOOL } from '../../tools/color/advanced-color-palette-generator';
import { COLOR_BLINDNESS_SIMULATOR_TOOL } from '../../tools/color/color-blindness-simulator';

// Date/Time tools
import { TIMESTAMP_CONVERTER_TOOL } from '../../tools/datetime/timestamp-converter';
import { TIMESTAMP_FORMATTER_TOOL } from '../../tools/datetime/timestamp-formatter';
import { CRON_GENERATOR_TOOL } from '../../tools/datetime/cron-generator';
import { TIME_DECIMAL_CONVERTER_TOOL } from '../../tools/datetime/time-decimal-converter';

// Math tools
import { MATH_EXPRESSION_EVALUATOR_TOOL } from '../../tools/math/math-expression-evaluator';

// Network tools
import { IP_SUBNET_CALCULATOR_TOOL } from '../../tools/network/ip-subnet-calculator';
import { DNS_LOOKUP_TOOL } from '../../tools/network/dns-lookup';
import { WHOIS_LOOKUP_TOOL } from '../../tools/network/whois-lookup';
import { PORT_SCANNER_TOOL } from '../../tools/network/port-scanner';
import { NETWORK_MONITORING_TOOL } from '../../tools/network/network-monitoring-tool';
import { apiRateLimiterCalculatorTool } from '../../tools/network/api-rate-limiter-calculator';

// Generator tools
import { UUID_GENERATOR_TOOL } from '../../tools/generators/uuid-generator';
import { QR_CODE_GENERATOR_TOOL } from '../../tools/generators/qr-code-generator';
import { QR_GENERATOR_TOOL } from '../../tools/generators/qr-generator';
import { BARCODE_GENERATOR_TOOL } from '../../tools/generators/barcode-generator';
import { MOCK_DATA_GENERATOR_TOOL } from '../../tools/generators/mock-data-generator';

// Development tools
import { GIT_DIFF_VISUALIZER_TOOL } from '../../tools/development/git-diff-visualizer';
import { JSON_FLATTENER_TOOL } from '../../tools/development/json-flattener';
import { JSON_PATH_EXTRACTOR_TOOL } from '../../tools/development/json-path-extractor';
import { JSON_SCHEMA_VALIDATOR_TOOL } from '../../tools/development/json-schema-validator';
import { CONFIG_FILE_VALIDATOR_TOOL } from '../../tools/development/config-file-validator';
import { YAML_VALIDATOR_TOOL } from '../../tools/development/yaml-validator';
import { SQL_QUERY_BUILDER_TOOL } from '../../tools/development/sql-query-builder';
import { DATABASE_SCHEMA_VISUALIZER_TOOL } from '../../tools/development/database-schema-visualizer';
import { databaseQueryOptimizerTool } from '../../tools/development/database-query-optimizer';
import { LOAD_TESTING_CONFIG_GENERATOR_TOOL } from '../../tools/development/load-testing-config-generator';
import { PERFORMANCE_BUDGET_CALCULATOR_TOOL } from '../../tools/development/performance-budget-calculator';
import { LOG_ANALYSIS_TOOL } from '../../tools/development/log-analysis-tool';

// Data tools
import { BINARY_HEX_VIEWER_TOOL } from '../../tools/data/binary-hex-viewer';
import { IMAGE_METADATA_EXTRACTOR_TOOL } from '../../tools/data/image-metadata-extractor';
import { IMAGE_COMPRESSOR_TOOL } from '../../tools/data/image-compressor';
import { PDF_TOOLS_TOOL } from '../../tools/data/pdf-tools';

// Validator tools
import { EMAIL_VALIDATOR_TOOL } from '../../tools/validators/email-validator';
import { PHONE_NUMBER_VALIDATOR_TOOL } from '../../tools/validators/phone-number-validator';
import { CREDIT_CARD_VALIDATOR_TOOL } from '../../tools/validators/credit-card-validator';
import { IBAN_VALIDATOR_TOOL } from '../../tools/validators/iban-validator';
import { URL_VALIDATOR_TOOL } from '../../tools/validators/url-validator';
import { HTML5_VALIDATOR_TOOL } from '../../tools/validators/html5-validator';

// Note: Some tools might need adjustment based on their actual exported names
// Import URL_PARSER_TOOL and URL_SHORTENER_TOOL - need to determine correct category
import { URL_PARSER_TOOL } from '../../tools/web/url-parser';
import { URL_SHORTENER_TOOL } from '../../tools/web/url-shortener';

// Register all tools
// Formatters
registerTool(JSON_FORMATTER_TOOL);
registerTool(XML_FORMATTER_TOOL);
registerTool(YAML_FORMATTER_TOOL);
registerTool(CSS_BEAUTIFIER_TOOL);
registerTool(HTML_BEAUTIFIER_TOOL);
registerTool(JS_BEAUTIFIER_TOOL);
registerTool(SQL_FORMATTER_TOOL);
registerTool(CSV_FORMATTER_TOOL);

// Converters
registerTool(JSON_TO_CSV_TOOL);
registerTool(CSV_TO_JSON_TOOL);
registerTool(JSON_TO_XML_CONVERTER_TOOL);
registerTool(XML_TO_JSON_CONVERTER_TOOL);
registerTool(JSON_TO_TYPESCRIPT_TOOL);
registerTool(MARKDOWN_CONVERTER_TOOL);
registerTool(DATA_FORMAT_TRANSFORMER_TOOL);
registerTool(CSS_TO_TAILWIND_CONVERTER_TOOL);
registerTool(IMAGE_FORMAT_CONVERTER_TOOL);
registerTool(WEBP_CONVERTER_TOOL);
registerTool(IMAGE_TO_BASE64_CONVERTER_TOOL);
registerTool(DATA_URI_CONVERTER_TOOL);
registerTool(UNIT_CONVERTER_TOOL);
registerTool(NUMBER_BASE_CONVERTER_TOOL);
registerTool(COLOR_CONVERTER_TOOL);

// Encoders
registerTool(BASE64_ENCODER_TOOL);
registerTool(BASE32_ENCODER_TOOL);
registerTool(URL_ENCODER_TOOL);
registerTool(HTML_ENTITY_ENCODER_TOOL);
registerTool(HTML_ENTITY_DECODER_TOOL);
registerTool(JWT_DECODER_TOOL);
registerTool(STRING_ESCAPE_TOOL);
registerTool(EMOJI_CONVERTER_TOOL);
registerTool(CERTIFICATE_DECODER_TOOL);
registerTool(BASE64_IMAGE_ENCODER_TOOL);
registerTool(BASE64_IMAGE_DECODER_TOOL);

// Text
registerTool(TEXT_CASE_CONVERTER_TOOL);
registerTool(TEXT_DIFF_TOOL);
registerTool(DIFF_CHECKER_TOOL);
registerTool(TEXT_STATISTICS_TOOL);
registerTool(TEXT_ANALYTICS_TOOL);
registerTool(LOREM_IPSUM_GENERATOR_TOOL);
registerTool(LOREM_IPSUM_TOOL);
registerTool(REGEX_TESTER_TOOL);
registerTool(REGEX_PATTERN_ANALYZER_TOOL);
registerTool(MARKDOWN_TABLE_GENERATOR_TOOL);
registerTool(ASCII_ART_GENERATOR_TOOL);

// Crypto
registerTool(HASH_GENERATOR_TOOL);
registerTool(ENCRYPTION_TOOL);
registerTool(PASSWORD_GENERATOR_TOOL);
registerTool(PASSWORD_STRENGTH_CHECKER_TOOL);
registerTool(PASSWORD_POLICY_GENERATOR_TOOL);
registerTool(FILE_HASH_INTEGRITY_CHECKER_TOOL);
registerTool(JWT_GENERATOR_TOOL);

// Web
registerTool(CSS_MINIFIER_TOOL);
registerTool(HTML_MINIFIER_TOOL);
registerTool(JS_MINIFIER_TOOL);
registerTool(CSS_SELECTOR_GENERATOR_TOOL);
registerTool(CSS_GRID_GENERATOR_TOOL);
registerTool(SVG_OPTIMIZER_TOOL);
registerTool(SVG_EDITOR_TOOL);
registerTool(HTML_VISUALIZER_TOOL);
registerTool(API_REQUEST_BUILDER_TOOL);
registerTool(API_RESPONSE_FORMATTER_TOOL);
registerTool(API_DOCUMENTATION_GENERATOR_TOOL);
registerTool(WEBHOOK_TESTING_TOOL);
registerTool(HTTP_STATUS_CODES_TOOL);
registerTool(USER_AGENT_PARSER_TOOL);
registerTool(SECURITY_HEADERS_ANALYZER_TOOL);
registerTool(URL_PARSER_TOOL);
registerTool(URL_SHORTENER_TOOL);

// Color
registerTool(ADVANCED_COLOR_PALETTE_GENERATOR_TOOL);
registerTool(COLOR_BLINDNESS_SIMULATOR_TOOL);

// DateTime
registerTool(TIMESTAMP_CONVERTER_TOOL);
registerTool(TIMESTAMP_FORMATTER_TOOL);
registerTool(CRON_GENERATOR_TOOL);
registerTool(TIME_DECIMAL_CONVERTER_TOOL);

// Math
registerTool(MATH_EXPRESSION_EVALUATOR_TOOL);

// Network
registerTool(IP_SUBNET_CALCULATOR_TOOL);
registerTool(DNS_LOOKUP_TOOL);
registerTool(WHOIS_LOOKUP_TOOL);
registerTool(PORT_SCANNER_TOOL);
registerTool(NETWORK_MONITORING_TOOL);
registerTool(apiRateLimiterCalculatorTool);

// Generators
registerTool(UUID_GENERATOR_TOOL);
registerTool(QR_CODE_GENERATOR_TOOL);
registerTool(QR_GENERATOR_TOOL);
registerTool(BARCODE_GENERATOR_TOOL);
registerTool(MOCK_DATA_GENERATOR_TOOL);

// Development
registerTool(GIT_DIFF_VISUALIZER_TOOL);
registerTool(JSON_FLATTENER_TOOL);
registerTool(JSON_PATH_EXTRACTOR_TOOL);
registerTool(JSON_SCHEMA_VALIDATOR_TOOL);
registerTool(CONFIG_FILE_VALIDATOR_TOOL);
registerTool(YAML_VALIDATOR_TOOL);
registerTool(SQL_QUERY_BUILDER_TOOL);
registerTool(DATABASE_SCHEMA_VISUALIZER_TOOL);
registerTool(databaseQueryOptimizerTool);
registerTool(LOAD_TESTING_CONFIG_GENERATOR_TOOL);
registerTool(PERFORMANCE_BUDGET_CALCULATOR_TOOL);
registerTool(LOG_ANALYSIS_TOOL);

// Data
registerTool(BINARY_HEX_VIEWER_TOOL);
registerTool(IMAGE_METADATA_EXTRACTOR_TOOL);
registerTool(IMAGE_COMPRESSOR_TOOL);
registerTool(PDF_TOOLS_TOOL);

// Validators
registerTool(EMAIL_VALIDATOR_TOOL);
registerTool(PHONE_NUMBER_VALIDATOR_TOOL);
registerTool(CREDIT_CARD_VALIDATOR_TOOL);
registerTool(IBAN_VALIDATOR_TOOL);
registerTool(URL_VALIDATOR_TOOL);
registerTool(HTML5_VALIDATOR_TOOL);

// Export everything from registry
export * from './registry';
