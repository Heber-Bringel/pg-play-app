// Bloqueia a publicação do site (site/) enquanto houver conteúdo pendente.
// A Política de Privacidade não pode ir para a Google Play sem um contato real
// (spec 027, issue #82). Roda antes do deploy: `npm run site:deploy`.
import fs from "node:fs";
import path from "node:path";

const SITE_DIR = path.join(process.cwd(), "site");
const PENDING_PATTERNS = [/\[E-MAIL DE CONTATO\]/g, /class="pending"/g];

const htmlFiles = fs
  .readdirSync(SITE_DIR)
  .filter((name) => name.endsWith(".html"))
  .sort();

const problems = [];

for (const name of htmlFiles) {
  const lines = fs.readFileSync(path.join(SITE_DIR, name), "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (PENDING_PATTERNS.some((pattern) => line.match(pattern))) {
      problems.push(`site/${name}:${index + 1}  ${line.trim()}`);
    }
  });
}

if (problems.length > 0) {
  console.error("[BLOQUEADO] O site tem conteúdo pendente e não pode ser publicado:\n");
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  console.error(
    "\nComo corrigir: troque o marcador pelo e-mail definitivo e remova o <span class=\"pending\">." +
      "\nReferência: specs/027-site-politica-privacidade/tasks.md (T011)"
  );
  process.exit(1);
}

console.log(`Site OK — ${htmlFiles.length} página(s) prontas para publicar.`);
