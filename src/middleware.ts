import type { MiddlewareHandler } from 'astro';

const adminPrefix = '/dashboard';

export const onRequest: MiddlewareHandler = async (context, next) => {
  if (context.url.pathname.startsWith(adminPrefix)) {
    // TODO: Validar sesion y roles por evento con Better Auth.
  }

  return next();
};
