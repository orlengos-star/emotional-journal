import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow and user management.
 * Supports both clients and therapists in the same system.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  telegramId: bigint("telegramId", { mode: "number" }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userRole: mysqlEnum("userRole", ["client", "therapist"]).default("client"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Journal entries table.
 * Stores all journal entries with timestamps and metadata.
 */
export const journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  text: text("text").notNull(),
  entryDate: timestamp("entryDate").notNull(), // The date the entry is for (can be backdated)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  therapistComments: text("therapistComments"), // Private notes from therapist
  isHighlighted: boolean("isHighlighted").default(false), // Therapist can highlight important entries
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

/**
 * Day ratings table.
 * Tracks 5-point scale ratings for each day by both client and therapist.
 */
export const dayRatings = mysqlTable(
  "dayRatings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    ratingDate: timestamp("ratingDate").notNull(), // The date being rated
    clientRating: mysqlEnum("clientRating", [
      "negative",
      "mostly_negative",
      "neutral",
      "mostly_positive",
      "positive",
    ]),
    therapistRating: mysqlEnum("therapistRating", [
      "negative",
      "mostly_negative",
      "neutral",
      "mostly_positive",
      "positive",
    ]), // Private rating from therapist
    therapistId: int("therapistId"), // ID of the therapist rating (if applicable)
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [unique().on(table.userId, table.ratingDate)]
);

export type DayRating = typeof dayRatings.$inferSelect;
export type InsertDayRating = typeof dayRatings.$inferInsert;

/**
 * Client-therapist relationships table.
 * Links clients to their therapists bidirectionally.
 */
export const clientTherapistRelationships = mysqlTable(
  "clientTherapistRelationships",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId").notNull(),
    therapistId: int("therapistId").notNull(),
    connectedAt: timestamp("connectedAt").defaultNow().notNull(),
    isActive: boolean("isActive").default(true),
  },
  (table) => [unique().on(table.clientId, table.therapistId)]
);

export type ClientTherapistRelationship =
  typeof clientTherapistRelationships.$inferSelect;
export type InsertClientTherapistRelationship =
  typeof clientTherapistRelationships.$inferInsert;

/**
 * Invite tokens table.
 * Stores shareable links for inviting therapists or clients.
 */
export const inviteTokens = mysqlTable("inviteTokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  inviterId: int("inviterId").notNull(), // User creating the invite
  inviterRole: mysqlEnum("inviterRole", ["client", "therapist"]).notNull(), // Role of the inviter
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  usedBy: int("usedBy"), // User who accepted the invite
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InviteToken = typeof inviteTokens.$inferSelect;
export type InsertInviteToken = typeof inviteTokens.$inferInsert;

/**
 * Notification settings table.
 * Stores per-user notification preferences.
 */
export const notificationSettings = mysqlTable("notificationSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  isEnabled: boolean("isEnabled").default(true),
  reminderTime: varchar("reminderTime", { length: 5 }), // HH:MM format
  reminderTimeEnd: varchar("reminderTimeEnd", { length: 5 }), // End of time range for reminders
  notifyIfNoEntries: boolean("notifyIfNoEntries").default(true),
  notifyIfFewEntries: boolean("notifyIfFewEntries").default(true),
  minEntriesThreshold: int("minEntriesThreshold").default(3),
  therapistNotificationMode: mysqlEnum("therapistNotificationMode", [
    "per_client",
    "batch_digest",
  ]),
  batchDigestTime: varchar("batchDigestTime", { length: 5 }), // HH:MM format for batch digest
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings =
  typeof notificationSettings.$inferInsert;

/**
 * Notification log table.
 * Tracks sent notifications for audit and deduplication.
 */
export const notificationLog = mysqlTable("notificationLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "daily_reminder",
    "new_entry",
    "batch_digest",
  ]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  metadata: text("metadata"), // JSON metadata about the notification
});

export type NotificationLog = typeof notificationLog.$inferSelect;
export type InsertNotificationLog = typeof notificationLog.$inferInsert;
