import { Types } from 'mongoose';
import { MenuItemModel } from '../models/menu-item.model';
import { IOrderItem, DiscountType } from '../models/order.model';
import { AppError } from '../utils/app-error';

export interface BillingItemInput {
  menuItem: string;
  quantity: number;
}

export interface CalculatedBilling {
  items: IOrderItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function calculateOrderTotals(
  rawItems: BillingItemInput[],
  taxRate: number,
  discountType: DiscountType = 'flat',
  discountValue: number = 0
): Promise<CalculatedBilling> {
  if (!rawItems || rawItems.length === 0) {
    throw new AppError('Order must contain at least one item.', 422, 'EMPTY_ORDER');
  }

  // Extract unique item IDs to batch query the database
  const itemIds = rawItems.map((item) => new Types.ObjectId(item.menuItem));
  const menuItems = await MenuItemModel.find({ _id: { $in: itemIds } });
  const itemMap = new Map(menuItems.map((item) => [item._id.toString(), item]));

  const processedItems: IOrderItem[] = [];
  let subtotal = 0;

  for (const requestedItem of rawItems) {
    const dbItem = itemMap.get(requestedItem.menuItem);

    if (!dbItem) {
      throw new AppError(
        `Menu item with ID ${requestedItem.menuItem} was not found.`,
        404,
        'ITEM_NOT_FOUND'
      );
    }

    // Business rule: reject inactive or unavailable menu items in new orders
    if (!dbItem.isActive) {
      throw new AppError(
        `'${dbItem.name}' is inactive and cannot be ordered.`,
        409,
        'ITEM_INACTIVE'
      );
    }

    if (!dbItem.isAvailable) {
      throw new AppError(
        `'${dbItem.name}' is currently out of stock / unavailable.`,
        409,
        'ITEM_UNAVAILABLE'
      );
    }

    // Always re-fetch price from DB so the client cannot tamper with it
    const priceSnapshot = dbItem.price;
    const lineTotal = roundToTwo(priceSnapshot * requestedItem.quantity);
    subtotal += lineTotal;

    processedItems.push({
      menuItem: dbItem._id as Types.ObjectId,
      nameSnapshot: dbItem.name,
      priceSnapshot,
      quantity: requestedItem.quantity,
      lineTotal,
    });
  }

  subtotal = roundToTwo(subtotal);

  // Business rule: discount cannot exceed subtotal
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = roundToTwo(subtotal * (discountValue / 100));
  } else {
    discountAmount = roundToTwo(discountValue);
  }

  if (discountAmount > subtotal) {
    throw new AppError(
      `Discount amount ($${discountAmount}) cannot exceed order subtotal ($${subtotal}).`,
      422,
      'INVALID_DISCOUNT'
    );
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = roundToTwo(taxableBase * (taxRate / 100));
  const total = roundToTwo(taxableBase + taxAmount);

  return {
    items: processedItems,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    taxRate,
    taxAmount,
    total,
  };
}
