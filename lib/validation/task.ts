import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1).max(160),
  note: z.string().max(2000).optional(),
  reminderTime: z.string().datetime().optional(),
  status: z.enum(["pending", "completed"]).default("pending")
});

export const taskUpdateSchema = taskSchema.partial().extend({
  status: z.enum(["pending", "completed"]).optional()
});
