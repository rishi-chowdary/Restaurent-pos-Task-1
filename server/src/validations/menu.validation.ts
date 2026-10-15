import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(2, 'Item name must be at least 2 characters'),
  category: z.string().trim().min(2, 'Category must be at least 2 characters'),
  price: z.number().positive('Price must be greater than zero'),
  isAvailable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
});

export const updateMenuItemSchema = z.object({
  name: z.string().trim().min(2, 'Item name must be at least 2 characters').optional(),
  category: z.string().trim().min(2, 'Category must be at least 2 characters').optional(),
  price: z.number().positive('Price must be greater than zero').optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const menuQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  available: z.enum(['true', 'false']).optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
