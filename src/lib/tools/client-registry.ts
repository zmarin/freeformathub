import { getAllTools } from './registry';
// Ensure all tools are registered by importing the index
import './index';
import { searchToolsAdvanced, type SearchResult } from '../search/search-utils';

// Simplified tool data for client-side use
export interface ClientTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
  icon: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

// Enhanced search result with scoring
export interface ClientSearchResult {
  tool: ClientTool;
  score: number;
  matchType: 'exact' | 'name' | 'keywords' | 'description' | 'category' | 'abbreviation';
  matchedTerms: string[];
}

// Generate client-side tool registry from server registry
function generateClientTools(): ClientTool[] {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const allTools = getAllTools();
    return allTools.map(tool => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      keywords: tool.keywords,
      icon: tool.icon,
      category: {
        id: tool.category.id,
        name: tool.category.name,
        color: tool.category.color,
      }
    }));
  } catch (error) {
    console.warn('Failed to generate client tools:', error);
    return [];
  }
}

// Dynamic client-side tool registry - includes all registered tools
export const CLIENT_TOOLS: ClientTool[] = generateClientTools();

// Fallback static tools in case dynamic generation fails (subset of key tools)
const FALLBACK_TOOLS: ClientTool[] = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter & Validator',
    slug: 'json-formatter',
    description: 'Format, validate, and beautify JSON/JSONC with key sorting, inline arrays, duplicate key detection, and rich error details—all locally.',
    keywords: ['json', 'format', 'beautify', 'validate', 'pretty print', 'minify', 'parser'],
    icon: '{}',
    category: { id: 'formatters', name: 'Data Formatters & Validators', color: 'blue' }
  },
  {
    id: 'base64-encoder',
    name: 'Base64 Encoder/Decoder',
    slug: 'base64-encoder',
    description: 'Encode and decode text and files using Base64 encoding with support for images and documents',
    keywords: ['base64', 'encode', 'decode', 'base', '64'],
    icon: '🔒',
    category: { id: 'encoders', name: 'Encoding & Decoding', color: 'purple' }
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    slug: 'hash-generator',
    description: 'Generate cryptographic hashes using MD5, SHA-1, SHA-256, and other algorithms',
    keywords: ['hash', 'md5', 'sha1', 'sha256', 'crypto'],
    icon: '#️⃣',
    category: { id: 'crypto', name: 'Cryptography & Security', color: 'red' }
  },
  {
    id: 'ip-subnet-calculator',
    name: 'IP Subnet Calculator',
    slug: 'ip-subnet-calculator',
    description: 'Calculate subnet information from CIDR notation including network addresses, broadcast addresses, subnet masks, usable IP ranges, and subnet splitting for network planning.',
    keywords: ['ip', 'subnet', 'cidr', 'network', 'calculator', 'netmask', 'wildcard', 'broadcast', 'subnetting'],
    icon: '🌐',
    category: { id: 'network', name: 'Network & API', color: 'teal' }
  }
];

export function searchClientTools(query: string, maxResults: number = 20): ClientSearchResult[] {
  const tools = CLIENT_TOOLS.length > 0 ? CLIENT_TOOLS : FALLBACK_TOOLS;

  // Convert ClientTool to Tool format for search
  const searchableTools = tools.map(clientTool => ({
    id: clientTool.id,
    name: clientTool.name,
    slug: clientTool.slug,
    description: clientTool.description,
    keywords: clientTool.keywords,
    icon: clientTool.icon,
    category: clientTool.category,
    // Add required Tool properties with defaults
    examples: [],
    useCases: [],
    relatedTools: [],
    faqs: []
  }));

  const searchResults = searchToolsAdvanced(searchableTools, query, { maxResults });

  // Convert back to ClientSearchResult
  return searchResults.map(result => ({
    tool: {
      id: result.tool.id,
      name: result.tool.name,
      slug: result.tool.slug,
      description: result.tool.description,
      keywords: result.tool.keywords,
      icon: result.tool.icon,
      category: result.tool.category
    },
    score: result.score,
    matchType: result.matchType,
    matchedTerms: result.matchedTerms
  }));
}

// Legacy function for backward compatibility - returns just tools
export function searchClientToolsLegacy(query: string): ClientTool[] {
  return searchClientTools(query).map(result => result.tool);
}

export function getAllClientTools(): ClientTool[] {
  return CLIENT_TOOLS.length > 0 ? CLIENT_TOOLS : FALLBACK_TOOLS;
}

export function getPopularClientTools(limit: number = 6): ClientTool[] {
  // Return first N tools as "popular" - could be enhanced with actual popularity metrics
  const tools = CLIENT_TOOLS.length > 0 ? CLIENT_TOOLS : FALLBACK_TOOLS;
  return tools.slice(0, limit);
}
