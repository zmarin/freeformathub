import type { APIRoute } from 'astro';
import { getCategoryData } from '../../lib/llms/data';
import { renderCategoryMarkdown } from '../../lib/llms/markdown';

export const GET: APIRoute = () => {
  const data = getCategoryData('json-tools');
  const markdown = renderCategoryMarkdown(data);
  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
