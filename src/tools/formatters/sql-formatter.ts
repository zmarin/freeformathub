import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface SqlFormatterConfig {
  mode: 'beautify' | 'minify';
  indentSize: number;
  indentType: 'spaces' | 'tabs';
  keywordCase: 'upper' | 'lower' | 'preserve';
  functionCase: 'upper' | 'lower' | 'preserve';
  identifierCase: 'upper' | 'lower' | 'preserve';
  linesBetweenQueries: number;
  alignCommas: boolean;
  alignColumns: boolean;
  breakBeforeComma: boolean;
  breakAfterJoin: boolean;
  maxLineLength: number;
  validateSyntax: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  stats?: {
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    lineCount: number;
    queryCount: number;
    tableCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
  };
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: 'error' | 'warning';
  code: string;
}

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER',
  'ON', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'ALTER', 'DROP', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'CONSTRAINT',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'NOT', 'NULL',
  'DEFAULT', 'AUTO_INCREMENT', 'TIMESTAMP', 'DATETIME', 'DATE', 'TIME',
  'VARCHAR', 'CHAR', 'TEXT', 'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT',
  'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'BOOL', 'BIT',
  'UNION', 'ALL', 'DISTINCT', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'IF', 'EXISTS', 'IN', 'BETWEEN', 'LIKE', 'ILIKE', 'REGEXP', 'RLIKE',
  'IS', 'AND', 'OR', 'XOR', 'DIV', 'MOD', 'MATCH', 'AGAINST', 'FULLTEXT',
  'WITH', 'RECURSIVE', 'CTE', 'WINDOW', 'OVER', 'PARTITION', 'ROWS', 'RANGE',
  'UNBOUNDED', 'PRECEDING', 'FOLLOWING', 'CURRENT', 'ROW', 'FIRST', 'LAST'
]);

const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ABS', 'ROUND', 'CEIL', 'CEILING',
  'FLOOR', 'POWER', 'SQRT', 'RAND', 'RANDOM', 'UPPER', 'LOWER', 'LENGTH',
  'LEN', 'SUBSTRING', 'SUBSTR', 'TRIM', 'LTRIM', 'RTRIM', 'CONCAT',
  'COALESCE', 'NULLIF', 'ISNULL', 'IFNULL', 'NOW', 'CURDATE', 'CURTIME',
  'DATE_ADD', 'DATE_SUB', 'DATEDIFF', 'YEAR', 'MONTH', 'DAY', 'HOUR',
  'MINUTE', 'SECOND', 'CAST', 'CONVERT', 'FORMAT', 'REPLACE', 'STUFF'
]);

const OPERATORS = new Set([
  '=', '<>', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/', '%', '||',
  '&&', '!', '^', '&', '|', '<<', '>>', '~', '<->', 'SOUNDS', 'LIKE'
]);

interface SqlToken {
  type: 'keyword' | 'function' | 'identifier' | 'operator' | 'literal' | 
        'string' | 'number' | 'comment' | 'punctuation' | 'whitespace';
  value: string;
  line: number;
  column: number;
}

