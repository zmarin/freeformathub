import { DOC_PAGES } from './docs';
import { getAllLlmsCategoryData, getPriorityTools } from './data';
import { FREEFORMATHUB_BASE_URL } from './constants';
import { formatToolsList } from './markdown';

interface OptionalResource {
  title: string;
  url: string;
  description: string;
}

const OPTIONAL_RESOURCES: OptionalResource[] = [
  {
    title: 'Product & support requests',
    url: 'mailto:hello@freeformathub.com',
    description: 'Contact the core team for feature requests, partnerships, or enterprise questions.'
  },
  {
    title: 'Privacy inquiries',
    url: 'mailto:privacy@freeformathub.com',
    description: 'Reach the data protection contact for GDPR/CCPA rights requests.'
  }
];

export function buildLlmsManifest(): string {
  const lines: string[] = [];
  const categories = getAllLlmsCategoryData();
  const priorityTools = getPriorityTools();

  lines.push('# FreeFormatHub');
  lines.push('');
  lines.push('> Privacy-first toolkit of 120+ formatting, conversion, security, and productivity utilities that run entirely in your browser.');
  lines.push('');
  lines.push('FreeFormatHub helps developers, analysts, and security teams process data without handing it to third parties. Every tool works offline once loaded, making it safe for regulated industries and client-sensitive workflows.');
  lines.push('');
  lines.push(`- **Primary site:** ${FREEFORMATHUB_BASE_URL}`);
  lines.push('- **Founded:** 2024, operated from Split, Croatia');
  lines.push('- **Contact:** hello@freeformathub.com');
  lines.push('- **Data handling:** Zero uploads; optional analytics/ads via consent banner.');
  lines.push('');

  lines.push('## Core documentation');
  lines.push('');
  DOC_PAGES.forEach(doc => {
    lines.push(`- [${doc.title}](${doc.mdUrl}): ${doc.summary}`);
  });
  lines.push('');

  lines.push('## Tool hubs');
  lines.push('');
  categories.forEach(category => {
    lines.push(`- [${category.title}](${category.mdUrl}): ${category.summary}`);
  });
  lines.push('');

  if (priorityTools.length) {
    lines.push('## Priority tools');
    lines.push('');
    lines.push(formatToolsList(priorityTools));
    lines.push('');
  }

  if (OPTIONAL_RESOURCES.length) {
    lines.push('## Optional');
    lines.push('');
    OPTIONAL_RESOURCES.forEach(resource => {
      lines.push(`- [${resource.title}](${resource.url}): ${resource.description}`);
    });
    lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
