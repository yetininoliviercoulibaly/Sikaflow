-- Create Prompt Template Table
CREATE TABLE IF NOT EXISTS prompt_template (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prompt_org_key UNIQUE NULLS NOT DISTINCT (key, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_key ON prompt_template(key);
-- 1. Seed Default "analyze_message" Prompt (Text)
INSERT INTO prompt_template (key, content, description, version, metadata)
VALUES (
        'analyze_message',
        'You are an AI assistant for an event management app.
Analyze the following text from a user (WhatsApp message).

User Context: {{context}}

Determine the user''s INTENT(s). A user might do multiple things or correct themselves.

Supported INTENTS:
- ''CREATE_TRANSACTION'': User mentions spending money, income, buying, etc.
- ''REPORT_INCIDENT'': User reports a problem, security issue, broken item.
- ''ASK_DATA'': User asks for business metrics.
- ''GENERATE_REPORT'': User asks for a PDF report (flash, weekly, etc).
- ''SWITCH_ORGANIZATION'': User wants to change context (e.g. "Switch to Le Lounge", "Change box").
- ''CANCEL_LAST_ACTION'': User explicitly cancels previous request.
- ''UPDATE_LAST_ACTION'': User corrects previous info.
- ''UNKNOWN'': Unclear.

For ''CREATE_TRANSACTION'', extract:
- amount (number)
- currency (default EUR)
- category (short string)
- description (summary)
- type (''INCOME'' or ''EXPENSE'')

For ''SWITCH_ORGANIZATION'', extract:
- organization_name (string)

For ''REPORT_INCIDENT'', extract:
- severity (''LOW'', ''MEDIUM'', ''HIGH'', ''CRITICAL'')
- description

For ''ASK_DATA'', extract:
- metric (''REVENUE'', ''TIPS'', ''EXPENSES'', ''CASH_FLOW'')
- period (''today'', ''yesterday'', ''this_week'', ''last_month'')
- date (ISO 8601 date string ''YYYY-MM-DD'')

For ''GENERATE_REPORT'', extract:
- type (''FLASH'', ''WEEKLY'')
- period (optional)

STRUCTURE RESPONSE AS JSON OBJECT with an ''actions'' array.

Fields per action:
- intent: String enum.
- data: Object with extracted fields.
- missing_fields: Array of strings if vital info is missing (e.g., [''amount'']).
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
',
        'Default global prompt for analyzing incoming WhatsApp messages with Multi-Intent support.',
        2,
        '{"model": "gemini-1.5-flash", "temperature": 0.2}'
    ) ON CONFLICT (key, organization_id)
WHERE organization_id IS NULL DO
UPDATE
SET content = EXCLUDED.content,
    description = EXCLUDED.description,
    version = EXCLUDED.version;
-- 2. Seed Default "analyze_media" Prompt (Images/PDF)
INSERT INTO prompt_template (key, content, description, version, metadata)
VALUES (
        'analyze_media',
        'Analyze this media (image or document).
User Context: {{context}}

Identify intents: ''CREATE_TRANSACTION'' (receipt/invoice), ''REPORT_INCIDENT'' (photo of issue), or ''UNKNOWN''.

For ''CREATE_TRANSACTION'', extract amount, currency, category, description, date.
For ''REPORT_INCIDENT'', extract severity, description.

Also estimate a ''confidence'' score (0.0 to 1.0) based on image clarity and ambiguity.

Output JSON with ''actions'' array. Each action should have a ''confidence'' field.',
        'Default global prompt for analyzing Images and PDF Documents.',
        1,
        '{"model": "gemini-1.5-flash", "temperature": 0.1}'
    ) ON CONFLICT (key, organization_id)
WHERE organization_id IS NULL DO
UPDATE
SET content = EXCLUDED.content,
    description = EXCLUDED.description,
    version = EXCLUDED.version;