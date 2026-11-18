import type { APIRoute } from 'astro';
import { confirmPaymentById } from '../../../services/payment.service';

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const configuredSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const receivedSecret = url.searchParams.get('secret');

  if (configuredSecret && receivedSecret !== configuredSecret) {
    return new Response(JSON.stringify({ ok: false, message: 'Webhook no autorizado.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const rawBody = await request.text();
  const body = rawBody
    ? await (async () => {
        try {
          return JSON.parse(rawBody) as Record<string, unknown>;
        } catch {
          return null;
        }
      })()
    : null;

  const topic =
    url.searchParams.get('topic') ||
    url.searchParams.get('type') ||
    (body ? String(body.type ?? '') : '');

  const paymentIdFromQuery =
    url.searchParams.get('data.id') ||
    url.searchParams.get('id') ||
    url.searchParams.get('resource.id');
  const paymentIdFromBody =
    body
      ? String(
          (body.data as Record<string, unknown> | undefined)?.id ?? body.id ?? ''
        )
      : '';

  const providerPaymentId = paymentIdFromQuery || paymentIdFromBody;

  if (topic !== 'payment' || !providerPaymentId) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const result = await confirmPaymentById(providerPaymentId);

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo procesar el pago.',
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};
