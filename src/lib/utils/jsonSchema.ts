export type Schema = any;

export interface SchemaValidationError {
  path: string;
  message: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
}

// Minimal JSON Schema validator (subset):
// - type, properties, required
// - items (single schema), minItems, maxItems
// - enum
// - minimum, maximum, exclusiveMinimum, exclusiveMaximum
// - minLength, maxLength, pattern
export function validateJsonAgainstSchema(
  data: any,
  schema: Schema,
  basePath: string = '$'
): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];

  function addError(path: string, message: string) {
    errors.push({ path, message });
  }

  function typeOf(v: any): string {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  }

  function validate(value: any, schema: Schema, path: string) {
    if (!schema || typeof schema !== 'object') return;

    // type
    if (schema.type) {
      const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
      const actual = typeOf(value);
      if (!allowed.includes(actual)) {
        addError(path, `type mismatch: expected ${allowed.join('|')}, got ${actual}`);
        // continue to collect more errors
      }
    }

    // enum
    if (schema.enum) {
      const ok = (schema.enum as any[]).some((c) => deepEqual(c, value));
      if (!ok) addError(path, `value not in enum`);
    }

    // number constraints
    if (typeof value === 'number') {
      if (typeof schema.minimum === 'number' && value < schema.minimum) addError(path, `value < minimum ${schema.minimum}`);
      if (typeof schema.maximum === 'number' && value > schema.maximum) addError(path, `value > maximum ${schema.maximum}`);
      if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) addError(path, `value <= exclusiveMinimum ${schema.exclusiveMinimum}`);
      if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) addError(path, `value >= exclusiveMaximum ${schema.exclusiveMaximum}`);
      if (schema.type === 'integer' && !Number.isInteger(value)) addError(path, `value is not an integer`);
    }

    // string constraints
    if (typeof value === 'string') {
      if (typeof schema.minLength === 'number' && value.length < schema.minLength) addError(path, `string shorter than ${schema.minLength}`);
      if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) addError(path, `string longer than ${schema.maxLength}`);
      if (typeof schema.pattern === 'string') {
        try {
          const re = new RegExp(schema.pattern);
          if (!re.test(value)) addError(path, `string does not match pattern ${schema.pattern}`);
        } catch {}
      }
    }

    // array
    if (Array.isArray(value)) {
      if (typeof schema.minItems === 'number' && value.length < schema.minItems) addError(path, `array has fewer than ${schema.minItems} items`);
      if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) addError(path, `array has more than ${schema.maxItems} items`);
      if (schema.items && typeof schema.items === 'object') {
        for (let i = 0; i < value.length; i++) {
          validate(value[i], schema.items, `${path}[${i}]`);
        }
      }
    }

    // object
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, any>;
      const required: string[] = Array.isArray(schema.required) ? schema.required : [];
      required.forEach((k) => {
        if (!(k in obj)) addError(path, `missing required property '${k}'`);
      });

      if (schema.properties && typeof schema.properties === 'object') {
        for (const [k, sub] of Object.entries(schema.properties)) {
          if (k in obj) validate(obj[k], sub, `${path}.${k}`);
        }
      }

      if (schema.additionalProperties === false && schema.properties) {
        for (const k of Object.keys(obj)) {
          if (!(k in schema.properties)) addError(`${path}.${k}`, `additional property not allowed`);
        }
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        for (const k of Object.keys(obj)) {
          if (!schema.properties || !(k in schema.properties)) {
            validate(obj[k], schema.additionalProperties, `${path}.${k}`);
          }
        }
      }
    }
  }

  validate(data, schema, basePath);
  return { valid: errors.length === 0, errors };
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }
  return false;
}

