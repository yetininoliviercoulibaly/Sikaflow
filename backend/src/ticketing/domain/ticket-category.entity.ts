import { v4 as uuidv4 } from 'uuid';

export class TicketCategory {
  id: string;
  eventId: string;
  name: string;
  price: number;
  capacity: number;
  soldCount: number;
  isDefault: boolean;
  benefits: string[];
  createdAt: Date;

  constructor(
    eventId: string,
    name: string,
    price: number,
    capacity: number,
    isDefault: boolean = false,
    benefits: string[] = [],
  ) {
    this.id = uuidv4();
    this.eventId = eventId;
    this.name = name;
    this.price = price;
    this.capacity = capacity;
    this.soldCount = 0;
    this.isDefault = isDefault;
    this.benefits = benefits;
    this.createdAt = new Date();
  }

  getRemainingCapacity(): number {
    return this.capacity - this.soldCount;
  }

  canSell(quantity: number = 1): boolean {
    return (this.soldCount + quantity) <= this.capacity;
  }

  incrementSold(quantity: number = 1): void {
    if (!this.canSell(quantity)) {
      throw new Error(`Category ${this.name} is sold out`);
    }
    this.soldCount += quantity;
  }

  decrementSold(quantity: number = 1): void {
    if (this.soldCount - quantity < 0) {
      throw new Error('Cannot decrement below zero');
    }
    this.soldCount -= quantity;
  }
}
