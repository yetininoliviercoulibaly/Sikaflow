import { z } from 'zod';
import { StructuredTool } from '@langchain/core/tools';

/**
 * Base abstract class for all SikaFlow Agent Tools.
 * Each tool must implement the `_call` method and define its schema.
 */
export abstract class BaseTool<T extends z.ZodObject<any>> extends StructuredTool {
  // Common logic for tools can be added here (logging, error handling wrappers)
  
  protected async handleSafe(fn: () => Promise<string>): Promise<string> {
      try {
          return await fn();
      } catch (error) {
          if (error instanceof Error) {
              return `Error executing tool: ${error.message}`;
          }
          return `Unknown error executing tool`;
      }
  }
}
