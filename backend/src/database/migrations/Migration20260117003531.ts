import { Migration } from '@mikro-orm/migrations';

export class Migration20260117003531 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "organization_member" drop constraint if exists "organization_member_role_check";`);

    this.addSql(`alter table "organization_member" add constraint "organization_member_role_check" check("role" in ('ADMIN', 'OWNER', 'MANAGER', 'STAFF'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "organization_member" drop constraint if exists "organization_member_role_check";`);

    this.addSql(`alter table "organization_member" add constraint "organization_member_role_check" check("role" in ('OWNER', 'MANAGER', 'STAFF'));`);
  }

}
