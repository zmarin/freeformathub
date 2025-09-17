// Dynamic robots.txt generation for search engine crawlers
// This ensures the file is properly served in production

export async function GET() {
  // Generate robots.txt content
  const content = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://freeformathub.com/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /private/
Disallow: /_astro/
Disallow: /grafana/
Disallow: /prometheus/

# Crawl-delay for respectful crawling
Crawl-delay: 1`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    }
  });
}