import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY ?? 'missing-key');

type SendTicketEmailInput = {
	to: string;
	attendeeName: string;
	eventName: string;
	qrDataUrl: string;
	ticketToken: string;
};

export async function sendTicketEmail(input: SendTicketEmailInput) {
	const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'noreply@fiamcongress.com';

	if (!process.env.RESEND_API_KEY) {
		console.warn('RESEND_API_KEY no esta configurado. Se omite envio real de correo.');
		return { skipped: true };
	}

	return resend.emails.send({
		from: fromAddress,
		to: input.to,
		subject: `Tu acceso a ${input.eventName}`,
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
				<h1 style="margin-bottom: 8px;">Acceso confirmado</h1>
				<p>Hola ${input.attendeeName}, tu pago fue validado y este es tu codigo QR de acceso.</p>
				<p style="margin: 20px 0;"><img src="${input.qrDataUrl}" alt="QR de acceso" width="280" height="280" /></p>
				<p>Conserva este codigo y presentalo en el check-in.</p>
				<p><strong>Token de respaldo:</strong> ${input.ticketToken}</p>
			</div>
		`,
	});
}
