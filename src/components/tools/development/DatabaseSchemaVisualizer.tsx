import { useEffect, useMemo, useRef, useState } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { useToolStore } from '../../../lib/store';
import type { ToolConfig } from '../../../types';
import {
  processDatabaseSchemaVisualizer,
  type DatabaseSchemaConfig,
  type ToolResult,
} from '../../../tools/development/database-schema-visualizer';

const TOOL_ID = 'database-schema-visualizer';

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
  normalizationCheck: true,
};

type VisualizationOption = {
  key: keyof DatabaseSchemaConfig;
  label: string;
  type: 'boolean' | 'select';
  default: DatabaseSchemaConfig[keyof DatabaseSchemaConfig];
  options?: Array<{ value: string; label: string }>;
  description?: string;
  showWhen?: (config: ToolConfig) => boolean;
};

const OPTION_DEFINITIONS: VisualizationOption[] = [
  {
    key: 'inputFormat',
    label: 'Input Format',
    type: 'select',
    default: DEFAULT_CONFIG.inputFormat,
    options: [
      { value: 'sql', label: 'SQL DDL' },
      { value: 'json', label: 'JSON Schema' },
      { value: 'yaml', label: 'YAML Schema' },
      { value: 'xml', label: 'XML Schema' },
      { value: 'prisma', label: 'Prisma Schema' },
      { value: 'sequelize', label: 'Sequelize Models' },
    ],
    description: 'Source format of the schema definition you paste in the editor.',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select',
    default: DEFAULT_CONFIG.outputFormat,
    options: [
      { value: 'mermaid', label: 'Mermaid Diagram' },
      { value: 'plantuml', label: 'PlantUML' },
      { value: 'graphviz', label: 'Graphviz DOT' },
      { value: 'json', label: 'JSON Schema Data' },
      { value: 'text', label: 'Rich Text Summary' },
    ],
    description: 'Choose how you want to consume the generated visualization.',
  },
  {
    key: 'diagramType',
    label: 'Diagram Focus',
    type: 'select',
    default: DEFAULT_CONFIG.diagramType,
    options: [
      { value: 'erd', label: 'Entity Relationship Diagram' },
      { value: 'schema', label: 'Schema Overview' },
      { value: 'relationships', label: 'Relationships Only' },
      { value: 'normalized', label: 'Normalization View' },
    ],
    description: 'Highlight table structure, relationships, or normalization insights.',
  },
  {
    key: 'showDataTypes',
    label: 'Show Column Data Types',
    type: 'boolean',
    default: DEFAULT_CONFIG.showDataTypes,
    description: 'Display column types alongside column names in diagram output.',
  },
  {
    key: 'showConstraints',
    label: 'Show Constraints',
    type: 'boolean',
    default: DEFAULT_CONFIG.showConstraints,
    description: 'Include primary keys, unique constraints, and checks.',
  },
  {
    key: 'showIndexes',
    label: 'Show Indexes',
    type: 'boolean',
    default: DEFAULT_CONFIG.showIndexes,
    description: 'List index definitions and coverage for each table.',
  },
  {
    key: 'showForeignKeys',
    label: 'Show Foreign Keys',
    type: 'boolean',
    default: DEFAULT_CONFIG.showForeignKeys,
    description: 'Display relationships discovered from foreign key references.',
  },
  {
    key: 'showCardinality',
    label: 'Show Relationship Cardinality',
    type: 'boolean',
    default: DEFAULT_CONFIG.showCardinality,
    description: 'Annotate links with one-to-one, one-to-many, or many-to-many markers.',
    showWhen: (config) => config.showForeignKeys !== false,
  },
  {
    key: 'includeMetadata',
    label: 'Include Metadata',
    type: 'boolean',
    default: DEFAULT_CONFIG.includeMetadata,
    description: 'Add engine, charset, and other table metadata to the summary.',
  },
  {
    key: 'groupBySchema',
    label: 'Group By Schema',
    type: 'boolean',
    default: DEFAULT_CONFIG.groupBySchema,
    description: 'Organize tables by schema names when multiple schemas are present.',
  },
  {
    key: 'includeSampleData',
    label: 'Include Sample Data',
    type: 'boolean',
    default: DEFAULT_CONFIG.includeSampleData,
    description: 'Generate illustrative sample records when available.',
  },
  {
    key: 'optimizationSuggestions',
    label: 'Optimization Suggestions',
    type: 'boolean',
    default: DEFAULT_CONFIG.optimizationSuggestions,
    description: 'List recommended changes for indexes, keys, and structure.',
  },
  {
    key: 'securityAnalysis',
    label: 'Security Analysis',
    type: 'boolean',
    default: DEFAULT_CONFIG.securityAnalysis,
    description: 'Highlight security vulnerabilities like missing encryption or access controls.',
  },
  {
    key: 'performanceAnalysis',
    label: 'Performance Analysis',
    type: 'boolean',
    default: DEFAULT_CONFIG.performanceAnalysis,
    description: 'Identify missing indexes and other performance bottlenecks.',
  },
  {
    key: 'normalizationCheck',
    label: 'Normalization Check',
    type: 'boolean',
    default: DEFAULT_CONFIG.normalizationCheck,
    description: 'Evaluate normalization level and detect violations.',
  },
];

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

