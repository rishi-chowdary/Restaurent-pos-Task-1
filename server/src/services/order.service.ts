import { Types } from 'mongoose';
import { OrderModel, IOrder, OrderStatus, PaymentMethod } from '../models/order.model';
import { CounterModel } from '../models/counter.model';
import { calculateOrderTotals, BillingItemInput } from './order-billing.service';
import { getSystemTaxRate } from './settings.service';
import { AppError } from '../utils/app-error';

// Atomic sequential order number generator (ORD-YYYYMMDD-0001)
export async function generateNextOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const sequenceKey = `ORD-${dateStr}`;

  // Atomic increment prevents race conditions when concurrent orders are created
  const counter = await CounterModel.findOneAndUpdate(
    { sequenceKey },
    { $inc: { sequenceValue: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const paddedSeq = String(counter.sequenceValue).padStart(4, '0');
  return `${sequenceKey}-${paddedSeq}`;
}

export async function createOrder(
  data: {
    type: 'dine-in' | 'takeaway';
    tableNumber?: string;
    items: BillingItemInput[];
    discountType?: 'percent' | 'flat';
    discountValue?: number;
  },
  userId: string
): Promise<IOrder> {
  const taxRate = await getSystemTaxRate();
  const billing = await calculateOrderTotals(
    data.items,
    taxRate,
    data.discountType,
    data.discountValue
  );

  const orderNumber = await generateNextOrderNumber();

  return OrderModel.create({
    orderNumber,
    type: data.type,
    tableNumber: data.type === 'dine-in' ? data.tableNumber : undefined,
    items: billing.items,
    subtotal: billing.subtotal,
    taxRate: billing.taxRate,
    taxAmount: billing.taxAmount,
    discountType: billing.discountType,
    discountValue: billing.discountValue,
    discountAmount: billing.discountAmount,
    total: billing.total,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    createdBy: new Types.ObjectId(userId),
  });
}

export async function getOrders(filters: {
  status?: OrderStatus;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.q) {
    query.orderNumber = { $regex: filters.q, $options: 'i' };
  }

  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    OrderModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role')
      .populate('payment.recordedBy', 'name email role'),
    OrderModel.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

export async function getOrderById(orderId: string): Promise<IOrder> {
  const order = await OrderModel.findById(orderId)
    .populate('createdBy', 'name email role')
    .populate('payment.recordedBy', 'name email role');

  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  return order;
}

export async function updateOrderItems(
  orderId: string,
  items: BillingItemInput[],
  discountType?: 'percent' | 'flat',
  discountValue?: number
): Promise<IOrder> {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  // Orders can only be modified while in 'Pending' status
  if (order.status !== 'Pending') {
    throw new AppError(
      `Cannot modify items for order in '${order.status}' status. Only Pending orders can be edited.`,
      409,
      'ORDER_NOT_PENDING'
    );
  }

  const effectiveDiscountType = discountType !== undefined ? discountType : order.discountType;
  const effectiveDiscountValue = discountValue !== undefined ? discountValue : order.discountValue;

  const billing = await calculateOrderTotals(
    items,
    order.taxRate,
    effectiveDiscountType,
    effectiveDiscountValue
  );

  order.items = billing.items;
  order.subtotal = billing.subtotal;
  order.discountType = billing.discountType;
  order.discountValue = billing.discountValue;
  order.discountAmount = billing.discountAmount;
  order.taxAmount = billing.taxAmount;
  order.total = billing.total;

  return order.save();
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<IOrder> {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  // Allowed forward progression rule: Pending -> Preparing -> Ready -> Completed
  const allowedTransitions: Record<string, string[]> = {
    Pending: ['Preparing'],
    Preparing: ['Ready'],
    Ready: ['Completed'],
    Completed: [],
    Cancelled: [],
  };

  const validNextStates = allowedTransitions[order.status] || [];
  if (!validNextStates.includes(newStatus)) {
    throw new AppError(
      `Invalid status transition from '${order.status}' to '${newStatus}'. Status may only progress forward: Pending -> Preparing -> Ready -> Completed.`,
      409,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Business rule: Completed requires recorded payment
  if (newStatus === 'Completed' && order.paymentStatus !== 'Paid') {
    throw new AppError(
      'Cannot mark order as Completed before full payment has been recorded.',
      409,
      'PAYMENT_REQUIRED_BEFORE_COMPLETION'
    );
  }

  order.status = newStatus;
  return order.save();
}

export async function recordOrderPayment(
  orderId: string,
  paymentData: { method: PaymentMethod; amount: number; reference?: string },
  userId: string
): Promise<IOrder> {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  // Business rule: cannot pay twice
  if (order.paymentStatus === 'Paid') {
    throw new AppError('This order has already been paid.', 409, 'ALREADY_PAID');
  }

  if (order.status === 'Cancelled') {
    throw new AppError('Cannot record payment for a cancelled order.', 409, 'ORDER_CANCELLED');
  }

  // Business rule: payment amount must exactly equal order total
  if (Math.abs(paymentData.amount - order.total) > 0.009) {
    throw new AppError(
      `Payment amount ($${paymentData.amount}) must equal order total ($${order.total}).`,
      422,
      'INVALID_PAYMENT_AMOUNT'
    );
  }

  order.payment = {
    method: paymentData.method,
    amount: paymentData.amount,
    reference: paymentData.reference,
    paidAt: new Date(),
    recordedBy: new Types.ObjectId(userId),
  };
  order.paymentStatus = 'Paid';

  return order.save();
}

export async function cancelOrder(orderId: string): Promise<IOrder> {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  if (order.status === 'Completed') {
    throw new AppError('Cannot cancel an order that has already been completed.', 409, 'ORDER_ALREADY_COMPLETED');
  }

  order.status = 'Cancelled';
  return order.save();
}
