import { Options, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { OrganizationSchema } from './organization/infrastructure/persistence/organization.schema';
import { UserSchema } from './user/infrastructure/persistence/user.schema';
import { TransactionSchema } from './transaction/infrastructure/persistence/transaction.schema';
import { OrganizationMemberSchema } from './organization/infrastructure/persistence/organization-member.schema';
import { IncidentSchema } from './incident/infrastructure/persistence/incident.schema';
import { PromptTemplateSchema } from './common/prompt/infrastructure/persistence/prompt-template.schema';
import { EventPassSchema } from './subscription/infrastructure/persistence/event-pass.schema';
import { SubscriptionSchema } from './subscription/infrastructure/persistence/subscription.schema';
import { PaymentMethodSchema } from './payment/infrastructure/persistence/payment-method.schema';
import { SubscriptionPlanSchema } from './subscription/infrastructure/persistence/subscription-plan.schema';
import { EventSchema } from './ticketing/infrastructure/persistence/event.schema';
import { TicketSchema } from './ticketing/infrastructure/persistence/ticket.schema';
import { Report } from './report/domain/report.entity';
import { TicketClaimSchema } from './ticketing/infrastructure/persistence/ticket-claim.schema';
import { EventFeedbackSchema } from './feedback/infrastructure/persistence/event-feedback.schema';
import { OnboardingProgressSchema } from './onboarding/infrastructure/persistence/onboarding-progress.schema';
import { OnboardingStepConfigSchema } from './onboarding/infrastructure/persistence/onboarding-step-config.schema';

import { TicketCategorySchema } from './ticketing/infrastructure/persistence/ticket-category.schema';
import { ContactSchema } from './contact/infrastructure/persistence/contact.schema';

const config: Options = {
  driver: PostgreSqlDriver,
  dbName: process.env.DB_NAME || 'event_pilot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  entities: [OrganizationSchema, UserSchema, TransactionSchema, OrganizationMemberSchema, IncidentSchema, PromptTemplateSchema, EventPassSchema, SubscriptionSchema, PaymentMethodSchema, SubscriptionPlanSchema, EventSchema, TicketSchema, TicketCategorySchema, Report, TicketClaimSchema, EventFeedbackSchema, OnboardingProgressSchema, OnboardingStepConfigSchema, ContactSchema],
  debug: process.env.NODE_ENV !== 'production',
  allowGlobalContext: false, // For simple app usage, usually false in prod
  migrations: {
    path: 'dist/database/migrations',
    pathTs: 'src/database/migrations',
    disableForeignKeys: false, // Recommended for PG
  },
  seeder: {
    path: 'dist/database/seeders',
    pathTs: 'src/database/seeders',
  },
  extensions: [Migrator, SeedManager],
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
  },
};

export default config;
