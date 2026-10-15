import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/api-response';

export async function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  return sendSuccess(res, result, 200);
}

export async function handleGetMe(req: Request, res: Response) {
  const currentUserId = req.user!.id;
  const user = await authService.getCurrentUser(currentUserId);
  return sendSuccess(res, user, 200);
}
