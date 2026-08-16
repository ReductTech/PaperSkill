import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle } from './waterKit';

type Point = { x: number; y: number };

const TARGETS: Point[] = [
  { x: 48, y: 79 }, { x: 88, y: 72 }, { x: 128, y: 80 }, { x: 168, y: 72 }, { x: 208, y: 80 },
  { x: 68, y: 119 }, { x: 108, y: 113 }, { x: 148, y: 121 }, { x: 188, y: 113 },
];

const PREDICTED: Point[] = [
  { x: 70, y: 84 }, { x: 102, y: 77 }, { x: 130, y: 87 }, { x: 156, y: 79 }, { x: 184, y: 88 },
  { x: 84, y: 119 }, { x: 113, y: 112 }, { x: 143, y: 123 }, { x: 174, y: 115 },
];

let sharedHeroStart: number | null = null;

function mixPoint(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

function oldOutcome(predicted: Point, target: Point): Point {
  return {
    x: target.x + (target.x - predicted.x) * 0.58,
    y: target.y + (target.y - predicted.y) * 0.58,
  };
}

function drawTarget(ctx: CanvasRenderingContext2D, point: Point, strong = false) {
  ctx.save();
  ctx.strokeStyle = strong ? WATER.good : 'rgba(20,130,95,.35)';
  ctx.lineWidth = strong ? 2.2 : 1.25;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, strong ? 10 : 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDensityPill(ctx: CanvasRenderingContext2D, ratio: string, bad: boolean) {
  ctx.fillStyle = bad ? '#fdecef' : '#e5f7ef';
  ctx.strokeStyle = bad ? WATER.bad : WATER.good;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(168, 28, 88, 22, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = bad ? WATER.bad : WATER.good;
  ctx.font = '700 10.5px Segoe UI';
  ctx.fillText(`ρ/ρ₀ = ${ratio}`, 179, 43);
}

function drawTrajectory(ctx: CanvasRenderingContext2D, start: Point, target: Point, end: Point) {
  ctx.save();
  ctx.strokeStyle = WATER.bad;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(target.x - 3, target.y - 22, end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
  drawArrow(ctx, target, end, WATER.bad, 2.4);
  ctx.restore();
}

export const PbfHero: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const old = moduleId === 'old';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 270, 180);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (sharedHeroStart === null) sharedHeroStart = performance.now();
    const started = sharedHeroStart;
    let raf = 0;
    let running = false;

    const draw = (now: number) => {
      const elapsed = reduced ? 6400 : (now - started) % 8000;
      const commonStage = elapsed < 1800;
      const correctionStage = elapsed >= 1800 && elapsed < 5200;
      const correctionT = Math.max(0, Math.min(1, (elapsed - 1800) / 3400));
      const oldMove = correctionStage ? correctionT : elapsed >= 5200 ? 1 : 0;
      const iteration = correctionStage ? Math.min(3, Math.floor(correctionT * 3) + 1) : elapsed >= 5200 ? 3 : 0;
      const pbfProgress = [0, 0.46, 0.76, 0.96][iteration];

      ctx.clearRect(0, 0, 270, 180);
      ctx.fillStyle = WATER.page;
      ctx.fillRect(0, 0, 270, 180);

      const title = commonStage
        ? '① 同一过密预测状态'
        : correctionStage
          ? old ? '② 压力先改变速度' : '② 直接投影位置'
          : old ? '③ 仍有位置错位' : '③ 接近密度约束';
      ctx.fillStyle = commonStage ? WATER.user : old ? WATER.bad : WATER.good;
      ctx.font = '800 12px Segoe UI';
      ctx.fillText(title, 14, 18);

      TARGETS.forEach((point, index) => drawTarget(ctx, point, index === 3));

      const positions = PREDICTED.map((point, index) => {
        if (commonStage) return point;
        if (old) return mixPoint(point, oldOutcome(point, TARGETS[index]), oldMove);
        return mixPoint(point, TARGETS[index], pbfProgress);
      });

      positions.forEach((point, index) => {
        const highlight = index === 3;
        drawWaterParticle(
          ctx,
          point.x,
          point.y,
          highlight ? 8.5 : 6.5,
          commonStage ? WATER.user : highlight ? old ? WATER.bad : WATER.good : WATER.mid,
          0.96,
        );
      });

      if (commonStage) {
        ctx.fillStyle = WATER.muted;
        ctx.font = '10px Segoe UI';
        ctx.fillText('虚线圆 = 满足约束的目标位置', 54, 153);
        drawDensityPill(ctx, '1.18', true);
      } else if (old) {
        const subject = 3;
        const from = PREDICTED[subject];
        const target = TARGETS[subject];
        const end = oldOutcome(from, target);
        drawTrajectory(ctx, from, target, mixPoint(from, end, oldMove));
        drawArrow(ctx, { x: 28, y: 51 }, { x: 72, y: 51 }, WATER.bad, 2.4);
        ctx.fillStyle = WATER.bad;
        ctx.font = '700 10px Segoe UI';
        ctx.fillText('pressure → Δv', 80, 55);
        drawDensityPill(ctx, elapsed >= 5200 ? '1.10' : '1.14', true);
        ctx.fillStyle = WATER.bad;
        ctx.font = '700 10px Segoe UI';
        ctx.fillText('经 v 积分到 p；Δt 会影响错位', 48, 157);
      } else {
        const subject = 3;
        const current = positions[subject];
        if (iteration < 3) drawArrow(ctx, current, TARGETS[subject], WATER.good, 2.6);
        ctx.fillStyle = WATER.good;
        ctx.font = '700 10px Segoe UI';
        ctx.fillText(`C(p*) → Δp　Jacobi 第 ${iteration} 轮`, 50, 157);
        drawDensityPill(ctx, ['1.18', '1.10', '1.05', '1.02'][iteration], iteration < 2);
      }

      ctx.fillStyle = WATER.muted;
      ctx.font = '9.5px Segoe UI';
      ctx.fillText(commonStage ? '两边从完全相同的问题出发' : old ? '间接纠正：先改速度，再得到位置' : '直接纠正：位置沿约束梯度移动', 14, 174);
      canvas.classList.add('is-ready');
    };

    const loop = (now: number) => {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    draw(performance.now());
    const disconnect = observeCanvas(canvas, () => {
      if (running) return;
      running = true;
      if (reduced) draw(performance.now());
      else raf = requestAnimationFrame(loop);
    }, () => {
      running = false;
      cancelAnimationFrame(raf);
    });
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      disconnect();
    };
  }, [old]);

  const caption = old
    ? '同一过密预测状态下，压力先改变速度，再经时间积分得到位置；红色轨迹标出可能保留的错位。'
    : '同一过密预测状态下，PBF 直接投影粒子位置，并用多轮 Jacobi 逐步降低密度误差。';

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${old ? '传统 SPH' : 'PBF'} 三阶段求解路径。${caption}`}
      />
      <p className={`feedback ${old ? 'bad' : 'good'}`}>{caption}</p>
    </div>
  );
};
