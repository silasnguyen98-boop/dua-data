import { query } from "@/lib/db";

export async function listAuthUsers() {
  const { rows } = await query("SELECT id, email, name, image FROM auth.users ORDER BY email ASC");
  return (rows || []).map((row: Record<string, unknown>) => ({
    id: String(row.id || ""),
    email: String(row.email || ""),
    fullName: String(row.name || ""),
    image: String(row.image || ""),
  }));
}

export async function getAuthUserById(id: string) {
  const { rows } = await query("SELECT id, email, name, image FROM auth.users WHERE id = $1 LIMIT 1", [id]);
  return rows[0] || null;
}
