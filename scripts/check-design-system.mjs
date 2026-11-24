#!/usr/bin/env node
/**
 * Verificador do Design System PG Play Expressive (issue #75, spec 025).
 *
 * Lê os .tsx de src/view/ com o parser do TypeScript e aplica as regras:
 *   DS-USE-THEME          (erro)  estilos devem vir de useTheme(), sem tokens estáticos
 *   DS-ALVO-TOQUE         (erro)  Pressable/Touchable* com minHeight ou height (48 dp)
 *   DS-ACESSIBILIDADE     (erro)  Pressable/Touchable* com papel e rótulo acessíveis
 *   DS-NUMERO-MAGICO      (erro)  sem números literais em estilos (use tokens)
 *   DS-COMPONENTE-PADRAO  (aviso) Pressable/Touchable* fora de src/view/components/
 *
 * Exceção justificada (motivo obrigatório), na linha anterior:
 *   // ds-ignore-next-line DS-REGRA: motivo
 *
 * Uso:
 *   node scripts/check-design-system.mjs               # projeto inteiro
 *   node scripts/check-design-system.mjs --files a.tsx b.tsx
 *   node scripts/check-design-system.mjs --staged      # conteúdo preparado (pre-commit)
 *   node scripts/check-design-system.mjs --root <dir>  # outra raiz (testes)
 *   node scripts/check-design-system.mjs --tempo       # mostra o tempo gasto
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const START = performance.now();

// O parser do TypeScript (~130 ms para carregar) só é importado quando há
// arquivo de src/view/ para analisar; commits sem telas terminam na hora.
let ts;
const args = process.argv.slice(2);

function readOption(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function readList(name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const values = [];
  for (let i = index + 1; i < args.length && !args[i].startsWith("--"); i++) {
    values.push(args[i]);
  }
  return values;
}

const ROOT = path.resolve(readOption("--root") ?? process.cwd());
const VIEW_DIR = "src/view/";
const COMPONENTS_DIR = "src/view/components/";
const THEME_FILE = "src/view/theme.ts";

const PRESSABLE_TAGS = new Set([
  "Pressable",
  "TouchableOpacity",
  "TouchableHighlight",
  "TouchableWithoutFeedback",
]);

const MAGIC_NUMBER_PROPS = new Set([
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingHorizontal",
  "paddingVertical",
  "paddingStart",
  "paddingEnd",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginHorizontal",
  "marginVertical",
  "marginStart",
  "marginEnd",
  "gap",
  "rowGap",
  "columnGap",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "borderWidth",
  "borderTopWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "minHeight",
  "minWidth",
  "width",
  "height",
]);

const TOKEN_HINT = {
  padding: "space.*",
  margin: "space.*",
  gap: "space.*",
  rowGap: "space.*",
  columnGap: "space.*",
  border: "border.* ou radius.*",
  fontSize: "font.<estilo>.size",
  lineHeight: "font.<estilo>.lineHeight",
  letterSpacing: "font.<estilo>.letterSpacing",
  minHeight: "space['2xl'] (48 dp) ou component.<nome>.minHeight",
  minWidth: "space['2xl'] (48 dp) ou component.<nome>.minWidth",
  width: "space.* ou um valor relativo ('100%')",
  height: "space.* ou component.<nome>.minHeight",
};

// ---------------------------------------------------------------------------
// Coleta de arquivos
// ---------------------------------------------------------------------------

function toRel(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join("/");
}

function isViewTsx(rel) {
  return rel.startsWith(VIEW_DIR) && rel.endsWith(".tsx") && rel !== THEME_FILE;
}

function walk(dir, found) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
}

function git(gitArgs) {
  return spawnSync("git", gitArgs, { cwd: ROOT, encoding: "utf8" });
}

// Lê o conteúdo preparado de vários arquivos com um único processo do Git
// (git cat-file --batch), em vez de um "git show" por arquivo.
function readStagedContents(rels) {
  if (rels.length === 0) return [];
  const batch = spawnSync("git", ["cat-file", "--batch"], {
    cwd: ROOT,
    input: rels.map((rel) => `:${rel}`).join("\n") + "\n",
  });
  if (batch.status !== 0) {
    console.error("Não foi possível ler os arquivos preparados (git cat-file --batch).");
    process.exit(1);
  }
  const out = batch.stdout;
  const files = [];
  let offset = 0;
  for (const rel of rels) {
    const headerEnd = out.indexOf(0x0a, offset);
    const header = out.subarray(offset, headerEnd).toString("utf8");
    offset = headerEnd + 1;
    const size = Number(header.split(" ")[2]);
    if (header.endsWith("missing") || Number.isNaN(size)) continue;
    files.push({ rel, text: out.subarray(offset, offset + size).toString("utf8") });
    offset += size + 1; // conteúdo + quebra de linha final do batch
  }
  return files;
}

function collectFiles() {
  if (args.includes("--staged")) {
    const diff = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
    if (diff.status !== 0) {
      console.error("Não foi possível listar os arquivos preparados (git diff --cached).");
      process.exit(1);
    }
    const staged = diff.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((rel) => rel && isViewTsx(rel));
    return readStagedContents(staged);
  }

  const listed = readList("--files");
  const candidates = listed
    ? listed.map((file) => toRel(path.resolve(ROOT, file)))
    : walk(path.join(ROOT, "src", "view"), []).map(toRel);

  return candidates
    .filter((rel) => isViewTsx(rel) && fs.existsSync(path.join(ROOT, rel)))
    .map((rel) => ({ rel, text: fs.readFileSync(path.join(ROOT, rel), "utf8") }));
}

// ---------------------------------------------------------------------------
// Utilitários de AST
// ---------------------------------------------------------------------------

function propName(name) {
  if (!name) return null;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function magicValue(expr) {
  if (ts.isNumericLiteral(expr)) {
    return Number(expr.text) !== 0 ? expr.text : null;
  }
  if (
    ts.isPrefixUnaryExpression(expr) &&
    expr.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(expr.operand)
  ) {
    return Number(expr.operand.text) !== 0 ? `-${expr.operand.text}` : null;
  }
  return null;
}

function isStyleSheetCreate(node) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === "StyleSheet" &&
    node.expression.name.text === "create"
  );
}

function tagName(node) {
  const name = node.tagName;
  return ts.isIdentifier(name) ? name.text : null;
}

function jsxAttributes(node) {
  const found = new Map();
  let hasSpread = false;
  for (const attr of node.attributes.properties) {
    if (ts.isJsxSpreadAttribute(attr)) {
      hasSpread = true;
    } else if (ts.isJsxAttribute(attr)) {
      found.set(attr.name.getText(), attr);
    }
  }
  return { found, hasSpread };
}

// ---------------------------------------------------------------------------
// Exceções (// ds-ignore-next-line DS-REGRA: motivo)
// ---------------------------------------------------------------------------

function collectIgnores(text) {
  const ignores = new Map();
  const lines = text.split(/\r?\n/);
  const pattern = /\/\/\s*ds-ignore-next-line\s+(DS-[A-Z-]+)\s*:\s*(\S.*)$/;
  lines.forEach((line, index) => {
    const match = line.match(pattern);
    if (match) {
      const target = index + 2; // próxima linha, base 1
      if (!ignores.has(target)) ignores.set(target, new Set());
      ignores.get(target).add(match[1]);
    }
  });
  return ignores;
}

// ---------------------------------------------------------------------------
// Análise de um arquivo
// ---------------------------------------------------------------------------

function analyzeFile({ rel, text }) {
  const sourceFile = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const ignores = collectIgnores(text);
  const findings = [];

  const report = (severity, rule, line, problem, howToFix, reference) => {
    if (ignores.get(line)?.has(rule)) return;
    findings.push({ severity, rule, file: rel, line, problem, howToFix, reference });
  };

  // Objetos do StyleSheet.create: chave -> objeto de estilo
  const sheetEntries = new Map();
  const styleObjects = new Set();
  let usesStyles = false;
  let callsUseTheme = false;
  const pressables = [];
  const propNames = new Set();

  const collectBindingNames = (name) => {
    if (ts.isIdentifier(name)) {
      propNames.add(name.text);
    } else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) collectBindingNames(element.name);
      }
    }
  };

  const collectStyleObjects = (expr) => {
    if (!expr) return;
    if (ts.isObjectLiteralExpression(expr)) {
      styleObjects.add(expr);
      for (const prop of expr.properties) {
        if (ts.isPropertyAssignment(prop)) collectStyleObjects(prop.initializer);
      }
      return;
    }
    ts.forEachChild(expr, collectStyleObjects);
  };

  const visit = (node) => {
    if (ts.isParameter(node)) collectBindingNames(node.name);

    if (isStyleSheetCreate(node)) {
      usesStyles = true;
      const arg = node.arguments[0];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        for (const prop of arg.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isObjectLiteralExpression(prop.initializer)) {
            const key = propName(prop.name);
            if (key) sheetEntries.set(key, prop.initializer);
            styleObjects.add(prop.initializer);
          }
        }
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "useTheme"
    ) {
      callsUseTheme = true;
    }

    if (ts.isJsxAttribute(node) && node.name.getText() === "style") {
      usesStyles = true;
      const init = node.initializer;
      if (init && ts.isJsxExpression(init)) collectStyleObjects(init.expression);
    }

    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && PRESSABLE_TAGS.has(tagName(node))) {
      pressables.push(node);
    }

    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  // DS-USE-THEME — import estático de tokens
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === "@/view/theme" &&
      !statement.importClause?.isTypeOnly
    ) {
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          const imported = (element.propertyName ?? element.name).text;
          if (!element.isTypeOnly && (imported === "tokens" || imported === "darkTokens")) {
            report(
              "erro",
              "DS-USE-THEME",
              lineOf(sourceFile, element),
              `Importa "${imported}" estático de @/view/theme; ele não acompanha a troca entre tema claro e escuro.`,
              "Use 'const activeTokens = useTheme(themeMode)' e leia os tokens de activeTokens.",
              "design-system/02-tokens.md e Constituição, Artigo III"
            );
          }
        }
      }
    }
  }

  // DS-USE-THEME — arquivo com estilos sem useTheme()
  if (usesStyles && !callsUseTheme) {
    report(
      "erro",
      "DS-USE-THEME",
      1,
      "O arquivo monta estilos sem chamar useTheme().",
      "Obtenha os tokens com 'const activeTokens = useTheme(themeMode)' e crie os estilos com useMemo(() => createStyles(activeTokens), [activeTokens]).",
      "design-system/02-tokens.md e docs/harness/04-views-e-design-system.md"
    );
  }

  // DS-NUMERO-MAGICO
  for (const obj of styleObjects) {
    for (const prop of obj.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = propName(prop.name);
      if (!key || !MAGIC_NUMBER_PROPS.has(key)) continue;
      const value = magicValue(prop.initializer);
      if (value === null) continue;
      const hintKey = Object.keys(TOKEN_HINT).find((k) => key.startsWith(k)) ?? key;
      report(
        "erro",
        "DS-NUMERO-MAGICO",
        lineOf(sourceFile, prop),
        `Valor literal "${key}: ${value}" no estilo.`,
        `Use um token de @/view/theme: ${TOKEN_HINT[hintKey] ?? "space.*, radius.*, font.* ou border.*"}.`,
        "RNF10 e design-system/03-fundamentos.md (grade de 8 pontos)"
      );
    }
  }

  // Regras dos alvos interativos
  const isComponentFile = rel.startsWith(COMPONENTS_DIR);
  for (const node of pressables) {
    const name = tagName(node);
    const line = lineOf(sourceFile, node);
    const { found, hasSpread } = jsxAttributes(node);

    // DS-ACESSIBILIDADE
    if (!hasSpread) {
      const hasRole = found.has("accessibilityRole") || found.has("role");
      const hasLabel = found.has("accessibilityLabel") || found.has("aria-label");
      if (!hasRole || !hasLabel) {
        const missing = [!hasRole && "accessibilityRole", !hasLabel && "accessibilityLabel"]
          .filter(Boolean)
          .join(" e ");
        report(
          "erro",
          "DS-ACESSIBILIDADE",
          line,
          `<${name}> sem ${missing}; o leitor de tela não sabe o que este elemento faz.`,
          `Adicione ${missing} (ex.: accessibilityRole="button" accessibilityLabel="Começar partida").`,
          "RNF08 e design-system/06-acessibilidade.md"
        );
      }
    }

    // DS-ALVO-TOQUE
    const styleAttr = found.get("style");
    let touchResult;
    if (!styleAttr) {
      touchResult = hasSpread ? "unknown" : "fail";
    } else {
      const init = styleAttr.initializer;
      touchResult =
        init && ts.isJsxExpression(init)
          ? evaluateTouchTarget(init.expression, sheetEntries, propNames)
          : "unknown";
    }
    if (touchResult === "fail") {
      report(
        "erro",
        "DS-ALVO-TOQUE",
        line,
        `<${name}> sem minHeight ou height no estilo; não há garantia do alvo mínimo de 48 dp.`,
        "Declare minHeight com token (ex.: activeTokens.semantic.space['2xl'] = 48 dp, ou component.<nome>.minHeight).",
        "RNF07 e design-system/06-acessibilidade.md"
      );
    }

    // DS-COMPONENTE-PADRAO (aviso)
    if (!isComponentFile) {
      report(
        "aviso",
        "DS-COMPONENTE-PADRAO",
        line,
        `<${name}> usado direto na tela.`,
        "Prefira um componente do Design System (ExpressiveButton, ExpressiveChip, SelectableOptionItem, QuizOption, LetterKey) ou extraia este elemento para src/view/components/.",
        "docs/harness/04-views-e-design-system.md (seção 3)"
      );
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Alvo de toque: o estilo garante altura mínima?
//   "ok"      algum objeto declara minHeight/height ou cobre o pai
//   "unknown" o estilo vem de fora (prop, spread, chamada) e não dá para saber
//   "fail"    todos os objetos são conhecidos e nenhum garante a altura
// ---------------------------------------------------------------------------

function objectGuaranteesHeight(obj) {
  const keys = new Map();
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const key = propName(prop.name);
      if (key) keys.set(key, prop.initializer);
    } else if (ts.isSpreadAssignment(prop)) {
      const spread = prop.expression.getText();
      if (/StyleSheet\.absoluteFill(Object)?$/.test(spread)) return true;
    }
  }
  if (keys.has("minHeight") || keys.has("height")) return true;

  const position = keys.get("position");
  const fillsParent =
    position &&
    ts.isStringLiteral(position) &&
    position.text === "absolute" &&
    ["top", "bottom", "left", "right"].every((side) => {
      const value = keys.get(side);
      return value && ts.isNumericLiteral(value) && Number(value.text) === 0;
    });
  return Boolean(fillsParent);
}

function evaluateTouchTarget(expr, sheetEntries, propNames) {
  let sawUnknown = false;
  let sawOk = false;

  const inspect = (node) => {
    if (!node || sawOk) return;
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) {
      inspect(node.expression);
    } else if (ts.isObjectLiteralExpression(node)) {
      if (objectGuaranteesHeight(node)) sawOk = true;
    } else if (ts.isArrayLiteralExpression(node)) {
      node.elements.forEach((element) =>
        ts.isSpreadElement(element) ? (sawUnknown = true) : inspect(element)
      );
    } else if (ts.isConditionalExpression(node)) {
      inspect(node.whenTrue);
      inspect(node.whenFalse);
    } else if (ts.isBinaryExpression(node)) {
      inspect(node.left);
      inspect(node.right);
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      if (ts.isBlock(node.body)) {
        const returns = [];
        const findReturns = (child) => {
          if (ts.isReturnStatement(child)) returns.push(child.expression);
          else if (!ts.isFunctionLike(child)) ts.forEachChild(child, findReturns);
        };
        ts.forEachChild(node.body, findReturns);
        returns.forEach(inspect);
      } else {
        inspect(node.body);
      }
    } else if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      ts.isIdentifier(node.expression)
    ) {
      const key = ts.isPropertyAccessExpression(node)
        ? node.name.text
        : ts.isStringLiteral(node.argumentExpression)
          ? node.argumentExpression.text
          : null;
      const entry = key ? sheetEntries.get(key) : undefined;
      if (entry) {
        if (objectGuaranteesHeight(entry)) sawOk = true;
      } else if (/^StyleSheet\.absoluteFill(Object)?$/.test(node.getText())) {
        sawOk = true;
      } else {
        sawUnknown = true;
      }
    } else if (node.kind === ts.SyntaxKind.NullKeyword || node.kind === ts.SyntaxKind.FalseKeyword) {
      // style condicional desligado: não contribui
    } else if (ts.isIdentifier(node)) {
      // Estilo recebido por prop (ex.: style={style}) pode trazer a altura de fora.
      // Variáveis locais (ex.: focusRingStyle) não garantem altura e não contam.
      if (propNames.has(node.text)) sawUnknown = true;
    } else if (ts.isCallExpression(node)) {
      // Helpers locais (ex.: getFocusRingStyle(...)) não garantem altura.
    } else {
      sawUnknown = true;
    }
  };

  inspect(expr);
  if (sawOk) return "ok";
  return sawUnknown ? "unknown" : "fail";
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

function format(finding) {
  const tag = finding.severity === "erro" ? "[ERRO]" : "[AVISO]";
  return [
    `${tag} ${finding.rule} — ${finding.file}:${finding.line}`,
    `  Problema: ${finding.problem}`,
    `  Como corrigir: ${finding.howToFix}`,
    `  Referência: ${finding.reference}`,
  ].join("\n");
}

const files = collectFiles();
if (files.length === 0) {
  console.log("Design System OK — nenhum arquivo de src/view/ para analisar.");
  process.exit(0);
}
ts = (await import("typescript")).default;
const findings = files.flatMap(analyzeFile);
const errors = findings.filter((f) => f.severity === "erro");
const warnings = findings.filter((f) => f.severity === "aviso");
const elapsed = Math.round(performance.now() - START);
const timing = args.includes("--tempo") ? ` (${elapsed} ms)` : "";

if (warnings.length > 0) console.log(warnings.map(format).join("\n\n") + "\n");

if (errors.length > 0) {
  console.log(errors.map(format).join("\n\n"));
  console.log(
    `\nDesign System: ${errors.length} erro(s) e ${warnings.length} aviso(s) em ${files.length} arquivo(s)${timing}.`
  );
  process.exit(1);
}

console.log(
  `Design System OK — 0 erros e ${warnings.length} aviso(s) em ${files.length} arquivo(s)${timing}.`
);
process.exit(0);
