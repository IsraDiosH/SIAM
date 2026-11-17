import crypto from 'node:crypto';
import QRCode from 'qrcode';

export function hashTicketToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function generateTicketQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
  });
}
