import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比卡：缝针沿横向布带走针，针脚相对淡色基准线越走越偏。
// 走针 → 停顿 → 淡出复位，自动循环、离屏暂停、无控件。

const W = 560;
const H = 140;
const PERIOD = 4000;
const BAND_TOP = 76;
const BAND_BOTTOM = 118;
const BASE_Y = 92;
const X0 = 44;
const X1 = 512;
const MAX_OFFSET = 26;
const SEW_END = 0.6;
const HOLD_END = 0.72;
const FADE_END = 0.85;

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
}

function drawSetting(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(20, BAND_TOP, 520, BAND_BOTTOM - BAND_TOP);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(20, BAND_BOTTOM - 4, 520, 4);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(20.5, BAND_TOP + 0.5, 519, BAND_BOTTOM - BAND_TOP - 1);
  // 布面纹理：稀疏短划线，极低对比度
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1;
  for (let x = 44; x <= 520; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, BAND_TOP + 9);
    ctx.lineTo(x + 7, BAND_TOP + 9);
    ctx.moveTo(x + 14, BAND_BOTTOM - 11);
    ctx.lineTo(x + 21, BAND_BOTTOM - 11);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = '#68778f';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  now: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  const bob = Math.sin(now / 280) * 1.5;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + bob + 2);
  ctx.quadraticCurveTo(x - 30, y + 16 + bob, x - 52, y + 8 + bob);
  ctx.stroke();
  ctx.translate(x, y + bob);
  ctx.rotate(-0.42);
  ctx.fillStyle = '#21324a';
  ctx.fillRect(-16, -1.8, 30, 3.6);
  ctx.beginPath();
  ctx.moveTo(14, -1.8);
  ctx.lineTo(22, 0);
  ctx.lineTo(14, 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-15, 0, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f8f0';
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const t0 = performance.now();

    const render = (now: number) => {
      const phase = ((now - t0) % PERIOD) / PERIOD;
      const prog = easeInOutQuad(clamp(phase / SEW_END, 0, 1));
      const fade =
        phase < HOLD_END ? 1 : clamp(1 - (phase - HOLD_END) / (FADE_END - HOLD_END), 0, 1);
      const needleAlpha = Math.min(clamp(phase / 0.05, 0, 1), fade);

      clearScene(ctx);
      drawSetting(ctx);

      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, BASE_Y);
      ctx.lineTo(540, BASE_Y);
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, '基准线', 446, 68);

      const n = 12;
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= n; i += 1) {
        const f = i / n;
        if (f > prog) break;
        pts.push({ x: lerp(X0, X1, f), y: BASE_Y + Math.pow(f, 1.7) * MAX_OFFSET });
      }
      if (pts.length > 1 && fade > 0.01) {
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        // 针脚画成小斜线，透明度略有变化
        for (let i = 0; i < pts.length; i += 1) {
          ctx.globalAlpha = fade * (0.55 + 0.4 * Math.abs(Math.sin(i * 1.9)));
          ctx.beginPath();
          ctx.moveTo(pts[i].x - 2, pts[i].y - 5);
          ctx.lineTo(pts[i].x + 2, pts[i].y + 5);
          ctx.stroke();
        }
        ctx.restore();
      }

      const nx = lerp(X0, X1, prog);
      const ny = BASE_Y + Math.pow(prog, 1.7) * MAX_OFFSET;
      // 行进中的极淡拖影
      if (prog > 0.03 && phase < SEW_END) {
        const gp = Math.max(0, prog - 0.04);
        drawSubject(
          ctx,
          lerp(X0, X1, gp),
          BASE_Y + Math.pow(gp, 1.7) * MAX_OFFSET,
          now,
          0.15 * needleAlpha
        );
      }
      drawSubject(ctx, nx, ny, now, needleAlpha);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default Ana1;
