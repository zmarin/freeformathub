import { useState, useEffect, useRef } from 'react';
import { searchClientTools, getAllClientTools, type ClientTool } from '../../lib/tools/client-registry';

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
  const [results, setResults] = useState<ClientTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Get popular tools to show when no search query
  const popularTools = getAllClientTools().slice(0, 6);

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

    // Debounce API search for better UX
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        // Abort any in-flight request
        if (fetchAbortRef.current) fetchAbortRef.current.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;

        const res = await fetch(`/api/search.json?q=${encodeURIComponent(q)}&limit=8`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
          // Fallback to client-side search on error
          const searchResults = searchClientTools(q);
          setResults(searchResults.slice(0, 8));
        } else {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.results)) {
            // Map API results to ClientTool shape (ignore extra fields)
            const mapped: ClientTool[] = data.results.map((t: any) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
              description: t.description,
              keywords: t.keywords || [],
              icon: t.icon,
              category: { id: t.category.id, name: t.category.name, color: t.category.color }
            }));
            setResults(mapped);
          } else {
            const searchResults = searchClientTools(q);
            setResults(searchResults.slice(0, 8));
          }
        }
      } catch (err) {
        // Likely aborted or network error; fall back to local search
        const fallback = searchClientTools(q);
        setResults(fallback.slice(0, 8));
      } finally {
        setLoading(false);
        setSelectedIndex(0);
      }
    }, 200);

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
          window.location.href = `/${selected.category.id}/${selected.slug}`;
        } else if (q) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleToolClick = (tool: ClientTool) => {
    window.location.href = `/${tool.category.id}/${tool.slug}`;
  };

  const inputClasses = size === 'large' 
    ? "w-full px-6 py-4 pl-12 pr-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
    : "w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100";

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
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto" role="listbox">
          {!query.trim() && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
              Popular Tools
            </div>
          )}
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          )}
          {results.length > 0 && results.map((tool, index) => (
            <button
              key={tool.slug}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                  : ''
              }`}
              onClick={() => handleToolClick(tool)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {tool.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {tool.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {tool.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {query.trim() && !loading && (
            <button
              className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
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
