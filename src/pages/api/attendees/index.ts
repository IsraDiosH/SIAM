import type { APIRoute } from 'astro';
import { getRegistrationRevenueSummary } from '../../../services/order.service';

export const GET: APIRoute = async () => {
  const summary = await getRegistrationRevenueSummary();

  return new Response(JSON.stringify({ ok: true, module: 'attendees', summary }), {
    headers: { 'content-type': 'application/json' },
  });
};
