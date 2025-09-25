import type { APIRoute } from 'astro';
import { generateSitemapEntries } from '../lib/routing/category-routes';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.href ?? 'https://freeformathub.com';
  const base = baseUrl.replace(/\/$/, '');
  const entries = generateSitemapEntries(baseUrl);

  // Current timestamp for dynamic lastmod
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  const yesterdayISO = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Homepage - maximum priority and freshness
  const homepageEntry = {
    url: base,
    lastmod: todayISO,
    changefreq: 'daily',
    priority: '1.0'
  };

  // HIGH-PERFORMING PAGES (Based on GSC data)
  const highPerformingPages = [
    // Port scanner is performing well (position 18.84)
    { url: `${base}/network/port-scanner`, lastmod: todayISO, changefreq: 'weekly', priority: '0.95' },
    // IBAN validator has good position
    { url: `${base}/validators/iban-validator`, lastmod: todayISO, changefreq: 'weekly', priority: '0.95' },
    // JSON tools - massive search volume potential
    { url: `${base}/formatters/json-formatter`, lastmod: todayISO, changefreq: 'weekly', priority: '0.98' },
    { url: `${base}/development/json-schema-validator`, lastmod: todayISO, changefreq: 'weekly', priority: '0.95' },
    { url: `${base}/development/json-path-extractor`, lastmod: todayISO, changefreq: 'weekly', priority: '0.90' },
    // Base64 tools - high commercial intent
    { url: `${base}/encoders/base64-encoder`, lastmod: todayISO, changefreq: 'weekly', priority: '0.95' },
    { url: `${base}/encoders/base64-image-decoder`, lastmod: todayISO, changefreq: 'weekly', priority: '0.92' },
    // JWT tools - developer focused, high value
    { url: `${base}/encoders/jwt-decoder`, lastmod: todayISO, changefreq: 'weekly', priority: '0.95' },
    // Network tools cluster (building on port-scanner success)
    { url: `${base}/network/ip-subnet-calculator`, lastmod: todayISO, changefreq: 'weekly', priority: '0.92' },
    { url: `${base}/network/dns-lookup`, lastmod: todayISO, changefreq: 'weekly', priority: '0.90' }
  ];

  // CATEGORY PAGES (High SEO value for broad keywords)
  const categoryPages = [
    { url: `${base}/formatters`, lastmod: todayISO, changefreq: 'weekly', priority: '0.9' },
    { url: `${base}/encoders`, lastmod: todayISO, changefreq: 'weekly', priority: '0.9' },
    { url: `${base}/converters`, lastmod: todayISO, changefreq: 'weekly', priority: '0.9' },
    { url: `${base}/network`, lastmod: todayISO, changefreq: 'weekly', priority: '0.88' },
    { url: `${base}/crypto`, lastmod: todayISO, changefreq: 'weekly', priority: '0.85' },
    { url: `${base}/development`, lastmod: todayISO, changefreq: 'weekly', priority: '0.85' },
    { url: `${base}/validators`, lastmod: todayISO, changefreq: 'weekly', priority: '0.85' },
    { url: `${base}/text`, lastmod: todayISO, changefreq: 'weekly', priority: '0.82' },
    { url: `${base}/generators`, lastmod: todayISO, changefreq: 'weekly', priority: '0.80' },
    { url: `${base}/web`, lastmod: todayISO, changefreq: 'weekly', priority: '0.80' },
    { url: `${base}/datetime`, lastmod: todayISO, changefreq: 'weekly', priority: '0.78' },
    { url: `${base}/data`, lastmod: todayISO, changefreq: 'weekly', priority: '0.78' },
    { url: `${base}/color`, lastmod: todayISO, changefreq: 'weekly', priority: '0.75' },
    { url: `${base}/math`, lastmod: todayISO, changefreq: 'weekly', priority: '0.75' }
  ];

  // TOPIC-SPECIFIC LANDING PAGES (Targeting specific search intents)
  const topicPages = [
    // JSON ecosystem
    { url: `${base}/json-tools`, lastmod: todayISO, changefreq: 'weekly', priority: '0.92' },
    { url: `${base}/json-formatter-online`, lastmod: todayISO, changefreq: 'weekly', priority: '0.90' },
    { url: `${base}/json-validator-free`, lastmod: todayISO, changefreq: 'weekly', priority: '0.88' },
    // Data conversion hub
    { url: `${base}/data-converters`, lastmod: todayISO, changefreq: 'weekly', priority: '0.90' },
    { url: `${base}/format-converters`, lastmod: todayISO, changefreq: 'weekly', priority: '0.88' },
    // Text processing
    { url: `${base}/text-tools`, lastmod: todayISO, changefreq: 'weekly', priority: '0.85' },
    { url: `${base}/text-formatters`, lastmod: todayISO, changefreq: 'weekly', priority: '0.85' },
    // Security tools
    { url: `${base}/password-tools`, lastmod: todayISO, changefreq: 'weekly', priority: '0.88' },
    { url: `${base}/encryption-tools`, lastmod: todayISO, changefreq: 'weekly', priority: '0.85' },
    // Developer utilities
    { url: `${base}/developer-tools`, lastmod: todayISO, changefreq: 'weekly', priority: '0.90' },
    { url: `${base}/coding-tools`, lastmod: todayISO, changefreq: 'weekly', priority: '0.88' }
  ];

  // PROGRAMMATIC SEO PAGES (New traffic opportunities)
  const programmaticPages = [
    // Comparison pages (high commercial intent)
    { url: `${base}/compare/json-formatter-vs-xml-formatter`, lastmod: todayISO, changefreq: 'monthly', priority: '0.75' },
    { url: `${base}/compare/base64-encoder-alternatives`, lastmod: todayISO, changefreq: 'monthly', priority: '0.75' },
    { url: `${base}/compare/jwt-decoder-tools`, lastmod: todayISO, changefreq: 'monthly', priority: '0.75' },
    // Use case pages (informational intent)
    { url: `${base}/guides/format-json-for-api-testing`, lastmod: todayISO, changefreq: 'monthly', priority: '0.70' },
    { url: `${base}/guides/decode-jwt-tokens-securely`, lastmod: todayISO, changefreq: 'monthly', priority: '0.70' },
    { url: `${base}/guides/convert-csv-to-json`, lastmod: todayISO, changefreq: 'monthly', priority: '0.70' },
    // Alternative pages (capturing competitor traffic)
    { url: `${base}/alternatives/jsonlint-alternative`, lastmod: todayISO, changefreq: 'monthly', priority: '0.68' },
    { url: `${base}/alternatives/jwt-io-alternative`, lastmod: todayISO, changefreq: 'monthly', priority: '0.68' }
  ];

  // UTILITY PAGES (Lower priority but important for UX)
  const utilityPages = [
    { url: `${base}/search`, lastmod: yesterdayISO, changefreq: 'daily', priority: '0.6' },
    { url: `${base}/tools`, lastmod: todayISO, changefreq: 'weekly', priority: '0.8' },
    { url: `${base}/about`, lastmod: todayISO, changefreq: 'monthly', priority: '0.5' },
    { url: `${base}/privacy`, lastmod: todayISO, changefreq: 'monthly', priority: '0.4' },
    { url: `${base}/terms`, lastmod: todayISO, changefreq: 'monthly', priority: '0.4' },
    { url: `${base}/contact`, lastmod: todayISO, changefreq: 'monthly', priority: '0.4' },
    { url: `${base}/sitemap`, lastmod: todayISO, changefreq: 'weekly', priority: '0.3' }
  ];

  // Combine all entries with proper ordering (highest priority first)
  const allEntries = [
    homepageEntry,
    ...highPerformingPages,
    ...categoryPages,
    ...topicPages,
    ...programmaticPages,
    ...utilityPages,
    ...entries // Individual tool pages from registry
  ];

  // Enhanced sitemap with additional namespaces and metadata
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allEntries.map(entry => {
  const escapedUrl = entry.url.replace(/&/g, '&amp;');
  return `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
    ${entry.url.includes('/formatters/') || entry.url.includes('/encoders/') ?
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
      'Cache-Control': 'public, max-age=1800, s-maxage=3600', // 30min browser, 1h CDN
      'X-Robots-Tag': 'noindex', // Don't index the sitemap itself
      'Vary': 'Accept-Encoding'
    }
  });
};
