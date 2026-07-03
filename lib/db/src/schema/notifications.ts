import { pgTable, varchar, text, boolean, timestamp, pgEnum, serial, index } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const notificationTypeEnum = pgEnum("notification_type", [
  "friend_request",
  "message_request",
  "mention_qa",
  "mention_chat",
]);

export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    recipientId: varchar("recipient_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    actorId: varchar("actor_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    link: text("link").notNull(),
    preview: text("preview"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notifications_recipient_idx").on(t.recipientId),
    index("notifications_recipient_read_idx").on(t.recipientId, t.isRead),
    index("notifications_recipient_created_idx").on(t.recipientId, t.createdAt),
  ],
);

export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;
