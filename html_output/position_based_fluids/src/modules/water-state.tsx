import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterDrop, drawWaterParticle, drawWaterSurface } from './waterKit';

const SCENES: Record<number, { label: string; goal: string }> = {
  1: { label: '预测水滴回投到密度可行域', goal: '比较力积分与位置投影' },
  2: { label: '核支持域内的局部粒子采样', goal: '明确密度求和范围' },
  3: { label: '预测点沿约束梯度回投', goal: '观察局部线性化' },
  4: { label: '邻域响应决定约束乘子尺度', goal: '理解 λ 与 ε' },
  5: { label: '自由表面近邻从聚团到均匀', goal: '诊断人工压力' },
  6: { label: '单帧数据依次通过求解阶段', goal: '区分每步与每轮操作' },
  7: { label: '密度残差随 Jacobi 轮次传播', goal: '观察局部收敛' },
  8: { label: '粒子状态在双缓冲间并行更新', goal: '理解 GPU 数据流' },
  9: { label: '同一速度场的涡量与 XSPH 后处理', goal: '区分两种收尾机制' },
  10: { label: 'PBF 粒子重建为连续水面', goal: '连接 Houdini 表面化流程' },
};

const BASE_POINTS = [
  [48, 86], [72, 73], [96, 89], [120, 68], [145, 82], [170, 72], [196, 88], [220, 67],
] as const;

