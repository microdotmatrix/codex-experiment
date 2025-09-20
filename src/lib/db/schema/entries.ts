import { relations } from "drizzle-orm";
import { boolean, date, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { pgTable } from "../utils";
import { UserTable } from "./users";

export const EntryTable = pgTable("entry", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  birthDate: date("birth_date").notNull(),
  deathDate: date("death_date").notNull(),
  causeOfDeath: text("cause_of_death"),
  location: text("location"),
  primaryImageUrl: text("primary_image_url"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const UserUploadTable = pgTable("user_upload", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => EntryTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  key: text("key").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const EntryRelations = relations(EntryTable, ({ one, many }) => ({
  owner: one(UserTable, {
    fields: [EntryTable.ownerId],
    references: [UserTable.id],
  }),
  uploads: many(UserUploadTable),
}));

export const UserUploadRelations = relations(UserUploadTable, ({ one }) => ({
  owner: one(UserTable, {
    fields: [UserUploadTable.userId],
    references: [UserTable.id],
  }),
  entry: one(EntryTable, {
    fields: [UserUploadTable.entryId],
    references: [EntryTable.id],
  }),
}));

export type Entry = typeof EntryTable.$inferSelect;
export type NewEntry = typeof EntryTable.$inferInsert;
export type UserUpload = typeof UserUploadTable.$inferSelect;
