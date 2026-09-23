export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: 'brasileirao' | 'libertadores' | 'internacional' | 'selecao' | 'transferencias' | 'opiniao';
  source: 'ESPN' | 'Flashscore' | 'Sofascore' | 'SuperBrasa';
  sourceUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  publishedAt: string; // ISO 8601
  tags: string[];
  relatedLeagueId?: string;
  relatedTeamIds?: string[];
  relatedPlayerIds?: string[];
  author?: string;
}

export interface NewsFilterQuery {
  category?: string;
  tag?: string;
  leagueId?: string;
  teamId?: string;
  search?: string;
}
