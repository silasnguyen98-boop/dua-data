import { Alumni } from "@/types/alumni";
import AlumniClientPage from "./AlumniClientPage";

async function getAlumni(): Promise<Alumni[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/alumni`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function AlumniPage() {
  const allAlumni = await getAlumni();
  const alumni = allAlumni
    .filter((a) => a.published !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return <AlumniClientPage alumni={alumni} />;
}
