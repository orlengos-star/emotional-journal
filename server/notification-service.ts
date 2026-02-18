import { bot } from "./telegram-bot";
import * as db from "./db";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { users, notificationSettings } from "../drizzle/schema";

/**
 * Check if user should receive a daily reminder
 * Returns true if user has entries enabled and hasn't been reminded today
 */
export async function shouldSendDailyReminder(userId: number): Promise<boolean> {
  const settings = await db.getOrCreateNotificationSettings(userId);
  
  if (!settings.isEnabled) return false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

  // Check if current time is within reminder window
  const reminderTime = settings.reminderTime || "09:00";
  const reminderTimeEnd = settings.reminderTimeEnd || "21:00";

  if (currentTime < reminderTime || currentTime > reminderTimeEnd) {
    return false;
  }

  // Check if user has entries today
  const entriesCount = await db.getEntriesCountForDay(userId, now);

  // Notify if no entries and setting is enabled
  if (settings.notifyIfNoEntries && entriesCount === 0) {
    return true;
  }

  // Notify if fewer than threshold entries and setting is enabled
  if (
    settings.notifyIfFewEntries &&
    entriesCount < (settings.minEntriesThreshold || 3) &&
    entriesCount > 0
  ) {
    return true;
  }

  return false;
}

/**
 * Send a daily reminder to a user via Telegram
 */
export async function sendDailyReminder(userId: number): Promise<void> {
  try {
    const user = await getDb()
      .then((db) =>
        db
          ?.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
      )
      .then((result) => result?.[0]);

    if (!user || !user.telegramId) {
      console.log(`[Notifications] User ${userId} has no Telegram ID`);
      return;
    }

    const settings = await db.getOrCreateNotificationSettings(userId);
    const entriesCount = await db.getEntriesCountForDay(userId, new Date());

    let message = "";
    if (entriesCount === 0) {
      message =
        "🌿 Good morning! How are you feeling today? Take a moment to journal your thoughts and feelings.";
    } else if (entriesCount < (settings.minEntriesThreshold || 3)) {
      message = `💭 You've written ${entriesCount} ${entriesCount === 1 ? "entry" : "entries"} today. Consider adding more to capture your full emotional journey.`;
    }

    if (message) {
      await bot.sendMessage(user.telegramId, message);
      await db.logNotification(userId, "daily_reminder", message);
      console.log(`[Notifications] Sent daily reminder to user ${userId}`);
    }
  } catch (error) {
    console.error(`[Notifications] Error sending daily reminder to user ${userId}:`, error);
  }
}

/**
 * Send a new entry notification to therapist
 */
export async function notifyTherapistOfNewEntry(
  clientId: number,
  entryId: number
): Promise<void> {
  try {
    // Get therapists connected to this client
    const relationships = await db.getClientTherapists(clientId);

    for (const relationship of relationships) {
      const therapistSettings = await db.getOrCreateNotificationSettings(
        relationship.therapistId
      );

      if (!therapistSettings.isEnabled) continue;

      // Get therapist user info
      const therapistDb = await getDb();
      if (!therapistDb) return;

      const therapist = await therapistDb
        .select()
        .from(users)
        .where(eq(users.id, relationship.therapistId))
        .limit(1)
        .then((r) => r[0]);

      if (!therapist || !therapist.telegramId) continue;

      // Check notification mode
      if (therapistSettings.therapistNotificationMode === "per_client") {
        // Send immediate notification
        const message = `📝 Your client has written a new journal entry. Open the app to read it.`;
        await bot.sendMessage(therapist.telegramId, message);
        await db.logNotification(
          relationship.therapistId,
          "new_entry",
          `New entry from client ${clientId}`
        );
      }
      // For batch_digest mode, we'll handle it in a separate batch job
    }
  } catch (error) {
    console.error(
      `[Notifications] Error notifying therapist of new entry:`,
      error
    );
  }
}

/**
 * Send batch digest to therapist
 */
export async function sendTherapistBatchDigest(therapistId: number): Promise<void> {
  try {
    const therapistSettings = await db.getOrCreateNotificationSettings(therapistId);

    if (!therapistSettings.isEnabled || therapistSettings.therapistNotificationMode !== "batch_digest") {
      return;
    }

    // Get therapist user info
    const therapistDb = await getDb();
    if (!therapistDb) return;

    const therapist = await therapistDb
      .select()
      .from(users)
      .where(eq(users.id, therapistId))
      .limit(1)
      .then((r) => r[0]);

    if (!therapist || !therapist.telegramId) return;

    // Get clients and their new entries from today
    const relationships = await db.getTherapistClients(therapistId);

    if (relationships.length === 0) {
      return;
    }

    // Build digest message
    let digestMessage = "📊 Daily Digest - New Client Entries:\n\n";
    let hasNewEntries = false;

    for (const relationship of relationships) {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const entries = await db.getJournalEntriesByDateRange(
        relationship.clientId,
        startOfDay,
        endOfDay
      );

      if (entries.length > 0) {
        hasNewEntries = true;
        digestMessage += `👤 Client #${relationship.clientId}: ${entries.length} ${entries.length === 1 ? "entry" : "entries"}\n`;
      }
    }

    if (hasNewEntries) {
      digestMessage += "\nOpen the app to view all entries.";
      await bot.sendMessage(therapist.telegramId, digestMessage);
      await db.logNotification(therapistId, "batch_digest", digestMessage);
      console.log(`[Notifications] Sent batch digest to therapist ${therapistId}`);
    }
  } catch (error) {
    console.error(`[Notifications] Error sending batch digest:`, error);
  }
}

/**
 * Start background notification jobs
 * Should be called once on server startup
 */
export function startNotificationJobs(): void {
  // Run daily reminder check every minute
  // In production, you'd want to optimize this
  setInterval(async () => {
    try {
      const db_instance = await getDb();
      if (!db_instance) return;

      const allUsers = await db_instance.select().from(users);

      for (const user of allUsers) {
        if (await shouldSendDailyReminder(user.id)) {
          await sendDailyReminder(user.id);
        }
      }
    } catch (error) {
      console.error("[Notifications] Error in daily reminder job:", error);
    }
  }, 60000); // Check every minute

  // Run batch digest check every hour
  setInterval(async () => {
    try {
      const db_instance = await getDb();
      if (!db_instance) return;

      const allUsers = await db_instance.select().from(users);

      for (const user of allUsers) {
        const settings = await db.getOrCreateNotificationSettings(user.id);
        if (settings.therapistNotificationMode === "batch_digest") {
          // Check if it's time for batch digest
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          const batchTime = settings.batchDigestTime || "18:00";

          if (currentTime === batchTime) {
            await sendTherapistBatchDigest(user.id);
          }
        }
      }
    } catch (error) {
      console.error("[Notifications] Error in batch digest job:", error);
    }
  }, 3600000); // Check every hour

  console.log("[Notifications] Background notification jobs started");
}
