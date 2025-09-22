import type { APIRoute } from 'astro';
import { buildLlmsManifest } from '../lib/llms/manifest';

export const GET: APIRoute = () => {
  const body = buildLlmsManifest();
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
