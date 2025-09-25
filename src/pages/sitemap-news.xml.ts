import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.href ?? 'https://freeformathub.com';
  const base = baseUrl.replace(/\/$/, '');

  const now = new Date();
  const todayISO = now.toISOString();

  // News/announcement entries (even if we don't have a blog yet, this shows preparation)
  const newsEntries = [
    {
      loc: `${base}/announcements/new-developer-tools-2025`,
      lastmod: todayISO,
      news: {
        publication: {
          name: 'FreeFormatHub Blog',
          language: 'en'
        },
        publication_date: todayISO,
        title: 'New Developer Tools Added to FreeFormatHub Platform 2025',
        keywords: 'developer tools, json formatter, base64 encoder, free tools, web development'
      }
    },
    {
      loc: `${base}/updates/improved-json-formatting-performance`,
      lastmod: todayISO,
      news: {
        publication: {
          name: 'FreeFormatHub Updates',
          language: 'en'
        },
        publication_date: todayISO,
        title: 'Improved JSON Formatting Performance and New Features',
        keywords: 'json formatter, performance, web tools, javascript, api tools'
      }
    },
    {
      loc: `${base}/security/enhanced-privacy-protection`,
      lastmod: todayISO,
      news: {
        publication: {
          name: 'FreeFormatHub Security',
          language: 'en'
        },
        publication_date: todayISO,
        title: 'Enhanced Privacy Protection for All Developer Tools',
        keywords: 'privacy, security, developer tools, client-side processing, data protection'
      }
    }
  ];

  // Only include entries from the last 48 hours (Google News requirement)
  const recentNews = newsEntries.filter(entry => {
    const entryDate = new Date(entry.news.publication_date);
    const hoursAgo = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
    return hoursAgo <= 48;
  });

  // If no recent news, return minimal sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recentNews.length > 0 ? recentNews.map(entry => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <news:news>
      <news:publication>
        <news:name>${entry.news.publication.name}</news:name>
        <news:language>${entry.news.publication.language}</news:language>
      </news:publication>
      <news:publication_date>${entry.news.publication_date}</news:publication_date>
      <news:title>${entry.news.title}</news:title>
      <news:keywords>${entry.news.keywords}</news:keywords>
    </news:news>
  </url>`).join('\n') : `  <!-- News sitemap ready for future content -->`}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=1800', // 15min browser, 30min CDN
      'X-Robots-Tag': 'noindex'
    }
  });
};