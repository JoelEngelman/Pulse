import { integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userBlocksTable = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  blockedId: integer("blocked_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique("uq_user_block").on(t.blockerId, t.blockedId)]);

export const safetyReportsTable = pgTable("safety_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  reportedUserId: integer("reported_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  messageId: integer("message_id"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserBlock = typeof userBlocksTable.$inferSelect;
export type SafetyReport = typeof safetyReportsTable.$inferSelect;
