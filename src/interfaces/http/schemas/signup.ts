import * as z from "zod";

export const setupUserWithEmailSchema = z.object({
  email: z.email(),
});

export const verifySetupUserWithEmailSchema = z.object({
  token: z.string(),
  code: z.string().length(6),
});
