import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

async function migrateCoursesToSupabase() {
  try {
    console.log("🚀 Starting migration from Firebase to Supabase...");
    
    // Initialize Firebase
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getDatabase(app);
    
    // Get all courses from Firebase
    const snapshot = await get(ref(db, "courses"));
    if (!snapshot.exists()) {
      console.log("ℹ️  No courses found in Firebase");
      process.exit(0);
    }
    
    const firebaseData = snapshot.val();
    const courses = Object.entries(firebaseData).map(([key, val]) => {
      // Handle complex objects that PostgreSQL might not like
      const course = {
        id: key,
        slug: val.slug || "",
        title: val.title || "",
        shortDescription: val.shortDescription || "",
        description: val.description || "",
        image: val.image || "",
        imageUrl: val.imageUrl || null,
        instructor: val.instructor || "Đội Ngũ DUA Edu",
        price: val.price ?? 0,
        originalPrice: val.originalPrice ?? 0,
        discount: val.discount ?? 0,
        totalLessons: val.totalLessons ?? 0,
        students: val.students ?? 0,
        rating: val.rating ?? 0,
        reviews: val.reviews ?? 0,
        startDate: val.startDate || "",
        endDate: val.endDate || null,
        registrationDeadline: val.registrationDeadline || null,
        schedule: val.schedule || "",
        hours: val.hours || "",
        category: val.category || "",
        published: val.published ?? false,
        comingSoon: val.comingSoon ?? false,
        isHidden: val.isHidden ?? false,
        hidePrice: val.hidePrice ?? false,
        createdAt: val.createdAt || new Date().toISOString(),
        updatedAt: val.updatedAt || new Date().toISOString(),
        curriculum: val.curriculum ? JSON.stringify(val.curriculum) : null,
        outcomes: val.outcomes ? JSON.stringify(val.outcomes) : null,
        targetAudience: val.targetAudience ? JSON.stringify(val.targetAudience) : null,
        waitList: val.waitList ? JSON.stringify(val.waitList) : null,
      };
      return course;
    });
    
    console.log(`✅ Found ${courses.length} courses in Firebase`);
    
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { realtime: { transport: ws } }
    );
    
    // Insert into Supabase - start with absolute minimum columns
    console.log("📤 Uploading to Supabase...");
    
    // Start with just the most essential columns
    const minimalCourses = courses.map(course => ({
      title: course.title,
      slug: course.slug,
      description: course.description,
    }));
    
    let { data, error } = await supabase.from('courses').insert(minimalCourses);
    
    // If successful, try with more columns
    if (!error && data && data.length > 0) {
      console.log("✅ Minimal insert successful! Now trying with all columns...");
      // Delete the test data
      await supabase.from('courses').delete().gt('id', '00000000-0000-0000-0000-000000000000');
      
      // Try full insert
      const fullCourses = courses.map(course => ({
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        description: course.description,
        image: course.image,
        imageUrl: course.imageUrl,
        instructor: course.instructor,
        price: course.price,
        originalPrice: course.originalPrice,
        discount: course.discount,
        totalLessons: course.totalLessons,
        students: course.students,
        rating: course.rating,
        reviews: course.reviews,
        startDate: course.startDate,
        endDate: course.endDate,
        registrationDeadline: course.registrationDeadline,
        schedule: course.schedule,
        hours: course.hours,
        category: course.category,
        published: course.published,
      }));
      const { data: fullData, error: fullError } = await supabase.from('courses').insert(fullCourses);
      if (fullError) {
        error = fullError;
        data = [];
      } else {
        data = fullData;
      }
    }
    
    if (error) {
      console.error("❌ Migration error:", error);
      process.exit(1);
    }
    
    console.log(`✅ Successfully migrated ${courses.length} courses to Supabase`);
    console.log("🎉 Migration completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateCoursesToSupabase();
