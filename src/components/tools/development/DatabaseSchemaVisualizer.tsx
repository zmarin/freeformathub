import React, { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processDatabaseSchemaVisualizer } from '../../../tools/development/database-schema-visualizer';
import type { DatabaseSchemaConfig, ToolResult } from '../../../tools/development/database-schema-visualizer';

const DEFAULT_CONFIG: DatabaseSchemaConfig = {
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
  normalizationCheck: true
};

const SAMPLE_INPUT = `CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

CREATE TABLE profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_published (user_id, published),
  INDEX idx_published_at (published_at)
);`;

export function DatabaseSchemaVisualizer() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [config, setConfig] = useState<DatabaseSchemaConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ToolResult | null>(null);

  const processedResult = useMemo(() => {
    if (!input.trim()) {
      return { success: false, error: 'Please enter a database schema' };
    }

    return processDatabaseSchemaVisualizer(input, config);
  }, [input, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(processedResult);
    }, 300);

    return () => clearTimeout(timer);
  }, [processedResult]);

  const handleConfigChange = (key: keyof DatabaseSchemaConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const optionGroups = [
    {
      title: 'Input/Output Format',
      options: [
        {
          key: 'inputFormat' as const,
          label: 'Input Format',
          type: 'select' as const,
          value: config.inputFormat,
          options: [
            { value: 'sql', label: 'SQL DDL' },
            { value: 'json', label: 'JSON Schema' },
            { value: 'yaml', label: 'YAML Schema' },
            { value: 'xml', label: 'XML Schema' },
            { value: 'prisma', label: 'Prisma Schema' },
            { value: 'sequelize', label: 'Sequelize Model' }
          ]
        },
        {
          key: 'outputFormat' as const,
          label: 'Output Format',
          type: 'select' as const,
          value: config.outputFormat,
          options: [
            { value: 'mermaid', label: 'Mermaid Diagram' },
            { value: 'plantuml', label: 'PlantUML' },
            { value: 'graphviz', label: 'Graphviz DOT' },
            { value: 'json', label: 'JSON Schema' },
            { value: 'text', label: 'Text Description' }
          ]
        },
        {
          key: 'diagramType' as const,
          label: 'Diagram Type',
          type: 'select' as const,
          value: config.diagramType,
          options: [
            { value: 'erd', label: 'Entity Relationship Diagram' },
            { value: 'schema', label: 'Database Schema' },
            { value: 'relationships', label: 'Relationships Only' },
            { value: 'normalized', label: 'Normalized View' }
          ]
        }
      ]
    },
    {
      title: 'Display Options',
      options: [
        {
          key: 'showDataTypes' as const,
          label: 'Show Data Types',
          type: 'checkbox' as const,
          value: config.showDataTypes
        },
        {
          key: 'showConstraints' as const,
          label: 'Show Constraints',
          type: 'checkbox' as const,
          value: config.showConstraints
        },
        {
          key: 'showIndexes' as const,
          label: 'Show Indexes',
          type: 'checkbox' as const,
          value: config.showIndexes
        },
        {
          key: 'showForeignKeys' as const,
          label: 'Show Foreign Keys',
          type: 'checkbox' as const,
          value: config.showForeignKeys
        },
        {
          key: 'showCardinality' as const,
          label: 'Show Cardinality',
          type: 'checkbox' as const,
          value: config.showCardinality
        },
        {
          key: 'includeMetadata' as const,
          label: 'Include Metadata',
          type: 'checkbox' as const,
          value: config.includeMetadata
        },
        {
          key: 'groupBySchema' as const,
          label: 'Group by Schema',
          type: 'checkbox' as const,
          value: config.groupBySchema
        },
        {
          key: 'includeSampleData' as const,
          label: 'Include Sample Data',
          type: 'checkbox' as const,
          value: config.includeSampleData
        }
      ]
    },
    {
      title: 'Analysis Options',
      options: [
        {
          key: 'optimizationSuggestions' as const,
          label: 'Optimization Suggestions',
          type: 'checkbox' as const,
          value: config.optimizationSuggestions
        },
        {
          key: 'securityAnalysis' as const,
          label: 'Security Analysis',
          type: 'checkbox' as const,
          value: config.securityAnalysis
        },
        {
          key: 'performanceAnalysis' as const,
          label: 'Performance Analysis',
          type: 'checkbox' as const,
          value: config.performanceAnalysis
        },
        {
          key: 'normalizationCheck' as const,
          label: 'Normalization Check',
          type: 'checkbox' as const,
          value: config.normalizationCheck
        }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <InputPanel
          title="Database Schema"
          value={input}
          onChange={setInput}
          placeholder="Enter your database schema (SQL DDL, JSON, YAML, etc.)"
          language={config.inputFormat === 'sql' ? 'sql' : config.inputFormat === 'json' ? 'json' : 'yaml'}
          showLineNumbers
        />
      </div>

      <div className="lg:col-span-1">
        <OutputPanel
          title="Schema Visualization"
          value={result?.output || ''}
          language={config.outputFormat === 'json' ? 'json' : config.outputFormat === 'sql' ? 'sql' : 'text'}
          error={result?.error}
          showCopy
          showDownload
          filename={`schema-diagram.${config.outputFormat === 'mermaid' ? 'mmd' : 
                     config.outputFormat === 'plantuml' ? 'puml' : 
                     config.outputFormat === 'graphviz' ? 'dot' :
                     config.outputFormat === 'json' ? 'json' : 'txt'}`}
        />
        
        {result?.warnings && result.warnings.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <OptionsPanel
          title="Visualization Options"
          optionGroups={optionGroups}
          onChange={handleConfigChange}
        />

        {result?.schema && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Schema Summary</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Tables:</span>
                <span className="font-medium">{result.schema.tables.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Relationships:</span>
                <span className="font-medium">{result.schema.relationships.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Indexes:</span>
                <span className="font-medium">{result.schema.indexes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Constraints:</span>
                <span className="font-medium">{result.schema.constraints.length}</span>
              </div>
              {result.schema.views.length > 0 && (
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span className="font-medium">{result.schema.views.length}</span>
                </div>
              )}
              {result.schema.procedures.length > 0 && (
                <div className="flex justify-between">
                  <span>Procedures:</span>
                  <span className="font-medium">{result.schema.procedures.length}</span>
                </div>
              )}
            </div>

            {result.schema.analysis && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Analysis</h4>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Normalization:</span>
                    <span className={`font-medium ${
                      result.schema.analysis.normalizationLevel >= 3 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {result.schema.analysis.normalizationLevel}NF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance Score:</span>
                    <span className={`font-medium ${
                      result.schema.analysis.performanceScore >= 80 
                        ? 'text-green-600 dark:text-green-400' 
                        : result.schema.analysis.performanceScore >= 60
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {result.schema.analysis.performanceScore}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Issues:</span>
                    <span className={`font-medium ${
                      result.schema.analysis.securityIssues.length === 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {result.schema.analysis.securityIssues.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}