/**
 * Firebase Orders Check Script
 * Run with: node check_orders.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'hm-hostel-firebase-adminsdk-fbsvc-965d822ee2.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function main() {
  console.log('Connecting to Firebase...\n');

  // Get recent orders
  const ordersSnapshot = await db.collection('orders')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  console.log('=== RECENT ORDERS ===');
  ordersSnapshot.docs.forEach(doc => {
    const o = doc.data();
    const createdAt = o.createdAt?.toDate?.() || o.createdAt;
    console.log(`ID: ${doc.id}, UID: ${o.uid || 'N/A'}, Status: ${o.status}, Created: ${createdAt}, Items: ${o.items?.length || 0}`);
  });

  // Get completed orders
  const completedSnapshot = await db.collection('orders')
    .where('status', '==', 'COMPLETED')
    .get();

  console.log(`\n=== COMPLETED ORDERS: ${completedSnapshot.size} ===`);
  completedSnapshot.docs.forEach(doc => {
    const o = doc.data();
    const createdAt = o.createdAt?.toDate?.() || o.createdAt;
    console.log(`ID: ${doc.id}, UID: ${o.uid || 'N/A'}, Created: ${createdAt}`);
    if (o.items) {
      o.items.forEach(i => console.log(`  - ${i.name} qty:${i.quantity} total:${i.lineTotal}`));
    }
  });

  // Get food items count
  const foodSnapshot = await db.collection('foodItems').get();
  console.log(`\n=== FOOD ITEMS: ${foodSnapshot.size} ===`);
  foodSnapshot.docs.forEach(doc => {
    const f = doc.data();
    console.log(`  - ${f.name} (${f.category}) - ₱${f.price} ${f.available ? '✓' : '✗'}`);
  });

  // Get admin users count
  const usersSnapshot = await db.collection('adminUsers').get();
  console.log(`\n=== ADMIN USERS: ${usersSnapshot.size} ===`);
  usersSnapshot.docs.forEach(doc => {
    const u = doc.data();
    console.log(`  - ${u.username}`);
  });
}

main()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
