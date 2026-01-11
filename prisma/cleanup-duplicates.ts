import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up duplicate food items...');

  // Find all food items without codes (old entries)
  const oldItems = await prisma.foodItem.findMany({
    where: {
      code: null
    }
  });

  console.log(`Found ${oldItems.length} old food items without codes.`);

  // Delete related order items first
  for (const item of oldItems) {
    const deletedOrderItems = await prisma.orderItem.deleteMany({
      where: {
        foodId: item.id
      }
    });
    if (deletedOrderItems.count > 0) {
      console.log(`Deleted ${deletedOrderItems.count} order items for food item ID ${item.id}`);
    }
  }

  // Now delete the food items
  const result = await prisma.foodItem.deleteMany({
    where: {
      code: null
    }
  });

  console.log(`Deleted ${result.count} old food items without codes.`);
  console.log('Cleanup completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
