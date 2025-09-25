import React, { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { useToolStore } from '../../../lib/store/toolStore';
import type { DatabaseQueryOptimizerConfig, QueryOptimizationResult } from '../../../tools/development/database-query-optimizer';
import { processQueryOptimization } from '../../../tools/development/database-query-optimizer';

export function DatabaseQueryOptimizer() {
  const [input, setInput] = useState(`SELECT *
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
ORDER BY o.created_at DESC;`);
  const [result, setResult] = useState<QueryOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { getConfig, updateConfig } = useToolStore();
  const config = getConfig('database-query-optimizer') as DatabaseQueryOptimizerConfig;

  const options = [
    {
      key: 'databaseType',
      label: 'Database Type',
      type: 'select' as const,
      default: 'postgresql',
      options: [
        { value: 'mysql', label: 'MySQL' },
        { value: 'postgresql', label: 'PostgreSQL' },
        { value: 'sqlite', label: 'SQLite' },
        { value: 'mssql', label: 'SQL Server' },
        { value: 'oracle', label: 'Oracle' },
        { value: 'mongodb', label: 'MongoDB' }
      ],
      description: 'Target database system for optimization'
    },
    {
      key: 'optimization',
      label: 'Optimization Focus',
      type: 'select' as const,
      default: 'performance',
      options: [
        { value: 'performance', label: 'Performance' },
        { value: 'readability', label: 'Readability' },
        { value: 'maintainability', label: 'Maintainability' },
        { value: 'security', label: 'Security' },
        { value: 'all', label: 'All Aspects' }
      ],
      description: 'Primary optimization objective'
    },
    {
      key: 'includeExplain',
      label: 'Include Execution Plan',
      type: 'boolean' as const,
      default: true,
      description: 'Generate simulated execution plan analysis'
    },
    {
      key: 'suggestIndexes',
      label: 'Suggest Indexes',
      type: 'boolean' as const,
      default: true,
      description: 'Provide index creation suggestions'
    },
    {
      key: 'analyzeJoins',
      label: 'Analyze JOIN Operations',
      type: 'boolean' as const,
      default: true,
      description: 'Check for JOIN optimization opportunities'
    },
    {
      key: 'checkNPlusOne',
      label: 'Check N+1 Queries',
      type: 'boolean' as const,
      default: true,
      description: 'Detect potential N+1 query problems'
    },
    {
      key: 'rewriteSubqueries',
      label: 'Optimize Subqueries',
      type: 'boolean' as const,
      default: true,
      description: 'Suggest subquery to JOIN conversions'
    },
    {
      key: 'optimizeOrderBy',
      label: 'Optimize ORDER BY',
      type: 'boolean' as const,
      default: true,
      description: 'Analyze ORDER BY performance'
    },
    {
      key: 'suggestPartitioning',
      label: 'Suggest Partitioning',
      type: 'boolean' as const,
      default: false,
      description: 'Recommend table partitioning strategies'
    },
    {
      key: 'includeBenchmarks',
      label: 'Include Performance Benchmarks',
      type: 'boolean' as const,
      default: false,
      description: 'Estimate performance improvements'
    },
    {
      key: 'outputFormat',
      label: 'Output Format',
      type: 'select' as const,
      default: 'both',
      options: [
        { value: 'analysis', label: 'Analysis Only' },
        { value: 'optimized_query', label: 'Optimized Query Only' },
        { value: 'both', label: 'Analysis + Optimized Query' },
        { value: 'benchmark', label: 'Performance Benchmark' },
        { value: 'index_suggestions', label: 'Index Suggestions' }
      ],
      description: 'Preferred output format'
    }
  ];

  const processInput = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!input.trim()) {
          setResult(null);
          setError(null);
          return;
        }

        setIsProcessing(true);
        setError(null);

        try {
          const processResult = processQueryOptimization(input, config);
          
          if (processResult.success) {
            setResult(processResult.data!);
            setError(null);
          } else {
            setError(processResult.error || 'Failed to optimize query');
            setResult(null);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
          setResult(null);
        } finally {
          setIsProcessing(false);
        }
      }, 500);
    };
  }, [input, config]);

  useEffect(() => {
    processInput();
  }, [processInput]);

  const outputContent = useMemo(() => {
    if (error) {
      return `Error: ${error}`;
    }

    if (!result) {
      return 'Enter your SQL query to analyze and optimize...';
    }

    const sections = [];

    switch (config.outputFormat) {
      case 'analysis':
        sections.push('# Query Analysis Report');
        sections.push('');
        sections.push('## Performance Scores');
        sections.push(`- **Overall Score**: ${result.analysis.overall_score}/100`);
        sections.push(`- **Performance**: ${result.analysis.performance_score}/100`);
        sections.push(`- **Complexity**: ${result.analysis.complexity_score}/100`);
        sections.push(`- **Maintainability**: ${result.analysis.maintainability_score}/100`);
        sections.push(`- **Security**: ${result.analysis.security_score}/100`);
        
        if (result.analysis.issues_found.length > 0) {
          sections.push('');
          sections.push('## Issues Found');
          result.analysis.issues_found.forEach((issue, index) => {
            sections.push(`### ${index + 1}. ${issue.type.replace('_', ' ').toUpperCase()} (${issue.severity.toUpperCase()})`);
            sections.push(`**Description**: ${issue.description}`);
            sections.push(`**Suggestion**: ${issue.suggestion}`);
            sections.push('');
          });
        }
        break;

      case 'optimized_query':
        if (result.optimized_query) {
          sections.push('# Optimized Query');
          sections.push('');
          sections.push('```sql');
          sections.push(result.optimized_query);
          sections.push('```');
        } else {
          sections.push('# No Optimizations Needed');
          sections.push('');
          sections.push('Your query is already well-optimized!');
        }
        break;

      case 'benchmark':
        if (result.benchmarks) {
          sections.push('# Performance Benchmark');
          sections.push('');
          sections.push('## Estimated Performance');
          sections.push(`- **Original Time**: ${result.benchmarks.original_estimated_time}`);
          sections.push(`- **Optimized Time**: ${result.benchmarks.optimized_estimated_time}`);
          sections.push(`- **Improvement Factor**: ${result.benchmarks.improvement_factor}x`);
          sections.push(`- **Memory Usage**: ${result.benchmarks.memory_usage}`);
          sections.push(`- **I/O Operations**: ${result.benchmarks.io_operations}`);
        }
        break;

      case 'index_suggestions':
        sections.push('# Index Suggestions');
        sections.push('');
        if (result.index_suggestions.length > 0) {
          result.index_suggestions.forEach((suggestion, index) => {
            sections.push(`## ${index + 1}. ${suggestion.table} - ${suggestion.type.toUpperCase()} Index`);
            sections.push(`**Columns**: ${suggestion.columns.join(', ')}`);
            sections.push(`**Rationale**: ${suggestion.rationale}`);
            sections.push(`**Expected Improvement**: ${suggestion.expected_improvement}`);
            sections.push('');
            sections.push('```sql');
            sections.push(suggestion.create_statement);
            sections.push('```');
            sections.push('');
          });
        } else {
          sections.push('No specific index suggestions available for this query.');
        }
        break;

      case 'both':
      default:
        sections.push('# Query Optimization Report');
        sections.push('');
        
        // Original Query
        sections.push('## Original Query');
        sections.push('```sql');
        sections.push(result.original_query);
        sections.push('```');
        sections.push('');

        // Optimized Query
        if (result.optimized_query) {
          sections.push('## Optimized Query');
          sections.push('```sql');
          sections.push(result.optimized_query);
          sections.push('```');
          sections.push('');
        }

        // Performance Scores
        sections.push('## Performance Analysis');
        sections.push(`- **Overall Score**: ${result.analysis.overall_score}/100`);
        sections.push(`- **Performance**: ${result.analysis.performance_score}/100`);
        sections.push(`- **Security**: ${result.analysis.security_score}/100`);
        sections.push('');

        // Issues
        if (result.analysis.issues_found.length > 0) {
          sections.push('## Issues Identified');
          result.analysis.issues_found.forEach((issue, index) => {
            const severityEmoji = {
              critical: '🔴',
              high: '🟡',
              medium: '🟠',
              low: '🟢'
            }[issue.severity];
            
            sections.push(`### ${severityEmoji} ${issue.type.replace('_', ' ').toUpperCase()}`);
            sections.push(`**Severity**: ${issue.severity.toUpperCase()}`);
            sections.push(`**Description**: ${issue.description}`);
            sections.push(`**Suggestion**: ${issue.suggestion}`);
            sections.push('');
          });
        }

        // Index Suggestions
        if (result.index_suggestions.length > 0) {
          sections.push('## Index Recommendations');
          result.index_suggestions.forEach((suggestion, index) => {
            sections.push(`### ${index + 1}. ${suggestion.table}`);
            sections.push(`**Type**: ${suggestion.type.toUpperCase()}`);
            sections.push(`**Columns**: ${suggestion.columns.join(', ')}`);
            sections.push(`**Rationale**: ${suggestion.rationale}`);
            sections.push('```sql');
            sections.push(suggestion.create_statement);
            sections.push('```');
            sections.push('');
          });
        }

        // Execution Plan
        if (result.explain_plan) {
          sections.push('## Execution Plan Analysis');
          sections.push(`**Estimated Cost**: ${result.explain_plan.cost_estimate}`);
          sections.push(`**Estimated Rows**: ${result.explain_plan.rows_estimate}`);
          sections.push('');
          sections.push('```');
          sections.push(result.explain_plan.execution_plan);
          sections.push('```');
          
          if (result.explain_plan.warnings.length > 0) {
            sections.push('');
            sections.push('**Warnings**:');
            result.explain_plan.warnings.forEach(warning => {
              sections.push(`- ${warning}`);
            });
          }
          sections.push('');
        }

        // Best Practices
        if (result.best_practices.length > 0) {
          sections.push('## Best Practices');
          result.best_practices.forEach(practice => {
            const impactEmoji = {
              high: '🔥',
              medium: '⚡',
              low: '💡'
            }[practice.impact];
            
            sections.push(`### ${impactEmoji} ${practice.category}`);
            sections.push(`**Impact**: ${practice.impact.toUpperCase()}`);
            sections.push(`**Recommendation**: ${practice.recommendation}`);
            sections.push('');
          });
        }

        // Database-specific tips
        if (result.database_specific_tips.length > 0) {
          sections.push(`## ${config.databaseType?.toUpperCase()} Specific Tips`);
          result.database_specific_tips.forEach(tip => {
            sections.push(`- ${tip}`);
          });
        }
        break;
    }

    return sections.join('\n');
  }, [result, error, config.outputFormat, config.databaseType]);

  const downloadOptions = useMemo(() => {
    if (!result) return [];

    const options = [];

    if (result.optimized_query) {
      options.push({
        label: 'Download Optimized Query (.sql)',
        onClick: () => {
          const blob = new Blob([result.optimized_query!], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'optimized_query.sql';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }

    if (result.index_suggestions.length > 0) {
      options.push({
        label: 'Download Index Scripts (.sql)',
        onClick: () => {
          const indexScript = result.index_suggestions
            .map(suggestion => `-- ${suggestion.rationale}\n${suggestion.create_statement}`)
            .join('\n\n');
          const blob = new Blob([indexScript], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'index_suggestions.sql';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }

    options.push({
      label: 'Download Full Report (.md)',
      onClick: () => {
        const blob = new Blob([outputContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query_optimization_report.md';
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    return options;
  }, [result, outputContent]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 >
          Database Query Optimizer
        </h1>
        <p >
          Analyze and optimize SQL queries with performance suggestions, index recommendations, 
          and database-specific best practices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InputPanel
            input={input}
            onInputChange={setInput}
            placeholder="Enter your SQL query here..."
            language="sql"
            maxLength={10000}
          />
          
          <OptionsPanel
            options={options}
            config={config}
            onChange={(newConfig) => updateConfig('database-query-optimizer', newConfig)}
          />
        </div>

        <div>
          <OutputPanel
            output={outputContent}
            language="markdown"
            isLoading={isProcessing}
            downloadOptions={downloadOptions}
          />
        </div>
      </div>

      {result && (
        <div >
          <h3 >
            Query Analysis Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div >
              <div >Overall</div>
              <div className={`text-2xl font-bold ${getScoreColor(result.analysis.overall_score)}`}>
                {result.analysis.overall_score}/100
              </div>
            </div>
            <div >
              <div >Performance</div>
              <div className={`text-2xl font-bold ${getScoreColor(result.analysis.performance_score)}`}>
                {result.analysis.performance_score}/100
              </div>
            </div>
            <div >
              <div >Complexity</div>
              <div className={`text-2xl font-bold ${getScoreColor(result.analysis.complexity_score)}`}>
                {result.analysis.complexity_score}/100
              </div>
            </div>
            <div >
              <div >Maintainability</div>
              <div className={`text-2xl font-bold ${getScoreColor(result.analysis.maintainability_score)}`}>
                {result.analysis.maintainability_score}/100
              </div>
            </div>
            <div >
              <div >Security</div>
              <div className={`text-2xl font-bold ${getScoreColor(result.analysis.security_score)}`}>
                {result.analysis.security_score}/100
              </div>
            </div>
          </div>

          {result.analysis.issues_found.length > 0 && (
            <div className="mb-6">
              <h4 >
                Issues Found ({result.analysis.issues_found.length})
              </h4>
              <div className="space-y-2">
                {result.analysis.issues_found.slice(0, 3).map((issue, index) => {
                  const severityColors = {
                    critical: 'bg-red-100/20 text-red-800',
                    high: 'bg-orange-100/20 text-orange-800',
                    medium: 'bg-yellow-100/20 text-yellow-800',
                    low: 'bg-green-100/20 text-green-800'
                  };

                  return (
                    <div
                      key={index}
                      
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${severityColors[issue.severity]}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <span >
                            {issue.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div >
                          {issue.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.index_suggestions.length > 0 && (
            <div>
              <h4 >
                Index Suggestions ({result.index_suggestions.length})
              </h4>
              <div className="space-y-2">
                {result.index_suggestions.slice(0, 3).map((suggestion, index) => (
                  <div
                    key={index}
                    
                  >
                    <div>
                      <div >
                        {suggestion.table} ({suggestion.type.toUpperCase()})
                      </div>
                      <div >
                        Columns: {suggestion.columns.join(', ')}
                      </div>
                    </div>
                    <div >
                      {suggestion.expected_improvement}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}