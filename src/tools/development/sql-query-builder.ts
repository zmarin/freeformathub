import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface SqlQueryBuilderConfig {
  queryType: 'select' | 'insert' | 'update' | 'delete' | 'create' | 'custom';
  database: 'mysql' | 'postgresql' | 'sqlite' | 'mssql' | 'oracle' | 'generic';
  formatOutput: boolean;
  includeComments: boolean;
  validateSyntax: boolean;
  generateExamples: boolean;
  escapeIdentifiers: boolean;
  uppercaseKeywords: boolean;
  indentSize: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  query?: string;
  queryInfo?: QueryInfo;
  suggestions?: string[];
}

interface QueryInfo {
  type: string;
  tables: string[];
  columns: string[];
  hasJoins: boolean;
  hasSubqueries: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

interface QueryBuilder {
  select: string[];
  from: string;
  joins: string[];
  where: string[];
  groupBy: string[];
  having: string[];
  orderBy: string[];
  limit?: number;
  offset?: number;
}

interface InsertBuilder {
  table: string;
  columns: string[];
  values: string[][];
  onConflict?: string;
}

interface UpdateBuilder {
  table: string;
  set: string[];
  where: string[];
  joins: string[];
}

interface DeleteBuilder {
  table: string;
  where: string[];
  joins: string[];
}

// SQL Keywords by database type
const SQL_KEYWORDS = {
  common: ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'DATABASE', 'SCHEMA'],
  mysql: ['AUTO_INCREMENT', 'UNSIGNED', 'ZEROFILL', 'ENGINE', 'CHARSET', 'COLLATE', 'DUPLICATE', 'KEY', 'IGNORE', 'REPLACE', 'ON DUPLICATE KEY UPDATE'],
  postgresql: ['SERIAL', 'BIGSERIAL', 'RETURNING', 'UPSERT', 'CONFLICT', 'EXCLUDED', 'ILIKE', 'SIMILAR TO', 'ARRAY', 'JSONB', 'WINDOW'],
  sqlite: ['AUTOINCREMENT', 'WITHOUT ROWID', 'REPLACE', 'ATTACH', 'DETACH', 'VACUUM', 'PRAGMA'],
  mssql: ['IDENTITY', 'UNIQUEIDENTIFIER', 'NVARCHAR', 'NTEXT', 'TOP', 'OUTPUT', 'MERGE', 'CTE', 'OVER', 'PARTITION BY'],
  oracle: ['SEQUENCE', 'NEXTVAL', 'CURRVAL', 'DUAL', 'ROWNUM', 'ROWID', 'DECODE', 'NVL', 'CONNECT BY', 'START WITH']
};

const COMMON_PATTERNS = {
  basicSelect: 'SELECT column1, column2 FROM table_name WHERE condition',
  joinSelect: 'SELECT t1.column1, t2.column2 FROM table1 t1 INNER JOIN table2 t2 ON t1.id = t2.table1_id',
  aggregateSelect: 'SELECT COUNT(*), SUM(amount), AVG(price) FROM orders WHERE created_at >= \'2024-01-01\'',
  subquerySelect: 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100)',
  basicInsert: 'INSERT INTO table_name (column1, column2) VALUES (\'value1\', \'value2\')',
  batchInsert: 'INSERT INTO table_name (column1, column2) VALUES (\'value1\', \'value2\'), (\'value3\', \'value4\')',
  basicUpdate: 'UPDATE table_name SET column1 = \'new_value\' WHERE id = 1',
  joinUpdate: 'UPDATE orders o SET status = \'shipped\' FROM shipments s WHERE o.id = s.order_id',
  basicDelete: 'DELETE FROM table_name WHERE condition',
  createTable: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE)',
};

function validateTableName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}

function validateColumnName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}

function escapeIdentifier(identifier: string, database: string): string {
  if (!identifier) return identifier;
  
  switch (database) {
    case 'mysql':
      return `\`${identifier}\``;
    case 'postgresql':
    case 'sqlite':
      return `"${identifier}"`;
    case 'mssql':
      return `[${identifier}]`;
    case 'oracle':
      return `"${identifier.toUpperCase()}"`;
    default:
      return identifier;
  }
}

