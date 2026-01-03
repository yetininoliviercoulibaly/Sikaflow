export class PromptTemplate {
  constructor(
    public id: string,
    public key: string,
    public content: string, // The prompt text with {{placeholders}}
    public organizationId: string | null = null, // Null = Global default
    public description: string | null = null,
    public metadata: Record<string, any> = {},
    public version: number = 1,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}
}
