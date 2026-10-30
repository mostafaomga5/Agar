import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createBooking,
  createListing,
  createReview,
  getDashboard,
  getListing,
  listListings,
  listMessages,
  sendMessage,
  setListingVisibility,
  transitionBooking,
  updateListing,
} from "./marketplace";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

const imageReference = z.string().trim().min(1).max(2048).refine(
  value => /^https:\/\//i.test(value) || /^\/manus-storage\/[A-Za-z0-9/_\-.]+$/.test(value),
  "أدخل رابط صورة HTTPS أو مسار تخزين أجاري صالحًا",
);
const listingInput = z.object({
  title: z.string().trim().min(4).max(180),
  category: z.string().trim().min(2).max(64),
  city: z.string().trim().min(2).max(96),
  neighborhood: z.string().trim().min(2).max(128),
  pricePerUnit: z.number().int().positive().max(1_000_000),
  unit: z.string().trim().min(2).max(32),
  description: z.string().trim().min(20).max(8000),
  imageUrls: z.array(imageReference).min(1).max(8),
});
const listingFilters = z.object({
  category: z.string().trim().min(1).max(64).optional(),
  city: z.string().trim().min(1).max(96).optional(),
  query: z.string().trim().min(1).max(160).optional(),
  minPrice: z.number().int().min(1).max(1_000_000).optional(),
  maxPrice: z.number().int().min(1).max(1_000_000).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  marketplace: router({
    listings: publicProcedure.input(listingFilters.optional()).query(({ input }) => listListings(input ?? {})),
    listing: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getListing(input.id)),
    createListing: protectedProcedure.input(listingInput).mutation(({ ctx, input }) => createListing(ctx.user.id, input)),
    updateListing: protectedProcedure.input(listingInput.extend({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => updateListing(ctx.user.id, input)),
    setListingVisibility: protectedProcedure.input(z.object({ id: z.number().int().positive(), visible: z.boolean() }))
      .mutation(({ ctx, input }) => setListingVisibility(ctx.user.id, input.id, input.visible)),
    createBooking: protectedProcedure.input(z.object({
      listingId: z.number().int().positive(),
      startDate: z.string().date(),
      endDate: z.string().date(),
      note: z.string().max(2000).optional(),
    })).mutation(({ ctx, input }) => createBooking(ctx.user.id, input)),
    dashboard: protectedProcedure.query(({ ctx }) => getDashboard(ctx.user.id)),
    changeBookingStatus: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["approved", "rejected", "handed_over", "returned", "completed", "cancelled"]),
    })).mutation(({ ctx, input }) => transitionBooking(ctx.user.id, input.id, input.status)),
    messages: protectedProcedure.input(z.object({ requestId: z.number().int().positive() }))
      .query(({ ctx, input }) => listMessages(ctx.user.id, input.requestId)),
    sendMessage: protectedProcedure.input(z.object({
      requestId: z.number().int().positive(),
      content: z.string().trim().min(1).max(4000),
    })).mutation(({ ctx, input }) => sendMessage(ctx.user.id, input.requestId, input.content)),
    review: protectedProcedure.input(z.object({
      requestId: z.number().int().positive(), rating: z.number().int().min(1).max(5), body: z.string().trim().min(5).max(1500),
    })).mutation(({ ctx, input }) => createReview(ctx.user.id, input.requestId, input.rating, input.body)),
  }),
});

export type AppRouter = typeof appRouter;
