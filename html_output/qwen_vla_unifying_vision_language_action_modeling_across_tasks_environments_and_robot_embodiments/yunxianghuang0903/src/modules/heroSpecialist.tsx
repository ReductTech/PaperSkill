import React, { useRef, useState, useEffect } from 'react';
import { C, fillBg } from './sharedDraw';
import { useResponsiveCanvas } from './usePaperCanvas';
import { prefersReducedMotion } from '../lib/motion';
import { CanvasStage } from '../components/ps-controls';
import { HERO_TASK_LABELS } from '../data/terminology';
import type { WidgetProps } from './registry';

const ASPECT = 130 / 460;
const STATIONS = [
  { id: 'manip', color: C.red },
  { id: 'nav', color: C.orange },
  { id: 'ego', color: C.purple },
];

function drawManipIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = C.env;
  ctx.fillRect(-14, 4, 28, 10);
  ctx.strokeStyle = C.depth;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(0, -8);
  ctx.lineTo(16, -18);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(16, -18, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNavIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = C.blue;
  ctx.fillRect(-12, -2, 24, 10);
  ctx.strokeStyle = C.blue;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, -14);
  ctx.lineTo(8, -20);
  ctx.stroke();
  ctx.fillStyle = 'rgba(217,119,6,0.85)';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(14, -8);
  ctx.lineTo(0, -2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEgoIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -10, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 8);
  ctx.moveTo(-8, 2);
  ctx.lineTo(8, 2);
  ctx.moveTo(0, 8);
  ctx.lineTo(-6, 18);
  ctx.moveTo(0, 8);
  ctx.lineTo(6, 18);
  ctx.stroke();
  ctx.restore();
}

export const HeroSpecialist: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const phaseRef = useRef(0);

  activeRef.current = active;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % 3), 1300);
    return () => clearInterval(id);
  }, []);

  useResponsiveCanvas(
    containerRef,
    canvasRef,
    ASPECT,
    (ctx, w, h) => {
      fillBg(ctx, w, h);
      phaseRef.current += 0.04;
      const slots = [w * 0.2, w * 0.5, w * 0.8];
      const taskY = h * 0.28;
      const coreY = h * 0.72;
      const drawers = [drawManipIcon, drawNavIcon, drawEgoIcon];

      slots.forEach((x, i) => {
        const isOn = activeRef.current === i;
        const pulse = isOn ? 0.6 + 0.4 * Math.sin(phaseRef.current * 3) : 0.2;
        drawers[i](ctx, x, taskY, 1);

        ctx.fillStyle = STATIONS[i].color;
        ctx.globalAlpha = 0.12 + pulse * 0.15;
        ctx.beginPath();
        ctx.arc(x, coreY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = STATIONS[i].color;
        ctx.lineWidth = isOn ? 2.5 : 1.5;
        ctx.stroke();

        if (isOn) {
          ctx.strokeStyle = STATIONS[i].color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5 + pulse * 0.4;
          ctx.beginPath();
          ctx.moveTo(x, taskY + 14);
          ctx.lineTo(x, coreY - 22);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      ctx.strokeStyle = C.border;
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(slots[0] + 30, coreY);
      ctx.lineTo(slots[2] - 30, coreY);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [active],
    { animate: true }
  );

  return (
    <div className="hero-panel-widget">
      <CanvasStage aspectW={460} aspectH={130}>
        <div ref={containerRef} className="canvas-stage-inner">
          <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} />
        </div>
      </CanvasStage>
      <div className="hero-station-labels">
        {HERO_TASK_LABELS.map((l, i) => (
          <span key={l} className={active === i ? 'is-active' : ''}>
            {l}
          </span>
        ))}
      </div>
      <div className="hero-panel-dom">
        <p className="hero-panel-caption">不同任务族过去往往依赖各自的专用策略。</p>
      </div>
    </div>
  );
};
export default HeroSpecialist;
