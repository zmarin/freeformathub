import type { Tool } from '../../types';

export interface SearchResult {
  tool: Tool;
  score: number;
  matchType: 'exact' | 'name' | 'keywords' | 'description' | 'category' | 'abbreviation';
  matchedTerms: string[];
}

export interface SearchOptions {
  maxResults?: number;
  minScore?: number;
  category?: string;
  fuzzyThreshold?: number;
}

// Common abbreviations and synonyms for tools
const ABBREVIATIONS: Record<string, string[]> = {
  'b64': ['base64', 'base-64'],
  'jwt': ['json web token', 'jwt'],
  'url': ['uri', 'link'],
  'html': ['htm', 'hypertext'],
  'css': ['cascade', 'stylesheet'],
  'js': ['javascript', 'ecmascript'],
  'json': ['javascript object notation'],
  'xml': ['extensible markup'],
  'yaml': ['yml', 'yet another markup'],
  'sql': ['structured query'],
  'uuid': ['guid', 'unique identifier'],
  'hash': ['checksum', 'digest'],
  'md5': ['message digest'],
  'sha': ['secure hash'],
  'rsa': ['rivest shamir adleman'],
  'aes': ['advanced encryption'],
  'regex': ['regexp', 'regular expression'],
  'ip': ['internet protocol'],
  'dns': ['domain name system'],
  'http': ['hypertext transfer'],
  'api': ['application programming interface'],
  'csv': ['comma separated'],
  'tsv': ['tab separated'],
  'base32': ['base-32'],
  'qr': ['qr code', 'quick response'],
  'seo': ['search engine optimization'],
  'minify': ['minimize', 'compress'],
  'beautify': ['format', 'prettify'],
  'lint': ['linter', 'validate'],
  'diff': ['difference', 'compare'],
  'hex': ['hexadecimal'],
  'rgb': ['red green blue'],
  'hsl': ['hue saturation lightness'],
  'cron': ['scheduled task'],
  'lorem': ['lorem ipsum', 'placeholder'],
  'timestamp': ['unix time', 'epoch'],
  'ssl': ['secure socket layer', 'tls'],
  'pgp': ['pretty good privacy'],
  'pbkdf2': ['password-based key derivation'],
  'hmac': ['hash-based message authentication'],
  'otp': ['one-time password'],
  'totp': ['time-based otp'],
  'hotp': ['hmac-based otp']
};

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Calculate fuzzy match score (0-1, higher is better)
function fuzzyMatchScore(query: string, target: string, threshold: number = 0.6): number {
  if (target.includes(query)) return 1;

  const distance = levenshteinDistance(query.toLowerCase(), target.toLowerCase());
  const maxLength = Math.max(query.length, target.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= threshold ? similarity : 0;
}

// Expand query with abbreviations
function expandQuery(query: string): string[] {
  const expanded = [query];
  const lowerQuery = query.toLowerCase();

  for (const [abbr, expansions] of Object.entries(ABBREVIATIONS)) {
    if (lowerQuery === abbr || lowerQuery.includes(abbr)) {
      expanded.push(...expansions);
    }

    // Also check if query matches any expansion
    if (expansions.some(exp => exp.includes(lowerQuery))) {
      expanded.push(abbr);
    }
  }

  return [...new Set(expanded)];
}

// Score a tool against a query
function scoreToolMatch(tool: Tool, queries: string[], fuzzyThreshold: number): SearchResult | null {
  let bestScore = 0;
  let bestMatchType: SearchResult['matchType'] = 'description';
  const matchedTerms: string[] = [];

  const toolName = tool.name.toLowerCase();
  const toolDesc = tool.description.toLowerCase();
  const toolKeywords = tool.keywords.map(k => k.toLowerCase());
  const toolCategory = tool.category.name.toLowerCase();
  const toolId = tool.id.toLowerCase();

  for (const query of queries) {
    const lowerQuery = query.toLowerCase();

    // Exact name match (highest priority)
    if (toolName === lowerQuery || toolId === lowerQuery) {
      bestScore = Math.max(bestScore, 100);
      bestMatchType = 'exact';
      matchedTerms.push(query);
      continue;
    }

    // Name contains query
    if (toolName.includes(lowerQuery)) {
      const score = lowerQuery.length / toolName.length * 80; // Longer matches score higher
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'name';
        matchedTerms.push(query);
      }
    }

    // Fuzzy name match
    const fuzzyNameScore = fuzzyMatchScore(lowerQuery, toolName, fuzzyThreshold);
    if (fuzzyNameScore > 0) {
      const score = fuzzyNameScore * 75;
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'name';
        matchedTerms.push(query);
      }
    }

    // Keywords exact match
    for (const keyword of toolKeywords) {
      if (keyword === lowerQuery || keyword.includes(lowerQuery)) {
        const score = lowerQuery.length / keyword.length * 60;
        if (score > bestScore) {
          bestScore = score;
          bestMatchType = 'keywords';
          matchedTerms.push(query);
        }
      }
    }

    // Description contains query
    if (toolDesc.includes(lowerQuery)) {
      const score = Math.min(40, lowerQuery.length / toolDesc.length * 200);
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'description';
        matchedTerms.push(query);
      }
    }

    // Category match
    if (toolCategory.includes(lowerQuery)) {
      const score = 20;
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'category';
        matchedTerms.push(query);
      }
    }
  }

  // Check for abbreviation matches
  const originalQuery = queries[0];
  if (queries.length > 1) {
    bestMatchType = 'abbreviation';
  }

  if (bestScore === 0) return null;

  return {
    tool,
    score: bestScore,
    matchType: bestMatchType,
    matchedTerms: [...new Set(matchedTerms)]
  };
}

