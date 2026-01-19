import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ILLMProvider } from './llm-provider.interface';
import { LLMAnalysisResult, LLMIntent } from './llm-types';
import { LLM_SYSTEM_PROMPTS } from './llm-prompts';

@Injectable()
export class GeminiLLMProvider implements ILLMProvider {
  private readonly logger = new Logger(GeminiLLMProvider.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      this.logger.warn('GOOGLE_API_KEY is not set. Gemini Provider will fail if used.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    // Model name configurable via env, default to flash
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  async analyzeText(text: string, options?: { context?: Record<string, any>; systemPrompt?: string }): Promise<LLMAnalysisResult> {
    this.logger.log(`[Gemini] Analyzing text: "${text}"`);
    
    // Use provided system prompt or fall back to default from constants
    const systemInstruction = options?.systemPrompt || LLM_SYSTEM_PROMPTS.DEFAULT_ANALYSIS;
    const contextStr = JSON.stringify(options?.context || {});
    
    let finalSystemInstruction = systemInstruction;
    if (finalSystemInstruction.includes('{{context}}')) {
      finalSystemInstruction = finalSystemInstruction.replace('{{context}}', contextStr);
    } else {
      finalSystemInstruction = `Context: ${contextStr}\n\n${finalSystemInstruction}`;
    }
    
    // Inject current date for relative date parsing (e.g., "aujourd'hui", "demain")
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    finalSystemInstruction = finalSystemInstruction.replace('{{current_date}}', currentDate);

    const prompt = `${finalSystemInstruction}\n\nInput Text: "${text}"`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      
      // Basic cleanup to find JSON block
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
      }
      
      this.logger.warn(`Failed to parse JSON from Gemini response: ${textResponse}`);
      return { actions: [{ intent: LLMIntent.UNKNOWN, data: {} }] };

    } catch (error) {
      this.logger.error('Gemini API Error', error);
      return { actions: [{ intent: LLMIntent.UNKNOWN, data: {} }] };
    }
  }

  async analyzeMedia(base64Data: string, mimeType: string, options?: { context?: Record<string, any>; prompt?: string }): Promise<LLMAnalysisResult> {
    this.logger.log(`[Gemini] Analyzing media (${mimeType})`);

    try {
        const basePrompt = options?.prompt || LLM_SYSTEM_PROMPTS.MEDIA_ANALYSIS;
        const contextStr = JSON.stringify(options?.context || {});
        
        let prompt = basePrompt;
        if (prompt.includes('{{context}}')) {
          prompt = prompt.replace('{{context}}', contextStr);
        } else {
          prompt = `Context: ${contextStr}\n\n${prompt}`;
        }

        const result = await this.model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const textResponse = result.response.text();
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { actions: [{ intent: LLMIntent.UNKNOWN, data: {} }] };

    } catch (error) {
        this.logger.error('Gemini Media Analysis Error', error);
        return { actions: [{ intent: LLMIntent.UNKNOWN, data: {} }] };
    }
  }

  async transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
      this.logger.log(`[Gemini] Transcribing Audio (${mimeType})...`);

      try {
          const result = await this.model.generateContent([
              "Transcribe the following audio file into text. Output ONLY the transcription, without any intro or explanation. If the audio is unclear, output 'Audio unclear'.",
              {
                  inlineData: {
                      data: base64Data,
                      mimeType: mimeType
                  }
              }
          ]);

          return result.response.text().trim();
      } catch (error) {
          this.logger.error('Gemini Audio Transcription Error', error);
          return "";
      }
  }
}
