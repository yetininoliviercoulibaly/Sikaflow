import { Migration } from '@mikro-orm/migrations';

export class Migration20260104200320 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "onboarding_progress" ("id" uuid not null, "user_id" varchar(255) not null, "organization_id" varchar(255) not null, "role" varchar(255) not null, "completed_steps" jsonb not null default '[]', "current_step" varchar(255) null, "started_at" timestamptz not null, "completed_at" timestamptz null, constraint "onboarding_progress_pkey" primary key ("id"));`);
    this.addSql(`create index "onboarding_progress_user_id_index" on "onboarding_progress" ("user_id");`);
    this.addSql(`create index "onboarding_progress_organization_id_index" on "onboarding_progress" ("organization_id");`);
    this.addSql(`create index "idx_onboarding_user_org" on "onboarding_progress" ("user_id", "organization_id");`);

    this.addSql(`create table "onboarding_step_config" ("id" uuid not null, "step_id" varchar(255) not null, "plan_id" varchar(255) null, "title" varchar(255) not null, "description" text not null, "tip_message" text not null, "completion_message" text not null, "required_roles" jsonb not null default '[]', "order" int not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "onboarding_step_config_pkey" primary key ("id"));`);
    this.addSql(`create index "onboarding_step_config_step_id_index" on "onboarding_step_config" ("step_id");`);
    this.addSql(`create index "onboarding_step_config_plan_id_index" on "onboarding_step_config" ("plan_id");`);
    this.addSql(`create index "idx_step_config_plan_step" on "onboarding_step_config" ("plan_id", "step_id");`);

    this.addSql(`alter table "subscription_plan" add column "enabled_features" jsonb not null default '[]';`);

    this.addSql(`alter table "ticket" alter column "status" type text using ("status"::text);`);

    this.addSql(`alter table "ticket_claim" alter column "status" type text using ("status"::text);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "onboarding_progress" cascade;`);

    this.addSql(`drop table if exists "onboarding_step_config" cascade;`);

    this.addSql(`alter table "subscription_plan" drop column "enabled_features";`);

    this.addSql(`alter table "ticket" alter column "status" type text using ("status"::text);`);

    this.addSql(`alter table "ticket_claim" alter column "status" type text using ("status"::text);`);
  }

}
