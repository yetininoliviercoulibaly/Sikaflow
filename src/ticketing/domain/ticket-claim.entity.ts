import { v4 as uuidv4 } from 'uuid';

export enum TicketClaimStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
}

export class TicketClaim {
  id: string = uuidv4();
  eventId: string;
  token: string;
  status: TicketClaimStatus = TicketClaimStatus.PENDING;
  createdBy: string; // Organization ID
  claimedBy?: string; // User Phone
  claimedAt?: Date;
  createdAt: Date = new Date();

  constructor(eventId: string, token: string, createdBy: string) {
    this.eventId = eventId;
    this.token = token;
    this.createdBy = createdBy;
  }

  claim(userPhone: string) {
    if (this.status !== TicketClaimStatus.PENDING) {
      throw new Error('Claim is not valid');
    }
    this.status = TicketClaimStatus.CLAIMED;
    this.claimedBy = userPhone;
    this.claimedAt = new Date();
  }
}
