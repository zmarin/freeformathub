import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.href ?? 'https://freeformathub.com';
  const base = baseUrl.replace(/\/$/, '');

  // Current timestamp for lastmod
  const now = new Date().toISOString().split('T')[0];

  const sitemaps = [
    {
      loc: `${base}/sitemap.xml`,
      lastmod: now
    },
    {
      loc: `${base}/sitemap-0.xml`,
      lastmod: now
    },
    {
      loc: `${base}/sitemap-images.xml`,
      lastmod: now
    },
    {
      loc: `${base}/sitemap-news.xml`,
      lastmod: now
    }
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
};