import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比卡：划粉块从左到右划过布带，留下一根笔直的基准线，
// 停顿后划粉与线依次淡出复位。自动循环、离屏暂停、无控件。

const W = 560;
const H = 140;
const PERIOD = 3600;
const BAND_TOP = 78;
const BAND_BOTTOM = 118;
const LINE_Y = 98;
const X0 = 34;
const X1 = 512;
const LINE_X0 = 40;
const LINE_X1 = 512;
const DRAW_END = 0.5;
const HOLD_END = 0.65;
const CHALK_FADE_END = 0.78;
const LINE_FADE_END = 0.9;

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
    ctx.moveTo(x + 14, BAND_BOTTOM - 10);
    ctx.lineTo(x + 21, BAND_BOTTOM - 10);
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
  alpha: number,
  now: number
) {
  if (alpha <= 0.01) return;
  const bob = Math.sin(now / 300) * 1.2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + bob);
  ctx.rotate(-0.16);
  ctx.fillStyle = '#d7deea';
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(-15, -9, 30, 18);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-15, -9);
  ctx.lineTo(-25, 0);
  ctx.lineTo(-15, 9);
  ctx.closePath();
  ctx.fillStyle = '#f5f8f0';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const frac = easeInOutQuad(clamp(phase / DRAW_END, 0, 1));
      const chalkX = lerp(X0, X1, frac);
      const chalkAlpha = Math.min(
        clamp(phase / 0.04, 0, 1),
        phase < HOLD_END ? 1 : clamp(1 - (phase - HOLD_END) / (CHALK_FADE_END - HOLD_END), 0, 1)
      );
      const lineAlpha =
        phase < CHALK_FADE_END
          ? 1
          : clamp(1 - (phase - CHALK_FADE_END) / (LINE_FADE_END - CHALK_FADE_END), 0, 1);

      clearScene(ctx);
      drawSetting(ctx);

      if (lineAlpha > 0.01 && frac > 0.005) {
        ctx.save();
        ctx.globalAlpha = lineAlpha;
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(LINE_X0, LINE_Y);
        ctx.lineTo(lerp(LINE_X0, LINE_X1, frac), LINE_Y);
        ctx.stroke();
        ctx.restore();
      }

      drawSceneLabel(ctx, '基准线', 452, 70);

      // 划粉行进时尾部落下的粉点
      if (phase < DRAW_END && frac > 0.02) {
        ctx.save();
        ctx.fillStyle = '#d7deea';
        for (let i = 1; i <= 4; i += 1) {
          const dx = chalkX - i * 9;
          ctx.globalAlpha = 0.28 * (1 - i / 5) * chalkAlpha;
          ctx.beginPath();
          ctx.arc(dx, LINE_Y - 1 + Math.sin(i * 2.1) * 2, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      drawSubject(ctx, chalkX, LINE_Y - 6, chalkAlpha, now);

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

export default Ana2;
