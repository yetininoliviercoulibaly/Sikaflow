export enum PassStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

export class EventPass {
  constructor(
    public id: string,
    public organizationId: string,
    public validFrom: Date,
    public validUntil: Date,
    public status: PassStatus,
    public paymentReference: string | null,
    public createdAt: Date,
  ) {}

  isActive(): boolean {
    const now = new Date();
    return (
      this.status === PassStatus.ACTIVE &&
      now >= this.validFrom &&
      now <= this.validUntil
    );
  }

  getRemainingHours(): number {
    const now = new Date();
    if (!this.isActive()) return 0;
    return Math.max(0, (this.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60));
  }
}
