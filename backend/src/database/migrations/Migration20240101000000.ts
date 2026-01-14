
import { Migration } from '@mikro-orm/migrations';

export class Migration20240101000000 extends Migration {

  async up(): Promise<void> {
    // Create prompt_template table with current schema
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "prompt_template" (
        "id" UUID PRIMARY KEY,
        "code" VARCHAR(100) NOT NULL UNIQUE,
        "template" TEXT NOT NULL,
        "organization_id" UUID,
        "description" TEXT,
        "metadata" JSONB DEFAULT '{}',
        "version" INTEGER DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed default prompt
    this.addSql(`
      INSERT INTO "prompt_template" ("id", "code", "template", "created_at", "updated_at")
      VALUES
      ('00000000-0000-0000-0000-000000000001', 'GEMINI_SYSTEM', 'You are Event-Pilot...', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("code") DO NOTHING;
    `);
  }

}

