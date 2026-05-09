import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function migrateCourses() {
  try {
    console.log("Starting migration from Firebase to Supabase...");
    
    // Get all courses from Firebase
    const snapshot = await get(ref(db, "courses"));
    if (!snapshot.exists()) {
      console.log("No courses found in Firebase");
      return { success: true, migrated: 0 };
    }
    
    const firebaseData = snapshot.val();
    const courses = Object.entries(firebaseData).map(([key, val]: [string, any]) => ({
      id: key,
      ...val,
    }));
    
    console.log(`Found ${courses.length} courses in Firebase`);
    
    // Insert into Supabase
    const { error } = await supabase.from('courses').upsert(courses);
    
    if (error) {
      console.error("Migration error:", error);
      return { success: false, error: error.message };
    }
    
    console.log(`Successfully migrated ${courses.length} courses to Supabase`);
    return { success: true, migrated: courses.length };
  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, error: String(error) };
  }
}
