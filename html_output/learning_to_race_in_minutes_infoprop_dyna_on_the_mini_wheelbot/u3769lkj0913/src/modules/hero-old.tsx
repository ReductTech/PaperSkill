import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero (old method): a ghost kart in a simulator monitor follows one line while the
// real kart on the real track follows another — the sim-to-real gap, marked with a red X.
const W = 520;
const H = 240;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function kart(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, accent: string, ghost = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  if (ghost) ctx.setLineDash([4, 3]);
  ctx.fillStyle = ghost ? 'rgba(255,255,255,0.6)' : '#ffffff';
  ctx.strokeStyle = ghost ? C.blue : C.ink;
  ctx.lineWidth = 2;
  rr(ctx, -11, -6, 22, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.ink;
  ctx.fillRect(-8, -9, 5, 3);
  ctx.fillRect(3, -9, 5, 3);
  ctx.fillRect(-8, 6, 5, 3);
  ctx.fillRect(3, 6, 5, 3);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(2, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function tpoint(cx: number, cy: number, rx: number, ry: number, t: number) {
  const a = t * Math.PI * 2 - Math.PI / 2;
  return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), ang: Math.atan2(ry * Math.cos(a), -rx * Math.sin(a)) };
}

const HERO_OLD_TIP =
  '传统路线：先在仿真器里训练策略，再迁移到现实。接触与打滑难以建模，sim-to-real 差距让策略在现实赛道上失效。';

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tip, setTip] = useState<string | null>(null);
  const tipTimer = useRef<number | null>(null);

  const showTip = () => {
    setTip(HERO_OLD_TIP);
    if (tipTimer.current !== null) window.clearTimeout(tipTimer.current);
    tipTimer.current = window.setTimeout(() => setTip(null), 3600);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    let t0 = 0;

    const render = (time: number) => {
      const t = (time % 3.6) / 3.6;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // Left: simulator monitor with a dashed ideal line and a ghost kart
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      rr(ctx, 30, 50, 190, 130, 8);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.blue;
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(125, 115, 70, 42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const g = tpoint(125, 115, 70, 42, t);
      kart(ctx, g.x, g.y, g.ang, C.blue, true);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('仿真器', 30, 44);

      // Right: real track with a real kart on a deviating (red) line
      ctx.strokeStyle = C.track;
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.ellipse(375, 125, 95, 58, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(375, 125, 95, 58, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const p = tpoint(375, 125, 95 + 14 * Math.sin(i * 0.7), 58 + 10 * Math.cos(i * 0.5), i / 40);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      const rp = tpoint(375, 125, 95 + 14 * Math.sin(t * 40 * 0.7), 58 + 10 * Math.cos(t * 40 * 0.5), t);
      kart(ctx, rp.x, rp.y, rp.ang, C.red);
      ctx.fillStyle = C.muted;
      ctx.fillText('现实', 330, 44);

      // Middle: red X marking the gap
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(248, 110);
      ctx.lineTo(272, 134);
      ctx.moveTo(272, 110);
      ctx.lineTo(248, 134);
      ctx.stroke();
    };

    const tick = (now: number) => {
      if (!t0) t0 = now;
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      if (tipTimer.current !== null) window.clearTimeout(tipTimer.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={showTip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showTip();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="点击查看传统方法简介"
      />
      {tip ? <div className="hero-tip">{tip}</div> : null}
    </div>
  );
};

export default HeroOld;
