import type { APIRoute } from 'astro';
import { getAllTools } from '../../lib/tools/registry';
import { searchToolsAdvanced } from '../../lib/search/search-utils';

export const GET: APIRoute = ({ url }) => {
  const searchParams = url.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query.trim()) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Query parameter "q" is required',
      results: []
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    // Import all tools to ensure registry is populated
    const allTools = getAllTools();

    // Use new advanced search with scoring
    const searchResults = searchToolsAdvanced(allTools, query, {
      maxResults: limit,
      category
    });

    // Transform results for API response with enhanced data
    const apiResults = searchResults.map(result => ({
      id: result.tool.id,
      name: result.tool.name,
      description: result.tool.description,
      slug: result.tool.slug,
      category: {
        id: result.tool.category.id,
        name: result.tool.category.name,
        color: result.tool.category.color
      },
      icon: result.tool.icon,
      keywords: result.tool.keywords,
      url: `/${result.tool.category.id}/${result.tool.slug}`,
      // Enhanced search metadata
      score: result.score,
      matchType: result.matchType,
      matchedTerms: result.matchedTerms
    }));

    return new Response(JSON.stringify({
      success: true,
      query,
      category,
      total: searchResults.length,
      returned: apiResults.length,
      results: apiResults,
      // Additional metadata
      searchMetadata: {
        hasResults: apiResults.length > 0,
        bestMatch: apiResults[0] || null,
        avgScore: apiResults.length > 0 ? apiResults.reduce((sum, r) => sum + r.score, 0) / apiResults.length : 0
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      results: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Handle preflight OPTIONS requests for CORS
export const OPTIONS: APIRoute = () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
