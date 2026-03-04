import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function withErrorHandling(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return fail(message, 500);
  }
}
