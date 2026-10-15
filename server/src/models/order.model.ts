import { Schema, model, Document, Types } from 'mongoose';

export type OrderType = 'dine-in' | 'takeaway';
export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card';
export type DiscountType = 'percent' | 'flat';

export interface IOrderItem {
  menuItem: Types.ObjectId;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export interface IPaymentRecord {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  paidAt: Date;
  recordedBy: Types.ObjectId;
}

export interface IOrder extends Document {
  orderNumber: string;
  type: OrderType;
  tableNumber?: string;
  items: IOrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  payment?: IPaymentRecord;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    nameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentRecordSchema = new Schema<IPaymentRecord>(
  {
    method: { type: String, enum: ['Cash', 'UPI', 'Card'], required: true },
    amount: { type: Number, required: true, min: 0 },
    reference: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['dine-in', 'takeaway'], required: true },
    tableNumber: { type: String, trim: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ['percent', 'flat'], default: 'flat' },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid'],
      default: 'Unpaid',
      index: true,
    },
    payment: { type: paymentRecordSchema },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const OrderModel = model<IOrder>('Order', orderSchema);
