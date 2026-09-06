import { z } from "zod";

export const libraryStatusSchema = z.enum([
  "WATCHING",
  "COMPLETED",
  "PLAN_TO_WATCH",
  "ON_HOLD",
  "DROPPED",
]);
export const libraryCreateSchema = z.object({
  mediaId: z.string().min(1),
  status: libraryStatusSchema.default("PLAN_TO_WATCH"),
  progress: z.number().int().min(0).optional(),
  favorite: z.boolean().optional(),
});
export const libraryUpdateSchema = z.object({
  status: libraryStatusSchema.optional(),
  progress: z.number().int().min(0).optional(),
  favorite: z.boolean().optional(),
  watchedAt: z.string().datetime().optional(),
});

export const wishlistCreateSchema = z.object({
  mediaId: z.string().min(1),
  priority: z.number().int().min(0).max(5).default(0),
  note: z.string().trim().max(500).optional().nullable(),
});
export const wishlistUpdateSchema = z.object({
  priority: z.number().int().min(0).max(5).optional(),
  position: z.number().int().min(0).optional(),
  note: z.string().trim().max(500).optional().nullable(),
});

export const ratingSchema = z.object({
  mediaId: z.string().min(1),
  rating: z.number().min(0.5).max(7).multipleOf(0.5),
});
export const reviewSchema = z.object({
  mediaId: z.string().min(1),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(20).max(10000),
  spoiler: z.boolean().default(false),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});
export const reviewUpdateSchema = reviewSchema
  .omit({ mediaId: true })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one review field to update.",
  );
