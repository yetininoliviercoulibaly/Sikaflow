export interface IPaymentProvider {
  /**
   * Creates a payment link for the given amount
   * @returns URL to redirect user for payment
   */
  createPaymentLink(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<string>;

  /**
   * Verifies if a payment was successful
   * @param reference Payment reference or session ID
   */
  verifyPayment(reference: string): Promise<boolean>;
}

export const PAYMENT_PROVIDER_TOKEN = Symbol('PAYMENT_PROVIDER');
