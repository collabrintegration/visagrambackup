import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const newsletterTable = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  source: varchar("source", { length: 100 }).default("website"),
  confirmed: boolean("confirmed").notNull().default(false),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsletterSubscriber = typeof newsletterTable.$inferSelect;
