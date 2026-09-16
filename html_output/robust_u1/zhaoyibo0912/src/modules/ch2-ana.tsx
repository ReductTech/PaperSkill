import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 生活隐喻（560×140，自动循环 3.2 s）：
// 一只放大镜沿同一高度从左扫到右、再扫回来，镜片里裂痕与霉斑被放大显现；
// 镜片之外，照片看上去只是「有点糊」。

const W = 560;
const H = 140;
const LOOP = 3.2; // seconds

// ---------- drawing kit (local helpers, fixed signatures) ----------
type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Deterministic PRNG: 斑点位置每帧一致，只有数量随 damage 变化。
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clearScene(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function drawPhoto(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
) {
  const d = clamp(damage, 0, 1);
  const rng = makeRng(90210);
  ctx.save();
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const sx = x + rng() * w;
    const sy = y + rng() * h;
    const s = 1 + rng() * 2;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(sx, sy, s, s);
  }
  const nc = Math.round(2 + 2 * d);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < nc; i++) {
    let px = x + rng() * w;
    let py = y + rng() * h;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let k = 0; k < 3; k++) {
      px += (rng() - 0.5) * 20;
      py += (rng() - 0.5) * 20;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 5);
  ctx.lineWidth = 3;
  ctx.strokeStyle = stateColor ?? '#d7deea';
  ctx.stroke();
  ctx.restore();
}

function drawFace(ctx: Ctx, cx: number, cy: number, r: number, clarity: number) {
  const c = clamp(clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.85 * c;
  ctx.strokeStyle = '#21324a';
  ctx.fillStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - r * 0.36, cy - r * 0.18, Math.max(1.5, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.36, cy - r * 0.18, Math.max(1.5, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.5, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
  ctx.restore();

  if (c >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 12, 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }
}

function drawMagnifier(ctx: Ctx, x: number, y: number, r: number, angle: number) {
  ctx.save();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  ctx.lineTo(x + Math.cos(angle) * (r + 30), y + Math.sin(angle) * (r + 30));
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(39,68,110,0.08)';
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawLamp(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y - 58);
  ctx.stroke();
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 58);
  ctx.lineTo(x + 11, y - 58);
  ctx.lineTo(x + 24, y - 86);
  ctx.lineTo(x - 24, y - 86);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const PHOTO_X = 240;
const PHOTO_Y = 30;
const PHOTO_W = 110;
const PHOTO_H = 80;

// 照片上真实的裂痕（世界坐标）：镜片扫过时被放大 2.4 倍显示。
const CRACKS: number[][] = [
  [295, 84, 306, 96, 298, 108],
  [262, 58, 272, 48, 284, 56],
  [318, 62, 330, 72, 326, 86],
];
const SPECKS: number[][] = [
  [286, 52],
  [312, 98],
  [268, 88],
  [320, 50],
];

export const Ch2Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (t: number) => {
      clearScene(ctx, W, H);

      // 静态道具：台灯
      drawLamp(ctx, 56, H - 26);

      // 镜片之外：照片只是「有点糊」
      drawPhoto(ctx, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 0.45);
      drawFace(ctx, PHOTO_X + PHOTO_W / 2, PHOTO_Y + 40, 22, 0.35);

      // 放大镜沿同一高度左右往返
      const ph = (t % LOOP) / LOOP;
      const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      const e = easeInOutQuad(tri);
      const lx = lerp(PHOTO_X + 14, PHOTO_X + PHOTO_W - 14, e);
      const ly = PHOTO_Y + 40;
      const R = 26;

      // 镜片之内：把裂纹与霉斑放大 2.4 倍显现出来
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lx - R, ly - R, R * 2, R * 2);
      const k = 2.4;
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2.5;
      CRACKS.forEach((c) => {
        ctx.beginPath();
        for (let i = 0; i + 1 < c.length; i += 2) {
          const px = lx + (c[i] - lx) * k;
          const py = ly + (c[i + 1] - ly) * k;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });
      SPECKS.forEach((p, i) => {
        const px = lx + (p[0] - lx) * k;
        const py = ly + (p[1] - ly) * k;
        ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
        ctx.fillRect(px, py, 5, 5);
      });
      ctx.restore();

      // 唯一的运动主体：放大镜（镜框 + 手柄画在放大内容之上）
      drawMagnifier(ctx, lx, ly, R, Math.PI * 0.25);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render((performance.now() / 1000) % LOOP);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ch2Ana;
