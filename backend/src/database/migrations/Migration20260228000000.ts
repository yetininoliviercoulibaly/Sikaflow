import { Migration } from '@mikro-orm/migrations';

export class Migration20260228000000 extends Migration {

  async up(): Promise<void> {
    this.addSql('ALTER TABLE "app_user" ADD COLUMN "telegram_user_id" VARCHAR(50) UNIQUE NULL;');
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE "app_user" DROP COLUMN "telegram_user_id";');
  }

}
