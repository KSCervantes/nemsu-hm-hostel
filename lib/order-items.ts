import { getFoodItemsByIds } from "@/lib/firebase-db";

export type RawOrderItemInput = {
  id?: string | number;
  foodId?: string | number;
  foodItemId?: string | number;
  quantity?: string | number;
  notes?: string | null;
};

export type ResolvedOrderItemInput = {
  id?: string;
  foodId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
};

export async function resolveOrderItemsFromMenu(
  rawItems: RawOrderItemInput[]
): Promise<{ items: ResolvedOrderItemInput[]; error?: string }> {
  const submittedItems = rawItems.map((item, index) => {
    const foodIdValue = item.foodId ?? item.foodItemId;
    const foodId = foodIdValue == null ? "" : String(foodIdValue).trim();
    const id = item.id == null ? undefined : String(item.id).trim() || undefined;
    const quantity = Number(item.quantity);
    const notes = typeof item.notes === "string" ? item.notes.trim() : undefined;

    return { index, id, foodId, quantity, notes };
  });

  const invalidItem = submittedItems.find(
    (item) => !item.foodId || !Number.isFinite(item.quantity) || item.quantity <= 0
  );

  if (invalidItem) {
    return {
      items: [],
      error: `Item ${invalidItem.index + 1} must include a valid food item and quantity.`,
    };
  }

  const foodIds = Array.from(new Set(submittedItems.map((item) => item.foodId)));
  const foodItems = await getFoodItemsByIds(foodIds);
  const foodItemById = new Map(
    foodItems
      .filter((item) => item.id)
      .map((item) => [item.id as string, item])
  );
  const missingFoodIds = foodIds.filter((foodId) => !foodItemById.has(foodId));

  if (missingFoodIds.length > 0) {
    return {
      items: [],
      error: "One or more selected food items no longer exist.",
    };
  }

  const items = submittedItems.map((item) => {
    const foodItem = foodItemById.get(item.foodId)!;
    const unitPrice = Number(foodItem.price || 0);

    return {
      id: item.id,
      foodId: item.foodId,
      name: foodItem.name,
      quantity: item.quantity,
      unitPrice,
      notes: item.notes || undefined,
    };
  });

  return { items };
}
