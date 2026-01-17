
import { Migration } from '@mikro-orm/migrations';

export class Migration20240103193000 extends Migration {

  async up(): Promise<void> {
    this.addSql(`
      -- 1. Create Payment Methods Table
      CREATE TABLE IF NOT EXISTS payment_method (
          id UUID PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE, -- WAVE, STRIPE
          name VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          supported_currencies JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Create Subscription Plans Table
      CREATE TABLE IF NOT EXISTS subscription_plan (
          id UUID PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(10) NOT NULL,
          duration_months INTEGER NOT NULL,
          payment_method_id UUID REFERENCES payment_method(id),
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Update Organization Table
      ALTER TABLE organization 
      ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES subscription_plan(id);

      -- 4. Seed Data
      -- Payment Methods
      INSERT INTO payment_method (id, code, name, is_active, supported_currencies) VALUES 
      ('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'WAVE', 'Wave Mobile Money', true, '["XOF"]'),
      ('b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', 'STRIPE', 'Carte Bancaire', true, '["EUR", "USD"]')
      ON CONFLICT (code) DO NOTHING;

      -- Subscription Plans
      -- Wave (15k for 3 months, 50k for 1 year)
      INSERT INTO subscription_plan (id, name, price, currency, duration_months, payment_method_id, description) VALUES
      ('c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', 'Pass Trimestriel', 15000, 'XOF', 3, 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'Abonnement 3 Mois'),
      ('d4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', 'Pass Annuel', 50000, 'XOF', 12, 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'Abonnement 1 An (Best Value)')
      ON CONFLICT DO NOTHING;

      -- Stripe (9.99 EUR Monthly)
      INSERT INTO subscription_plan (id, name, price, currency, duration_months, payment_method_id, description) VALUES
      ('e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', 'Premium Mensuel', 9.99, 'EUR', 1, 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', 'Abonnement Mensuel Flexible')
      ON CONFLICT DO NOTHING;
    `);
  }

}
