import { z } from "zod";

export const createVisitSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_name: z.string().min(1).max(120),
  diagnosis: z.string().min(1).max(2000),
  visit_date: z.string().date(),
  note: z.string().max(2000).optional()
});
