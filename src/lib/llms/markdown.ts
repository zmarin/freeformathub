import type { Tool, ToolExample } from '../../types/tool';
import type { CategoryData } from './data';
import type { DocPageContent } from './docs';
import { FREEFORMATHUB_BASE_URL } from './constants';
import { getToolById } from './data';

const MAX_EXAMPLE_SNIPPET = 160;

function truncateSnippet(value: string): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_EXAMPLE_SNIPPET) {
    return clean;
  }
  return `${clean.slice(0, MAX_EXAMPLE_SNIPPET - 3)}...`;
}

export function getToolHtmlUrl(tool: Tool): string {
  return `${FREEFORMATHUB_BASE_URL}/${tool.category.id}/${tool.slug}`;
}

export function getToolMarkdownUrl(tool: Tool): string {
  return `${getToolHtmlUrl(tool)}/index.html.md`;
}

export function formatToolsList(tools: Tool[]): string {
  if (!tools.length) {
    return '';
  }
  return tools
    .map(tool => `- [${tool.name}](${getToolMarkdownUrl(tool)}) — ${tool.seoDescription || tool.description}`)
    .join('\n');
}

export function renderCategoryMarkdown(data: CategoryData): string {
  const lines: string[] = [];
  lines.push(`# ${data.title}`);
  lines.push('');
  lines.push(`> ${data.summary}`);
  lines.push('');
  // Conversational developer perspective tailored to category
  const catId = data.id;
  if (catId === 'json-tools') {
    lines.push(
      'If you work with APIs, you already know the drill: paste the payload into a JSON formatter for readability, run a JSON validator to catch stray commas, then convert JSON to CSV or XML when someone asks for a spreadsheet. These tools keep that loop fast and local.'
    );
  } else if (catId === 'data-converters') {
    lines.push(
      'Real-world conversions rarely happen once. I often bounce between JSON ⇄ CSV for analysis, or XML ⇄ JSON when bridging older systems. Keeping it client-side avoids uploads, keeps things private, and makes quick checks painless.'
    );
  } else if (catId === 'text-tools') {
    lines.push(
      'From quick regex sanity checks to side-by-side diffs before a PR, these text tools handle the everyday cleanup and comparisons you don’t want to open an IDE for.'
    );
  } else if (catId === 'password-tools') {
    lines.push(
      'Security chores pop up mid‑sprint: generate a strong password, verify a hash, or double‑check a token — all safely in the browser with zero uploads.'
    );
  }
  lines.push('');
  lines.push(`- **HTML:** ${data.htmlUrl}`);
  lines.push(`- **Markdown:** ${data.mdUrl}`);
  lines.push('');

  if (data.keyStats.length) {
    lines.push('**Highlights**');
    data.keyStats.forEach(stat => lines.push(`- ${stat}`));
    lines.push('');
  }

  if (data.featuredTools.length) {
    lines.push('## Featured tools');
    lines.push('');
    lines.push(formatToolsList(data.featuredTools));
    lines.push('');
  }

  if (data.supportingTools.length) {
    lines.push('## Additional tools');
    lines.push('');
    lines.push(formatToolsList(data.supportingTools));
    lines.push('');
  }

  if (data.useCases.length) {
    lines.push('## Typical workflows');
    lines.push('');
    data.useCases.forEach(useCase => lines.push(`- ${useCase}`));
    lines.push('');
  }

  lines.push('**Privacy:** All FreeFormatHub utilities run entirely in the browser—no uploads, telemetry, or storage.');
  lines.push('');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function formatExamples(examples: ToolExample[] | undefined): string {
  if (!examples?.length) {
    return '';
  }
  const subset = examples.slice(0, 3);
  return subset
    .map(example => {
      const snippet = example.description || truncateSnippet(example.input ?? '');
      return `- **${example.title}:** ${snippet}`;
    })
    .join('\n');
}

function formatOptionalToolList(ids: string[] | undefined): string {
  if (!ids?.length) {
    return '';
  }
  const resolved = ids
    .map(id => getToolById(id))
    .filter((tool): tool is Tool => Boolean(tool));
  if (!resolved.length) {
    return '';
  }
  return formatToolsList(resolved);
}

function pickSeoPhrases(tool: Tool): string[] {
  const phrases: string[] = [];
  const id = tool.id.toLowerCase();
  const name = tool.name.toLowerCase();
  const kws = (tool.keywords || []).map(k => k.toLowerCase());

  const has = (token: string) =>
    id.includes(token) || name.includes(token) || kws.some(k => k.includes(token));

  // JSON
  if ((has('json') && has('validator')) || has('json-validator') || has('json schema')) {
    phrases.push('JSON validator');
  }
  if ((has('json') && has('formatter')) || has('json-formatter') || has('beautifier')) {
    phrases.push('JSON formatter');
  }

  // XML
  if ((has('xml') && has('validator')) || has('xml-validator')) {
    phrases.push('XML validator');
  }
  if ((has('xml') && has('formatter')) || has('xml-formatter')) {
    phrases.push('XML formatter');
  }

  // Base64
  if ((has('base64') && has('encoder')) || has('base64-encoder')) {
    phrases.push('Base64 encoder');
  }
  if ((has('base64') && has('decoder')) || has('base64-decoder')) {
    phrases.push('Base64 decoder');
  }

  return Array.from(new Set(phrases));
}

export function renderToolMarkdown(tool: Tool): string {
  const lines: string[] = [];
  lines.push(`# ${tool.name}`);
  lines.push('');
  lines.push(`> ${tool.description}`);
  lines.push('');
  lines.push(`- **Category:** ${tool.category.name}${tool.subcategory ? ` › ${tool.subcategory.name}` : ''}`);
  lines.push(`- **HTML:** ${getToolHtmlUrl(tool)}`);
  lines.push(`- **Markdown:** ${getToolMarkdownUrl(tool)}`);
  lines.push(`- **Keywords:** ${tool.keywords.join(', ')}`);
  lines.push('');

  // Conversational developer note with relevant SEO phrases when applicable
  const phrases = pickSeoPhrases(tool);
  if (phrases.length) {
    const mention = phrases.slice(0, 2).join(' and ');
    lines.push(
      `As a practical workflow, I start with a ${mention} to catch the easy mistakes, then iterate quickly in the same tab. Keeping processing client‑side means you can debug sensitive payloads without leaving the browser.`
    );
    lines.push('');
  } else {
    lines.push(
      'Tip from experience: keep data local while you iterate. Pasting a sample, tweaking options, and seeing results instantly beats context switching to heavier tooling.'
    );
    lines.push('');
  }

  if (tool.useCases.length) {
    lines.push('## Key use cases');
    lines.push('');
    tool.useCases.slice(0, 6).forEach(useCase => lines.push(`- ${useCase}`));
    lines.push('');
  }

  const exampleBlock = formatExamples(tool.examples);
  if (exampleBlock) {
    lines.push('## Quick examples');
    lines.push('');
    lines.push(exampleBlock);
    lines.push('');
  }

  if (tool.howItWorks?.length) {
    lines.push('## How it works');
    lines.push('');
    tool.howItWorks.slice(0, 4).forEach(step => {
      lines.push(`- ${step.title}: ${step.description}`);
    });
    lines.push('');
  }

  if (tool.problemsSolved?.length) {
    lines.push('## Problems solved');
    lines.push('');
    tool.problemsSolved.slice(0, 3).forEach(item => {
      lines.push(`- ${item.problem}\n  - Solution: ${item.solution}`);
    });
    lines.push('');
  }

  if (tool.commonErrors.length) {
    lines.push('## Common mistakes to watch for');
    lines.push('');
    tool.commonErrors.slice(0, 6).forEach(error => lines.push(`- ${error}`));
    lines.push('');
  }

  if (tool.faq.length) {
    lines.push('## FAQ (condensed)');
    lines.push('');
    tool.faq.slice(0, 4).forEach(entry => {
      lines.push(`- **${entry.question}** ${entry.answer}`);
    });
    lines.push('');
  }

  const relatedBlock = formatOptionalToolList(tool.relatedTools);
  if (relatedBlock) {
    lines.push('## Related tools');
    lines.push('');
    lines.push(relatedBlock);
    lines.push('');
  }

  if (tool.whyChoose?.length) {
    lines.push('## Why teams pick this tool');
    lines.push('');
    tool.whyChoose.slice(0, 3).forEach(benefit => {
      lines.push(`- ${benefit.title}: ${benefit.description}`);
    });
    lines.push('');
  }

  lines.push('**Privacy:** Processing happens client-side in your browser. No data is uploaded, logged, or shared.');
  lines.push('');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

export function renderDocMarkdown(doc: DocPageContent): string {
  const lines: string[] = [];
  lines.push(`# ${doc.title}`);
  lines.push('');
  lines.push(`> ${doc.summary}`);
  lines.push('');
  lines.push(`- **HTML:** ${doc.htmlUrl}`);
  lines.push(`- **Markdown:** ${doc.mdUrl}`);
  lines.push('');

  if (doc.highlights.length) {
    lines.push('**Key points**');
    doc.highlights.forEach(point => lines.push(`- ${point}`));
    lines.push('');
  }

  doc.sections.forEach(section => {
    lines.push(`## ${section.heading}`);
    lines.push('');
    section.items.forEach(item => lines.push(`- ${item}`));
    lines.push('');
  });

  if (doc.contact) {
    lines.push(`**Contact:** ${doc.contact}`);
    lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
