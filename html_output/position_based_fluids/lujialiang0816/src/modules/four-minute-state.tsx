import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle, drawWaterSurface } from './waterKit';

function chapterNumber(chapterId: string) {
  return Number(chapterId.replace(/\D/g, '')) || 1;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = WATER.ink) {
  ctx.fillStyle = color;
  ctx.font = '700 14px Segoe UI';
  ctx.fillText(text, x, y);
}

function drawState(ctx: CanvasRenderingContext2D, chapter: number, phase: number) {
  ctx.clearRect(0, 0, 660, 210);
  ctx.fillStyle = WATER.page;
  ctx.fillRect(0, 0, 660, 210);

  if (chapter === 1) {
    const cycle = ((phase % 6.4) + 6.4) % 6.4;
    const fall = Math.min(1, cycle / 2.2);
    const compress = Math.max(0, Math.min(1, (cycle - 2.2) / 1.8));
    const recover = Math.max(0, Math.min(1, (cycle - 4) / 1.5));
    const startY = [36 + fall * 43, 100, 137, 174];
    const compressedY = [91, 119, 147, 175];
    const restoredY = [34, 81, 128, 175];
    const layerY = cycle < 2.2
      ? startY
      : cycle < 4
        ? startY.map((y, index) => y + (compressedY[index] - y) * compress)
        : compressedY.map((y, index) => y + (restoredY[index] - y) * recover);
    const densityRatio = cycle < 2.2 ? 1 : cycle < 4 ? 1 + 0.18 * compress : 1.18 - 0.18 * recover;

    layerY.forEach((y, row) => {
      for (let col = 0; col < 7; col += 1) {
        drawWaterParticle(ctx, 54 + col * 48, y, 7, cycle >= 2.2 && cycle < 4 ? WATER.user : row === 0 ? WATER.bright : WATER.mid);
      }
    });
    drawArrow(ctx, { x: 408, y: 42 }, { x: 408, y: 82 }, cycle >= 2.2 && cycle < 4 ? WATER.bad : WATER.guide, 3);
    label(ctx, '一层水垂直下压三层水', 36, 24, WATER.guide);
    label(ctx, '撞击区密度', 450, 52);
    ctx.fillStyle = '#dfe9f3';
    ctx.fillRect(450, 68, 150, 22);
    ctx.fillStyle = densityRatio > 1.08 ? WATER.bad : WATER.good;
    ctx.fillRect(450, 68, 78 + (densityRatio - 1) * 340, 22);
    label(ctx, cycle < 2.2 ? '外力（重力等）' : cycle < 4 ? '四层向下压缩' : '压力恢复层间距', 450, 118, densityRatio > 1.08 ? WATER.bad : WATER.good);
    label(ctx, `ρ / ρ₀ = ${densityRatio.toFixed(2)}`, 470, 154, densityRatio > 1.08 ? WATER.bad : WATER.good);
  } else if (chapter === 2) {
    const stage = Math.floor((((phase % 6) + 6) % 6) / 2);
    const floorY = 158;
    ctx.fillStyle = '#d9f1fb';
    ctx.fillRect(76, floorY, 276, 20);
    ctx.fillStyle = WATER.mid;
    ctx.fillRect(76, floorY, 276, 4);
    label(ctx, '不可穿透边界', 164, 193, WATER.guide);
    if (stage === 0) {
      drawWaterParticle(ctx, 214, 55, 11, WATER.bright);
      drawArrow(ctx, { x: 214, y: 76 }, { x: 214, y: 122 }, WATER.guide, 3);
      label(ctx, '① 外力预测 p*', 82, 28, WATER.guide);
    } else if (stage === 1) {
      drawWaterParticle(ctx, 214, 55, 11, WATER.bright, 0.25);
      drawWaterParticle(ctx, 214, 184, 11, WATER.user);
      drawArrow(ctx, { x: 214, y: 78 }, { x: 214, y: 173 }, WATER.user, 2.6, true);
      label(ctx, '② p* 违反边界约束', 82, 28, WATER.bad);
    } else {
      drawWaterParticle(ctx, 214, 184, 11, WATER.user, 0.2);
      drawWaterParticle(ctx, 214, 142, 11, WATER.mid);
      drawArrow(ctx, { x: 214, y: 178 }, { x: 214, y: 149 }, WATER.good, 3);
      label(ctx, '③ 直接投影到合法位置', 82, 28, WATER.good);
      label(ctx, '由位置差回算速度', 408, 112, WATER.aux);
    }
    label(ctx, 'PBD：预测 → 投影 → 回算速度', 382, 64, WATER.ink);
  } else if (chapter === 3) {
    const stages = [
      ['ρᵢ', '估计密度'], ['Cᵢ', '写成约束'], ['λᵢ', '求修正强度'], ['Δpᵢ', '移动粒子'],
    ];
    stages.forEach(([sym, text], index) => {
      const x = 34 + index * 156;
      ctx.fillStyle = index === Math.floor((phase % (Math.PI * 2)) / (Math.PI * 0.5)) ? '#e7f6ff' : '#ffffff';
      ctx.strokeStyle = [WATER.mid, WATER.bad, WATER.aux, WATER.good][index];
      ctx.lineWidth = 3;
      ctx.fillRect(x, 58, 128, 92);
      ctx.strokeRect(x, 58, 128, 92);
      label(ctx, sym, x + 49, 91, ctx.strokeStyle);
      ctx.fillStyle = WATER.muted;
      ctx.font = '13px Segoe UI';
      ctx.fillText(text, x + 22, 126);
      if (index < stages.length - 1) drawArrow(ctx, { x: x + 132, y: 104 }, { x: x + 151, y: 104 }, WATER.guide, 2);
    });
    label(ctx, '公式不是四个孤立结论，而是一条求解链', 170, 188, WATER.guide);
  } else if (chapter === 4) {
    const titles = ['结团', '涡旋衰减', '速度不协调'];
    titles.forEach((title, index) => {
      const x = 24 + index * 212;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = WATER.line;
      ctx.fillRect(x, 42, 192, 126);
      ctx.strokeRect(x, 42, 192, 126);
      label(ctx, title, x + 18, 68, WATER.bad);
      label(ctx, ['s_corr', 'Vorticity', 'XSPH'][index], x + 104, 148, WATER.good);
      drawArrow(ctx, { x: x + 70, y: 112 }, { x: x + 122, y: 112 }, WATER.good, 3);
      if (index === 0) {
        [[48, 95], [60, 101], [53, 113]].forEach(([dx, dy]) => drawWaterParticle(ctx, x + dx, dy, 6));
        [140, 158, 176].forEach((dx) => drawWaterParticle(ctx, x + dx, 106, 6));
      } else if (index === 1) {
        ctx.strokeStyle = WATER.good;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + 154, 106, 22, 0.2, Math.PI * 1.7);
        ctx.stroke();
      } else {
        [-16, 0, 16].forEach((dy) => drawArrow(ctx, { x: x + 130, y: 106 + dy }, { x: x + 174, y: 106 + dy }, WATER.good, 3));
      }
    });
  } else if (chapter === 5) {
    for (let index = 0; index < 22; index += 1) {
      const x = 36 + (index % 11) * 22;
      const y = 78 + Math.floor(index / 11) * 38 + Math.sin(phase + index) * 5;
      drawWaterParticle(ctx, x, y, 6);
    }
    drawArrow(ctx, { x: 292, y: 105 }, { x: 362, y: 105 }, WATER.guide, 4);
    drawWaterSurface(ctx, [
      { x: 400, y: 90 }, { x: 448, y: 74 }, { x: 496, y: 86 }, { x: 544, y: 67 }, { x: 610, y: 88 },
    ], 158, WATER.mid, 0.9);
    label(ctx, '离散粒子', 92, 38, WATER.guide);
    label(ctx, 'SDF / 连续网格 / 水材质', 408, 38, WATER.good);
  } else {
    const nodes = ['密度', '约束', '投影', '补偿', '水面'];
    nodes.forEach((text, index) => {
      const x = 24 + index * 128;
      ctx.fillStyle = index === 4 ? '#e5f8f1' : '#edf5ff';
      ctx.strokeStyle = index === 4 ? WATER.good : WATER.guide;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, 78, 104, 54, 12);
      ctx.fill();
      ctx.stroke();
      label(ctx, text, x + 34, 111, index === 4 ? WATER.good : WATER.guide);
      if (index < nodes.length - 1) drawArrow(ctx, { x: x + 106, y: 105 }, { x: x + 124, y: 105 }, WATER.guide, 2);
    });
    label(ctx, 'PBF：从密度约束到连续水面的完整链条', 164, 44, WATER.ink);
  }
}

export const FourMinuteState: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 660, 210);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const start = performance.now();
    let raf = 0;
    let running = false;
    const draw = (now: number) => {
      drawState(ctx, chapterNumber(chapterId), reduced ? 0.8 : (now - start) / 850);
      canvas.classList.add('is-ready');
    };
    const loop = (now: number) => {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    draw(start);
    const disconnect = observeCanvas(canvas, () => {
      running = true;
      raf = requestAnimationFrame(loop);
    }, () => {
      running = false;
      cancelAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(raf);
      disconnect();
    };
  }, [chapterId]);

  return <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章的机制预览，模块 ${moduleId}`} />;
};
