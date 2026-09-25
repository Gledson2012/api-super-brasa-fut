import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const dataDir = path.resolve(rootDir, 'src/data');
const distDataDir = path.resolve(rootDir, 'dist/data');

interface SeedFileReport {
  file: string;
  exists: boolean;
  count: number;
  sizeKb: number;
  status: 'OK' | 'MISSING' | 'INVALID';
  sampleName?: string;
}

function formatBytes(bytes: number): number {
  return Math.round((bytes / 1024) * 10) / 10;
}

function loadAndVerify<T>(fileName: string): { data: T | null; report: SeedFileReport } {
  const filePath = path.join(dataDir, fileName);

  if (!fs.existsSync(filePath)) {
    return {
      data: null,
      report: {
        file: fileName,
        exists: false,
        count: 0,
        sizeKb: 0,
        status: 'MISSING',
      },
    };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const stat = fs.statSync(filePath);
    const count = Array.isArray(parsed) ? parsed.length : 1;
    const sample = Array.isArray(parsed) && parsed.length > 0 ? (parsed[0].name || parsed[0].title || parsed[0].id) : undefined;

    return {
      data: parsed as T,
      report: {
        file: fileName,
        exists: true,
        count,
        sizeKb: formatBytes(stat.size),
        status: 'OK',
        sampleName: sample,
      },
    };
  } catch {
    return {
      data: null,
      report: {
        file: fileName,
        exists: true,
        count: 0,
        sizeKb: 0,
        status: 'INVALID',
      },
    };
  }
}

export function runSeedCheck(): boolean {
  console.log('\n===============================================================');
  console.log('⚽ SUPER BRASA FUT - Validador & Semeador de Dados Esportivos');
  console.log(`📁 Diretório de dados: ${dataDir}`);
  console.log('===============================================================\n');

  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Diretório de dados não encontrado: ${dataDir}`);
    process.exit(1);
  }

  const files = [
    'leagues.json',
    'teams.json',
    'matches.json',
    'standings.json',
    'players.json',
    'news.json',
    'odds.json',
    'stats-leaders.json',
  ];

  const reports: SeedFileReport[] = [];
  const datasets: Record<string, any> = {};
  let hasErrors = false;

  for (const file of files) {
    const { data, report } = loadAndVerify<any>(file);
    reports.push(report);
    datasets[file] = data;

    if (report.status !== 'OK') {
      hasErrors = true;
    }
  }

  console.log('📊 Status dos Arquivos de Dados:');
  console.log('---------------------------------------------------------------');
  for (const rep of reports) {
    const icon = rep.status === 'OK' ? '✅' : '❌';
    const sample = rep.sampleName ? ` (Ex: "${rep.sampleName}")` : '';
    console.log(
      `${icon} ${rep.file.padEnd(20)} | Registros: ${String(rep.count).padStart(4)} | Tamanho: ${String(rep.sizeKb).padStart(5)} KB | Status: ${rep.status}${sample}`
    );
  }
  console.log('---------------------------------------------------------------');

  // Integridade referencial
  if (!hasErrors) {
    console.log('\n🔍 Verificação de Integridade Referencial:');
    const leagues = datasets['leagues.json'] as any[];
    const teams = datasets['teams.json'] as any[];
    const matches = datasets['matches.json'] as any[];
    const standings = datasets['standings.json'] as any[];

    const teamIds = new Set(teams.map((t) => t.id));
    const leagueIds = new Set(leagues.map((l) => l.id));

    let refErrors = 0;

    // Verificar se ligas de matches existem
    for (const match of matches) {
      if (match.leagueId && !leagueIds.has(match.leagueId)) {
        console.warn(`⚠️ Partida ${match.id} referencia liga inexistente: "${match.leagueId}"`);
        refErrors++;
      }
      if (match.homeTeam?.id && !teamIds.has(match.homeTeam.id)) {
        console.warn(`⚠️ Partida ${match.id} referencia mandante não cadastrado: "${match.homeTeam.id}"`);
        refErrors++;
      }
      if (match.awayTeam?.id && !teamIds.has(match.awayTeam.id)) {
        console.warn(`⚠️ Partida ${match.id} referencia visitante não cadastrado: "${match.awayTeam.id}"`);
        refErrors++;
      }
    }

    // Verificar ligas de standings
    for (const st of standings) {
      if (st.leagueId && !leagueIds.has(st.leagueId)) {
        console.warn(`⚠️ Classificação referencia liga inexistente: "${st.leagueId}"`);
        refErrors++;
      }
    }

    if (refErrors === 0) {
      console.log('✅ Integridade referencial 100% consistente entre ligas, times e partidas!');
    } else {
      console.warn(`⚠️ Total de inconsistências referenciais encontradas: ${refErrors}`);
    }

    // Sincronizar com dist/data caso a pasta dist exista
    if (fs.existsSync(distDataDir)) {
      console.log(`\n🔄 Sincronizando dados para o diretório de build (${distDataDir})...`);
      fs.cpSync(dataDir, distDataDir, { recursive: true });
      console.log('✅ Dados sincronizados em dist/data com sucesso!');
    }
  }

  console.log('\n✨ Processamento de seeds concluído com sucesso!\n');
  return !hasErrors;
}

runSeedCheck();