function formatSqlQuery(query: string, config: SqlQueryBuilderConfig): string {
  if (!config.formatOutput) return query;
  
  const indent = ' '.repeat(config.indentSize);
  let formatted = query;
  
  // Apply keyword casing
  if (config.uppercaseKeywords) {
    const keywords = [...SQL_KEYWORDS.common, ...(SQL_KEYWORDS[config.database as keyof typeof SQL_KEYWORDS] || [])];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
      formatted = formatted.replace(regex, keyword.toUpperCase());
    });
  }
  
  // Basic formatting rules
  formatted = formatted
    .replace(/\bSELECT\b/gi, '\nSELECT')
    .replace(/\bFROM\b/gi, '\nFROM')
    .replace(/\bWHERE\b/gi, '\nWHERE')
    .replace(/\bJOIN\b/gi, '\nJOIN')
    .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
    .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
    .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
    .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
    .replace(/\bHAVING\b/gi, '\nHAVING')
    .replace(/\bORDER BY\b/gi, '\nORDER BY')
    .replace(/\bLIMIT\b/gi, '\nLIMIT')
    .replace(/\bUNION\b/gi, '\nUNION')
    .replace(/,(?![^(]*\))/g, ',\n' + indent)
    .replace(/\bAND\b/gi, '\n  AND')
    .replace(/\bOR\b/gi, '\n  OR')
    .trim();
  
  return formatted;
}

function analyzeQuery(query: string): QueryInfo {
  const queryUpper = query.toUpperCase();
  const tables: string[] = [];
  const columns: string[] = [];
  
  // Extract table names (basic regex - not comprehensive)
  const fromMatch = query.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
  if (fromMatch) tables.push(fromMatch[1]);
  
  const joinMatches = query.matchAll(/JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
  for (const match of joinMatches) {
    tables.push(match[1]);
  }
  
  // Basic complexity analysis
  const hasJoins = /JOIN/i.test(query);
  const hasSubqueries = /\(.*SELECT.*\)/i.test(query);
  const hasAggregation = /COUNT|SUM|AVG|MIN|MAX|GROUP BY/i.test(query);
  const hasWindowFunctions = /OVER\s*\(/i.test(query);
  
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (hasWindowFunctions || (hasJoins && hasSubqueries)) {
    complexity = 'complex';
  } else if (hasJoins || hasSubqueries || hasAggregation) {
    complexity = 'moderate';
  }
  
  let type = 'unknown';
  if (queryUpper.startsWith('SELECT')) type = 'SELECT';
  else if (queryUpper.startsWith('INSERT')) type = 'INSERT';
  else if (queryUpper.startsWith('UPDATE')) type = 'UPDATE';
  else if (queryUpper.startsWith('DELETE')) type = 'DELETE';
  else if (queryUpper.startsWith('CREATE')) type = 'CREATE';
  
  return {
    type,
    tables,
    columns,
    hasJoins,
    hasSubqueries,
    complexity
  };
}

function buildSelectQuery(input: string, config: SqlQueryBuilderConfig): string {
  // Parse natural language or structured input for SELECT queries
  const lines = input.trim().split('\n').filter(line => line.trim());
  const builder: QueryBuilder = {
    select: [],
    from: '',
    joins: [],
    where: [],
    groupBy: [],
    having: [],
    orderBy: []
  };
  
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith('select ') || trimmed.startsWith('columns:')) {
      const columns = line.substring(line.indexOf(':') + 1 || 7).split(',').map(c => c.trim());
      builder.select = columns.length > 0 && columns[0] ? columns : ['*'];
    } else if (trimmed.startsWith('from ') || trimmed.startsWith('table:')) {
      builder.from = line.substring(line.indexOf(':') + 1 || 5).trim();
    } else if (trimmed.startsWith('where ') || trimmed.startsWith('conditions:')) {
      builder.where.push(line.substring(line.indexOf(':') + 1 || 6).trim());
    } else if (trimmed.startsWith('join ') || trimmed.startsWith('joins:')) {
      builder.joins.push(line.substring(line.indexOf(':') + 1 || 5).trim());
    } else if (trimmed.startsWith('group by ') || trimmed.startsWith('group:')) {
      const groupCols = line.substring(line.indexOf(':') + 1 || 9).split(',').map(c => c.trim());
      builder.groupBy = groupCols;
    } else if (trimmed.startsWith('order by ') || trimmed.startsWith('order:')) {
      const orderCols = line.substring(line.indexOf(':') + 1 || 9).split(',').map(c => c.trim());
      builder.orderBy = orderCols;
    } else if (trimmed.startsWith('limit ') || trimmed.startsWith('limit:')) {
      builder.limit = parseInt(line.substring(line.indexOf(':') + 1 || 6).trim());
    }
  }
  
  // Build the query
  let query = 'SELECT ';
  if (builder.select.length > 0) {
    if (config.escapeIdentifiers && builder.select[0] !== '*') {
      query += builder.select.map(col => escapeIdentifier(col, config.database)).join(', ');
    } else {
      query += builder.select.join(', ');
    }
  } else {
    query += '*';
  }
  
  if (builder.from) {
    const tableName = config.escapeIdentifiers ? escapeIdentifier(builder.from, config.database) : builder.from;
    query += ` FROM ${tableName}`;
  }
  
  builder.joins.forEach(join => {
    query += ` ${join}`;
  });
  
  if (builder.where.length > 0) {
    query += ` WHERE ${builder.where.join(' AND ')}`;
  }
  
  if (builder.groupBy.length > 0) {
    const groupCols = config.escapeIdentifiers 
      ? builder.groupBy.map(col => escapeIdentifier(col, config.database))
      : builder.groupBy;
    query += ` GROUP BY ${groupCols.join(', ')}`;
  }
  
  if (builder.having.length > 0) {
    query += ` HAVING ${builder.having.join(' AND ')}`;
  }
  
  if (builder.orderBy.length > 0) {
    const orderCols = config.escapeIdentifiers 
      ? builder.orderBy.map(col => escapeIdentifier(col, config.database))
      : builder.orderBy;
    query += ` ORDER BY ${orderCols.join(', ')}`;
  }
  
  if (builder.limit) {
    query += ` LIMIT ${builder.limit}`;
  }
  
  if (builder.offset) {
    query += ` OFFSET ${builder.offset}`;
  }
  
  return query;
}

