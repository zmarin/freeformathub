import React, { useState, useMemo } from 'react';
import { Search, Copy, ExternalLink, AlertTriangle, Shield, AlertCircle, Terminal, Filter, X } from 'lucide-react';
import { AI_CLI_COMMANDS, processAICliCommands, type AICliCommand } from '../../../tools/development/ai-cli-assistant';

const AiCliAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [expandedCommands, setExpandedCommands] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { results, totalCount } = useMemo(() => {
    return processAICliCommands(query, {
      tool: selectedTool || undefined,
      category: selectedCategory || undefined,
      riskLevel: selectedRiskLevel || undefined
    });
  }, [query, selectedTool, selectedCategory, selectedRiskLevel]);

  const tools = useMemo(() => {
    return [...new Set(AI_CLI_COMMANDS.map(cmd => cmd.tool))].sort();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(AI_CLI_COMMANDS.map(cmd => cmd.category))].sort();
  }, []);

  const riskLevels = ['safe', 'caution', 'dangerous'];

  const toggleExpanded = (commandId: string) => {
    const newExpanded = new Set(expandedCommands);
    if (newExpanded.has(commandId)) {
      newExpanded.delete(commandId);
    } else {
      newExpanded.add(commandId);
    }
    setExpandedCommands(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const clearFilters = () => {
    setSelectedTool('');
    setSelectedCategory('');
    setSelectedRiskLevel('');
    setQuery('');
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <Shield className="w-4 h-4 text-green-500" />;
      case 'caution':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'dangerous':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'border-green-200 bg-green-50';
      case 'caution':
        return 'border-yellow-200 bg-yellow-50';
      case 'dangerous':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getToolColor = (tool: string) => {
    const colors: Record<string, string> = {
      claude: 'bg-purple-100 text-purple-800',
      ollama: 'bg-blue-100 text-blue-800',
      openai: 'bg-green-100 text-green-800',
      gemini: 'bg-orange-100 text-orange-800',
      cursor: 'bg-indigo-100 text-indigo-800',
      copilot: 'bg-gray-100 text-gray-800',
      aider: 'bg-pink-100 text-pink-800'
    };
    return colors[tool] || 'bg-gray-100 text-gray-800';
  };

  const activeFiltersCount = [selectedTool, selectedCategory, selectedRiskLevel].filter(Boolean).length;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AI CLI commands, tools, or descriptions..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}

          <div className="text-sm text-gray-600">
            {totalCount} command{totalCount !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tool</label>
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All tools</option>
                  {tools.map(tool => (
                    <option key={tool} value={tool}>
                      {tool.charAt(0).toUpperCase() + tool.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={selectedRiskLevel}
                  onChange={(e) => setSelectedRiskLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All risk levels</option>
                  {riskLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Terminal className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No commands found</p>
            <p>Try adjusting your search terms or filters</p>
          </div>
        ) : (
          results.map((command) => {
            const isExpanded = expandedCommands.has(command.id);
            return (
              <div
                key={command.id}
                className={`border rounded-lg transition-all ${getRiskColor(command.riskLevel)}`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-opacity-50"
                  onClick={() => toggleExpanded(command.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getToolColor(command.tool)}`}>
                          {command.tool}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {command.category}
                        </span>
                        <div className="flex items-center gap-1">
                          {getRiskIcon(command.riskLevel)}
                          <span className="text-xs text-gray-600">{command.riskLevel}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-blue-600">
                          {command.command}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(command.command);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Copy command"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-gray-700">{command.description}</p>
                    </div>

                    <div className="ml-4 text-gray-400">
                      {isExpanded ? '−' : '+'}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-white bg-opacity-50">
                    <div className="space-y-4">
                      {/* Syntax */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Syntax</h4>
                        <code className="block text-sm font-mono bg-gray-100 p-2 rounded">
                          {command.syntax}
                        </code>
                      </div>

                      {/* Examples */}
                      {command.examples.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Examples</h4>
                          <div className="space-y-2">
                            {command.examples.map((example, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm font-mono text-green-600">
                                    {example.command}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(example.command)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    title="Copy example"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600">{example.description}</p>
                                {example.output && (
                                  <pre className="text-xs text-gray-500 mt-2 overflow-x-auto">
                                    {example.output}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Flags */}
                      {command.flags.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Flags & Options</h4>
                          <div className="space-y-2">
                            {command.flags.map((flag, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <code className="text-sm font-mono bg-blue-50 text-blue-600 px-2 py-1 rounded flex-shrink-0">
                                  {flag.flag}
                                </code>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-700">{flag.description}</p>
                                  {flag.example && (
                                    <code className="text-xs text-gray-500 block mt-1">
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
                          <h4 className="font-medium text-gray-900 mb-2">Important Notes</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {command.notes.map((note, idx) => (
                              <li key={idx} className="text-sm text-gray-700">{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related Commands */}
                      {command.relatedCommands && command.relatedCommands.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Related Commands</h4>
                          <div className="flex flex-wrap gap-2">
                            {command.relatedCommands.map((related, idx) => (
                              <code key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {related}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Official Documentation */}
                      {command.officialDocs && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Documentation</h4>
                          <a
                            href={command.officialDocs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Official Documentation
                          </a>
                        </div>
                      )}

                      {/* Tags */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {command.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AiCliAssistant;