function drawScene(ctx: CanvasRenderingContext2D, id: number, phase: number) {
  ctx.clearRect(0, 0, 270, 130);
  ctx.fillStyle = WATER.page;
  ctx.fillRect(0, 0, 270, 130);
  ctx.strokeStyle = WATER.line;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8, 8, 254, 114);

  if (id === 1) {
    const predicted = { x: 196, y: 47 + Math.sin(phase * Math.PI * 2) * 8 };
    const corrected = { x: 145, y: 80 };
    drawWaterDrop(ctx, predicted.x, predicted.y, 10, 0.9);
    drawArrow(ctx, predicted, corrected, WATER.good, 3, true);
    drawWaterSurface(ctx, [
      { x: 30, y: 89 }, { x: 72, y: 84 }, { x: 112, y: 88 }, { x: 152, y: 81 }, { x: 200, y: 86 }, { x: 240, y: 83 },
    ], 112);
    ctx.strokeStyle = WATER.guide;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(corrected.x, corrected.y, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (id === 2) {
    const center = { x: 135, y: 67 };
    ctx.strokeStyle = WATER.guide;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 47, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    BASE_POINTS.forEach(([x, y], index) => {
      const inside = Math.hypot(x - center.x, y - center.y) < 48;
      drawWaterParticle(ctx, x, y, inside ? 7 : 5, inside ? WATER.bright : WATER.mid, inside ? 1 : 0.32);
      if (inside && index % 2 === 0) drawArrow(ctx, { x, y }, center, WATER.guide, 1.5);
    });
    drawWaterParticle(ctx, center.x, center.y, 9, WATER.user);
  } else if (id === 3) {
    ctx.strokeStyle = WATER.guide;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(135, 72, 82, 32, 0, 0, Math.PI * 2);
    ctx.stroke();
    const start = { x: 205, y: 30 };
    const t = 0.25 + phase * 0.65;
    const end = { x: start.x + (174 - start.x) * t, y: start.y + (58 - start.y) * t };
    drawWaterParticle(ctx, start.x, start.y, 8, WATER.user, 0.45);
    drawArrow(ctx, start, end, WATER.good, 3);
    drawWaterParticle(ctx, end.x, end.y, 9, WATER.bright);
    ctx.strokeStyle = WATER.aux;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(90, 25);
    ctx.lineTo(198, 111);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (id === 4) {
    const response = 0.2 + phase * 0.75;
    BASE_POINTS.slice(1, 7).forEach(([x, y]) => {
      drawWaterParticle(ctx, x, y, 7, WATER.mid);
      drawArrow(ctx, { x, y }, { x: 135, y: 70 }, WATER.guide, 1 + response * 1.5);
    });
    drawWaterParticle(ctx, 135, 70, 10, WATER.user);
    ctx.fillStyle = WATER.ink;
    ctx.font = '700 14px Cascadia Code, monospace';
    ctx.fillText(`λ = ${(-0.24 / (response * response + 0.04)).toFixed(2)}`, 178, 111);
  } else if (id === 5) {
    const spread = 0.18 + phase * 0.82;
    const targets = [[58, 73], [84, 88], [111, 68], [138, 87], [165, 67], [192, 86], [218, 70]];
    targets.forEach(([targetX, targetY], index) => {
      const baseX = 116 + (index % 3) * 12;
      const baseY = 70 + Math.floor(index / 3) * 12;
      drawWaterParticle(ctx, baseX + (targetX - baseX) * spread, baseY + (targetY - baseY) * spread, 8, WATER.mid);
    });
    ctx.strokeStyle = spread > 0.7 ? WATER.good : WATER.bad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(45, 105);
    ctx.lineTo(228, 105);
    ctx.stroke();
  } else if (id === 6) {
    const nodes = ['预测', '邻域', 'Jacobi', '速度'];
    nodes.forEach((label, index) => {
      const x = 20 + index * 61;
      ctx.fillStyle = index === Math.floor(phase * 4) ? '#d9efff' : '#ffffff';
      ctx.strokeStyle = index === Math.floor(phase * 4) ? WATER.guide : WATER.line;
      ctx.fillRect(x, 42, 48, 38);
      ctx.strokeRect(x, 42, 48, 38);
      ctx.fillStyle = WATER.ink;
      ctx.font = '600 11px Segoe UI';
      ctx.fillText(label, x + 8, 66);
      if (index < nodes.length - 1) drawArrow(ctx, { x: x + 49, y: 61 }, { x: x + 60, y: 61 }, WATER.guide, 1.5);
    });
    drawWaterParticle(ctx, 32 + phase * 185, 98, 8, WATER.bright);
  } else if (id === 7) {
    const residual = 1 - phase * 0.82;
    const points = BASE_POINTS.map(([x, y], index) => ({
      x,
      y: 79 + Math.sin(index * 1.35) * 19 * residual,
    }));
    drawWaterSurface(ctx, points, 112, WATER.mid, 0.78);
    ctx.strokeStyle = WATER.guide;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(38, 79);
    ctx.lineTo(232, 79);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (id === 8) {
    ['pᵏ', 'λᵢ, Δpᵢ', 'pᵏ⁺¹'].forEach((label, index) => {
      const x = 23 + index * 86;
      ctx.fillStyle = index === 1 ? '#e9e6ff' : '#e1f3ff';
      ctx.strokeStyle = index === 1 ? WATER.aux : WATER.guide;
      ctx.fillRect(x, 40, 66, 42);
      ctx.strokeRect(x, 40, 66, 42);
      ctx.fillStyle = WATER.ink;
      ctx.font = '700 12px Cascadia Code, monospace';
      ctx.fillText(label, x + 10, 65);
      if (index < 2) drawArrow(ctx, { x: x + 67, y: 61 }, { x: x + 84, y: 61 }, WATER.guide, 2);
    });
    for (let index = 0; index < 6; index += 1) {
      drawWaterParticle(ctx, 55 + index * 30, 100 + (index % 2) * 7, 5, index <= Math.floor(phase * 6) ? WATER.bright : WATER.mid, 0.85);
    }
  } else if (id === 9) {
    BASE_POINTS.slice(0, 7).forEach(([x, y], index) => {
      drawWaterParticle(ctx, x, y, 6, WATER.mid);
      const angle = index * 0.8 + phase * Math.PI * 2;
      drawArrow(ctx, { x, y }, { x: x + Math.cos(angle) * 15, y: y + Math.sin(angle) * 15 }, index % 2 ? WATER.good : WATER.aux, 1.8);
    });
    ctx.strokeStyle = WATER.guide;
    ctx.beginPath();
    ctx.arc(135, 76, 40, 0.2, Math.PI * 1.65);
    ctx.stroke();
  } else {
    BASE_POINTS.forEach(([x, y], index) => drawWaterParticle(ctx, x, y, 6, WATER.mid, 1 - phase * 0.55));
    const points = BASE_POINTS.map(([x, y], index) => ({ x, y: 76 + Math.sin(index * 0.9 + phase) * 7 }));
    drawWaterSurface(ctx, points, 112, WATER.bright, 0.25 + phase * 0.72);
    ctx.fillStyle = WATER.ink;
    ctx.font = '700 11px Segoe UI';
    ctx.fillText('points → SDF → polygons → water shader', 28, 24);
  }
}

export const WaterState: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const id = Math.max(1, Math.min(10, Number(chapterId.replace('chap-', '')) || 1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 270, 130);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const started = performance.now();
    let raf = 0;
    let running = false;
    const paint = (now: number) => {
      const phase = reduced ? 0.72 : ((now - started) % 3200) / 3200;
      drawScene(ctx, id, phase);
      canvas.classList.add('is-ready');
    };
    const loop = (now: number) => {
      if (!running) return;
      paint(now);
      raf = requestAnimationFrame(loop);
    };
    paint(performance.now());
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (running) return;
        running = true;
        if (reduced) paint(performance.now());
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
  }, [id]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`第 ${id} 章粒子态预览：${SCENES[id].label}；目标是${SCENES[id].goal}。`}
      style={{ width: 270, maxWidth: '100%', height: 'auto' }}
    />
  );
};
