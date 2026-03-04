import { z } from "zod";

export const registerSchema = z.object({
  clinicName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(120),
  phone: z.string().max(20).optional(),
  notes: z.string().max(2000).optional()
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export async function parseBody<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as T;
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries()) as T;
}
