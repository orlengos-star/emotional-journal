import TelegramBot from "node-telegram-bot-api";
import * as db from "./db";
import { ENV } from "./_core/env";

const bot = new TelegramBot(ENV.botToken || "", { polling: true });

/**
 * Initialize Telegram bot handlers
 */
export function initializeTelegramBot() {
  if (!ENV.botToken) {
    console.warn("[Telegram] BOT_TOKEN not configured, bot will not start");
    return;
  }

  // Handle any message from users
  bot.on("message", async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;
    const text = msg.text;

    if (!telegramId || !text || text.startsWith("/")) {
      return; // Ignore commands and non-text messages
    }

    try {
      // Get or create user
      let user = await db.getUserByTelegramId(telegramId);

      if (!user) {
        // Create a new user with Telegram ID
        // In a real app, you'd need to handle OAuth or create a special auth flow
        console.log(`[Telegram] New user from Telegram: ${telegramId}`);
        // For now, we'll skip creating the user here
        // The user will be created when they first access the Mini App
        return;
      }

      // Create journal entry
      await db.createJournalEntry(user.id, text);

      // Format the date nicely
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Send confirmation with inline button
      const miniAppUrl = `${ENV.miniAppUrl}?date=${today.toISOString().split("T")[0]}`;

      await bot.sendMessage(
        chatId,
        `✓ Saved for today, ${dateStr}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "View",
                  url: miniAppUrl,
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error("[Telegram] Error handling message:", error);
      await bot.sendMessage(
        chatId,
        "Sorry, there was an error saving your entry. Please try again."
      );
    }
  });

  // Handle /start command
  bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;

    if (!telegramId) return;

    try {
      const miniAppUrl = ENV.miniAppUrl || "https://example.com";

      await bot.sendMessage(
        chatId,
        `Welcome to Emotional Journal! 🌿\n\nThis bot helps you journal your thoughts and feelings. Just send me any message and it will be saved as a journal entry.\n\nYou can also open the full app to:\n• Browse past entries\n• Rate your days\n• Connect with your therapist\n• Manage notifications`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Open App",
                  url: miniAppUrl,
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error("[Telegram] Error handling /start:", error);
    }
  });

  console.log("[Telegram] Bot initialized and listening for messages");
}

export { bot };
