import type { APIRoute } from 'astro';
import { generateSitemapEntries } from '../lib/routing/category-routes';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.href ?? 'https://freeformathub.com';
  const entries = generateSitemapEntries(baseUrl);
  
  // Add static pages
  const lastmod = new Date().toISOString().split('T')[0];
  const staticPages = [
    { url: baseUrl, lastmod, changefreq: 'daily', priority: '1.0' },
    { url: `${baseUrl}/search`, lastmod, changefreq: 'weekly', priority: '0.6' },
    { url: `${baseUrl}/tools`, lastmod, changefreq: 'weekly', priority: '0.8' }
  ];

  // Add topic-specific landing pages (high priority for SEO)
  const topicPages = [
    { url: `${baseUrl}/json-tools`, lastmod, changefreq: 'weekly', priority: '0.9' },
    { url: `${baseUrl}/text-tools`, lastmod, changefreq: 'weekly', priority: '0.9' },
    { url: `${baseUrl}/data-converters`, lastmod, changefreq: 'weekly', priority: '0.9' },
    { url: `${baseUrl}/password-tools`, lastmod, changefreq: 'weekly', priority: '0.9' }
  ];

  // Add additional important pages
  const additionalPages = [
    { url: `${baseUrl}/privacy`, lastmod, changefreq: 'monthly', priority: '0.5' },
    { url: `${baseUrl}/terms`, lastmod, changefreq: 'monthly', priority: '0.5' }
  ];

  const allEntries = [...staticPages, ...topicPages, ...additionalPages, ...entries];
  
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
