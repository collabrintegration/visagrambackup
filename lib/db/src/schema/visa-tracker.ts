import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visaApplicationsTable = pgTable("visa_applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  passportCode: text("passport_code"),
  visaType: text("visa_type").notNull(),
  applicationDate: text("application_date").notNull(),
  status: text("status").notNull().default("applied"),
  grantedDate: text("granted_date"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisaApplicationSchema = createInsertSchema(visaApplicationsTable).omit({
  id: true,
  userId: true,
  grantedDate: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVisaApplication = z.infer<typeof insertVisaApplicationSchema>;
export type VisaApplication = typeof visaApplicationsTable.$inferSelect;
