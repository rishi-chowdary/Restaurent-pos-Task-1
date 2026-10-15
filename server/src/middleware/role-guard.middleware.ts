import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

export function requireRole(...allowedRoles: Array<'Admin' | 'Staff'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' lacks permission for this action.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
