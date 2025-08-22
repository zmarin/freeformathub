import type { APIRoute } from 'astro';
import { generateSitemapEntries } from '../lib/routing/category-routes';

export const GET: APIRoute = () => {
  const baseUrl = 'https://freeformathub.com'; // Update with your actual domain
  const entries = generateSitemapEntries(baseUrl);
  
  // Add static pages
  const staticPages = [
    { url: baseUrl, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' },
    { url: `${baseUrl}/tools`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.9' },
    { url: `${baseUrl}/tools/search`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.7' }
  ];

  const allEntries = [...staticPages, ...entries];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
};