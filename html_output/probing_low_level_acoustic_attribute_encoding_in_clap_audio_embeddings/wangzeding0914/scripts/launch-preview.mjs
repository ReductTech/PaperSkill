import { execFileSync, spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { request } from 'node:http';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? process.execPath : 'npm';
const npmCli = process.platform === 'win32'
  ? resolve(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
  : null;
const npmCache = resolve(projectRoot, '.npm-cache');
const previewDir = resolve(tmpdir(), 'paperskill-preview', basename(projectRoot));
const startPort = 4173;
const maxPort = 4183;

function npmArgs(args) {
  return process.platform === 'win32' ? [npmCli, ...args] : args;
}

function run(command, args) {
  execFileSync(command, npmArgs(args), {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}

function canConnect(port) {
  return new Promise((resolveResult) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const finish = (available) => {
      socket.destroy();
      resolveResult(available);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(500, () => finish(false));
  });
}

function waitForHttp(port, timeoutMs = 10000) {
  const startedAt = Date.now();
  return new Promise((resolveResult, reject) => {
    const poll = () => {
      const req = request(
        { host: '127.0.0.1', port, path: '/', method: 'GET', timeout: 800 },
        (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) {
            resolveResult();
          } else if (Date.now() - startedAt > timeoutMs) {
            reject(new Error(`预览服务返回状态 ${res.statusCode ?? 'unknown'}`));
          } else {
            setTimeout(poll, 250);
          }
        },
      );
      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error('等待 Vite 预览服务超时。'));
        } else {
          setTimeout(poll, 250);
        }
      });
      req.end();
    };
    poll();
  });
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '', url], {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
    return;
  }
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(opener, [url], { detached: true, stdio: 'ignore' }).unref();
}

async function main() {
  console.log('PaperSkill 论文交互教程启动器');
  console.log(`项目目录: ${projectRoot}`);

  if (!existsSync(resolve(projectRoot, 'node_modules'))) {
    console.log('首次运行，正在安装依赖...');
    run(npmCommand, ['install', '--cache', npmCache, '--no-audit', '--no-fund']);
  }

  console.log('正在检查并构建项目...');
  if (existsSync(previewDir)) {
    rmSync(previewDir, { recursive: true, force: true });
  }
  mkdirSync(previewDir, { recursive: true });
  run(npmCommand, ['run', 'build', '--', '--outDir', previewDir]);

  let port = startPort;
  while (port <= maxPort && await canConnect(port)) port += 1;
  if (port > maxPort) {
    throw new Error(`端口 ${startPort}-${maxPort} 都已被占用，请关闭旧的预览服务后重试。`);
  }

  const preview = spawn(npmCommand, npmArgs(['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port), '--outDir', previewDir]), {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  preview.unref();

  await waitForHttp(port);
  const url = `http://127.0.0.1:${port}/`;
  console.log(`预览已启动: ${url}`);
  openBrowser(url);
}

main().catch((error) => {
  console.error(`启动失败: ${error.message}`);
  process.exitCode = 1;
});
