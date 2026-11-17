import { MercadoPagoConfig } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn('MERCADOPAGO_ACCESS_TOKEN no esta configurado.');
}

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: accessToken ?? 'missing-token',
});
