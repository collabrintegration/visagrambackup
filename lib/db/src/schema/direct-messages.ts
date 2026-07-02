import { boolean, integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const dmConversationsTable = pgTable("dm_conversations", {
  id: serial("id").primaryKey(),
  user1Id: text("user1_id").notNull(),
  user2Id: text("user2_id").notNull(),
  status: text("status").notNull().default("request"),
  requestedBy: text("requested_by").notNull(),
  blockedBy: text("blocked_by"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("dm_conversations_user_pair").on(t.user1Id, t.user2Id),
]);

export const dmMessagesTable = pgTable("dm_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => dmConversationsTable.id, { onDelete: "cascade" }),
  fromUserId: text("from_user_id").notNull(),
  content: text("content").notNull().default(""),
  gifUrl: text("gif_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DmConversation = typeof dmConversationsTable.$inferSelect;
export type DmMessage = typeof dmMessagesTable.$inferSelect;
