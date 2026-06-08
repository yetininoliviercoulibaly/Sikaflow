export class User {
  constructor(
    public id: string,
    public phoneNumber: string,
    public fullName: string | null,
    public lastActiveOrganizationId: string | null,
    public createdAt: Date,
    public preferredLanguage: string = 'fr',
    public telegramUserId: string | null = null,
  ) {}
}
