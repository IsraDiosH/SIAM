import { prisma } from '../lib/prisma';

export async function getPublishedEvents() {
  return prisma.event.findMany({ where: { status: 'PUBLISHED' } });
}
