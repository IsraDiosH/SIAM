import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true, module: 'auth', status: 'pending' }), {
    headers: { 'content-type': 'application/json' },
  });
};
