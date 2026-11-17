export async function issueTicketForOrder(orderId: string) {
  // TODO: Implementar emision idempotente de boleto.
  return { orderId, issued: false };
}
