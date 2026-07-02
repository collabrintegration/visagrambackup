import { pgTable, varchar, timestamp, pgEnum, unique, index } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const friendshipStatusEnum = pgEnum("friendship_status", ["pending", "accepted", "declined"]);

export const friendshipsTable = pgTable(
  "friendships",
  {
    requesterId: varchar("requester_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    addresseeId: varchar("addressee_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique("friendships_unique").on(t.requesterId, t.addresseeId),
    index("friendships_addressee_idx").on(t.addresseeId),
  ],
);

export type Friendship = typeof friendshipsTable.$inferSelect;
