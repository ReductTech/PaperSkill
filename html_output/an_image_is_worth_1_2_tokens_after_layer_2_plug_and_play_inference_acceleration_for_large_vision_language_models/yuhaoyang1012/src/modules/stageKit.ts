import { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';

// ============================================================================
//  FastV 教程共享绘图工具：「夜间剧场」主题。
//  聚光灯 = 注意力；群演 = 图像 token；主角 = 系统提示（锚点）；落幕 = 剪枝。
//  所有 Hero / 类比动画 / 交互模块都复用这里的配色、画布循环和绘制原语。
// ============================================================================

export const C = {
  bg0: '#0b1222',
  bg1: '#16223c',
  floor: '#1d2c4a',
  line: 'rgba(160, 182, 220, 0.16)',
  sys: '#f5b942', // 系统提示 / 锚点（主角）
  img: '#5b9cf0', // 图像 token（群演）
  ins: '#b08cff', // 用户指令
  out: '#4fd1e0', // 输出 token
  good: '#3ccf8e', // 成功 / 本文方法
  bad: '#ef5d72', // 失败 / 旧方法
  emph: '#f59e5b', // 用户可调的强调值
  text: '#e8eef8',
  muted: '#8fa0bd',
  dim: '#3a4a68',
};

export const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
export const MONO = '"Cascadia Code", "SFMono-Regular", Consolas, monospace';

export type Ctx = CanvasRenderingContext2D;
export type DrawFn = (ctx: Ctx, t: number, dt: number) => void;

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Canvas 主循环：HiDPI 初始化、宽度自适应（保持比例）、离屏暂停。
 * draw 每帧从 ref 读取，因此 React 状态变化不会重启循环。
 */
export function useStage(W: number, H: number, draw: DrawFn) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<DrawFn>(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.maxWidth = W + 'px';
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = `${W} / ${H}`;
    let raf: number | null = null;
    let last = performance.now();
    const t0 = last;
    const still = reduceMotion();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = still ? 2.5 : (now - t0) / 1000;
      ctx.save();
      drawRef.current(ctx, t, dt);
      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H]);

  return canvasRef;
}

/** 指针坐标 -> 画布内在坐标（处理 CSS 缩放）。 */
export function toCanvas(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
  W: number,
  H: number
) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * W,
    y: ((e.clientY - r.top) / r.height) * H,
  };
}

/** 平滑追踪：让显示值以指数方式逼近目标值。 */
export function approach(cur: number, target: number, dt: number, speed = 8) {
  return lerp(cur, target, 1 - Math.exp(-speed * dt));
}

