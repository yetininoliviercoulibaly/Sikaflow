import { Migration } from '@mikro-orm/migrations';

export class Migration20260120170000 extends Migration {

  async up(): Promise<void> {
    // Enable vector extension if not exists
    this.addSql('CREATE EXTENSION IF NOT EXISTS vector;');

    // Add embedding column to contact table
    this.addSql('ALTER TABLE "contact" ADD COLUMN "embedding" vector(384);');

    // Create IVFFLAT index for fast similarity search
    // We use vector_cosine_ops for cosine similarity
    this.addSql('CREATE INDEX "idx_contact_embedding" ON "contact" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);');
  }

  async down(): Promise<void> {
    this.addSql('DROP INDEX "idx_contact_embedding";');
    this.addSql('ALTER TABLE "contact" DROP COLUMN "embedding";');
    // We don't drop the extension as other tables might use it
  }

}
