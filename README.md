# ⚽ Super Brasa Fut API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ES_Modules-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![Vitest](https://img.shields.io/badge/Tests-160%20Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-orange?logo=prometheus)](http://localhost:3000/metrics)
[![Swagger](https://img.shields.io/badge/OpenAPI-3.0_Swagger-brightgreen?logo=swagger)](http://localhost:3000/docs)

**Super Brasa Fut** é uma API RESTful de alta performance para dados esportivos de futebol brasileiro, sul-americano e mundial. Fornece placares ao vivo, eventos de partidas, estatísticas detalhadas, tabelas de classificação, elencos reais completos (539 atletas cadastrados), estádios oficiais mapeados com capacidade de público, escudos de alta resolução, mercado, comparação de jogadores, cotações de apostas (odds), chaveamento de copas com playoffs, streaming em tempo real via Server-Sent Events (SSE), motor de simulação de partidas, sistema de Webhooks e **motor de ingestão contínua e sincronização em segundo plano com o Flashscore oficial** (centenas de ligas e partidas globais).

---

## 🏆 Campeonatos Cadastrados (23 Competições)

A API cobre 23 das maiores competições do planeta:

### 🇧🇷 Futebol Brasileiro
* **Brasileirão Série A 2026** (`bra-serie-a-2026`)
* **Brasileirão Série B 2026** (`bra-serie-b-2026`)
* **Copa do Brasil 2026** (`bra-copa-do-brasil-2026`)
* **Brasileirão Sub-17 2026** (`bra-sub-17-2026`)

### 🌐 Torneios Globais & Internacionais (FIFA / Seleções)
* **Copa do Mundo FIFA 2026** (`fifa-world-cup-2026`)
* **Mundial de Clubes FIFA 2026** (`fifa-club-world-cup-2026`)
* **Copa Intercontinental da FIFA 2026** (`fifa-intercontinental-cup-2026`)
* **Mundial Sub-20 Feminino FIFA 2026** (`fifa-wwc-u20-2026`)
* **Eliminatórias Copa do Mundo - América do Sul 2026** (`conmebol-wc-qualifiers-2026`)
* **UEFA Nations League 2026/27** (`uefa-nations-league-2026`)
* **Copa Ouro CONCACAF 2026** (`concacaf-gold-cup-2026`)

### 🌎 Competições Continentais de Clubes
* **Copa Libertadores 2026** (`conmebol-libertadores-2026`)
* **Copa Sul-Americana 2026** (`conmebol-sudamericana-2026`)
* **UEFA Champions League 2026/27** (`uefa-champions-league-2026`)
* **UEFA Women's Champions League 2026** (`uefa-wcl-2026`)
* **AFC Champions League Elite 2026/27** (`afc-champions-league-2026` - Ásia)
* **Liga dos Campeões da CAF 2026/27** (`caf-champions-league-2026` - África)

### 🌍 Ligas Nacionais Internacionais
* **Premier League 2026/27** (`eng-premier-league-2026` - Inglaterra)
* **LaLiga 2026/27** (`esp-laliga-2026` - Espanha)
* **Serie A Italiana 2026/27** (`ita-serie-a-2026` - Itália)
* **Bundesliga 2026/27** (`ger-bundesliga-2026` - Alemanha)
* **Primeira A Colômbia 2026** (`col-primera-a-2026` - Colômbia)
* **Copa Chile 2026** (`chi-copa-chile-2026` - Chile)

---

## 👥 Elencos, Estádios e Escudos Oficiais
* **539 Atletas Reais**: Elencos completos (16 a 20 atletas) para todos os 20 clubes do Brasileirão Série A, Série B (Santos, Sport, Novorizontino, Operário, CRB, Avaí, Athletic Club), Seleções Principais (Brasil, Argentina, França, Alemanha) e gigantes internacionais (Real Madrid, Barcelona, Man City, Arsenal, Al-Hilal), com números de camisa, posições, idades, valores de mercado e estatísticas de temporada.
* **65 Estádios Mapeados**: 100% das equipes e partidas possuem estádios oficiais cadastrados com nome oficial, cidade e capacidade exata de público (ex: Maracanã, MorumBIS, Neo Química Arena, Allianz Parque, Mineirão, Beira-Rio, Rei Pelé, Ressacada, Santiago Bernabéu, etc.).
* **Escudos Oficiais (Logos)**: 100% dos clubes com `logoUrl` em alta resolução sincronizado em tabelas de classificação, chaves de mata-mata, partidas e no objeto do clube em cada jogador.
* **Sincronização Flashscore**: Integração de partidas em tempo real alinhadas com o Flashscore oficial (`https://www.flashscore.com.br/`), incluindo links diretos das partidas, eventos, placares e status temporal preciso.

---

## 🚀 Como Iniciar o Projeto

### Pré-requisitos
* Node.js v18+ (recomendado Node.js 20 ou 22)
* npm

### Instalação e Execução
```bash
# 1. Instalar dependências
npm install

# 2. Validar e sincronizar sementes de dados
npm run seed

# 3. Iniciar em modo de desenvolvimento (com hot-reload)
npm run dev

# 4. Rodar a suíte completa de testes (160 testes 100% aprovados)
npm test

# 5. Verificação de tipos (inclui os testes) e cobertura
npm run typecheck
npm run test:coverage

# 6. Compilar o projeto TypeScript para produção
npm run build

# 7. Executar build de produção
npm start
```

---

## 📡 Documentação Interativa
Com o servidor rodando, acesse a documentação OpenAPI / Swagger:
* **Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
* **Status da API**: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health) — inclui `persistence` (backend ativo: `memory` ou `upstash`) e `timeZone`.
* **Prontidão (readiness)**: [http://localhost:3000/api/v1/health/ready](http://localhost:3000/api/v1/health/ready) — testa a conectividade real com o backend de persistência (HTTP `200` pronto / `503` degradado).

---

## 🔑 Autenticação e Planos de Acesso (X-API-Key)
A API suporta requisições anônimas ou autenticadas via cabeçalho HTTP `X-API-Key`:

| Plano | Variável da chave | Limite de Taxa | Benefícios |
| :--- | :--- | :---: | :--- |
| **Público / Free** | (sem header ou `API_KEY_FREE`) | `RATE_LIMIT_FREE` (60 req/min) | Acesso completo a todas as consultas |
| **Pro** | `API_KEY_PRO` | `RATE_LIMIT_PRO` (300 req/min) | Maior vazão, Webhooks e suporte a odds |
| **Enterprise** | `API_KEY_ENTERPRISE` | `RATE_LIMIT_ENTERPRISE` (1000 req/min) | Limite corporativo para alta concorrência |

> As chaves e os limites por minuto vêm de variáveis de ambiente (veja [`.env.example`](.env.example)). O repositório traz valores **apenas para desenvolvimento**; em produção defina chaves próprias e fortes.
>
> **Em produção (`NODE_ENV=production`), os planos Pro e Enterprise só são aceitos se `API_KEY_PRO` / `API_KEY_ENTERPRISE` estiverem definidas no ambiente.** Sem elas, os valores default do repositório são desativados (o acesso público/free continua funcionando) e um aviso é registrado no boot. Isso impede que as chaves de exemplo concedam escrita (webhooks, simulação, `reset`).
>
> Os endpoints de escrita (simulação de partidas, `reset` e Webhooks) exigem uma chave **Pro** ou **Enterprise**.

### Cabeçalhos de segurança
O [Helmet](https://helmetjs.github.io/) aplica a política padrão (incluindo `Content-Security-Policy`) em **todas** as respostas da API. Apenas as rotas `/docs` e `/api-docs` (Swagger UI, que injeta assets inline) recebem o Helmet sem CSP.

Verifique o status da sua chave via:
```http
GET /api/v1/auth/verify
Header: x-api-key: $API_KEY_PRO
```

---

## ⚡ Streaming em Tempo Real (SSE)
Para conectar seu frontend ou bot a um feed ao vivo com zero latência:
```http
GET /api/v1/matches/live/stream
Accept: text/event-stream
```

### Exemplo em JavaScript:
```javascript
const eventSource = new EventSource('http://localhost:3000/api/v1/matches/live/stream');

eventSource.addEventListener('matches', (event) => {
  const liveMatches = JSON.parse(event.data);
  console.log('Partidas ao vivo atualizadas:', liveMatches);
});
```

---

## 🎮 Motor de Simulação ao Vivo
Para testes de interface, streaming e desenvolvimento sem depender de partidas reais no momento:

* **Avançar tempo do jogo (5 min + stats)**:
  ```http
  POST /api/v1/matches/:id/simulate-tick
  ```
* **Disparar evento dinâmico (Gol, Cartão, Substituição)**:
  ```http
  POST /api/v1/matches/:id/simulate-event
  Content-Type: application/json

  {
    "type": "GOAL",
    "team": "home",
    "player": "Estêvão",
    "minute": 78
  }
  ```
* **Restaurar estado original das partidas**:
  ```http
  POST /api/v1/matches/reset
  ```

---

## 🔔 Sistema de Webhooks
Cadastre endpoints para receber notificações imediatas quando sair um gol ou ocorrer evento relevante.
O recurso exige uma chave **Pro** ou **Enterprise** (`x-api-key`).

* **Criar Assinatura**:
  ```http
  POST /api/v1/webhooks
  x-api-key: $API_KEY_PRO
  Content-Type: application/json

  {
    "url": "https://meu-servidor.com/webhook/gols",
    "events": ["GOAL", "MATCH_EVENT"],
    "secret": "meu-token-secreto"
  }
  ```
* **Listar Assinaturas**: `GET /api/v1/webhooks`
* **Remover Assinatura**: `DELETE /api/v1/webhooks/:id`
* **Histórico de Entregas**: `GET /api/v1/webhooks/deliveries` (ou por webhook: `GET /api/v1/webhooks/:id/deliveries`)
* **Reenvio Manual (Redeliver)**: `POST /api/v1/webhooks/deliveries/:id/redeliver`

O corpo do `POST` é validado com Zod: `url` é obrigatória, `events` aceita apenas `GOAL`, `MATCH_EVENT`, `MATCH_STATUS_CHANGE` e `ALL`, e `secret` (quando enviado) precisa ter ao menos 8 caracteres. Requisições inválidas recebem `422 VALIDATION_ERROR` com o campo problemático em `error.details`.

Eventos emitidos hoje: `GOAL` e `MATCH_EVENT` (via `POST /matches/:id/simulate-event`) e `MATCH_STATUS_CHANGE` (quando o avanço do relógio muda o status da partida, ex.: `LIVE → HALFTIME` / `FINISHED`).

### 🔁 Resiliência e Retentativas (Exponential Backoff)
Quando o endpoint receptor responde com erro de servidor (`5xx`, `429`) ou sofre timeout/queda de rede, a API realiza até **3 tentativas automáticas** (`WEBHOOK_MAX_RETRIES`) com **backoff exponencial** (`WEBHOOK_RETRY_DELAY_MS`), registrando status, latência e tentativas no histórico de auditoria.

### 🔐 Segurança
* A URL é validada contra **SSRF**: apenas `http(s)` para hosts públicos (bloqueia `localhost`, IPs privados/reservados e metadata de nuvem); o DNS é revalidado antes de cada disparo. Para testar webhooks com um receptor local, defina `WEBHOOK_ALLOW_PRIVATE_HOSTS=true` **(apenas dev/teste; nunca em produção)**.
* Cada entrega envia `X-SuperBrasa-Event`, `X-SuperBrasa-Timestamp`, `X-SuperBrasa-Delivery` e, quando há `secret`, `X-SuperBrasa-Signature` com **HMAC-SHA256** de `timestamp.body` (compare com `verifyWebhookSignature`).

---

## 🔄 Motor de Sincronização Flashscore (Scraper & Background Worker)

A API integra um **motor nativo autônomo de raspagem e sincronização contínua com o Flashscore oficial** (`https://www.flashscore.com.br/`), capaz de processar centenas de partidas e ligas mundiais sem depender de APIs terceiras pagas:

- **Ingestão Completa de Jogos**: Varre e faz o parse de centenas de partidas ao vivo (`LIVE`), agendadas (`UPCOMING` para hoje, amanhã ou qualquer data) e finalizadas (`FINISHED`).
- **Resolução & Registro Dinâmico**: Identifica automaticamente clubes e ligas já existentes no catálogo ou cadastra instantaneamente novos times e campeonatos internacionais em tempo real.
- **Placares, Períodos e Minutos**: Atualiza placares (`score.home`, `score.away`), períodos (`1H`, `HT`, `2H`, `FT`) e minutos de jogo em andamento.
- **Disparo de Webhooks em Tempo Real**: Quando um gol ou mudança de status é detectada durante a sincronização, eventos `GOAL` e `MATCH_STATUS_CHANGE` são emitidos automaticamente para os endpoints webhook registrados.
- **Worker em Segundo Plano**: Inicia automaticamente com o servidor e executa ciclos periódicos de sincronização configuráveis:
  ```env
  FLASHSCORE_SYNC_ENABLED=true               # Ativa/desativa o worker em background (padrão: true)
  FLASHSCORE_SYNC_INTERVAL_MINUTES=5        # Intervalo em minutos entre ciclos (padrão: 5)
  ```
- **Controle Total via REST**: É possível disparar sincronizações manuais imediatas ou pausar/iniciar o worker a qualquer momento através dos endpoints `/api/v1/sync/*`.

---

## 💾 Persistência de Estado
Por padrão a API roda 100% em memória a partir dos seeds JSON. Para manter webhooks e partidas simuladas entre reinícios (e cold starts em serverless), configure um **Redis serverless (Upstash)** — a hidratação ocorre no boot:

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Sem essas variáveis, um store em memória é usado automaticamente. O fuso dos filtros de data (`date=today`) é configurável via `TIME_ZONE` (padrão `America/Sao_Paulo`).

---

## 🚨 Monitoramento e Alertas

### Endpoints de saúde
| Endpoint | Semântica |
| :--- | :--- |
| `GET /api/v1/health` | **Liveness** — sempre `200` enquanto o processo responde (não depende da persistência) |
| `GET /api/v1/health/ready` | **Readiness** — `200 {status:"ready"}` quando a persistência responde; `503 {status:"degraded"}` quando o Upstash falha/timeout |

### Monitor externo (recomendado)
Aponte um serviço de uptime (ex.: **UptimeRobot**) para o readiness. Qualquer resposta **não-2xx** (o `503`) marca o monitor como *down* e dispara o alerta:

- **Tipo**: HTTP(s) · **Intervalo**: 5 min
- **URL**: `https://<sua-api>/api/v1/health/ready`
- **Alert contact**: e-mail/Slack do time

> Keyword monitoring (`"status":"ready"`) exige plano pago e não é necessário — o `503` já sinaliza a queda.

Configuração atual em produção: monitor **UptimeRobot** (`Super Brasa Fut API - /health/ready`, intervalo 5 min, alerta por e-mail) apontando para `https://api-super-brasa-fut.vercel.app/api/v1/health/ready`.

### Alertas in-app (opcional)
A própria API pode notificar a mudança de estado (útil quando algo chama o readiness: um monitor, um Cron etc.):

```env
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...   # Slack, Discord, PagerDuty ou genérico
ALERT_COOLDOWN_MS=300000                                  # evita spam de alertas repetidos (padrão: 5 min)
ALERT_CHECK_INTERVAL_MS=0                                 # self-check periódico (0 = off; aplica-se a servidor self-hosted)
```

Fluxo: primeira falha → `degraded`; quando voltar a responder → `recovered`. O cooldown evita repetir o alerta a cada verificação enquanto o serviço segue fora. O payload é compatível com Slack (`text`) e Discord (`content`) e inclui `status`, `backend`, `latencyMs` e `error`.

### 📊 Métricas Prometheus
A API exporta telemetria em tempo real no formato padrão Prometheus em:
* `GET /metrics` ou `GET /api/v1/metrics`

Métricas incluídas:
* **Node.js runtime**: consumo de heap, memória residente, CPU, garbage collection e event loop lag (`super_brasa_*`).
* `super_brasa_http_requests_total`: volume de requisições por `method`, `route` e `status_code`.
* `super_brasa_http_request_duration_seconds`: histograma de latência HTTP.
* `super_brasa_active_sse_connections`: gauge de conexões SSE ativas no streaming de partidas ao vivo.
* `super_brasa_webhook_deliveries_total`: contador de entregas de webhooks por evento e status (`success`, `failed`, `retrying`).

---

## 📚 Principais Endpoints da API

| Método | Endpoint | Descrição |
| :---: | :--- | :--- |
| `GET` | `/` ou `/api/v1` | Metadados da API, versão e índice de rotas disponíveis |
| `GET` | `/metrics` ou `/api/v1/metrics` | Métricas Prometheus de telemetria e latência |
| `GET` | `/api/v1/health` | Diagnóstico de integridade e versão |
| `GET` | `/api/v1/health/ready` | Readiness probe (persistência): `200` pronto / `503` degradado |
| `GET` | `/api/v1/auth/verify` | Valida a `X-API-Key` e devolve o plano, o limite e os recursos habilitados |
| `GET` | `/api/v1/search?q=flamengo` | Busca global (clubes, ligas, atletas, jogos) |
| `GET` | `/api/v1/leagues` | Lista de campeonatos com filtros |
| `GET` | `/api/v1/leagues/:id` | Detalhes de um campeonato |
| `GET` | `/api/v1/leagues/:id/standings` | Tabela de classificação completa (`?format=csv` suportado) |
| `GET` | `/api/v1/leagues/:id/bracket` | Árvore de chaveamento e mata-mata (Copas, playoffs) |
| `GET` | `/api/v1/leagues/:id/matches` | Jogos daquela liga |
| `GET` | `/api/v1/leagues/:id/teams` | Clubes participantes da liga |
| `GET` | `/api/v1/leagues/:id/leaders` | Líderes estatísticos da liga |
| `GET` | `/api/v1/matches` | Partidas paginadas com filtros flexíveis (`?league=`, `?team=`, `?date=today`, `?status=`, `?format=csv`) |
| `GET` | `/api/v1/matches/live` | Apenas partidas em andamento sincronizadas com Flashscore |
| `GET` | `/api/v1/matches/live/stream` | Stream SSE em tempo real |
| `GET` | `/api/v1/matches/h2h?team1Id=X&team2Id=Y` | Confronto direto com médias, BTTS, Over 2.5 e sequências |
| `GET` | `/api/v1/matches/:id` | Detalhes de uma partida |
| `GET` | `/api/v1/matches/:id/lineups` | Escalações táticas, esquemas e campinho |
| `GET` | `/api/v1/matches/:id/stats` | Estatísticas detalhadas, xG e momentum minuto a minuto |
| `GET` | `/api/v1/matches/:id/odds` | Odds da partida com probabilidades implícitas |
| `POST` | `/api/v1/matches/:id/simulate-tick` | Avança 5 minutos do jogo (**Pro**) |
| `POST` | `/api/v1/matches/:id/simulate-event` | Dispara evento na partida (**Pro**) |
| `POST` | `/api/v1/matches/:id/simulate-auto` | Inicia simulação contínua automática (Live Clock / Demo) (**Pro**) |
| `POST` | `/api/v1/matches/:id/simulate-stop` | Interrompe a simulação contínua (**Pro**) |
| `GET` | `/api/v1/matches/:id/simulate-status` | Status da simulação contínua |
| `POST` | `/api/v1/matches/reset` | Restaura os seeds e limpa o estado persistido (**Pro**) |
| `GET` | `/api/v1/standings` | Classificações publicadas |
| `GET` | `/api/v1/standings/validate` | Auditoria das invariantes das tabelas (jogos, pontos, saldo, ordenação) |
| `GET` | `/api/v1/standings/:leagueId` | Classificação de uma liga (`?format=csv` suportado) |
| `GET` | `/api/v1/teams` | Lista de clubes e seleções |
| `GET` | `/api/v1/teams/:id/calendar` | Calendário e retrospecto do time |
| `GET` | `/api/v1/teams/:id/squad` | Elenco do time (`/players` é alias) |
| `GET` | `/api/v1/players` | Jogadores cadastrados |
| `GET` | `/api/v1/players/compare?p1=X&p2=Y` | Comparador lado a lado de atletas |
| `GET` | `/api/v1/stats/leaders` | Artilheiros, assistências e melhores notas |
| `GET` | `/api/v1/stats/top-scorers/:leagueId` | Artilharia da liga (`top-assists` e `top-ratings` idem) |
| `GET` | `/api/v1/news` | Notícias (paginadas) |
| `GET` | `/api/v1/odds` | Linhas de apostas e cotações |
| `POST` | `/api/v1/webhooks` | Cadastro de Webhooks (**Pro**) |
| `GET` | `/api/v1/webhooks` | Lista de Webhooks cadastrados (**Pro**) |
| `GET` | `/api/v1/webhooks/deliveries` | Histórico global de entregas e retentativas (**Pro**) |
| `GET` | `/api/v1/webhooks/:id/deliveries` | Histórico de entregas de um webhook (**Pro**) |
| `POST` | `/api/v1/webhooks/deliveries/:id/redeliver` | Reenvio manual de evento (**Pro**) |
| `DELETE` | `/api/v1/webhooks/:id` | Remove um Webhook (**Pro**) |
| `GET` | `/api/v1/sync/status` | Status do worker de sincronização Flashscore e métricas |
| `POST` | `/api/v1/sync/flashscore` | Dispara sincronização imediata (`?date=today`, `?date=tomorrow`, `?date=yesterday`, `?mode=live`, `?mode=all`) (**Pro**) |
| `POST` | `/api/v1/sync/start` | Inicia o worker em segundo plano (`{ "intervalMinutes": 5 }`) (**Pro**) |
| `POST` | `/api/v1/sync/stop` | Pausa o worker em segundo plano (**Pro**) |

---

## 🛡️ Licença
Este projeto é distribuído sob a licença [MIT](LICENSE).

