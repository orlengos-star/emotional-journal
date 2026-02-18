import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  createJournalEntry: vi.fn(),
  getJournalEntriesByDateRange: vi.fn(),
  getJournalEntryById: vi.fn(),
  updateJournalEntry: vi.fn(),
  deleteJournalEntry: vi.fn(),
  upsertDayRating: vi.fn(),
  getDayRating: vi.fn(),
  getClientTherapists: vi.fn(),
  getTherapistClients: vi.fn(),
  createClientTherapistRelationship: vi.fn(),
  createInviteToken: vi.fn(),
  getInviteToken: vi.fn(),
  acceptInviteToken: vi.fn(),
  getOrCreateNotificationSettings: vi.fn(),
  updateNotificationSettings: vi.fn(),
}));

function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("tRPC Routers", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  describe("auth router", () => {
    it("should return current user from me query", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toEqual(ctx.user);
    });

    it("should clear cookie on logout", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });
  });

  describe("journal router", () => {
    it("should require authentication for journal operations", async () => {
      const publicCtx = { ...ctx, user: null };
      const caller = appRouter.createCaller(publicCtx as any);

      try {
        await caller.journal.getByDateRange({
          startDate: new Date(),
          endDate: new Date(),
        });
        expect.fail("Should throw UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("rating router", () => {
    it("should require authentication for rating operations", async () => {
      const publicCtx = { ...ctx, user: null };
      const caller = appRouter.createCaller(publicCtx as any);

      try {
        await caller.rating.getByDate({ date: new Date() });
        expect.fail("Should throw UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("relationship router", () => {
    it("should require authentication for relationship operations", async () => {
      const publicCtx = { ...ctx, user: null };
      const caller = appRouter.createCaller(publicCtx as any);

      try {
        await caller.relationship.getMyTherapists();
        expect.fail("Should throw UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("notifications router", () => {
    it("should require authentication for notification operations", async () => {
      const publicCtx = { ...ctx, user: null };
      const caller = appRouter.createCaller(publicCtx as any);

      try {
        await caller.notifications.getSettings();
        expect.fail("Should throw UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
