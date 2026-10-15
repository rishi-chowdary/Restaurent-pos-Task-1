import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserModel, IUser } from '../models/user.model';
import { AppError } from '../utils/app-error';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: 'Admin' | 'Staff';
}

export async function authenticateToken(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await UserModel.findById(decoded.id).select('name email role');

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token.', 401, 'INVALID_TOKEN'));
  }
}
