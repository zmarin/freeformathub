import type { APIRoute } from 'astro';
import { getDocPage } from '../../lib/llms/docs';
import { renderDocMarkdown } from '../../lib/llms/markdown';

export const GET: APIRoute = () => {
  const doc = getDocPage('terms');
  if (!doc) {
    return new Response('Not found', { status: 404 });
  }
  const markdown = renderDocMarkdown(doc);
  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
};
