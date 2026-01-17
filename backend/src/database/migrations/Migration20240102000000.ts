import { Migration } from '@mikro-orm/migrations';

export class Migration20240102000000 extends Migration {

  async up(): Promise<void> {
    this.addSql(`
      create table "app_user" ("id" uuid not null, "phone_number" varchar(50) not null, "full_name" varchar(255) null, "last_active_organization_id" uuid null, "preferred_language" varchar(255) not null default 'fr', "created_at" timestamptz not null default CURRENT_TIMESTAMP, constraint "app_user_pkey" primary key ("id"));

      create table "organization" ("id" uuid not null, "name" varchar(100) not null, "owner_id" uuid not null, "settings" jsonb not null, "created_at" timestamptz not null, constraint "organization_pkey" primary key ("id"));

      create table "organization_member" ("organization_id" uuid not null, "user_id" uuid not null, "role" text check ("role" in ('ADMIN', 'OWNER', 'MANAGER', 'STAFF')) not null, "joined_at" timestamptz not null, constraint "organization_member_pkey" primary key ("organization_id", "user_id"));

      create table "event" ("id" uuid not null, "organization_id" uuid not null, "name" varchar(255) not null, "date" timestamptz not null, "total_capacity" int not null, "price" int not null, "sold_count" int not null default 0, "feedback_sent" boolean not null default false, "created_at" timestamptz not null, constraint "event_pkey" primary key ("id"));

      create table "event_feedback" ("id" uuid not null, "event_id" uuid not null, "attendee_phone" varchar(255) not null, "rating" int not null, "comment" text null, "created_at" timestamptz not null, constraint "event_feedback_pkey" primary key ("id"));
      create index "idx_feedback_event_phone" on "event_feedback" ("event_id", "attendee_phone");

      create table "event_pass" ("id" uuid not null, "organization_id" uuid not null, "valid_from" timestamptz not null, "valid_until" timestamptz not null, "status" text check ("status" in ('PENDING', 'ACTIVE', 'EXPIRED')) not null, "payment_reference" varchar(255) null, "created_at" timestamptz not null, constraint "event_pass_pkey" primary key ("id"));

      create table "incident" ("id" uuid not null, "organization_id" uuid not null, "reported_by_user_id" uuid null, "origin_message_id" uuid null, "severity" text check ("severity" in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) not null, "description" text null, "status" text check ("status" in ('OPEN', 'RESOLVED')) not null, "occurred_at" timestamptz not null, "created_at" timestamptz not null, constraint "incident_pkey" primary key ("id"));



      create table "report" ("id" uuid not null, "organization_id" uuid not null, "type" text check ("type" in ('FLASH', 'WEEKLY')) not null, "period_start" timestamptz null, "period_end" timestamptz null, "data" jsonb not null, "generated_at" timestamptz not null, constraint "report_pkey" primary key ("id"));
      alter table "report" add constraint "report_organization_id_foreign" foreign key ("organization_id") references "organization" ("id") on update cascade;

      create table "subscriptions" ("id" uuid not null, "organization_id" uuid not null, "stripe_subscription_id" varchar(255) null, "wave_transaction_id" varchar(255) null, "type" text check ("type" in ('MONTHLY')) not null default 'MONTHLY', "status" text check ("status" in ('ACTIVE', 'CANCELED', 'PAST_DUE', 'EXPIRED')) not null default 'ACTIVE', "current_period_start" timestamptz not null, "current_period_end" timestamptz not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "subscriptions_pkey" primary key ("id"));

      create table "ticket" ("id" uuid not null, "event_id" uuid not null, "attendee_phone" varchar(20) not null, "status" text not null default 'VALID', "secure_hash" text not null, "created_at" timestamptz not null, "used_at" timestamptz null, constraint "ticket_pkey" primary key ("id"));
      create index "ticket_event_id_index" on "ticket" ("event_id");
      create index "ticket_attendee_phone_index" on "ticket" ("attendee_phone");

      create table "ticket_claim" ("id" uuid not null, "event_id" uuid not null, "token" varchar(255) not null, "status" text not null default 'PENDING', "created_by" varchar(255) not null, "claimed_by" varchar(255) null, "claimed_at" timestamptz null, "created_at" timestamptz not null, constraint "ticket_claim_pkey" primary key ("id"));
      alter table "ticket_claim" add constraint "ticket_claim_token_unique" unique ("token");

      create table "transaction" ("id" uuid not null, "organization_id" uuid not null, "reported_by_user_id" uuid null, "origin_message_id" uuid null, "type" text check ("type" in ('INCOME', 'EXPENSE')) not null, "amount" numeric(15,2) not null, "currency" varchar(3) not null, "category" varchar(50) null, "description" text null, "transaction_date" timestamptz not null, "created_at" timestamptz not null, constraint "transaction_pkey" primary key ("id"));
    `);
  }

}
