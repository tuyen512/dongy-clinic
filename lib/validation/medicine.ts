import { z } from "zod";

export const medicineSchema = z.object({
  name: z.string().min(1).max(160),
  unit: z.string().min(1).max(40),
  unitPrice: z.number().nonnegative(),
  stockQuantity: z.number().int().nonnegative(),
  notes: z.string().max(2000).optional()
});

export const medicineUpdateSchema = medicineSchema.partial();
