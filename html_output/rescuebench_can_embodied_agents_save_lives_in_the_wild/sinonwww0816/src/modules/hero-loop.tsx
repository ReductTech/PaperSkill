import { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f7faf6', ink: '#21324a', muted: '#68778f', line: '#d7deea',
  blue: '#27446e', green: '#228d5c', orange: '#d97706', red: '#c43f52',
};

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, active = false) {
  ctx.font = '700 14px "Segoe UI", sans-serif';
  const width = ctx.measureText(text).width + 22;
  rounded(ctx, x, y, width, 30, 15);
  ctx.fillStyle = active ? C.blue : '#ffffff';
  ctx.fill();
  ctx.strokeStyle = active ? C.blue : C.line;
  ctx.stroke();
  ctx.fillStyle = active ? '#ffffff' : C.muted;
  ctx.fillText(text, x + 11, y + 20);
}

function drawAgent(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
}

export function HeroLoop(_: WidgetProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = 760;
    const H = 300;
    const ctx = setupCanvas(canvas, W, H);
    let raf: number | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = (time: number) => {
      const seconds = reduced ? 6.8 : (time % 8000) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      rounded(ctx, 0, 0, W, H, 18);
      ctx.fill();

      const navigationPhase = seconds < 3.5;
      const transition = seconds >= 3 && seconds < 4;
      ctx.globalAlpha = transition ? Math.max(0.16, Math.abs(seconds - 3.5) * 2) : 1;

      if (navigationPhase) {
        ctx.fillStyle = C.muted;
        ctx.font = '700 13px "Segoe UI", sans-serif';
        ctx.fillText('已知目标导航', 28, 34);
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(74, 156);
        ctx.bezierCurveTo(250, 80, 470, 214, 675, 126);
        ctx.stroke();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 4;
        ctx.setLineDash([9, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        const t = Math.min(1, seconds / 2.8);
        const x = 74 + (675 - 74) * t;
        const y = 156 - 30 * Math.sin(t * Math.PI * 2) * (1 - t * .35);
        drawAgent(ctx, x, y);
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(675, 126, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 14px "Segoe UI", sans-serif';
        ctx.fillText('G', 669, 131);
        label(ctx, '已知目标', 78, 218, true);
        label(ctx, '沿路导航', 290, 218, seconds > 1.1);
        label(ctx, '成功到达', 510, 218, seconds > 2.35);
      } else {
        ctx.fillStyle = C.muted;
        ctx.font = '700 13px "Segoe UI", sans-serif';
        ctx.fillText('搜索救援连续流程', 28, 34);

        const cx = 190;
        const cy = 132;
        ctx.fillStyle = 'rgba(39, 68, 110, .08)';
        [118, 86, 54].forEach((radius, i) => {
          ctx.beginPath();
          ctx.arc(cx, cy, radius, -0.8 + i * .22, 0.8 + i * .14);
          ctx.lineTo(cx, cy);
          ctx.fill();
        });
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 7]);
        [-0.68, 0, 0.68].forEach((angle) => {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * 126, cy + Math.sin(angle) * 126);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        const searchT = (seconds - 4) / 4;
        drawAgent(ctx, cx + Math.sin(searchT * Math.PI * 2) * 54, cy + Math.cos(searchT * Math.PI * 2) * 22);
        ctx.fillStyle = C.red;
        ctx.font = '900 34px Georgia, serif';
        ctx.fillText('?', 310, 102);

        const stages = ['搜索', '救援', '返回', '交接'];
        stages.forEach((stage, i) => {
          const x = 384 + i * 86;
          const revealed = searchT > i * .16;
          label(ctx, stage, x, 112, revealed);
          if (i < 3) {
            ctx.fillStyle = revealed ? C.blue : C.line;
            ctx.font = '800 18px sans-serif';
            ctx.fillText('→', x + 70, 132);
          }
        });
        ctx.fillStyle = searchT > .64 ? C.ink : C.muted;
        ctx.font = '800 18px "Segoe UI", sans-serif';
        ctx.fillText('导航完成，任务就完成了吗？', 382, 202);
        ctx.fillStyle = C.muted;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('目标未知，搜索、救援、返回与交接必须连续成立。', 382, 234);
      }

      ctx.globalAlpha = 1;
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    const start = () => { if (raf === null) raf = requestAnimationFrame(draw); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    if (reduced) draw(6800);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={ref} className="hero-loop-canvas" width={760} height={300} />;
}
