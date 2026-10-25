import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas, C } from './kit';

// 全篇统一的生活类比：夜海瞭望。
// 选择理由（与论文机制对应）：论文把红外小目标的难点归结为“暗、小、无纹理，且与背景杂波相似”（§I）；
// 夜海上远处小艇的灯与浪尖反光同样都是亮点，瞭望者必须结合整片海面的连续结构才能分辨，
// 这对应论文强调的“目标局部显著性 + 背景全局连续性”。论文 §I 也把海上救援列为红外小目标检测的应用之一。
// 每章只用一个主体做一个动作：瞭望镜的视野圈（蓝）是唯一持续运动的主体。
// 画布 560×140，不在画面里写解释文字。

const W = 560;
const H = 140;
const HOR = 74;
const MOON = { x: 470, y: 28 };

const glints = (() => {
  const pts: { x: number; y: number; a: number }[] = [];
  let s = 7;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let k = 0; k < 26; k++) {
    const y = HOR + 6 + r() * (H - HOR - 10);
    const spread = 6 + (y - HOR) * 0.55;
    pts.push({ x: MOON.x + (r() - 0.5) * 2 * spread, y, a: 0.35 + r() * 0.5 });
  }
  return pts;
})();

const BOAT = { x: 176, y: 104 };

function base(ctx: CanvasRenderingContext2D, opts: { moon?: boolean; band?: boolean } = {}) {
  const { moon = true, band = true } = opts;
  ctx.fillStyle = C.plate;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#121a23';
  ctx.fillRect(0, HOR, W, H - HOR);
  // 远处海岸线
  ctx.fillStyle = '#0b1016';
  ctx.beginPath();
  ctx.moveTo(0, HOR);
  ctx.lineTo(0, HOR - 8);
  ctx.bezierCurveTo(60, HOR - 14, 110, HOR - 4, 160, HOR - 7);
  ctx.bezierCurveTo(200, HOR - 10, 240, HOR - 2, 280, HOR);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.plateLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HOR + 0.5);
  ctx.lineTo(W, HOR + 0.5);
  ctx.stroke();
  // 波纹
  ctx.strokeStyle = 'rgba(120,140,160,0.10)';
  for (let k = 0; k < 6; k++) {
    const y = HOR + 10 + k * 10;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const yy = y + Math.sin(x * 0.05 + k * 1.7) * 1.4;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  if (moon) {
    const g = ctx.createRadialGradient(MOON.x, MOON.y, 2, MOON.x, MOON.y, 26);
    g.addColorStop(0, 'rgba(236,230,214,0.22)');
    g.addColorStop(1, 'rgba(236,230,214,0)');
    ctx.fillStyle = g;
    ctx.fillRect(MOON.x - 30, MOON.y - 30, 60, 60);
    ctx.fillStyle = '#ece6d6';
    ctx.beginPath();
    ctx.arc(MOON.x, MOON.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (band) {
    for (const p of glints) {
      ctx.fillStyle = `rgba(236,230,214,${p.a})`;
      ctx.fillRect(p.x - 2, p.y, 4, 1.2);
    }
  }
}

function boat(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1, blur = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#05080c';
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(9, 0);
  ctx.lineTo(6, 3.5);
  ctx.lineTo(-7, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-1, -9, 1.2, 9);
  ctx.restore();
  const r = 1.6 + blur * 5;
  const g = ctx.createRadialGradient(x + 0.5 * s, y - 9 * s, 0, x + 0.5 * s, y - 9 * s, 4 + blur * 12);
  g.addColorStop(0, `rgba(255,214,150,${0.95 - blur * 0.6})`);
  g.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x + 0.5 * s, y - 9 * s, 4 + blur * 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,236,200,${1 - blur * 0.85})`;
  ctx.beginPath();
  ctx.arc(x + 0.5 * s, y - 9 * s, r * (1 - blur * 0.5), 0, Math.PI * 2);
  ctx.fill();
}

function reticle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = C.blueD) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * (r - 5), y + dy * (r - 5));
    ctx.lineTo(x + dx * (r + 4), y + dy * (r + 4));
    ctx.stroke();
  }
}

const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const frac = (t: number, period: number) => (t % period) / period;

function Scene({ draw, label }: { draw: (ctx: CanvasRenderingContext2D, t: number) => void; label: string }) {
  const ref = useCanvas(W, H, draw, [], true);
  return <canvas ref={ref} className="sx-analogy-canvas" style={{ width: W, height: H }} role="img" aria-label={label} />;
}

// 1 扫视：视野圈扫过海面，经过的亮点都被圈成“候选”。
export const Analogy1: React.FC<WidgetProps> = () => (
  <Scene
    label="望远镜视野扫过夜海，浪尖反光与小艇灯光都被圈为候选亮点"
    draw={(ctx, t) => {
      base(ctx);
      boat(ctx, BOAT.x, BOAT.y);
      const u = frac(t, 9);
      const x = 40 + ease(u < 0.5 ? u * 2 : 2 - u * 2) * 480;
      const y = 102;
      const pts = [{ x: BOAT.x + 0.5, y: BOAT.y - 9 }, ...glints.filter((_, i) => i % 3 === 0)];
      for (const p of pts) {
        const passed = u < 0.5 ? p.x < x : p.x > x;
        if (Math.abs(p.x - x) < 40 || passed) {
          ctx.strokeStyle = 'rgba(141,180,230,0.55)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      reticle(ctx, x, y, 26);
    }}
  />
);

// 2 变焦：视野圈逐级缩小，圈内的小艇随之放大。
export const Analogy2: React.FC<WidgetProps> = () => (
  <Scene
    label="转动变焦环，视野变窄而小艇细节变大"
    draw={(ctx, t) => {
      base(ctx);
      boat(ctx, BOAT.x, BOAT.y);
      const levels = [40, 30, 22, 15];
      const u = frac(t, 8) * 4;
      const k = Math.floor(u);
      const local = ease(Math.min(1, (u - k) * 2.2));
      const r = levels[k] + (levels[(k + 1) % 4] - levels[k]) * (k === 3 ? 0 : local);
      const cx = 390;
      const cy = 92;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#121a23';
      ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      const mag = (42 / r) * 1.4;
      boat(ctx, cx, cy + 6 * mag * 0.6, mag);
      ctx.restore();
      reticle(ctx, cx, cy, r);
      ctx.strokeStyle = 'rgba(141,180,230,0.35)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(BOAT.x + 12, BOAT.y - 8);
      ctx.lineTo(cx - r, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }}
  />
);

// 3 看全景：取景框从一个反光点放大到整片海，反光沿月光带连成一片。
export const Analogy3: React.FC<WidgetProps> = () => (
  <Scene
    label="取景框从单个亮点扩大到整片海，反光沿月光带连续分布，小艇不在带上"
    draw={(ctx, t) => {
      base(ctx);
      boat(ctx, BOAT.x, BOAT.y);
      const u = frac(t, 7);
      const g = glints[8];
      const s = ease(Math.min(1, u * 1.6));
      const w0 = 22;
      const x0 = g.x - w0 / 2 + (4 - (g.x - w0 / 2)) * s;
      const y0 = g.y - w0 / 2 + (4 - (g.y - w0 / 2)) * s;
      const x1 = g.x + w0 / 2 + (W - 4 - (g.x + w0 / 2)) * s;
      const y1 = g.y + w0 / 2 + (H - 4 - (g.y + w0 / 2)) * s;
      ctx.fillStyle = 'rgba(15,20,27,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      base(ctx);
      boat(ctx, BOAT.x, BOAT.y);
      if (s > 0.95) {
        ctx.strokeStyle = 'rgba(236,230,214,0.25)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(MOON.x, HOR + 2);
        ctx.lineTo(MOON.x - 48, H - 2);
        ctx.moveTo(MOON.x, HOR + 2);
        ctx.lineTo(MOON.x + 48, H - 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
      ctx.strokeStyle = C.blueD;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }}
  />
);

// 4 对照：同一片海的四张不同倍率速写，十字线依次对准每张速写里的同一艘船。
export const Analogy4: React.FC<WidgetProps> = () => (
  <Scene
    label="十字线依次对照四张不同倍率的速写，找同一艘小艇"
    draw={(ctx, t) => {
      ctx.fillStyle = C.plate;
      ctx.fillRect(0, 0, W, H);
      const cards = [0, 1, 2, 3].map((i) => ({ x: 34 + i * 126, y: 22, w: 112, h: 96, z: [1, 1.6, 2.4, 3.4][i] }));
      for (const c of cards) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(c.x, c.y, c.w, c.h);
        ctx.clip();
        ctx.fillStyle = '#121a23';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = C.plateLine;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y + 40);
        ctx.lineTo(c.x + c.w, c.y + 40);
        ctx.stroke();
        boat(ctx, c.x + c.w * 0.5, c.y + 40 + 14 * c.z * 0.5, c.z * 0.6);
        ctx.restore();
        ctx.strokeStyle = C.plateLine;
        ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w, c.h);
      }
      const u = frac(t, 8) * 4;
      const k = Math.floor(u);
      const m = ease(Math.min(1, (u - k) * 1.8));
      const from = cards[k];
      const to = cards[(k + 1) % 4];
      const fx = from.x + from.w / 2;
      const tx = to.x + to.w / 2;
      const x = k === 3 ? fx + (cards[0].x + cards[0].w / 2 - fx) * m : fx + (tx - fx) * m;
      const y = 22 + 40 + 6;
      reticle(ctx, x, y, 18);
    }}
  />
);

// 5 调焦：小艇的灯从一团光晕收成清晰的一点。
export const Analogy5: React.FC<WidgetProps> = () => (
  <Scene
    label="拧动调焦环，小艇灯光从光晕收成清晰的亮点"
    draw={(ctx, t) => {
      base(ctx);
      const u = frac(t, 6);
      const blur = u < 0.6 ? 1 - ease(u / 0.6) : 0;
      boat(ctx, 300, 106, 1.8, blur);
      reticle(ctx, 300.9, 106 - 16.2, 30);
    }}
  />
);

// 6 收放取景框：视野圈在小艇周围一收一放。
export const Analogy6: React.FC<WidgetProps> = () => (
  <Scene
    label="取景框在小艇周围一收一放，近看形状、稍远看周边"
    draw={(ctx, t) => {
      base(ctx);
      boat(ctx, 300, 104, 1.6);
      const u = (Math.sin(t * 1.3) + 1) / 2;
      const r = 16 + ease(u) * 22;
      reticle(ctx, 300.8, 104 - 14.4 + 4, r);
    }}
  />
);

// 7 记日志：在航海日志的六行上逐行打勾。
export const Analogy7: React.FC<WidgetProps> = () => (
  <Scene
    label="在航海日志的六行记录上逐行打勾"
    draw={(ctx, t) => {
      base(ctx, { band: false });
      const px = 200;
      const py = 14;
      ctx.fillStyle = '#e9e4d8';
      ctx.fillRect(px, py, 160, 112);
      ctx.strokeStyle = 'rgba(40,50,60,0.25)';
      for (let i = 0; i < 6; i++) {
        const y = py + 18 + i * 16;
        ctx.beginPath();
        ctx.moveTo(px + 32, y);
        ctx.lineTo(px + 142 - (i === 5 ? 0 : i * 8), y);
        ctx.stroke();
      }
      const u = frac(t, 7) * 7;
      const done = Math.min(6, Math.floor(u));
      for (let i = 0; i < done; i++) {
        const y = py + 14 + i * 16;
        ctx.strokeStyle = i === 5 ? C.purple : C.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 12, y);
        ctx.lineTo(px + 17, y + 5);
        ctx.lineTo(px + 26, y - 5);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }}
  />
);

// 8 光路：一束光穿过望远镜，从物镜到目镜。
export const Analogy8: React.FC<WidgetProps> = () => (
  <Scene
    label="一束光穿过望远镜，从物镜走到目镜"
    draw={(ctx, t) => {
      base(ctx);
      ctx.save();
      ctx.translate(150, 54);
      ctx.fillStyle = '#1d2732';
      ctx.strokeStyle = '#3a4757';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(220, -10);
      ctx.lineTo(220, 10);
      ctx.lineTo(0, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(220, -7, 34, 14);
      ctx.strokeRect(220, -7, 34, 14);
      ctx.restore();
      const u = frac(t, 4);
      const x = 120 + u * 150 + u * u * 120;
      const a = u < 0.85 ? 1 : (1 - u) / 0.15;
      ctx.strokeStyle = `rgba(255,214,150,${0.85 * a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.max(120, x - 60), 54 + (x - 60 < 150 ? 0 : 0));
      ctx.lineTo(x, 54);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,236,200,${a})`;
      ctx.beginPath();
      ctx.arc(x, 54, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
    }}
  />
);

// 9 取下滤镜：一片滤镜被抽出，圈内画面随之变模糊。
export const Analogy9: React.FC<WidgetProps> = () => (
  <Scene
    label="抽出一片滤镜，再看同一艘船，画面变得模糊"
    draw={(ctx, t) => {
      base(ctx);
      const u = frac(t, 6);
      const lift = u < 0.4 ? 0 : u < 0.7 ? ease((u - 0.4) / 0.3) : 1 - ease((u - 0.7) / 0.3);
      boat(ctx, 330, 106, 1.6, lift * 0.8);
      reticle(ctx, 330.8, 106 - 14.4, 28);
      ctx.fillStyle = 'rgba(141,180,230,0.25)';
      ctx.strokeStyle = C.blueD;
      const fy = 30 - lift * 22;
      ctx.beginPath();
      ctx.ellipse(170, fy + 40, 8, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }}
  />
);

// 10 结果：三组横条依次生长——灰色为此前最好的 IoU，绿色为 SCTransNet（表 I 原值）。
export const Analogy10: React.FC<WidgetProps> = () => (
  <Scene
    label="三组横条：表 I 中三个数据集上此前最好的 IoU 与 SCTransNet 的 IoU"
    draw={(ctx, t) => {
      ctx.fillStyle = C.plate;
      ctx.fillRect(0, 0, W, H);
      const rows: [number, number][] = [
        [76.91, 77.5],
        [93.48, 94.09],
        [66.36, 68.03],
      ];
      const u = Math.min(1, frac(t, 7) * 1.6);
      const x0 = 40;
      const span = 480;
      rows.forEach(([prev, ours], i) => {
        const y = 22 + i * 38;
        ctx.fillStyle = '#1b232d';
        ctx.fillRect(x0, y, span, 26);
        const e = ease(u);
        ctx.fillStyle = '#6b7684';
        ctx.fillRect(x0, y + 2, (span * prev * e) / 100, 10);
        ctx.fillStyle = C.greenD;
        ctx.fillRect(x0, y + 14, (span * ours * e) / 100, 10);
      });
    }}
  />
);
