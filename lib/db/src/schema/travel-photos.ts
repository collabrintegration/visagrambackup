import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const travelPhotosTable = pgTable("travel_photos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  objectPath: text("object_path").notNull(),
  caption: varchar("caption", { length: 300 }),
  orientation: varchar("orientation", { length: 10 }).notNull().default("landscape"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TravelPhoto = typeof travelPhotosTable.$inferSelect;
export type InsertTravelPhoto = typeof travelPhotosTable.$inferInsert;