export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`;
}

/** 可复现的伪随机数（同一 seed 每次结果相同）。 */
export function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}

export function label(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  size = 14,
  color: string = C.text,
  align: CanvasTextAlign = 'left',
  weight = 600,
  mono = false
) {
  ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/** 剧场背景：深色渐变 + 舞台地面 + 暗角。 */
export function drawStage(ctx: Ctx, W: number, H: number, t = 0, floorY = 0.78) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.bg0);
  g.addColorStop(1, C.bg1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 舞台地面
  const fy = H * floorY;
  const fg = ctx.createLinearGradient(0, fy, 0, H);
  fg.addColorStop(0, 'rgba(60, 84, 130, 0.35)');
  fg.addColorStop(1, 'rgba(20, 30, 52, 0)');
  ctx.fillStyle = fg;
  ctx.fillRect(0, fy, W, H - fy);
  ctx.strokeStyle = 'rgba(150, 175, 220, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, fy);
  ctx.lineTo(W, fy);
  ctx.stroke();
  // 漂浮微尘（极淡，仅氛围）
  for (let i = 0; i < 26; i++) {
    const px = (rand(i) * W + t * (6 + rand(i + 9) * 8)) % W;
    const py = (rand(i + 3) * fy * 0.95 + Math.sin(t * 0.6 + i) * 4 + H) % H;
    ctx.fillStyle = `rgba(200, 215, 255, ${0.05 + rand(i + 5) * 0.08})`;
    ctx.fillRect(px, py, 1.6, 1.6);
  }
  // 暗角
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/** 柔光光斑（加色混合）。 */
export function glow(ctx: Ctx, x: number, y: number, r: number, color: string, a = 0.6) {
  if (r <= 0 || a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(0.45, rgba(color, a * 0.35));
  g.addColorStop(1, rgba(color, 0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 聚光灯光束：从灯头 (sx,sy) 打到地面椭圆 (tx,ty)。 */
export function beam(
  ctx: Ctx,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  rx: number,
  color = '#fff4d6',
  a = 0.5
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(sx, sy, tx, ty);
  g.addColorStop(0, rgba(color, a * 0.9));
  g.addColorStop(1, rgba(color, a * 0.12));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(sx - 4, sy);
  ctx.lineTo(tx - rx, ty);
  ctx.lineTo(tx + rx, ty);
  ctx.lineTo(sx + 4, sy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 地面光圈
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(tx, ty);
  ctx.scale(1, 0.28);
  const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 1.15);
  pg.addColorStop(0, rgba(color, a * 0.9));
  pg.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(0, 0, rx * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 灯头
  ctx.fillStyle = '#2b3956';
  rr(ctx, sx - 9, sy - 8, 18, 12, 3);
  ctx.fill();
  glow(ctx, sx, sy + 3, 10, color, 0.9);
}

/** 一个 token 方块：渐变填充 + 可选发光。 */
export function token(
  ctx: Ctx,
  x: number,
  y: number,
  s: number,
  color: string,
  a = 1,
  lit = 0
) {
  if (a <= 0.01) return;
  if (lit > 0.02) glow(ctx, x + s / 2, y + s / 2, s * (1.2 + lit * 1.6), color, 0.55 * lit * a);
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(x, y, x, y + s);
  g.addColorStop(0, rgba(color, 0.95));
  g.addColorStop(1, rgba(color, 0.6));
  ctx.fillStyle = g;
  rr(ctx, x, y, s, s, Math.max(1.5, s * 0.22));
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** 演员剪影（头 + 身体），lit 控制被聚光灯照亮的程度。 */
export function actor(
  ctx: Ctx,
  x: number,
  y: number,
  s: number,
  color: string,
  lit = 0,
  a = 1
) {
  if (a <= 0.01) return;
  if (lit > 0.02) glow(ctx, x, y - s * 1.1, s * (1.6 + lit * 1.4), color, 0.45 * lit * a);
  ctx.save();
  ctx.globalAlpha = a;
  const base = lit > 0 ? mix(C.dim, color, 0.35 + 0.65 * lit) : C.dim;
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(x, y - s * 1.55, s * 0.42, 0, Math.PI * 2);
  ctx.fill();
  rr(ctx, x - s * 0.5, y - s * 1.08, s, s * 1.08, s * 0.45);
  ctx.fill();
  ctx.restore();
}

export function mix(c1: string, c2: string, t: number) {
  const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const a = p(c1);
  const b = p(c2);
  const k = clamp(t, 0, 1);
  return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
}

/** 紧凑图例（最多 3 项）。 */
export function legend(ctx: Ctx, items: [string, string][], x: number, y: number) {
  let cx = x;
  for (const [color, name] of items.slice(0, 3)) {
    ctx.fillStyle = color;
    rr(ctx, cx, y - 5, 10, 10, 2.5);
    ctx.fill();
    label(ctx, name, cx + 15, y, 12, C.muted, 'left', 600);
    ctx.font = `600 12px ${FONT}`;
    cx += 15 + ctx.measureText(name).width + 18;
  }
}

/** 进度/数值条：圆角底槽 + 渐变填充。 */
export function bar(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string,
  track = 'rgba(255,255,255,0.07)'
) {
  ctx.fillStyle = track;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const fw = Math.max(0, Math.min(1, frac)) * w;
  if (fw < 1) return;
  const g = ctx.createLinearGradient(x, 0, x + fw, 0);
  g.addColorStop(0, rgba(color, 0.55));
  g.addColorStop(1, rgba(color, 1));
  ctx.fillStyle = g;
  rr(ctx, x, y, fw, h, h / 2);
  ctx.fill();
  glow(ctx, x + fw, y + h / 2, h * 1.6, color, 0.5);
}

// ---------------------------------------------------------------------------
//  程序生成的「示例图像」：夕阳、山脉、湖面和一只热气球。
//  用于展示 24×24 = 576 个图像 patch，以及（合成的）注意力分布。
// ---------------------------------------------------------------------------
export const GRID = 24; // LLaVA-1.5：336×336 输入，14 px patch -> 24×24 = 576 个 token

let sceneCache: HTMLCanvasElement | null = null;

export function sceneCanvas(): HTMLCanvasElement {
  if (sceneCache) return sceneCache;
  const S = 336;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  if (!g) return c;
  const sky = g.createLinearGradient(0, 0, 0, S * 0.62);
  sky.addColorStop(0, '#1b2a5c');
  sky.addColorStop(0.55, '#c0587a');
  sky.addColorStop(1, '#f6a05a');
  g.fillStyle = sky;
  g.fillRect(0, 0, S, S);
  // 太阳
  const sun = g.createRadialGradient(230, 190, 4, 230, 190, 70);
  sun.addColorStop(0, '#fff3c4');
  sun.addColorStop(0.35, '#ffd27a');
  sun.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = sun;
  g.beginPath();
  g.arc(230, 190, 70, 0, Math.PI * 2);
  g.fill();
  // 远山
  g.fillStyle = '#5b3b6e';
  g.beginPath();
  g.moveTo(0, 210);
  for (let x = 0; x <= S; x += 12) g.lineTo(x, 200 - Math.sin(x * 0.03) * 22 - Math.sin(x * 0.011 + 1) * 18);
  g.lineTo(S, S);
  g.lineTo(0, S);
  g.fill();
  // 近山
  g.fillStyle = '#2f2550';
  g.beginPath();
  g.moveTo(0, 232);
  for (let x = 0; x <= S; x += 10) g.lineTo(x, 228 - Math.abs(Math.sin(x * 0.02 + 0.4)) * 34);
  g.lineTo(S, S);
  g.lineTo(0, S);
  g.fill();
  // 湖面
  const lake = g.createLinearGradient(0, 240, 0, S);
  lake.addColorStop(0, '#e48b6a');
  lake.addColorStop(1, '#1d2348');
  g.fillStyle = lake;
  g.fillRect(0, 244, S, S - 244);
  g.fillStyle = 'rgba(255,240,200,0.5)';
  for (let i = 0; i < 9; i++) g.fillRect(200 + Math.sin(i) * 14, 252 + i * 9, 60 - i * 5, 2);
  // 热气球
  const bx = 106;
  const by = 98;
  const bal = g.createLinearGradient(bx - 40, 0, bx + 40, 0);
  bal.addColorStop(0, '#d9344f');
  bal.addColorStop(0.5, '#ffcf4a');
  bal.addColorStop(1, '#d9344f');
  g.fillStyle = bal;
  g.beginPath();
  g.ellipse(bx, by, 38, 46, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(90,20,30,0.6)';
  g.lineWidth = 2;
  for (const k of [-20, 0, 20]) {
    g.beginPath();
    g.ellipse(bx, by, Math.abs(k) + 4, 46, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.strokeStyle = '#3a2a1a';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(bx - 18, by + 40);
  g.lineTo(bx - 9, by + 66);
  g.moveTo(bx + 18, by + 40);
  g.lineTo(bx + 9, by + 66);
  g.stroke();
  g.fillStyle = '#7a4a22';
  g.fillRect(bx - 10, by + 64, 20, 14);
  // 飞鸟
  g.strokeStyle = 'rgba(30,20,40,0.8)';
  g.lineWidth = 2;
  for (const [x, y] of [[250, 70], [272, 84], [236, 92]]) {
    g.beginPath();
    g.moveTo(x - 7, y);
    g.quadraticCurveTo(x - 3, y - 5, x, y);
    g.quadraticCurveTo(x + 3, y - 5, x + 7, y);
    g.stroke();
  }
  sceneCache = c;
  return c;
}

let attnCache: number[] | null = null;

/**
 * 合成的「第 K 层图像 token 平均被关注度」：热气球、太阳、飞鸟和地平线较高，
 * 大片天空/湖面较低，再叠加长尾噪声。仅用于示意排序与剪枝，不是论文测量值。
 */
export function syntheticAttention(): number[] {
  if (attnCache) return attnCache;
  const out: number[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const x = (c + 0.5) * 14;
      const y = (r + 0.5) * 14;
      const d = (cx: number, cy: number, s: number) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));
      let v =
        1.0 * d(106, 108, 34) +
        0.55 * d(230, 190, 26) +
        0.35 * d(255, 80, 22) +
        0.25 * Math.exp(-((y - 222) ** 2) / (2 * 14 * 14));
      const n = rand(r * 31 + c * 7 + 1);
      v += 0.12 * n * n * n + 0.015;
      if (rand(r * 13 + c * 17 + 5) > 0.985) v += 0.35; // 少量离群高分 token
      out.push(v);
    }
  }
  const sum = out.reduce((a, b) => a + b, 0);
  attnCache = out.map((v) => v / sum);
  return attnCache;
}

/** 从合成注意力得到排序（降序的 token 下标）。 */
export function rankOrder(scores: number[]): number[] {
  return scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
}

// ---------------------------------------------------------------------------
//  论文公式 §4.2：理论 FLOPs 削减比例
// ---------------------------------------------------------------------------
export interface ModelCfg {
  name: string;
  T: number;
  d: number;
  m: number;
}
// 层数 / 隐层维度 / FFN 中间维度取自 LLaVA-1.5（Vicuna）公开配置。
export const MODEL_7B: ModelCfg = { name: 'LLaVA-1.5-7B', T: 32, d: 4096, m: 11008 };
export const MODEL_13B: ModelCfg = { name: 'LLaVA-1.5-13B', T: 40, d: 5120, m: 13824 };

export function layerFlops(n: number, d: number, m: number) {
  return 4 * n * d * d + 2 * n * n * d + 2 * n * d * m;
}

/** 1 − [K·f(n) + (T−K)·f(n̂)] / [T·f(n)]，n̂ = (1−R)·n */
export function flopsReduction(K: number, R: number, cfg: ModelCfg, n = 576) {
  const k = clamp(K, 0, cfg.T);
  const nh = (1 - R) * n;
  const full = layerFlops(n, cfg.d, cfg.m);
  const pruned = layerFlops(nh, cfg.d, cfg.m);
  return 1 - (k * full + (cfg.T - k) * pruned) / (cfg.T * full);
}

// ---------------------------------------------------------------------------
//  「13B · 论文口径复算」：在 Eq. 5 的框架下，把文字 token 也计入序列长度，
//  但文字不剪：剪后长度 = 36 + (1 − R) × 576。
//  36 是为了拟合 Table 1 而采用的长度假设，并非论文声明每个样本都固定如此。
//  按层平均（全模型公式 ÷ T）后，数值上复现 Table 1 的 B 值：
//  基线 154.6B；K=2、R=50% → 84.6B；K=3 → 86.4B；K=5 → 90.1B；K=2、R=75% → 50.2B。
//  这些 B 值是理论量的归一化结果，不是完整前向的实测总运算量。
// ---------------------------------------------------------------------------
export interface PaperPreset extends ModelCfg {
  vis: number;
  text: number;
}
export const PAPER_13B: PaperPreset = { name: 'LLaVA-1.5-13B', T: 40, d: 5120, m: 13824, vis: 576, text: 36 };

/** 按层平均的理论 FLOPs（单位：B = 10⁹），论文口径。 */
export function paperFlopsB(K: number, R: number, cfg: PaperPreset = PAPER_13B) {
  const k = clamp(K, 0, cfg.T);
  const n = cfg.text + cfg.vis;
  const nh = cfg.text + (1 - R) * cfg.vis;
  return (k * layerFlops(n, cfg.d, cfg.m) + (cfg.T - k) * layerFlops(nh, cfg.d, cfg.m)) / cfg.T / 1e9;
}

/** Table 1 / Table 5 中 13B 报告过的 FLOPs（B）。key = `${K}-${R}` */
export const REPORTED_13B: Record<string, { b: number; src: string }> = {
  base: { b: 154.6, src: 'Table 1' },
  '2-0.5': { b: 84.6, src: 'Table 1' },
  '2-0.75': { b: 50.2, src: 'Table 1' },
  '2-0.9': { b: 29.7, src: 'Table 1' },
  '3-0.5': { b: 86.4, src: 'Table 1' },
  '3-0.75': { b: 52.9, src: 'Table 1' },
  '3-0.9': { b: 33.0, src: 'Table 1' },
  '5-0.5': { b: 90.1, src: 'Table 1' },
  '5-0.75': { b: 58.4, src: 'Table 1' },
  '5-0.9': { b: 39.6, src: 'Table 1' },
  '0-0.5': { b: 78.9, src: 'Table 5' },
};

export function reportedKey(K: number, R: number) {
  if (R <= 0) return 'base';
  return `${K}-${Math.round(R * 100) / 100}`;
}
