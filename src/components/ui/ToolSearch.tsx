import { useState, useEffect, useRef } from 'react';
import { searchClientTools, searchClientToolsLegacy, getAllClientTools, type ClientTool, type ClientSearchResult } from '../../lib/tools/client-registry';
import { highlightMatches } from '../../lib/search/search-utils';
const GA_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID || 'G-34Z7YVSEZ2';
// Analytics tracking - inline functions to avoid import issues
const trackSearch = (analytics: { searchTerm: string; results?: number }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      send_to: GA_ID,
      search_term: analytics.searchTerm,
      results_count: analytics.results
    });
  }
};

const trackSearchSelect = (analytics: { searchTerm: string; selectedTool?: any }) => {
  if (typeof window !== 'undefined' && window.gtag && analytics.selectedTool) {
    window.gtag('event', 'search_select', {
      send_to: GA_ID,
      search_term: analytics.searchTerm,
      content_type: 'tool',
      item_id: analytics.selectedTool.id,
      item_name: analytics.selectedTool.name,
      item_category: analytics.selectedTool.category
    });
  }
};

const trackNavigation = (from: string, to: string, method?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'navigation', {
      send_to: GA_ID,
      from_page: from,
      to_page: to,
      method: method || 'click'
    });
  }
};

interface ToolSearchProps {
  placeholder?: string;
  className?: string;
  size?: 'small' | 'large';
}

