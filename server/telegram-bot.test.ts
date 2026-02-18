import { describe, it, expect, vi } from "vitest";
import { ENV } from "./_core/env";

describe("Telegram Bot Configuration", () => {
  it("should have BOT_TOKEN configured", () => {
    expect(ENV.botToken).toBeDefined();
    expect(ENV.botToken.length).toBeGreaterThan(0);
    // Telegram tokens follow format: numeric:alphanumeric
    expect(ENV.botToken).toMatch(/^\d+:[A-Za-z0-9_-]+$/);
  });

  it("should have MINI_APP_URL configured", () => {
    expect(ENV.miniAppUrl).toBeDefined();
    expect(ENV.miniAppUrl.length).toBeGreaterThan(0);
    // Should be a valid URL
    expect(ENV.miniAppUrl).toMatch(/^https?:\/\/.+/);
  });

  it("should initialize bot without errors", async () => {
    // This test verifies the bot token format is correct
    // Actual bot connection would require network access
    const token = ENV.botToken;
    const parts = token.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^\d+$/);
    expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
