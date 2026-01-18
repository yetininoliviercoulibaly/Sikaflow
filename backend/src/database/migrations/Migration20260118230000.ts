import { Migration } from '@mikro-orm/migrations';

export class Migration20260118230000 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "ticket" alter column "attendee_phone" drop not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "ticket" alter column "attendee_phone" set not null;');
  }

}
