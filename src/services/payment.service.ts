export async function verifyPaymentWithProvider(providerPaymentId: string) {
  // TODO: Consultar API oficial de Mercado Pago y validar estado/monto.
  return { providerPaymentId, status: 'PENDING' as const };
}
