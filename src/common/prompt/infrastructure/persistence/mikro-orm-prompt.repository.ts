import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PromptTemplate } from '../../domain/prompt-template.entity';
import { IPromptRepository } from '../../domain/ports/prompt.repository.interface';

@Injectable()
export class MikroOrmPromptRepository implements IPromptRepository {
  constructor(private readonly em: EntityManager) {}

  async create(template: PromptTemplate): Promise<PromptTemplate> {
    const newTemplate = this.em.create(PromptTemplate, template);
    await this.em.persistAndFlush(newTemplate);
    return newTemplate;
  }

  async getTemplate(key: string, organizationId?: string): Promise<PromptTemplate | null> {
    // Strategy: Fetch both candidates (specific and global) and pick the best one.
    // OR: Query with OR condition and sort by priority.
    // e.g. WHERE key = 'key' AND (organization_id = orgId OR organization_id IS NULL)
    // ORDER BY organization_id NULLS LAST (assuming we want non-null first)
    
    // Using QueryBuilder for clarity or EM `find` with logic
    const templates = await this.em.find(PromptTemplate, {
        key: key,
        $or: [
            { organizationId: organizationId || null }, // Match specific or null (if orgId provided)
            { organizationId: null }            // Always match global
        ]
    });

    // In-memory sorting to pick specific over global
    // Filter out if for some reason we got unrelated data (unlikely with above query)
    // Sort: Specific (has ID) > Global (null)
    const sorted = templates.sort((a, b) => {
        if (a.organizationId && !b.organizationId) return -1; // a comes first
        if (!a.organizationId && b.organizationId) return 1;  // b comes first
        return 0;
    });

    return sorted[0] || null;
  }
}
