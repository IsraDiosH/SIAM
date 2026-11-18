import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { hashTicketToken } from '../../../lib/qr';

function buildValidationResponse(token: string) {
  const codeHash = hashTicketToken(token);

  return prisma.ticket.findUnique({
    where: { codeHash },
    include: {
      order: {
        include: {
          attendee: true,
          event: true,
        },
      },
      checkIn: true,
    },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';

  if (!token) {
    return new Response(JSON.stringify({ ok: false, message: 'Token requerido.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const ticket = await buildValidationResponse(token);

  if (!ticket) {
    return new Response(JSON.stringify({ ok: false, valid: false, reason: 'INVALID_TOKEN' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      valid: ticket.status === 'VALID',
      status: ticket.status,
      attendee: {
        name: `${ticket.order.attendee.firstName} ${ticket.order.attendee.lastName}`,
        email: ticket.order.attendee.email,
      },
      event: ticket.order.event.name,
      checkedAt: ticket.checkIn?.checkedAt ?? null,
    }),
    { headers: { 'content-type': 'application/json' } }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json().catch(() => null);
  const token = payload && typeof payload === 'object' ? String((payload as Record<string, unknown>).token ?? '') : '';

  if (!token) {
    return new Response(JSON.stringify({ ok: false, message: 'Token requerido.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const ticket = await buildValidationResponse(token);

  if (!ticket) {
    return new Response(JSON.stringify({ ok: false, valid: false, reason: 'INVALID_TOKEN' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      valid: ticket.status === 'VALID',
      status: ticket.status,
      attendee: {
        name: `${ticket.order.attendee.firstName} ${ticket.order.attendee.lastName}`,
        email: ticket.order.attendee.email,
      },
      event: ticket.order.event.name,
      checkedAt: ticket.checkIn?.checkedAt ?? null,
    }),
    { headers: { 'content-type': 'application/json' }
    }
  );
};
