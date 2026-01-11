const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create/get food items
  const food1 = await prisma.foodItem.upsert({
    where: { code: 'CARBONARA_PASTA' },
    update: {},
    create: { name: 'CARBONARA PASTA', price: 150, code: 'CARBONARA_PASTA' }
  });
  
  const food2 = await prisma.foodItem.upsert({
    where: { code: 'CAESAR_SALAD' },
    update: {},
    create: { name: 'CAESAR SALAD', price: 200, code: 'CAESAR_SALAD' }
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const order = await prisma.order.create({
    data: {
      customer: 'Test Customer',
      contactNumber: '09123456789',
      email: 'test@example.com',
      address: 'Test Address',
      status: 'COMPLETED',
      total: 500,
      createdAt: today,
      items: {
        create: [
          { foodId: food1.id, name: 'CARBONARA PASTA', quantity: 2, unitPrice: 150, lineTotal: 300 },
          { foodId: food2.id, name: 'CAESAR SALAD', quantity: 1, unitPrice: 200, lineTotal: 200 }
        ]
      }
    },
    include: { items: true }
  });
  
  console.log('Created order for today:', order.id);
  console.log('Items:', order.items.map(i => `${i.name} (qty: ${i.quantity}, total: ${i.lineTotal})`).join(', '));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
