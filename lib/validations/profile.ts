import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username can be at most 30 characters.")
  .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only.");

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(80),
  username: usernameSchema,
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z
    .union([z.literal(""), z.string().url("Enter a valid image URL.")])
    .optional(),
  libraryPublic: z.boolean().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
