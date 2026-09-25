export type WebhookEventType = 'GOAL' | 'MATCH_EVENT' | 'MATCH_STATUS_CHANGE' | 'ALL';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  matchId?: string;
  secret?: string;
  createdAt: string;
  active: boolean;
}

export interface CreateWebhookDto {
  url: string;
  events?: WebhookEventType[];
  matchId?: string;
  secret?: string;
}
