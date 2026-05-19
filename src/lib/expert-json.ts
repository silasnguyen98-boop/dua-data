import fs from "fs/promises";
import path from "path";

import { type Expert, normalizeExpertRows } from "@/lib/expert-data";

export async function readExpertsJson(): Promise<Expert[]> {
  try {
    const filePath = path.join(process.cwd(), "src/data/experts.json");
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? normalizeExpertRows(parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

export async function readExpertsByGroup(group: string): Promise<Expert[]> {
  const experts = await readExpertsJson();
  return experts
    .filter((expert) => (expert.group || "home") === group && expert.published !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}
