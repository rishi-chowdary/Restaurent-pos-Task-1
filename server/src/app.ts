import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { env } from './config/env';

export function createApp() {
  const app = express();

  // Security headers and CORS policy
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server) or matching clientUrl
        if (!origin || origin === env.clientUrl || env.nodeEnv === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Mount API routers
  app.use('/api', routes);

  // Catch-all for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist on this server.',
      },
    });
  });

  // Central error handling middleware
  app.use(errorHandler);

  return app;
}
