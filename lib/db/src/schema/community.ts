import { pgTable, serial, text, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  overallRating: integer("overall_rating").notNull(),
  easeRating: integer("ease_rating").notNull(),
  welcomeRating: integer("welcome_rating").notNull(),
  body: text("body"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("reviews_user_country_unique").on(t.userId, t.countryCode),
]);

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  passportCode: text("passport_code"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  body: text("body").notNull(),
  isAccepted: boolean("is_accepted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const travelEntriesTable = pgTable("travel_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("travel_entries_user_country_unique").on(t.userId, t.countryCode),
]);

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, userId: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, userId: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;

export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true, userId: true, createdAt: true });
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answersTable.$inferSelect;

export const insertTravelEntrySchema = createInsertSchema(travelEntriesTable).omit({ id: true, userId: true, createdAt: true });
export type InsertTravelEntry = z.infer<typeof insertTravelEntrySchema>;
export type TravelEntry = typeof travelEntriesTable.$inferSelect;

export const visaReportsTable = pgTable("visa_reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  passportCode: text("passport_code").notNull(),
  visaType: text("visa_type").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  processingDays: integer("processing_days"),
  result: text("result").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisaReportSchema = createInsertSchema(visaReportsTable).omit({ id: true, userId: true, createdAt: true, processingDays: true });
export type InsertVisaReport = z.infer<typeof insertVisaReportSchema>;
export type VisaReport = typeof visaReportsTable.$inferSelect;

// ── Support Cases ────────────────────────────────────────────────────────────
export const supportCasesTable = pgTable("support_cases", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportCaseCommentsTable = pgTable("support_case_comments", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => supportCasesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  body: text("body").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SupportCase = typeof supportCasesTable.$inferSelect;
export type SupportCaseComment = typeof supportCaseCommentsTable.$inferSelect;
