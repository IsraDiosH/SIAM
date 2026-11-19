import crypto from 'node:crypto';
import { TicketStatus } from '@prisma/client';
import { sendTicketEmail } from '../lib/email';
import { prisma } from '../lib/prisma';
import { generateTicketQrPngBuffer, hashTicketToken } from '../lib/qr';

export async function issueTicketForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      attendee: true,
      event: true,
      ticket: true,
    },
  });

  if (!order) {
    throw new Error(`No se encontro la orden ${orderId}.`);
  }

  if (order.status !== 'PAID') {
    return { orderId, issued: false, reason: 'ORDER_NOT_PAID' as const };
  }

  if (order.ticket) {
    return { orderId, issued: false, reason: 'TICKET_ALREADY_EXISTS' as const };
  }

  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashTicketToken(token);

  const ticket = await prisma.ticket.create({
    data: {
      orderId,
      codeHash: tokenHash,
      status: TicketStatus.VALID,
    },
  });

  const publicSiteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
  const validateUrl = `${publicSiteUrl}/api/tickets/validate?token=${encodeURIComponent(token)}`;
  const qrImageUrl = `${publicSiteUrl}/api/tickets/qr?token=${encodeURIComponent(token)}`;
  const qrPngBase64 = (await generateTicketQrPngBuffer(validateUrl)).toString('base64');

  await sendTicketEmail({
    to: order.attendee.email,
    attendeeName: `${order.attendee.firstName} ${order.attendee.lastName}`,
    eventName: order.event.name,
    qrPngBase64,
    qrImageUrl,
    validateUrl,
    ticketToken: token,
  });

  return {
    orderId,
    ticketId: ticket.id,
    issued: true,
  };
}

export async function resendTicketForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      attendee: true,
      event: true,
      ticket: {
        include: {
          checkIn: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error(`No se encontro la orden ${orderId}.`);
  }

  if (order.status !== 'PAID') {
    throw new Error('La orden no esta pagada. No se puede reenviar el ticket.');
  }

  if (!order.ticket) {
    return issueTicketForOrder(orderId);
  }

  if (order.ticket.checkIn) {
    throw new Error('El ticket ya fue utilizado en check-in y no puede regenerarse.');
  }

  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashTicketToken(token);

  await prisma.ticket.update({
    where: { id: order.ticket.id },
    data: {
      codeHash: tokenHash,
      status: TicketStatus.VALID,
    },
  });

  const publicSiteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
  const validateUrl = `${publicSiteUrl}/api/tickets/validate?token=${encodeURIComponent(token)}`;
  const qrImageUrl = `${publicSiteUrl}/api/tickets/qr?token=${encodeURIComponent(token)}`;
  const qrPngBase64 = (await generateTicketQrPngBuffer(validateUrl)).toString('base64');

  await sendTicketEmail({
    to: order.attendee.email,
    attendeeName: `${order.attendee.firstName} ${order.attendee.lastName}`,
    eventName: order.event.name,
    qrPngBase64,
    qrImageUrl,
    validateUrl,
    ticketToken: token,
  });

  return {
    orderId,
    ticketId: order.ticket.id,
    resent: true,
  };
}
