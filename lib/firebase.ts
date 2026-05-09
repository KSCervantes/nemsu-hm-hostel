import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Firestore,
  Timestamp,
  writeBatch,
  runTransaction,
  increment,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  Auth,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from "firebase/storage";

// Firebase configuration - Add your Firebase config here
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

// Export Firebase instances
export { app, db, auth, storage };

// Export Storage utilities
export { ref, uploadBytes, getDownloadURL, deleteObject };

// Export Firestore utilities
export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  runTransaction,
  increment,
  setDoc,
};

// Collection names
export const COLLECTIONS = {
  ADMIN_USERS: "adminUsers",
  FOOD_ITEMS: "foodItems",
  ORDERS: "orders",
  ORDER_ITEMS: "orderItems",
  RESERVATIONS: "reservations",
  AUDIT_LOGS: "auditLogs",
  APP_SETTINGS: "appSettings",
  COUNTERS: "counters", // For auto-increment IDs
};

// Firebase Types (formerly Prisma schema)
export interface AdminUser {
  id?: string;
  username: string;
  passwordHash: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface FoodItem {
  id?: string;
  numericId?: number; // For maintaining compatibility
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  code?: string | null;
  img?: string | null;
  available: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface OrderItem {
  id?: string;
  orderId: string;
  foodId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string | null;
  img?: string | null; // Food item image
  menuItemMissing?: boolean;
}

export type OrderStatus = "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
export type OrderType = "DELIVERY" | "PICKUP";

export interface Order {
  id?: string;
  numericId?: number;
  createdAt: Date | Timestamp;
  status: OrderStatus;
  orderType: OrderType;
  total: number;
  customer?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  address?: string | null;
  desiredAt?: Date | Timestamp | null;
  archived: boolean;
  archivedAt?: Date | Timestamp | null;
  pendingCancellationWarningSentAt?: Date | Timestamp | null;
  autoCancelledAt?: Date | Timestamp | null;
  cancellationReason?: string | null;
  items?: OrderItem[];
}

export interface Reservation {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  room: number;
  checkIn: Date | Timestamp;
  nights: number;
  createdAt: Date | Timestamp;
}

export interface AuditLog {
  id?: string;
  action: string;
  tableName: string;
  recordId: string;
  userId?: string | null;
  details?: string | null;
  createdAt: Date | Timestamp;
}

export interface AppSettings {
  id?: string;
  settings: Record<string, unknown>;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Helper function to get next numeric ID (for compatibility)
export async function getNextId(counterName: string): Promise<number> {
  const counterRef = doc(db, COLLECTIONS.COUNTERS, counterName);

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    if (!counterDoc.exists()) {
      transaction.set(counterRef, { value: 1 });
      return 1;
    }

    const newValue = (counterDoc.data().value || 0) + 1;
    transaction.update(counterRef, { value: newValue });
    return newValue;
  });
}

// Helper to convert Firestore Timestamp to Date
export function toDate(timestamp: Date | Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return null;
}

// Helper to convert Date to Firestore Timestamp
export function toTimestamp(date: Date | string | null | undefined): Timestamp | null {
  if (!date) return null;
  if (date instanceof Date) return Timestamp.fromDate(date);
  if (typeof date === "string") {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
  }
  return null;
}

export type SerializedOrder = Omit<
  Order,
  "createdAt" | "desiredAt" | "archivedAt" | "pendingCancellationWarningSentAt" | "autoCancelledAt"
> & {
  createdAt: Date | Timestamp | string;
  desiredAt?: Date | Timestamp | string | null;
  archivedAt?: Date | Timestamp | string | null;
  pendingCancellationWarningSentAt?: Date | Timestamp | string | null;
  autoCancelledAt?: Date | Timestamp | string | null;
};

// Helper to serialize Firestore Timestamps to ISO strings for API responses
export function serializeOrder(order: Order): SerializedOrder {
  const serialized: SerializedOrder = { ...order };

  // Convert Timestamp fields to ISO strings
  if (order.createdAt) {
    if (order.createdAt instanceof Timestamp) {
      serialized.createdAt = order.createdAt.toDate().toISOString();
    } else if (order.createdAt instanceof Date) {
      serialized.createdAt = order.createdAt.toISOString();
    }
  }

  if (order.desiredAt) {
    if (order.desiredAt instanceof Timestamp) {
      serialized.desiredAt = order.desiredAt.toDate().toISOString();
    } else if (order.desiredAt instanceof Date) {
      serialized.desiredAt = order.desiredAt.toISOString();
    }
  }

  if (order.archivedAt) {
    if (order.archivedAt instanceof Timestamp) {
      serialized.archivedAt = order.archivedAt.toDate().toISOString();
    } else if (order.archivedAt instanceof Date) {
      serialized.archivedAt = order.archivedAt.toISOString();
    }
  }

  if (order.pendingCancellationWarningSentAt) {
    if (order.pendingCancellationWarningSentAt instanceof Timestamp) {
      serialized.pendingCancellationWarningSentAt = order.pendingCancellationWarningSentAt.toDate().toISOString();
    } else if (order.pendingCancellationWarningSentAt instanceof Date) {
      serialized.pendingCancellationWarningSentAt = order.pendingCancellationWarningSentAt.toISOString();
    }
  }

  if (order.autoCancelledAt) {
    if (order.autoCancelledAt instanceof Timestamp) {
      serialized.autoCancelledAt = order.autoCancelledAt.toDate().toISOString();
    } else if (order.autoCancelledAt instanceof Date) {
      serialized.autoCancelledAt = order.autoCancelledAt.toISOString();
    }
  }

  return serialized;
}
