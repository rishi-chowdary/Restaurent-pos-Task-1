import { z } from 'zod';

const orderItemInputSchema = z.object({
  menuItem: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid menu item ID'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  type: z.enum(['dine-in', 'takeaway']),
  tableNumber: z.string().trim().optional(),
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
  discountType: z.enum(['percent', 'flat']).optional().default('flat'),
  discountValue: z.number().min(0, 'Discount value cannot be negative').optional().default(0),
});

export const updateOrderItemsSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
  discountType: z.enum(['percent', 'flat']).optional(),
  discountValue: z.number().min(0, 'Discount value cannot be negative').optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Pending', 'Preparing', 'Ready', 'Completed']),
});

export const recordPaymentSchema = z.object({
  method: z.enum(['Cash', 'UPI', 'Card']),
  amount: z.number().positive('Payment amount must be greater than zero'),
  reference: z.string().trim().optional(),
});

export const orderQuerySchema = z.object({
  status: z.enum(['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']).optional(),
  q: z.string().trim().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderItemsInput = z.infer<typeof updateOrderItemsSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
