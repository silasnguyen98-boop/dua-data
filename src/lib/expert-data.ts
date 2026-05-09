type Row = Record<string, unknown>;

export interface Expert {
  id: string;
  name: string;
  position: string;
  previousWork?: string;
  avatarUrl?: string;
  linkedin?: string;
  order?: number;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function getValue(row: Row, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return undefined;
}

function getString(row: Row, keys: string[], fallback = ""): string {
  const value = getValue(row, keys);
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function getNumber(row: Row, keys: string[], fallback = 0): number {
  const value = getValue(row, keys);
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function getBoolean(row: Row, keys: string[], fallback = false): boolean {
  const value = getValue(row, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  if (typeof value === "number") return value !== 0;
  return fallback;
}

export function normalizeExpertRow(row: Row): Expert {
  return {
    id: getString(row, ["id"]),
    name: getString(row, ["name"]),
    position: getString(row, ["position"]),
    previousWork: getString(row, ["previous_work", "previousWork"], "") || undefined,
    avatarUrl: getString(row, ["avatar_url", "avatarUrl"], "") || undefined,
    linkedin: getString(row, ["linkedin"], "") || undefined,
    order: getNumber(row, ["display_order", "order"]),
    published: getBoolean(row, ["published"], true),
    createdAt: getString(row, ["created_at", "createdAt"], "") || undefined,
    updatedAt: getString(row, ["updated_at", "updatedAt"], "") || undefined,
  };
}

export function normalizeExpertRows(rows: Row[]): Expert[] {
  return rows.map((row) => normalizeExpertRow(row));
}

export function buildExpertPayload(data: Row, includeTimestamps = true) {
  const now = new Date().toISOString();

  return {
    firebase_id: getString(data, ["firebaseId", "firebase_id"], "") || null,
    name: getString(data, ["name"]),
    position: getString(data, ["position"]),
    previous_work: getString(data, ["previousWork", "previous_work"], "") || null,
    avatar_url: getString(data, ["avatarUrl", "avatar_url"], "") || null,
    linkedin: getString(data, ["linkedin"], "") || null,
    display_order: getNumber(data, ["order", "display_order"]),
    published: getBoolean(data, ["published"], true),
    ...(includeTimestamps
      ? {
          created_at: getString(data, ["createdAt", "created_at"], now) || now,
          updated_at: now,
        }
      : {}),
  };
}

