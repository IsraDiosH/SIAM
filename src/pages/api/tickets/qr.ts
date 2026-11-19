import type { APIRoute } from 'astro';
import { generateTicketQrPngBuffer } from '../../../lib/qr';

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';

  if (!token) {
    return new Response('Token requerido', { status: 400 });
  }

  const png = await generateTicketQrPngBuffer(token);

  return new Response(png, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'no-store',
    },
  });
};
