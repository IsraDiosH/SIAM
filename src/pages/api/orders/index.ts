import type { APIRoute } from 'astro';
import { createRegistrationOrder } from '../../../services/order.service';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true, module: 'orders' }), {
    headers: { 'content-type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const acceptsJson = request.headers.get('accept')?.includes('application/json');
  const formData = await request.formData();

  const category = String(formData.get('category') ?? '').toLowerCase();
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const institution = String(formData.get('institution') ?? '').trim();
  const registrationNumber = String(formData.get('registrationNumber') ?? '').trim();
  const needsInvoice = String(formData.get('needsInvoice') ?? 'false') === 'true';

  const profileData: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('profile_')) continue;
    profileData[key.replace('profile_', '')] = String(value ?? '').trim();
  }

  try {
    const order = await createRegistrationOrder({
      category: category as 'estudiante' | 'residente' | 'medico',
      firstName,
      lastName,
      email,
      phone,
      institution,
      registrationNumber: registrationNumber || undefined,
      needsInvoice,
      profileData,
    });

    if (acceptsJson) {
      return new Response(JSON.stringify({ ok: true, ...order }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return Response.redirect(order.checkoutUrl, 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la orden.';

    if (!acceptsJson) {
      const safeMessage = encodeURIComponent(message);
      const redirectUrl = new URL(`/registro?form_error=${safeMessage}`, request.url);
      return Response.redirect(redirectUrl.toString(), 303);
    }

    return new Response(
      JSON.stringify({
        ok: false,
        message,
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};
