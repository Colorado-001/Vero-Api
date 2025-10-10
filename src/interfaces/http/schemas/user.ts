import * as z from "zod";

export const updateProfileSchema = z.object({
  username: z.string().min(3).nullable().optional(),
});

export const usernameAvailableCheckSchema = z.object({
  username: z.string().min(3),
});

export const setupPinSchema = z.object({
  pin: z.string().length(6),
});