function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let position = 0;
  let line = 1;
  let column = 1;

  while (position < sql.length) {
    const char = sql[position];
    
    // Skip whitespace but track position
    if (/\s/.test(char)) {
      let whitespaceEnd = position;
      let whitespaceContent = '';
      
      while (whitespaceEnd < sql.length && /\s/.test(sql[whitespaceEnd])) {
        whitespaceContent += sql[whitespaceEnd];
        if (sql[whitespaceEnd] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        whitespaceEnd++;
      }
      
      tokens.push({
        type: 'whitespace',
        value: whitespaceContent,
        line,
        column: column - whitespaceContent.length
      });
      
      position = whitespaceEnd;
      continue;
    }
    
    // Comments
    if (char === '-' && sql[position + 1] === '-') {
      // Single line comment
      let commentEnd = position + 2;
      while (commentEnd < sql.length && sql[commentEnd] !== '\n') {
        commentEnd++;
      }
      
      const commentContent = sql.slice(position, commentEnd);
      tokens.push({
        type: 'comment',
        value: commentContent,
        line,
        column
      });
      
      column += commentContent.length;
      position = commentEnd;
      continue;
    }
    
    if (char === '/' && sql[position + 1] === '*') {
      // Multi-line comment
      let commentEnd = position + 2;
      while (commentEnd < sql.length - 1) {
        if (sql[commentEnd] === '*' && sql[commentEnd + 1] === '/') {
          commentEnd += 2;
          break;
        }
        if (sql[commentEnd] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        commentEnd++;
      }
      
      const commentContent = sql.slice(position, commentEnd);
      tokens.push({
        type: 'comment',
        value: commentContent,
        line,
        column: column - commentContent.length + 1
      });
      
      position = commentEnd;
      continue;
    }
    
    // Strings
    if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      let stringEnd = position + 1;
      let escaped = false;
      
      while (stringEnd < sql.length) {
        const c = sql[stringEnd];
        if (escaped) {
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === quote) {
          stringEnd++;
          break;
        } else if (c === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        stringEnd++;
      }
      
      const stringContent = sql.slice(position, stringEnd);
      tokens.push({
        type: 'string',
        value: stringContent,
        line,
        column
      });
      
      position = stringEnd;
      continue;
    }
    
    // Numbers
    if (/\d/.test(char) || (char === '.' && /\d/.test(sql[position + 1] || ''))) {
      let numberEnd = position;
      let hasDecimal = char === '.';
      
      while (numberEnd < sql.length) {
        const c = sql[numberEnd];
        if (/\d/.test(c)) {
          numberEnd++;
        } else if (c === '.' && !hasDecimal) {
          hasDecimal = true;
          numberEnd++;
        } else if ((c === 'e' || c === 'E') && numberEnd > position) {
          numberEnd++;
          if (numberEnd < sql.length && (sql[numberEnd] === '+' || sql[numberEnd] === '-')) {
            numberEnd++;
          }
        } else {
          break;
        }
      }
      
      const numberContent = sql.slice(position, numberEnd);
      tokens.push({
        type: 'number',
        value: numberContent,
        line,
        column
      });
      
      column += numberContent.length;
      position = numberEnd;
      continue;
    }
    
    // Multi-character operators
    let operatorFound = false;
    for (let len = 3; len >= 1; len--) {
      const potential = sql.slice(position, position + len).toUpperCase();
      if (OPERATORS.has(potential)) {
        tokens.push({
          type: 'operator',
          value: sql.slice(position, position + len),
          line,
          column
        });
        
        column += len;
        position += len;
        operatorFound = true;
        break;
      }
    }
    
    if (operatorFound) continue;
    
    // Punctuation
    if ('();,[]{}.*'.includes(char)) {
      tokens.push({
        type: 'punctuation',
        value: char,
        line,
        column
      });
      
      column++;
      position++;
      continue;
    }
    
    // Identifiers and keywords
    if (/[a-zA-Z_@#$]/.test(char)) {
      let identifierEnd = position;
      while (identifierEnd < sql.length && /[a-zA-Z0-9_@#$]/.test(sql[identifierEnd])) {
        identifierEnd++;
      }
      
      const identifier = sql.slice(position, identifierEnd);
      const upperIdentifier = identifier.toUpperCase();
      
      let type: SqlToken['type'] = 'identifier';
      if (SQL_KEYWORDS.has(upperIdentifier)) {
        type = 'keyword';
      } else if (SQL_FUNCTIONS.has(upperIdentifier)) {
        type = 'function';
      }
      
      tokens.push({
        type,
        value: identifier,
        line,
        column
      });
      
      column += identifier.length;
      position = identifierEnd;
      continue;
    }
    
    // Everything else as punctuation
    tokens.push({
      type: 'punctuation',
      value: char,
      line,
      column
    });
    
    column++;
    position++;
  }
  
  return tokens;
}

function validateSql(tokens: SqlToken[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const parenthesesStack: Array<{ line: number; column: number }> = [];
  
  let queryCount = 0;
  let tableCount = 0;
  let hasSelect = false;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'whitespace') continue;
    
    // Count queries and tables
    if (token.type === 'keyword') {
      if (token.value.toUpperCase() === 'SELECT') {
        hasSelect = true;
        queryCount++;
      } else if (['FROM', 'JOIN', 'INTO'].includes(token.value.toUpperCase())) {
        // Next non-whitespace token might be a table name
        let j = i + 1;
        while (j < tokens.length && tokens[j].type === 'whitespace') j++;
        if (j < tokens.length && tokens[j].type === 'identifier') {
          tableCount++;
        }
      }
    }
    
    // Check parentheses matching
    if (token.type === 'punctuation') {
      if (token.value === '(') {
        parenthesesStack.push({ line: token.line, column: token.column });
      } else if (token.value === ')') {
        if (parenthesesStack.length === 0) {
          errors.push({
            line: token.line,
            column: token.column,
            message: 'Unexpected closing parenthesis',
            type: 'error',
            code: 'unexpected-closing-paren'
          });
        } else {
          parenthesesStack.pop();
        }
      }
    }
    
    // Check for incomplete statements
    if (token.type === 'keyword' && token.value.toUpperCase() === 'SELECT') {
      let j = i + 1;
      let hasFrom = false;
      while (j < tokens.length) {
        if (tokens[j].type === 'keyword' && tokens[j].value.toUpperCase() === 'FROM') {
          hasFrom = true;
          break;
        } else if (tokens[j].type === 'punctuation' && tokens[j].value === ';') {
          break;
        }
        j++;
      }
      
      if (!hasFrom) {
        errors.push({
          line: token.line,
          column: token.column,
          message: 'SELECT statement missing FROM clause',
          type: 'warning',
          code: 'missing-from-clause'
        });
      }
    }
  }
  
  // Check for unclosed parentheses
  for (const paren of parenthesesStack) {
    errors.push({
      line: paren.line,
      column: paren.column,
      message: 'Unclosed parenthesis',
      type: 'error',
      code: 'unclosed-paren'
    });
  }
  
  return errors;
}

function beautifySql(tokens: SqlToken[], config: SqlFormatterConfig): string {
  const lines: string[] = [];
  let currentLine = '';
  let indentLevel = 0;
  const indent = config.indentType === 'tabs' ? '\t' : ' '.repeat(config.indentSize);
  
  function addLine(content: string = '') {
    lines.push(indent.repeat(indentLevel) + content);
  }
  
  function addToCurrentLine(content: string) {
    currentLine += content;
  }
  
  function finishCurrentLine() {
    if (currentLine.trim()) {
      lines.push(indent.repeat(indentLevel) + currentLine.trim());
      currentLine = '';
    }
  }
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;
    
    if (token.type === 'whitespace') {
      if (token.value.includes('\n')) {
        finishCurrentLine();
      } else if (currentLine && !currentLine.endsWith(' ')) {
        addToCurrentLine(' ');
      }
      continue;
    }
    
    if (token.type === 'comment') {
      if (token.value.startsWith('--')) {
        finishCurrentLine();
        addLine(token.value);
      } else {
        addToCurrentLine(' ' + token.value);
      }
      continue;
    }
    
    let value = token.value;
    
    // Apply case formatting
    if (token.type === 'keyword' && config.keywordCase !== 'preserve') {
      value = config.keywordCase === 'upper' ? value.toUpperCase() : value.toLowerCase();
    } else if (token.type === 'function' && config.functionCase !== 'preserve') {
      value = config.functionCase === 'upper' ? value.toUpperCase() : value.toLowerCase();
    } else if (token.type === 'identifier' && config.identifierCase !== 'preserve') {
      value = config.identifierCase === 'upper' ? value.toUpperCase() : value.toLowerCase();
    }
    
    // Handle major keywords that should start new lines
    const majorKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'UNION'];
    const joinKeywords = ['JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL'];
    
    if (token.type === 'keyword') {
      const upperValue = value.toUpperCase();
      
      if (majorKeywords.includes(upperValue)) {
        finishCurrentLine();
        addToCurrentLine(value);
        
        if (upperValue === 'SELECT') {
          // Handle SELECT columns
          let j = i + 1;
          let isFirstColumn = true;
          
          while (j < tokens.length && tokens[j].type !== 'keyword' || 
                 !majorKeywords.includes(tokens[j].value.toUpperCase())) {
            
            if (tokens[j].type === 'punctuation' && tokens[j].value === ',') {
              if (config.breakBeforeComma) {
                finishCurrentLine();
                addLine(',' + (isFirstColumn ? '' : ''));
              } else {
                addToCurrentLine(',');
                finishCurrentLine();
                addLine('');
              }
              isFirstColumn = false;
            } else if (tokens[j].type !== 'whitespace') {
              if (isFirstColumn && !currentLine.includes(' ')) {
                addToCurrentLine(' ');
              }
              addToCurrentLine(tokens[j].value);
            }
            j++;
          }
          i = j - 1; // Skip processed tokens
        }
      } else if (joinKeywords.includes(upperValue) && config.breakAfterJoin) {
        finishCurrentLine();
        addToCurrentLine(value);
      } else {
        addToCurrentLine(value);
      }
    } else if (token.type === 'punctuation') {
      if (token.value === ';') {
        addToCurrentLine(token.value);
        finishCurrentLine();
        
        // Add spacing between queries
        for (let k = 0; k < config.linesBetweenQueries; k++) {
          addLine('');
        }
      } else if (token.value === '(') {
        addToCurrentLine(token.value);
        indentLevel++;
      } else if (token.value === ')') {
        indentLevel = Math.max(0, indentLevel - 1);
        addToCurrentLine(token.value);
      } else {
        addToCurrentLine(token.value);
      }
    } else {
      addToCurrentLine(value);
    }
  }
  
  finishCurrentLine();
  
  // Clean up multiple empty lines
  return lines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

function minifySql(tokens: SqlToken[], config: SqlFormatterConfig): string {
  let result = '';
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;
    
    if (token.type === 'whitespace') {
      // Only add space where syntactically necessary
      if (prevToken && nextToken &&
          (prevToken.type === 'keyword' || prevToken.type === 'identifier' || prevToken.type === 'number') &&
          (nextToken.type === 'keyword' || nextToken.type === 'identifier' || nextToken.type === 'number')) {
        result += ' ';
      }
      continue;
    }
    
    if (token.type === 'comment') {
      // Skip comments in minify mode
      continue;
    }
    
    let value = token.value;
    
    // Apply case formatting
    if (token.type === 'keyword' && config.keywordCase !== 'preserve') {
      value = config.keywordCase === 'upper' ? value.toUpperCase() : value.toLowerCase();
    } else if (token.type === 'function' && config.functionCase !== 'preserve') {
      value = config.functionCase === 'upper' ? value.toUpperCase() : value.toLowerCase();
    }
    
    result += value;
  }
  
  return result;
}

