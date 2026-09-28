import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
const playwrightCli = path.join(root, "node_modules", "@playwright", "test", "cli.js");
const server = spawn(process.execPath, [viteBin, "preview", "--configLoader", "runner", "--host", "127.0.0.1", "--strictPort"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  windowsHide: true,
});

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = waitForExit(child);
  child.kill("SIGTERM");
  if (await Promise.race([exited.then(() => true), delay(3_000).then(() => false)])) return;
  child.kill("SIGKILL");
  await Promise.race([exited, delay(1_000)]);
}

async function waitForPreview() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Vite preview exited before becoming ready (code ${server.exitCode ?? server.signalCode}).`);
    }
    try {
      const response = await fetch("http://127.0.0.1:4173", { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // Retry while Vite starts.
    }
    await delay(250);
  }
  throw new Error("Vite preview did not become ready within 30 seconds.");
}

function runPlaywright() {
  return new Promise((resolve, reject) => {
    const runner = spawn(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    });
    runner.once("error", reject);
    runner.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

let result = 1;
try {
  await waitForPreview();
  result = await runPlaywright();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
} finally {
  await stopServer(server);
}

process.exitCode = result;
