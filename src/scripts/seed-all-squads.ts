import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Player, PlayerPosition, PlayerStats } from '../models/player.model.js';
import { squadsSerieA1 } from './data/squads-serie-a-1.js';
import { squadsSerieA2 } from './data/squads-serie-a-2.js';
import { squadsSerieA3 } from './data/squads-serie-a-3.js';
import { squadsSerieA4 } from './data/squads-serie-a-4.js';
import { squadsOthers } from './data/squads-others.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const dataDir = path.resolve(rootDir, 'src/data');
const distDataDir = path.resolve(rootDir, 'dist/data');

const teamsFile = path.join(dataDir, 'teams.json');
const playersFile = path.join(dataDir, 'players.json');

const teams = JSON.parse(fs.readFileSync(teamsFile, 'utf-8'));
const existingPlayers: Player[] = JSON.parse(fs.readFileSync(playersFile, 'utf-8'));

const teamMap: Record<string, { id: string; name: string; shortName: string; leagueId: string }> = {};
for (const t of teams) {
  teamMap[t.id] = { id: t.id, name: t.name, shortName: t.shortName, leagueId: t.leagueId };
}

export interface RawPlayerDef {
  id: string;
  name: string;
  fullName?: string;
  nickname?: string;
  birthDate: string;
  age: number;
  nationality: string;
  countryCode: string;
  position: PlayerPosition;
  teamId: string;
  shirtNumber: number;
  marketValueEur?: number;
  contractUntil?: string;
  foot?: 'left' | 'right' | 'both';
  heightCm?: number;
  weightKg?: number;
  goals?: number;
  assists?: number;
  appearances?: number;
  minutes?: number;
  yellowCards?: number;
  redCards?: number;
  cleanSheets?: number;
  rating?: number;
  keyPasses?: number;
  shotsOnTarget?: number;
  passAccuracy?: number;
}

export function makePlayer(def: RawPlayerDef): Player {
  const team = teamMap[def.teamId];
  if (!team) {
    throw new Error(`Team ID não encontrado: ${def.teamId} para o jogador ${def.name}`);
  }

  const leagueNameMap: Record<string, string> = {
    'bra-serie-a-2026': 'Brasileirão Série A 2026',
    'bra-serie-b-2026': 'Brasileirão Série B 2026',
    'esp-laliga-2026': 'La Liga 2025/26',
    'eng-premier-league-2026': 'Premier League 2025/26',
    'conmebol-wc-qualifiers-2026': 'Eliminatórias Sul-Americanas 2026',
    'uefa-nations-league-2026': 'UEFA Nations League 2025/26',
    'fifa-club-world-cup-2026': 'Copa do Mundo de Clubes FIFA 2026',
    'chi-copa-chile-2026': 'Copa Chile 2026',
    'col-primera-a-2026': 'Liga BetPlay Dimayor 2026',
    'bra-sub-17-2026': 'Brasileirão Sub-17 2026',
    'fifa-wwc-u20-2026': 'Copa do Mundo Feminina Sub-20 FIFA 2026',
    'uefa-wcl-2026': 'UEFA Women Champions League 2025/26',
  };

  const app = def.appearances ?? Math.floor(Math.random() * 8) + 16;
  const minutes = def.minutes ?? Math.floor(app * (Math.random() * 15 + 75));
  const goals = def.goals ?? 0;
  const assists = def.assists ?? 0;

  const stat: PlayerStats = {
    season: '2026',
    leagueId: team.leagueId,
    leagueName: leagueNameMap[team.leagueId] || team.leagueId,
    appearances: app,
    minutesPlayed: minutes,
    goals,
    assists,
    yellowCards: def.yellowCards ?? Math.floor(Math.random() * 4),
    redCards: def.redCards ?? 0,
    sofascoreRating: def.rating ?? Number((Math.random() * 0.8 + 6.8).toFixed(2)),
  };

  if (def.position === 'Forward' || def.position === 'Midfielder') {
    stat.expectedGoals = Number((goals * 0.9 + Math.random() * 0.8).toFixed(1));
    stat.expectedAssists = Number((assists * 0.85 + Math.random() * 0.6).toFixed(1));
    stat.shotsOnTarget = def.shotsOnTarget ?? Math.floor(goals * 2.2 + Math.random() * 10);
    stat.keyPasses = def.keyPasses ?? Math.floor(assists * 4 + Math.random() * 15);
    stat.passAccuracyPercent = def.passAccuracy ?? Math.floor(Math.random() * 12 + 76);
  } else if (def.position === 'Defender') {
    stat.passAccuracyPercent = def.passAccuracy ?? Math.floor(Math.random() * 10 + 82);
    stat.cleanSheets = def.cleanSheets ?? Math.floor(app * 0.35);
  } else if (def.position === 'Goalkeeper') {
    stat.cleanSheets = def.cleanSheets ?? Math.floor(app * 0.4);
    stat.passAccuracyPercent = def.passAccuracy ?? Math.floor(Math.random() * 15 + 68);
  }

  return {
    id: def.id,
    slug: def.id,
    name: def.name,
    fullName: def.fullName || def.name,
    nickname: def.nickname,
    birthDate: def.birthDate,
    age: def.age,
    nationality: def.nationality,
    countryCode: def.countryCode,
    photoUrl: `https://images.superbrasafut.com/players/${def.id}.png`,
    heightCm: def.heightCm ?? Math.floor(Math.random() * 15 + 175),
    weightKg: def.weightKg ?? Math.floor(Math.random() * 15 + 70),
    preferredFoot: def.foot ?? (Math.random() > 0.3 ? 'right' : 'left'),
    position: def.position,
    currentTeam: {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
    },
    shirtNumber: def.shirtNumber,
    marketValueEur: def.marketValueEur ?? Math.floor(Math.random() * 10000000 + 1000000),
    contractUntil: def.contractUntil ?? '2027-12-31',
    stats: [stat],
  };
}

