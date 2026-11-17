import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();

  return new Response(
    JSON.stringify({
      ok: true,
      module: 'payments',
      received: Boolean(body),
    }),
    { headers: { 'content-type': 'application/json' } }
  );
};
