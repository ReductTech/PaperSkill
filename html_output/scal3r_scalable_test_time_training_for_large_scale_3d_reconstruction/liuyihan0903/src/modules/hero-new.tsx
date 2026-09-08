import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero（新方法）—— Scal3R：同一“路变长”驱动下，三段小地图对齐成一张到顶的地图（绿）。
const W = 520;
const H = 200;

interface HeroState {
  t: number;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.6, h * 0.74);
  ctx.quadraticCurveTo(w * 0.85, h * 0.84, w, h * 0.68);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawTrail(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], color = '#92400e', width = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

function drawSummit(ctx: CanvasRenderingContext2D, x: number, y: number, reached = false) {
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x, y - 26);
  ctx.lineTo(x + 16, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y - 40);
  ctx.stroke();
  ctx.fillStyle = reached ? '#e0a712' : '#9aa7b8';
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + 12, y - 36);
  ctx.lineTo(x, y - 32);
  ctx.closePath();
  ctx.fill();
}

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<HeroState>({ t: 0 });
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

    const render = (s: HeroState) => {
      const phase = s.t * 0.1;
      // 与旧方法同步的“路变长”驱动
      const grow = (s.t % 220) / 220;
      // align：三段从错位逐步对齐（0..1），后半程完成拼齐
      const align = Math.min(1, grow / 0.55);
      const done = grow > 0.55;
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      const summitX = W - 54;
      const summitY = 58;
      const startX = 34;
      const startY = 150;

      // 三段小地图（沿到山顶的斜线布局）：错位量随 (1-align) 减小
      const segCount = 3;
      const misalign = (1 - align) * 16;
      for (let k = 0; k < segCount; k++) {
        const f0 = k / segCount;
        const f1 = (k + 1) / segCount;
        const ax = startX + f0 * (summitX - startX);
        const ay = startY + f0 * (summitY - startY);
        const bx = startX + f1 * (summitX - startX);
        const by = startY + f1 * (summitY - startY);
        // 独立抖动逐渐收敛
        const jitter = Math.sin(s.t * 0.3 + k) * misalign;
        const col = done ? '#228d5c' : '#27446e';
        const pts = [
          { x: ax, y: ay + jitter },
          { x: (ax + bx) / 2, y: (ay + by) / 2 - jitter * 0.5 },
          { x: bx, y: by + jitter * 0.3 },
        ];
        drawTrail(ctx, pts, col, 4);
        // 段端桩
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(ax, ay + jitter, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 完成时：一条绿色连续路 + 记录本图示
      if (done) {
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= 30; i++) {
          const f = i / 30;
          pts.push({
            x: startX + f * (summitX - startX),
            y: startY + f * (summitY - startY) + Math.sin(f * Math.PI * 3 + phase) * 3,
          });
        }
        drawTrail(ctx, pts, '#228d5c', 4);
      }

      drawSummit(ctx, summitX, summitY, done);

      // 中央共享记录本示意
      const bx = 150;
      const by = 96;
      ctx.fillStyle = '#fffef8';
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.fillRect(bx, by, 40, 48);
      ctx.strokeRect(bx, by, 40, 48);
      ctx.beginPath();
      ctx.moveTo(bx + 20, by);
      ctx.lineTo(bx + 20, by + 48);
      ctx.stroke();

      ctx.fillStyle = done ? '#228d5c' : '#68778f';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(done ? 'Scal3R：拼齐登顶' : 'Scal3R：分块 + 共享记录本', 20, 22);
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroNew;