export function executePopulation(): void {
  console.log('🚀 Iniciando povoamento massivo de elencos reais e atualizados...');

  const allRaw: RawPlayerDef[] = [
    ...squadsSerieA1,
    ...squadsSerieA2,
    ...squadsSerieA3,
    ...squadsSerieA4,
    ...squadsOthers,
  ];

  console.log(`📋 Total de definições de atletas preparadas: ${allRaw.length}`);

  // Preservar jogadores existentes que já estão no arquivo
  const finalPlayers: Player[] = [...existingPlayers];
  const existingIds = new Set(existingPlayers.map((p) => p.id));

  let added = 0;
  let skipped = 0;

  for (const raw of allRaw) {
    if (existingIds.has(raw.id)) {
      skipped++;
      continue;
    }

    try {
      const player = makePlayer(raw);
      finalPlayers.push(player);
      existingIds.add(player.id);
      added++;
    } catch (err: any) {
      console.error(`❌ Erro ao instanciar jogador ${raw.id}:`, err.message);
    }
  }

  // Escrever src/data/players.json formatado
  fs.writeFileSync(playersFile, JSON.stringify(finalPlayers, null, 2), 'utf-8');
  console.log(`💾 src/data/players.json salvo com sucesso! (Adicionados: ${added}, Ignorados/Já existentes: ${skipped})`);
  console.log(`👥 Total de jogadores agora cadastrados: ${finalPlayers.length}`);

  // Sincronizar com dist/data se existir
  if (fs.existsSync(distDataDir)) {
    const distPlayersFile = path.join(distDataDir, 'players.json');
    fs.writeFileSync(distPlayersFile, JSON.stringify(finalPlayers, null, 2), 'utf-8');
    console.log(`🔄 dist/data/players.json sincronizado com sucesso!`);
  }

  // Estatísticas por equipe
  const countMap: Record<string, number> = {};
  for (const p of finalPlayers) {
    countMap[p.currentTeam.id] = (countMap[p.currentTeam.id] || 0) + 1;
  }

  const serieATeams = teams.filter((t: any) => t.leagueId === 'bra-serie-a-2026');
  console.log('\n🏆 Status dos 20 Clubes da Série A:');
  for (const t of serieATeams) {
    const count = countMap[t.id] || 0;
    const status = count >= 10 ? '✅ Completo' : count > 0 ? '⚠️ Parcial' : '❌ Vazio';
    console.log(`- ${t.shortName.padEnd(16)}: ${String(count).padStart(2)} jogadores [${status}]`);
  }
}

executePopulation();
