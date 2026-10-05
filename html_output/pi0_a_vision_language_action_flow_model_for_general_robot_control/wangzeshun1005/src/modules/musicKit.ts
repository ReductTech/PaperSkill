// musicKit.ts — 练琴隐喻的共享绘图工具包。纯 Canvas，无 React。
export const FIELD = '#f5f8f0';
export const STAGE = '#b8c9a7';      // 琴体/地板
export const DARK = '#76906a';       // 轮廓/深度
export const WOOD = '#92400e';       // 琴架/琴键木色
export const GUIDE = '#27446e';      // 当前状态/引导
export const OK = '#228d5c';         // 成功/本文方法
export const BAD = '#c43f52';        // 失败/旧方法
export const EMPH = '#f07e47';       // 用户控制的强调
export const AUX = '#7c3aed';        // 辅助
export const INK = '#21324a';
export const MUTED = '#68778f';
export const LINE = '#d7deea';
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD; ctx.fillRect(0, 0, w, h);
  const y = Math.round(h * 0.84);
  ctx.fillStyle = STAGE; ctx.fillRect(0, y, w, h - y);
  ctx.fillStyle = DARK; ctx.fillRect(0, y, w, 2);
}

/** 键盘：whiteKeys 个白键，高亮 active[] 中的序号 */
export function drawKeyboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, whiteKeys: number, active: number[], color?: string): void {
  const kw = w / whiteKeys;
  for (let i = 0; i < whiteKeys; i++) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + i * kw, y, kw - 2, h);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    ctx.strokeRect(x + i * kw + 0.5, y + 0.5, kw - 2, h - 1);
  }
  ctx.fillStyle = color || GUIDE;
  for (const i of active) ctx.fillRect(x + i * kw, y, kw - 2, h);
  // 黑键
  ctx.fillStyle = INK;
  for (let i = 0; i < whiteKeys - 1; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    ctx.fillRect(x + (i + 1) * kw - 4, y, 8, h * 0.6);
  }
}

/** 手：一个简化的手掌+手指，pos 为指尖位置 */
export function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color?: string): void {
  const s = scale || 1;
  ctx.fillStyle = color || WOOD;
  ctx.beginPath();
  ctx.ellipse(x, y + 14 * s, 13 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(x + i * 8 * s, y + 3 * s, 3 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 轨迹：pts 为 [x,y] 数组 */
export function drawPath(ctx: CanvasRenderingContext2D, pts: number[][], color: string, width: number, dash?: number[]): void {
  if (pts.length < 2) return;
  ctx.save();
  if (dash) ctx.setLineDash(dash);
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke(); ctx.restore();
}

/** 乐谱：若干小节，filled 之前的小节为实心 */
export function drawScore(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bars: number, filled: number, color?: string): void {
  const bw = w / bars;
  for (let i = 0; i < bars; i++) {
    ctx.fillStyle = i < filled ? (color || OK) : LINE;
    ctx.fillRect(x + i * bw + 2, y, bw - 6, h);
  }
}

/** 乐器轮廓：kind='piano'|'guitar'|'drum' */
export function drawInstrument(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, kind: string, color?: string): void {
  const s = scale || 1;
  ctx.fillStyle = color || WOOD;
  if (kind === 'drum') {
    ctx.beginPath(); ctx.ellipse(x, y, 26 * s, 18 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = DARK; ctx.fillRect(x - 26 * s, y - 2 * s, 52 * s, 4 * s);
  } else if (kind === 'guitar') {
    ctx.beginPath(); ctx.ellipse(x, y, 20 * s, 24 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 4 * s, y - 46 * s, 8 * s, 26 * s);
  } else {
    ctx.fillRect(x - 30 * s, y - 10 * s, 60 * s, 16 * s);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 28 * s, y - 8 * s, 56 * s, 12 * s);
  }
}

export function drawNote(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color?: string): void {
  ctx.fillStyle = color || INK;
  ctx.beginPath(); ctx.ellipse(x, y, size, size * 0.72, -0.35, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x + size * 0.85, y - size * 3.4, 1.6, size * 3.4);
}

export function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color?: string): void {
  ctx.fillStyle = color || INK; ctx.font = '18px ' + FONT; ctx.textAlign = 'left'; ctx.fillText(text, x, y);
}

export interface LegendItem { color: string; text: string; }
export function drawLegend(ctx: CanvasRenderingContext2D, items: LegendItem[], x: number, y: number): void {
  ctx.font = '15px ' + FONT; ctx.textAlign = 'left';
  let cx = x;
  for (const it of items.slice(0, 3)) {
    ctx.fillStyle = it.color; ctx.fillRect(cx, y - 9, 10, 10);
    ctx.fillStyle = MUTED; ctx.fillText(it.text, cx + 14, y);
    cx += 14 + ctx.measureText(it.text).width + 18;
  }
}

export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
