import { describe, expect, it } from 'vitest';
import {
  processDatabaseSchemaVisualizer,
  type DatabaseSchemaConfig,
} from '../../tools/development/database-schema-visualizer';

const SAMPLE_SCHEMA = `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product VARCHAR(120) NOT NULL,
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);`;

const BASE_CONFIG: DatabaseSchemaConfig = {
  inputFormat: 'sql',
  outputFormat: 'mermaid',
  diagramType: 'erd',
  showDataTypes: true,
  showConstraints: true,
  showIndexes: true,
  showForeignKeys: true,
  includeMetadata: true,
  groupBySchema: false,
  showCardinality: true,
  includeSampleData: false,
  optimizationSuggestions: true,
  securityAnalysis: true,
  performanceAnalysis: true,
  normalizationCheck: true,
};

describe('Database Schema Visualizer tool', () => {
  it('generates a Mermaid ER diagram for SQL input', async () => {
    const result = await processDatabaseSchemaVisualizer(SAMPLE_SCHEMA, BASE_CONFIG);

    expect(result.success).toBe(true);
    expect(result.output).toBeTruthy();
    expect(result.output).toContain('erDiagram');
    expect(result.schema?.tables?.length ?? 0).toBeGreaterThan(0);
    expect(Array.isArray(result.schema?.relationships)).toBe(true);
  });

  it('returns JSON when the output format is json', async () => {
    const config: DatabaseSchemaConfig = { ...BASE_CONFIG, outputFormat: 'json' };
    const result = await processDatabaseSchemaVisualizer(SAMPLE_SCHEMA, config);

    expect(result.success).toBe(true);
    expect(result.output).toBeTruthy();
    expect(() => JSON.parse(result.output ?? '')).not.toThrow();
  });

  it('hides relationship edges when foreign keys are disabled', async () => {
    const config: DatabaseSchemaConfig = { ...BASE_CONFIG, showForeignKeys: false };
    const result = await processDatabaseSchemaVisualizer(SAMPLE_SCHEMA, config);

    expect(result.success).toBe(true);
    expect(result.output).toBeTruthy();
    expect(result.output).not.toContain('||--');
  });

  it('returns an error when input is empty', async () => {
    const result = await processDatabaseSchemaVisualizer('', BASE_CONFIG);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/provide database schema/i);
  });
});
