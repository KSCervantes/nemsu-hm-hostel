const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  console.log('=== RECENT ORDERS ===');
  orders.forEach(o => {
    console.log(`ID: ${o.id}, UID: ${o.uid}, Status: ${o.status}, Created: ${o.createdAt}, Items: ${o.items.length}`);
  });
  
  const completed = await prisma.order.findMany({
    where: { status: 'COMPLETED' },
    include: { items: true }
  });
  
  console.log(`\n=== COMPLETED ORDERS: ${completed.length} ===`);
  completed.forEach(o => {
    console.log(`ID: ${o.id}, UID: ${o.uid}, Created: ${o.createdAt}`);
    o.items.forEach(i => console.log(`  - ${i.name} qty:${i.quantity} total:${i.lineTotal}`));
  });
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
