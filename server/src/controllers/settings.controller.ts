import { Request, Response } from 'express';
import * as settingsService from '../services/settings.service';
import { sendSuccess } from '../utils/api-response';

export async function handleGetSettings(_req: Request, res: Response) {
  const taxRate = await settingsService.getSystemTaxRate();
  return sendSuccess(res, { taxRate }, 200);
}

export async function handleUpdateSettings(req: Request, res: Response) {
  const adminUserId = req.user!.id;
  const { taxRate } = req.body;
  const updated = await settingsService.updateSystemTaxRate(taxRate, adminUserId);
  return sendSuccess(res, updated, 200);
}
