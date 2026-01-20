import { Migration } from '@mikro-orm/migrations';

export class Migration20260120234000 extends Migration {

  async up(): Promise<void> {
    this.addSql('ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_type_check";');
    this.addSql(`ALTER TABLE "transaction" ADD CONSTRAINT "transaction_type_check" CHECK ("type" IN ('INCOME', 'EXPENSE', 'DEBT', 'CREDIT'));`);
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_type_check";');
    this.addSql(`ALTER TABLE "transaction" ADD CONSTRAINT "transaction_type_check" CHECK ("type" IN ('INCOME', 'EXPENSE'));`);
  }

}
