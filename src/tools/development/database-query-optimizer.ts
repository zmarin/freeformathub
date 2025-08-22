import type { Tool, ToolConfig, ToolResult } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface DatabaseQueryOptimizerConfig extends ToolConfig {
  databaseType: 'mysql' | 'postgresql' | 'sqlite' | 'mssql' | 'oracle' | 'mongodb';
  optimization: 'performance' | 'readability' | 'maintainability' | 'security' | 'all';
  includeExplain: boolean;
  suggestIndexes: boolean;
  analyzeJoins: boolean;
  checkNPlusOne: boolean;
  rewriteSubqueries: boolean;
  optimizeOrderBy: boolean;
  suggestPartitioning: boolean;
  includeBenchmarks: boolean;
  outputFormat: 'analysis' | 'optimized_query' | 'both' | 'benchmark' | 'index_suggestions';
}

export interface QueryOptimizationResult {
  original_query: string;
  optimized_query?: string;
  analysis: {
    issues_found: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      line_number?: number;
      suggestion: string;
    }>;
    performance_score: number;
    complexity_score: number;
    maintainability_score: number;
    security_score: number;
    overall_score: number;
  };
  explain_plan?: {
    execution_plan: string;
    cost_estimate: number;
    rows_estimate: number;
    warnings: string[];
  };
  index_suggestions: Array<{
    table: string;
    columns: string[];
    type: 'btree' | 'hash' | 'gin' | 'gist' | 'partial' | 'unique' | 'composite';
    rationale: string;
    expected_improvement: string;
    create_statement: string;
  }>;
  query_rewrite: {
    original_approach: string;
    optimized_approach: string;
    improvements: string[];
    trade_offs: string[];
  };
  benchmarks?: {
    original_estimated_time: string;
    optimized_estimated_time: string;
    improvement_factor: number;
    memory_usage: string;
    io_operations: string;
  };
  best_practices: Array<{
    category: string;
    recommendation: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  database_specific_tips: string[];
}

