import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pageViewsTable = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  visitedAt: timestamp("visited_at", { withTimezone: true }).notNull().defaultNow(),
});
