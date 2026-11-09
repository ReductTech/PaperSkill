import { setupCanvas } from '../lib/canvasKit';

export const ink = '#21324a';
export const muted = '#68778f';
export const blue = '#27446e';
export const green = '#228d5c';
export const red = '#c43f52';
export const orange = '#f07e47';
export const purple = '#7c3aed';
export const wood = '#92400e';
export const env = '#b8c9a7';
export const envDark = '#76906a';
export const line = '#d7deea';
export const paper = '#f7f3e8';

export type Bloom = 'rose' | 'fern' | 'sun' | 'pitcher';

export function paint(canvas: HTMLCanvasElement, w: number, h: number) {
  return setupCanvas(canvas, w, h);
}

export function localPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number, w: number, h: number) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / Math.max(rect.width, 1)) * w,
    y: ((clientY - rect.top) / Math.max(rect.height, 1)) * h,
  };
}

export type MarketAngle = 'front' | 'scale' | 'pack' | 'crate' | 'plot';

export function drawMarket(ctx: CanvasRenderingContext2D, w: number, h: number, angle: MarketAngle = 'front') {
  ctx.fillStyle = angle === 'plot' ? '#eef3ea' : '#f4f7ef';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = env;
  ctx.fillRect(0, 0, w, 46);
  ctx.fillStyle = envDark;
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.arc(28 + i * ((w - 20) / 8), 46, 16, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#e7efe0';
  ctx.fillRect(0, h - 78, w, 78);
  if (angle === 'scale') {
    ctx.fillStyle = '#cfd9c4';
    ctx.fillRect(24, h - 210, w - 48, 28);
    ctx.fillStyle = wood;
    ctx.fillRect(70, h - 182, 18, 104);
    ctx.fillRect(w - 90, h - 182, 18, 104);
    ctx.fillStyle = '#dfe7d6';
    ctx.fillRect(120, h - 248, 220, 46);
    ctx.strokeStyle = wood;
    ctx.lineWidth = 4;
    ctx.strokeRect(120, h - 248, 220, 46);
    ctx.fillStyle = muted;
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('秤台 · 词表称重', 146, h - 218);
  } else if (angle === 'pack') {
    ctx.fillStyle = '#d7c4a3';
    ctx.fillRect(80, h - 196, w - 220, 28);
    ctx.fillStyle = wood;
    ctx.fillRect(96, h - 168, 18, 90);
    ctx.fillRect(w - 180, h - 168, 18, 90);
    ctx.fillStyle = '#8b5a2b';
    roundRect(ctx, w - 210, h - 290, 150, 110, 10);
    ctx.fill();
    ctx.fillStyle = '#f7f3e8';
    ctx.fillRect(w - 190, h - 250, 110, 18);
    ctx.fillStyle = ink;
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('封箱台', w - 172, h - 236);
  } else if (angle === 'crate') {
    ctx.fillStyle = '#cbb892';
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(60 + i * 180, h - 188, 140, 52);
      ctx.fillStyle = wood;
      ctx.fillRect(72 + i * 180, h - 198, 116, 12);
      ctx.fillStyle = '#cbb892';
    }
    ctx.fillStyle = '#e7efe0';
    ctx.fillRect(0, h - 78, w, 78);
  } else if (angle === 'plot') {
    ctx.fillStyle = '#dfe8d6';
    ctx.fillRect(48, h - 150, w - 96, 18);
    ctx.fillStyle = wood;
    ctx.fillRect(60, h - 132, 14, 54);
    ctx.fillRect(w - 74, h - 132, 14, 54);
  } else {
    ctx.fillStyle = '#d7c4a3';
    ctx.fillRect(36, h - 168, w - 72, 22);
    ctx.fillStyle = wood;
    ctx.fillRect(48, h - 146, 16, 78);
    ctx.fillRect(w - 64, h - 146, 16, 78);
  }
}

