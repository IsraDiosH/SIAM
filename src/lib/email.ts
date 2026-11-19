import { Resend } from 'resend';

type SendTicketEmailInput = {
	to: string;
	attendeeName: string;
	eventName: string;
	qrPngBase64: string;
	qrImageUrl: string;
	validateUrl: string;
	ticketToken: string;
};

export async function sendTicketEmail(input: SendTicketEmailInput) {
	const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'noreply@fiamcongress.com';
	const apiKey = process.env.RESEND_API_KEY;

	if (!apiKey) {
		console.warn('RESEND_API_KEY no esta configurado. Se omite envio real de correo.');
		return { skipped: true };
	}

	const resend = new Resend(apiKey);

	return resend.emails.send({
		from: fromAddress,
		to: input.to,
		subject: `Tu acceso a ${input.eventName}`,
		attachments: [
			{
				filename: 'ticket-qr.png',
				content: input.qrPngBase64,
				contentType: 'image/png',
				contentId: 'ticket-qr',
			},
		],
		html: `
			<div style="background:#f3f3f1; padding: 28px 16px; font-family: Arial, sans-serif; color:#102228;">
				<div style="max-width:640px; margin:0 auto; border-radius:20px; overflow:hidden; box-shadow:0 14px 34px rgba(21,61,64,0.14); background:#ffffff; border:1px solid #d7ddd9;">
					<div style="padding:18px 22px; background:linear-gradient(135deg,#153d40,#28666a); color:#ffffff;">
						<p style="margin:0; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; opacity:0.9;">Pase digital</p>
						<h1 style="margin:10px 0 4px; font-size:28px; line-height:1.1;">Acceso confirmado</h1>
						<p style="margin:0; font-size:14px; opacity:0.9;">${input.eventName}</p>
					</div>

					<div style="padding:22px;">
						<p style="margin:0 0 12px; font-size:15px; line-height:1.6;">Hola <strong>${input.attendeeName}</strong>, tu pago fue validado. Este es tu boleto oficial con codigo QR para acceso al evento.</p>

						<div style="margin:18px 0; border:1px dashed #b6c5c4; border-radius:14px; padding:14px; background:#f8faf9;">
							<p style="margin:0 0 10px; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#28666a; font-weight:700;">Codigo QR de acceso</p>
							<img src="cid:ticket-qr" alt="QR de acceso" width="280" height="280" style="display:block; max-width:100%; border:1px solid #e3e7e7; border-radius:10px; margin:0 auto; background:#fff;" />
						</div>

						<div style="margin:14px 0; border-radius:12px; padding:12px 14px; background:#eef4f3; border:1px solid #d6e0de;">
							<p style="margin:0 0 6px; font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#28666a; font-weight:700;">Token de respaldo</p>
							<p style="margin:0; font-size:14px; word-break:break-all;"><strong>${input.ticketToken}</strong></p>
						</div>

						<p style="margin:16px 0 8px; font-size:14px; line-height:1.6;">Presenta este pase en check-in. Te recomendamos llevarlo también en captura de pantalla.</p>
						<p style="margin:0; font-size:13px; line-height:1.6;">Si no ves el QR, usa este enlace de validacion: <a href="${input.validateUrl}" style="color:#153d40; font-weight:700;">validar acceso</a></p>
						<p style="margin:6px 0 0; font-size:13px; line-height:1.6;">Imagen directa del QR: <a href="${input.qrImageUrl}" style="color:#153d40; font-weight:700;">ver QR</a></p>
					</div>
				</div>

				<p style="max-width:640px; margin:12px auto 0; font-size:12px; color:#5f7077; text-align:center;">Comite organizador FIAMUDCT 2027</p>
			</div>
		`,
	});
}
