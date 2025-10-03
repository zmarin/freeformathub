import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import {
  TOOL_CATEGORIES,
  getToolsByCategory
} from '../../lib/tools/registry';
import { LocalStorageManager } from '../../lib/storage';

// Ensure the tool registry is populated on both server and client before we read from it
import '../../lib/tools/index';

interface SidebarTool {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  keywords: string[];
}

interface SidebarSubcategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  tools: SidebarTool[];
}

interface SidebarCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalToolCount: number;
  subcategories: SidebarSubcategory[];
  uncategorizedTools: SidebarTool[];
}

interface ToolSidebarProps {
  currentPath?: string;
}

const SEARCH_DELAY_MS = 250;

function buildSidebarData(): SidebarCategory[] {
  return TOOL_CATEGORIES.map(category => {
    const tools = getToolsByCategory(category.id)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    const subcategoryMap = new Map<string, SidebarTool[]>();
    const uncategorized: SidebarTool[] = [];

    tools.forEach(tool => {
      const sidebarTool: SidebarTool = {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        url: `/${tool.category.id}/${tool.slug}`,
        description: tool.description,
        keywords: tool.keywords || []
      };

      if (tool.subcategory) {
        const existing = subcategoryMap.get(tool.subcategory.id) || [];
        existing.push(sidebarTool);
        subcategoryMap.set(tool.subcategory.id, existing);
      } else {
        uncategorized.push(sidebarTool);
      }
    });

    const subcategories: SidebarSubcategory[] = (category.subcategories || []).map(subcategory => {
      const subcategoryTools = (subcategoryMap.get(subcategory.id) || [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        id: subcategory.id,
        name: subcategory.name,
        icon: subcategory.icon,
        description: subcategory.description,
        tools: subcategoryTools
      };
    });

    const totalToolCount = tools.length;

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      totalToolCount,
      subcategories,
      uncategorizedTools: uncategorized
    };
  });
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function toolMatchesQuery(tool: SidebarTool, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    tool.name,
    tool.slug,
    tool.description,
    ...(tool.keywords || [])
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

const ToolSidebar: React.FC<ToolSidebarProps> = ({ currentPath = '/' }) => {
  const sidebarData = useMemo(buildSidebarData, []);
  const storage = useMemo(() => LocalStorageManager.getInstance(), []);

  const categoryIds = useMemo(() => new Set(sidebarData.map(category => category.id)), [sidebarData]);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [favoriteToolIds, setFavoriteToolIds] = useState<string[]>([]);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const lastTrackedToolRef = useRef<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(normalizeQuery(query));
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(handle);
  }, [query]);

  const pathSegments = useMemo(
    () => currentPath.split('/').filter(Boolean),
    [currentPath]
  );

  const activeCategoryId = useMemo(() => {
    const [firstSegment] = pathSegments;
    if (!firstSegment) {
      return undefined;
    }

    if (categoryIds.has(firstSegment)) {
      return firstSegment;
    }

    return undefined;
  }, [categoryIds, pathSegments]);

  const activeToolSlug = useMemo(() => {
    if (!activeCategoryId) {
      return undefined;
    }

    return pathSegments[1];
  }, [activeCategoryId, pathSegments]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const preferences = storage.getPreferences();
    setFavoriteToolIds(preferences.favoriteTools || []);
    setRecentToolIds(preferences.recentTools || []);

    const storedExpanded = new Set(storage.getSidebarExpandedCategories());
    if (storedExpanded.size === 0) {
      if (activeCategoryId) {
        storedExpanded.add(activeCategoryId);
      } else if (sidebarData[0]) {
        storedExpanded.add(sidebarData[0].id);
      }
    }

    setExpandedCategories(new Set(storedExpanded));
    setInitialized(true);
  }, [storage, sidebarData]);

  useEffect(() => {
    if (!activeCategoryId) {
      return;
    }

    setExpandedCategories(previous => {
      if (previous.has(activeCategoryId)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(activeCategoryId);
      return next;
    });
  }, [activeCategoryId]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    storage.saveSidebarExpandedCategories(Array.from(expandedCategories));
  }, [expandedCategories, initialized, storage]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = debouncedQuery;

    return sidebarData
      .map(category => {
        const matchesCategory = normalizedQuery
          ? category.name.toLowerCase().includes(normalizedQuery) ||
            category.description.toLowerCase().includes(normalizedQuery)
          : true;

        const filteredSubcategories = category.subcategories
          .map(subcategory => {
            const matchesSubcategory = normalizedQuery
              ? subcategory.name.toLowerCase().includes(normalizedQuery) ||
                subcategory.description.toLowerCase().includes(normalizedQuery)
              : true;

            let toolsToShow = subcategory.tools;

            if (normalizedQuery) {
              const matchedTools = subcategory.tools.filter(tool => toolMatchesQuery(tool, normalizedQuery));

              if (matchedTools.length > 0) {
                toolsToShow = matchedTools;
              } else if (!matchesSubcategory) {
                toolsToShow = [];
              }
            }

            return {
              ...subcategory,
              tools: toolsToShow,
              hasMatches: matchesSubcategory || toolsToShow.length > 0
            };
          })
          .filter(subcategory => subcategory.hasMatches && subcategory.tools.length > 0);

        const filteredUncategorized = normalizedQuery
          ? category.uncategorizedTools.filter(tool => toolMatchesQuery(tool, normalizedQuery))
          : category.uncategorizedTools;

        const hasMatches = matchesCategory || filteredSubcategories.length > 0 || filteredUncategorized.length > 0;

        return {
          ...category,
          subcategories: filteredSubcategories,
          uncategorizedTools: filteredUncategorized,
          hasMatches
        };
      })
      .filter(category => category.hasMatches);
  }, [sidebarData, debouncedQuery]);

  const categoriesToRender = filteredCategories;

  const expandedWithSearch = useMemo(() => {
    if (!debouncedQuery) {
      return expandedCategories;
    }

    const autoExpanded = new Set(expandedCategories);
    categoriesToRender.forEach(category => autoExpanded.add(category.id));
    return autoExpanded;
  }, [categoriesToRender, debouncedQuery, expandedCategories]);

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories(previous => {
      const next = new Set(previous);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const recordRecentTool = useCallback((toolId: string) => {
    setRecentToolIds(previous => {
      if (previous[0] === toolId) {
        storage.markToolAsRecent(toolId);
        return previous;
      }

      const filtered = previous.filter(id => id !== toolId);
      const updated = [toolId, ...filtered].slice(0, 20);
      storage.markToolAsRecent(toolId);
      return updated;
    });
  }, [storage]);

  const handleToggleFavorite = useCallback((toolId: string) => {
    setFavoriteToolIds(previous => {
      const isFavorite = previous.includes(toolId);
      if (isFavorite) {
        storage.removeFromFavorites(toolId);
        return previous.filter(id => id !== toolId);
      }

      storage.addToFavorites(toolId);
      return [...previous, toolId];
    });
  }, [storage]);

  const toolIndex = useMemo(() => {
    const map = new Map<string, SidebarTool>();
    sidebarData.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.tools.forEach(tool => {
          map.set(tool.id, tool);
        });
      });
      category.uncategorizedTools.forEach(tool => {
        map.set(tool.id, tool);
      });
    });
    return map;
  }, [sidebarData]);

  const toolBySlug = useMemo(() => {
    const map = new Map<string, SidebarTool>();
    sidebarData.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.tools.forEach(tool => {
          map.set(tool.slug, tool);
        });
      });
      category.uncategorizedTools.forEach(tool => {
        map.set(tool.slug, tool);
      });
    });
    return map;
  }, [sidebarData]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!activeToolSlug) {
      return;
    }

    const tool = toolBySlug.get(activeToolSlug);
    if (!tool) {
      return;
    }

    if (lastTrackedToolRef.current === tool.id) {
      return;
    }

    lastTrackedToolRef.current = tool.id;
    recordRecentTool(tool.id);
  }, [activeToolSlug, initialized, recordRecentTool, toolBySlug]);

  const favoriteTools = useMemo(() => {
    const normalizedQuery = debouncedQuery;
    return favoriteToolIds
      .map(id => toolIndex.get(id))
      .filter((tool): tool is SidebarTool => Boolean(tool))
      .filter(tool => toolMatchesQuery(tool, normalizedQuery));
  }, [debouncedQuery, favoriteToolIds, toolIndex]);

  const recentTools = useMemo(() => {
    const normalizedQuery = debouncedQuery;
    return recentToolIds
      .map(id => toolIndex.get(id))
      .filter((tool): tool is SidebarTool => Boolean(tool))
      .filter(tool => toolMatchesQuery(tool, normalizedQuery));
  }, [debouncedQuery, recentToolIds, toolIndex]);

  const renderToolItem = useCallback((tool: SidebarTool) => {
    const isActiveTool = tool.slug === activeToolSlug;
    const isFavorite = favoriteToolIds.includes(tool.id);

    return (
      <li key={tool.id}>
        <div className="flex items-center justify-between gap-2">
          <a
            href={tool.url}
            className={`block flex-1 rounded-md px-2 py-1 text-left text-sm transition-colors ${
              isActiveTool
                ? 'bg-blue-500/10 text-blue-600'
                : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-secondary)] hover:text-[color:var(--color-text-primary)]'
            }`}
            onClick={() => recordRecentTool(tool.id)}
          >
            {tool.name}
          </a>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleToggleFavorite(tool.id);
            }}
            aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
            className={`h-6 w-6 rounded-md text-sm transition-colors ${
              isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-[color:var(--color-text-muted)] hover:text-blue-500'
            }`}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
      </li>
    );
  }, [activeToolSlug, favoriteToolIds, handleToggleFavorite, recordRecentTool]);

  if (sidebarData.length === 0) {
    return null;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="sticky top-24 z-10 bg-[var(--color-surface)] pb-2">
        <label className="sr-only" htmlFor="tool-sidebar-search">
          Search tools
        </label>
        <div className="relative">
          <input
            id="tool-sidebar-search"
            type="search"
            placeholder="Search tools"
            value={query}
            onChange={({ target }) => setQuery(target.value)}
            className="w-full rounded-lg border border-[color:var(--color-border-light)] bg-[color:var(--color-surface-secondary)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[color:var(--color-text-secondary)]">
            Ctrl K
          </span>
        </div>
      </div>

      <nav aria-label="Tool directory" className="grow overflow-y-auto pr-2">
        {favoriteTools.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              Favorites
            </h2>
            <ul className="flex flex-col gap-1">
              {favoriteTools.map(tool => renderToolItem(tool))}
            </ul>
          </section>
        )}

        {recentTools.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              Recently used
            </h2>
            <ul className="flex flex-col gap-1">
              {recentTools.slice(0, 10).map(tool => renderToolItem(tool))}
            </ul>
          </section>
        )}

        <ul className="flex flex-col gap-2">
          {categoriesToRender.map(category => {
            const isExpanded = expandedWithSearch.has(category.id);
            const isActiveCategory = category.id === activeCategoryId;

            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => handleToggleCategory(category.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    isActiveCategory
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-transparent bg-[color:var(--color-surface-secondary)] text-[color:var(--color-text-primary)] hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)]'
                  }`}
                  aria-expanded={isExpanded}
                >
                  <span className="flex items-center gap-2">
                    <Icon name={category.icon} className="h-4 w-4" size={16} />
                    <span className="font-medium">{category.name}</span>
                    <span className="rounded-full bg-[color:var(--color-surface)] px-2 py-0.5 text-xs text-[color:var(--color-text-secondary)]">
                      {category.totalToolCount}
                    </span>
                  </span>
                  <span aria-hidden="true" className="ml-2 text-xs text-[color:var(--color-text-secondary)]">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-2 border-l border-[color:var(--color-border-light)] pl-3">
                    {category.subcategories.map(subcategory => (
                      <div key={subcategory.id}>
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true">{subcategory.icon}</span>
                            {subcategory.name}
                          </span>
                          <span>{subcategory.tools.length}</span>
                        </div>
                        <ul className="mt-1 flex flex-col gap-1">
                          {subcategory.tools.map(tool => renderToolItem(tool))}
                        </ul>
                      </div>
                    ))}

                    {category.uncategorizedTools.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                          Other tools
                        </div>
                        <ul className="mt-1 flex flex-col gap-1">
                          {category.uncategorizedTools.map(tool => renderToolItem(tool))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}

          {categoriesToRender.length === 0 && (
            <li className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-secondary)] px-3 py-4 text-sm text-[color:var(--color-text-secondary)]">
              No tools matched your search. Try a different keyword.
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default ToolSidebar;
