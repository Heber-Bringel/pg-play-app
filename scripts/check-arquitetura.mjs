import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

const ALLOWED_SRC_DIRS = new Set([
  "app",
  "view",
  "viewmodel",
  "usecase",
  "model",
  "infra",
  "di",
]);

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function relPath(absPath) {
  return toPosix(path.relative(ROOT, absPath));
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "))
    .replace(/\/\/.*$/gm, "");
}

function listFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".gitkeep") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function findLineNumber(text, regex) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) return i + 1;
  }
  return 1;
}

function formatError(rule, file, line, problem, howToFix, reference) {
  return [
    `[ERRO] ${rule} — ${file}:${line}`,
    `  Problema: ${problem}`,
    `  Como corrigir: ${howToFix}`,
    `  Referência: ${reference}`,
  ].join("\n");
}

function parseImports(cleanCode) {
  const imports = [];
  const lines = cleanCode.split(/\r?\n/);
  const importRegex =
    /^\s*import\s+(type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(importRegex);
    if (match) {
      imports.push({
        isTypeOnly: Boolean(match[1]),
        source: match[2],
        line: i + 1,
      });
    }
  }
  return imports;
}

function checkFileRules(absFile) {
  const erros = [];
  if (!fs.existsSync(absFile)) return erros;

  const rel = relPath(absFile);
  if (!rel.startsWith("src/")) return erros;

  const ext = path.extname(absFile);
  if (ext === ".js" || ext === ".jsx") {
    erros.push(
      formatError(
        "GLOBAL-ARQUIVO-JS",
        rel,
        1,
        "Arquivos .js/.jsx são proibidos dentro de src/.",
        "Converta o arquivo para TypeScript (.ts ou .tsx).",
        "docs/harness/02-convencoes-de-codigo.md"
      )
    );
    return erros;
  }

  if (ext !== ".ts" && ext !== ".tsx") return erros;

  const rawCode = fs.readFileSync(absFile, "utf8");
  const cleanCode = stripComments(rawCode);
  const imports = parseImports(cleanCode);
  const fileName = path.basename(absFile);

  // 1. Vocabulário proibido (Repository / Connector)
  if (/Repository|Connector/i.test(fileName) || /\b\w*(Repository|Connector)\b/.test(cleanCode)) {
    const line = findLineNumber(cleanCode, /\b\w*(Repository|Connector)\b/);
    erros.push(
      formatError(
        "VOCABULARIO-PROIBIDO",
        rel,
        line,
        "Uso proibido de 'Repository' ou 'Connector'.",
        "Use 'DataSource' para persistência/dados e 'Service' para funcionalidades.",
        "AGENTS.md (Seção 5)"
      )
    );
  }

  // 2. Regras globais de código
  for (const imp of imports) {
    if (imp.source.startsWith("./") || imp.source.startsWith("../")) {
      erros.push(
        formatError(
          "GLOBAL-IMPORT-RELATIVO",
          rel,
          imp.line,
          `Importação relativa encontrada: "${imp.source}".`,
          "Use sempre o alias '@/...' apontando para 'src/'.",
          "AGENTS.md (Regra 11)"
        )
      );
    }
  }

  if (/(?::\s*any\b|<any>|as\s+any\b)/.test(cleanCode)) {
    const line = findLineNumber(cleanCode, /(?::\s*any\b|<any>|as\s+any\b)/);
    erros.push(
      formatError(
        "GLOBAL-PROIBIDO-ANY",
        rel,
        line,
        "O tipo 'any' é proibido.",
        "Use tipos explícitos ou 'unknown' (em blocos catch, use 'catch (err: unknown)').",
        "docs/harness/02-convencoes-de-codigo.md"
      )
    );
  }

  if (/\bReact\.FC\b|\bFC\s*</.test(cleanCode)) {
    const line = findLineNumber(cleanCode, /\bReact\.FC\b|\bFC\s*</);
    erros.push(
      formatError(
        "GLOBAL-PROIBIDO-REACT-FC",
        rel,
        line,
        "Uso de React.FC é proibido.",
        "Declare componentes como 'const Nome = ({ ... }: NomeProps) => { ... };'.",
        "docs/harness/02-convencoes-de-codigo.md"
      )
    );
  }

  if (/\bexport\s+default\s+function\b/.test(cleanCode)) {
    const line = findLineNumber(cleanCode, /\bexport\s+default\s+function\b/);
    erros.push(
      formatError(
        "GLOBAL-EXPORT-DEFAULT-FUNCTION",
        rel,
        line,
        "Uso de 'export default function' é proibido.",
        "Declare 'const Nome = () => { ... };' e use 'export default Nome;' na última linha.",
        "docs/harness/02-convencoes-de-codigo.md"
      )
    );
  }

  // Regras específicas para arquivos .tsx
  if (ext === ".tsx") {
    if (/\binterface\s+\w*Props\b/.test(cleanCode)) {
      const line = findLineNumber(cleanCode, /\binterface\s+\w*Props\b/);
      erros.push(
        formatError(
          "TSX-INTERFACE-PROPS",
          rel,
          line,
          "Props de componente declaradas com 'interface'.",
          "Use 'export type NomeProps = { ... };' para tipar props.",
          "AGENTS.md (Regra 12)"
        )
      );
    }

    if (/\bfunction\s+[A-Z]\w*\s*\(/.test(cleanCode)) {
      const line = findLineNumber(cleanCode, /\bfunction\s+[A-Z]\w*\s*\(/);
      erros.push(
        formatError(
          "TSX-FUNCTION-COMPONENTE",
          rel,
          line,
          "Componente React declarado com 'function Nome()'.",
          "Declare o componente como 'const Nome = (...) => { ... };'.",
          "AGENTS.md (Regra 12)"
        )
      );
    }
  }

  // Regra de cores literais fora de src/view/theme.ts
  if (rel !== "src/view/theme.ts") {
    const colorLiteralRegex =
      /["']#[0-9A-Fa-f]{3,8}["']|["']rgba?\s*\([^"']+["']/;
    if (colorLiteralRegex.test(cleanCode)) {
      const line = findLineNumber(cleanCode, colorLiteralRegex);
      erros.push(
        formatError(
          "ESTILO-COR-LITERAL",
          rel,
          line,
          "Cor literal (#hex ou rgb/rgba) encontrada fora de src/view/theme.ts.",
          "Importe e utilize apenas tokens semânticos ou de componente de '@/view/theme'.",
          "AGENTS.md (Regra 10) e docs/harness/04-views-e-design-system.md"
        )
      );
    }
  } else {
    // Em src/view/theme.ts: primitive não pode ser exportado
    if (/\bexport\s+const\s+primitive\b/.test(cleanCode)) {
      const line = findLineNumber(cleanCode, /\bexport\s+const\s+primitive\b/);
      erros.push(
        formatError(
          "TEMA-PRIMITIVO-EXPORTADO",
          rel,
          line,
          "O objeto 'primitive' não pode ser exportado por src/view/theme.ts.",
          "Mantenha 'const primitive = ...' interno ao theme.ts e exporte apenas tokens semânticos e de componente.",
          "docs/harness/04-views-e-design-system.md"
        )
      );
    }
  }

  // Isolamento de @/infra: apenas src/di/container.ts pode importar @/infra
  if (rel !== "src/di/container.ts") {
    for (const imp of imports) {
      if (imp.source.startsWith("@/infra/") || imp.source === "@/infra") {
        erros.push(
          formatError(
            "DI-ISOLAMENTO-INFRA",
            rel,
            imp.line,
            `Importação direta da infraestrutura ("${imp.source}") fora do container.`,
            "Somente 'src/di/container.ts' pode importar de '@/infra/*'.",
            "AGENTS.md (Regra 9)"
          )
        );
      }
    }
  }

  // Regras por camada
  if (rel.startsWith("src/app/")) {
    const subPath = rel.slice("src/app/".length);
    if (fileName === "_layout.tsx") {
      for (const imp of imports) {
        if (
          imp.source.startsWith("@/model") ||
          imp.source.startsWith("@/usecase") ||
          imp.source.startsWith("@/infra") ||
          imp.source.startsWith("@/di")
        ) {
          erros.push(
            formatError(
              "LAYOUT-IMPORT-PROIBIDO",
              rel,
              imp.line,
              `_layout.tsx não pode importar "${imp.source}".`,
              "O _layout.tsx só pode importar expo-router, @/view/theme e @/viewmodel/*.",
              "AGENTS.md (Seção 4)"
            )
          );
        }
      }
    } else {
      const expectedImport = `@/view/${subPath.replace(/\.tsx$/, "")}`;
      const nonEmptyLines = cleanCode
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const hasOnlyMirrorImport =
        imports.length === 1 && imports[0].source === expectedImport;
      const hasExportDefault = nonEmptyLines.some((l) =>
        /^export\s+default\s+\w+;?$/.test(l)
      );
      const hasJsx = /<[A-Za-z]/.test(cleanCode);

      if (
        !hasOnlyMirrorImport ||
        !hasExportDefault ||
        hasJsx ||
        nonEmptyLines.length > 3
      ) {
        erros.push(
          formatError(
            "APP-ROTA-FINA",
            rel,
            1,
            `O arquivo de rota deve ser uma rota fina reexportando "${expectedImport}".`,
            `Deixe apenas:\n  import Tela from "${expectedImport}";\n  export default Tela;`,
            "AGENTS.md (Regra 1) e docs/harness/01-arquitetura-mvvm.md"
          )
        );
      }
    }
  } else if (rel.startsWith("src/view/")) {
    const isComponent = rel.startsWith("src/view/components/");
    const isTheme = rel === "src/view/theme.ts";

    for (const imp of imports) {
      if (imp.source === "expo-router" || imp.source.startsWith("expo-router/")) {
        erros.push(
          formatError(
            "VIEW-NAVEGACAO",
            rel,
            imp.line,
            "A camada View importa 'expo-router'.",
            "Mova toda a navegação para a ViewModel e exponha uma ação (actions.handle...).",
            "AGENTS.md (Regras 3 e 4)"
          )
        );
      }
      if (
        imp.source.startsWith("@/usecase") ||
        imp.source.startsWith("@/infra") ||
        imp.source.startsWith("@/di")
      ) {
        erros.push(
          formatError(
            "VIEW-CAMADA-PROIBIDA",
            rel,
            imp.line,
            `A View não pode importar "${imp.source}".`,
            "A View só se comunica com a sua ViewModel.",
            "AGENTS.md (Seção 4)"
          )
        );
      }
      if (imp.source.startsWith("@/model")) {
        if (!imp.isTypeOnly || !imp.source.startsWith("@/model/entities/")) {
          erros.push(
            formatError(
              "VIEW-MODEL-IMPORT",
              rel,
              imp.line,
              `A View só pode fazer 'import type' de '@/model/entities/*' (encontrado: "${imp.source}").`,
              "Use 'import type { ... } from \"@/model/entities/...\"'.",
              "AGENTS.md (Seção 4)"
            )
          );
        }
      }
      if (isComponent && imp.source.startsWith("@/viewmodel")) {
        erros.push(
          formatError(
            "COMPONENTE-SEM-VIEWMODEL",
            rel,
            imp.line,
            "Componentes em src/view/components/ não podem importar ViewModels.",
            "Passe todos os dados e callbacks via props.",
            "AGENTS.md (Seção 4) e docs/harness/04-views-e-design-system.md"
          )
        );
      }
    }

    if (/\btry\s*\{|\bcatch\s*\(|\bfetch\s*\(/.test(cleanCode)) {
      const line = findLineNumber(cleanCode, /\btry\s*\{|\bcatch\s*\(|\bfetch\s*\(/);
      erros.push(
        formatError(
          "VIEW-LOGICA-PROIBIDA",
          rel,
          line,
          "A View contém bloco try/catch ou chamada fetch().",
          "Mova o tratamento de erros para a ViewModel e buscas de dados para um DataSource/UseCase.",
          "AGENTS.md (Regra 3)"
        )
      );
    }

    if (isComponent) {
      if (/\bexport\s+default\b/.test(cleanCode)) {
        const line = findLineNumber(cleanCode, /\bexport\s+default\b/);
        erros.push(
          formatError(
            "COMPONENTE-EXPORT-NOMEADO",
            rel,
            line,
            "Componentes auxiliares em src/view/components/ não devem usar export default.",
            "Use export nomeado: 'export const Nome = ...'.",
            "docs/harness/02-convencoes-de-codigo.md"
          )
        );
      }
    } else if (!isTheme) {
      // É uma tela espelhada em src/view/
      if (!/const\s+\[\s*state\s*,\s*actions\s*\]\s*=\s*use\w+ViewModel\s*\(/.test(cleanCode)) {
        erros.push(
          formatError(
            "VIEW-SEM-VIEWMODEL",
            rel,
            1,
            "A tela não consome sua ViewModel no formato 'const [state, actions] = useXViewModel()'.",
            "Importe a ViewModel correspondente e desestruture 'const [state, actions] = useXViewModel();'.",
            "AGENTS.md (Regra 5) e docs/harness/01-arquitetura-mvvm.md"
          )
        );
      }
      if (!/export\s+default\s+[A-Z]\w*\s*;?\s*$/.test(cleanCode.trim())) {
        erros.push(
          formatError(
            "VIEW-EXPORT-DEFAULT-FIM",
            rel,
            1,
            "A tela deve terminar com 'export default NomeDaTela;'.",
            "Adicione 'export default NomeDaTela;' na última linha do arquivo.",
            "docs/harness/02-convencoes-de-codigo.md"
          )
        );
      }
    }
  } else if (rel.startsWith("src/viewmodel/")) {
    if (!/^use[A-Z]\w*ViewModel\.ts$/.test(fileName)) {
      erros.push(
        formatError(
          "VIEWMODEL-NOME-ARQUIVO",
          rel,
          1,
          `Nome ou extensão inválida para ViewModel: "${fileName}".`,
          "Nomeie como 'use<Nome>ViewModel.ts' (extensão .ts, sem JSX).",
          "AGENTS.md (Regra 5)"
        )
      );
    }

    for (const imp of imports) {
      if (
        imp.source === "react-native" ||
        imp.source.startsWith("@/view") ||
        imp.source.startsWith("@/infra")
      ) {
        erros.push(
          formatError(
            "VIEWMODEL-IMPORT-PROIBIDO",
            rel,
            imp.line,
            `A ViewModel não pode importar "${imp.source}".`,
            "A ViewModel só importa react, expo-router, @/usecase/i*, @/di/container e @/model/*.",
            "AGENTS.md (Seção 4)"
          )
        );
      }
      if (
        imp.source.startsWith("@/usecase/") &&
        !/^@\/usecase\/i[A-Z]/.test(imp.source)
      ) {
        erros.push(
          formatError(
            "VIEWMODEL-IMPORT-USECASE-CONCRETO",
            rel,
            imp.line,
            `A ViewModel importou uma classe concreta de Use Case ("${imp.source}").`,
            "Importe apenas a interface '@/usecase/i...UseCases' e receba a instância padrão de '@/di/container'.",
            "AGENTS.md (Regra 5 e Seção 4)"
          )
        );
      }
    }

    const hasStateType = /export\s+type\s+\w+State\s*=/.test(cleanCode);
    const hasActionsType = /export\s+type\s+\w+Actions\s*=/.test(cleanCode);
    const hasTupleReturn =
      /export\s+function\s+use\w+ViewModel\s*\([\s\S]*?\)\s*:\s*\[\s*\w+State\s*,\s*\w+Actions\s*\]/.test(
        cleanCode
      );

    if (!hasStateType || !hasActionsType || !hasTupleReturn) {
      erros.push(
        formatError(
          "VIEWMODEL-CONTRATO",
          rel,
          1,
          "A ViewModel deve exportar 'type XState', 'type XActions' e retornar a tupla '[XState, XActions]'.",
          "Siga a assinatura: export function useXViewModel(uc: IXUseCases = defaultUC): [XState, XActions].",
          "AGENTS.md (Regra 5) e docs/harness/01-arquitetura-mvvm.md"
        )
      );
    }
  } else if (rel.startsWith("src/usecase/")) {
    for (const imp of imports) {
      if (!imp.source.startsWith("@/model") && !imp.source.startsWith("@/usecase")) {
        erros.push(
          formatError(
            "USECASE-IMPORT-PROIBIDO",
            rel,
            imp.line,
            `Use Case não pode importar "${imp.source}".`,
            "Use Cases dependem apenas de '@/model/*' e '@/usecase/*'.",
            "AGENTS.md (Seção 4)"
          )
        );
      }
    }

    if (/^i[A-Z]\w*UseCases\.ts$/.test(fileName)) {
      if (!/export\s+interface\s+I[A-Z]\w*UseCases\b/.test(cleanCode)) {
        erros.push(
          formatError(
            "USECASE-INTERFACE",
            rel,
            1,
            "Arquivo de contrato de Use Case deve declarar 'export interface I...UseCases'.",
            "Declare o contrato com 'export interface I...UseCases { ... }'.",
            "docs/harness/01-arquitetura-mvvm.md"
          )
        );
      }
    } else {
      if (!/export\s+class\s+\w+UseCases\s+implements\s+I\w+UseCases\b/.test(cleanCode)) {
        erros.push(
          formatError(
            "USECASE-IMPLEMENTS",
            rel,
            1,
            "A classe de Use Case deve implementar sua interface 'implements I...UseCases'.",
            "Use 'export class XUseCases implements IXUseCases'.",
            "docs/harness/01-arquitetura-mvvm.md"
          )
        );
      }
      if (/\bnew\s+\w+(?:Service|DataSource)\s*\(/.test(cleanCode)) {
        const line = findLineNumber(cleanCode, /\bnew\s+\w+(?:Service|DataSource)\s*\(/);
        erros.push(
          formatError(
            "USECASE-NEW-DEPENDENCIA",
            rel,
            line,
            "O Use Case instancia um Service ou DataSource diretamente com 'new'.",
            "Receba os contratos (IService / IDataSource) pelo construtor.",
            "AGENTS.md (Regra 6)"
          )
        );
      }
    }
  } else if (rel.startsWith("src/model/")) {
    for (const imp of imports) {
      if (!imp.source.startsWith("@/model")) {
        erros.push(
          formatError(
            "MODEL-DOMINIO-PURO",
            rel,
            imp.line,
            `A camada de domínio (model/) importou "${imp.source}".`,
            "O domínio deve ser 100% puro e só pode importar arquivos de '@/model/*'.",
            "AGENTS.md (Regra 7)"
          )
        );
      }
    }

    if (rel.startsWith("src/model/entities/")) {
      if (/\bclass\s+\w+|\binterface\s+\w+/.test(cleanCode)) {
        const line = findLineNumber(cleanCode, /\bclass\s+\w+|\binterface\s+\w+/);
        erros.push(
          formatError(
            "MODEL-ENTIDADE-TYPE",
            rel,
            line,
            "Entidades no domínio não podem usar 'class' nem 'interface'.",
            "Declare entidades exclusivamente com 'export type Nome = { ... };'.",
            "AGENTS.md (Regra 7)"
          )
        );
      }
    } else if (
      rel.startsWith("src/model/datasources/") ||
      rel.startsWith("src/model/services/")
    ) {
      if (!/^i[A-Z]\w*(?:DataSource|Service)\.ts$/.test(fileName)) {
        erros.push(
          formatError(
            "MODEL-NOME-CONTRATO",
            rel,
            1,
            `O arquivo de contrato "${fileName}" deve começar com prefixo 'i' minúsculo.`,
            "Renomeie para 'i<Nome>DataSource.ts' ou 'i<Nome>Service.ts'.",
            "docs/harness/02-convencoes-de-codigo.md"
          )
        );
      }
      if (!/export\s+interface\s+I[A-Z]\w*(?:DataSource|Service)\b/.test(cleanCode)) {
        erros.push(
          formatError(
            "MODEL-CONTRATO-INTERFACE",
            rel,
            1,
            "Contratos em model/datasources e model/services devem usar 'export interface I...'.",
            "Declare o contrato com 'export interface I...DataSource' ou 'export interface I...Service'.",
            "AGENTS.md (Regra 7)"
          )
        );
      }
    }
  } else if (rel.startsWith("src/infra/")) {
    for (const imp of imports) {
      if (
        imp.source.startsWith("@/usecase") ||
        imp.source.startsWith("@/viewmodel") ||
        imp.source.startsWith("@/view") ||
        imp.source.startsWith("@/di") ||
        imp.source === "expo-router"
      ) {
        erros.push(
          formatError(
            "INFRA-IMPORT-PROIBIDO",
            rel,
            imp.line,
            `A infraestrutura não pode importar "${imp.source}".`,
            "A infra só conhece '@/model/*' e bibliotecas de tecnologia.",
            "AGENTS.md (Seção 4)"
          )
        );
      }
    }

    if (!/export\s+class\s+\w+\s+implements\s+I[A-Z]\w*/.test(cleanCode)) {
      erros.push(
        formatError(
          "INFRA-IMPLEMENTS",
          rel,
          1,
          "Toda classe na camada de infraestrutura deve implementar um contrato do domínio ('implements I...').",
          "Adicione 'implements I...DataSource' ou 'implements I...Service' na declaração da classe.",
          "AGENTS.md (Regra 8)"
        )
      );
    }
  } else if (rel.startsWith("src/di/")) {
    for (const imp of imports) {
      if (
        imp.source.startsWith("@/view") ||
        imp.source.startsWith("@/viewmodel") ||
        imp.source.startsWith("@/app")
      ) {
        erros.push(
          formatError(
            "DI-IMPORT-PROIBIDO",
            rel,
            imp.line,
            `O container DI não pode importar "${imp.source}".`,
            "O container conecta apenas '@/infra/*' e '@/usecase/*'.",
            "AGENTS.md (Seção 4)"
          )
        );
      }
    }
  }

  return erros;
}

function checkProjectStructure() {
  const erros = [];

  if (!fs.existsSync(path.join(ROOT, "design-system", "02-tokens.md"))) {
    erros.push(
      formatError(
        "ESTRUTURA-DESIGN-SYSTEM",
        "design-system/02-tokens.md",
        1,
        "Arquivo de tokens do sistema de design não encontrado.",
        "Mantenha o kit de IHC na pasta 'design-system/'.",
        "AGENTS.md (Seção 1)"
      )
    );
  } else {
    const tokensMd = fs.readFileSync(
      path.join(ROOT, "design-system", "02-tokens.md"),
      "utf8"
    );
    if (/\bTODO\b/.test(tokensMd)) {
      erros.push(
        formatError(
          "DESIGN-SYSTEM-TODO",
          "design-system/02-tokens.md",
          1,
          "Existem marcadores 'TODO' pendentes em design-system/02-tokens.md.",
          "Defina todos os tokens no sistema de design antes de gerar o tema.",
          "docs/harness/04-views-e-design-system.md"
        )
      );
    }
  }

  if (!fs.existsSync(SRC_DIR)) {
    erros.push(
      formatError(
        "ESTRUTURA-SRC",
        "src",
        1,
        "A pasta 'src/' não existe.",
        "Crie a estrutura canônica dentro de 'src/'.",
        "AGENTS.md (Seção 2)"
      )
    );
    return erros;
  }

  // Verificar pastas permitidas em src/
  for (const entry of fs.readdirSync(SRC_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ALLOWED_SRC_DIRS.has(entry.name)) {
        erros.push(
          formatError(
            "ESTRUTURA-PASTA-PROIBIDA",
            `src/${entry.name}`,
            1,
            `A pasta "src/${entry.name}" não faz parte da arquitetura MVVM Sofisticado.`,
            `Mantenha em src/ apenas: ${Array.from(ALLOWED_SRC_DIRS).join(", ")}.`,
            "AGENTS.md (Seção 2)"
          )
        );
      }
    } else {
      erros.push(
        formatError(
          "ESTRUTURA-ARQUIVO-SOLTO-SRC",
          `src/${entry.name}`,
          1,
          `Arquivo solto na raiz de src/: "${entry.name}".`,
          "Posicione cada arquivo dentro de sua camada correspondente em src/.",
          "AGENTS.md (Seção 2)"
        )
      );
    }
  }

  for (const requiredDir of ALLOWED_SRC_DIRS) {
    const fullDir = path.join(SRC_DIR, requiredDir);
    if (!fs.existsSync(fullDir)) {
      erros.push(
        formatError(
          "ESTRUTURA-PASTA-FALTANDO",
          `src/${requiredDir}`,
          1,
          `A pasta obrigatória "src/${requiredDir}" não foi encontrada.`,
          `Crie a pasta "src/${requiredDir}" conforme a árvore do AGENTS.md.`,
          "AGENTS.md (Seção 2)"
        )
      );
    }
  }

  const allCodeFiles = listFilesRecursive(SRC_DIR);

  if (
    allCodeFiles.length > 0 &&
    !fs.existsSync(path.join(SRC_DIR, "view", "theme.ts"))
  ) {
    erros.push(
      formatError(
        "ESTRUTURA-TEMA-FALTANDO",
        "src/view/theme.ts",
        1,
        "Arquivo 'src/view/theme.ts' não encontrado.",
        "Execute a receita '/sincronizar-tema' para gerar 'src/view/theme.ts'.",
        "docs/harness/04-views-e-design-system.md"
      )
    );
  }

  if (
    allCodeFiles.length > 0 &&
    !fs.existsSync(path.join(SRC_DIR, "di", "container.ts"))
  ) {
    erros.push(
      formatError(
        "ESTRUTURA-CONTAINER-FALTANDO",
        "src/di/container.ts",
        1,
        "Arquivo 'src/di/container.ts' não encontrado.",
        "Crie 'src/di/container.ts' para concentrar a injeção de dependências.",
        "AGENTS.md (Seção 2)"
      )
    );
  }

  // Verificar espelhamento 1:1 entre src/app/ e src/view/
  const appDir = path.join(SRC_DIR, "app");
  const viewDir = path.join(SRC_DIR, "view");
  if (fs.existsSync(appDir) && fs.existsSync(viewDir)) {
    const appFiles = listFilesRecursive(appDir)
      .map((f) => toPosix(path.relative(appDir, f)))
      .filter((f) => path.basename(f) !== "_layout.tsx");

    const viewScreens = listFilesRecursive(viewDir)
      .map((f) => toPosix(path.relative(viewDir, f)))
      .filter((f) => f !== "theme.ts" && !f.startsWith("components/"));

    const appSet = new Set(appFiles);
    const viewSet = new Set(viewScreens);

    for (const routeFile of appSet) {
      if (!viewSet.has(routeFile)) {
        erros.push(
          formatError(
            "ESPELHO-SEM-TELA",
            `src/app/${routeFile}`,
            1,
            `A rota "src/app/${routeFile}" não possui tela espelhada em "src/view/${routeFile}".`,
            `Crie a tela correspondente em "src/view/${routeFile}".`,
            "AGENTS.md (Regra 2)"
          )
        );
      }
    }

    for (const screenFile of viewSet) {
      if (!appSet.has(screenFile)) {
        erros.push(
          formatError(
            "ESPELHO-SEM-ROTA",
            `src/view/${screenFile}`,
            1,
            `A tela "src/view/${screenFile}" não possui rota fina espelhada em "src/app/${screenFile}".`,
            `Crie a rota fina em "src/app/${screenFile}" ou mova componentes auxiliares para "src/view/components/".`,
            "AGENTS.md (Regra 2)"
          )
        );
      }
    }
  }

  return erros;
}

function runFullCheck() {
  const erros = [...checkProjectStructure()];
  const allSrcFiles = listFilesRecursive(SRC_DIR);
  for (const f of allSrcFiles) {
    erros.push(...checkFileRules(f));
  }
  return erros;
}

function readStdinJson() {
  try {
    const input = fs.readFileSync(0, "utf8").trim();
    if (!input) return null;
    return JSON.parse(input);
  } catch {
    return null;
  }
}

const args = process.argv.slice(2);

if (args.includes("--hook")) {
  const payload = readStdinJson();
  const targetFile = payload?.tool_input?.file_path;
  if (!targetFile) {
    process.exit(0);
  }
  const absTarget = path.isAbsolute(targetFile)
    ? targetFile
    : path.join(ROOT, targetFile);
  const erros = checkFileRules(absTarget);
  if (erros.length > 0) {
    console.error(erros.join("\n\n"));
    process.exit(2);
  }
  process.exit(0);
} else if (args.includes("--stop")) {
  const payload = readStdinJson();
  if (payload?.stop_hook_active) {
    process.exit(0);
  }
  const erros = runFullCheck();
  if (erros.length > 0) {
    console.error(erros.join("\n\n"));
    process.exit(2);
  }
  const tsc = spawnSync("npx", ["tsc", "--noEmit"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
  });
  if (tsc.status !== 0) {
    console.error(tsc.stdout || tsc.stderr || "Erro na checagem de tipos (tsc).");
    process.exit(2);
  }
  process.exit(0);
} else {
  const erros = runFullCheck();
  if (erros.length > 0) {
    console.log(erros.join("\n\n"));
    process.exit(1);
  }
  console.log("Arquitetura OK — 0 violações encontradas pelo Harness MVVM Sofisticado.");
  process.exit(0);
}
