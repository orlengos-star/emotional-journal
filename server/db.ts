import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  journalEntries,
  dayRatings,
  clientTherapistRelationships,
  notificationSettings,
  inviteTokens,
  notificationLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.telegramId !== undefined) {
      values.telegramId = user.telegramId;
      updateSet.telegramId = user.telegramId;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByTelegramId(telegramId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createJournalEntry(
  userId: number,
  text: string,
  entryDate: Date = new Date()
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(journalEntries).values({
    userId,
    text,
    entryDate,
  });

  return result;
}

export async function getJournalEntriesByDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.entryDate, startDate),
        lte(journalEntries.entryDate, endDate)
      )
    )
    .orderBy(desc(journalEntries.entryDate));

  return result;
}

export async function getJournalEntryById(entryId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, entryId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateJournalEntry(
  entryId: number,
  updates: { text?: string; therapistComments?: string; isHighlighted?: boolean }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(journalEntries)
    .set(updates)
    .where(eq(journalEntries.id, entryId));

  return result;
}

export async function deleteJournalEntry(entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(journalEntries).where(eq(journalEntries.id, entryId));
}

export async function upsertDayRating(
  userId: number,
  ratingDate: Date,
  clientRating?: "negative" | "mostly_negative" | "neutral" | "mostly_positive" | "positive",
  therapistId?: number,
  therapistRating?: "negative" | "mostly_negative" | "neutral" | "mostly_positive" | "positive"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(dayRatings)
    .where(
      and(
        eq(dayRatings.userId, userId),
        eq(dayRatings.ratingDate, ratingDate)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const updates: Record<string, unknown> = {};
    if (clientRating !== undefined) updates.clientRating = clientRating;
    if (therapistRating !== undefined) updates.therapistRating = therapistRating;
    if (therapistId !== undefined) updates.therapistId = therapistId;

    if (Object.keys(updates).length > 0) {
      return db
        .update(dayRatings)
        .set(updates as any)
        .where(eq(dayRatings.id, existing[0].id));
    }
  } else {
    return db.insert(dayRatings).values({
      userId,
      ratingDate,
      clientRating,
      therapistId,
      therapistRating,
    });
  }
}

export async function getDayRating(userId: number, ratingDate: Date) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(dayRatings)
    .where(
      and(
        eq(dayRatings.userId, userId),
        eq(dayRatings.ratingDate, ratingDate)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createClientTherapistRelationship(
  clientId: number,
  therapistId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(clientTherapistRelationships).values({
    clientId,
    therapistId,
  });
}

export async function getClientTherapists(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(clientTherapistRelationships)
    .where(
      and(
        eq(clientTherapistRelationships.clientId, clientId),
        eq(clientTherapistRelationships.isActive, true)
      )
    );

  return result;
}

export async function getTherapistClients(therapistId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(clientTherapistRelationships)
    .where(
      and(
        eq(clientTherapistRelationships.therapistId, therapistId),
        eq(clientTherapistRelationships.isActive, true)
      )
    );

  return result;
}

export async function createInviteToken(
  inviterId: number,
  inviterRole: "client" | "therapist",
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const token = generateRandomToken();

  return db.insert(inviteTokens).values({
    token,
    inviterId,
    inviterRole: inviterRole as "client" | "therapist",
    expiresAt,
  });
}

export async function getInviteToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(inviteTokens)
    .where(eq(inviteTokens.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function acceptInviteToken(token: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(inviteTokens)
    .set({ usedAt: new Date(), usedBy: userId })
    .where(eq(inviteTokens.token, token));
}

export async function getOrCreateNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  await db.insert(notificationSettings).values({
    userId,
    isEnabled: true,
    reminderTime: "09:00",
    reminderTimeEnd: "21:00",
    notifyIfNoEntries: true,
    notifyIfFewEntries: true,
    minEntriesThreshold: 3,
  });

  return db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1)
    .then((r) => r[0]);
}

export async function updateNotificationSettings(
  userId: number,
  updates: Partial<typeof notificationSettings.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(notificationSettings)
    .set(updates)
    .where(eq(notificationSettings.userId, userId));
}

export async function logNotification(
  userId: number,
  type: "daily_reminder" | "new_entry" | "batch_digest",
  metadata?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(notificationLog).values({
    userId,
    type,
    metadata,
  });
}

export async function getEntriesCountForDay(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return 0;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.entryDate, startOfDay),
        lte(journalEntries.entryDate, endOfDay)
      )
    );

  return result.length;
}

function generateRandomToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}