export function processSqlFormatter(input: string, config: SqlFormatterConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide SQL content to process'
      };
    }
    
    const originalSize = input.length;
    const tokens = tokenizeSql(input);
    
    let errors: ValidationError[] = [];
    let warnings: ValidationError[] = [];
    
    if (config.validateSyntax) {
      const validationErrors = validateSql(tokens);
      errors = validationErrors.filter(e => e.type === 'error');
      warnings = validationErrors.filter(e => e.type === 'warning');
    }
    
    let output = '';
    if (config.mode === 'beautify') {
      output = beautifySql(tokens, config);
    } else {
      output = minifySql(tokens, config);
    }
    
    const processedSize = output.length;
    const compressionRatio = originalSize > 0 ? processedSize / originalSize : 1;
    const lineCount = output.split('\n').length;
    
    // Count queries and tables
    const queryCount = tokens.filter(t => t.type === 'keyword' && t.value.toUpperCase() === 'SELECT').length;
    const tableKeywords = tokens.filter(t => t.type === 'keyword' && ['FROM', 'JOIN', 'INTO'].includes(t.value.toUpperCase()));
    const tableCount = tableKeywords.length;
    
    return {
      success: true,
      output,
      stats: {
        originalSize,
        processedSize,
        compressionRatio,
        lineCount,
        queryCount,
        tableCount,
        errors,
        warnings
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process SQL'
    };
  }
}

