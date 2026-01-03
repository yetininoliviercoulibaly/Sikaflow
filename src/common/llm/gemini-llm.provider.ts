import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ILLMProvider } from './llm-provider.interface';

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

  async analyzeText(text: string, options?: { context?: Record<string, any>; systemPrompt?: string }): Promise<any> {
    this.logger.log(`[Gemini] Analyzing text: "${text}"`);
    
    // Use provided system prompt or fall back to default
    const systemInstruction = options?.systemPrompt || `
      You are an AI assistant for an event management app.
      Analyze the following text from a user (WhatsApp message).
      
      User Context: ${JSON.stringify(options?.context || {})}
      
      Determine the user's INTENT(s). A user might do multiple things or correct themselves.
      
      Supported INTENTS:
      - 'CREATE_TRANSACTION': User mentions spending money, income, buying, etc.
      - 'REPORT_INCIDENT': User reports a problem, security issue, broken item.
      - 'ASK_DATA': User asks for business metrics.
      - 'GENERATE_REPORT': User asks for a PDF report (flash, weekly, etc).
      - 'CANCEL_LAST_ACTION': User explicitly cancels previous request.
      - 'UPDATE_LAST_ACTION': User corrects previous info.
      - 'UNKNOWN': Unclear.

      For 'CREATE_TRANSACTION', extract:
      - amount (number)
      - currency (default EUR)
      - category (short string)
      - description (summary)
      - type ('INCOME' or 'EXPENSE')
      
      For 'REPORT_INCIDENT', extract:
      - severity ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
      - description

      For 'ASK_DATA', extract:
      - metric ('REVENUE', 'TIPS', 'EXPENSES', 'CASH_FLOW')
      - period ('today', 'yesterday', 'this_week', 'last_month')
      - date (ISO 8601 date string 'YYYY-MM-DD')

      For 'GENERATE_REPORT', extract:
      - type ('FLASH', 'WEEKLY')
      - period (optional)

      STRUCTURE RESPONSE AS JSON OBJECT with an 'actions' array.
      
      Fields per action:
      - intent: String enum.
      - data: Object with extracted fields.
      - missing_fields: Array of strings if vital info is missing (e.g., ['amount']).
      - organization_name: String if user explicitly mentions a venue like "for Le Lounge".

      Example: 
      {
        "actions": [
            { 
               "intent": "CREATE_TRANSACTION", 
               "data": { "amount": 50, "type": "EXPENSE", "category": "Food" },
               "organization_name": "Le Lounge"
            },
            {
               "intent": "REPORT_INCIDENT",
               "data": { "description": "Bagarre" },
               "missing_fields": ["severity"]
            }
        ]
      }
    `;

    const prompt = `${systemInstruction}

      Input Text: "${text}"`;

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
      return { intent: 'UNKNOWN', data: {} };

    } catch (error) {
      this.logger.error('Gemini API Error', error);
      return { intent: 'UNKNOWN', data: {} };
    }
  }

  async analyzeMedia(base64Data: string, mimeType: string, options?: { context?: Record<string, any>; prompt?: string }): Promise<any> {
    this.logger.log(`[Gemini] Analyzing media (${mimeType})`);

    try {
        const prompt = options?.prompt || `
          Analyze this media (image or document).
          User Context: ${JSON.stringify(options?.context || {})}
          
          Identify intents: 'CREATE_TRANSACTION' (receipt/invoice), 'REPORT_INCIDENT' (photo of issue), or 'UNKNOWN'.
          
          For 'CREATE_TRANSACTION', extract amount, currency, category, description, date.
          For 'REPORT_INCIDENT', extract severity, description.

          Output JSON with 'actions' array.
        `;

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
        return { intent: 'UNKNOWN' };

    } catch (error) {
        this.logger.error('Gemini Media Analysis Error', error);
        return { intent: 'UNKNOWN' };
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
