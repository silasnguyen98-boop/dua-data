import { query } from "@/lib/db";

export async function listAuthUsers() {
  const { rows } = await query("SELECT id, email, name, image, created_at FROM auth.users ORDER BY created_at DESC");
  return (rows || []).map((row: Record<string, unknown>) => ({
    id: String(row.id || ""),
    email: String(row.email || ""),
    fullName: String(row.name || ""),
    image: String(row.image || ""),
    createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : new Date().toISOString(),
  }));
}

export async function getAuthUserById(id: string) {
  const { rows } = await query("SELECT id, email, name, image FROM auth.users WHERE id = $1 LIMIT 1", [id]);
  return rows[0] || null;
}
