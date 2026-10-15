import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { sendSuccess } from '../utils/api-response';

export async function handleGetDailySalesReport(req: Request, res: Response) {
  const date = req.query.date as string | undefined;
  const report = await reportService.getDailySalesReport(date);
  return sendSuccess(res, report, 200);
}
