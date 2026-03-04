import { z } from "zod";

export const customerSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().max(20).optional(),
  birthDate: z.string().date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().max(255).optional(),
  diagnosis: z.string().max(2000).optional(),
  treatmentPlan: z.string().max(4000).optional(),
  notes: z.string().max(4000).optional()
});
