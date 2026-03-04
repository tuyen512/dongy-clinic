import { z } from "zod";

export const orderItemSchema = z.object({
  medicine_id: z.string().uuid(),
  quantity: z.number().int().positive()
});

export const orderSchema = z.object({
  patient_id: z.string().uuid(),
  order_date: z.string().date(),
  treatment_days: z.number().int().positive().max(365),
  status: z.enum(["pending", "processing", "shipping", "paid", "received", "completed", "cancelled"]).default("pending"),
  notes: z.string().max(4000).optional(),
  items: z.array(orderItemSchema).min(1)
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipping", "paid", "received", "completed", "cancelled"]),
  received_date: z.string().date().optional()
});
