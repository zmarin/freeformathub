import type { APIRoute, GetStaticPaths } from 'astro';
import { getPriorityTools, getToolByParams } from '../../../lib/llms/data';
import { renderToolMarkdown } from '../../../lib/llms/markdown';

export const getStaticPaths: GetStaticPaths = () => {
  const tools = getPriorityTools();
  return tools.map(tool => ({
    params: {
      category: tool.category.id,
      slug: tool.slug
    }
  }));
};

export const GET: APIRoute = ({ params }) => {
  const tool = getToolByParams(params.category, params.slug);
  if (!tool) {
    return new Response('Not found', { status: 404 });
  }
  const markdown = renderToolMarkdown(tool);
  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
