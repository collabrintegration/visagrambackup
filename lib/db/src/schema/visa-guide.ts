import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const visaGuideEntriesTable = pgTable("visa_guide_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  category: text("category").notNull(),
  visaRequired: boolean("visa_required").notNull().default(true),
  processingTime: text("processing_time"),
  officialFee: text("official_fee"),
  maxStay: text("max_stay"),
  requirements: text("requirements"),
  applicationUrl: text("application_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type VisaGuideEntry = typeof visaGuideEntriesTable.$inferSelect;
