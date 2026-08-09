import { z } from "zod";
import { usernameSchema } from "@/lib/validations/profile";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    username: usernameSchema,
    displayName: z.string().trim().min(1, "Display name is required.").max(80),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
