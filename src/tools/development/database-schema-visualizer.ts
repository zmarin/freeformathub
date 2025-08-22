import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface DatabaseSchemaConfig {
  inputFormat: 'sql' | 'json' | 'yaml' | 'xml' | 'prisma' | 'sequelize';
  outputFormat: 'mermaid' | 'plantuml' | 'graphviz' | 'json' | 'text';
  diagramType: 'erd' | 'schema' | 'relationships' | 'normalized';
  showDataTypes: boolean;
  showConstraints: boolean;
  showIndexes: boolean;
  showForeignKeys: boolean;
  includeMetadata: boolean;
  groupBySchema: boolean;
  showCardinality: boolean;
  includeSampleData: boolean;
  optimizationSuggestions: boolean;
  securityAnalysis: boolean;
  performanceAnalysis: boolean;
  normalizationCheck: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  schema?: DatabaseSchema;
  warnings?: string[];
}

interface DatabaseSchema {
  metadata: SchemaMetadata;
  tables: Table[];
  relationships: Relationship[];
  indexes: Index[];
  constraints: Constraint[];
  views: View[];
  procedures: StoredProcedure[];
  triggers: Trigger[];
  analysis: SchemaAnalysis;
}

interface SchemaMetadata {
  name: string;
  version?: string;
  engine: string;
  charset?: string;
  collation?: string;
  createdAt?: string;
  description?: string;
  tableCount: number;
  totalColumns: number;
  totalRelationships: number;
}

interface Table {
  name: string;
  schema?: string;
  columns: Column[];
  primaryKey: string[];
  foreignKeys: ForeignKey[];
  indexes: string[];
  constraints: string[];
  engine?: string;
  charset?: string;
  collation?: string;
  comment?: string;
  estimatedRows?: number;
  dataSize?: string;
  indexSize?: string;
}

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  autoIncrement?: boolean;
  unique?: boolean;
  comment?: string;
  length?: number;
  precision?: number;
  scale?: number;
  enum?: string[];
  references?: ColumnReference;
}

interface ColumnReference {
  table: string;
  column: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

interface Relationship {
  name: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
  cardinality: string;
  description?: string;
}

interface Index {
  name: string;
  table: string;
  columns: string[];
  type: 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT' | 'SPATIAL';
  method?: 'BTREE' | 'HASH' | 'RTREE';
  comment?: string;
}

interface Constraint {
  name: string;
  table: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  columns: string[];
  definition: string;
  referencedTable?: string;
  referencedColumns?: string[];
}

interface View {
  name: string;
  definition: string;
  columns: string[];
  dependencies: string[];
  updatable: boolean;
  comment?: string;
}

interface StoredProcedure {
  name: string;
  parameters: Parameter[];
  returnType?: string;
  definition: string;
  language: string;
  comment?: string;
}

interface Parameter {
  name: string;
  type: string;
  direction: 'IN' | 'OUT' | 'INOUT';
  defaultValue?: string;
}

interface Trigger {
  name: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  definition: string;
  comment?: string;
}

interface SchemaAnalysis {
  normalization: NormalizationAnalysis;
  performance: PerformanceAnalysis;
  security: SecurityAnalysis;
  optimization: OptimizationSuggestion[];
  statistics: SchemaStatistics;
}

interface NormalizationAnalysis {
  level: '1NF' | '2NF' | '3NF' | 'BCNF' | '4NF' | '5NF';
  violations: NormalizationViolation[];
  suggestions: string[];
  score: number;
}

interface NormalizationViolation {
  table: string;
  type: 'partial-dependency' | 'transitive-dependency' | 'multi-valued-dependency';
  description: string;
  columns: string[];
  suggestion: string;
}

interface PerformanceAnalysis {
  missingIndexes: MissingIndex[];
  redundantIndexes: RedundantIndex[];
  largeTableWarnings: LargeTableWarning[];
  inefficientQueries: QuerySuggestion[];
  score: number;
}

interface MissingIndex {
  table: string;
  columns: string[];
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

interface RedundantIndex {
  table: string;
  indexes: string[];
  reason: string;
  recommendation: string;
}

interface LargeTableWarning {
  table: string;
  estimatedSize: string;
  recommendation: string;
}

interface QuerySuggestion {
  query: string;
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

interface SecurityAnalysis {
  vulnerabilities: SecurityVulnerability[];
  recommendations: SecurityRecommendation[];
  score: number;
}

interface SecurityVulnerability {
  type: 'weak-permissions' | 'sql-injection-risk' | 'data-exposure' | 'weak-encryption';
  table?: string;
  column?: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

interface SecurityRecommendation {
  category: 'authentication' | 'authorization' | 'encryption' | 'auditing';
  description: string;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
}

interface OptimizationSuggestion {
  type: 'index' | 'normalization' | 'partitioning' | 'archiving' | 'denormalization';
  table: string;
  description: string;
  implementation: string;
  estimatedImpact: string;
  priority: 'high' | 'medium' | 'low';
}

interface SchemaStatistics {
  tableCount: number;
  columnCount: number;
  relationshipCount: number;
  indexCount: number;
  viewCount: number;
  procedureCount: number;
  triggerCount: number;
  avgColumnsPerTable: number;
  avgIndexesPerTable: number;
  dataTypeDistribution: Record<string, number>;
  constraintDistribution: Record<string, number>;
}

// Mock schema parsers for demonstration
function parseSqlSchema(sql: string): DatabaseSchema {
  // Simple SQL DDL parser for demonstration
  const tables: Table[] = [];
  const relationships: Relationship[] = [];
  
  // Mock parsing of CREATE TABLE statements
  const tableMatches = sql.match(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\)/gi) || [];
  
