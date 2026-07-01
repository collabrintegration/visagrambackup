import { pgTable, integer, text, numeric, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visasTable = pgTable("visas", {
  id: serial("id").primaryKey(),
  passportCountryCode: text("passport_country_code").notNull(),
  destinationCountryCode: text("destination_country_code").notNull(),
  visaType: text("visa_type").notNull().default("tourist"),
  entryType: text("entry_type").notNull(),
  fee: numeric("fee", { precision: 10, scale: 2 }),
  feeCurrency: text("fee_currency").default("USD"),
  durationDays: integer("duration_days"),
  validityDays: integer("validity_days"),
  processingDays: integer("processing_days"),
  entries: text("entries"),
  requirements: text("requirements"),
  notes: text("notes"),
  officialUrl: text("official_url"),
});

export const insertVisaSchema = createInsertSchema(visasTable).omit({ id: true });
export type InsertVisa = z.infer<typeof insertVisaSchema>;
export type Visa = typeof visasTable.$inferSelect;
