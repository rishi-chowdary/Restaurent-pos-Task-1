import { Router } from 'express';
import {
  handleGetMenuItems,
  handleGetMenuItemById,
  handleCreateMenuItem,
  handleUpdateMenuItem,
  handleDeactivateMenuItem,
} from '../controllers/menu.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role-guard.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  menuQuerySchema,
} from '../validations/menu.validation';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/', validateQuery(menuQuerySchema), asyncHandler(handleGetMenuItems));
router.get('/:id', asyncHandler(handleGetMenuItemById));

// Admin only routes
router.post(
  '/',
  authenticateToken,
  requireRole('Admin'),
  validateBody(createMenuItemSchema),
  asyncHandler(handleCreateMenuItem)
);

router.put(
  '/:id',
  authenticateToken,
  requireRole('Admin'),
  validateBody(updateMenuItemSchema),
  asyncHandler(handleUpdateMenuItem)
);

router.patch(
  '/:id/deactivate',
  authenticateToken,
  requireRole('Admin'),
  asyncHandler(handleDeactivateMenuItem)
);

export default router;
