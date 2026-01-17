import { Migration } from '@mikro-orm/migrations';

export class Migration20260117021000 extends Migration {

  override async up(): Promise<void> {
    // Fix: Change origin_message_id from UUID to VARCHAR to support Telegram IDs
    this.addSql(`alter table "transaction" alter column "origin_message_id" type varchar(255) using "origin_message_id"::varchar(255);`);
  }

  override async down(): Promise<void> {
    // Revert: Change back to UUID (may fail if non-UUID data exists)
    this.addSql(`alter table "transaction" alter column "origin_message_id" type uuid using "origin_message_id"::uuid;`);
  }

}