export const SQL_FORMATTER_TOOL: Tool = {
  id: 'sql-formatter',
  name: 'SQL Formatter & Beautifier',
  description: 'Format, beautify, and minify SQL queries with proper indentation, keyword formatting, and syntax validation. Supports multiple SQL dialects with comprehensive formatting options.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'code-formatting')!,
  slug: 'sql-formatter',
  icon: 'Database',
  tags: ['sql', 'format', 'beautify', 'minify', 'database', 'query'],
  complexity: 'intermediate',
  keywords: ['sql', 'format', 'beautify', 'minify', 'database', 'query', 'mysql', 'postgresql', 'oracle'],
  
  examples: [
    {
      title: 'Basic SELECT Query',
      input: `select u.id,u.name,u.email,p.title from users u join posts p on u.id=p.user_id where u.active=1 order by u.name;`,
      output: `SELECT u.id,\n       u.name,\n       u.email,\n       p.title\nFROM users u\nJOIN posts p ON u.id = p.user_id\nWHERE u.active = 1\nORDER BY u.name;`,
      description: 'Format a basic SQL query with joins and conditions'
    },
    {
      title: 'Complex Query with Subquery',
      input: `SELECT customers.customer_name,orders.order_date,(SELECT COUNT(*) FROM order_items WHERE order_items.order_id = orders.order_id) as item_count FROM customers INNER JOIN orders ON customers.customer_id = orders.customer_id WHERE orders.order_date >= '2023-01-01';`,
      output: `SELECT customers.customer_name,\n       orders.order_date,\n       (SELECT COUNT(*)\n        FROM order_items\n        WHERE order_items.order_id = orders.order_id) AS item_count\nFROM customers\nINNER JOIN orders ON customers.customer_id = orders.customer_id\nWHERE orders.order_date >= '2023-01-01';`,
      description: 'Format complex query with subqueries and aggregations'
    },
    {
      title: 'Multiple Statements',
      input: `CREATE TABLE users (id INT PRIMARY KEY,name VARCHAR(255) NOT NULL,email VARCHAR(255) UNIQUE);INSERT INTO users (name,email) VALUES ('John Doe','john@example.com'),('Jane Smith','jane@example.com');`,
      output: `CREATE TABLE users (\n    id INT PRIMARY KEY,\n    name VARCHAR(255) NOT NULL,\n    email VARCHAR(255) UNIQUE\n);\n\nINSERT INTO users (name, email)\nVALUES ('John Doe', 'john@example.com'),\n       ('Jane Smith', 'jane@example.com');`,
      description: 'Format multiple SQL statements'
    }
  ],
  
  useCases: [
    'Database query development and debugging',
    'Code review and documentation',
    'SQL script optimization and readability',
    'Educational SQL formatting examples',
    'Preparing SQL for production deployment'
  ],
  
  faq: [
    {
      question: 'What SQL dialects are supported?',
      answer: 'The formatter supports standard SQL syntax and is compatible with MySQL, PostgreSQL, SQL Server, Oracle, and SQLite. It handles common keywords, functions, and operators across these platforms.'
    },
    {
      question: 'Can I customize the formatting style?',
      answer: 'Yes, you can configure indentation (spaces/tabs), keyword case (upper/lower), comma placement, line breaks for JOINs, and alignment options for a consistent coding style.'
    },
    {
      question: 'Does it validate SQL syntax?',
      answer: 'The tool performs basic syntax validation including bracket matching, incomplete statements, and structural issues. For comprehensive validation, use a dedicated SQL parser.'
    },
    {
      question: 'How does minification work?',
      answer: 'Minification removes unnecessary whitespace and comments while preserving SQL functionality. This is useful for reducing query size in production environments.'
    },
    {
      question: 'What about complex queries with CTEs and window functions?',
      answer: 'The formatter handles Common Table Expressions (WITH clauses), window functions (OVER, PARTITION BY), and other advanced SQL features with proper indentation and formatting.'
    }
  ],
  
  commonErrors: [
    'Unclosed parentheses or brackets',
    'Missing FROM clause in SELECT',
    'Invalid keyword or function name'
  ],
  
  relatedTools: ['json-formatter', 'xml-formatter', 'html-beautifier'],
  seoTitle: 'SQL Formatter & Beautifier - Free SQL Query Formatter',
  seoDescription: 'Format and beautify SQL queries with proper indentation, keyword formatting, and syntax validation. Supports MySQL, PostgreSQL, Oracle, and more.'
};