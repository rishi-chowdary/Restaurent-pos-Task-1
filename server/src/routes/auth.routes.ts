import { Router } from 'express';
import { handleLogin, handleGetMe } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { loginRateLimiter } from '../middleware/rate-limit.middleware';
import { loginSchema } from '../validations/auth.validation';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.post('/login', loginRateLimiter, validateBody(loginSchema), asyncHandler(handleLogin));
router.get('/me', authenticateToken, asyncHandler(handleGetMe));

export default router;
