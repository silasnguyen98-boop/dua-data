import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);

async function seed() {
  const USERS_REF = "users/_system";

  // Check if duadata already exists
  const snapshot = await get(ref(db, USERS_REF));
  let exists = false;
  if (snapshot.exists()) {
    const users = snapshot.val();
    exists = Object.values(users).some((u: any) => u.username === "duadata");
  }

  if (exists) {
    console.log("User 'duadata' already exists, skipping.");
  } else {
    // Push the system admin user
    const newRef = ref(db, `${USERS_REF}/system_admin`);
    await set(newRef, {
      username: "duadata",
      password: "dua1234data@",
      role: "system_admin",
      name: "Quản trị viên",
      createdAt: new Date().toISOString(),
    });
    console.log("Created system admin user 'duadata' with password 'dua1234data@'");
  }

  // Also seed a sample Content Manager and Sales user for testing
  const cmRef = ref(db, `${USERS_REF}/content_manager_demo`);
  const cmSnap = await get(cmRef);
  if (!cmSnap.exists()) {
    await set(cmRef, {
      username: "content",
      password: "content123",
      role: "content_manager",
      name: "Người quản lý nội dung",
      createdAt: new Date().toISOString(),
    });
    console.log("Created demo content_manager user 'content'");
  }

  const salesRef = ref(db, `${USERS_REF}/sales_demo`);
  const salesSnap = await get(salesRef);
  if (!salesSnap.exists()) {
    await set(salesRef, {
      username: "sales",
      password: "sales123",
      role: "sales_executive",
      name: "Nhân viên kinh doanh",
      createdAt: new Date().toISOString(),
    });
    console.log("Created demo sales_executive user 'sales'");
  }

  console.log("Done!");
}

seed().catch(console.error);
