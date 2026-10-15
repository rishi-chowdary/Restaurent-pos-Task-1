import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/user.model';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
}

function sanitizeUser(user: IUser): UserResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: UserResponse }> {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    env.jwtSecret as jwt.Secret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
  );

  return {
    token,
    user: sanitizeUser(user),
  };
}

export async function getCurrentUser(userId: string): Promise<UserResponse> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }
  return sanitizeUser(user);
}
