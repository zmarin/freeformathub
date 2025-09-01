import type { APIRoute } from 'astro';
import { searchToolsAdvanced } from '../../lib/routing/category-routes';

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
    const results = searchToolsAdvanced(query, { category });
    const limitedResults = results.slice(0, limit);

    // Transform results for API response
    const apiResults = limitedResults.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      slug: tool.slug,
      category: {
        id: tool.category.id,
        name: tool.category.name,
        color: tool.category.color
      },
      icon: tool.icon,
      keywords: tool.keywords,
      url: `/${tool.category.id}/${tool.slug}`
    }));

    return new Response(JSON.stringify({
      success: true,
      query,
      category,
      total: results.length,
      returned: apiResults.length,
      results: apiResults
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
