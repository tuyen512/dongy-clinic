import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3).max(80),
  password: z.string().min(8).max(100),
  role: z.enum(["ADMIN", "DOCTOR", "STAFF"])
});

export const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "DOCTOR", "STAFF"]).optional(),
  isLocked: z.boolean().optional(),
  password: z.string().min(8).max(100).optional()
});
