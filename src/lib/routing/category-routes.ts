import { TOOL_CATEGORIES, getAllTools, getToolsByCategory, getTool } from '../tools/registry';
import type { Tool, ToolCategory } from '../../types';

/**
 * Category routing utilities for FreeFormatHub
 * Provides functions for managing category-based routing and URL generation
 */

export interface CategoryRoute {
  category: string;
  slug?: string;
  tool?: Tool;
}

export interface CategoryStaticPath {
  params: {
    category: string;
    slug?: string;
  };
  props: {
    category: ToolCategory;
    tool?: Tool;
    tools?: Tool[];
  };
}

/**
 * Generate static paths for all category pages
 * Used for /tools/[category] routes
 */
export function getCategoryStaticPaths(): CategoryStaticPath[] {
  return TOOL_CATEGORIES.map(category => ({
    params: { category: category.id },
    props: {
      category,
      tools: getToolsByCategory(category.id)
    }
  }));
}

/**
 * Generate static paths for all tool pages
 * Used for /tools/[category]/[slug] routes
 */
export function getToolStaticPaths(): CategoryStaticPath[] {
  const paths: CategoryStaticPath[] = [];
  
  for (const category of TOOL_CATEGORIES) {
    const tools = getToolsByCategory(category.id);
    for (const tool of tools) {
      paths.push({
        params: {
          category: category.id,
          slug: tool.slug
        },
        props: {
          category,
          tool,
          tools: getToolsByCategory(category.id) // Related tools in same category
        }
      });
    }
  }
  
  return paths;
}

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find(cat => cat.id === categoryId);
}

/**
 * Get tool by category and slug
 */
export function getToolByCategoryAndSlug(categoryId: string, slug: string): Tool | undefined {
  const tools = getToolsByCategory(categoryId);
  return tools.find(tool => tool.slug === slug);
}

/**
 * Generate tool URL
 */
export function getToolUrl(tool: Tool): string {
  return `/tools/${tool.category.id}/${tool.slug}`;
}

/**
 * Generate category URL
 */
export function getCategoryUrl(category: ToolCategory): string {
  return `/tools/${category.id}`;
}

/**
 * Parse tool URL to extract category and slug
 */
export function parseToolUrl(url: string): CategoryRoute | null {
  const match = url.match(/^\/tools\/([^\/]+)(?:\/([^\/]+))?$/);
  if (!match) return null;
  
  const [, category, slug] = match;
  const categoryObj = getCategoryById(category);
  
  if (!categoryObj) return null;
  
  if (slug) {
    const tool = getToolByCategoryAndSlug(category, slug);
    return { category, slug, tool };
  }
  
  return { category };
}

/**
 * Get featured tools across all categories
 */
export function getFeaturedTools(limit: number = 6): Tool[] {
  const allTools = getAllTools();
  // For now, return first tools from each category
  const featured: Tool[] = [];
  const usedCategories = new Set<string>();
  
  for (const tool of allTools) {
    if (featured.length >= limit) break;
    if (!usedCategories.has(tool.category.id)) {
      featured.push(tool);
      usedCategories.add(tool.category.id);
    }
  }
  
  // Fill remaining slots with any tools
  for (const tool of allTools) {
    if (featured.length >= limit) break;
    if (!featured.includes(tool)) {
      featured.push(tool);
    }
  }
  
  return featured;
}

/**
 * Get related tools for a given tool
 */
export function getRelatedTools(tool: Tool, limit: number = 6): Tool[] {
  // Get tools from same category first
  const categoryTools = getToolsByCategory(tool.category.id)
    .filter(t => t.id !== tool.id);
  
  // Get tools with similar keywords
  const allTools = getAllTools();
  const keywordMatches = allTools
    .filter(t => t.id !== tool.id && t.category.id !== tool.category.id)
    .map(t => ({
      tool: t,
      matches: t.keywords.filter(k => tool.keywords.includes(k)).length
    }))
    .filter(({ matches }) => matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map(({ tool }) => tool);
  
  // Combine and limit
  const related = [...categoryTools, ...keywordMatches].slice(0, limit);
  return related;
}

/**
 * Generate sitemap entries for tools and categories
 */
export function generateSitemapEntries(baseUrl: string = 'https://freeformathub.com'): Array<{
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}> {
  const entries = [];
  const lastmod = new Date().toISOString().split('T')[0];
  
  // Categories
  for (const category of TOOL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/tools/${category.id}`,
      lastmod,
      changefreq: 'weekly',
      priority: '0.8'
    });
  }
  
  // Tools
  const allTools = getAllTools();
  for (const tool of allTools) {
    entries.push({
      url: `${baseUrl}/tools/${tool.category.id}/${tool.slug}`,
      lastmod,
      changefreq: 'monthly',
      priority: '0.9'
    });
  }
  
  return entries;
}

/**
 * Search tools across all categories
 */
export function searchToolsAdvanced(query: string, filters?: {
  category?: string;
  difficulty?: string;
  featured?: boolean;
}): Tool[] {
  let tools = getAllTools();
  
  // Apply filters
  if (filters?.category) {
    tools = tools.filter(tool => tool.category.id === filters.category);
  }
  
  if (filters?.featured) {
    tools = getFeaturedTools(50); // Get more featured tools for search
  }
  
  // Search by query
  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    tools = tools.filter(tool => 
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
      tool.category.name.toLowerCase().includes(lowerQuery)
    );
  }
  
  return tools;
}

/**
 * Get breadcrumb items for a given path
 */
export function getBreadcrumbs(path: string): Array<{
  name: string;
  url: string;
  current?: boolean;
}> {
  const breadcrumbs = [{ name: 'Home', url: '/' }];
  
  const route = parseToolUrl(path);
  if (!route) return breadcrumbs;
  
  const category = getCategoryById(route.category);
  if (!category) return breadcrumbs;
  
  breadcrumbs.push({ name: 'Tools', url: '/tools' });
  breadcrumbs.push({ 
    name: category.name, 
    url: `/tools/${category.id}`,
    current: !route.slug
  });
  
  if (route.slug && route.tool) {
    breadcrumbs.push({ 
      name: route.tool.name, 
      url: `/tools/${category.id}/${route.slug}`,
      current: true
    });
  }
  
  return breadcrumbs;
}