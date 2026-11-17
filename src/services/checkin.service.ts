export async function checkInTicket(token: string, checkedById: string) {
  // TODO: Validar hash del token y bloqueo de reuso.
  return { token, checkedById, accepted: false };
}
