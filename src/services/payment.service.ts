import { PaymentStatus, Prisma } from '@prisma/client';
import { getPaymentById } from '../lib/mercadopago';
import { prisma } from '../lib/prisma';
import { issueTicketForOrder } from './ticket.service';

function mapMercadoPagoStatus(status: string): PaymentStatus {
  if (status === 'approved') return PaymentStatus.APPROVED;
  if (status === 'rejected') return PaymentStatus.REJECTED;
  if (status === 'cancelled') return PaymentStatus.CANCELLED;
  if (status === 'refunded' || status === 'charged_back') return PaymentStatus.REFUNDED;
  if (status === 'in_process' || status === 'pending' || status === 'authorized') return PaymentStatus.PENDING;
  return PaymentStatus.PENDING;
}

function mapOrderStatus(status: PaymentStatus): 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED' {
  if (status === PaymentStatus.APPROVED) return 'PAID';
  if (status === PaymentStatus.REFUNDED) return 'REFUNDED';
  if (status === PaymentStatus.CANCELLED || status === PaymentStatus.REJECTED) return 'CANCELLED';
  return 'PENDING';
}

export async function verifyPaymentWithProvider(providerPaymentId: string) {
  const payment = await getPaymentById(providerPaymentId);
  const externalReference = payment.external_reference ?? String(payment.metadata?.orderId ?? '');

  if (!externalReference) {
    throw new Error('No se encontro external_reference para conciliar el pago.');
  }

  const order = await prisma.order.findUnique({
    where: { id: externalReference },
    include: {
      attendee: true,
      ticketType: true,
      payments: true,
      ticket: true,
    },
  });

  if (!order) {
    throw new Error(`No se encontro la orden ${externalReference} para el pago ${providerPaymentId}.`);
  }

  const providerStatus = mapMercadoPagoStatus(payment.status);
  const orderStatus = mapOrderStatus(providerStatus);
  const amount = new Prisma.Decimal(payment.transaction_amount ?? 0);
  const amountMatches = amount.toFixed(2) === order.amount.toFixed(2);
  const currencyMatches = (payment.currency_id || 'MXN').toUpperCase() === order.currency.toUpperCase();

  if (providerStatus === PaymentStatus.APPROVED && (!amountMatches || !currencyMatches)) {
    throw new Error(
      `Pago ${providerPaymentId} con importe/moneda invalido. Esperado ${order.amount.toFixed(2)} ${order.currency}, recibido ${amount.toFixed(2)} ${payment.currency_id || 'MXN'}.`
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const paymentRecord = await tx.payment.upsert({
      where: { providerPaymentId },
      update: {
        orderId: order.id,
        status: providerStatus,
        amount,
        currency: payment.currency_id || 'MXN',
        providerRaw: payment as unknown as Prisma.JsonObject,
        verifiedAt: new Date(),
      },
      create: {
        orderId: order.id,
        providerPaymentId,
        status: providerStatus,
        amount,
        currency: payment.currency_id || 'MXN',
        idempotencyKey: `mp-${providerPaymentId}`,
        metadata: {
          externalReference,
          statusDetail: payment.status_detail,
        },
        providerRaw: payment as unknown as Prisma.JsonObject,
        verifiedAt: new Date(),
      },
    });

    const orderRecord = await tx.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        paidAt: providerStatus === PaymentStatus.APPROVED ? new Date() : null,
      },
    });

    return { payment: paymentRecord, order: orderRecord };
  });

  if (providerStatus === PaymentStatus.APPROVED) {
    await issueTicketForOrder(order.id);
  }

  return {
    providerPaymentId,
    providerStatus,
    orderId: order.id,
    orderStatus: updated.order.status,
    amountMatches,
    currencyMatches,
  };
}

export async function confirmPaymentById(providerPaymentId: string) {
  return verifyPaymentWithProvider(providerPaymentId);
}
