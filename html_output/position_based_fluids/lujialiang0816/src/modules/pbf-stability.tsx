import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle, drawWaterSurface } from './waterKit';

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  stress: number,
  phase: number,
  projected: boolean,
) {
  const residual = projected ? 0.16 + stress * 0.003 : 0.3 + stress * 0.013;
  const centerY = 118;
  const surface = Array.from({ length: 7 }, (_, index) => ({
    x: x0 + 24 + index * 32,
    y: centerY + Math.sin(index * 1.16 + phase) * residual * 12,
  }));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 + 12, 37, 232, 158);
  ctx.clip();
  drawWaterSurface(ctx, surface, 192, projected ? WATER.bright : '#4aa7d1', 0.77);
  surface.forEach((point, index) => {
    const clump = projected ? 0 : Math.max(0, stress - 45) * 0.08 * (index > 3 ? -1 : 1);
    drawWaterParticle(ctx, point.x + clump, point.y + 34 + (index % 2) * 15, 6, projected ? WATER.mid : '#4b9fc8');
  });
  ctx.restore();

  ctx.strokeStyle = WATER.guide;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x0 + 19, centerY);
  ctx.lineTo(x0 + 235, centerY);
  ctx.stroke();
  ctx.setLineDash([]);
  const arrowColor = projected ? WATER.good : WATER.bad;
  [0, 1, 2].forEach((index) => {
    const x = x0 + 184 + index * 15;
    drawArrow(ctx, { x, y: 60 + index * 12 }, { x: x - (projected ? 3 : 22), y: 84 + index * 10 }, arrowColor, 2.5);
  });
  ctx.strokeStyle = arrowColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x0 + 12, 37, 232, 158);
}

export const PbfStability: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stress, setStress] = useState(42);
  const [resetNote, setResetNote] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 240);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const started = performance.now();
    let raf = 0;
    let running = false;
    const draw = (now: number) => {
      const phase = reduced ? 1.4 : ((now - started) % 3200) / 3200 * Math.PI * 2;
      ctx.clearRect(0, 0, 560, 240);
      ctx.fillStyle = WATER.page;
      ctx.fillRect(0, 0, 560, 240);
      drawPanel(ctx, 12, stress, phase, false);
      drawPanel(ctx, 292, stress, phase, true);
      ctx.fillStyle = WATER.ink;
      ctx.font = '700 13px Segoe UI';
      ctx.fillText('传统压力力路径', 24, 24);
      ctx.fillText('PBF 位置约束路径', 304, 24);
      ctx.fillStyle = WATER.muted;
      ctx.font = '12px Segoe UI';
      ctx.fillText(`归一化应力 ${stress}`, 218, 224);
      canvas.classList.add('is-ready');
    };
    const loop = (now: number) => {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    draw(performance.now());
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (running) return;
        running = true;
        if (reduced) draw(performance.now());
        else raf = requestAnimationFrame(loop);
      },
      () => {
        running = false;
        cancelAnimationFrame(raf);
      },
    );
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      disconnect();
    };
  }, [stress]);

  const level = stress < 35 ? '低' : stress < 70 ? '中' : '高';
  const feedback = resetNote
    ? '已恢复到同一初始状态。'
    : stress < 35
      ? '低应力示意：两条路径的自由表面残差都较小。'
      : stress < 70
        ? '中等应力示意：压力力路径出现更明显的表面与密度波动，PBF 仍逐轮回投。'
        : '高应力示意：这里只比较机制，不给出跨场景稳定阈值。';

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`第 ${chapterId} 章模块 ${moduleId}：归一化应力 ${stress}，${level}档；左侧为压力力路径，右侧为 PBF 位置约束。`}
      />
      <div className="ctrl">
        <label htmlFor={`stress-${chapterId}-${moduleId}`}>归一化应力（教学示意）</label>
        <input
          id={`stress-${chapterId}-${moduleId}`}
          type="range"
          min="0"
          max="100"
          step="1"
          value={stress}
          aria-valuetext={`${level}档，归一化输入 ${stress}`}
          onChange={(event) => {
            setStress(Number(event.target.value));
            setResetNote(false);
          }}
        />
        <span className="val">{stress}</span>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => {
            setStress(42);
            setResetNote(true);
          }}
        >
          重置
        </button>
      </div>
      <p className="step-desc">归一化教学输入，不是时间步、CFL 条件或论文稳定阈值。</p>
      <p className={`feedback ${stress >= 70 && !resetNote ? 'bad' : ''}`} aria-live="polite">{feedback}</p>
    </div>
  );
};
