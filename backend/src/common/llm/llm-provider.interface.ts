import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { LLMAnalysisResult } from './llm-types';

export const LLM_PROVIDER_TOKEN = 'LLM_PROVIDER_TOKEN';

export interface ILLMProvider {
  /**
   * Analyzes text input to extract structured data or intent.
   * @param text The input text to analyze.
   * @param options Optional configuration including context and system prompt.
   */
  analyzeText(text: string, options?: { context?: Record<string, any>; systemPrompt?: string }): Promise<LLMAnalysisResult>;

  /**
   * Analyzes media content (Image/PDF) provided as Base64.
   * @param base64Data The media content.
   * @param mimeType The type of media.
   * @param options Optional context and prompt.
   */
  analyzeMedia(base64Data: string, mimeType: string, options?: { context?: Record<string, any>; prompt?: string }): Promise<LLMAnalysisResult>;

  /**
   * Transcribes audio content to text (e.g., voice notes).
   * @param base64Data The audio content as Base64.
   * @param mimeType The type of media (e.g., audio/ogg; codecs=opus).
   */
  transcribeAudio(base64Data: string, mimeType: string): Promise<string>;

  /**
   * Returns the underlying LangChain Chat Model for agentic workflows.
   */
  getModel(): BaseChatModel;
}
