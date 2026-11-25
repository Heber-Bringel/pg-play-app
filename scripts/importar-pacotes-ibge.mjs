import fs from 'node:fs';
import path from 'node:path';

const IBGE_ESTADOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const IBGE_PAISES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/paises';
const FETCH_TIMEOUT_MS = 15000;
const OUTPUT_FILE = path.join(
  process.cwd(),
  'src',
  'infra',
  'datasources',
  'memoryIbgeForcaDataSource.ts'
);

const VALID_WORD_REGEX = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ -]+$/;
const IGNORED_CONNECTIVES = new Set(['DE', 'DO', 'DA', 'DOS', 'DAS', 'E']);

/**
 * Mapa das 27 capitais brasileiras indexadas pelo código IBGE da UF (id),
 * com a preposição correta ("do" ou "de") ou dica especial anti-vazamento (RF-03).
 */
const CAPITAIS_POR_UF = {
  11: { capital: 'PORTO VELHO', hint: 'Capital do estado de Rondônia' },
  12: { capital: 'RIO BRANCO', hint: 'Capital do estado do Acre' },
  13: { capital: 'MANAUS', hint: 'Capital do estado do Amazonas' },
  14: { capital: 'BOA VISTA', hint: 'Capital do estado de Roraima' },
  15: { capital: 'BELÉM', hint: 'Capital do estado do Pará' },
  16: { capital: 'MACAPÁ', hint: 'Capital do estado do Amapá' },
  17: { capital: 'PALMAS', hint: 'Capital do estado do Tocantins' },
  21: { capital: 'SÃO LUÍS', hint: 'Capital do estado do Maranhão' },
  22: { capital: 'TERESINA', hint: 'Capital do estado do Piauí' },
  23: { capital: 'FORTALEZA', hint: 'Capital do estado do Ceará' },
  24: { capital: 'NATAL', hint: 'Capital do estado do Rio Grande do Norte' },
  25: { capital: 'JOÃO PESSOA', hint: 'Capital do estado da Paraíba' },
  26: { capital: 'RECIFE', hint: 'Capital do estado de Pernambuco' },
  27: { capital: 'MACEIÓ', hint: 'Capital do estado de Alagoas' },
  28: { capital: 'ARACAJU', hint: 'Capital do estado de Sergipe' },
  29: { capital: 'SALVADOR', hint: 'Capital do estado da Bahia' },
  31: { capital: 'BELO HORIZONTE', hint: 'Capital do estado de Minas Gerais' },
  32: { capital: 'VITÓRIA', hint: 'Capital do estado do Espírito Santo' },
  33: { capital: 'RIO DE JANEIRO', hint: 'Capital fluminense conhecida pelo Cristo Redentor' },
  35: { capital: 'SÃO PAULO', hint: 'Capital da unidade federativa mais populosa do Brasil' },
  41: { capital: 'CURITIBA', hint: 'Capital do estado do Paraná' },
  42: { capital: 'FLORIANÓPOLIS', hint: 'Capital do estado de Santa Catarina' },
  43: { capital: 'PORTO ALEGRE', hint: 'Capital do estado do Rio Grande do Sul' },
  50: { capital: 'CAMPO GRANDE', hint: 'Capital do estado de Mato Grosso do Sul' },
  51: { capital: 'CUIABÁ', hint: 'Capital do estado de Mato Grosso' },
  52: { capital: 'GOIÂNIA', hint: 'Capital do estado de Goiás' },
  53: { capital: 'BRASÍLIA', hint: 'Capital do Brasil' },
};

/**
 * Renomeações canônicas por código M49 do IBGE (Spec 2.3).
 */
const RENOMEACOES_CANONICAS_M49 = {
  112: 'BIELORRÚSSIA',
  408: 'COREIA DO NORTE',
  410: 'COREIA DO SUL',
  562: 'NÍGER',
  643: 'RÚSSIA',
  840: 'ESTADOS UNIDOS',
};

/**
 * Exclusão explícita de microestados/ilhas pouco conhecidos em dinâmicas de PG (Spec 2.3).
 */
const EXCLUIDOS_CURADORIA_M49 = new Set([
  28,  // Antígua e Barbuda
  90,  // Ilhas Salomão
  174, // Comores
  212, // Dominica
  262, // Djibouti
  296, // Kiribati
  426, // Lesoto
  454, // Malauí
  480, // Maurício
  520, // Nauru
  548, // Vanuatu
  583, // Micronésia
  584, // Ilhas Marshall
  585, // Palau
  662, // Santa Lúcia
  674, // San Marino
  678, // São Tomé e Príncipe
  690, // Seichelles
  748, // Eswatini
  776, // Tonga
  780, // Trinidad e Tobago
  798, // Tuvalu
  854, // Burkina Faso
]);

/**
 * Dicas especiais anti-vazamento para países que compartilham vocábulo com a região (Spec 2.1).
 */
const DICAS_ESPECIAIS_PAISES_M49 = {
  76: 'Maior país sul-americano em território',
  408: 'País asiático cuja capital é Pyongyang',
  410: 'País asiático cuja capital é Seul',
  626: 'País lusófono insular no arquipélago malaio',
  710: 'País conhecido pela Cidade do Cabo e Joanesburgo',
  728: 'País africano cuja capital é Juba',
  807: 'País balcânico na península europeia',
};

