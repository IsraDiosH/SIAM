import type { APIRoute } from 'astro';
import { checkInTicket } from '../../../services/checkin.service';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json().catch(() => null);
  const token = payload && typeof payload === 'object' ? String((payload as Record<string, unknown>).token ?? '') : '';
  const checkedById =
    payload && typeof payload === 'object' ? String((payload as Record<string, unknown>).checkedById ?? '') : '';

  if (!token || !checkedById) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: 'Se requieren token y checkedById.',
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  try {
    const result = await checkInTicket(token, checkedById);

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo registrar el check-in.',
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};
