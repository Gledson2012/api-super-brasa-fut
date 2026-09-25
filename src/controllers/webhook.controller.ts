import { Request, Response } from 'express';
import { webhookService } from '../services/webhook.service.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

export class WebhookController {
  public subscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { url, events, matchId, secret } = req.body || {};
    const subscription = webhookService.subscribe({ url, events, matchId, secret });
    res.status(201).json(successResponse(subscription, 'Webhook cadastrado com sucesso.'));
  });

  public list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const list = webhookService.list();
    res.json(successResponse(list));
  });

  public getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const sub = webhookService.getById(id);
    res.json(successResponse(sub));
  });

  public unsubscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    webhookService.unsubscribe(id);
    res.json(successResponse({ id, deleted: true }, 'Webhook cancelado com sucesso.'));
  });
}

export const webhookController = new WebhookController();