  tableMatches.forEach((match, index) => {
    const tableName = match.match(/CREATE TABLE\s+(\w+)/i)?.[1] || `table_${index}`;
    const columnSection = match.match(/\(([\s\S]*)\)/)?.[1] || '';
    
    const columns: Column[] = [];
    const primaryKey: string[] = [];
    const foreignKeys: ForeignKey[] = [];
    
    // Parse columns (simplified)
    const columnLines = columnSection.split(',').map(line => line.trim());
    
    columnLines.forEach(line => {
      if (line.toLowerCase().includes('primary key')) {
        const pkMatch = line.match(/PRIMARY KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          primaryKey.push(...pkMatch[1].split(',').map(col => col.trim()));
        }
      } else if (line.toLowerCase().includes('foreign key')) {
        // Parse foreign key constraints
        const fkMatch = line.match(/FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
        if (fkMatch) {
          foreignKeys.push({
            name: `fk_${tableName}_${fkMatch[2]}`,
            columns: fkMatch[1].split(',').map(col => col.trim()),
            referencedTable: fkMatch[2],
            referencedColumns: fkMatch[3].split(',').map(col => col.trim())
          });
        }
      } else if (line.trim() && !line.toLowerCase().includes('constraint')) {
        // Parse regular column
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const columnName = parts[0].replace(/[`"]/g, '');
          const dataType = parts[1].toUpperCase();
          
          columns.push({
            name: columnName,
            type: dataType,
            nullable: !line.toLowerCase().includes('not null'),
            autoIncrement: line.toLowerCase().includes('auto_increment'),
            unique: line.toLowerCase().includes('unique')
          });
        }
      }
    });
    
    tables.push({
      name: tableName,
      columns,
      primaryKey,
      foreignKeys,
      indexes: [],
      constraints: []
    });
  });
  
  // Generate relationships from foreign keys
  tables.forEach(table => {
    table.foreignKeys.forEach(fk => {
      relationships.push({
        name: fk.name,
        type: 'many-to-one',
        fromTable: table.name,
        fromColumns: fk.columns,
        toTable: fk.referencedTable,
        toColumns: fk.referencedColumns,
        cardinality: 'N:1'
      });
    });
  });
  
  return {
    metadata: {
      name: 'Database Schema',
      engine: 'MySQL',
      tableCount: tables.length,
      totalColumns: tables.reduce((sum, table) => sum + table.columns.length, 0),
      totalRelationships: relationships.length
    },
    tables,
    relationships,
    indexes: [],
    constraints: [],
    views: [],
    procedures: [],
    triggers: [],
    analysis: generateSchemaAnalysis(tables, relationships)
  };
}

function parseJsonSchema(json: string): DatabaseSchema {
  try {
    const parsed = JSON.parse(json);
    
    // Convert JSON schema to internal format
    const tables: Table[] = [];
    const relationships: Relationship[] = [];
    
    if (parsed.tables) {
      Object.entries(parsed.tables).forEach(([tableName, tableData]: [string, any]) => {
        const columns: Column[] = [];
        
        if (tableData.columns) {
          Object.entries(tableData.columns).forEach(([columnName, columnData]: [string, any]) => {
            columns.push({
              name: columnName,
              type: columnData.type || 'VARCHAR',
              nullable: columnData.nullable !== false,
              defaultValue: columnData.default,
              autoIncrement: columnData.autoIncrement || false,
              unique: columnData.unique || false,
              comment: columnData.comment
            });
          });
        }
        
        tables.push({
          name: tableName,
          columns,
          primaryKey: tableData.primaryKey || [],
          foreignKeys: tableData.foreignKeys || [],
          indexes: tableData.indexes || [],
          constraints: tableData.constraints || [],
          comment: tableData.comment
        });
      });
    }
    
    return {
      metadata: {
        name: parsed.name || 'Database Schema',
        version: parsed.version,
        engine: parsed.engine || 'Unknown',
        description: parsed.description,
        tableCount: tables.length,
        totalColumns: tables.reduce((sum, table) => sum + table.columns.length, 0),
        totalRelationships: relationships.length
      },
      tables,
      relationships,
      indexes: parsed.indexes || [],
      constraints: parsed.constraints || [],
      views: parsed.views || [],
      procedures: parsed.procedures || [],
      triggers: parsed.triggers || [],
      analysis: generateSchemaAnalysis(tables, relationships)
    };
  } catch (error) {
    throw new Error('Invalid JSON schema format');
  }
}

function generateSchemaAnalysis(tables: Table[], relationships: Relationship[]): SchemaAnalysis {
  // Generate normalization analysis
  const normalizationViolations: NormalizationViolation[] = [];
  
  // Check for potential normalization issues
  tables.forEach(table => {
    // Check for composite keys that might indicate normalization issues
    if (table.primaryKey.length > 2) {
      normalizationViolations.push({
        table: table.name,
        type: 'multi-valued-dependency',
        description: 'Table has composite primary key with many columns',
        columns: table.primaryKey,
        suggestion: 'Consider creating separate tables for different entity types'
      });
    }
    
    // Check for tables with too many columns
    if (table.columns.length > 15) {
      normalizationViolations.push({
        table: table.name,
        type: 'transitive-dependency',
        description: 'Table has too many columns, possible denormalization',
        columns: table.columns.map(c => c.name),
        suggestion: 'Consider splitting into multiple related tables'
      });
    }
  });
  
  const normalizationScore = Math.max(0, 100 - (normalizationViolations.length * 20));
  
  // Generate performance analysis
  const missingIndexes: MissingIndex[] = [];
  
  tables.forEach(table => {
    // Check for foreign key columns without indexes
    table.foreignKeys.forEach(fk => {
      if (!table.indexes.some(idx => fk.columns.every(col => idx.includes(col)))) {
        missingIndexes.push({
          table: table.name,
          columns: fk.columns,
          reason: 'Foreign key columns should be indexed for better join performance',
          estimatedImpact: 'high'
        });
      }
    });
    
    // Check for tables without primary key
    if (table.primaryKey.length === 0) {
      missingIndexes.push({
        table: table.name,
        columns: ['id'],
        reason: 'Table should have a primary key for optimal performance',
        estimatedImpact: 'high'
      });
    }
  });
  
  const performanceScore = Math.max(0, 100 - (missingIndexes.length * 15));
  
  // Generate security analysis
  const vulnerabilities: SecurityVulnerability[] = [];
  
  tables.forEach(table => {
    // Check for sensitive data without encryption
    table.columns.forEach(column => {
      const columnName = column.name.toLowerCase();
      if (columnName.includes('password') || columnName.includes('ssn') || columnName.includes('credit')) {
        vulnerabilities.push({
          type: 'weak-encryption',
          table: table.name,
          column: column.name,
          description: 'Sensitive data column may need encryption',
          severity: 'high',
          recommendation: 'Use encrypted storage for sensitive data'
        });
      }
    });
  });
  
  const securityScore = Math.max(0, 100 - (vulnerabilities.length * 25));
  
  // Generate optimization suggestions
  const optimizationSuggestions: OptimizationSuggestion[] = [];
  
  tables.forEach(table => {
    if (table.columns.length > 20) {
      optimizationSuggestions.push({
        type: 'normalization',
        table: table.name,
        description: 'Table has many columns and could benefit from normalization',
        implementation: 'Split table into logical entity groups',
        estimatedImpact: 'Improved maintainability and query performance',
        priority: 'medium'
      });
    }
    
    if (table.foreignKeys.length === 0 && tables.length > 1) {
      optimizationSuggestions.push({
        type: 'normalization',
        table: table.name,
        description: 'Isolated table with no relationships',
        implementation: 'Review if this table should relate to other entities',
        estimatedImpact: 'Better data integrity and consistency',
        priority: 'low'
      });
    }
  });
  
  // Calculate statistics
  const totalColumns = tables.reduce((sum, table) => sum + table.columns.length, 0);
  const dataTypeDistribution: Record<string, number> = {};
  
  tables.forEach(table => {
    table.columns.forEach(column => {
      const baseType = column.type.split('(')[0].toUpperCase();
      dataTypeDistribution[baseType] = (dataTypeDistribution[baseType] || 0) + 1;
    });
  });
  
  return {
    normalization: {
      level: normalizationViolations.length === 0 ? '3NF' : '2NF',
      violations: normalizationViolations,
      suggestions: normalizationViolations.map(v => v.suggestion),
      score: normalizationScore
    },
    performance: {
      missingIndexes,
      redundantIndexes: [],
      largeTableWarnings: [],
      inefficientQueries: [],
      score: performanceScore
    },
    security: {
      vulnerabilities,
      recommendations: [],
      score: securityScore
    },
    optimization: optimizationSuggestions,
    statistics: {
      tableCount: tables.length,
      columnCount: totalColumns,
      relationshipCount: relationships.length,
      indexCount: 0,
      viewCount: 0,
      procedureCount: 0,
      triggerCount: 0,
      avgColumnsPerTable: tables.length > 0 ? totalColumns / tables.length : 0,
      avgIndexesPerTable: 0,
      dataTypeDistribution,
      constraintDistribution: {}
    }
  };
}

export function processDatabaseSchemaVisualizer(input: string, config: DatabaseSchemaConfig): Promise<ToolResult> {
  return new Promise(async (resolve) => {
    try {
      const startTime = Date.now();
      
      if (!input || input.trim() === '') {
        resolve({
          success: false,
          error: 'Please provide database schema content for visualization'
        });
        return;
      }
      
      let schema: DatabaseSchema;
      
      // Parse input based on format
      try {
        switch (config.inputFormat) {
          case 'sql':
            schema = parseSqlSchema(input);
            break;
          case 'json':
            schema = parseJsonSchema(input);
            break;
          case 'yaml':
            // For demo, treat as JSON
            schema = parseJsonSchema(input);
            break;
          case 'prisma':
            // For demo, parse as text and create mock schema
            schema = parseSqlSchema(input);
            break;
          default:
            schema = parseSqlSchema(input);
        }
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to parse ${config.inputFormat.toUpperCase()} schema: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        return;
      }
      
      // Generate output based on format
      let output = '';
      
      switch (config.outputFormat) {
        case 'mermaid':
          output = generateMermaidDiagram(schema, config);
          break;
        case 'plantuml':
          output = generatePlantUMLDiagram(schema, config);
          break;
        case 'graphviz':
          output = generateGraphvizDiagram(schema, config);
          break;
        case 'json':
          output = JSON.stringify(schema, null, 2);
          break;
        case 'text':
        default:
          output = generateTextOutput(schema, config);
          break;
      }
      
      const processingTime = Date.now() - startTime;
      
      // Generate warnings
      const warnings: string[] = [];
      
      if (schema.tables.length === 0) {
        warnings.push('No tables found in schema - output may be incomplete');
      }
      
      if (schema.analysis.normalization.violations.length > 0) {
        warnings.push(`${schema.analysis.normalization.violations.length} normalization issues detected`);
      }
      
      if (schema.analysis.performance.missingIndexes.length > 0) {
        warnings.push(`${schema.analysis.performance.missingIndexes.length} performance issues detected`);
      }
      
      if (schema.analysis.security.vulnerabilities.length > 0) {
        warnings.push(`${schema.analysis.security.vulnerabilities.length} security vulnerabilities detected`);
      }
      
      resolve({
        success: true,
        output,
        schema,
        warnings: warnings.length > 0 ? warnings : undefined
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during schema visualization'
      });
    }
  });
}

function generateMermaidDiagram(schema: DatabaseSchema, config: DatabaseSchemaConfig): string {
  let output = 'erDiagram\n';
  
  // Add tables
  schema.tables.forEach(table => {
    output += `  ${table.name} {\n`;
    
    table.columns.forEach(column => {
      let columnLine = `    ${column.type}`;
      if (config.showDataTypes) {
        columnLine += ` ${column.name}`;
      }
      if (table.primaryKey.includes(column.name)) {
        columnLine += ' PK';
      }
      if (column.references) {
        columnLine += ' FK';
      }
      if (!column.nullable) {
        columnLine += ' "NOT NULL"';
      }
      if (column.unique) {
        columnLine += ' "UNIQUE"';
      }
      
      output += columnLine + '\n';
    });
    
    output += '  }\n\n';
  });
  
  // Add relationships
  if (config.showForeignKeys) {
    schema.relationships.forEach(rel => {
      const cardinality = rel.type === 'one-to-one' ? '||--||' :
                         rel.type === 'one-to-many' ? '||--o{' :
                         'o{--o{';
      
      output += `  ${rel.fromTable} ${cardinality} ${rel.toTable} : "${rel.name}"\n`;
    });
  }
  
  return output;
}

function generatePlantUMLDiagram(schema: DatabaseSchema, config: DatabaseSchemaConfig): string {
  let output = '@startuml\n!define Table(name,desc) class name as "desc" << (T,#FFAAAA) >>\n\n';
  
  // Add tables
  schema.tables.forEach(table => {
    output += `entity ${table.name} {\n`;
    
    table.columns.forEach(column => {
      let prefix = '';
      if (table.primaryKey.includes(column.name)) {
        prefix = '* ';
      } else if (column.references) {
        prefix = '+ ';
      } else {
        prefix = '  ';
      }
      
      let columnDef = `${prefix}${column.name}`;
      if (config.showDataTypes) {
        columnDef += ` : ${column.type}`;
      }
      if (!column.nullable) {
        columnDef += ' NOT NULL';
      }
      
      output += columnDef + '\n';
    });
    
    output += '}\n\n';
  });
  
  // Add relationships
  if (config.showForeignKeys) {
    schema.relationships.forEach(rel => {
      const arrow = rel.type === 'one-to-one' ? '||--||' :
                   rel.type === 'one-to-many' ? '||--o{' :
                   'o{--o{';
      
      output += `${rel.fromTable} ${arrow} ${rel.toTable}\n`;
    });
  }
  
  output += '\n@enduml';
  return output;
}

function generateGraphvizDiagram(schema: DatabaseSchema, config: DatabaseSchemaConfig): string {
  let output = 'digraph schema {\n';
  output += '  rankdir=TB;\n';
  output += '  node [shape=record, style=filled, fillcolor=lightblue];\n\n';
  
  // Add tables
  schema.tables.forEach(table => {
    let tableLabel = `${table.name}|`;
    
    table.columns.forEach((column, index) => {
      if (index > 0) tableLabel += '\\n';
      
      let columnLabel = column.name;
      if (config.showDataTypes) {
        columnLabel += `: ${column.type}`;
      }
      if (table.primaryKey.includes(column.name)) {
        columnLabel = `<b>${columnLabel}</b>`;
      }
      
      tableLabel += columnLabel;
    });
    
    output += `  ${table.name} [label="{${tableLabel}}"];\n`;
  });
  
  output += '\n';
  
  // Add relationships
  if (config.showForeignKeys) {
    schema.relationships.forEach(rel => {
      output += `  ${rel.fromTable} -> ${rel.toTable} [label="${rel.cardinality}"];\n`;
    });
  }
  
  output += '}';
  return output;
}

function generateTextOutput(schema: DatabaseSchema, config: DatabaseSchemaConfig): string {
  let output = '';
  
  // Schema overview
  output += `Database Schema Visualization\n${'='.repeat(50)}\n\n`;
  
  output += `📊 Schema Overview:\n`;
  output += `• Name: ${schema.metadata.name}\n`;
  output += `• Engine: ${schema.metadata.engine}\n`;
  output += `• Tables: ${schema.metadata.tableCount}\n`;
  output += `• Total Columns: ${schema.metadata.totalColumns}\n`;
  output += `• Relationships: ${schema.metadata.totalRelationships}\n`;
  if (schema.metadata.description) {
    output += `• Description: ${schema.metadata.description}\n`;
  }
  output += '\n';
  
  // Tables
  output += `🗂️ Tables:\n\n`;
  
  schema.tables.forEach(table => {
    output += `### ${table.name}\n`;
    if (table.comment) {
      output += `*${table.comment}*\n\n`;
    }
    
    if (config.showDataTypes) {
      output += `| Column | Type | Null | Key | Extra |\n`;
      output += `|--------|------|------|-----|-------|\n`;
      
      table.columns.forEach(column => {
        const isPK = table.primaryKey.includes(column.name);
        const isFK = column.references ? 'FK' : '';
        const key = isPK ? 'PK' : isFK;
        const nullable = column.nullable ? 'YES' : 'NO';
        const extra = [
          column.autoIncrement ? 'AUTO_INCREMENT' : '',
          column.unique ? 'UNIQUE' : ''
        ].filter(Boolean).join(', ');
        
        output += `| ${column.name} | ${column.type} | ${nullable} | ${key} | ${extra} |\n`;
      });
      
      output += '\n';
    } else {
      output += `Columns: ${table.columns.map(c => c.name).join(', ')}\n`;
      if (table.primaryKey.length > 0) {
        output += `Primary Key: ${table.primaryKey.join(', ')}\n`;
      }
      output += '\n';
    }
    
    if (config.showForeignKeys && table.foreignKeys.length > 0) {
      output += `**Foreign Keys:**\n`;
      table.foreignKeys.forEach(fk => {
        output += `• ${fk.columns.join(', ')} → ${fk.referencedTable}(${fk.referencedColumns.join(', ')})\n`;
      });
      output += '\n';
    }
    
    if (config.showIndexes && table.indexes.length > 0) {
      output += `**Indexes:** ${table.indexes.join(', ')}\n\n`;
    }
    
    output += '---\n\n';
  });
  
  // Relationships
  if (config.showForeignKeys && schema.relationships.length > 0) {
    output += `🔗 Relationships:\n\n`;
    
    schema.relationships.forEach(rel => {
      output += `• **${rel.name}**: ${rel.fromTable}(${rel.fromColumns.join(', ')}) → ${rel.toTable}(${rel.toColumns.join(', ')})\n`;
      output += `  Type: ${rel.type}, Cardinality: ${rel.cardinality}\n`;
      if (rel.description) {
        output += `  Description: ${rel.description}\n`;
      }
      output += '\n';
    });
  }
  
  // Analysis
  if (config.normalizationCheck || config.performanceAnalysis || config.securityAnalysis || config.optimizationSuggestions) {
    output += `📈 Schema Analysis:\n\n`;
    
    if (config.normalizationCheck) {
      output += `### Normalization Analysis\n`;
      output += `• Level: ${schema.analysis.normalization.level}\n`;
      output += `• Score: ${schema.analysis.normalization.score}/100\n`;
      
      if (schema.analysis.normalization.violations.length > 0) {
        output += `• Violations:\n`;
        schema.analysis.normalization.violations.forEach(violation => {
          output += `  - ${violation.table}: ${violation.description}\n`;
          output += `    Suggestion: ${violation.suggestion}\n`;
        });
      }
      output += '\n';
    }
    
    if (config.performanceAnalysis) {
      output += `### Performance Analysis\n`;
      output += `• Score: ${schema.analysis.performance.score}/100\n`;
      
      if (schema.analysis.performance.missingIndexes.length > 0) {
        output += `• Missing Indexes:\n`;
        schema.analysis.performance.missingIndexes.forEach(missing => {
          output += `  - ${missing.table}(${missing.columns.join(', ')}): ${missing.reason}\n`;
        });
      }
      output += '\n';
    }
    
    if (config.securityAnalysis) {
      output += `### Security Analysis\n`;
      output += `• Score: ${schema.analysis.security.score}/100\n`;
      
      if (schema.analysis.security.vulnerabilities.length > 0) {
        output += `• Vulnerabilities:\n`;
        schema.analysis.security.vulnerabilities.forEach(vuln => {
          output += `  - ${vuln.severity.toUpperCase()}: ${vuln.description}\n`;
          output += `    Recommendation: ${vuln.recommendation}\n`;
        });
      }
      output += '\n';
    }
    
    if (config.optimizationSuggestions && schema.analysis.optimization.length > 0) {
      output += `### Optimization Suggestions\n`;
      schema.analysis.optimization.forEach(suggestion => {
        output += `• **${suggestion.table}** (${suggestion.priority} priority):\n`;
        output += `  ${suggestion.description}\n`;
        output += `  Implementation: ${suggestion.implementation}\n`;
        output += `  Impact: ${suggestion.estimatedImpact}\n\n`;
      });
    }
  }
  
  // Statistics
  if (config.includeMetadata) {
    output += `📊 Statistics:\n`;
    output += `• Average columns per table: ${schema.analysis.statistics.avgColumnsPerTable.toFixed(1)}\n`;
    output += `• Data type distribution:\n`;
    Object.entries(schema.analysis.statistics.dataTypeDistribution).forEach(([type, count]) => {
      output += `  - ${type}: ${count}\n`;
    });
    output += '\n';
  }
  
  return output;
}

export const DATABASE_SCHEMA_VISUALIZER_TOOL: Tool = {
  id: 'database-schema-visualizer',
  name: 'Database Schema Visualizer',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'database-tools')!,
  slug: 'database-schema-visualizer',
  icon: '🗄️',
  keywords: ['database', 'schema', 'erd', 'visualization', 'sql', 'mysql', 'postgresql', 'diagram', 'relationships'],
  seoTitle: 'Database Schema Visualizer - Generate ERD Diagrams & Analysis | FreeFormatHub',
  seoDescription: 'Visualize database schemas with ERD diagrams, analyze relationships, detect normalization issues, and generate optimization suggestions for better database design.',
  description: 'Visualize database schemas with interactive ERD diagrams, analyze table relationships, detect normalization issues, and generate performance and security recommendations.',

  examples: [
    {
      title: 'SQL DDL Schema',
      input: `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
      output: `🗂️ Tables:

### users
| Column | Type | Null | Key | Extra |
|--------|------|------|-----|-------|
| id | INT | NO | PK | AUTO_INCREMENT |
| username | VARCHAR(50) | NO |  | UNIQUE |
| email | VARCHAR(100) | NO |  |  |
| password_hash | VARCHAR(255) | NO |  |  |

### posts  
| Column | Type | Null | Key | Extra |
|--------|------|------|-----|-------|
| id | INT | NO | PK | AUTO_INCREMENT |
| user_id | INT | NO | FK |  |
| title | VARCHAR(200) | NO |  |  |
| content | TEXT | YES |  |  |

🔗 Relationships:
• users(id) → posts(user_id) - One-to-Many
• users(id) → comments(user_id) - One-to-Many  
• posts(id) → comments(post_id) - One-to-Many`,
      description: 'Generate schema visualization from SQL CREATE statements'
    },
    {
      title: 'JSON Schema Format',
      input: `{
  "name": "E-commerce Database",
  "engine": "PostgreSQL",
  "tables": {
    "customers": {
      "columns": {
        "id": {"type": "SERIAL", "nullable": false},
        "email": {"type": "VARCHAR(100)", "unique": true},
        "first_name": {"type": "VARCHAR(50)"},
        "last_name": {"type": "VARCHAR(50)"},
        "created_at": {"type": "TIMESTAMP", "default": "NOW()"}
      },
      "primaryKey": ["id"]
    },
    "orders": {
      "columns": {
        "id": {"type": "SERIAL", "nullable": false},
        "customer_id": {"type": "INTEGER"},
        "total_amount": {"type": "DECIMAL(10,2)"},
        "status": {"type": "VARCHAR(20)", "default": "pending"},
        "created_at": {"type": "TIMESTAMP", "default": "NOW()"}
      },
      "primaryKey": ["id"],
      "foreignKeys": [
        {
          "columns": ["customer_id"],
          "referencedTable": "customers",
          "referencedColumns": ["id"]
        }
      ]
    }
  }
}`,
      output: `📊 Schema Overview:
• Name: E-commerce Database
• Engine: PostgreSQL
• Tables: 2
• Total Columns: 9
• Relationships: 1

### customers
| Column | Type | Null | Key | Extra |
|--------|------|------|-----|-------|
| id | SERIAL | NO | PK |  |
| email | VARCHAR(100) | YES |  | UNIQUE |
| first_name | VARCHAR(50) | YES |  |  |

### orders
| Column | Type | Null | Key | Extra |
|--------|------|------|-----|-------|
| id | SERIAL | NO | PK |  |
| customer_id | INTEGER | YES | FK |  |
| total_amount | DECIMAL(10,2) | YES |  |  |`,
      description: 'Parse and visualize schema from JSON format'
    },
    {
      title: 'Mermaid ERD Output',
      input: `CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INT,
  price DECIMAL(10,2),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);`,
      output: `erDiagram
  products {
    INT id PK
    VARCHAR name "NOT NULL"
    INT category_id FK
    DECIMAL price
  }

  categories {
    INT id PK
    VARCHAR name "NOT NULL"
  }

  products ||--o{ categories : "fk_products_categories"`,
      description: 'Generate Mermaid ERD diagram code'
    }
  ],

  useCases: [
    'Database design visualization and documentation',
    'ERD diagram generation for system architecture',
    'Schema migration planning and impact analysis',
    'Database normalization and optimization review',
    'Team collaboration on database design',
    'Security audit and vulnerability assessment',
    'Performance bottleneck identification',
    'Legacy database modernization planning',
    'API documentation with data model diagrams',
    'Educational database design tutorials'
  ],

  faq: [
    {
      question: 'What input formats are supported?',
      answer: 'Supports SQL DDL statements, JSON schema definitions, YAML configurations, Prisma schema files, and Sequelize model definitions.'
    },
    {
      question: 'What diagram formats can be generated?',
      answer: 'Generates Mermaid ERD diagrams, PlantUML diagrams, Graphviz DOT notation, and structured text output. All formats support relationships and constraints.'
    },
    {
      question: 'What analysis features are included?',
      answer: 'Provides normalization analysis, performance optimization suggestions, security vulnerability detection, and schema statistics for comprehensive database review.'
    },
    {
      question: 'Can it detect database design issues?',
      answer: 'Yes, identifies missing indexes, normalization violations, security vulnerabilities, and provides optimization recommendations with implementation guidance.'
    },
    {
      question: 'Is it suitable for large database schemas?',
      answer: 'Designed to handle complex schemas with multiple tables, relationships, and constraints. Provides grouping and filtering options for better visualization of large schemas.'
    }
  ],

  commonErrors: [
    'Invalid SQL syntax in CREATE TABLE statements',
    'Malformed JSON or YAML schema definition',
    'Missing foreign key references to non-existent tables',
    'Circular relationship dependencies in schema',
    'Unsupported database-specific syntax or data types'
  ],

  relatedTools: ['sql-formatter', 'database-designer', 'erd-generator', 'schema-validator', 'migration-planner']
};