const OUTPUT_EXTENSIONS: Record<DatabaseSchemaConfig['outputFormat'], string> = {
  mermaid: 'mmd',
  plantuml: 'puml',
  graphviz: 'dot',
  json: 'json',
  text: 'txt',
};

const OUTPUT_SYNTAX_LABELS: Record<DatabaseSchemaConfig['outputFormat'], string> = {
  mermaid: 'Mermaid ER diagram',
  plantuml: 'PlantUML diagram',
  graphviz: 'Graphviz DOT',
  json: 'JSON document',
  text: 'Rich text summary',
};

function getScoreColor(score?: number) {
  if (score === undefined || Number.isNaN(score)) {
    return 'text-gray-500';
  }
  if (score >= 80) {
    return 'text-green-600';
  }
  if (score >= 60) {
    return 'text-yellow-600';
  }
  return 'text-red-600';
}

export function DatabaseSchemaVisualizer() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [config, setConfig] = useState<DatabaseSchemaConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastSnapshotRef = useRef<string>('');

  const { setCurrentTool, addToHistory } = useToolStore();

  useEffect(() => {
    setCurrentTool(TOOL_ID);
    return () => setCurrentTool(null);
  }, [setCurrentTool]);

  useEffect(() => {
    let cancelled = false;

    if (!input.trim()) {
      setResult(null);
      setError(null);
      setIsProcessing(false);
      return () => {
        cancelled = true;
      };
    }

    setIsProcessing(true);
    setError(null);

    const timer = window.setTimeout(() => {
      processDatabaseSchemaVisualizer(input, config)
        .then((response) => {
          if (cancelled) return;

          if (response.success && response.output) {
            setResult(response);
            setError(null);

            const snapshot = JSON.stringify({
              input: input.trim(),
              config,
              output: response.output,
            });

            if (snapshot !== lastSnapshotRef.current) {
              addToHistory({
                toolId: TOOL_ID,
                input,
                output: response.output,
                config,
                timestamp: Date.now(),
              });
              lastSnapshotRef.current = snapshot;
            }
          } else {
            setResult(null);
            setError(response.error ?? 'Unable to visualize the provided schema.');
          }
        })
        .catch((visualizationError) => {
          if (cancelled) return;
          const message =
            visualizationError instanceof Error
              ? visualizationError.message
              : 'An unexpected error occurred while visualizing the schema.';
          setResult(null);
          setError(message);
        })
        .finally(() => {
          if (!cancelled) {
            setIsProcessing(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input, config, addToHistory]);

  const handleOptionsChange = (nextConfig: ToolConfig) => {
    const merged = { ...DEFAULT_CONFIG, ...nextConfig } as DatabaseSchemaConfig;
    setConfig(merged);
  };

  const schema = result?.schema as any;
  const metadata = schema?.metadata;
  const analysis = schema?.analysis;
  const statistics = analysis?.statistics;

  const dataTypeDistribution = useMemo(() => {
    if (!statistics?.dataTypeDistribution) return [] as Array<[string, number]>;
    return Object.entries(statistics.dataTypeDistribution)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 5);
  }, [statistics]);

  const normalizationIssues = analysis?.normalization?.violations ?? [];
  const missingIndexes = analysis?.performance?.missingIndexes ?? [];
  const securityIssues = analysis?.security?.vulnerabilities ?? [];
  const optimizationSuggestions = analysis?.optimization ?? [];
  const warnings = result?.warnings ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="Database Schema"
          value={input}
          onChange={setInput}
          placeholder="Paste SQL DDL, JSON Schema, Prisma schema, or Sequelize models"
          description="The visualizer will parse the schema, build an ERD, and surface performance, security, and normalization insights."
          rows={18}
        />

        <div >
          <h3 >Quick Tips</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Supports SQL DDL, JSON, YAML, Prisma, and Sequelize schema definitions.</li>
            <li>Toggle diagram options to focus on structure, constraints, or relationships.</li>
            <li>Switch to JSON or text output for programmatic analysis or documentation.</li>
          </ul>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <OutputPanel
          label="Schema Visualization"
          value={result?.output ?? ''}
          error={error ?? undefined}
          isLoading={isProcessing}
          syntax={OUTPUT_SYNTAX_LABELS[config.outputFormat]}
          downloadFilename={`schema-visualization.${OUTPUT_EXTENSIONS[config.outputFormat]}`}
          showLineNumbers={config.outputFormat !== 'mermaid'}
        />

        {warnings.length > 0 && (
          <div >
            <h4 >Warnings</h4>
            <ul >
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="lg:col-span-3 space-y-6">
        <OptionsPanel
          options={OPTION_DEFINITIONS}
          config={config}
          onChange={handleOptionsChange}
        />

        {schema && (
          <div >
            <div>
              <h3 >Schema Overview</h3>
              <div >
                <div className="flex justify-between">
                  <span>Name</span>
                  <span >{metadata?.name ?? 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Engine</span>
                  <span >{metadata?.engine ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tables</span>
                  <span >{schema.tables?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Relationships</span>
                  <span >{schema.relationships?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Constraints</span>
                  <span >{schema.constraints?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Indexes</span>
                  <span >{schema.indexes?.length ?? 0}</span>
                </div>
              </div>
            </div>

            {analysis && (
              <div className="space-y-4">
                <div>
                  <h4 >Health Scores</h4>
                  <div >
                    <div className="flex items-center justify-between">
                      <span>Normalization</span>
                      <span className={`font-medium ${getScoreColor(analysis.normalization?.score)}`}>
                        {analysis.normalization?.level ?? 'N/A'}
                        {analysis.normalization?.score !== undefined && ` (${analysis.normalization.score}%)`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Performance</span>
                      <span className={`font-medium ${getScoreColor(analysis.performance?.score)}`}>
                        {analysis.performance?.score !== undefined ? `${analysis.performance.score}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Security</span>
                      <span className={`font-medium ${getScoreColor(analysis.security?.score)}`}>
                        {analysis.security?.score !== undefined ? `${analysis.security.score}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {statistics && (
                  <div className="space-y-2">
                    <h4 >Key Stats</h4>
                    <div >
                      <div className="flex justify-between">
                        <span>Avg Columns / Table</span>
                        <span >
                          {statistics.avgColumnsPerTable?.toFixed?.(1) ?? '0.0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Relationships</span>
                        <span >
                          {statistics.relationshipCount ?? schema.relationships?.length ?? 0}
                        </span>
                      </div>
                    </div>

                    {dataTypeDistribution.length > 0 && (
                      <div>
                        <h5 >
                          Top Data Types
                        </h5>
                        <ul >
                          {dataTypeDistribution.map(([type, count]) => (
                            <li key={type} className="flex justify-between">
                              <span>{type}</span>
                              <span >{count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {normalizationIssues.length > 0 && (
                  <div>
                    <h4 >Normalization Issues</h4>
                    <ul >
                      {normalizationIssues.slice(0, 3).map((issue: any, index: number) => (
                        <li key={index} >
                          <div >{issue.table}</div>
                          <div >
                            {issue.type?.replace(/-/g, ' ') ?? 'Violation'}
                          </div>
                          <p className="mt-1 text-xs">{issue.description}</p>
                          {issue.suggestion && (
                            <p >
                              Suggestion: {issue.suggestion}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {missingIndexes.length > 0 && (
                  <div>
                    <h4 >Missing Indexes</h4>
                    <ul >
                      {missingIndexes.slice(0, 3).map((item: any, index: number) => (
                        <li key={index} >
                          <div >
                            <span>{item.table}</span>
                            <span >{item.estimatedImpact}</span>
                          </div>
                          <p className="mt-1 text-xs">Columns: {item.columns?.join(', ')}</p>
                          <p >{item.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {securityIssues.length > 0 && (
                  <div>
                    <h4 >Security Concerns</h4>
                    <ul >
                      {securityIssues.slice(0, 3).map((issue: any, index: number) => (
                        <li key={index} >
                          <div >{issue.title}</div>
                          <p className="mt-1 text-xs">{issue.description}</p>
                          {issue.recommendation && (
                            <p >
                              Recommendation: {issue.recommendation}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {optimizationSuggestions.length > 0 && (
                  <div>
                    <h4 >Optimization Ideas</h4>
                    <ul >
                      {optimizationSuggestions.slice(0, 3).map((suggestion: any, index: number) => (
                        <li key={index} >
                          <div >
                            <span>{suggestion.table}</span>
                            <span >{suggestion.priority}</span>
                          </div>
                          <p className="mt-1 text-xs">{suggestion.description}</p>
                          {suggestion.implementation && (
                            <p >
                              How: {suggestion.implementation}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
