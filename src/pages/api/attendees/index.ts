import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true, module: 'attendees' }), {
    headers: { 'content-type': 'application/json' },
  });
};
