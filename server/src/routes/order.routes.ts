import { Router } from 'express';
import {
  handleCreateOrder,
  handleGetOrders,
  handleGetOrderById,
  handleUpdateOrderItems,
  handleUpdateOrderStatus,
  handleRecordPayment,
  handleCancelOrder,
} from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role-guard.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createOrderSchema,
  updateOrderItemsSchema,
  updateOrderStatusSchema,
  recordPaymentSchema,
  orderQuerySchema,
} from '../validations/order.validation';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(authenticateToken);

router.post('/', validateBody(createOrderSchema), asyncHandler(handleCreateOrder));
router.get('/', validateQuery(orderQuerySchema), asyncHandler(handleGetOrders));
router.get('/:id', asyncHandler(handleGetOrderById));

router.put('/:id/items', validateBody(updateOrderItemsSchema), asyncHandler(handleUpdateOrderItems));
router.patch('/:id/status', validateBody(updateOrderStatusSchema), asyncHandler(handleUpdateOrderStatus));
router.post('/:id/payment', validateBody(recordPaymentSchema), asyncHandler(handleRecordPayment));

// Admin only order cancellation
router.patch('/:id/cancel', requireRole('Admin'), asyncHandler(handleCancelOrder));

export default router;
