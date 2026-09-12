import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比卡：针沿布带匀速连续走针，走到右端轻微回弹，停顿后缓步退回起点、
// 线迹淡出复位，首尾无缝，自动循环。

const W = 560;
const H = 140;
const CYCLE = 4.4;
const SEAM_Y = 92;

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawBand(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(x0, y1 - 5, x1 - x0, 5);
  // 布面纹理：稀疏短划线，极低对比度
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1;
  for (let x = 40; x <= x1 - 20; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, y0 + 10);
    ctx.lineTo(x + 7, y0 + 10);
    ctx.moveTo(x + 13, y1 - 12);
    ctx.lineTo(x + 20, y1 - 12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeedle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x - len - 20, y);
  ctx.stroke();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 8, y - 4);
  ctx.lineTo(x - 8, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x - len + 6, y, 2.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
) {
  ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 9, 12, 9);
    ctx.fillStyle = '#68778f';
    ctx.fillText(it.label, cx + 17, y);
    cx += 17 + ctx.measureText(it.label).width + 16;
  });
}

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const clockRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (p: number, now: number) => {
      clearScene(ctx, W, H);
      drawBand(ctx, 12, 548, 62, 122);

      let x: number;
      let seamEnd: number;
      let seamAlpha = 1;
      if (p < 0.5) {
        x = lerp(60, 480, p / 0.5);
        seamEnd = x;
      } else if (p < 0.6) {
        const over = (p - 0.5) / 0.1;
        x = 480 - 14 * Math.sin(over * Math.PI);
        seamEnd = 480;
      } else if (p < 0.72) {
        x = 480;
        seamEnd = 480;
      } else if (p < 0.88) {
        x = lerp(480, 60, easeInOutQuad((p - 0.72) / 0.16));
        seamEnd = 480;
      } else {
        x = 60;
        seamEnd = 480;
        seamAlpha = clamp(1 - (p - 0.88) / 0.12, 0, 1);
      }
      const needleAlpha = Math.min(clamp(p / 0.03, 0, 1), clamp((1 - p) / 0.03, 0, 1));

      // 线迹与小斜针脚，透明度略有变化
      if (seamEnd > 62 && seamAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = seamAlpha;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, SEAM_Y);
        ctx.lineTo(seamEnd, SEAM_Y);
        ctx.stroke();
        let k = 0;
        for (let sx = 70; sx <= seamEnd; sx += 21) {
          k += 1;
          ctx.globalAlpha = seamAlpha * (0.55 + 0.4 * Math.abs(Math.sin(k * 1.8)));
          ctx.beginPath();
          ctx.moveTo(sx - 2, SEAM_Y - 6);
          ctx.lineTo(sx + 2, SEAM_Y + 6);
          ctx.stroke();
        }
        ctx.restore();
      }

      const bob = Math.sin(now / 300) * 1.3;
      // 行进中的极淡拖影
      if ((p < 0.5 || (p >= 0.72 && p < 0.88)) && needleAlpha > 0.01) {
        const back = p < 0.5 ? -12 : 12;
        drawNeedle(ctx, x + back, SEAM_Y + bob, 36, needleAlpha * 0.15);
      }
      drawNeedle(ctx, x, SEAM_Y + bob, 36, needleAlpha);

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('一针挨一针', 20, 26);

      drawLegend(
        ctx,
        [
          { label: '针脚', color: '#228d5c' },
          { label: '当前', color: '#21324a' },
        ],
        430,
        26
      );
    };

    const tick = (ts: number) => {
      const dt = lastRef.current ? Math.min(0.06, (ts - lastRef.current) / 1000) : 0;
      lastRef.current = ts;
      clockRef.current = (clockRef.current + dt) % CYCLE;
      render(clockRef.current / CYCLE, ts);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
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
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default Ana6;
