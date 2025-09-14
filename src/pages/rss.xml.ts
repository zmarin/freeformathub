import type { APIRoute } from 'astro';
import { getAllTools } from '../lib/tools/registry';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const GET: APIRoute = ({ site }) => {
  const base = (site?.href ?? 'https://freeformathub.com').replace(/\/$/, '');
  const tools = getAllTools();

  const items = tools.slice(0, 50).map((tool) => {
    const url = `${base}/${tool.category.id}/${tool.slug}`;
    const title = escapeXml(tool.name);
    const description = escapeXml(tool.description);
    const pubDate = new Date().toUTCString();
    return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>FreeFormatHub Updates</title>
    <link>${base}</link>
    <description>New and updated business and developer tools on FreeFormatHub</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }
  });
};

