import crypto from 'node:crypto';

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

export type MercadoPagoPreferenceInput = {
  title: string;
  unitPrice: number;
  quantity?: number;
  payerEmail: string;
  externalReference: string;
  notificationUrl?: string;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
  metadata?: Record<string, unknown>;
};

export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  transaction_amount: number;
  currency_id: string;
  external_reference?: string;
  metadata?: Record<string, unknown>;
};

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no esta configurado.');
  }

  return token;
}

async function mercadoPagoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${MERCADO_PAGO_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mercado Pago error (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as T;
}

export function buildMercadoPagoIdempotencyKey(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

export async function createCheckoutPreference(input: MercadoPagoPreferenceInput): Promise<{
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}> {
  const quantity = input.quantity ?? 1;

  const body = {
    items: [
      {
        title: input.title,
        quantity,
        currency_id: 'MXN',
        unit_price: input.unitPrice,
      },
    ],
    payer: {
      email: input.payerEmail,
    },
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    back_urls: input.backUrls,
    metadata: input.metadata,
  };

  const data = await mercadoPagoRequest<{
    id: string;
    init_point: string;
    sandbox_init_point: string;
  }>('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    id: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

export async function getPaymentById(paymentId: string): Promise<MercadoPagoPayment> {
  return mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${paymentId}`, {
    method: 'GET',
  });
}
