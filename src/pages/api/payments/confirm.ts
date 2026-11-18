import type { APIRoute } from 'astro';
import { confirmPaymentById } from '../../../services/payment.service';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json().catch(() => null);
  const paymentId = payload && typeof payload === 'object' ? String((payload as Record<string, unknown>).paymentId ?? '') : '';

  if (!paymentId) {
    return new Response(JSON.stringify({ ok: false, message: 'paymentId es requerido.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const result = await confirmPaymentById(paymentId);
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo confirmar el pago.',
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};
