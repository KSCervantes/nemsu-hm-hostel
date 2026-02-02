/**
 * Firebase Seed Script
 *
 * This script uploads initial food items and creates an admin user in Firebase.
 *
 * Usage:
 * npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-firebase.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as bcrypt from "bcryptjs";
import * as path from "path";

// Initialize Firebase Admin SDK
const serviceAccountPath = "./hm-hostel-firebase-adminsdk-fbsvc-965d822ee2.json";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require(path.resolve(process.cwd(), serviceAccountPath));

initializeApp({
  credential: cert(serviceAccount),
  projectId: "hm-hostel",
});

const db = getFirestore();
console.log("✓ Firebase Admin SDK initialized");

// Collection names
const COLLECTIONS = {
  ADMIN_USERS: "adminUsers",
  FOOD_ITEMS: "foodItems",
  COUNTERS: "counters",
  APP_SETTINGS: "appSettings",
};

// Menu items data
const menuItems = [
  // MAIN DISHES
  { name: "CHICKEN & PORK SHASHLIK (2 PCS)", price: 120, description: "CHICKEN AND PORK SHASHLIK IS A GREAT WAY TO KICK YOUR CHICKEN TIKKA UP A BIG NOTCH. TANDOORI CHICKEN AND PORK ON A BED OF INDIAN SPICED ONION, GREEN AND RED PEPPER.", img: "/img/chicken-pork-shashlik-2pcs.webp", category: "main", code: "M1", available: true },
  { name: "HAINANESE PORK CHOP", price: 130, description: "SINGAPOREAN DISH, RECIPE USING CREAM CRACKERS TO GIVE THE PORK CHOPS A UNIQUE CRUNCH AND FLAVOUR. TOPPED WITH A SAVOURY SAUCE WITH SLICED POTATOES, PEAS, ONIONS AND CARROTS.", img: "/img/hainanese-pork-chop.webp", category: "main", code: "M2", available: true },
  { name: "CREAMY TUSCAN CHICKEN", price: 140, description: "FEATURES TENDER CHICKEN BREASTS, SUN-DRIED TOMATOES, SPINACH, GARLIC AND MORE ALL IN THE BEST PARMESAN CREAM SAUCE", img: "/img/creamy-tuscan-chicken.webp", category: "main", code: "M3", available: true },
  { name: "BIBIMBAP", price: 160, description: "A KOREAN RICE DISH, THE TERM BIBIM MEANS 'MIXING' AND BAP IS COOKED RICE. IT IS SERVED AS A BOWL OF WARM WHITE RICE TOPPED WITH NAMUL AND GOCHUJANG, EGG AND SLICED MEAT.", img: "/img/bibimbap.webp", category: "main", code: "M4", available: true },

  // SNACKS
  { name: "UBE MALAGKIT TURON WITH CHEESE (3PCS)", price: 35, description: "UBE MALAGKIT AND CHEDDAR CHEESE WRAPPED LIKE A SPRING ROLL AND FRIED UNTIL CRISPY", img: "/img/ube-malagkit-turon-cheese-3pcs.webp", category: "snacks", code: "S1", available: true },
  { name: "PINSEC FRITO (4 PCS)", price: 45, description: "DISH THAT RESEMBLES THE ALL-TIME FAVORITE FILIPINO CHINESE DIMSUM, PORK SIOMAI. PINSEC FRITO IS FRIED UNTIL THE WRAPPER TURNS CRISPY AND GOLDEN BROWN IN COLOR.", img: "/img/pinsec-frito-4pcs.webp", category: "snacks", code: "S2", available: true },
  { name: "TSUKUNE (4 PCS)", price: 60, description: "TSUKUNE ARE FRIED JAPANESE PORK MEATBALL, GLAZED IN A DELICIOUS SWEET SAVORY SAUCE.", img: "/img/tsukune-4pcs.webp", category: "snacks", code: "S3", available: true },
  { name: "CHEESY TAKOYAKI PIZZA (3 PCS) BITE SIZE", price: 80, description: "MADE OF A WHEAT FLOUR BATTER AND COOKED IN AN AIR FRYER, IT IS FILLED WITH MOZZARELLA, DICED SHRIMP, TEMPURA SCRAPS, AND GREEN ONION DRIZZLED WITH JAPANESE MAYONNAISE.", img: "/img/cheesy-takoyaki-pizza-3pcs-bitesize.webp", category: "snacks", code: "S4", available: true },
  { name: "MOZZARELLA STICK (4PCS)", price: 80, description: "CRISPY PIZZA TOPPED WITH A FLAVOR PACKED MIXTURE OF MINCED MEAT WITH PEPPERS, TOMATO, FRESH HERBS AND EARTHY SPICES.", img: "/img/mozzarella-stick-4pcs.webp", category: "snacks", code: "S5", available: true },

  // DESSERTS/SWEETS
  { name: "MINI BLAZED DONUTS (4 PCS)", price: 50, description: "BAKED AND COATED IN CINNAMON AND SUGAR ARE A LIGHTER AND EQUALLY DELICIOUS TASTE WITH NUMEROUS", img: "/img/mini-blazed-donuts-4pcs.webp", category: "desserts", code: "D1", available: true },
  { name: "CHE CHUOI", price: 55, description: "VIETNAMESE PUDDING-LIKE DESSERT FEATURING BANANAS, AND RICH COCONUT CREAM.", img: "/img/che-chuoi.webp", category: "desserts", code: "D2", available: true },
  { name: "MANGO STICKY RICE", price: 65, description: "CLASSIC THAI DESSERT THAT'S EASY TO MAKE AT HOME WITH STICKY WHITE RICE, A SWEET COCONUT SAUCE, AND SLICES OF FRESH MANGO.", img: "/img/mango-sticky-rice.webp", category: "desserts", code: "D3", available: true },

  // DRINKS - SPECIAL ICE COFFEE
  { name: "ICE MATCHA CREAM", price: 65, description: "A STRONG, ICED MATCHA LATTE TOPPED WITH A THICK LAYER OF WHIPPED CREAM.", img: "/img/ice-matcha-cream.webp", category: "drinks", code: "C1", available: true },
  { name: "ICE DOUBLE CHOCOLATE CREAM", price: 70, description: "DARK CHOCOLATE TOPPED WITH WHIPPED CREAM AND CHOCOLATE SYRUP", img: "/img/ice-double-chocolate-cream.webp", category: "drinks", code: "C2", available: true },

  // DRINKS - REFRESHING DRINKS
  { name: "FOUR SEASONS", price: 30, description: "REFRESHING DRINK SOURCE OF 100% VITAMIN C. EVERY SIP MAKES IT A PERFECT PAIR FOR EVERY MEAL.", img: "/img/four-seasons.webp", category: "drinks", code: "R1", available: true },
  { name: "LEMON ICE TEA", price: 30, description: "REFRESHING DRINK LEMON ICED TEA WITH SUGAR, LEMON.", img: "/img/lemon-ice-tea.webp", category: "drinks", code: "R2", available: true }
];

// Default app settings
const defaultSettings = {
  primaryColor: "#667eea",
  secondaryColor: "#764ba2",
  accentColor: "#10b981",
  dangerColor: "#dc2626",
  fontFamily: "system-ui",
  fontSize: "14",
  siteName: "Hostel Admin",
  itemsPerPage: "10",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  emailNotifications: true,
  orderNotifications: true,
  systemNotifications: true,
  enableDebugMode: false,
  sessionTimeout: "30",
};

async function seedFoodItems() {
  console.log("\n📦 Seeding Food Items...");

  const batch = db.batch();
  const now = Timestamp.now();
  let count = 0;

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const docRef = db.collection(COLLECTIONS.FOOD_ITEMS).doc();

    batch.set(docRef, {
      numericId: i + 1,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      code: item.code,
      img: item.img,
      available: item.available,
      createdAt: now,
      updatedAt: now,
    });
    count++;
  }

  // Set the counter
  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc("foodItems");
  batch.set(counterRef, { value: menuItems.length });

  await batch.commit();
  console.log(`✓ Seeded ${count} food items`);
  return count;
}

async function seedAdminUser() {
  console.log("\n👤 Creating Admin User...");

  // Check if admin already exists
  const existingAdmin = await db.collection(COLLECTIONS.ADMIN_USERS)
    .where("username", "==", "admin")
    .get();

  if (!existingAdmin.empty) {
    console.log("⚠ Admin user already exists, skipping...");
    return 0;
  }

  const now = Timestamp.now();
  const passwordHash = await bcrypt.hash("admin123", 10);

  await db.collection(COLLECTIONS.ADMIN_USERS).add({
    username: "admin",
    passwordHash: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  console.log("✓ Created admin user (username: admin, password: admin123)");
  console.log("⚠ IMPORTANT: Change the password after first login!");
  return 1;
}

async function seedAppSettings() {
  console.log("\n⚙️ Creating App Settings...");

  // Check if settings already exist
  const existingSettings = await db.collection(COLLECTIONS.APP_SETTINGS).get();

  if (!existingSettings.empty) {
    console.log("⚠ App settings already exist, skipping...");
    return 0;
  }

  const now = Timestamp.now();

  await db.collection(COLLECTIONS.APP_SETTINGS).add({
    settings: defaultSettings,
    createdAt: now,
    updatedAt: now,
  });

  console.log("✓ Created default app settings");
  return 1;
}

async function initializeCounters() {
  console.log("\n🔢 Initializing Counters...");

  const counters = [
    { name: "orders", value: 0 },
  ];

  for (const counter of counters) {
    const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(counter.name);
    const doc = await counterRef.get();

    if (!doc.exists) {
      await counterRef.set({ value: counter.value });
      console.log(`✓ Initialized ${counter.name} counter`);
    } else {
      console.log(`⚠ ${counter.name} counter already exists, skipping...`);
    }
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           Firebase Seed Script                              ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Check if food items already exist
    const existingItems = await db.collection(COLLECTIONS.FOOD_ITEMS).limit(1).get();

    if (!existingItems.empty) {
      console.log("\n⚠ Food items already exist in the database!");
      console.log("Do you want to skip seeding food items? (existing data will be kept)");
      console.log("To re-seed, first delete the foodItems collection in Firebase Console.\n");
    } else {
      await seedFoodItems();
    }

    await seedAdminUser();
    await seedAppSettings();
    await initializeCounters();

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                    Seeding Complete!                        ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("\n🎉 Your Firebase database is now ready!");
    console.log("\nAdmin Login Credentials:");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    console.log("\n⚠ Remember to change the admin password after first login!\n");

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  }
}

main().catch(console.error);
