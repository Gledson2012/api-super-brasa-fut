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
    { name: 'Search', description: 'Busca global unificada em múltiplas entidades do futebol' },
    { name: 'Auth', description: 'Autenticação e verificação de chave de API (X-API-Key)' },
    { name: 'Webhooks', description: 'Assinatura e gerenciamento de notificações instantâneas' },
    { name: 'Health', description: 'Diagnóstico e integridade da API' },
    { name: 'Metrics', description: 'Métricas de desempenho e telemetria no formato Prometheus' },
  ],
  paths: {
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Busca global unificada por campeonatos, clubes, jogadores, partidas e notícias',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Termo de pesquisa (ex: flamengo, arrascaeta, libertadores)' },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['all', 'leagues', 'teams', 'players', 'matches', 'news'], default: 'all' }, description: 'Filtrar por tipo de entidade' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Limite de resultados por categoria' },
        ],
        responses: {
          200: { description: 'Resultados categorizados da pesquisa' },
          400: { description: 'Parâmetro de pesquisa inválido ou ausente' },
        },
      },
    },
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
    '/leagues/{id}/bracket': {
      get: {
        tags: ['Leagues'],
        summary: 'Obtém a árvore de chaveamento e mata-mata da competição (Copas e playoffs)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Chaveamento da competição com rodadas e confrontos agregados' },
          404: { description: 'Chaveamento não encontrado para a liga' },
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
    '/matches/live/stream': {
      get: {
        tags: ['Matches'],
        summary: 'Streaming contínuo de partidas ao vivo via Server-Sent Events (SSE)',
        description: 'Mantém uma conexão persistente text/event-stream transmitindo atualizações de minuto, placar e eventos de jogos em andamento em tempo real.',
        responses: {
          200: {
            description: 'Conexão SSE estabelecida com eventos periódicos',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                  example: 'event: matches\ndata: [{"id": "m-fla-pal", "minute": 67, "score": {"home": 2, "away": 1}}]\n\n',
                },
              },
            },
          },
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
    '/matches/{id}/lineups': {
      get: {
        tags: ['Matches'],
        summary: 'Obtém escalações táticas completas, esquema e coordenadas no campo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Escalações titulares e reservas das duas equipes' },
          404: { description: 'Escalações não encontradas' },
        },
      },
    },
    '/matches/{id}/stats': {
      get: {
        tags: ['Matches'],
        summary: 'Obtém estatísticas aprofundadas da partida (xG, posse, momentum minuto a minuto)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Estatísticas detalhadas da partida' },
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
    '/matches/{id}/simulate-event': {
      post: {
        tags: ['Matches'],
        summary: 'Simula a ocorrência de um evento dinâmico na partida (Gol, Cartão, Substituição)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'] },
                  team: { type: 'string', enum: ['home', 'away'] },
                  player: { type: 'string', example: 'Pedro' },
                  minute: { type: 'integer', example: 78 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Evento registrado e placar atualizado com sucesso' },
        },
      },
    },
    '/matches/{id}/simulate-auto': {
      post: {
        tags: ['Matches'],
        summary: 'Inicia simulação automática contínua da partida (Live Clock / Demo Mode)',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  intervalMs: { type: 'integer', default: 2500, description: 'Intervalo de tempo real entre cada tick (ms)' },
                  speedMinutes: { type: 'integer', default: 5, description: 'Minutos de jogo avançados por tick' },
                  autoEvents: { type: 'boolean', default: true, description: 'Gerar eventos dinâmicos (gols, cartões) aleatórios' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Simulação contínua iniciada com sucesso' },
        },
      },
    },
    '/matches/{id}/simulate-stop': {
      post: {
        tags: ['Matches'],
        summary: 'Interrompe a simulação automática da partida',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Simulação interrompida com sucesso' },
        },
      },
    },
    '/matches/{id}/simulate-status': {
      get: {
        tags: ['Matches'],
        summary: 'Verifica o status atual da simulação automática da partida',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Status da simulação (running, intervalMs, startedAt)' },
        },
      },
    },
    '/matches/reset': {
      post: {
        tags: ['Matches'],
        summary: 'Restaura todas as partidas para o estado inicial das sementes de dados',
        responses: {
          200: { description: 'Partidas restauradas para o estado padrão' },
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
    '/teams/{id}/calendar': {
      get: {
        tags: ['Teams', 'Matches'],
        summary: 'Calendário e retrospecto completo do clube',
        description: 'Retorna histórico de partidas passadas, próximos confrontos ordenados cronologicamente e resumo de vitórias/empates/derrotas.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Calendário consolidado do time' },
          404: { description: 'Time não encontrado' },
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
    '/standings/validate': {
      get: {
        tags: ['Standings'],
        summary: 'Valida as invariantes matemáticas das tabelas de classificação',
        responses: {
          200: { description: 'Relatório de consistência das classificações' },
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
    '/players/compare': {
      get: {
        tags: ['Players', 'Stats & Leaders'],
        summary: 'Comparação estatística detalhada lado a lado entre dois atletas',
        description: 'Compara gols, assistências, participações em gols, notas médias Sofascore, cartões e minutos jogados.',
        parameters: [
          { name: 'p1', in: 'query', required: true, schema: { type: 'string' }, description: 'ID ou slug do primeiro jogador (ex: estevao-willian)' },
          { name: 'p2', in: 'query', required: true, schema: { type: 'string' }, description: 'ID ou slug do segundo jogador (ex: pedro-flamengo)' },
        ],
        responses: {
          200: { description: 'Relatório comparativo dos dois jogadores' },
          400: { description: 'Parâmetros p1 ou p2 ausentes' },
          404: { description: 'Um ou ambos os jogadores não encontrados' },
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
    '/auth/verify': {
      get: {
        tags: ['Auth'],
        summary: 'Verifica o status e o plano da chave de API fornecida (X-API-Key)',
        parameters: [
          {
            name: 'x-api-key',
            in: 'header',
            required: false,
            schema: { type: 'string', example: 'brasa-pro-2026' },
            description: 'Chave de acesso à API (brasa-free-key, brasa-pro-2026 ou brasa-enterprise-secret)',
          },
        ],
        responses: {
          200: { description: 'Status de autenticação, plano e limites de requisição' },
          401: { description: 'Chave de API inválida' },
        },
      },
    },
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'Lista assinaturas ativas de webhooks',
        description: 'Exige uma chave de API do plano Pro ou Enterprise (header `x-api-key`).',
        parameters: [
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string', example: 'brasa-pro-2026' },
            description: 'Chave de API do plano Pro ou Enterprise',
          },
        ],
        responses: {
          200: { description: 'Lista de webhooks cadastrados' },
          403: { description: 'Plano insuficiente (requer Pro/Enterprise)' },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Cadastra um novo webhook para receber notificações de eventos (gols, cartões)',
        description:
          'Exige uma chave de API do plano Pro ou Enterprise. A URL é validada contra SSRF (apenas http(s) para hosts públicos; bloqueia localhost, IPs privados/reservados e metadata de nuvem). Cada entrega inclui os cabeçalhos `X-SuperBrasa-Event`, `X-SuperBrasa-Timestamp` e, quando há `secret`, `X-SuperBrasa-Signature` = HMAC-SHA256 (hex) de `timestamp.body`.',
        parameters: [
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string', example: 'brasa-pro-2026' },
            description: 'Chave de API do plano Pro ou Enterprise',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string', example: 'https://meu-app.com/webhook/gols' },
                  events: {
                    type: 'array',
                    items: { type: 'string', enum: ['GOAL', 'MATCH_EVENT', 'MATCH_STATUS_CHANGE', 'ALL'] },
                    example: ['GOAL'],
                  },
                  matchId: { type: 'string', example: 'match-pal-bot-2026' },
                  secret: { type: 'string', example: 'meu-token-secreto' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Webhook cadastrado com sucesso' },
          400: { description: 'URL inválida, ausente ou bloqueada por SSRF' },
          403: { description: 'Plano insuficiente (requer Pro/Enterprise)' },
        },
      },
    },
    '/webhooks/{id}': {
      delete: {
        tags: ['Webhooks'],
        summary: 'Cancela a assinatura de um webhook existente',
        description: 'Exige uma chave de API do plano Pro ou Enterprise (header `x-api-key`).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string', example: 'brasa-pro-2026' },
            description: 'Chave de API do plano Pro ou Enterprise',
          },
        ],
        responses: {
          200: { description: 'Webhook cancelado com sucesso' },
          403: { description: 'Plano insuficiente (requer Pro/Enterprise)' },
          404: { description: 'Webhook não encontrado' },
        },
      },
    },
    '/webhooks/deliveries': {
      get: {
        tags: ['Webhooks'],
        summary: 'Lista o histórico recente de entregas e retentativas de webhooks',
        description: 'Exige uma chave de API do plano Pro ou Enterprise (header `x-api-key`).',
        parameters: [
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string', example: 'brasa-pro-2026' },
            description: 'Chave de API do plano Pro ou Enterprise',
          },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Limite de registros retornados' },
          { name: 'webhookId', in: 'query', schema: { type: 'string' }, description: 'Filtrar por ID do webhook' },
        ],
        responses: {
          200: { description: 'Histórico recente de entregas' },
          403: { description: 'Plano insuficiente (requer Pro/Enterprise)' },
        },
      },
    },
    '/webhooks/{id}/deliveries': {
      get: {
        tags: ['Webhooks'],
        summary: 'Lista as tentativas e histórico de entregas de um webhook específico',
        description: 'Exige uma chave de API do plano Pro ou Enterprise (header `x-api-key`).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string', example: 'brasa-pro-2026' },
            description: 'Chave de API do plano Pro ou Enterprise',
          },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Limite de registros retornados' },
        ],
        responses: {
          200: { description: 'Histórico de entregas do webhook' },
          403: { description: 'Plano insuficiente (requer Pro/Enterprise)' },
          404: { description: 'Webhook não encontrado' },
        },
      },
    },
    '/webhooks/deliveries/{id}/redeliver': {
      post: {
        tags: ['Webhooks'],
        summary: 'Dispara manualmente o reenvio de uma entrega de webhook anterior',
        description: 'Exige uma chave de API do plano Pro ou Enterprise (header `x-api-key`).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string', example: 'brasa-pro-2026' },
            description: 'Chave de API do plano Pro ou Enterprise',
          },
        ],
        responses: {
          200: { description: 'Reenvio processado com sucesso' },
          403: { description: 'Plano insuficiente (requer Pro/Enterprise)' },
          404: { description: 'Entrega ou webhook não encontrado' },
        },
      },
    },
    '/metrics': {
      get: {
        tags: ['Metrics'],
        summary: 'Exporta telemetria e métricas de desempenho no formato Prometheus',
        description: 'Retorna contadores de requisições, latências, conexões SSE ativas e estatísticas de webhooks.',
        responses: {
          200: {
            description: 'Métricas em formato de texto Prometheus',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};
