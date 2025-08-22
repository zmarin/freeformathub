import { describe, it, expect } from 'vitest';
import { formatJson, type JsonFormatterConfig } from '../tools/json-formatter';

describe('JSON Formatter', () => {
  const defaultConfig: JsonFormatterConfig = {
    indent: 2,
    sortKeys: false,
    removeComments: false,
    validateOnly: false,
  };

  it('should format valid JSON', () => {
    const input = '{"name":"John","age":30}';
    const result = formatJson(input, defaultConfig);
    
    expect(result.success).toBe(true);
    expect(result.output).toContain('"name": "John"');
    expect(result.output).toContain('"age": 30');
  });

  it('should handle invalid JSON', () => {
    const input = '{"name":John}'; // Missing quotes
    const result = formatJson(input, defaultConfig);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should sort keys when requested', () => {
    const input = '{"c":3,"a":1,"b":2}';
    const config = { ...defaultConfig, sortKeys: true };
    const result = formatJson(input, config);
    
    expect(result.success).toBe(true);
    expect(result.output?.indexOf('"a"')).toBeLessThan(result.output?.indexOf('"b"') || 0);
    expect(result.output?.indexOf('"b"')).toBeLessThan(result.output?.indexOf('"c"') || 0);
  });

  it('should minify when indent is 0', () => {
    const input = '{\n  "name": "John",\n  "age": 30\n}';
    const config = { ...defaultConfig, indent: 0 };
    const result = formatJson(input, config);
    
    expect(result.success).toBe(true);
    expect(result.output).toBe('{"name":"John","age":30}');
  });

  it('should validate only when requested', () => {
    const input = '{"name":"John","age":30}';
    const config = { ...defaultConfig, validateOnly: true };
    const result = formatJson(input, config);
    
    expect(result.success).toBe(true);
    expect(result.output).toBe('Valid JSON ✓');
  });

  it('should handle empty input', () => {
    const result = formatJson('', defaultConfig);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Input is empty');
  });
});