import { Request, Response } from 'express';
import { webhookService, toPublicSubscription } from '../services/webhook.service.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

function currentOwnerKey(req: Request): string {
  return req.apiKeyInfo?.key || 'anonymous';
}

/** Normaliza o `limit` para o histórico de entregas (inteiro positivo, default 50). */
function parseDeliveriesLimit(raw: unknown): number {
  const parsed = typeof raw === 'string' || typeof raw === 'number' ? parseInt(String(raw), 10) : 50;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
}

export class WebhookController {
  public subscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { url, events, matchId, leagueId, secret } = req.body || {};
    const subscription = webhookService.subscribe({ url, events, matchId, leagueId, secret }, currentOwnerKey(req));
    res.status(201).json(successResponse(toPublicSubscription(subscription), 'Webhook cadastrado com sucesso.'));
  });

  public list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const list = webhookService.list(currentOwnerKey(req)).map(toPublicSubscription);
    res.json(successResponse(list));
  });

  public getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const sub = webhookService.getById(id, currentOwnerKey(req));
    res.json(successResponse(toPublicSubscription(sub)));
  });

  public unsubscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    webhookService.unsubscribe(id, currentOwnerKey(req));
    res.json(successResponse({ id, deleted: true }, 'Webhook cancelado com sucesso.'));
  });

  public listDeliveries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = parseDeliveriesLimit(req.query.limit);
    const webhookId = req.query.webhookId as string | undefined;
    const deliveries = webhookService.getDeliveries(currentOwnerKey(req), webhookId, limit);
    res.json(successResponse(deliveries));
  });

  public getDeliveriesByWebhookId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const limit = parseDeliveriesLimit(req.query.limit);
    // Garante que o webhook existe e pertence à chave da requisição.
    webhookService.getById(id, currentOwnerKey(req));
    const deliveries = webhookService.getDeliveries(currentOwnerKey(req), id, limit);
    res.json(successResponse(deliveries));
  });

  public redeliver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const newDelivery = await webhookService.redeliver(id, currentOwnerKey(req));
    res.json(successResponse(newDelivery, 'Reenvio de webhook disparado com sucesso.'));
  });
}

export const webhookController = new WebhookController();