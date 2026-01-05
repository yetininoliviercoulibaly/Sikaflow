
export const I_MESSAGING_PROVIDER = 'I_MESSAGING_PROVIDER';

export interface IMessagingProvider {
  sendMagicLink(phoneNumber: string, link: string): Promise<void>;
}