/**
 * Mapeamento fechado da hierarquia geográfica do IBGE (Spec 2.2).
 */
const MAPA_DICAS_REGIOES = {
  'América do sul': 'País da América do Sul',
  'América central': 'País da América Central',
  Caribe: 'País insular do Caribe',
  'América do Norte': 'País da América do Norte',
  'América Latina e Caribe': 'País da América Latina',
  'Europa ocidental (Oeste da Europa)': 'País do Oeste da Europa',
  'Europa oriental (Leste da Europa)': 'País do Leste da Europa',
  'Europa setentrional (Norte da Europa)': 'País do Norte da Europa',
  'Europa meridional (Sul da Europa)': 'País do Sul da Europa',
  'África setentrional (Norte da África)': 'País do Norte da África',
  'África ocidental (Oeste da África)': 'País do Oeste da África',
  'África oriental (Leste da África)': 'País do Leste da África',
  'África central': 'País da África Central',
  'África meridional (Sul da África)': 'País do Sul da África',
  'África subsaariana': 'País da África Subsaariana',
  'Ásia oriental (Leste da Ásia)': 'País do Leste da Ásia',
  'Ásia meridional (Sul da Ásia)': 'País do Sul da Ásia',
  'Ásia ocidental (Oeste da Ásia)': 'País do Oeste da Ásia',
  'Ásia central': 'País da Ásia Central',
  'Sudeste da Ásia': 'País do Sudeste Asiático',
  'Austrália e Nova Zelândia': 'País da Oceania',
  Melanésia: 'País insular da Oceania',
  Micronésia: 'País insular da Oceania',
  Polinésia: 'País insular da Oceania',
};