function buildInsertQuery(input: string, config: SqlQueryBuilderConfig): string {
  const lines = input.trim().split('\n').filter(line => line.trim());
  const builder: InsertBuilder = {
    table: '',
    columns: [],
    values: []
  };
  
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith('table:') || trimmed.startsWith('into ')) {
      builder.table = line.substring(line.indexOf(':') + 1 || 5).trim();
    } else if (trimmed.startsWith('columns:')) {
      builder.columns = line.substring(8).split(',').map(c => c.trim());
    } else if (trimmed.startsWith('values:')) {
      const valueStr = line.substring(7).trim();
      if (valueStr.startsWith('(') && valueStr.endsWith(')')) {
        const values = valueStr.slice(1, -1).split(',').map(v => v.trim());
        builder.values.push(values);
      }
    }
  }
  
  let query = 'INSERT INTO ';
  const tableName = config.escapeIdentifiers ? escapeIdentifier(builder.table, config.database) : builder.table;
  query += tableName;
  
  if (builder.columns.length > 0) {
    const columns = config.escapeIdentifiers 
      ? builder.columns.map(col => escapeIdentifier(col, config.database))
      : builder.columns;
    query += ` (${columns.join(', ')})`;
  }
  
  query += ' VALUES ';
  if (builder.values.length > 0) {
    query += builder.values.map(row => `(${row.join(', ')})`).join(', ');
  } else {
    query += '(?, ?, ?)'; // Placeholder
  }
  
  return query;
}

