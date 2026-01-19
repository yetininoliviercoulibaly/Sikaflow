
export class MagicLinkToken {
  constructor(
    public readonly token: string,
    public readonly phoneNumber: string,
    public readonly expiresAt: Date,
    public isUsed: boolean = false,
    public firstUsedAt: Date | null = null,
  ) {}

  isValid(): boolean {
    // Valid if NOT used OR used within the grace period (3 minutes)
    if (!this.isUsed) return new Date() < this.expiresAt;
    
    if (this.firstUsedAt) {
      const GRACE_PERIOD_MS = 3 * 60 * 1000; // 3 minutes
      const now = new Date().getTime();
      const firstUsedTime = new Date(this.firstUsedAt).getTime();
      return now < firstUsedTime + GRACE_PERIOD_MS;
    }

    return false;
  }

  markAsUsed(): void {
    if (this.isUsed) {
        // Idempotent: if already used, do nothing (we rely on firstUsedAt for grace period check)
        return;
    }
    this.isUsed = true;
    this.firstUsedAt = new Date();
  }
}
