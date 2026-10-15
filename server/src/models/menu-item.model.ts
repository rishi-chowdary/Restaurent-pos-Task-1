import { Schema, model, Document } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 'text', category: 'text' });

export const MenuItemModel = model<IMenuItem>('MenuItem', menuItemSchema);
