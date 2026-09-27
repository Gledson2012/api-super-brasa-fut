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

  public listDeliveries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const webhookId = req.query.webhookId as string | undefined;
    const deliveries = webhookService.getDeliveries(webhookId, limit);
    res.json(successResponse(deliveries));
  });

  public getDeliveriesByWebhookId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    // Garante que o webhook existe
    webhookService.getById(id);
    const deliveries = webhookService.getDeliveries(id, limit);
    res.json(successResponse(deliveries));
  });

  public redeliver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const newDelivery = await webhookService.redeliver(id);
    res.json(successResponse(newDelivery, 'Reenvio de webhook disparado com sucesso.'));
  });
}

export const webhookController = new WebhookController();
