
export interface IWhatsAppService {
  sendDocument(to: string, pdfBuffer: Buffer, filename: string, caption?: string): Promise<void>;
  sendMessage(to: string, text: string): Promise<void>;
  downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }>;
  sendInteractiveList(
    to: string,
    header: string,
    body: string,
    buttonText: string,
    sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
  ): Promise<void>;
  sendInteractiveButtons(to: string, bodyText: string, buttons: { id: string; title: string }[]): Promise<void>;
}

export const I_WHATSAPP_SERVICE = 'I_WHATSAPP_SERVICE';
