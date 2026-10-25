/**
 * Bundles and runs the paper-specific data checks.
 *
 * The sources use extensionless TypeScript imports, which Node's type stripping cannot resolve,
 * so esbuild (already present as a Vite dependency) produces one temporary ESM file that Node runs.
 */
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = mkdtempSync(path.join(tmpdir(), "icarl-tests-"));
const outfile = path.join(outDir, "teaching-data.test.cjs");

try {
  await build({
    entryPoints: [path.join(root, "tests", "teaching-data.test.mts")],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node20",
    logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
