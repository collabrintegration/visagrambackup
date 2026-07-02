import { pgTable, serial, varchar, text, timestamp, unique, index } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const testimonialsTable = pgTable(
  "testimonials",
  {
    id: serial("id").primaryKey(),
    authorId: varchar("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    recipientId: varchar("recipient_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique("testimonials_author_recipient_unique").on(t.authorId, t.recipientId),
    index("testimonials_recipient_idx").on(t.recipientId),
  ],
);

export type Testimonial = typeof testimonialsTable.$inferSelect;
