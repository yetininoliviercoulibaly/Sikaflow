export class Organization {
  constructor(
    public id: string,
    public name: string,
    public ownerId: string,
    public settings: Record<string, any>,
    public createdAt: Date,
    public subscriptionExpiresAt?: Date,
    public currentPlanId?: string,
  ) {}
}
