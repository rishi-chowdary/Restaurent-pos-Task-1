import { Request, Response } from 'express';
import * as menuService from '../services/menu.service';
import { sendSuccess } from '../utils/api-response';

export async function handleGetMenuItems(req: Request, res: Response) {
  const { q, category, available } = req.query as { q?: string; category?: string; available?: string };
  const items = await menuService.getMenuItems({ q, category, available });
  return sendSuccess(res, items, 200);
}

export async function handleGetMenuItemById(req: Request, res: Response) {
  const id = req.params.id as string;
  const item = await menuService.getMenuItemById(id);
  return sendSuccess(res, item, 200);
}

export async function handleCreateMenuItem(req: Request, res: Response) {
  const newItem = await menuService.createMenuItem(req.body);
  return sendSuccess(res, newItem, 201);
}

export async function handleUpdateMenuItem(req: Request, res: Response) {
  const id = req.params.id as string;
  const updatedItem = await menuService.updateMenuItem(id, req.body);
  return sendSuccess(res, updatedItem, 200);
}

export async function handleDeactivateMenuItem(req: Request, res: Response) {
  const id = req.params.id as string;
  const toggledItem = await menuService.deactivateMenuItem(id);
  return sendSuccess(res, toggledItem, 200);
}
