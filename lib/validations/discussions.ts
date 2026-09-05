import { z } from "zod";
import { ThreadCategory } from "@prisma/client";

export const discussionThreadCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(255, "Title cannot exceed 255 characters."),
  body: z
    .string()
    .trim()
    .min(10, "Opening post must be at least 10 characters.")
    .max(20000, "Opening post cannot exceed 20,000 characters."),
  spoiler: z.boolean().optional().default(false),
  category: z
    .nativeEnum(ThreadCategory)
    .optional()
    .default(ThreadCategory.GENERAL),
});

export type DiscussionThreadCreateInput = z.infer<typeof discussionThreadCreateSchema>;

export const discussionReplyCreateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(2, "Reply must be at least 2 characters.")
    .max(10000, "Reply cannot exceed 10,000 characters."),
  attachmentUrls: z
    .array(
      z
        .string()
        .url("Attachment must be a valid URL.")
        .max(1000, "Attachment URL is too long.")
    )
    .max(10, "Cannot attach more than 10 images.")
    .optional()
    .default([]),
});

export type DiscussionReplyCreateInput = z.infer<typeof discussionReplyCreateSchema>;