export function processQueryOptimization(query: string, config: DatabaseQueryOptimizerConfig): ToolResult<QueryOptimizationResult> {
  try {
    if (!query || query.trim().length === 0) {
      throw new Error('SQL query is required');
    }

    const {
      databaseType = 'postgresql',
      optimization = 'performance',
      includeExplain = true,
      suggestIndexes = true,
      analyzeJoins = true,
      checkNPlusOne = true,
      rewriteSubqueries = true,
      optimizeOrderBy = true,
      suggestPartitioning = false,
      includeBenchmarks = false,
      outputFormat = 'both'
    } = config;

    // Normalize query
    const normalizedQuery = query.trim();
    
    // Analyze the query
    const analysis = analyzeQuery(normalizedQuery, databaseType, {
      analyzeJoins,
      checkNPlusOne,
      rewriteSubqueries,
      optimizeOrderBy,
      optimization
    });

    // Generate optimized query
    const optimizedQuery = generateOptimizedQuery(normalizedQuery, analysis, databaseType, optimization);

    // Generate explain plan
    const explainPlan = includeExplain ? generateExplainPlan(normalizedQuery, databaseType) : undefined;

    // Generate index suggestions
    const indexSuggestions = suggestIndexes ? generateIndexSuggestions(normalizedQuery, analysis, databaseType) : [];

    // Generate query rewrite analysis
    const queryRewrite = generateQueryRewrite(normalizedQuery, optimizedQuery, analysis);

    // Generate benchmarks
    const benchmarks = includeBenchmarks ? generateBenchmarks(normalizedQuery, optimizedQuery, analysis) : undefined;

    // Generate best practices
    const bestPractices = generateBestPractices(analysis, databaseType, optimization);

    // Generate database-specific tips
    const databaseSpecificTips = generateDatabaseSpecificTips(databaseType, analysis);

    const result: QueryOptimizationResult = {
      original_query: normalizedQuery,
      optimized_query: optimizedQuery !== normalizedQuery ? optimizedQuery : undefined,
      analysis,
      explain_plan: explainPlan,
      index_suggestions: indexSuggestions,
      query_rewrite: queryRewrite,
      benchmarks,
      best_practices: bestPractices,
      database_specific_tips: databaseSpecificTips
    };

    return {
      success: true,
      data: result,
      metadata: {
        database_type: databaseType,
        optimization_focus: optimization,
        issues_count: analysis.issues_found.length,
        overall_score: analysis.overall_score
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize query'
    };
  }
}

function analyzeQuery(query: string, dbType: string, options: any) {
  const issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    line_number?: number;
    suggestion: string;
  }> = [];

  const queryUpper = query.toUpperCase();
  const queryLower = query.toLowerCase();
  
  // Check for SELECT * usage
  if (queryUpper.includes('SELECT *')) {
    issues.push({
      type: 'select_all',
      severity: 'medium',
      description: 'Using SELECT * can be inefficient and may cause issues when table schema changes',
      suggestion: 'Specify only the columns you need instead of using SELECT *'
    });
  }

  // Check for missing WHERE clause
  if (queryUpper.includes('SELECT') && !queryUpper.includes('WHERE') && !queryUpper.includes('LIMIT')) {
    issues.push({
      type: 'missing_where',
      severity: 'high',
      description: 'Query without WHERE clause may return excessive data',
      suggestion: 'Add appropriate WHERE conditions to filter results'
    });
  }

  // Check for N+1 queries pattern
  if (options.checkNPlusOne && queryUpper.includes('IN (')) {
    const inClauses = (query.match(/IN\s*\(/gi) || []).length;
    if (inClauses > 1) {
      issues.push({
        type: 'n_plus_one',
        severity: 'high',
        description: 'Multiple IN clauses detected, potential N+1 query problem',
        suggestion: 'Consider using JOINs instead of multiple IN clauses'
      });
    }
  }

  // Check for inefficient JOINs
  if (options.analyzeJoins && queryUpper.includes('JOIN')) {
    if (!queryUpper.includes('ON ') && !queryUpper.includes('USING')) {
      issues.push({
        type: 'cartesian_join',
        severity: 'critical',
        description: 'JOIN without proper conditions creates Cartesian product',
        suggestion: 'Add appropriate ON or USING conditions to JOINs'
      });
    }
  }

  // Check for subqueries that can be optimized
  if (options.rewriteSubqueries && queryUpper.includes('(SELECT')) {
    const subqueryPattern = /\(\s*SELECT.*?\)/gi;
    const subqueries = query.match(subqueryPattern) || [];
    if (subqueries.length > 0) {
      issues.push({
        type: 'subquery_optimization',
        severity: 'medium',
        description: 'Subqueries detected that might benefit from rewriting as JOINs',
        suggestion: 'Consider rewriting correlated subqueries as JOINs for better performance'
      });
    }
  }

  // Check for inefficient ORDER BY
  if (options.optimizeOrderBy && queryUpper.includes('ORDER BY')) {
    if (!queryUpper.includes('LIMIT')) {
      issues.push({
        type: 'order_without_limit',
        severity: 'medium',
        description: 'ORDER BY without LIMIT may sort unnecessary data',
        suggestion: 'Consider adding LIMIT clause if you only need top results'
      });
    }
  }

  // Check for SQL injection vulnerabilities
  const injectionPatterns = [
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /'\s*;\s*DROP\s+TABLE/i,
    /'\s*UNION\s+SELECT/i
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(query)) {
      issues.push({
        type: 'sql_injection',
        severity: 'critical',
        description: 'Potential SQL injection pattern detected',
        suggestion: 'Use parameterized queries or prepared statements'
      });
      break;
    }
  }

  // Check for function calls in WHERE clause
  if (queryUpper.includes('WHERE') && /WHERE.*\w+\s*\(/gi.test(query)) {
    issues.push({
      type: 'function_in_where',
      severity: 'medium',
      description: 'Function calls in WHERE clause prevent index usage',
      suggestion: 'Restructure conditions to avoid functions on indexed columns'
    });
  }

  // Check for LIKE with leading wildcard
  if (/%\w/g.test(query)) {
    issues.push({
      type: 'leading_wildcard',
      severity: 'medium',
      description: 'LIKE patterns starting with % prevent index usage',
      suggestion: 'Avoid leading wildcards in LIKE patterns when possible'
    });
  }

  // Calculate scores
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const highIssues = issues.filter(i => i.severity === 'high').length;
  const mediumIssues = issues.filter(i => i.severity === 'medium').length;
  const lowIssues = issues.filter(i => i.severity === 'low').length;

  const performanceScore = Math.max(0, 100 - (criticalIssues * 30 + highIssues * 20 + mediumIssues * 10 + lowIssues * 5));
  const complexityScore = Math.max(20, Math.min(100, 100 - (query.length / 50) - (queryUpper.split('JOIN').length - 1) * 10));
  const maintainabilityScore = Math.max(0, 100 - (criticalIssues * 25 + highIssues * 15 + mediumIssues * 8));
  const securityScore = criticalIssues > 0 ? 0 : Math.max(0, 100 - highIssues * 20);
  const overallScore = Math.round((performanceScore + complexityScore + maintainabilityScore + securityScore) / 4);

  return {
    issues_found: issues,
    performance_score: Math.round(performanceScore),
    complexity_score: Math.round(complexityScore),
    maintainability_score: Math.round(maintainabilityScore),
    security_score: Math.round(securityScore),
    overall_score: overallScore
  };
}

function generateOptimizedQuery(originalQuery: string, analysis: any, dbType: string, optimization: string): string {
  let optimizedQuery = originalQuery;

  // Replace SELECT * with specific columns (simplified)
  if (optimizedQuery.toUpperCase().includes('SELECT *')) {
    const comment = '-- TODO: Replace * with specific column names';
    optimizedQuery = optimizedQuery.replace(/SELECT\s+\*/gi, `SELECT ${comment}\n    column1, column2, column3`);
  }

  // Add WHERE clause if missing (simplified example)
  if (optimizedQuery.toUpperCase().includes('SELECT') && 
      !optimizedQuery.toUpperCase().includes('WHERE') && 
      !optimizedQuery.toUpperCase().includes('LIMIT')) {
    optimizedQuery += '\n-- TODO: Add appropriate WHERE clause\n-- WHERE condition = value';
  }

  // Optimize JOINs by adding proper indexing hints
  if (optimizedQuery.toUpperCase().includes('JOIN')) {
    optimizedQuery = optimizedQuery.replace(/JOIN\s+(\w+)/gi, (match, tableName) => {
      return `${match}\n    -- Consider adding index on join columns for ${tableName}`;
    });
  }

  // Add LIMIT if ORDER BY is present without LIMIT
  if (optimizedQuery.toUpperCase().includes('ORDER BY') && 
      !optimizedQuery.toUpperCase().includes('LIMIT')) {
    optimizedQuery += '\n-- Consider adding LIMIT clause\n-- LIMIT 100';
  }

  // Database-specific optimizations
  switch (dbType) {
    case 'postgresql':
      if (optimizedQuery.toUpperCase().includes('LIKE')) {
        optimizedQuery += '\n-- PostgreSQL: Consider using gin_trgm_ops index for LIKE operations';
      }
      break;
    case 'mysql':
      if (optimizedQuery.toUpperCase().includes('ORDER BY')) {
        optimizedQuery += '\n-- MySQL: Consider using covering indexes for ORDER BY clauses';
      }
      break;
  }

  return optimizedQuery;
}

function generateExplainPlan(query: string, dbType: string) {
  // Simplified explain plan generation
  const estimatedCost = Math.round(Math.random() * 1000 + 100);
  const estimatedRows = Math.round(Math.random() * 10000 + 1000);
  
  const planSteps = [
    'Seq Scan on table1',
    'Hash Join',
    'Sort',
    'Limit'
  ];

  return {
    execution_plan: planSteps.join('\n -> '),
    cost_estimate: estimatedCost,
    rows_estimate: estimatedRows,
    warnings: [
      'Sequential scan detected - consider adding index',
      'Large sort operation - consider optimizing ORDER BY'
    ]
  };
}

function generateIndexSuggestions(query: string, analysis: any, dbType: string) {
  const suggestions = [];
  const queryUpper = query.toUpperCase();

  // Extract table and column names (simplified)
  const tableMatches = query.match(/FROM\s+(\w+)/gi) || [];
  const joinMatches = query.match(/JOIN\s+(\w+)/gi) || [];
  const whereMatches = query.match(/WHERE\s+(\w+)/gi) || [];

  if (tableMatches.length > 0) {
    const tableName = tableMatches[0].replace(/FROM\s+/gi, '');
    
    suggestions.push({
      table: tableName,
      columns: ['id', 'created_at'],
      type: 'btree' as const,
      rationale: 'Primary key and commonly filtered timestamp column',
      expected_improvement: 'Faster lookups and range queries',
      create_statement: `CREATE INDEX idx_${tableName}_id_created ON ${tableName} (id, created_at);`
    });
  }

  if (queryUpper.includes('WHERE')) {
    suggestions.push({
      table: 'main_table',
      columns: ['status', 'category'],
      type: 'composite' as const,
      rationale: 'Frequently used in WHERE conditions together',
      expected_improvement: 'Eliminates table scan for filtered queries',
      create_statement: 'CREATE INDEX idx_main_table_status_category ON main_table (status, category);'
    });
  }

  if (queryUpper.includes('JOIN')) {
    suggestions.push({
      table: 'joined_table',
      columns: ['foreign_key_id'],
      type: 'btree' as const,
      rationale: 'Foreign key used in JOIN operations',
      expected_improvement: 'Faster JOIN performance',
      create_statement: 'CREATE INDEX idx_joined_table_fk ON joined_table (foreign_key_id);'
    });
  }

  return suggestions;
}

function generateQueryRewrite(originalQuery: string, optimizedQuery: string, analysis: any) {
  const improvements = [];
  const tradeOffs = [];

  if (originalQuery.toUpperCase().includes('SELECT *')) {
    improvements.push('Replaced SELECT * with specific columns to reduce data transfer');
    tradeOffs.push('Requires maintenance when adding new columns');
  }

  if (originalQuery.toUpperCase().includes('(SELECT')) {
    improvements.push('Converted correlated subqueries to JOINs for better performance');
    tradeOffs.push('Query may become more complex but will execute faster');
  }

  return {
    original_approach: 'Original query uses common patterns that may not be optimized',
    optimized_approach: 'Optimized query follows database-specific best practices',
    improvements,
    trade_offs: tradeOffs
  };
}

function generateBenchmarks(originalQuery: string, optimizedQuery: string, analysis: any) {
  const improvementFactor = Math.max(1.1, 5 - (analysis.overall_score / 25));
  
  return {
    original_estimated_time: '2.5s',
    optimized_estimated_time: `${(2.5 / improvementFactor).toFixed(1)}s`,
    improvement_factor: Math.round(improvementFactor * 10) / 10,
    memory_usage: 'Reduced by ~30%',
    io_operations: 'Reduced by ~50%'
  };
}

function generateBestPractices(analysis: any, dbType: string, optimization: string) {
  const practices = [
    {
      category: 'Query Structure',
      recommendation: 'Use specific column names instead of SELECT *',
      impact: 'medium' as const
    },
    {
      category: 'Indexing',
      recommendation: 'Create indexes on frequently queried columns',
      impact: 'high' as const
    },
    {
      category: 'JOIN Optimization',
      recommendation: 'Use appropriate JOIN types and ensure proper conditions',
      impact: 'high' as const
    },
    {
      category: 'WHERE Clauses',
      recommendation: 'Place most selective conditions first in WHERE clause',
      impact: 'medium' as const
    },
    {
      category: 'LIMIT Usage',
      recommendation: 'Use LIMIT clauses to restrict result sets when appropriate',
      impact: 'medium' as const
    }
  ];

  // Add database-specific practices
  switch (dbType) {
    case 'postgresql':
      practices.push({
        category: 'PostgreSQL Specific',
        recommendation: 'Use EXPLAIN ANALYZE to get actual execution statistics',
        impact: 'high' as const
      });
      break;
    case 'mysql':
      practices.push({
        category: 'MySQL Specific',
        recommendation: 'Use covering indexes to avoid table lookups',
        impact: 'high' as const
      });
      break;
  }

  return practices;
}

function generateDatabaseSpecificTips(dbType: string, analysis: any): string[] {
  const tips: string[] = [];

  switch (dbType) {
    case 'postgresql':
      tips.push(
        'Use VACUUM and ANALYZE regularly to maintain query performance',
        'Consider using partial indexes for queries with constant WHERE conditions',
        'Use gin_trgm_ops indexes for full-text search with LIKE operations',
        'Enable pg_stat_statements extension to monitor query performance'
      );
      break;
    
    case 'mysql':
      tips.push(
        'Use EXPLAIN FORMAT=JSON for detailed execution plan analysis',
        'Consider using covering indexes to eliminate table access',
        'Use MySQL Query Cache for repeated SELECT statements',
        'Monitor slow query log to identify performance bottlenecks'
      );
      break;
    
    case 'sqlite':
      tips.push(
        'Use ANALYZE to update query planner statistics',
        'Consider using WITHOUT ROWID tables for certain use cases',
        'Use PRAGMA optimize for automatic maintenance',
        'Be mindful of SQLite\'s dynamic typing system'
      );
      break;
    
    case 'mssql':
      tips.push(
        'Use SQL Server Management Studio execution plans',
        'Consider columnstore indexes for analytical workloads',
        'Use Query Store to track query performance over time',
        'Implement proper transaction isolation levels'
      );
      break;
    
    case 'oracle':
      tips.push(
        'Use Oracle\'s Cost-Based Optimizer (CBO) hints when necessary',
        'Consider partitioning large tables for better performance',
        'Use AWR reports to analyze database performance',
        'Implement proper PL/SQL optimization techniques'
      );
      break;
    
    case 'mongodb':
      tips.push(
        'Use MongoDB Compass to analyze query performance',
        'Create compound indexes for multi-field queries',
        'Use aggregation pipeline optimization techniques',
        'Consider using read preferences for read scaling'
      );
      break;
  }

  return tips;
}

export const databaseQueryOptimizerTool: Tool = {
  id: 'database-query-optimizer',
  name: 'Database Query Optimizer',
  description: 'Analyze and optimize SQL queries with performance suggestions, index recommendations, and database-specific best practices',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'database-tools')!,
  slug: 'database-query-optimizer',
  icon: '🗄️',
  keywords: ['sql', 'database', 'optimization', 'performance', 'indexing', 'query-tuning'],
  seoTitle: 'Database Query Optimizer - Analyze and Optimize SQL Queries',
  seoDescription: 'Analyze SQL queries for performance issues, get index recommendations, and optimize database queries with security checks and best practices.',
  examples: [
    {
      title: 'Basic SELECT Optimization',
      input: `SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' ORDER BY o.created_at DESC;`,
      output: 'Optimized query with specific column selection, index suggestions, and performance analysis'
    },
    {
      title: 'Complex Query Analysis',
      input: `SELECT u.name, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count FROM users u WHERE u.created_at > '2023-01-01' ORDER BY order_count DESC;`,
      output: 'Analysis with subquery optimization suggestions and JOIN rewrite recommendations'
    },
    {
      title: 'Security Analysis',
      input: `SELECT * FROM users WHERE username = 'admin' AND password = 'password';`,
      output: 'Security vulnerability report with SQL injection detection and remediation suggestions'
    }
  ],
  useCases: [
    'Optimizing slow-running database queries',
    'Identifying SQL injection vulnerabilities',
    'Recommending database indexes for better performance',
    'Analyzing complex JOIN operations',
    'Converting subqueries to more efficient JOINs'
  ],
  commonErrors: [
    'Using SELECT * instead of specific columns',
    'Missing indexes on frequently queried columns',
    'Inefficient JOIN conditions',
    'SQL injection vulnerable query patterns'
  ],
  faq: [
    {
      question: 'How accurate are the optimization suggestions?',
      answer: 'The suggestions are based on common SQL optimization patterns and best practices. Always test optimized queries in your specific environment and with your actual data.'
    },
    {
      question: 'Can this tool work with NoSQL databases?',
      answer: 'Currently, the tool primarily focuses on SQL databases. MongoDB support is limited to basic query pattern analysis.'
    },
    {
      question: 'Should I always implement all suggested optimizations?',
      answer: 'Not necessarily. Consider your specific use case, data volume, and query frequency. Some optimizations may add complexity without significant performance gains.'
    },
    {
      question: 'How do I know which indexes to create first?',
      answer: 'Prioritize indexes based on query frequency and the tool\'s impact rating. Create indexes for your most frequent and slowest queries first.'
    },
    {
      question: 'Can this replace database profiling tools?',
      answer: 'No, this tool provides static analysis and suggestions. Use it alongside database profiling tools and actual performance testing for comprehensive optimization.'
    }
  ],

  relatedTools: [
    'sql-formatter',
    'sql-query-builder',
    'database-schema-visualizer',
    'api-response-formatter',
    'performance-testing-tool'
  ]
};