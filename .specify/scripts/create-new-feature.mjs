#!/usr/bin/env node
/**
 * GitHub Spec Kit — Inicializador de Nova Especificação de Funcionalidade (PG PLAY)
 *
 * Cria automaticamente a pasta `specs/NNN-<slug>/` contendo:
 *   - spec.md   (a partir de .specify/templates/spec-template.md)
 *   - plan.md   (a partir de .specify/templates/plan-template.md)
 *   - tasks.md  (a partir de .specify/templates/tasks-template.md)
 *
 * Uso:
 *   npm run spec:new -- uc01-hub-jogos
 *   node .specify/scripts/create-new-feature.mjs uc02-gestao-equipes
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SPECS_DIR = path.join(ROOT, 'specs');
const TEMPLATES_DIR = path.join(ROOT, '.specify', 'templates');

function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getNextSpecNumber() {
  if (!fs.existsSync(SPECS_DIR)) return '001';
  const entries = fs.readdirSync(SPECS_DIR, { withFileTypes: true });
  let maxNum = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const match = entry.name.match(/^(\d{3})-/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  return String(maxNum + 1).padStart(3, '0');
}

function renderTemplate(templateFile, replacements) {
  const fullPath = path.join(TEMPLATES_DIR, templateFile);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.split(placeholder).join(value);
  }
  return content;
}

function main() {
  const rawArg = process.argv.slice(2).join(' ').trim();
  if (!rawArg) {
    console.error(
      'Uso: npm run spec:new -- <slug-ou-nome-da-feature>\nExemplo: npm run spec:new -- uc01-hub-jogos'
    );
    process.exit(1);
  }

  const cleanSlug = slugify(rawArg.replace(/^\d{3}-/, ''));
  const explicitPrefix = rawArg.match(/^(\d{3})-/);
  const numberPrefix = explicitPrefix ? explicitPrefix[1] : getNextSpecNumber();
  const folderName = `${numberPrefix}-${cleanSlug}`;
  const targetDir = path.join(SPECS_DIR, folderName);

  if (fs.existsSync(targetDir)) {
    console.error(`A pasta de especificação já existe: specs/${folderName}`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const replacements = {
    '[NOME DA FUNCIONALIDADE]': rawArg,
    '[NNN-slug-da-feature]': folderName,
    '[DATA]': today,
  };

  fs.writeFileSync(
    path.join(targetDir, 'spec.md'),
    renderTemplate('spec-template.md', replacements),
    'utf8'
  );
  fs.writeFileSync(
    path.join(targetDir, 'plan.md'),
    renderTemplate('plan-template.md', replacements),
    'utf8'
  );
  fs.writeFileSync(
    path.join(targetDir, 'tasks.md'),
    renderTemplate('tasks-template.md', replacements),
    'utf8'
  );

  console.log(`✅ Workspace Spec Kit criado em: specs/${folderName}/`);
  console.log(`   ├── spec.md   (1. Defina O QUE e POR QUE construir)`);
  console.log(`   ├── plan.md   (2. Mapeie as 7 camadas do MVVM e tokens do Design System)`);
  console.log(`   └── tasks.md  (3. Quebre em tarefas de dentro para fora antes de codar)`);
  console.log(`\nPróximo passo recomendado: crie a branch 'git checkout -b feat/${folderName}'`);
}

main();