export default function ToolSearch({
  placeholder = "Search tools...",
  className = "",
  size = 'small'
}: ToolSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Get popular tools to show when no search query
  const popularToolsData = getAllClientTools().slice(0, 6);
  const popularTools: ClientSearchResult[] = popularToolsData.map(tool => ({
    tool,
    score: 50,
    matchType: 'exact' as const,
    matchedTerms: []
  }));

  useEffect(() => {
    const q = query.trim();

    // Clear any pending debounce
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!q) {
      // Empty query shows popular tools
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      setLoading(false);
      setResults(popularTools);
      setSelectedIndex(0);
      return;
    }

    // Immediate client-side search with minimal debounce for ultra-fast results
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        // Use client-side search first for instant results
        const clientResults = searchClientTools(q, 8);
        setResults(clientResults);
        setLoading(false);
        setSelectedIndex(0);

        // Optionally try API search as fallback/enhancement
        if (fetchAbortRef.current) fetchAbortRef.current.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;

        try {
          const res = await fetch(`/api/search.json?q=${encodeURIComponent(q)}&limit=8`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.results)) {
              // Map API results to ClientSearchResult shape
              const mapped: ClientSearchResult[] = data.results.map((t: any) => ({
                tool: {
                  id: t.id,
                  name: t.name,
                  slug: t.slug,
                  description: t.description,
                  keywords: t.keywords || [],
                  icon: t.icon,
                  category: { id: t.category.id, name: t.category.name, color: t.category.color }
                },
                score: t.score || 50,
                matchType: t.matchType || 'name' as const,
                matchedTerms: t.matchedTerms || []
              }));
              // Only update if we get different results
              if (mapped.length > 0) {
                setResults(mapped);
              }
            }
          }
        } catch (apiErr) {
          // API error is non-critical since we already have client results
          console.log('API search failed, using client results:', apiErr);
        }
      } catch (err) {
        // Fallback to legacy search if new search fails
        const fallback = searchClientToolsLegacy(q);
        const mappedFallback = fallback.slice(0, 8).map(tool => ({
          tool,
          score: 30,
          matchType: 'description' as const,
          matchedTerms: []
        }));
        setResults(mappedFallback);
        setLoading(false);
        setSelectedIndex(0);
      }
    }, 50); // Reduced from 200ms to 50ms for near-instant results

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': {
        if (!isOpen || results.length === 0) return;
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      }
      case 'ArrowUp': {
        if (!isOpen || results.length === 0) return;
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      }
      case 'Enter': {
        // Prefer navigating to highlighted tool; otherwise perform a full search
        e.preventDefault();
        const selected = results[selectedIndex];
        const q = query.trim();
        if (isOpen && selected) {
          // Track search selection analytics
          trackSearchSelect({
            searchTerm: q,
            results: results.length,
            selectedTool: {
              id: selected.tool.id,
              name: selected.tool.name,
              category: selected.tool.category.id,
              matchType: selected.matchType,
              matchScore: selected.score
            }
          });
          window.location.href = `/${selected.tool.category.id}/${selected.tool.slug}`;
        } else if (q) {
          // Track full search page navigation
          trackNavigation(window.location.pathname, `/search?q=${encodeURIComponent(q)}`, 'search');
          window.location.href = `/search?q=${encodeURIComponent(q)}`;
        }
        break;
      }
      case 'Escape': {
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      }
    }
  };


  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleToolClick = (result: ClientSearchResult) => {
    // Track tool selection analytics
    trackSearchSelect({
      searchTerm: query,
      results: results.length,
      selectedTool: {
        id: result.tool.id,
        name: result.tool.name,
        category: result.tool.category.id,
        matchType: result.matchType,
        matchScore: result.score
      }
    });
    window.location.href = `/${result.tool.category.id}/${result.tool.slug}`;
  };

  // Add search analytics when user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);

    // Track search analytics after a short delay to avoid too many events
    if (newQuery.trim().length >= 2) {
      setTimeout(() => {
        if (newQuery === query) { // Only track if user hasn't changed the query
          trackSearch({
            searchTerm: newQuery,
            results: results.length
          });
        }
      }, 1000);
    }
  };

  const inputClasses = size === 'large' 
    ? "w-full px-6 py-4 pl-12 pr-4 text-lg border-2 border-gray-300 rounded-xl bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-900"
    : "w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-900";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={inputClasses}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        <div
          className={`absolute inset-y-0 left-0 ${size === 'large' ? 'pl-4' : 'pl-3'} flex items-center cursor-text`}
          onMouseDown={(e) => {
            // Prevent losing focus when clicking the icon area
            e.preventDefault();
            inputRef.current?.focus();
            setIsOpen(true);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
            setIsOpen(true);
          }}
        >
          <svg className={`${size === 'large' ? 'h-6 w-6' : 'h-5 w-5'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div  role="listbox">
          {!query.trim() && (
            <div >
              Popular Tools
            </div>
          )}
          {loading && (
            <div >
              Searching...
            </div>
          )}
          {results.length > 0 && results.map((result, index) => {
            const { tool, score, matchType, matchedTerms } = result;
            const matchTypeColors = {
              exact: 'bg-green-100 text-green-800/30',
              name: 'bg-blue-100 text-blue-800/30',
              abbreviation: 'bg-purple-100 text-purple-800/30',
              keywords: 'bg-yellow-100 text-yellow-800/30',
              description: 'bg-gray-100 text-gray-800',
              category: 'bg-indigo-100 text-indigo-800/30'
            };

            return (
              <button
                key={tool.slug}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-all ${
                  index === selectedIndex
                    ? 'bg-blue-50/20 border-blue-200'
                    : ''
                }`}
                onClick={() => handleToolClick(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: `${tool.category.color}20`, color: tool.category.color }}>
                    <span className="text-lg font-bold">
                      {tool.icon || tool.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        
                        dangerouslySetInnerHTML={{
                          __html: highlightMatches(tool.name, matchedTerms)
                        }}
                      />
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${matchTypeColors[matchType]}`}>
                        {matchType}
                      </span>
                      {score >= 80 && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p
                      
                      dangerouslySetInnerHTML={{
                        __html: highlightMatches(tool.description, matchedTerms)
                      }}
                    />
                    {matchedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {matchedTerms.slice(0, 3).map((term, i) => (
                          <span key={i} >
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div >
                      {Math.round(score)}%
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {query.trim() && !loading && (
            <button
              
              onClick={() => {
                const q = query.trim();
                if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
              }}
            >
              <div className="text-sm">
                Search for "{query}"
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
