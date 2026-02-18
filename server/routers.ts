import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Journal Entry procedures
  journal: router({
    create: protectedProcedure
      .input(
        z.object({
          text: z.string().min(1),
          entryDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const entry = await db.createJournalEntry(
          ctx.user.id,
          input.text,
          input.entryDate || new Date()
        );
        return entry;
      }),

    getByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ ctx, input }) => {
        const entries = await db.getJournalEntriesByDateRange(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
        return entries;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const entry = await db.getJournalEntryById(input.id);
        if (!entry) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        // Verify ownership or therapist access
        if (entry.userId !== ctx.user.id) {
          const therapists = await db.getClientTherapists(ctx.user.id);
          const isTherapist = therapists.some((t) => t.therapistId === ctx.user.id);
          if (!isTherapist) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }
        return entry;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          text: z.string().optional(),
          therapistComments: z.string().optional(),
          isHighlighted: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const entry = await db.getJournalEntryById(input.id);
        if (!entry) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Only owner can edit text, only therapist can edit comments/highlight
        if (input.text !== undefined && entry.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        if (
          (input.therapistComments !== undefined ||
            input.isHighlighted !== undefined) &&
          entry.userId !== ctx.user.id
        ) {
          // Verify therapist access
          const clients = await db.getTherapistClients(ctx.user.id);
          const isOwnClient = clients.some((c) => c.clientId === entry.userId);
          if (!isOwnClient) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }

        await db.updateJournalEntry(input.id, {
          text: input.text,
          therapistComments: input.therapistComments,
          isHighlighted: input.isHighlighted,
        });

        return db.getJournalEntryById(input.id);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const entry = await db.getJournalEntryById(input.id);
        if (!entry) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (entry.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteJournalEntry(input.id);
        return { success: true };
      }),
  }),

  // Day Rating procedures
  rating: router({
    upsert: protectedProcedure
      .input(
        z.object({
          ratingDate: z.date(),
          clientRating: z
            .enum([
              "negative",
              "mostly_negative",
              "neutral",
              "mostly_positive",
              "positive",
            ])
            .optional(),
          therapistRating: z
            .enum([
              "negative",
              "mostly_negative",
              "neutral",
              "mostly_positive",
              "positive",
            ])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertDayRating(
          ctx.user.id,
          input.ratingDate,
          input.clientRating,
          undefined,
          input.therapistRating
        );
        return db.getDayRating(ctx.user.id, input.ratingDate);
      }),

    getByDate: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        return db.getDayRating(ctx.user.id, input.date);
      }),
  }),

  // Client-Therapist Relationship procedures
  relationship: router({
    getMyTherapists: protectedProcedure.query(async ({ ctx }) => {
      const relationships = await db.getClientTherapists(ctx.user.id);
      return relationships;
    }),

    getMyClients: protectedProcedure.query(async ({ ctx }) => {
      const relationships = await db.getTherapistClients(ctx.user.id);
      return relationships;
    }),

    createInvite: protectedProcedure
      .input(
        z.object({
          role: z.enum(["client", "therapist"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiry

        const result = await db.createInviteToken(
          ctx.user.id,
          input.role,
          expiresAt
        );

        // Get the token we just created
        const tokens = await db.getInviteToken("");
        // This is a workaround - in production, you'd return the token from the insert
        return {
          success: true,
          expiresAt,
        };
      }),

    acceptInvite: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const invite = await db.getInviteToken(input.token);
        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite" });
        }

        if (invite.usedAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invite already used",
          });
        }

        if (new Date() > invite.expiresAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invite expired",
          });
        }

        // Create relationship based on inviter role
        if (invite.inviterRole === "therapist") {
          // Inviter is therapist, current user is client
          await db.createClientTherapistRelationship(ctx.user.id, invite.inviterId);
        } else {
          // Inviter is client, current user is therapist
          await db.createClientTherapistRelationship(invite.inviterId, ctx.user.id);
        }

        await db.acceptInviteToken(input.token, ctx.user.id);
        return { success: true };
      }),
  }),

  // Notification Settings procedures
  notifications: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateNotificationSettings(ctx.user.id);
    }),

    updateSettings: protectedProcedure
      .input(
        z.object({
          isEnabled: z.boolean().optional(),
          reminderTime: z.string().optional(),
          reminderTimeEnd: z.string().optional(),
          notifyIfNoEntries: z.boolean().optional(),
          notifyIfFewEntries: z.boolean().optional(),
          minEntriesThreshold: z.number().optional(),
          therapistNotificationMode: z
            .enum(["per_client", "batch_digest"])
            .optional(),
          batchDigestTime: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateNotificationSettings(ctx.user.id, input);
        return db.getOrCreateNotificationSettings(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
