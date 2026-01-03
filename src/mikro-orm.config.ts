import { Options, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { OrganizationSchema } from './organization/infrastructure/persistence/organization.schema';
import { UserSchema } from './user/infrastructure/persistence/user.schema';
import { TransactionSchema } from './transaction/infrastructure/persistence/transaction.schema';
import { OrganizationMemberSchema } from './organization/infrastructure/persistence/organization-member.schema';
import { IncidentSchema } from './incident/infrastructure/persistence/incident.schema';
import { PromptTemplateSchema } from './common/prompt/infrastructure/persistence/prompt-template.schema';
import { EventPassSchema } from './subscription/infrastructure/persistence/event-pass.schema';

const config: Options = {
  driver: PostgreSqlDriver,
  dbName: process.env.DB_NAME || 'event_pilot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  entities: [OrganizationSchema, UserSchema, TransactionSchema, OrganizationMemberSchema, IncidentSchema, PromptTemplateSchema, EventPassSchema],
  debug: true,
  allowGlobalContext: true, // For simple app usage, usually false in prod
};

export default config;
