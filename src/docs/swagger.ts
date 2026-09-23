export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API Super Brasa Fut',
    version: '1.0.0',
    description:
      'API RESTful de alta performance para dados esportivos de futebol brasileiro e internacional (Brasileirão 2026 Série A & B, Libertadores, Sul-Americana, Mundial Feminino Sub-20, Champions League, Premier League, estatísticas avançadas, odds e notícias).',
    contact: {
      name: 'Super Brasa Fut API Team',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Servidor API v1',
    },
  ],
  tags: [
    { name: 'Leagues', description: 'Campeonatos e Ligas nacionais e internacionais' },
    { name: 'Matches', description: 'Jogos, placares ao vivo, eventos, estatísticas e simulação' },
    { name: 'Standings', description: 'Tabelas de classificação com zonas de Libertadores/rebaixamento' },
    { name: 'Teams', description: 'Clubes de futebol, elencos, estádios e informações institucionais' },
    { name: 'Players', description: 'Jogadores, perfis, atributos físicos e estatísticas individuais' },
    { name: 'Stats & Leaders', description: 'Artilharia, assistências e melhores notas de avaliação' },
    { name: 'News', description: 'Notícias esportivas, transferências e análises' },
    { name: 'Odds', description: 'Cotações médias e linhas de apostas das principais casas' },
    { name: 'Health', description: 'Diagnóstico e integridade da API' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica a saúde do serviço',
        responses: {
          200: {
            description: 'Serviço operacional',
          },
        },
      },
    },
    '/leagues': {
      get: {
        tags: ['Leagues'],
        summary: 'Lista todas as ligas e campeonatos cadastrados',
        parameters: [
          { name: 'country', in: 'query', schema: { type: 'string' }, description: 'Filtrar por país (ex: Brasil, Inglaterra)' },
          { name: 'tier', in: 'query', schema: { type: 'string', enum: ['1st', '2nd', '3rd', 'cup', 'international', 'youth', 'women'] } },
          { name: 'gender', in: 'query', schema: { type: 'string', enum: ['male', 'female'] } },
          { name: 'ageCategory', in: 'query', schema: { type: 'string', enum: ['senior', 'u20', 'u17'] } },
          { name: 'isLive', in: 'query', schema: { type: 'boolean' } },
          { name: 'isCup', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Lista paginada de ligas' },
        },
      },
    },
    '/leagues/{id}': {
      get: {
        tags: ['Leagues'],
        summary: 'Obtém detalhes de uma liga por ID ou slug',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Detalhes da liga' },
          404: { description: 'Liga não encontrada' },
        },
      },
    },
    '/leagues/{id}/standings': {
      get: {
        tags: ['Leagues', 'Standings'],
        summary: 'Obtém a tabela de classificação de uma liga',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Tabela de classificação' },
          404: { description: 'Classificação não encontrada' },
        },
      },
    },
    '/leagues/{id}/matches': {
      get: {
        tags: ['Leagues', 'Matches'],
        summary: 'Obtém partidas de uma liga',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['UPCOMING', 'LIVE', 'HALF_TIME', 'FINISHED', 'POSTPONED', 'CANCELLED'] } },
          { name: 'round', in: 'query', schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Lista de partidas da liga' },
        },
      },
    },
    '/leagues/{id}/teams': {
      get: {
        tags: ['Leagues', 'Teams'],
        summary: 'Obtém todos os times participantes de uma liga',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Lista de clubes' },
        },
      },
    },
    '/leagues/{id}/leaders': {
      get: {
        tags: ['Leagues', 'Stats & Leaders'],
        summary: 'Obtém líderes de estatísticas de uma liga (artilharia, assistências, ratings)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Líderes de estatísticas' },
        },
      },
    },
    '/matches': {
      get: {
        tags: ['Matches'],
        summary: 'Lista partidas com múltiplos filtros',
        parameters: [
          { name: 'leagueId', in: 'query', schema: { type: 'string' } },
          { name: 'teamId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['UPCOMING', 'LIVE', 'HALF_TIME', 'FINISHED'] } },
          { name: 'date', in: 'query', schema: { type: 'string' }, description: 'Data no formato YYYY-MM-DD' },
          { name: 'gender', in: 'query', schema: { type: 'string', enum: ['male', 'female'] } },
          { name: 'ageCategory', in: 'query', schema: { type: 'string', enum: ['senior', 'u20', 'u17'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Lista de partidas' },
        },
      },
    },
    '/matches/live': {
      get: {
        tags: ['Matches'],
        summary: 'Lista todas as partidas ao vivo no momento',
        responses: {
          200: { description: 'Partidas com status LIVE ou HALF_TIME' },
        },
      },
    },
    '/matches/h2h': {
      get: {
        tags: ['Matches'],
        summary: 'Histórico de confronto direto entre dois times',
        parameters: [
          { name: 'team1Id', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'team2Id', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Estatísticas e partidas do confronto direto' },
        },
      },
    },
    '/matches/{id}': {
      get: {
        tags: ['Matches'],
        summary: 'Obtém detalhes de uma partida por ID ou slug (incluindo escalações, eventos e stats)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Detalhes da partida' },
          404: { description: 'Partida não encontrada' },
        },
      },
    },
    '/matches/{id}/simulate-tick': {
      post: {
        tags: ['Matches'],
        summary: 'Simula o avanço do tempo e eventos em tempo real da partida',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Partida atualizada com novo minuto e status simulado' },
        },
      },
    },
    '/teams': {
      get: {
        tags: ['Teams'],
        summary: 'Lista clubes de futebol',
        parameters: [
          { name: 'leagueId', in: 'query', schema: { type: 'string' } },
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'gender', in: 'query', schema: { type: 'string', enum: ['male', 'female'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Lista de clubes' },
        },
      },
    },
    '/teams/{id}': {
      get: {
        tags: ['Teams'],
        summary: 'Detalhes de um clube',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Detalhes do time' },
          404: { description: 'Time não encontrado' },
        },
      },
    },
    '/teams/{id}/matches': {
      get: {
        tags: ['Teams', 'Matches'],
        summary: 'Jogos do clube',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Lista de jogos do time' },
        },
      },
    },
    '/teams/{id}/squad': {
      get: {
        tags: ['Teams', 'Players'],
        summary: 'Elenco atual do clube',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Elenco do time' },
        },
      },
    },
    '/standings': {
      get: {
        tags: ['Standings'],
        summary: 'Lista tabelas de classificação',
        parameters: [
          { name: 'leagueId', in: 'query', schema: { type: 'string' } },
          { name: 'season', in: 'query', schema: { type: 'string' } },
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Lista de tabelas de classificação' },
        },
      },
    },
    '/standings/{leagueId}': {
      get: {
        tags: ['Standings'],
        summary: 'Obtém a classificação de uma liga específica',
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Tabela de classificação detalhada' },
          404: { description: 'Classificação não encontrada' },
        },
      },
    },
    '/players': {
      get: {
        tags: ['Players'],
        summary: 'Lista jogadores',
        parameters: [
          { name: 'teamId', in: 'query', schema: { type: 'string' } },
          { name: 'nationality', in: 'query', schema: { type: 'string' } },
          { name: 'position', in: 'query', schema: { type: 'string', enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] } },
          { name: 'leagueId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Lista de jogadores' },
        },
      },
    },
    '/players/{id}': {
      get: {
        tags: ['Players'],
        summary: 'Detalhes do jogador',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Perfil e estatísticas do jogador' },
          404: { description: 'Jogador não encontrado' },
        },
      },
    },
    '/stats/leaders': {
      get: {
        tags: ['Stats & Leaders'],
        summary: 'Líderes de todas as ligas',
        responses: {
          200: { description: 'Artilharia, assistências e melhores notas' },
        },
      },
    },
    '/stats/leaders/{leagueId}': {
      get: {
        tags: ['Stats & Leaders'],
        summary: 'Líderes de uma liga específica',
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Líderes de estatísticas da liga' },
        },
      },
    },
    '/stats/top-scorers/{leagueId}': {
      get: {
        tags: ['Stats & Leaders'],
        summary: 'Tabela de artilharia da liga',
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Artilheiros da liga' },
        },
      },
    },
    '/stats/top-assists/{leagueId}': {
      get: {
        tags: ['Stats & Leaders'],
        summary: 'Líderes de assistências da liga',
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Líderes em passes para gol' },
        },
      },
    },
    '/stats/top-ratings/{leagueId}': {
      get: {
        tags: ['Stats & Leaders'],
        summary: 'Jogadores com maiores notas médias (Sofascore Rating)',
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Maiores notas da liga' },
        },
      },
    },
    '/news': {
      get: {
        tags: ['News'],
        summary: 'Lista notícias esportivas',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['brasileirao', 'libertadores', 'internacional', 'selecao', 'transferencias', 'opiniao'] } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'leagueId', in: 'query', schema: { type: 'string' } },
          { name: 'teamId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Lista de notícias' },
        },
      },
    },
    '/news/{id}': {
      get: {
        tags: ['News'],
        summary: 'Artigo de notícia completo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Artigo de notícia' },
          404: { description: 'Notícia não encontrada' },
        },
      },
    },
    '/odds': {
      get: {
        tags: ['Odds'],
        summary: 'Cotações de apostas para jogos',
        parameters: [
          { name: 'leagueId', in: 'query', schema: { type: 'string' } },
          { name: 'matchId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Lista de odds' },
        },
      },
    },
    '/odds/{matchId}': {
      get: {
        tags: ['Odds'],
        summary: 'Cotações detalhadas de uma partida por casa de aposta',
        parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Odds da partida' },
          404: { description: 'Odds não encontradas' },
        },
      },
    },
  },
};
