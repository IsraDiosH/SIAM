export async function requireAdminSession() {
  // TODO: Integrar Better Auth y resolver usuario autenticado.
  return { userId: 'pending', roles: [] as string[] };
}
