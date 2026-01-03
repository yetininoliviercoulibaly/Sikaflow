import { PromptTemplate } from '../prompt-template.entity';

export const I_PROMPT_REPOSITORY = 'I_PROMPT_REPOSITORY';

export interface IPromptRepository {
  create(template: PromptTemplate): Promise<PromptTemplate>;
  /**
   * Retrieves a prompt template by key.
   * Implements fallback strategy:
   * 1. Try to find specific template for organizationId
   * 2. If not found, return global template (organizationId = null)
   */
  getTemplate(key: string, organizationId?: string): Promise<PromptTemplate | null>;
}
