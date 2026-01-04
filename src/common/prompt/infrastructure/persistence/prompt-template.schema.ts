import { EntitySchema } from '@mikro-orm/core';
import { PromptTemplate } from '../../domain/prompt-template.entity';

export const PromptTemplateSchema = new EntitySchema<PromptTemplate>({
  class: PromptTemplate,
  tableName: 'prompt_template',
  properties: {
    id: { type: 'uuid', primary: true },
    key: { type: 'varchar', length: 100, fieldName: 'code' },
    content: { type: 'text', fieldName: 'template' },
    organizationId: { type: 'uuid', nullable: true },
    description: { type: 'text', nullable: true },
    metadata: { type: 'jsonb', default: '{}' },
    version: { type: 'integer', default: 1 },
    createdAt: { type: 'timestamp' },
    updatedAt: { type: 'timestamp', onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['key'] },
    // Composite unique index handling is DB specific, typically handled via DB migrations manually for precise constraints
    // For MikroORM schema definition, we rely on the application/repo logic or raw SQL migration for the Constraint
  ],
});