function buildUpdateQuery(input: string, config: SqlQueryBuilderConfig): string {
  const lines = input.trim().split('\n').filter(line => line.trim());
  const builder: UpdateBuilder = {
    table: '',
    set: [],
    where: [],
    joins: []
  };
  
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith('table:') || trimmed.startsWith('update ')) {
      builder.table = line.substring(line.indexOf(':') + 1 || 7).trim();
    } else if (trimmed.startsWith('set:')) {
      builder.set.push(line.substring(4).trim());
    } else if (trimmed.startsWith('where:')) {
      builder.where.push(line.substring(6).trim());
    }
  }
  
  let query = 'UPDATE ';
  const tableName = config.escapeIdentifiers ? escapeIdentifier(builder.table, config.database) : builder.table;
  query += tableName;
  
  if (builder.set.length > 0) {
    query += ` SET ${builder.set.join(', ')}`;
  }
  
  if (builder.where.length > 0) {
    query += ` WHERE ${builder.where.join(' AND ')}`;
  }
  
  return query;
}

function buildDeleteQuery(input: string, config: SqlQueryBuilderConfig): string {
  const lines = input.trim().split('\n').filter(line => line.trim());
  const builder: DeleteBuilder = {
    table: '',
    where: [],
    joins: []
  };
  
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith('table:') || trimmed.startsWith('from ')) {
      builder.table = line.substring(line.indexOf(':') + 1 || 5).trim();
    } else if (trimmed.startsWith('where:')) {
      builder.where.push(line.substring(6).trim());
    }
  }
  
  let query = 'DELETE FROM ';
  const tableName = config.escapeIdentifiers ? escapeIdentifier(builder.table, config.database) : builder.table;
  query += tableName;
  
  if (builder.where.length > 0) {
    query += ` WHERE ${builder.where.join(' AND ')}`;
  }
  
  return query;
}

function generateQueryExamples(queryType: string, database: string): string {
  const examples = {
    select: COMMON_PATTERNS.basicSelect,
    insert: COMMON_PATTERNS.basicInsert,
    update: COMMON_PATTERNS.basicUpdate,
    delete: COMMON_PATTERNS.basicDelete,
    create: COMMON_PATTERNS.createTable,
  };
  
  return examples[queryType as keyof typeof examples] || COMMON_PATTERNS.basicSelect;
}

export function processSqlQueryBuilder(input: string, config: SqlQueryBuilderConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide input for SQL query generation'
      };
    }

    let query = '';
    let suggestions: string[] = [];
    
    if (config.queryType === 'custom') {
      // Treat input as raw SQL to format and analyze
      query = input;
    } else {
      // Build query based on type
      switch (config.queryType) {
        case 'select':
          query = buildSelectQuery(input, config);
          suggestions = [
            'Try adding JOIN clauses for related tables',
            'Consider using aggregate functions like COUNT(), SUM()',
            'Add ORDER BY for sorted results',
            'Use LIMIT to control result size'
          ];
          break;
        case 'insert':
          query = buildInsertQuery(input, config);
          suggestions = [
            'Use ON DUPLICATE KEY UPDATE for MySQL',
            'Consider batch inserts for better performance',
            'Add RETURNING clause in PostgreSQL',
            'Use parameterized queries to prevent SQL injection'
          ];
          break;
        case 'update':
          query = buildUpdateQuery(input, config);
          suggestions = [
            'Always include WHERE clause to avoid updating all rows',
            'Consider JOINs for complex updates',
            'Test with SELECT first to verify conditions',
            'Use LIMIT in MySQL to update specific number of rows'
          ];
          break;
        case 'delete':
          query = buildDeleteQuery(input, config);
          suggestions = [
            'Always include WHERE clause to avoid deleting all rows',
            'Consider soft deletes with UPDATE status',
            'Backup data before bulk deletes',
            'Use LIMIT to delete in batches'
          ];
          break;
        default:
          query = input;
      }
    }
    
    // Format the query
    const formattedQuery = formatSqlQuery(query, config);
    
    // Analyze the query
    const queryInfo = analyzeQuery(formattedQuery);
    
    // Build output
    let output = '';
    
    if (config.includeComments) {
      output += `-- Generated SQL Query\n-- Database: ${config.database.toUpperCase()}\n-- Type: ${config.queryType.toUpperCase()}\n\n`;
    }
    
    output += formattedQuery;
    
    if (config.generateExamples) {
      output += '\n\n-- Example Usage:\n';
      output += `-- ${generateQueryExamples(config.queryType, config.database)}\n`;
    }
    
    if (config.includeComments && queryInfo.complexity !== 'simple') {
      output += `\n\n-- Query Analysis:\n`;
      output += `-- Complexity: ${queryInfo.complexity}\n`;
      output += `-- Tables: ${queryInfo.tables.join(', ')}\n`;
      if (queryInfo.hasJoins) output += `-- Uses JOINs: Yes\n`;
      if (queryInfo.hasSubqueries) output += `-- Has Subqueries: Yes\n`;
    }

    return {
      success: true,
      output,
      query: formattedQuery,
      queryInfo,
      suggestions
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build SQL query'
    };
  }
}

