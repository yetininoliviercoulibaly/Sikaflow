import { Migration } from '@mikro-orm/migrations';

export class Migration20260120235000 extends Migration {

  async up(): Promise<void> {
    this.addSql('ALTER TABLE "contact" ALTER COLUMN "phone" TYPE varchar(50);');
    this.addSql('ALTER TABLE "ticket" ALTER COLUMN "attendee_phone" TYPE varchar(50);');
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE "contact" ALTER COLUMN "phone" TYPE varchar(20);');
    this.addSql('ALTER TABLE "ticket" ALTER COLUMN "attendee_phone" TYPE varchar(20);');
  }

}
