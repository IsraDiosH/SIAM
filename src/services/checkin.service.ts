import { TicketStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashTicketToken } from '../lib/qr';

export async function checkInTicket(token: string, checkedById: string) {
  const tokenHash = hashTicketToken(token);

  const ticket = await prisma.ticket.findUnique({
    where: { codeHash: tokenHash },
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

  if (!ticket) {
    return { accepted: false, reason: 'INVALID_TOKEN' as const };
  }

  if (ticket.status !== TicketStatus.VALID) {
    return { accepted: false, reason: 'TICKET_NOT_VALID' as const };
  }

  if (ticket.checkIn) {
    return {
      accepted: false,
      reason: 'ALREADY_CHECKED_IN' as const,
      checkedAt: ticket.checkIn.checkedAt,
    };
  }

  const checkIn = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.USED },
    });

    return tx.checkIn.create({
      data: {
        ticketId: ticket.id,
        checkedById,
      },
    });
  });

  return {
    accepted: true,
    checkInId: checkIn.id,
    attendee: {
      name: `${ticket.order.attendee.firstName} ${ticket.order.attendee.lastName}`,
      email: ticket.order.attendee.email,
    },
    event: ticket.order.event.name,
    checkedAt: checkIn.checkedAt,
  };
}
