import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle } from './waterKit';

const steps = [
  { title: '① SPH 估计密度', feedback: 'PBF 保留 SPH 的邻域核函数：先在预测位置 p* 上估计局部密度。' },
  { title: '② 密度写成约束', feedback: '把“密度应等于静止密度”写成 Cᵢ(p*) = ρᵢ / ρ₀ − 1 = 0。' },
  { title: '③ PBD 直接投影', feedback: '不先求压力力；根据约束得到 Δp，直接修正过密的预测位置。' },
];

const crowded = [[106, 117], [146, 113], [186, 119], [125, 151], [165, 148], [205, 152]];
const corrected = [[96, 110], [151, 110], [206, 110], [96, 158], [151, 158], [206, 158]];

export const PbfOldNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 700, 270);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const draw = () => {
      ctx.clearRect(0, 0, 700, 270);
      ctx.fillStyle = WATER.page;
      ctx.fillRect(0, 0, 700, 270);

      const card = (x: number, title: string, index: number, color: string) => {
        const active = step === index;
        ctx.fillStyle = active ? '#eef7ff' : '#ffffff';
        ctx.strokeStyle = active ? color : WATER.line;
        ctx.lineWidth = active ? 3 : 1.2;
        ctx.beginPath();
        ctx.roundRect(x, 25, 204, 192, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? color : WATER.ink;
        ctx.font = '800 15px Segoe UI';
        ctx.fillText(title, x + 14, 53);
      };
      card(20, '① SPH 估计密度', 0, WATER.user);
      card(248, '② 写成密度约束', 1, WATER.aux);
      card(476, '③ PBD 位置投影', 2, WATER.good);

      crowded.forEach(([x, y]) => drawWaterParticle(ctx, x, y, 9, WATER.user));
      ctx.fillStyle = step === 0 ? WATER.bad : WATER.muted;
      ctx.font = '800 13px Segoe UI';
      ctx.fillText('预测位置 p*：ρᵢ > ρ₀', 56, 191);

      ctx.fillStyle = '#f7f4ff';
      ctx.strokeStyle = step === 1 ? WATER.aux : WATER.line;
      ctx.lineWidth = step === 1 ? 2.5 : 1.1;
      ctx.beginPath();
      ctx.roundRect(270, 87, 160, 63, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = step === 1 ? WATER.aux : WATER.ink;
      ctx.font = '800 15px Segoe UI';
      ctx.fillText('Cᵢ(p*) = ρᵢ / ρ₀ − 1', 284, 114);
      ctx.font = '700 13px Segoe UI';
      ctx.fillText('目标：Cᵢ = 0', 316, 137);
      drawArrow(ctx, { x: 226, y: 122 }, { x: 246, y: 122 }, WATER.guide, 2.4);

      corrected.forEach(([x, y], index) => {
        const [oldX, oldY] = crowded[index];
        if (step === 2) drawArrow(ctx, { x: 495 + oldX - 86, y: oldY }, { x: 495 + x - 86, y }, WATER.good, 1.8);
        drawWaterParticle(ctx, 495 + x - 86, y, 9, step === 2 ? WATER.mid : WATER.bright);
      });
      ctx.fillStyle = step === 2 ? WATER.good : WATER.muted;
      ctx.font = '800 13px Segoe UI';
      ctx.fillText('p* ← p* + Δp，密度回到目标', 490, 191);
      drawArrow(ctx, { x: 454, y: 122 }, { x: 474, y: 122 }, WATER.guide, 2.4);

      ctx.fillStyle = WATER.ink;
      ctx.font = '800 15px Segoe UI';
      ctx.fillText('PBF：用 SPH 估计密度，用 PBD 修正预测位置', 150, 249);
      canvas.classList.add('is-ready');
    };
    draw();
    return observeCanvas(canvas, draw, () => undefined);
  }, [step]);

  return (
    <div>
      <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章模块 ${moduleId}：${steps[step].feedback}`} />
      <div className="ctrl talk-chip-row" role="group" aria-label="查看 PBF 的三步组合">
        {steps.map((item, index) => (
          <button key={item.title} type="button" className={`tiny ${step === index ? 'primary' : 'ghost'}`} onClick={() => setStep(index)}>{item.title}</button>
        ))}
      </div>
      <p className={`feedback ${step === 2 ? 'good' : step === 0 ? 'bad' : ''}`} aria-live="polite">{steps[step].feedback}</p>
    </div>
  );
};
