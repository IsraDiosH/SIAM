import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json().catch(() => null);

  return new Response(JSON.stringify({ ok: true, module: 'check-in', payload }), {
    headers: { 'content-type': 'application/json' },
  });
};
