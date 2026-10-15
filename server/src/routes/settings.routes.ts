import { Router } from 'express';
import { handleGetSettings, handleUpdateSettings } from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role-guard.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateSettingsSchema } from '../validations/settings.validation';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(authenticateToken);

router.get('/', asyncHandler(handleGetSettings));
router.put('/', requireRole('Admin'), validateBody(updateSettingsSchema), asyncHandler(handleUpdateSettings));

export default router;
