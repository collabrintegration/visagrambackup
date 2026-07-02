import { pgTable, serial, text, boolean, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const groupsTable = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji").notNull().default("🌍"),
  adminId: text("admin_id").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  parentGroupId: integer("parent_group_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembersTable = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("group_members_unique").on(t.groupId, t.userId),
]);

export const groupMessagesTable = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  content: text("content").notNull().default(""),
  gifUrl: text("gif_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groupsTable).omit({ id: true, adminId: true, createdAt: true });
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;

export const groupJoinRequestsTable = pgTable("group_join_requests", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("group_join_requests_unique").on(t.groupId, t.userId),
]);

export const blockedUsersTable = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  blockerId: text("blocker_id").notNull(),
  blockedId: text("blocked_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("blocked_users_unique").on(t.blockerId, t.blockedId),
]);

export const groupReportsTable = pgTable("group_reports", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  messageId: integer("message_id").references(() => groupMessagesTable.id, { onDelete: "set null" }),
  reportedUserId: text("reported_user_id").notNull(),
  reporterUserId: text("reporter_user_id").notNull(),
  reason: text("reason").notNull().default("inappropriate"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGroupMessageSchema = createInsertSchema(groupMessagesTable).omit({ id: true, userId: true, createdAt: true });
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type GroupMessage = typeof groupMessagesTable.$inferSelect;
export type GroupMember = typeof groupMembersTable.$inferSelect;
export type GroupJoinRequest = typeof groupJoinRequestsTable.$inferSelect;
export type BlockedUser = typeof blockedUsersTable.$inferSelect;