// Main search function with advanced ranking
export function searchToolsAdvanced(
  tools: Tool[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    maxResults = 20,
    minScore = 10,
    category,
    fuzzyThreshold = 0.6
  } = options;

  if (!query.trim()) {
    // Return popular tools when no query
    return tools.slice(0, maxResults).map(tool => ({
      tool,
      score: 50,
      matchType: 'exact' as const,
      matchedTerms: []
    }));
  }

  let searchPool = tools;

  // Filter by category if specified
  if (category) {
    searchPool = tools.filter(tool => tool.category.id === category);
  }

  // Expand query with abbreviations and synonyms
  const expandedQueries = expandQuery(query.trim());

  // Score all tools
  const results: SearchResult[] = [];

  for (const tool of searchPool) {
    const result = scoreToolMatch(tool, expandedQueries, fuzzyThreshold);
    if (result && result.score >= minScore) {
      results.push(result);
    }
  }

  // Sort by score (descending) and limit results
  return results
    .sort((a, b) => {
      // First sort by score
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Then by match type priority
      const typeOrder = { exact: 0, name: 1, abbreviation: 2, keywords: 3, description: 4, category: 5 };
      if (typeOrder[a.matchType] !== typeOrder[b.matchType]) {
        return typeOrder[a.matchType] - typeOrder[b.matchType];
      }
      // Finally by tool name alphabetically
      return a.tool.name.localeCompare(b.tool.name);
    })
    .slice(0, maxResults);
}

// Get search suggestions based on popular tools and query
export function getSearchSuggestions(tools: Tool[], query: string, limit: number = 5): string[] {
  if (!query.trim()) {
    // Return popular tool names
    return tools.slice(0, limit).map(tool => tool.name);
  }

  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();

  // Add tool names that start with query
  for (const tool of tools) {
    if (suggestions.size >= limit) break;
    if (tool.name.toLowerCase().startsWith(lowerQuery)) {
      suggestions.add(tool.name);
    }
  }

  // Add keywords that start with query
  for (const tool of tools) {
    if (suggestions.size >= limit) break;
    for (const keyword of tool.keywords) {
      if (keyword.toLowerCase().startsWith(lowerQuery)) {
        suggestions.add(keyword);
        break;
      }
    }
  }

  // Add abbreviation expansions
  for (const [abbr, expansions] of Object.entries(ABBREVIATIONS)) {
    if (suggestions.size >= limit) break;
    if (abbr.startsWith(lowerQuery)) {
      suggestions.add(expansions[0]);
    }
  }

  return Array.from(suggestions).slice(0, limit);
}

// Highlight matched terms in text
export function highlightMatches(text: string, terms: string[]): string {
  if (!terms.length) return text;

  let highlighted = text;
  for (const term of terms) {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }

  return highlighted;
}