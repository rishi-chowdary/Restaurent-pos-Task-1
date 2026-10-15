import { Router } from 'express';
import { handleGetDailySalesReport } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role-guard.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('Admin'));

router.get('/daily-sales', asyncHandler(handleGetDailySalesReport));

export default router;
