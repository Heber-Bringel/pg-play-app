#!/usr/bin/env node
/**
 * Instala os Git Hooks versionados em .githooks/ (issue #75, spec 025).
 * Roda sozinho no `npm install` (script "prepare" do package.json).
 *
 * Ignora em silêncio, sem falhar o npm install:
 *   - ambientes de build/CI (CI, VERCEL, EAS_BUILD);
 *   - pastas que não são um repositório Git (ex.: pacote baixado sem .git).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HOOKS_DIR = ".githooks";

const isBuildEnvironment = ["CI", "VERCEL", "EAS_BUILD"].some((name) => process.env[name]);
if (isBuildEnvironment) process.exit(0);

if (!fs.existsSync(path.join(ROOT, HOOKS_DIR))) process.exit(0);

const insideRepo = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
  cwd: ROOT,
  encoding: "utf8",
});
if (insideRepo.status !== 0 || insideRepo.stdout.trim() !== "true") process.exit(0);

const current = spawnSync("git", ["config", "--get", "core.hooksPath"], { cwd: ROOT, encoding: "utf8" });
if (current.stdout.trim() === HOOKS_DIR) process.exit(0);

const result = spawnSync("git", ["config", "core.hooksPath", HOOKS_DIR], { cwd: ROOT, encoding: "utf8" });
if (result.status === 0) {
  console.log(
    `Git Hooks instalados: core.hooksPath = ${HOOKS_DIR} (pre-commit: Design System; pre-push: arquitetura e Design System).`
  );
} else {
  console.warn("Não foi possível instalar os Git Hooks. Rode: git config core.hooksPath .githooks");
}
process.exit(0);