function normalizeText(value) {
  return String(value)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSignificantTokens(value) {
  return normalizeText(value)
    .split(/[^A-Z]+/)
    .filter((token) => token.length >= 3 && !IGNORED_CONNECTIVES.has(token));
}

async function fetchJsonWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao consultar ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function buildCapitalPuzzles(estados) {
  if (!Array.isArray(estados) || estados.length !== 27) {
    throw new Error(`Esperados 27 estados do IBGE, recebidos: ${estados?.length ?? 0}`);
  }

  const sortedEstados = [...estados].sort((a, b) => Number(a.id) - Number(b.id));
  const puzzles = [];

  for (const uf of sortedEstados) {
    const ufId = Number(uf.id);
    const entry = CAPITAIS_POR_UF[ufId];
    if (!entry) {
      throw new Error(`UF ${ufId} (${uf.nome}) não mapeada em CAPITAIS_POR_UF.`);
    }

    puzzles.push({
      id: `forca-ibge-capital-${ufId}`,
      word: entry.capital,
      hint: entry.hint,
      category: 'Países e Cidades',
    });
  }

  return puzzles;
}

function buildCountryPuzzles(paises) {
  if (!Array.isArray(paises) || paises.length === 0) {
    throw new Error('Lista de países do IBGE vazia ou inválida.');
  }

  const uniqueByM49 = new Map();
  for (const item of paises) {
    const m49 = Number(item?.id?.M49);
    if (!Number.isFinite(m49)) continue;
    if (!uniqueByM49.has(m49)) {
      uniqueByM49.set(m49, item);
    }
  }

  const sortedM49 = Array.from(uniqueByM49.keys()).sort((a, b) => a - b);
  const puzzles = [];

  for (const m49 of sortedM49) {
    if (EXCLUIDOS_CURADORIA_M49.has(m49)) {
      continue;
    }

    const rawCountry = uniqueByM49.get(m49);
    const rawName = String(rawCountry?.nome ?? '').replace(/\s+/g, ' ').trim();
    const word = (RENOMEACOES_CANONICAS_M49[m49] ?? rawName).toUpperCase();

    if (word.length < 2 || word.length > 20 || !VALID_WORD_REGEX.test(word)) {
      continue;
    }

    const rawRegion = String(
      rawCountry?.['regiao-intermediaria']?.nome ?? rawCountry?.['sub-regiao']?.nome ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const hint = DICAS_ESPECIAIS_PAISES_M49[m49] ?? MAPA_DICAS_REGIOES[rawRegion];
    if (!hint) {
      throw new Error(
        `Região do IBGE sem mapeamento de dica para país M49=${m49} (${word}): "${rawRegion}"`
      );
    }

    puzzles.push({
      id: `forca-ibge-pais-${m49}`,
      word,
      hint,
      category: 'Países e Cidades',
    });
  }

  return puzzles;
}

function validatePuzzles(puzzles) {
  const capitalCount = puzzles.filter((p) => p.id.startsWith('forca-ibge-capital-')).length;
  const countryCount = puzzles.filter((p) => p.id.startsWith('forca-ibge-pais-')).length;

  if (capitalCount !== 27) {
    throw new Error(`Invariante violada: esperadas 27 capitais, encontradas ${capitalCount}.`);
  }
  if (countryCount < 100) {
    throw new Error(
      `Invariante violada: esperados pelo menos 100 países curados, encontrados ${countryCount}.`
    );
  }

  const seenIds = new Set();
  const seenWords = new Set();

  for (const puzzle of puzzles) {
    if (seenIds.has(puzzle.id)) {
      throw new Error(`ID duplicado detectado: ${puzzle.id}`);
    }
    seenIds.add(puzzle.id);

    const normWord = normalizeText(puzzle.word);
    if (seenWords.has(normWord)) {
      throw new Error(`Palavra duplicada detectada: ${puzzle.word}`);
    }
    seenWords.add(normWord);

    if (puzzle.word.length < 2 || puzzle.word.length > 20) {
      throw new Error(`Tamanho inválido (${puzzle.word.length}) em "${puzzle.word}".`);
    }

    if (!VALID_WORD_REGEX.test(puzzle.word)) {
      throw new Error(`Caracteres inválidos em "${puzzle.word}".`);
    }

    if (!puzzle.hint || puzzle.hint.trim().length === 0) {
      throw new Error(`Dica vazia para "${puzzle.word}".`);
    }

    if (puzzle.category !== 'Países e Cidades') {
      throw new Error(`Categoria inválida em "${puzzle.word}": ${puzzle.category}`);
    }

    const normHint = normalizeText(puzzle.hint);
    if (normHint.includes(normWord)) {
      throw new Error(
        `Vazamento direto de resposta na dica de "${puzzle.word}": "${puzzle.hint}"`
      );
    }

    const wordTokens = extractSignificantTokens(puzzle.word);
    const hintTokenSet = new Set(extractSignificantTokens(puzzle.hint));
    for (const token of wordTokens) {
      if (hintTokenSet.has(token)) {
        throw new Error(
          `Vazamento de vocábulo ("${token}") na dica de "${puzzle.word}": "${puzzle.hint}"`
        );
      }
    }
  }
}

function escapeSingleQuotes(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderTypeScriptFile(puzzles) {
  const lines = [
    '// ARQUIVO GERADO AUTOMATICAMENTE — NÃO EDITE MANUALMENTE.',
    '// Fonte: IBGE — API de Localidades (https://servicodados.ibge.gov.br/api/docs/localidades)',
    '// Gerado por: node scripts/importar-pacotes-ibge.mjs',
    '',
    "import type { IIbgeForcaDataSource } from '@/model/datasources/iIbgeForcaDataSource';",
    "import type { ForcaPuzzle } from '@/model/entities/arenaChallenge';",
    "import { DataSourceError } from '@/model/errors';",
    '',
    'export const IBGE_FORCA_PUZZLES: readonly ForcaPuzzle[] = [',
  ];

  for (const puzzle of puzzles) {
    lines.push('  {');
    lines.push(`    id: '${escapeSingleQuotes(puzzle.id)}',`);
    lines.push(`    word: '${escapeSingleQuotes(puzzle.word)}',`);
    lines.push(`    hint: '${escapeSingleQuotes(puzzle.hint)}',`);
    lines.push(`    category: '${escapeSingleQuotes(puzzle.category)}',`);
    lines.push('  },');
  }

  lines.push('];');
  lines.push('');
  lines.push('export class MemoryIbgeForcaDataSource implements IIbgeForcaDataSource {');
  lines.push('  private readonly puzzles: ForcaPuzzle[];');
  lines.push('');
  lines.push('  constructor(initialPuzzles: readonly ForcaPuzzle[] = IBGE_FORCA_PUZZLES) {');
  lines.push('    this.puzzles = initialPuzzles.map((puzzle) => ({ ...puzzle }));');
  lines.push('  }');
  lines.push('');
  lines.push('  async listForcaPuzzles(): Promise<ForcaPuzzle[]> {');
  lines.push('    try {');
  lines.push('      return this.puzzles.map((puzzle) => ({ ...puzzle }));');
  lines.push('    } catch {');
  lines.push(
    "      throw new DataSourceError('Não foi possível carregar as localidades do IBGE para a Forca.');"
  );
  lines.push('    }');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const [estados, paises] = await Promise.all([
    fetchJsonWithTimeout(IBGE_ESTADOS_URL),
    fetchJsonWithTimeout(IBGE_PAISES_URL),
  ]);

  const capitalPuzzles = buildCapitalPuzzles(estados);
  const countryPuzzles = buildCountryPuzzles(paises);
  const allPuzzles = [...capitalPuzzles, ...countryPuzzles];

  validatePuzzles(allPuzzles);

  const fileContent = renderTypeScriptFile(allPuzzles);
  fs.writeFileSync(OUTPUT_FILE, fileContent, { encoding: 'utf8' });

  console.log(
    `[IBGE] Gerado com sucesso: ${capitalPuzzles.length} capitais + ${countryPuzzles.length} países = ${allPuzzles.length} puzzles em src/infra/datasources/memoryIbgeForcaDataSource.ts`
  );
}

main().catch((err) => {
  console.error(`[ERRO] Falha ao importar pacotes do IBGE: ${err.message}`);
  process.exit(1);
});
