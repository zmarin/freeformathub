import type { APIRoute } from 'astro';
import { generateSitemapEntries } from '../lib/routing/category-routes';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.href ?? 'https://freeformathub.com';
  const base = baseUrl.replace(/\/$/, '');
  const entries = generateSitemapEntries(baseUrl);

  // Current timestamp for dynamic lastmod
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];

  // Split sitemap - this file contains tool pages (first 70 entries to match GSC data)
  const toolEntries = entries.slice(0, 70).map(entry => ({
    url: entry.url,
    lastmod: todayISO,
    changefreq: entry.changefreq || 'weekly',
    priority: entry.priority || '0.8'
  }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${toolEntries.map(entry => {
  const escapedUrl = entry.url.replace(/&/g, '&amp;');
  return `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
    ${entry.url.includes('/formatters/') || entry.url.includes('/encoders/') || entry.url.includes('/crypto/') ?
      `<image:image>
      <image:loc>${base}/screenshots/${entry.url.split('/').pop()}.png</image:loc>
      <image:caption>Screenshot of ${entry.url.split('/').pop()?.replace(/-/g, ' ')} tool</image:caption>
    </image:image>` : ''
    }
  </url>`;
}).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
      'Vary': 'Accept-Encoding'
    }
  });
};