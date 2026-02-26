export type OrderType = "DELIVERY" | "PICKUP";

export const DELIVERY_FEE_PHP = 15;

export function getDeliveryFee(orderType: OrderType): number {
  return orderType === "DELIVERY" ? DELIVERY_FEE_PHP : 0;
}

export function getOrderTotal(subtotal: number, orderType: OrderType): number {
  if (subtotal <= 0) return 0;
  return subtotal + getDeliveryFee(orderType);
}
