import { Migration } from '@mikro-orm/migrations';
import { LLM_SYSTEM_PROMPTS } from '../../common/llm/llm-prompts';

export class Migration20260121000000 extends Migration {

  async up(): Promise<void> {
    const promptContent = LLM_SYSTEM_PROMPTS.DEFAULT_ANALYSIS.replace(/'/g, "''"); // Escape single quotes for SQL
    
    this.addSql(`
      UPDATE "prompt_template" 
      SET "template" = '${promptContent}', 
          "version" = "version" + 1, 
          "updated_at" = CURRENT_TIMESTAMP 
      WHERE "code" = 'analyze_message';
    `);
  }

  async down(): Promise<void> {
    // No strict rollback needed for prompt updates, usually we just deploy a newer version.
    // However, to be safe, we could revert to a simpler version if we had it tracked.
    // For now, we skip down logic or leave it as no-op.
  }

}
