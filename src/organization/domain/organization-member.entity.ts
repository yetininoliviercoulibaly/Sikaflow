export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export class OrganizationMember {
  constructor(
    public organizationId: string,
    public userId: string,
    public role: UserRole,
    public joinedAt: Date,
  ) {}
}
