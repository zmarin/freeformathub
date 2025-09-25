import { useState, useMemo, useCallback, useRef } from 'react';
import {
  processCliCommandsReference,
  type CLICommandsReferenceInput,
  type CLICommandsReferenceOptions,
  type CLICommand,
  CLI_COMMANDS_DATABASE
} from '../../../tools/development/cli-commands-reference';
import { InputPanel } from '../../ui/InputPanel';
import { OutputPanel } from '../../ui/OutputPanel';
import { OptionsPanel } from '../../ui/OptionsPanel';

interface FilterCounts {
  [key: string]: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  linux: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200 border border-green-200 dark:border-green-500/40',
  macos: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200 border border-blue-200 dark:border-blue-500/40',
  windows: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200 border border-purple-200 dark:border-purple-500/40',
  powershell: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/40',
  docker: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-500/40',
  git: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200 border border-orange-200 dark:border-orange-500/40'
};

const RISK_COLORS: Record<string, string> = {
  safe: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
  caution: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200',
  dangerous: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
};

const RISK_ICONS: Record<string, string> = {
  safe: '✅',
  caution: '⚠️',
  dangerous: '🚨'
};

export default function CliCommandsReference({ className = '' }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platform, setPlatform] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [showExamples, setShowExamples] = useState(true);
  const [showFlags, setShowFlags] = useState(true);
  const [expandedCommands, setExpandedCommands] = useState<Set<string>>(new Set());
  const resultsRef = useRef<HTMLDivElement>(null);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: {
      platforms: FilterCounts;
      categories: FilterCounts;
      riskLevels: FilterCounts;
    } = {
      platforms: { all: CLI_COMMANDS_DATABASE.length },
      categories: { all: CLI_COMMANDS_DATABASE.length },
      riskLevels: { all: CLI_COMMANDS_DATABASE.length }
    };

    CLI_COMMANDS_DATABASE.forEach(cmd => {
      counts.platforms[cmd.platform] = (counts.platforms[cmd.platform] || 0) + 1;
      counts.categories[cmd.category] = (counts.categories[cmd.category] || 0) + 1;
      counts.riskLevels[cmd.riskLevel] = (counts.riskLevels[cmd.riskLevel] || 0) + 1;
    });

    return counts;
  }, []);

  // Process and filter commands
  const { filteredCommands, searchStats } = useMemo(() => {
    const options: CLICommandsReferenceOptions = {
      searchQuery,
      platform: platform as any,
      category: category as any,
      riskLevel: riskLevel as any,
      showExamples,
      showFlags
    };

    const input: CLICommandsReferenceInput = { options };

    const result = processCliCommandsReference(input);
    return {
      filteredCommands: result.commands || [],
      searchStats: result.searchStats || { byPlatform: {}, byCategory: {}, byRiskLevel: {} }
    };
  }, [searchQuery, platform, category, riskLevel, showExamples, showFlags]);

  const toggleCommandExpansion = useCallback((commandId: string) => {
    setExpandedCommands(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(commandId)) {
        newExpanded.delete(commandId);
      } else {
        newExpanded.add(commandId);
      }
      return newExpanded;
    });
  }, []);

  const copyCommand = useCallback((command: string) => {
    navigator.clipboard.writeText(command);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setPlatform('all');
    setCategory('all');
    setRiskLevel('all');
    setExpandedCommands(new Set());
  }, []);

  const platformOptions = [
    { value: 'all', label: `All Platforms (${filterCounts.platforms.all})` },
    { value: 'linux', label: `Linux (${filterCounts.platforms.linux || 0})` },
    { value: 'macos', label: `macOS (${filterCounts.platforms.macos || 0})` },
    { value: 'windows', label: `Windows (${filterCounts.platforms.windows || 0})` },
    { value: 'powershell', label: `PowerShell (${filterCounts.platforms.powershell || 0})` },
    { value: 'docker', label: `Docker (${filterCounts.platforms.docker || 0})` },
    { value: 'git', label: `Git (${filterCounts.platforms.git || 0})` }
  ];

  const categoryOptions = [
    { value: 'all', label: `All Categories (${filterCounts.categories.all})` },
    { value: 'system', label: `System (${filterCounts.categories.system || 0})` },
    { value: 'files', label: `Files (${filterCounts.categories.files || 0})` },
    { value: 'processes', label: `Processes (${filterCounts.categories.processes || 0})` },
    { value: 'networking', label: `Networking (${filterCounts.categories.networking || 0})` },
    { value: 'development', label: `Development (${filterCounts.categories.development || 0})` },
    { value: 'security', label: `Security (${filterCounts.categories.security || 0})` }
  ];

  const riskOptions = [
    { value: 'all', label: `All Risk Levels (${filterCounts.riskLevels.all})` },
    { value: 'safe', label: `Safe (${filterCounts.riskLevels.safe || 0})` },
    { value: 'caution', label: `Caution (${filterCounts.riskLevels.caution || 0})` },
    { value: 'dangerous', label: `Dangerous (${filterCounts.riskLevels.dangerous || 0})` }
  ];

  return (
    <div className={`cli-commands-reference-tool ${className}`}>
      {/* Search and Filters */}
      <div className="grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-lg)',
        gap: 'var(--space-lg)'
      }}>
        <InputPanel
          title="Search CLI Commands"
          subtitle="Explore 90+ curated commands for Linux, macOS, Windows, PowerShell, Docker, and Git"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Search Commands
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., file permissions, docker container, git commit..."
                className="form-input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Search by command name, description, examples, or tags
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="form-select w-full"
                >
                  {platformOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select w-full"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="form-select w-full"
                >
                  {riskOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showExamples}
                  onChange={(e) => setShowExamples(e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm">Show Examples</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showFlags}
                  onChange={(e) => setShowFlags(e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm">Show Flags</span>
              </label>

              <button
                onClick={clearFilters}
                className="btn btn-outline btn-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </InputPanel>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="p-6 space-y-6">
        {/* Results Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-500/40">
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              {filteredCommands.length} commands found
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Filtered from {CLI_COMMANDS_DATABASE.length} total commands
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(searchStats.byPlatform).map(([platform, count]) => (
              <span
                key={platform}
                className={`px-2 py-1 rounded-full ${PLATFORM_COLORS[platform] || 'bg-gray-100 text-gray-800'}`}
              >
                {platform}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Command Cards */}
        {filteredCommands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No commands match your search criteria. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredCommands.map((command: CLICommand) => {
              const isExpanded = expandedCommands.has(command.id);

              return (
                <div
                  key={command.id}
                  className="card p-6 hover:shadow-md transition-shadow"
                >
                  {/* Command Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => copyCommand(command.command)}
                          className="text-lg font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded border hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="Click to copy command"
                        >
                          {command.command}
                        </button>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PLATFORM_COLORS[command.platform]}`}>
                          {command.platform}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_COLORS[command.riskLevel]}`}>
                          {RISK_ICONS[command.riskLevel]} {command.riskLevel}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">
                        {command.description}
                      </p>
                      <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        <strong>Syntax:</strong> {command.syntax}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleCommandExpansion(command.id)}
                      className="btn btn-outline btn-sm"
                    >
                      {isExpanded ? 'Less' : 'More'}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-6 border-t pt-6">
                      {/* Examples */}
                      {showExamples && command.examples.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            📋 Examples
                          </h4>
                          <div className="space-y-3">
                            {command.examples.map((example, idx) => (
                              <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                                    {example.command}
                                  </code>
                                  <button
                                    onClick={() => copyCommand(example.command)}
                                    className="btn btn-outline btn-xs"
                                    title="Copy command"
                                  >
                                    Copy
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {example.description}
                                </p>
                                {example.output && (
                                  <pre className="text-xs bg-black text-green-400 p-3 rounded mt-2 overflow-x-auto">
                                    {example.output}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Flags */}
                      {showFlags && command.flags.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            🏃 Flags & Options
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {command.flags.map((flag, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                <code className="text-sm font-mono text-purple-600 dark:text-purple-400 flex-shrink-0">
                                  {flag.flag}
                                </code>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {flag.description}
                                  </p>
                                  {flag.example && (
                                    <code className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                                      {flag.example}
                                    </code>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {command.notes && command.notes.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            💡 Notes
                          </h4>
                          <ul className="space-y-2">
                            {command.notes.map((note, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span className="text-yellow-500 mt-0.5">•</span>
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related Commands */}
                      {command.relatedCommands && command.relatedCommands.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            🔗 Related Commands
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {command.relatedCommands.map((relatedCmd, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSearchQuery(relatedCmd)}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                {relatedCmd}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {command.tags.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            🏷️ Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {command.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}