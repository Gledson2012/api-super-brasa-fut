export type WebhookEventType = 'GOAL' | 'MATCH_EVENT' | 'MATCH_STATUS_CHANGE' | 'ALL';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  matchId?: string;
  leagueId?: string;
  secret?: string;
  createdAt: string;
  active: boolean;
}

export interface CreateWebhookDto {
  url: string;
  events?: WebhookEventType[];
  matchId?: string;
  leagueId?: string;
  secret?: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  url: string;
  event: WebhookEventType;
  payload: any;
  timestamp: string;
  attempts: number;
  success: boolean;
  statusCode?: number;
  error?: string;
  durationMs: number;
}

