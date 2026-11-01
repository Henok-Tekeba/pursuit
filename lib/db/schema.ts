import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "awaiting_response",
  "replied",
  "follow_up_due",
  "interview",
  "assessment",
  "offer",
  "rejected",
  "ghosted",
  "withdrawn",
]);

export const applicationMethodEnum = pgEnum("application_method", [
  "cold_email",
  "linkedin",
  "referral",
  "job_portal",
  "other",
]);

export const emailDirectionEnum = pgEnum("email_direction", ["outbound", "inbound"]);

export const emailKindEnum = pgEnum("email_kind", [
  "initial",
  "follow_up",
  "reply",
  "interview",
  "assessment",
  "offer",
  "rejection",
  "other",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "application_created",
  "email_sent",
  "email_received",
  "follow_up_sent",
  "reply_received",
  "interview_scheduled",
  "assessment_received",
  "status_changed",
  "note_added",
  "follow_up_scheduled",
  "offer_received",
  "rejection_received",
  "withdrawn",
]);

export const templateKindEnum = pgEnum("template_kind", [
  "cold_email",
  "follow_up",
  "reply",
  "other",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    passwordHash: text("password_hash"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    purpose: text("purpose").notNull().default("login"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_tokens_hash_unique").on(table.tokenHash),
    index("auth_tokens_email_idx").on(table.email),
  ],
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    website: text("website"),
    domain: text("domain"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("companies_user_idx").on(table.userId)],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    refNo: serial("ref_no").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    position: text("position").notNull(),
    location: text("location"),
    jobUrl: text("job_url"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactAvatarUrl: text("contact_avatar_url"),
    method: applicationMethodEnum("method").notNull().default("cold_email"),
    status: applicationStatusEnum("status").notNull().default("applied"),
    appliedAt: date("applied_at").notNull(),
    lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
    nextFollowUpAt: date("next_follow_up_at"),
    firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("applications_user_idx").on(table.userId),
    index("applications_company_idx").on(table.companyId),
    index("applications_status_idx").on(table.status),
    index("applications_follow_up_idx").on(table.nextFollowUpAt),
  ],
);

export const emailInteractions = pgTable(
  "email_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    direction: emailDirectionEnum("direction").notNull(),
    kind: emailKindEnum("kind").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    fromEmail: text("from_email"),
    toEmail: text("to_email"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    gmailMessageId: text("gmail_message_id"),
    gmailThreadId: text("gmail_thread_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("emails_application_idx").on(table.applicationId),
    index("emails_user_idx").on(table.userId),
    index("emails_occurred_idx").on(table.occurredAt),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    emailId: uuid("email_id").references(() => emailInteractions.id, {
      onDelete: "set null",
    }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activities_application_idx").on(table.applicationId),
    index("activities_user_idx").on(table.userId),
    index("activities_occurred_idx").on(table.occurredAt),
  ],
);

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: templateKindEnum("kind").notNull().default("cold_email"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("templates_user_idx").on(table.userId)],
);

export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  followUpIntervals: integer("follow_up_intervals").array().notNull().default([5, 10, 17]),
  emailSignature: text("email_signature"),
  defaultMethod: applicationMethodEnum("default_method").notNull().default("cold_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  applications: many(applications),
  companies: many(companies),
  templates: many(templates),
  settings: one(settings),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, { fields: [companies.userId], references: [users.id] }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  company: one(companies, { fields: [applications.companyId], references: [companies.id] }),
  emails: many(emailInteractions),
  activities: many(activities),
}));

export const emailInteractionsRelations = relations(emailInteractions, ({ one }) => ({
  application: one(applications, {
    fields: [emailInteractions.applicationId],
    references: [applications.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  application: one(applications, {
    fields: [activities.applicationId],
    references: [applications.id],
  }),
  email: one(emailInteractions, {
    fields: [activities.emailId],
    references: [emailInteractions.id],
  }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  user: one(users, { fields: [templates.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type EmailInteraction = typeof emailInteractions.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type ApplicationMethod = (typeof applicationMethodEnum.enumValues)[number];
export type EmailKind = (typeof emailKindEnum.enumValues)[number];
export type EmailDirection = (typeof emailDirectionEnum.enumValues)[number];
export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
export type TemplateKind = (typeof templateKindEnum.enumValues)[number];
