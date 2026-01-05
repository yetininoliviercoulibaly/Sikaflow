
export class MagicLinkToken {
  constructor(
    public readonly token: string,
    public readonly emailOrPhone: string,
    public readonly expiresAt: Date,
    public isUsed: boolean = false,
  ) {}

  isValid(): boolean {
    return !this.isUsed && new Date() < this.expiresAt;
  }

  markAsUsed(): void {
    if (this.isUsed) {
      throw new Error('Token already used');
    }
    this.isUsed = true;
  }
}
