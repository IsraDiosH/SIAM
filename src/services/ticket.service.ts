import crypto from 'node:crypto';
import { TicketStatus } from '@prisma/client';
import { sendTicketEmail } from '../lib/email';
import { prisma } from '../lib/prisma';
import { generateTicketQrDataUrl, hashTicketToken } from '../lib/qr';

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
  const qrDataUrl = await generateTicketQrDataUrl(validateUrl);

  await sendTicketEmail({
    to: order.attendee.email,
    attendeeName: `${order.attendee.firstName} ${order.attendee.lastName}`,
    eventName: order.event.name,
    qrDataUrl,
    ticketToken: token,
  });

  return {
    orderId,
    ticketId: ticket.id,
    issued: true,
  };
}
