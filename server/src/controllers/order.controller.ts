import { Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { sendSuccess } from '../utils/api-response';

export async function handleCreateOrder(req: Request, res: Response) {
  const currentUserId = req.user!.id;
  const newOrder = await orderService.createOrder(req.body, currentUserId);
  return sendSuccess(res, newOrder, 201);
}

export async function handleGetOrders(req: Request, res: Response) {
  const result = await orderService.getOrders(req.query as any);
  return sendSuccess(res, result, 200);
}

export async function handleGetOrderById(req: Request, res: Response) {
  const id = req.params.id as string;
  const order = await orderService.getOrderById(id);
  return sendSuccess(res, order, 200);
}

export async function handleUpdateOrderItems(req: Request, res: Response) {
  const id = req.params.id as string;
  const { items, discountType, discountValue } = req.body;
  const updatedOrder = await orderService.updateOrderItems(
    id,
    items,
    discountType,
    discountValue
  );
  return sendSuccess(res, updatedOrder, 200);
}

export async function handleUpdateOrderStatus(req: Request, res: Response) {
  const id = req.params.id as string;
  const { status } = req.body;
  const updatedOrder = await orderService.updateOrderStatus(id, status);
  return sendSuccess(res, updatedOrder, 200);
}

export async function handleRecordPayment(req: Request, res: Response) {
  const id = req.params.id as string;
  const currentUserId = req.user!.id;
  const paidOrder = await orderService.recordOrderPayment(id, req.body, currentUserId);
  return sendSuccess(res, paidOrder, 200);
}

export async function handleCancelOrder(req: Request, res: Response) {
  const id = req.params.id as string;
  const cancelledOrder = await orderService.cancelOrder(id);
  return sendSuccess(res, cancelledOrder, 200);
}
