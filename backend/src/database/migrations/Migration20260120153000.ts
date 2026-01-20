import { Migration } from '@mikro-orm/migrations';

export class Migration20260120153000 extends Migration {
  async up(): Promise<void> {
    // Create contact table
    this.addSql(`
      CREATE TABLE "contact" (
        "id" uuid NOT NULL,
        "short_id" varchar(6) NOT NULL,
        "owner_id" uuid NOT NULL,
        "organization_id" uuid NULL,
        "phone" varchar(20) NULL,
        "display_name" varchar(255) NOT NULL,
        "context" varchar(255) NULL,
        "total_owed" decimal(12,2) NOT NULL DEFAULT 0,
        "total_owing" decimal(12,2) NOT NULL DEFAULT 0,
        "last_interaction_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "contact_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "contact_owner_short_id_unique" UNIQUE ("owner_id", "short_id")
      );
    `);

    // Create indexes for efficient lookups
    this.addSql(`CREATE INDEX "idx_contact_owner_id" ON "contact" ("owner_id");`);
    this.addSql(`CREATE INDEX "idx_contact_short_id" ON "contact" ("short_id");`);
    this.addSql(`CREATE INDEX "idx_contact_organization_id" ON "contact" ("organization_id");`);
    this.addSql(`CREATE INDEX "idx_contact_phone" ON "contact" ("owner_id", "phone");`);

    // Extend transaction table with debt tracking fields
    this.addSql(`
      ALTER TABLE "transaction" 
      ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'COMPLETED',
      ADD COLUMN IF NOT EXISTS "contact_id" uuid NULL,
      ADD COLUMN IF NOT EXISTS "due_date" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "settled_at" timestamptz NULL;
    `);

    // Add foreign key from transaction to contact
    this.addSql(`
      ALTER TABLE "transaction" 
      ADD CONSTRAINT "fk_transaction_contact" 
      FOREIGN KEY ("contact_id") 
      REFERENCES "contact" ("id") 
      ON DELETE SET NULL;
    `);

    // Index for finding pending debts efficiently
    this.addSql(`CREATE INDEX "idx_transaction_status" ON "transaction" ("status");`);
    this.addSql(`CREATE INDEX "idx_transaction_contact_id" ON "transaction" ("contact_id");`);
  }

  async down(): Promise<void> {
    // Remove transaction indexes
    this.addSql(`DROP INDEX IF EXISTS "idx_transaction_contact_id";`);
    this.addSql(`DROP INDEX IF EXISTS "idx_transaction_status";`);

    // Remove foreign key and columns from transaction
    this.addSql(`ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "fk_transaction_contact";`);
    this.addSql(`
      ALTER TABLE "transaction" 
      DROP COLUMN IF EXISTS "status",
      DROP COLUMN IF EXISTS "contact_id",
      DROP COLUMN IF EXISTS "due_date",
      DROP COLUMN IF EXISTS "settled_at";
    `);

    // Drop contact table
    this.addSql(`DROP TABLE IF EXISTS "contact";`);
  }
}
