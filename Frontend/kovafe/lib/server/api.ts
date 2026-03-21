import { NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export function parseCursor(value: string | null) {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function parseLimit(value: string | null, fallback = DEFAULT_LIMIT) {
  const parsed = Number.parseInt(value ?? `${fallback}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_LIMIT);
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function mapByKey<
  T extends Record<string, unknown>,
  K extends keyof T & string,
>(items: T[], key: K) {
  return new Map(items.map((item) => [String(item[key]).toLowerCase(), item]));
}

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
