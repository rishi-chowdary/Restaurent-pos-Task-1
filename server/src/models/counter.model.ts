import { Schema, model, Document } from 'mongoose';

export interface ICounter extends Document {
  sequenceKey: string;
  sequenceValue: number;
}

const counterSchema = new Schema<ICounter>({
  sequenceKey: { type: String, required: true, unique: true },
  sequenceValue: { type: Number, required: true, default: 0 },
});

export const CounterModel = model<ICounter>('Counter', counterSchema);
