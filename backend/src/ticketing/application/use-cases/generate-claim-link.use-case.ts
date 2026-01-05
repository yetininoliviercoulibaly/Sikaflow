
import { Injectable, Inject, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IEventRepository, I_EVENT_REPOSITORY } from '../../domain/ports/event.repository.interface';
import { ITicketClaimRepository, I_TICKET_CLAIM_REPOSITORY } from '../../domain/ports/ticket-claim.repository.interface';
import { TicketClaim } from '../../domain/ticket-claim.entity';
import * as crypto from 'crypto';

@Injectable()
export class GenerateClaimLinkUseCase {
  private readonly logger = new Logger(GenerateClaimLinkUseCase.name);

  constructor(
    @Inject(I_EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    @Inject(I_TICKET_CLAIM_REPOSITORY) private readonly claimRepository: ITicketClaimRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(eventId: string, organizationId: string, quantity: number): Promise<TicketClaim[]> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    return await this.em.transactional(async (em) => {
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
          throw new Error('Event not found');
        }

        if (event.organizationId !== organizationId) {
            throw new Error('Unauthorized Access to Event');
        }

        if (!event.canSell(quantity)) {
           throw new Error(`Insufficient capacity. Remaining: ${event.getRemainingCapacity()}`);
        }

        event.incrementSold(quantity);
        await this.eventRepository.save(event);

        const claims: TicketClaim[] = [];
        
        for (let i = 0; i < quantity; i++) {
            let token: string;
            let isUnique = false;
            let attempts = 0;

            // Retry loop for uniqueness
            while (!isUnique && attempts < 5) {
                token = this.generateSecureToken();
                const existing = await this.claimRepository.findByToken(token);
                if (!existing) {
                    isUnique = true;
                } else {
                    attempts++;
                }
            }

            if (!isUnique) {
                throw new Error('Failed to generate unique claim token after multiple attempts.');
            }

            // Safe to assume token is defined here if isUnique is true
            const claim = new TicketClaim(eventId, token!, organizationId);
            claims.push(claim);
            await this.claimRepository.save(claim);
        }
        
        this.logger.log(`Generated ${quantity} claims for event ${eventId}`);
        return claims;
    });
  }

  private generateSecureToken(length: number = 12): string {
    // Generates a URL-friendly secure token (Base64URL-ish)
    // 9 bytes => 12 Base64 characters approx
    return 'TK-' + crypto.randomBytes(9).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
  }
}
