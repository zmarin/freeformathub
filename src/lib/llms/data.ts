import '../tools/index';

import { getAllTools, getTool } from '../tools/registry';
import type { Tool } from '../../types/tool';
import {
  FREEFORMATHUB_BASE_URL,
  LLMS_CATEGORY_IDS,
  type LlmsCategoryId,
  CATEGORY_FEATURED_TOOL_IDS,
  CATEGORY_USE_CASES,
  LLMS_PRIORITY_TOOL_IDS
} from './constants';

export interface CategoryData {
  id: LlmsCategoryId;
  title: string;
  summary: string;
  htmlUrl: string;
  mdUrl: string;
  keyStats: string[];
  featuredTools: Tool[];
  supportingTools: Tool[];
  useCases: string[];
}

const CATEGORY_TITLES: Record<LlmsCategoryId, string> = {
  'json-tools': 'JSON Tools Hub',
  'text-tools': 'Text Processing Hub',
  'data-converters': 'Data Converter Hub',
  'password-tools': 'Password & Security Hub'
};

const CATEGORY_DESCRIPTIONS: Record<LlmsCategoryId, (total: number) => string> = {
  'json-tools': total =>
    `Developer-focused JSON utilities with ${total}+ formatters, validators, and converters that stay client-side for secure API debugging and data prep.`,
  'text-tools': total =>
    `${total}+ text automation helpers for writers, editors, and engineers covering analysis, cleanup, diffing, and generation with zero upload requirements.`,
  'data-converters': total =>
    `${total}+ translators turn raw JSON, CSV, XML, Excel, and media assets into the formats your pipelines expect—no installers or file size limits.`,
  'password-tools': total =>
    `${total}+ security-first utilities for generating, auditing, and managing secrets, hashes, and tokens entirely within the browser session.`
};

function sortByName(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => a.name.localeCompare(b.name));
}

function selectCategoryTools(id: LlmsCategoryId, tools: Tool[]): Tool[] {
  switch (id) {
    case 'json-tools':
      return tools.filter(tool =>
        tool.name.toLowerCase().includes('json') ||
        tool.slug.includes('json') ||
        tool.keywords?.some(keyword => keyword.toLowerCase().includes('json'))
      );
    case 'text-tools':
      return tools.filter(tool =>
        tool.category.id === 'text' ||
        tool.keywords?.some(keyword =>
          ['text', 'word', 'case', 'string', 'character', 'line', 'paragraph'].some(textKeyword =>
            keyword.toLowerCase().includes(textKeyword)
          )
        )
      );
    case 'data-converters':
      return tools.filter(tool =>
        tool.category.id === 'converters' ||
        tool.keywords?.some(keyword =>
          ['convert', 'converter', 'transform', 'format'].some(token =>
            keyword.toLowerCase().includes(token)
          )
        )
      );
    case 'password-tools':
      return tools.filter(tool =>
        tool.category.id === 'crypto' ||
        tool.keywords?.some(keyword =>
          ['password', 'security', 'encryption', 'hash', 'crypto', 'secure'].some(secKeyword =>
            keyword.toLowerCase().includes(secKeyword)
          )
        )
      );
    default:
      return [];
  }
}

function buildCategoryHighlights(id: LlmsCategoryId, total: number): string[] {
  switch (id) {
    case 'json-tools':
      return [
        `${total}+ JSON and schema helpers with offline-first execution.`,
        'JSONC comment stripping, duplicate key detection, and linting options.',
        'One-click conversions for CSV, XML, Excel, and strongly typed TypeScript.'
      ];
    case 'text-tools':
      return [
        `${total}+ text utilities spanning analysis, transforms, diffing, and generation.`,
        'Regex testing, side-by-side diffs, and QA helpers for editorial workflows.',
        'Client-side processing keeps proprietary copy and scripts private.'
      ];
    case 'data-converters':
      return [
        `${total}+ format translators across data, document, and encoding workflows.`,
        'Lossless JSON ⇄ CSV ⇄ XML ⇄ Excel conversion pipelines.',
        'No-upload architecture meets compliance requirements for sensitive datasets.'
      ];
    case 'password-tools':
      return [
        `${total}+ security utilities for passwords, hashes, keys, and tokens.`,
        'Entropy scoring, policy generation, and JWT inspection in-browser.',
        'Zero retention: data never leaves the session, aiding compliance reviews.'
      ];
    default:
      return [];
  }
}

export function getCategoryData(id: LlmsCategoryId): CategoryData {
  const allTools = getAllTools();
  const tools = sortByName(selectCategoryTools(id, allTools));
  const featuredIds = new Set(CATEGORY_FEATURED_TOOL_IDS[id] ?? []);
  const featuredTools = tools.filter(tool => featuredIds.has(tool.id));
  const supportingTools = tools.filter(tool => !featuredIds.has(tool.id)).slice(0, 12);

  return {
    id,
    title: CATEGORY_TITLES[id],
    summary: CATEGORY_DESCRIPTIONS[id](tools.length),
    htmlUrl: `${FREEFORMATHUB_BASE_URL}/${id}`,
    mdUrl: `${FREEFORMATHUB_BASE_URL}/${id}/index.html.md`,
    keyStats: buildCategoryHighlights(id, tools.length),
    featuredTools,
    supportingTools,
    useCases: CATEGORY_USE_CASES[id]
  };
}

export function getPriorityTools(): Tool[] {
  const allTools = getAllTools();
  const toolById = new Map<string, Tool>();
  allTools.forEach(tool => {
    toolById.set(tool.id, tool);
  });
  return LLMS_PRIORITY_TOOL_IDS
    .map(id => toolById.get(id))
    .filter((tool): tool is Tool => Boolean(tool));
}

export function getToolByParams(categoryId: string | undefined, slug: string | undefined): Tool | undefined {
  if (!categoryId || !slug) {
    return undefined;
  }
  return getAllTools().find(tool => tool.category.id === categoryId && tool.slug === slug);
}

export function getToolById(id: string): Tool | undefined {
  return getTool(id);
}

export function getAllLlmsCategoryData(): CategoryData[] {
  return LLMS_CATEGORY_IDS.map(id => getCategoryData(id));
}
