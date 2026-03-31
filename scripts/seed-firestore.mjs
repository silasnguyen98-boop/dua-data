import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { readFileSync } from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyDuFVURdqSanp4kGXPtGAVn_Xew5jFGvkU",
  authDomain: "duadata-b0fb8.firebaseapp.com",
  databaseURL: "https://duadata-b0fb8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "duadata-b0fb8",
  storageBucket: "duadata-b0fb8.firebasestorage.app",
  messagingSenderId: "275027001067",
  appId: "1:275027001067:web:08da5817b59099a7d388ae",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function seed() {
  // Seed courses
  const courses = JSON.parse(readFileSync("src/data/courses.json", "utf-8"));
  const coursesObj = {};
  courses.forEach((course, i) => {
    const key = `course_${i + 1}`;
    const { id, ...data } = course;
    coursesObj[key] = data;
  });

  console.log(`Seeding ${courses.length} courses...`);
  await set(ref(db, "courses"), coursesObj);
  courses.forEach((c, i) => console.log(`  + course_${i + 1}: ${c.title}`));

  // Seed empty students node
  console.log("Creating students node...");
  await set(ref(db, "students"), null);

  console.log("\nDone! Firebase Realtime Database seeded.");
  console.log("Structure:");
  console.log("  /courses");
  console.log("    /course_1 (Lap trinh Python co ban)");
  console.log("    /course_2 (Data Science voi Python)");
  console.log("    /course_3 (Lap trinh Web Fullstack)");
  console.log("    /course_4 (SQL va Co so du lieu)");
  console.log("  /students");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
});
