import { defineMiddleware } from 'astro:middleware';

// Legacy URL redirects for Google Search Console cleanup
const REDIRECTS: Record<string, string> = {
  // Legacy tool URLs
  '/tools/base64-encoder/': '/encoders/base64-encoder',
  '/tools/base64-encoder': '/encoders/base64-encoder',
  '/tools/json-formatter': '/formatters/json-formatter',
  '/tools/json-minifier': '/formatters/json-formatter',
  '/tools/json-validator': '/validators/json-schema-validator',
  '/tools/ip-subnet-calculator': '/network/ip-subnet-calculator',

  // Legacy category URLs
  '/categories/web': '/web',
  '/categories/formatters': '/formatters',
  '/categories/crypto': '/crypto',
  '/categories/security': '/crypto',
  '/categories/math': '/math',

  // Legacy page URLs
  '/developer-cheatsheets': '/',
  '/text-to-pdf': '/converters/data-format-transformer',
  '/url-encoder-decoder': '/encoders/url-encoder',
  '/url-parser': '/web/url-parser',
  '/image-converter': '/converters/image-format-converter',
  '/xpath-tester': '/text/regex-tester',
  '/qr-code-generator': '/generators/qr-code-generator',
  '/css-beautifier': '/formatters/css-beautifier',
  '/xsd-generator': '/development/json-schema-validator',
  '/html-entities': '/encoders/html-entity-encoder',
  '/text-escaper': '/encoders/string-escape',
  '/csv-merger': '/data/csv-splitter',
  '/csv-to-json': '/converters/csv-to-json',
  '/validators-generators': '/validators',
  '/business-tools': '/',
  '/what-to-build-next': '/',
  '/developer-formatters-converters': '/converters',
  '/csv-tools': '/data',

  // Legal pages
  '/disclaimer': '/terms',
  '/privacy-policy': '/privacy',
  '/cookie-policy': '/privacy',
  '/terms-of-service': '/terms',
  '/about': '/',
  '/contact': '/',

  // Undefined URLs - redirect to home or appropriate category
  '/converters/undefined': '/converters',
  '/color/undefined': '/color',
  '/web/undefined': '/web',
  '/network/undefined': '/network',
  '/development/undefined': '/development',
  '/math/undefined': '/math',
  '/crypto/undefined': '/crypto',
  '/formatters/undefined': '/formatters',

  // Server file paths that somehow got indexed
  '/var/www/FreeFormatHub/src/app/regex-tester/page.tsx': '/text/regex-tester',
  '/var/www/FreeFormatHub/src/app/csv-to-xml-converter/page.tsx': '/converters/xml-to-json-converter',
  '/var/www/FreeFormatHub/src/app/cron-evaluator/page.tsx': '/datetime/cron-generator',
  '/var/www/FreeFormatHub/src/app/sitemap-generator/page.tsx': '/',
  '/var/www/FreeFormatHub/src/app/html-entities/page.tsx': '/encoders/html-entity-encoder',
  '/var/www/FreeFormatHub/src/app/json-to-yaml-converter/page.tsx': '/converters/json-to-xml-converter',
  '/var/www/FreeFormatHub/src/app/code-renderer/page.tsx': '/formatters/json-formatter',
  '/var/www/FreeFormatHub/src/app/audio-transcoder/page.tsx': '/converters/image-format-converter',
  '/var/www/FreeFormatHub/src/app/formatters/page.tsx': '/formatters',
  '/var/www/FreeFormatHub/src/app/javascript-minifier/page.tsx': '/web/js-minifier',
  '/var/www/FreeFormatHub/src/app/xslt-transformer/page.tsx': '/converters/xml-to-json-converter',
  '/var/www/FreeFormatHub/src/app/encoders-decoders/page.tsx': '/encoders',
  '/var/www/FreeFormatHub/src/app/legal/disclaimer/page.tsx': '/terms',
  '/var/www/FreeFormatHub/src/app/message-digester/page.tsx': '/crypto/hash-generator',
  '/var/www/FreeFormatHub/src/app/json-formatter/page.tsx': '/formatters/json-formatter',
  '/var/www/FreeFormatHub/src/app/legal/cookie-policy/page.tsx': '/privacy',
  '/var/www/FreeFormatHub/src/app/html-formatter/page.tsx': '/formatters/html-beautifier',
  '/var/www/FreeFormatHub/src/app/text-escaper/page.tsx': '/encoders/string-escape',
  '/var/www/FreeFormatHub/src/app/character-counter/page.tsx': '/text/word-counter',
  '/var/www/FreeFormatHub/src/app/video-converter/page.tsx': '/converters/image-format-converter',
  '/var/www/FreeFormatHub/src/app/base64-encoder-decoder/page.tsx': '/encoders/base64-encoder',
  '/var/www/FreeFormatHub/src/app/css-beautifier/page.tsx': '/formatters/css-beautifier',
  '/var/www/FreeFormatHub/src/app/converters/page.tsx': '/converters',
  '/var/www/FreeFormatHub/src/app/legal/privacy-policy/page.tsx': '/privacy',
  '/var/www/FreeFormatHub/src/app/crypto-price-tracker/page.tsx': '/',
  '/var/www/FreeFormatHub/src/app/ai-slugifier/page.tsx': '/text/text-case-converter',
  '/var/www/FreeFormatHub/src/app/csv-to-json/page.tsx': '/converters/csv-to-json',
  '/var/www/FreeFormatHub/src/app/developer-tools/page.tsx': '/development',
  '/var/www/FreeFormatHub/src/app/unit-converter/page.tsx': '/converters/unit-converter',
  '/var/www/FreeFormatHub/src/app/lorem-ipsum-generator/page.tsx': '/text/lorem-ipsum-generator',
  '/var/www/FreeFormatHub/src/app/sql-formatter/page.tsx': '/formatters/sql-formatter',
  '/var/www/FreeFormatHub/src/app/cron-generator/page.tsx': '/datetime/cron-generator',
  '/var/www/FreeFormatHub/src/app/xpath-tester/page.tsx': '/text/regex-tester',
  '/var/www/FreeFormatHub/src/app/image-converter/page.tsx': '/converters/image-format-converter',
  '/var/www/FreeFormatHub/src/app/mortgage-calculator/page.tsx': '/',
  '/var/www/FreeFormatHub/src/app/file-encoding-converter/page.tsx': '/converters/data-format-transformer',
  '/var/www/FreeFormatHub/src/app/timezone-converter/page.tsx': '/datetime/timestamp-converter',
  '/var/www/FreeFormatHub/src/app/pdf-to-word-text/page.tsx': '/converters/pdf-text-extractor',
  '/var/www/FreeFormatHub/src/app/legal/terms-of-service/page.tsx': '/terms',
  '/var/www/FreeFormatHub/src/app/page.tsx': '/',
  '/var/www/FreeFormatHub/src/components/ui/alert.tsx': '/',
  '/var/www/FreeFormatHub/src/components/ui/card.tsx': '/',

  // Next.js static files that shouldn't be indexed
  '/_next/static/css/app/layout.css': '/',
  '/_tree': '/',
  '/browserconfig.xml': '/',
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;

  // Handle exact redirects
  if (REDIRECTS[pathname]) {
    return redirect(REDIRECTS[pathname], 301);
  }

  // Handle Next.js static file requests
  if (pathname.startsWith('/_next/static/')) {
    return redirect('/', 301);
  }

  // Handle any remaining /var/www/ paths
  if (pathname.startsWith('/var/www/')) {
    return redirect('/', 301);
  }

  // Handle any undefined URLs pattern
  if (pathname.includes('/undefined')) {
    const category = pathname.split('/')[1];
    if (category && category !== 'undefined') {
      return redirect(`/${category}`, 301);
    }
    return redirect('/', 301);
  }

  // Continue to the next middleware/page
  return next();
});