export const SQL_QUERY_BUILDER_TOOL: Tool = {
  id: 'sql-query-builder',
  name: 'SQL Query Builder',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'database-tools')!,
  slug: 'sql-query-builder',
  icon: '=�',
  keywords: ['sql', 'query', 'builder', 'database', 'select', 'insert', 'update', 'delete', 'mysql', 'postgresql'],
  seoTitle: 'SQL Query Builder - Generate Database Queries | FreeFormatHub',
  seoDescription: 'Build SQL queries with guided interface. Support for MySQL, PostgreSQL, SQLite, and more. Generate SELECT, INSERT, UPDATE, DELETE queries with formatting.',
  description: 'Build and format SQL queries with an intuitive interface. Support for multiple database systems and query types with syntax validation and optimization suggestions.',

  examples: [
    {
      title: 'Select with Conditions',
      input: `table: users
columns: id, name, email, created_at
where: status = 'active' AND age >= 18
order: created_at DESC
limit: 10`,
      output: `-- Generated SQL Query
-- Database: MYSQL
-- Type: SELECT

SELECT id, name, email, created_at
FROM users
WHERE status = 'active'
  AND age >= 18
ORDER BY created_at DESC
LIMIT 10`,
      description: 'Generate a SELECT query with conditions and ordering'
    },
    {
      title: 'Insert New Record',
      input: `table: products
columns: name, price, category_id, description
values: ('Wireless Headphones', 99.99, 1, 'High-quality audio device')`,
      output: `-- Generated SQL Query
-- Database: MYSQL
-- Type: INSERT

INSERT INTO products (name, price, category_id, description)
VALUES ('Wireless Headphones', 99.99, 1, 'High-quality audio device')`,
      description: 'Generate an INSERT statement with values'
    }
  ],

  useCases: [
    'Building SELECT queries for data retrieval and reporting',
    'Creating INSERT statements for adding new database records',
    'Generating UPDATE queries for modifying existing data',
    'Writing DELETE statements with proper WHERE conditions',
    'Learning SQL syntax for different database systems',
    'Formatting existing SQL queries for better readability',
    'Generating queries for database migrations and setup',
    'Creating complex queries with JOINs and subqueries'
  ],

  faq: [
    {
      question: 'Which databases are supported?',
      answer: 'Supports MySQL, PostgreSQL, SQLite, SQL Server, Oracle, and generic SQL. Each database has specific syntax optimizations and keyword support.'
    },
    {
      question: 'How do I build complex queries with JOINs?',
      answer: 'Add "joins:" lines in your input with the full JOIN syntax, like "INNER JOIN orders ON users.id = orders.user_id". The tool will incorporate them into the final query.'
    },
    {
      question: 'Can it validate my SQL syntax?',
      answer: 'The tool provides basic syntax validation and suggestions. It checks for common issues like missing WHERE clauses in DELETE/UPDATE statements and recommends best practices.'
    },
    {
      question: 'How do I handle special characters in column names?',
      answer: 'Enable "Escape Identifiers" to automatically wrap column and table names in appropriate quotes/backticks based on your database system.'
    },
    {
      question: 'Can I format existing SQL queries?',
      answer: 'Yes! Use "Custom" query type and paste your existing SQL. The tool will format it according to your preferences and provide analysis and suggestions.'
    }
  ],

  commonErrors: [
    'Missing WHERE clause in UPDATE/DELETE statements',
    'Invalid table or column names with special characters',
    'Incorrect JOIN syntax or missing ON conditions',
    'Mixing different database-specific syntax',
    'Missing quotes around string values in conditions'
  ],

  relatedTools: ['sql-formatter', 'database-designer', 'json-to-sql', 'csv-to-sql', 'query-optimizer']
};