import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventPass, PassStatus } from '../../domain/event-pass.entity';
import { IEventPassRepository, I_EVENT_PASS_REPOSITORY } from '../../domain/ports/event-pass.repository.interface';
import { IPaymentProvider, PAYMENT_PROVIDER_TOKEN } from '../../../payment/domain/ports/payment-provider.interface';
import { IOrganizationRepository, I_ORGANIZATION_REPOSITORY } from '../../../organization/domain/ports/organization.repository.interface';

export interface ActivateEventPassCommand {
  organizationId: string;
  paymentReference?: string; // If provided, means payment is confirmed
}

export interface ActivateEventPassResult {
  success: boolean;
  message: string;
  paymentUrl?: string;
  pass?: EventPass;
}

@Injectable()
export class ActivateEventPassUseCase {
  private readonly PASS_DURATION_HOURS = 48;
  private readonly PASS_PRICE_XOF = 15000; // FCFA
  private readonly PASS_PRICE_CAD = 25; // CAD

  constructor(
    @Inject(I_EVENT_PASS_REPOSITORY)
    private readonly eventPassRepository: IEventPassRepository,
    @Inject(PAYMENT_PROVIDER_TOKEN)
    private readonly paymentProvider: IPaymentProvider,
    @Inject(I_ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(command: ActivateEventPassCommand): Promise<ActivateEventPassResult> {
    const { organizationId, paymentReference } = command;

    // 1. Check for existing active pass
    const existingPass = await this.eventPassRepository.findActiveForOrganization(organizationId);
    if (existingPass) {
      const remainingHours = Math.round(existingPass.getRemainingHours());
      return {
        success: true,
        message: `✅ Vous avez déjà un pass actif! Temps restant: ${remainingHours}h`,
        pass: existingPass,
      };
    }

    // 2. If payment reference provided, confirm and activate
    if (paymentReference) {
      const isValid = await this.paymentProvider.verifyPayment(paymentReference);
      if (!isValid) {
        return {
          success: false,
          message: '❌ Le paiement n\'a pas pu être vérifié. Veuillez réessayer.',
        };
      }

      const now = new Date();
      const validUntil = new Date(now.getTime() + this.PASS_DURATION_HOURS * 60 * 60 * 1000);

      const newPass = new EventPass(
        uuidv4(),
        organizationId,
        now,
        validUntil,
        PassStatus.ACTIVE,
        paymentReference,
        now,
      );

      await this.eventPassRepository.create(newPass);

      return {
        success: true,
        message: `🎫 Pass Événement activé! Valide jusqu'au ${validUntil.toLocaleString('fr-FR')}`,
        pass: newPass,
      };
    }

    // 3. No payment yet - generate payment link
    const organization = await this.organizationRepository.findById(organizationId);
    const currency = process.env.PAYMENT_REGION === 'AFRICA' ? 'XOF' : 'CAD';
    const amount = currency === 'XOF' ? this.PASS_PRICE_XOF : this.PASS_PRICE_CAD;

    const paymentUrl = await this.paymentProvider.createPaymentLink(amount, currency, {
      organizationId,
      organizationName: organization?.name || 'Organisation',
      type: 'event_pass_48h',
    });

    return {
      success: false,
      message: `🎫 Pass Événement 48h - ${amount} ${currency}\n\n👉 Cliquez ici pour payer: ${paymentUrl}\n\nAprès paiement, renvoyez "Confirmer pass" ou le numéro de référence.`,
      paymentUrl,
    };
  }
}
