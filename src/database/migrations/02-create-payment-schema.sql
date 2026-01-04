-- 1. Create Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_method (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    -- WAVE, STRIPE
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
INSERT INTO payment_method (id, code, name, is_active, supported_currencies)
VALUES (
        'pm_wave',
        'WAVE',
        'Wave Mobile Money',
        true,
        '["XOF"]'
    ),
    (
        'pm_stripe',
        'STRIPE',
        'Carte Bancaire',
        true,
        '["EUR", "USD"]'
    ) ON CONFLICT (code) DO NOTHING;
-- Subscription Plans
-- Wave (15k for 3 months, 50k for 1 year)
INSERT INTO subscription_plan (
        id,
        name,
        price,
        currency,
        duration_months,
        payment_method_id,
        description
    )
VALUES (
        uuid_generate_v4(),
        'Pass Trimestriel',
        15000,
        'XOF',
        3,
        'pm_wave',
        'Abonnement 3 Mois'
    ),
    (
        uuid_generate_v4(),
        'Pass Annuel',
        50000,
        'XOF',
        12,
        'pm_wave',
        'Abonnement 1 An (Best Value)'
    ) ON CONFLICT DO NOTHING;
-- Stripe (9.99 EUR Monthly)
INSERT INTO subscription_plan (
        id,
        name,
        price,
        currency,
        duration_months,
        payment_method_id,
        description
    )
VALUES (
        uuid_generate_v4(),
        'Premium Mensuel',
        9.99,
        'EUR',
        1,
        'pm_stripe',
        'Abonnement Mensuel Flexible'
    ) ON CONFLICT DO NOTHING;