export function drawSpeech(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fill = blue) {
  ctx.font = '700 24px "Microsoft YaHei", sans-serif';
  const tw = Math.max(120, ctx.measureText(text).width + 28);
  const th = 44;
  ctx.fillStyle = fill;
  roundRect(ctx, x - tw / 2, y - th, tw, th, 12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - th / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  label = '烙进权重',
) {
  const p = Math.max(0, Math.min(1, progress));
  const lift = (1 - p) * 70;
  ctx.save();
  ctx.translate(x, y - lift);
  ctx.fillStyle = p > 0.7 ? green : orange;
  roundRect(ctx, -54, -28, 108, 56, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 24px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  if (p > 0.85) {
    ctx.globalAlpha = (p - 0.85) / 0.15;
    ctx.strokeStyle = green;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 70, 36, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawVendor(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#f3d2b5';
  ctx.beginPath();
  ctx.arc(x, y - 46, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d4a3a';
  ctx.fillRect(x - 14, y - 50, 28, 8);
  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.moveTo(x - 22, y + 8);
  ctx.lineTo(x + 22, y + 8);
  ctx.lineTo(x + 16, y - 28);
  ctx.lineTo(x - 16, y - 28);
  ctx.fill();
  ctx.fillStyle = '#f7f3e8';
  ctx.fillRect(x - 14, y - 24, 28, 22);
}

export function drawPot(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#c98655';
  ctx.beginPath();
  ctx.moveTo(-34, -8);
  ctx.lineTo(-26, 36);
  ctx.quadraticCurveTo(0, 44, 26, 36);
  ctx.lineTo(34, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = wood;
  ctx.fillRect(-40, -16, 80, 12);
  ctx.fillStyle = '#6f4424';
  ctx.fillRect(-8, 6, 16, 18);
  ctx.restore();
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: Bloom,
  s: number,
  glow = 0,
  wilt = 0,
) {
  ctx.save();
  ctx.translate(x, y + wilt * 16 * s);
  ctx.scale(s, s * (1 - wilt * 0.18));
  if (glow > 0) {
    const g = ctx.createRadialGradient(0, -20, 4, 0, -10, 70);
    g.addColorStop(0, `rgba(240,126,71,${0.55 * glow})`);
    g.addColorStop(1, 'rgba(240,126,71,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -16, 68, 0, Math.PI * 2);
    ctx.fill();
  }
  if (kind === 'rose') {
    leaf(ctx, -28, 6, 20, 8, -0.7, '#3d7a4c');
    leaf(ctx, 26, 8, 18, 7, 0.6, '#3d7a4c');
    ctx.fillStyle = '#2f6b40';
    ctx.fillRect(-3, -6, 6, 28);
    for (let i = 0; i < 6; i += 1) {
      ctx.save();
      ctx.rotate((i / 6) * Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#c43f52' : '#e07b88';
      ctx.beginPath();
      ctx.ellipse(0, -22, 11, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#9f2d40';
    ctx.beginPath();
    ctx.arc(0, -6, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'sun') {
    ctx.fillStyle = '#2f6b40';
    ctx.fillRect(-3, 0, 6, 34);
    for (let i = 0; i < 12; i += 1) {
      ctx.save();
      ctx.rotate((i / 12) * Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#f0c14a' : '#f07e47';
      ctx.beginPath();
      ctx.ellipse(0, -30, 7, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#8a4b12';
    ctx.beginPath();
    ctx.arc(0, -8, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'fern') {
    ctx.strokeStyle = '#2f6b40';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.quadraticCurveTo(i * 8, -10, i * 18, -42);
      ctx.stroke();
      for (let k = 0; k < 5; k += 1) {
        const t = k / 4;
        const px = i * 18 * t;
        const py = 20 + (-42 - 20) * t;
        leaf(ctx, px, py, 8, 3, i * 0.35, '#5ea36a');
      }
    }
  } else {
    ctx.fillStyle = '#2f6b40';
    ctx.fillRect(-3, 8, 6, 30);
    ctx.fillStyle = '#3d8f58';
    ctx.beginPath();
    ctx.moveTo(-16, 10);
    ctx.quadraticCurveTo(-8, -36, 6, -28);
    ctx.quadraticCurveTo(18, -18, 10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c43f52';
    ctx.beginPath();
    ctx.ellipse(2, -30, 14, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7f3e8';
    ctx.beginPath();
    ctx.ellipse(4, -28, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (wilt > 0.05) {
    ctx.fillStyle = `rgba(104,119,143,${wilt * 0.45})`;
    ctx.beginPath();
    ctx.arc(0, -8, 36, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, s = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, y + 8 * s, 48 * s, 58 * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fill: string) {
  ctx.font = '700 26px "Microsoft YaHei", sans-serif';
  const w = Math.max(96, ctx.measureText(text).width + 28);
  ctx.fillStyle = fill;
  roundRect(ctx, x - w / 2, y - 20, w, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

export function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, lines: string[], accent = wood) {
  const h = 28 + lines.length * 32;
  ctx.fillStyle = paper;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, 168, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = '700 24px "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'top';
  lines.forEach((lineText, i) => ctx.fillText(lineText, x + 14, y + 14 + i * 32));
}

export function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, open: number, title: string) {
  ctx.save();
  ctx.translate(x, y);
  const spread = 18 + open * 54;
  ctx.fillStyle = blue;
  roundRect(ctx, -spread - 8, -36, spread, 78, 6);
  ctx.fill();
  ctx.fillStyle = open > 0.4 ? '#f7f3e8' : envDark;
  roundRect(ctx, 8, -36, spread, 78, 6);
  ctx.fill();
  ctx.fillStyle = wood;
  ctx.fillRect(-6, -40, 12, 86);
  if (open > 0.45) {
    ctx.fillStyle = muted;
    ctx.fillRect(18, -22, spread - 24, 4);
    ctx.fillRect(18, -8, spread - 30, 4);
    ctx.fillRect(18, 6, spread - 36, 4);
  }
  ctx.fillStyle = ink;
  ctx.font = '700 22px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 0, 62);
  ctx.restore();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function norm(v: [number, number]): [number, number] {
  const n = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / n, v[1] / n];
}

export function dot(a: [number, number], b: [number, number]) {
  return a[0] * b[0] + a[1] * b[1];
}

export const blooms: Record<Bloom, { name: string; vec: [number, number] }> = {
  rose: { name: '玫瑰', vec: [1, 0] },
  fern: { name: '蕨', vec: [0, 1] },
  sun: { name: '向日葵', vec: norm([1, 1]) },
  pitcher: { name: '猪笼草', vec: norm([-0.62, 0.84]) },
};

export const phrases: Record<string, [number, number]> = {
  玫瑰: [1, 0],
  蕨: [0, 1],
  向日葵: norm([1, 1]),
  猪笼草: norm([-0.62, 0.84]),
  红瓣带刺: norm([0.93, 0.28]),
  细长叶子: norm([0.22, 0.98]),
  黄瓣圆盘: norm([0.78, 0.64]),
  管状捕虫叶: norm([-0.48, 0.88]),
};

export function softmax(scores: number[]) {
  const m = Math.max(...scores);
  const ex = scores.map((s) => Math.exp(s - m));
  const z = ex.reduce((a, b) => a + b, 0);
  return ex.map((v) => v / z);
}
