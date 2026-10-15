import { Schema, model, Document, Types } from 'mongoose';

export interface ISettings extends Document {
  taxRate: number;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    taxRate: { type: Number, required: true, min: 0, max: 100, default: 5.0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const SettingsModel = model<ISettings>('Settings', settingsSchema);
