import { FREEFORMATHUB_BASE_URL } from './constants';

export type DocPageId = 'about' | 'privacy' | 'terms';

export interface DocSection {
  heading: string;
  items: string[];
}

export interface DocPageContent {
  id: DocPageId;
  title: string;
  summary: string;
  htmlUrl: string;
  mdUrl: string;
  highlights: string[];
  sections: DocSection[];
  contact?: string;
}

const BASE = FREEFORMATHUB_BASE_URL;

export const DOC_PAGES: DocPageContent[] = [
  {
    id: 'about',
    title: 'About FreeFormatHub',
    summary: 'FreeFormatHub delivers a privacy-first toolkit of 120+ developer and business utilities for formatting, converting, and validating data without sending anything to a server.',
    htmlUrl: `${BASE}/about`,
    mdUrl: `${BASE}/about/index.html.md`,
    highlights: [
      'Offline-ready architecture keeps sensitive payloads on the client.',
      '119+ tools across formatters, converters, encoders, text utilities, and security workflows.',
      'Spectrum of use cases spanning API debugging, analytics pipelines, QA, and content production.'
    ],
    sections: [
      {
        heading: 'Core principles',
        items: [
          'Completely free: no subscriptions, usage caps, or gated features.',
          'Privacy by design: every operation runs locally in the browser.',
          'Performance focused: Astro + React islands for sub-second interactivity.',
          'Accessible everywhere: responsive UI that continues to work offline once loaded.'
        ]
      },
      {
        heading: 'Coverage at a glance',
        items: [
          'Formatters & validators: JSON, XML, YAML, CSV, HTML, CSS, SQL, and more.',
          'Converters: JSON ⇄ CSV ⇄ XML, Markdown ⇄ HTML, Excel ⇄ JSON, image encoders.',
          'Security: password generators, hash utilities, JWT tooling, encryption helpers.',
          'Productivity: text analyzers, diff tooling, cron builders, color systems, QR/Barcode generators.'
        ]
      },
      {
        heading: 'Technology stack',
        items: [
          'Astro static generation for fast delivery with minimal JavaScript.',
          'TypeScript-first codebase with shared schema definitions for consistency.',
          'Tailwind CSS design system with accessible color palettes and dark mode.',
          'Client-side processing powered by modern browser APIs and web workers where beneficial.'
        ]
      }
    ],
    contact: 'Feedback and partnership requests: hello@freeformathub.com'
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    summary: 'FreeFormatHub operates on a privacy-by-design model: your data never leaves the browser, with optional analytics and ads running only after explicit consent.',
    htmlUrl: `${BASE}/privacy`,
    mdUrl: `${BASE}/privacy/index.html.md`,
    highlights: [
      'Zero data capture from the tools themselves—processing stays on device.',
      'Cookie banner controls optional Google Analytics and AdSense tracking.',
      'Local storage only holds preferences like theme, consent, and recent tools.'
    ],
    sections: [
      {
        heading: 'What we collect',
        items: [
          'Tool input/output data: never sent or stored; handled entirely client-side.',
          'Usage analytics: anonymized visit metrics via Google Analytics with consent.',
          'Advertising: Google AdSense cookies when users opt in for personalized ads.',
          'Local storage: theme preference, consent settings, optional recent-tool history.'
        ]
      },
      {
        heading: 'Your controls',
        items: [
          'Consent banner lets you toggle analytics and ad cookies at any time.',
          'Clear browser storage to remove locally cached preferences or history.',
          'Use Google privacy dashboards to manage Analytics and AdSense data.',
          'Email privacy@freeformathub.com for GDPR/CCPA access, deletion, or objection requests.'
        ]
      },
      {
        heading: 'Compliance commitments',
        items: [
          'GDPR/CCPA rights honored: access, rectification, deletion, portability, opt-out.',
          'Server logs for security are pruned within 30 days; analytics retention is 26 months.',
          'Children under 16 require guardian consent; tools are intended for professional use.',
          'Updates announced on the site with effective dates—latest policy always published publicly.'
        ]
      }
    ],
    contact: 'Dedicated privacy inquiries: privacy@freeformathub.com'
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    summary: 'These terms outline acceptable use, intellectual property, warranties, and liability limitations for using FreeFormatHub tools and content.',
    htmlUrl: `${BASE}/terms`,
    mdUrl: `${BASE}/terms/index.html.md`,
    highlights: [
      'Tools are provided “as is” without warranties; critical outputs must be independently verified.',
      'Personal and commercial projects are welcome while respecting intellectual property and rate limits.',
      'Abuse, automated scraping, or unlawful activity can trigger suspension of access.'
    ],
    sections: [
      {
        heading: 'Acceptable use',
        items: [
          'Use the service for lawful development, educational, or data-processing purposes only.',
          'Avoid automated scraping, excessive requests, or attempts to overload infrastructure.',
          'Do not process sensitive data without safeguards; you control privacy practices on your device.',
          'Respect intellectual property, trademarks, and branding guidelines when sharing outputs.'
        ]
      },
      {
        heading: 'Intellectual property',
        items: [
          'All site content, branding, and tool code remain the property of FreeFormatHub.',
          'Generated outputs belong to the user; ensure compliance with third-party rights.',
          'Feedback may inform future improvements without additional compensation.',
          'Logos and trademarks require written permission for commercial distribution or marketing.'
        ]
      },
      {
        heading: 'Liability and warranty',
        items: [
          'Service is provided without warranties of accuracy, availability, or fitness for purpose.',
          'FreeFormatHub is not liable for damages arising from the use of generated results.',
          'Users should validate outputs before deploying to production environments.',
          'Governing law follows the jurisdiction where FreeFormatHub operates; severability applies.'
        ]
      }
    ],
    contact: 'Legal questions: legal@freeformathub.com'
  }
];

export const DOC_PAGE_MAP = new Map(DOC_PAGES.map(page => [page.id, page]));

export function getDocPage(id: DocPageId): DocPageContent | undefined {
  return DOC_PAGE_MAP.get(id);
}
