import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比卡：手从针插垫取下一枚针，到布面缝一段，再把针插回垫、
// 线迹淡出复位——只换针，不换布。首尾无缝，自动循环。

const W = 560;
const H = 140;
const CYCLE = 4.2;
const HAND_Y = 40;
const SEAM_Y = 100;

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
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 7, y - 3.5);
  ctx.lineTo(x - 7, y + 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x - len + 5, y, 2.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 8, y + 6, 16, 20);
  ctx.fillRect(x + 6, y + 1, 8, 15);
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

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      drawBand(ctx, 12, 548, 74, 126);

      // 针插垫上可被取走的那枚针：取走淡出、插回淡入
      const taken = clamp((p - 0.05) / 0.03, 0, 1) - clamp((p - 0.93) / 0.04, 0, 1);
      const spareAlpha = 1 - taken;

      // 手的位置与动作分段
      let handX = 104;
      let sewnX = 150;
      let handNeedleAlpha = 0;
      let clothNeedleAlpha = 0;
      if (p < 0.06) {
        handX = 104;
      } else if (p < 0.3) {
        handX = lerp(104, 340, easeInOutQuad((p - 0.06) / 0.24));
        handNeedleAlpha = clamp((p - 0.05) / 0.03, 0, 1);
      } else if (p < 0.36) {
        handX = 340;
        handNeedleAlpha = 1 - clamp((p - 0.33) / 0.03, 0, 1);
      } else if (p < 0.64) {
        sewnX = lerp(150, 400, easeInOutQuad((p - 0.36) / 0.28));
        handX = sewnX + 14;
        clothNeedleAlpha = clamp((p - 0.36) / 0.03, 0, 1);
      } else if (p < 0.74) {
        sewnX = 400;
        handX = 414;
        clothNeedleAlpha = 1;
      } else if (p < 0.9) {
        sewnX = 400;
        handX = lerp(414, 104, easeInOutQuad((p - 0.74) / 0.16));
        clothNeedleAlpha = 1 - clamp((p - 0.74) / 0.03, 0, 1);
        handNeedleAlpha = clamp((p - 0.76) / 0.03, 0, 1);
      } else {
        handX = 104;
        handNeedleAlpha = 1 - clamp((p - 0.93) / 0.04, 0, 1);
      }
      const seamAlpha = p < 0.88 ? 1 : clamp(1 - (p - 0.88) / 0.12, 0, 1);

      // 布面上的线迹与小斜针脚
      if (sewnX > 152 && seamAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = seamAlpha;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, SEAM_Y);
        ctx.lineTo(sewnX, SEAM_Y);
        ctx.stroke();
        let k = 0;
        for (let sx = 159; sx <= sewnX; sx += 18) {
          k += 1;
          ctx.globalAlpha = seamAlpha * (0.55 + 0.4 * Math.abs(Math.sin(k * 1.8)));
          ctx.beginPath();
          ctx.moveTo(sx - 2, SEAM_Y - 6);
          ctx.lineTo(sx + 2, SEAM_Y + 6);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 针插垫
      ctx.fillStyle = '#76906a';
      ctx.fillRect(38, 44, 112, 84);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(38, 44, 112, 8);
      ctx.save();
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 2;
      ctx.globalAlpha = spareAlpha;
      ctx.beginPath();
      ctx.moveTo(70, 62);
      ctx.lineTo(78, 96);
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let i = 1; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(70 + i * 24, 62);
        ctx.lineTo(78 + i * 24, 96);
        ctx.stroke();
      }
      ctx.restore();

      // 布面正在走针的那一枚（带呼吸浮动与极淡拖影）
      if (clothNeedleAlpha > 0.01) {
        const nbob = Math.sin(now / 300) * 1.2;
        drawNeedle(ctx, sewnX - 10, SEAM_Y + nbob, 32, clothNeedleAlpha * 0.15);
        drawNeedle(ctx, sewnX, SEAM_Y + nbob, 32, clothNeedleAlpha);
      }

      // 手（带呼吸浮动）与其握着的针
      const bob = Math.sin(now / 320) * 1.5;
      drawHand(ctx, handX, HAND_Y + bob);
      drawNeedle(ctx, handX + 10, HAND_Y + 24 + bob, 30, handNeedleAlpha);

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('换一枚针', 20, 26);

      drawLegend(
        ctx,
        [
          { label: '针插垫', color: '#76906a' },
          { label: '布面', color: '#b8c9a7' },
        ],
        400,
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

export default Ana5;
