
import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import { PromptTemplate } from '../../common/prompt/domain/prompt-template.entity';
import { v4 as uuidv4 } from 'uuid';
import { LLM_SYSTEM_PROMPTS } from '../../common/llm/llm-prompts';

export class PromptTemplateSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    const prompts = [
        { 
            key: 'analyze_message', 
            content: LLM_SYSTEM_PROMPTS.DEFAULT_ANALYSIS,
            description: 'Default global prompt for analyzing incoming WhatsApp messages with Multi-Intent support.',
            metadata: { model: "gemini-1.5-flash", temperature: 0.2 },
            version: 4 // Increment version
        },
        { 
            key: 'analyze_media', 
            content: LLM_SYSTEM_PROMPTS.MEDIA_ANALYSIS,
            description: 'Default global prompt for analyzing Images and PDF Documents.',
            metadata: { model: "gemini-1.5-flash", temperature: 0.1 },
            version: 2 // Increment version
        }
    ];

    for (const p of prompts) {
        const existing = await em.findOne(PromptTemplate, { key: p.key });
        
        if (!existing) {
            const prompt = new PromptTemplate(
                uuidv4(),
                p.key,
                p.content,
                null,
                p.description,
                p.metadata,
                p.version
            );
            em.persist(prompt);
        } else {
             existing.content = p.content;
             existing.description = p.description;
             existing.metadata = p.metadata;
             existing.version = p.version;
             em.persist(existing);
        }
    }
  }

}
