
export enum TicketStatus {
  VALID = 'VALID',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

export class Ticket {
  constructor(
    public id: string,
    public eventId: string,
    public attendeePhone: string | null,
    public status: TicketStatus,
    public secureHash: string,
    public createdAt: Date = new Date(),
    public usedAt?: Date,
    public categoryId?: string,
  ) {}

  use(): void {
    if (this.status !== TicketStatus.VALID) {
        throw new Error(`Ticket is not valid (Status: ${this.status})`);
    }
    this.status = TicketStatus.USED;
    this.usedAt = new Date();
  }
}

