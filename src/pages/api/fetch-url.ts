import type { APIRoute } from 'astro';

// Blocked domains to prevent abuse
const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '10.',
  '172.16.',
  '192.168.',
  'internal',
  'local'
];

// Maximum response size (5MB)
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

// Request timeout (10 seconds)
const REQUEST_TIMEOUT = 10000;

/**
 * Validate URL for security
 */
function validateUrl(urlString: string): { valid: boolean; error?: string; url?: URL } {
  try {
    const url = new URL(urlString);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Check for blocked domains
    const hostname = url.hostname.toLowerCase();
    for (const blocked of BLOCKED_DOMAINS) {
      if (hostname.includes(blocked)) {
        return { valid: false, error: 'Access to this domain is not allowed' };
      }
    }

    return { valid: true, url };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Fetch URL with timeout
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FreeFormatHub/1.0; +https://freeformathub.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - the website took too long to respond');
    }
    throw error;
  }
}

/**
 * API endpoint to fetch URLs and bypass CORS
 */
export const GET: APIRoute = async ({ url, request }) => {
  const targetUrl = url.searchParams.get('url');

  // Validate URL parameter
  if (!targetUrl) {
    return new Response(JSON.stringify({
      success: false,
      error: 'URL parameter is required',
      statusCode: 400
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  // Validate and sanitize URL
  const validation = validateUrl(targetUrl);
  if (!validation.valid) {
    return new Response(JSON.stringify({
      success: false,
      error: validation.error,
      statusCode: 400
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // Fetch the URL with timeout
    const response = await fetchWithTimeout(targetUrl, REQUEST_TIMEOUT);

    // Check response status
    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';

    // Get content length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Response size exceeds maximum limit (5MB)',
        statusCode: 413
      }), {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Read response body
    const html = await response.text();

    // Check actual size
    if (html.length > MAX_RESPONSE_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Response size exceeds maximum limit (5MB)',
        statusCode: 413
      }), {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      url: targetUrl,
      html,
      title,
      contentType,
      statusCode: response.status,
      size: html.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '59',
        'X-RateLimit-Reset': String(Date.now() + 60000)
      }
    });

  } catch (error) {
    console.error('Fetch URL error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch URL';

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      statusCode: 500
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

/**
 * Handle preflight OPTIONS requests for CORS
 */
export const OPTIONS: APIRoute = () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
};
