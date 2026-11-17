import { prisma } from '../lib/prisma';

export async function listRecentOrders(eventId: string) {
  return prisma.order.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
