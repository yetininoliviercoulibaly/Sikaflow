
export interface Event {
  id: string;
  organizationId: string;
  name: string;
  date: string;
  totalCapacity: number;
  price: number;
  soldCount: number;
  createdAt: string;
}

export interface EventStats {
  totalCapacity: number;
  soldCount: number;
  remainingCapacity: number;
  revenue: number;
}

export interface CreateEventDto {
  name: string;
  date: string;
  totalCapacity: number;
  price: number;
}
