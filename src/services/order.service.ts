import { AttendeeType, EventStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { createCheckoutPreference } from '../lib/mercadopago';
import { prisma } from '../lib/prisma';

const CATEGORY_MAP = {
  estudiante: {
    label: 'Estudiante',
    attendeeType: AttendeeType.STUDENT,
    amount: 650,
  },
  residente: {
    label: 'Residente',
    attendeeType: AttendeeType.RESIDENT,
    amount: 850,
  },
  medico: {
    label: 'Medico',
    attendeeType: AttendeeType.DOCTOR,
    amount: 1100,
  },
} as const;

const registrationSchema = z.object({
  category: z.enum(['estudiante', 'residente', 'medico']),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email(),
  phone: z.string().min(8),
  institution: z.string().min(2),
  registrationNumber: z.string().optional(),
  needsInvoice: z.coerce.boolean().default(false),
  profileData: z.record(z.string(), z.string()).default({}),
});

export type RegistrationInput = z.input<typeof registrationSchema>;

async function getOrCreateEvent() {
  const existing = await prisma.event.findFirst({
    where: { slug: 'fiam-congress-2027' },
  });

  if (existing) {
    return existing;
  }

  return prisma.event.create({
    data: {
      name: 'FIAM Congress 2027',
      slug: 'fiam-congress-2027',
      description: 'Evento principal de FIAM Congress',
      location: 'Monterrey, Nuevo Leon',
      startsAt: new Date('2027-06-20T08:00:00.000Z'),
      endsAt: new Date('2027-06-22T20:00:00.000Z'),
      status: EventStatus.PUBLISHED,
    },
  });
}

async function getOrCreateTicketType(eventId: string, category: keyof typeof CATEGORY_MAP) {
  const categoryData = CATEGORY_MAP[category];
  const existing = await prisma.ticketType.findFirst({
    where: {
      eventId,
      name: categoryData.label,
    },
  });

  if (existing) {
    return prisma.ticketType.update({
      where: { id: existing.id },
      data: {
        price: new Prisma.Decimal(categoryData.amount),
        currency: 'MXN',
        isActive: true,
      },
    });
  }

  return prisma.ticketType.create({
    data: {
      eventId,
      name: categoryData.label,
      description: `Inscripcion ${categoryData.label} FIAM Congress 2027`,
      price: new Prisma.Decimal(categoryData.amount),
      currency: 'MXN',
      capacity: 5000,
      isActive: true,
    },
  });
}

function normalizeProfileData(profileData: Record<string, string>) {
  const entries = Object.entries(profileData).filter(([, value]) => value.trim().length > 0);
  return Object.fromEntries(entries);
}

export async function createRegistrationOrder(input: RegistrationInput) {
  const parsed = registrationSchema.parse(input);
  const event = await getOrCreateEvent();
  const ticketType = await getOrCreateTicketType(event.id, parsed.category);
  const categoryData = CATEGORY_MAP[parsed.category];

  const attendee = await prisma.attendee.upsert({
    where: {
      eventId_email: {
        eventId: event.id,
        email: parsed.email,
      },
    },
    update: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      phone: parsed.phone,
      institution: parsed.institution,
      registrationNumber: parsed.registrationNumber,
      type: categoryData.attendeeType,
      needsInvoice: parsed.needsInvoice,
      profileData: normalizeProfileData(parsed.profileData),
    },
    create: {
      eventId: event.id,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      institution: parsed.institution,
      registrationNumber: parsed.registrationNumber,
      type: categoryData.attendeeType,
      needsInvoice: parsed.needsInvoice,
      profileData: normalizeProfileData(parsed.profileData),
    },
  });

  const order = await prisma.order.create({
    data: {
      eventId: event.id,
      attendeeId: attendee.id,
      ticketTypeId: ticketType.id,
      amount: new Prisma.Decimal(categoryData.amount),
      currency: 'MXN',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
    include: {
      attendee: true,
      ticketType: true,
    },
  });

  const publicSiteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
  const notificationUrl = process.env.MERCADOPAGO_WEBHOOK_URL;

  const preference = await createCheckoutPreference({
    title: `FIAM Congress 2027 - ${ticketType.name}`,
    unitPrice: Number(order.amount),
    quantity: 1,
    payerEmail: attendee.email,
    externalReference: order.id,
    notificationUrl,
    backUrls: {
      success: `${publicSiteUrl}/registro?payment=success`,
      pending: `${publicSiteUrl}/registro?payment=pending`,
      failure: `${publicSiteUrl}/registro?payment=failure`,
    },
    metadata: {
      orderId: order.id,
      attendeeId: attendee.id,
      category: parsed.category,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      status: 'PENDING',
      amount: order.amount,
      currency: 'MXN',
      idempotencyKey: `pref-${preference.id}`,
      metadata: {
        preferenceId: preference.id,
      },
    },
  });

  return {
    orderId: order.id,
    category: parsed.category,
    amount: Number(order.amount),
    checkoutUrl: preference.initPoint,
    sandboxCheckoutUrl: preference.sandboxInitPoint,
  };
}

export async function listRecentOrders(eventId: string) {
  return prisma.order.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getRegistrationRevenueSummary() {
  const event = await prisma.event.findFirst({
    where: { slug: 'fiam-congress-2027' },
  });

  if (!event) {
    return {
      totalPaid: 0,
      totalOrders: 0,
      byType: [],
    };
  }

  const paidOrders = await prisma.order.findMany({
    where: {
      eventId: event.id,
      status: 'PAID',
    },
    include: {
      attendee: true,
    },
  });

  const byTypeMap = new Map<string, { type: string; count: number; amount: number }>();
  let totalPaid = 0;

  for (const order of paidOrders) {
    const key = order.attendee.type;
    const current = byTypeMap.get(key) ?? { type: key, count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(order.amount);
    byTypeMap.set(key, current);
    totalPaid += Number(order.amount);
  }

  return {
    totalPaid,
    totalOrders: paidOrders.length,
    byType: Array.from(byTypeMap.values()),
  };
}
