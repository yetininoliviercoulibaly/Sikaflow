import { Migration } from '@mikro-orm/migrations';

export class Migration20260118220000 extends Migration {

  override async up(): Promise<void> {
    // 1. Create ticket_category table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "ticket_category" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_id" UUID NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL DEFAULT 'Standard',
        "price" INTEGER NOT NULL,
        "capacity" INTEGER NOT NULL,
        "sold_count" INTEGER NOT NULL DEFAULT 0,
        "is_default" BOOLEAN NOT NULL DEFAULT false,
        "benefits" TEXT[] DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Add category_id to ticket table
    this.addSql(`
      ALTER TABLE "ticket" 
      ADD COLUMN IF NOT EXISTS "category_id" UUID REFERENCES "ticket_category"("id");
    `);

    // 3. Migrate existing events: create default category for each event
    this.addSql(`
      INSERT INTO "ticket_category" ("event_id", "name", "price", "capacity", "sold_count", "is_default")
      SELECT "id", 'Standard', "price", "total_capacity", "sold_count", true
      FROM "event"
      WHERE NOT EXISTS (
        SELECT 1 FROM "ticket_category" tc WHERE tc."event_id" = "event"."id"
      );
    `);

    // 4. Link existing tickets to their default category
    this.addSql(`
      UPDATE "ticket" t
      SET "category_id" = tc."id"
      FROM "ticket_category" tc
      WHERE t."event_id" = tc."event_id" 
        AND tc."is_default" = true 
        AND t."category_id" IS NULL;
    `);

    // 5. Create index for faster lookups
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_ticket_category_event_id" ON "ticket_category"("event_id");
    `);
  }

  override async down(): Promise<void> {
    // Remove category_id from ticket
    this.addSql(`ALTER TABLE "ticket" DROP COLUMN IF EXISTS "category_id";`);
    
    // Drop ticket_category table
    this.addSql(`DROP TABLE IF EXISTS "ticket_category";`);
  }

}
