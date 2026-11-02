import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawRoad,
  drawVehicle,
  drawDriver,
  drawLicense,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  EMPH,
  PAINT,
} from './drivingKit';
import type { WidgetProps } from './registry';

// Hero 新法：一位司机把多种车型的经验攒成一本通用驾照，再迁移到新车，最后亮绿灯。自动循环 3.2s。

const W = 560;
const H = 200;

const KNOWN = [
  { kind: 'sedan', x: 64, y: 76 },
  { kind: 'truck', x: 156, y: 76 },
  { kind: 'van', x: 64, y: 146 },
  { kind: 'moto', x: 164, y: 146 },
];

const ARROW_P0 = { x: 302, y: 116 };
const ARROW_C = { x: 350, y: 110 };
const ARROW_P2 = { x: 394, y: 152 };

const arrowPoint = (u: number) => {
  const x =
    (1 - u) * (1 - u) * ARROW_P0.x + 2 * (1 - u) * u * ARROW_C.x + u * u * ARROW_P2.x;
  const y =
    (1 - u) * (1 - u) * ARROW_P0.y + 2 * (1 - u) * u * ARROW_C.y + u * u * ARROW_P2.y;
  return { x, y };
};

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = ((now - t0) / 3200) % 1;
      clearScene(ctx, W, H);

      drawSceneLabel(ctx, '已有车型', 24, 30);
      drawRoad(ctx, 378, 148, 164, 34, false);

      // 四种车型的经验流向同一位司机
      for (let i = 0; i < KNOWN.length; i++) {
        const v = KNOWN[i];
        const appear = clamp((t - i * 0.025) / 0.16, 0, 1);
        ctx.save();
        ctx.globalAlpha = appear;
        drawVehicle(ctx, v.x, v.y, v.kind, 0.55, PAINT);
        ctx.restore();

        const la = clamp((t - 0.06 - i * 0.03) / 0.18, 0, 1);
        if (la > 0) {
          ctx.save();
          ctx.globalAlpha = la * 0.9;
          ctx.strokeStyle = GUIDE;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(v.x, v.y - 12);
          ctx.lineTo(252, 108);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 司机与那本通用驾照
      drawDriver(ctx, 274, 118, 1.0, GUIDE);
      drawLicense(ctx, 246, 52, 50, 28, GUIDE);

      if (t > 0.16 && t < 0.52) {
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin((t - 0.16) * Math.PI * 5));
        ctx.strokeStyle = EMPH;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(271, 66, 33, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 经验迁往新车
      const a = clamp((t - 0.42) / 0.24, 0, 1);
      if (a > 0) {
        ctx.save();
        ctx.strokeStyle = OK;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(ARROW_P0.x, ARROW_P0.y);
        const steps = 22;
        for (let s = 1; s <= steps; s++) {
          const p = arrowPoint((s / steps) * a);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        const tip = arrowPoint(a);
        const prev = arrowPoint(Math.max(0, a - 0.04));
        const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
        ctx.fillStyle = OK;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tip.x - 11 * Math.cos(ang - 0.45), tip.y - 11 * Math.sin(ang - 0.45));
        ctx.lineTo(tip.x - 11 * Math.cos(ang + 0.45), tip.y - 11 * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 新车开动，成功迁移
      const bq = clamp((t - 0.64) / 0.24, 0, 1);
      const bx = 412 + 56 * easeOutCubic(bq);
      drawVehicle(ctx, bx, 178, 'bus', 0.6, PAINT);
      drawSceneLabel(ctx, '新车', 452, 140);

      const ca = clamp((t - 0.82) / 0.1, 0, 1);
      if (ca > 0) {
        ctx.save();
        ctx.globalAlpha = ca;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(502, 128);
        ctx.lineTo(510, 137);
        ctx.lineTo(524, 118);
        ctx.stroke();
        ctx.restore();
      }

      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '跨车型经验' },
          { color: OK, text: '迁移成功' },
        ],
        24,
        194
      );
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
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

export default HeroNew;
