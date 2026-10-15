import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle Mongoose duplicate key errors
  if ('code' in err && (err as { code: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'A resource with this identifier already exists.',
      },
    });
  }

  // Handle Mongoose invalid ObjectId casts
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Malformed resource ID format.',
      },
    });
  }

  process.stderr.write(`[server error] ${err.stack || err.message}\n`);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  });
}
