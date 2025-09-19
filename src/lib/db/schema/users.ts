import { relations } from "drizzle-orm";
import { boolean, text, timestamp } from "drizzle-orm/pg-core";
import { pgTable } from "../utils";

export const UserTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const UserRelations = relations(UserTable, ({ one }) => ({
  settings: one(UserSettingsTable, {
    fields: [UserTable.id],
    references: [UserSettingsTable.userId],
  }),
}));

export const UserSettingsTable = pgTable("user_settings", {
  userId: text("user_id")
    .notNull()
    .primaryKey()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  theme: text("theme").default("system").notNull(),
  notifications: boolean("notifications").default(true).notNull(),
  cookies: boolean("cookies").default(false).notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const UserSettingsRelations = relations(
  UserSettingsTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [UserSettingsTable.userId],
      references: [UserTable.id],
    }),
  })
);

export type User = typeof UserTable.$inferSelect;
export type UserSettings = typeof UserSettingsTable.$inferSelect;
