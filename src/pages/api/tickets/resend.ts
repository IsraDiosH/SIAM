import type { APIRoute } from 'astro';
import { resendTicketForOrder } from '../../../services/ticket.service';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json().catch(() => null);
  const orderId = payload && typeof payload === 'object' ? String((payload as Record<string, unknown>).orderId ?? '') : '';

  if (!orderId) {
    return new Response(JSON.stringify({ ok: false, message: 'orderId es requerido.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const result = await resendTicketForOrder(orderId);
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo reenviar el ticket.',
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};
