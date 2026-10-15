import { Schema, model, Document } from 'mongoose';

export type UserRole = 'Admin' | 'Staff';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Staff'], default: 'Staff', required: true },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>('User', userSchema);
