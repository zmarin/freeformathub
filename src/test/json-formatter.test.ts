import { describe, it, expect } from 'vitest';
import { formatJson, type JsonFormatterConfig } from '../tools/formatters/json-formatter';

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

  it('should support JSONC-like input: comments, trailing commas, single quotes and unquoted keys', () => {
    const input = `{
  // comment line
  'name': 'John',
  age: 30,
  skills: ['js','ts',],
  rating: NaN,
}`;
    const cfg: JsonFormatterConfig = {
      indent: 2,
      sortKeys: false,
      removeComments: true,
      validateOnly: false,
      allowSingleQuotes: true,
      quoteUnquotedKeys: true,
      replaceSpecialNumbers: 'null',
    } as any;
    const result = formatJson(input, cfg);
    expect(result.success).toBe(true);
    expect(result.output).toContain('"name": "John"');
    expect(result.output).toContain('"age": 30');
    expect(result.output).toContain('"skills": ["js", "ts"]');
    expect(result.output).toContain('"rating": null');
  });

  it('should detect duplicate keys with path', () => {
    const input = '{"a":1,"a":2,"b":{"c":3,"c":4},"arr":[{"d":1},{"d":2}] }';
    const cfg: JsonFormatterConfig = {
      indent: 2,
      sortKeys: false,
      removeComments: false,
      validateOnly: true,
      detectDuplicateKeys: true,
    } as any;
    const result = formatJson(input, cfg);
    expect(result.success).toBe(true);
    expect(result.metadata?.duplicateCount).toBeGreaterThan(0);
    const dupPaths = (result.metadata?.duplicates || []).map((d: any) => d.path);
    // Root-level dup on $ (no segment), nested dup on $.b, and array path $.arr[1] ignored for key d check (dup per object only)
    expect(dupPaths).toContain('$');
    expect(dupPaths).toContain('$.b');
  });

  it('should detect duplicate keys that differ only by escape sequences', () => {
    const input = '{"\\u0061":1,"a":2}';
    const cfg: JsonFormatterConfig = {
      indent: 2,
      sortKeys: false,
      removeComments: false,
      validateOnly: true,
      detectDuplicateKeys: true,
    } as any;
    const result = formatJson(input, cfg);
    expect(result.success).toBe(true);
    expect(result.metadata?.duplicateCount).toBe(1);
    const duplicates = result.metadata?.duplicates || [];
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.key).toBe('a');
  });

  it('should respect indent size when using tabs', () => {
    const input = '{"a":{"b":1}}';
    const cfg: JsonFormatterConfig = {
      indent: 4,
      sortKeys: false,
      removeComments: false,
      validateOnly: false,
      useTabs: true,
    } as any;
    const result = formatJson(input, cfg);
    expect(result.success).toBe(true);
    const lines = result.output?.split('\n') || [];
    expect(lines.length).toBeGreaterThan(1);
    const line = lines[1];
    expect(line).toBeDefined();
    expect(line).toMatch(/^\t{4}"a": \{/);
  });

  it('should preserve unicode escaping in minified mode', () => {
    const input = '{"greeting":"Привет"}';
    const cfg: JsonFormatterConfig = {
      indent: 0,
      sortKeys: false,
      removeComments: false,
      validateOnly: false,
      escapeUnicode: true,
    } as any;
    const result = formatJson(input, cfg);
    expect(result.success).toBe(true);
    expect(result.output).toContain('\\u041f');
    expect(result.output).not.toContain('Привет');
    expect(result.output).not.toContain('\n');
  });
});
