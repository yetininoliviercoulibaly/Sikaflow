import { z } from 'zod';

// We avoid top-level import of StructuredTool to prevent Jest collection issues in CJS
let BaseParent: any = class { 
    name: string; 
    description: string; 
    schema: any;
    invoke(input: any): Promise<any> { return Promise.resolve(input); }
};

try {
    const { StructuredTool } = require('@langchain/core/tools');
    if (StructuredTool) BaseParent = StructuredTool;
} catch (e) {
    // Fallback for environments where LangChain is not loadable during scan
}

/**
 * Base abstract class for all SikaFlow Agent Tools.
 * Each tool must implement the `_call` method and define its schema.
 */
export abstract class BaseTool<T extends z.ZodObject<any>> extends BaseParent {
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
