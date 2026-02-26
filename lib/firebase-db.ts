import {
  db,
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
  Timestamp,
  writeBatch,
  runTransaction,
  setDoc,
  getNextId,
  toDate,
  toTimestamp,
  serializeOrder,
  COLLECTIONS,
  AdminUser,
  FoodItem,
  Order,
  OrderItem,
  Reservation,
  AuditLog,
  AppSettings,
  OrderStatus,
  OrderType,
} from "./firebase";
import bcrypt from "bcryptjs";
import { getOrderTotal } from "./order-pricing";

// ============= ADMIN USERS =============

export async function findAdminUserByUsername(username: string): Promise<AdminUser | null> {
  const q = query(
    collection(db, COLLECTIONS.ADMIN_USERS),
    where("username", "==", username)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as AdminUser;
}

export async function findAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const q = query(
    collection(db, COLLECTIONS.ADMIN_USERS),
    where("email", "==", email.toLowerCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as AdminUser;
}

export async function findAdminUserByUsernameOrEmail(identifier: string): Promise<AdminUser | null> {
  // First try to find by username
  let user = await findAdminUserByUsername(identifier);
  if (user) return user;

  // If not found, try to find by email (case-insensitive)
  user = await findAdminUserByEmail(identifier);
  return user;
}

export async function findAdminUserById(id: string): Promise<AdminUser | null> {
  const docRef = doc(db, COLLECTIONS.ADMIN_USERS, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as AdminUser;
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  const q = query(
    collection(db, COLLECTIONS.ADMIN_USERS),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AdminUser));
}

export async function createAdminUser(username: string, password: string): Promise<AdminUser> {
  const passwordHash = await bcrypt.hash(password, 10);
  const now = Timestamp.now();

  const docRef = await addDoc(collection(db, COLLECTIONS.ADMIN_USERS), {
    username,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: docRef.id,
    username,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
}

export async function verifyAdminPassword(user: AdminUser, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export async function updateAdminUser(
  userId: string,
  updates: { username?: string; email?: string; newPassword?: string }
): Promise<AdminUser> {
  const docRef = doc(db, COLLECTIONS.ADMIN_USERS, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("User not found");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (updates.username) {
    updateData.username = updates.username;
  }

  if (updates.email) {
    updateData.email = updates.email;
  }

  if (updates.newPassword) {
    updateData.passwordHash = await bcrypt.hash(updates.newPassword, 10);
  }

  await updateDoc(docRef, updateData);

  const updatedSnap = await getDoc(docRef);
  return { id: updatedSnap.id, ...updatedSnap.data() } as AdminUser;
}

// ============= FOOD ITEMS =============

export async function getAllFoodItems(): Promise<FoodItem[]> {
  const q = query(
    collection(db, COLLECTIONS.FOOD_ITEMS),
    orderBy("numericId", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  } as FoodItem));
}

export async function getFoodItemById(id: string): Promise<FoodItem | null> {
  const docRef = doc(db, COLLECTIONS.FOOD_ITEMS, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FoodItem;
}

export async function getFoodItemByNumericId(numericId: number): Promise<FoodItem | null> {
  const q = query(
    collection(db, COLLECTIONS.FOOD_ITEMS),
    where("numericId", "==", numericId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as FoodItem;
}

export async function getFoodItemByCode(code: string): Promise<FoodItem | null> {
  const q = query(
    collection(db, COLLECTIONS.FOOD_ITEMS),
    where("code", "==", code)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as FoodItem;
}

export async function getFoodItemsByIds(ids: string[]): Promise<FoodItem[]> {
  if (ids.length === 0) return [];

  // Firebase 'in' queries are limited to 30 items
  const results: FoodItem[] = [];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 30) {
    chunks.push(ids.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const q = query(
      collection(db, COLLECTIONS.FOOD_ITEMS),
      where("__name__", "in", chunk)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as FoodItem);
    });
  }

  return results;
}

export async function createFoodItem(data: Partial<FoodItem>): Promise<FoodItem> {
  const numericId = await getNextId("foodItems");
  const now = Timestamp.now();

  const foodItem = {
    numericId,
    name: data.name || "",
    description: data.description || null,
    price: data.price || 0,
    category: data.category || null,
    code: data.code || null,
    img: data.img || null,
    available: data.available ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.FOOD_ITEMS), foodItem);
  return { id: docRef.id, ...foodItem };
}

export async function updateFoodItem(id: string, data: Partial<FoodItem>): Promise<FoodItem | null> {
  const docRef = doc(db, COLLECTIONS.FOOD_ITEMS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const updateData = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  delete updateData.id;
  delete updateData.createdAt;

  await updateDoc(docRef, updateData);

  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as FoodItem;
}

export async function deleteFoodItem(id: string): Promise<boolean> {
  const docRef = doc(db, COLLECTIONS.FOOD_ITEMS, id);
  await deleteDoc(docRef);
  return true;
}

// ============= ORDERS =============

export async function getAllOrders(archived?: boolean): Promise<Order[]> {
  let q;

  if (archived === true) {
    q = query(
      collection(db, COLLECTIONS.ORDERS),
      where("archived", "==", true),
      orderBy("numericId", "desc")
    );
  } else if (archived === false) {
    q = query(
      collection(db, COLLECTIONS.ORDERS),
      where("archived", "==", false),
      orderBy("numericId", "desc")
    );
  } else {
    q = query(
      collection(db, COLLECTIONS.ORDERS),
      orderBy("numericId", "desc")
    );
  }

  const snapshot = await getDocs(q);
  const orders: Order[] = [];

  // Get all food items to get images - create multiple lookup maps
  const allFoodItems = await getAllFoodItems();
  const foodItemByDocId = new Map(allFoodItems.map(f => [f.id, f]));
  const foodItemByNumericId = new Map(allFoodItems.map(f => [String(f.numericId), f]));
  const foodItemByName = new Map(allFoodItems.map(f => [f.name?.toUpperCase(), f]));

  for (const d of snapshot.docs) {
    const orderData = { id: d.id, ...d.data() } as Order;
    // Fetch order items
    const itemsQuery = query(
      collection(db, COLLECTIONS.ORDER_ITEMS),
      where("orderId", "==", d.id)
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    orderData.items = itemsSnapshot.docs.map((item) => {
      const itemData = item.data();
      // Try multiple ways to find the food item
      let foodItem = null;
      if (itemData.foodId) {
        // Try by document ID first
        foodItem = foodItemByDocId.get(itemData.foodId);
        // Try by numeric ID (if foodId is a number or numeric string)
        if (!foodItem) {
          foodItem = foodItemByNumericId.get(String(itemData.foodId));
        }
      }
      // Fallback: match by name
      if (!foodItem && itemData.name) {
        foodItem = foodItemByName.get(itemData.name?.toUpperCase());
      }

      return {
        id: item.id,
        ...itemData,
        img: foodItem?.img || null, // Include food item image
      } as OrderItem;
    });
    orders.push(orderData);
  }

  return orders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const docRef = doc(db, COLLECTIONS.ORDERS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const orderData = { id: docSnap.id, ...docSnap.data() } as Order;

  // Get all food items to get images - create multiple lookup maps
  const allFoodItems = await getAllFoodItems();
  const foodItemByDocId = new Map(allFoodItems.map(f => [f.id, f]));
  const foodItemByNumericId = new Map(allFoodItems.map(f => [String(f.numericId), f]));
  const foodItemByName = new Map(allFoodItems.map(f => [f.name?.toUpperCase(), f]));

  // Fetch order items
  const itemsQuery = query(
    collection(db, COLLECTIONS.ORDER_ITEMS),
    where("orderId", "==", id)
  );
  const itemsSnapshot = await getDocs(itemsQuery);
  orderData.items = itemsSnapshot.docs.map((item) => {
    const itemData = item.data();
    // Try multiple ways to find the food item
    let foodItem = null;
    if (itemData.foodId) {
      foodItem = foodItemByDocId.get(itemData.foodId);
      if (!foodItem) {
        foodItem = foodItemByNumericId.get(String(itemData.foodId));
      }
    }
    if (!foodItem && itemData.name) {
      foodItem = foodItemByName.get(itemData.name?.toUpperCase());
    }
    return {
      id: item.id,
      ...itemData,
      img: foodItem?.img || null, // Include food item image
    } as OrderItem;
  });

  return orderData;
}

export async function getOrderByNumericId(numericId: number): Promise<Order | null> {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where("numericId", "==", numericId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docData = snapshot.docs[0];
  const orderData = { id: docData.id, ...docData.data() } as Order;

  // Fetch order items
  const itemsQuery = query(
    collection(db, COLLECTIONS.ORDER_ITEMS),
    where("orderId", "==", docData.id)
  );
  const itemsSnapshot = await getDocs(itemsQuery);
  orderData.items = itemsSnapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  } as OrderItem));

  return orderData;
}

export async function createOrder(data: {
  customer?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  desiredAt?: Date | null;
  orderType: OrderType;
  total: number;
  items: Array<{
    foodId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
}): Promise<Order> {
  const numericId = await getNextId("orders");
  const now = Timestamp.now();

  // Create order document
  const orderData = {
    numericId,
    createdAt: now,
    status: "PENDING" as OrderStatus,
    orderType: data.orderType,
    total: data.total,
    customer: data.customer || null,
    contactNumber: data.contactNumber || null,
    email: data.email || null,
    address: data.address || null,
    desiredAt: data.desiredAt ? toTimestamp(data.desiredAt) : null,
    archived: false,
    archivedAt: null,
  };

  const orderRef = await addDoc(collection(db, COLLECTIONS.ORDERS), orderData);

  // Create order items
  const batch = writeBatch(db);
  const orderItems: OrderItem[] = [];

  for (const item of data.items) {
    const itemRef = doc(collection(db, COLLECTIONS.ORDER_ITEMS));
    const itemData: OrderItem = {
      orderId: orderRef.id,
      foodId: item.foodId || undefined,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
      notes: item.notes || null,
    };
    batch.set(itemRef, itemData);
    orderItems.push({ id: itemRef.id, ...itemData });
  }

  await batch.commit();

  return {
    id: orderRef.id,
    ...orderData,
    items: orderItems,
  };
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  const docRef = doc(db, COLLECTIONS.ORDERS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const updateData: any = { ...data };
  delete updateData.id;
  delete updateData.items;
  delete updateData.createdAt;
  delete updateData.numericId;

  // Handle status changes and auto-archiving
  if (data.status === "COMPLETED" || data.status === "CANCELLED") {
    updateData.archived = true;
    updateData.archivedAt = Timestamp.now();
  }

  if (data.desiredAt) {
    const desiredAtValue = data.desiredAt instanceof Date
      ? data.desiredAt
      : (data.desiredAt as any).toDate?.() || data.desiredAt;
    updateData.desiredAt = toTimestamp(desiredAtValue);
  }

  if (data.archivedAt) {
    const archivedAtValue = data.archivedAt instanceof Date
      ? data.archivedAt
      : (data.archivedAt as any).toDate?.() || data.archivedAt;
    updateData.archivedAt = toTimestamp(archivedAtValue);
  }

  await updateDoc(docRef, updateData);
  return getOrderById(id);
}

export async function updateOrderItems(
  orderId: string,
  items: Array<{
    id?: string;
    foodId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>
): Promise<OrderItem[]> {
  // Get existing items
  const existingQuery = query(
    collection(db, COLLECTIONS.ORDER_ITEMS),
    where("orderId", "==", orderId)
  );
  const existingSnapshot = await getDocs(existingQuery);
  const existingIds = new Set(existingSnapshot.docs.map((d) => d.id));
  const providedIds = new Set(items.filter((it) => it.id).map((it) => it.id!));

  const batch = writeBatch(db);

  // Delete items that are no longer in the list
  for (const docSnap of existingSnapshot.docs) {
    if (!providedIds.has(docSnap.id)) {
      batch.delete(docSnap.ref);
    }
  }

  const resultItems: OrderItem[] = [];

  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;

    if (item.id && existingIds.has(item.id)) {
      // Update existing item
      const itemRef = doc(db, COLLECTIONS.ORDER_ITEMS, item.id);
      batch.update(itemRef, {
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
        notes: item.notes || null,
      });
      resultItems.push({
        id: item.id,
        orderId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
        notes: item.notes || null,
      });
    } else {
      // Create new item
      const newItemRef = doc(collection(db, COLLECTIONS.ORDER_ITEMS));
      const itemData: OrderItem = {
        orderId,
        foodId: item.foodId || undefined,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
        notes: item.notes || null,
      };
      batch.set(newItemRef, itemData);
      resultItems.push({ id: newItemRef.id, ...itemData });
    }
  }

  await batch.commit();

  // Update order total
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const orderSnap = await getDoc(orderRef);
  const existingOrderType: OrderType = orderSnap.exists() && orderSnap.data().orderType === "PICKUP"
    ? "PICKUP"
    : "DELIVERY";
  const subtotal = resultItems.reduce((sum, it) => sum + it.lineTotal, 0);
  const total = getOrderTotal(subtotal, existingOrderType);
  await updateDoc(orderRef, { total });

  return resultItems;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const batch = writeBatch(db);

  // Delete order items first
  const itemsQuery = query(
    collection(db, COLLECTIONS.ORDER_ITEMS),
    where("orderId", "==", id)
  );
  const itemsSnapshot = await getDocs(itemsQuery);
  itemsSnapshot.docs.forEach((d) => batch.delete(d.ref));

  // Delete the order
  batch.delete(doc(db, COLLECTIONS.ORDERS, id));

  await batch.commit();
  return true;
}

// ============= RESERVATIONS =============

export async function getAllReservations(): Promise<Reservation[]> {
  const q = query(
    collection(db, COLLECTIONS.RESERVATIONS),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation));
}

export async function createReservation(data: Omit<Reservation, "id" | "createdAt">): Promise<Reservation> {
  const now = Timestamp.now();

  const reservationData = {
    ...data,
    checkIn: toTimestamp(data.checkIn as Date),
    createdAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.RESERVATIONS), reservationData);
  return { id: docRef.id, ...reservationData } as Reservation;
}

// ============= AUDIT LOGS =============

export async function createAuditLog(data: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
  const now = Timestamp.now();

  const logData = {
    ...data,
    createdAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), logData);
  return { id: docRef.id, ...logData };
}

// ============= APP SETTINGS =============

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

export async function getAppSettings(): Promise<Record<string, any>> {
  const q = query(collection(db, COLLECTIONS.APP_SETTINGS));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create default settings
    const now = Timestamp.now();
    await addDoc(collection(db, COLLECTIONS.APP_SETTINGS), {
      settings: defaultSettings,
      createdAt: now,
      updatedAt: now,
    });
    return defaultSettings;
  }

  const docData = snapshot.docs[0].data();
  return docData.settings || defaultSettings;
}

export async function updateAppSettings(settings: Record<string, any>): Promise<Record<string, any>> {
  const q = query(collection(db, COLLECTIONS.APP_SETTINGS));
  const snapshot = await getDocs(q);

  const now = Timestamp.now();

  if (snapshot.empty) {
    await addDoc(collection(db, COLLECTIONS.APP_SETTINGS), {
      settings,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, {
      settings,
      updatedAt: now,
    });
  }

  return settings;
}

// ============= DASHBOARD METRICS =============

export async function getDashboardMetrics() {
  const [reservations, orders] = await Promise.all([
    getAllReservations(),
    getAllOrders(),
  ]);

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  // Calculate metrics
  const totalGuests = reservations.length;
  const totalBookings = reservations.length;
  const totalRooms = [...new Set(reservations.map((r) => r.room))].length;
  const totalOrders = orders.length;
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );

  // Count orders by status
  const statusCounts = {
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    ACCEPTED: orders.filter((o) => o.status === "ACCEPTED").length,
    COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  // Calculate daily orders for the last 7 days
  const dailyOrders: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const count = orders.filter((o) => {
      const createdAt = toDate(o.createdAt as Timestamp);
      const orderDate = createdAt?.toISOString().split("T")[0];
      return orderDate === dateStr;
    }).length;
    dailyOrders.push({ date: dateStr, count });
  }

  // Calculate daily revenue for the last 7 days
  const dailyRevenue: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const revenue = completedOrders
      .filter((o) => {
        const createdAt = toDate(o.createdAt as Timestamp);
        const orderDate = createdAt?.toISOString().split("T")[0];
        return orderDate === dateStr;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);
    dailyRevenue.push({ date: dateStr, revenue });
  }

  return {
    stats: {
      rooms: totalRooms,
      bookings: totalBookings,
      guests: totalGuests,
      orders: totalOrders,
    },
    chartData: {
      statusCounts,
      dailyOrders,
      dailyRevenue,
      totalRevenue,
    },
  };
}
