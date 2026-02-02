/**
 * @deprecated This file is deprecated. Use lib/firebase-db.ts instead.
 * The application has been migrated from Prisma/MySQL to Firebase.
 *
 * All database operations are now handled through Firebase Firestore.
 * See: lib/firebase.ts for Firebase configuration
 * See: lib/firebase-db.ts for database operations
 */

// Re-export from firebase-db to prevent import errors
export * from "./firebase-db";

console.warn(
  "⚠️ lib/prisma.ts is deprecated. Please update your imports to use lib/firebase-db.ts"
);
