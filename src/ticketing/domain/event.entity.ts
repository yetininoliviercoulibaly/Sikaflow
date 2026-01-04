
export class Event {
  constructor(
    public id: string,
    public organizationId: string,
    public name: string,
    public date: Date,
    public totalCapacity: number,
    public price: number,
    public soldCount: number = 0,
    public createdAt: Date = new Date(),
    public feedbackSent: boolean = false,
  ) {}

  getRemainingCapacity(): number {
    return this.totalCapacity - this.soldCount;
  }

  canSell(quantity: number = 1): boolean {
    return (this.soldCount + quantity) <= this.totalCapacity;
  }

  incrementSold(quantity: number = 1): void {
    if (!this.canSell(quantity)) {
      throw new Error('Event Sold Out');
    }
    this.soldCount += quantity;
  }
}
