/**
 * Platform-agnostic messaging service interface
 * Abstracts WhatsApp and Telegram messaging capabilities
 */
export interface IMessagingService {
  /**
   * Send a text message to the recipient
   */
  sendMessage(to: string, text: string): Promise<void>;

  /**
   * Send a document (PDF, etc.) to the recipient
   */
  sendDocument(to: string, buffer: Buffer, filename: string, caption?: string): Promise<void>;

  /**
   * Send interactive buttons for user selection
   * @param to Recipient identifier
   * @param bodyText Message body text
   * @param buttons Array of button options (max 3 for WhatsApp, more flexible for Telegram)
   */
  sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: IMessageButton[],
  ): Promise<void>;

  /**
   * Send an interactive list for user selection
   * @param to Recipient identifier
   * @param header Header text
   * @param body Body text
   * @param buttonText Text for the list button
   * @param sections Sections containing rows/options
   */
  sendInteractiveList(
    to: string,
    header: string,
    body: string,
    buttonText: string,
    sections: IMessageSection[],
  ): Promise<void>;

  /**
   * Download media from a message (for image/audio/document handling)
   * @param mediaId The media ID from the incoming message
   * @returns Buffer containing the downloaded media and optional filename
   */
  downloadMedia(mediaId: string): Promise<{ buffer: Buffer; filename?: string }>;
}

export interface IMessageButton {
  id: string;
  title: string;
}

export interface IMessageSection {
  title: string;
  rows: IMessageRow[];
}

export interface IMessageRow {
  id: string;
  title: string;
  description?: string;
}

export const I_MESSAGING_SERVICE = 'I_MESSAGING_SERVICE';
