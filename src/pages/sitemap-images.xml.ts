import type { APIRoute } from 'astro';
import { getAllTools } from '../lib/tools/registry';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.href ?? 'https://freeformathub.com';
  const base = baseUrl.replace(/\/$/, '');
  const allTools = getAllTools();

  const todayISO = new Date().toISOString().split('T')[0];

  // Generate image entries for tools with high SEO value
  const imageEntries = [];

  // Homepage and category images
  imageEntries.push({
    loc: `${base}/`,
    images: [
      {
        loc: `${base}/og-image.png`,
        caption: 'FreeFormatHub - Free Developer Tools for Data Formatting and Conversion',
        title: 'FreeFormatHub Homepage',
        license: `${base}/terms`
      },
      {
        loc: `${base}/screenshots/homepage-hero.png`,
        caption: 'Free JSON formatter, XML validator, Base64 encoder and 119+ developer tools',
        title: 'Developer Tools Collection'
      }
    ]
  });

  // Tool page images (focus on high-performing tools)
  const highPriorityTools = [
    'json-formatter', 'base64-encoder', 'jwt-decoder', 'port-scanner',
    'iban-validator', 'json-schema-validator', 'url-encoder', 'password-generator',
    'hash-generator', 'xml-formatter', 'csv-formatter', 'yaml-formatter'
  ];

  for (const tool of allTools) {
    if (highPriorityTools.includes(tool.id) && tool.category && tool.slug) {
      const toolUrl = `${base}/${tool.category.id}/${tool.slug}`;
      const toolName = tool.name;
      const categoryName = tool.category.name;

      imageEntries.push({
        loc: toolUrl,
        images: [
          {
            loc: `${base}/screenshots/${tool.slug}.png`,
            caption: `${toolName} - ${tool.description}`,
            title: `${toolName} Tool Interface`,
            license: `${base}/terms`
          },
          {
            loc: `${base}/screenshots/${tool.slug}-demo.png`,
            caption: `${toolName} example showing data formatting and conversion`,
            title: `${toolName} Usage Example`
          },
          {
            loc: `${base}/icons/${categoryName.toLowerCase()}.svg`,
            caption: `${categoryName} tools icon`,
            title: `${categoryName} Category Icon`
          }
        ]
      });
    }
  }

  // Category page images
  const categories = [
    'formatters', 'encoders', 'converters', 'network', 'crypto',
    'development', 'validators', 'text', 'generators', 'web'
  ];

  for (const category of categories) {
    imageEntries.push({
      loc: `${base}/${category}`,
      images: [
        {
          loc: `${base}/screenshots/${category}-category.png`,
          caption: `${category.charAt(0).toUpperCase() + category.slice(1)} tools collection`,
          title: `${category} Category Overview`
        },
        {
          loc: `${base}/icons/${category}.svg`,
          caption: `${category} category icon`,
          title: `${category} Icon`
        }
      ]
    });
  }

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imageEntries.map(entry => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${todayISO}</lastmod>
    ${entry.images.map(img => `    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:caption>${img.caption}</image:caption>
      <image:title>${img.title}</image:title>
      ${img.license ? `<image:license>${img.license}</image:license>` : ''}
    </image:image>`).join('\n')}
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=7200, s-maxage=14400', // 2h browser, 4h CDN
      'X-Robots-Tag': 'noindex'
    }
  });
};