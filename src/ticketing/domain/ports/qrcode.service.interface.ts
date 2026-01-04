
export interface IQRCodeService {
  generateQRCode(data: string): Promise<Buffer>;
  generateSignedPayload(ticketId: string): string;
  verifySignedPayload(token: string): string | null; // Returns ticketId or null
}

export const I_QRCODE_SERVICE = 'I_QRCODE_SERVICE';
