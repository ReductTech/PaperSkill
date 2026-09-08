import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle, drawWaterSurface } from './waterKit';

const steps = [
  { label: '密度误差', color: WATER.bad, line: '不可压缩性要求局部密度接近静止密度。' },
  { label: '位置约束', color: WATER.guide, line: 'PBF 将密度误差写成预测位置上的非线性约束。' },
  { label: 'Jacobi 投影', color: WATER.good, line: 'Jacobi 迭代沿约束梯度逐轮修正粒子位置。' },
  { label: '细节补偿', color: WATER.aux, line: '人工压力、涡量约束与 XSPH 分别改善结团、旋转耗散和速度不协调。' },
  { label: '连续水面', color: WATER.mid, line: 'Houdini 将 PBF 输出的离散粒子重建为可渲染的连续水面。' },
];

function drawCenteredWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines: string[] = [];
  let current = '';

  Array.from(text).forEach((character) => {
    const candidate = current + character;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);

  ctx.textAlign = 'center';
  lines.forEach((line, index) => ctx.fillText(line, centerX, startY + index * lineHeight));
  ctx.textAlign = 'start';
}

export const TalkRecap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 720, 270);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.clearRect(0, 0, 720, 270);
    ctx.fillStyle = WATER.page;
    ctx.fillRect(0, 0, 720, 270);
    steps.forEach((step, index) => {
      const x = 26 + index * 139;
      const selected = index <= active;
      ctx.fillStyle = selected ? '#ffffff' : '#edf2f7';
      ctx.strokeStyle = selected ? step.color : WATER.line;
      ctx.lineWidth = selected ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x, 78, 112, 68, 13);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = selected ? step.color : WATER.muted;
      ctx.font = '800 14px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(step.label, x + 56, 119);
      ctx.textAlign = 'start';
      if (index < steps.length - 1) drawArrow(ctx, { x: x + 114, y: 112 }, { x: x + 135, y: 112 }, selected ? WATER.guide : WATER.line, 2);
    });
    if (active === 0) {
      [300, 330, 360].forEach((x) => drawWaterParticle(ctx, x, 205, 8, WATER.user));
    } else if (active === 4) {
      drawWaterSurface(ctx, [{ x: 260, y: 218 }, { x: 330, y: 198 }, { x: 400, y: 214 }, { x: 470, y: 192 }], 244, WATER.mid, 0.8);
    } else {
      ctx.fillStyle = steps[active].color;
      ctx.font = '800 21px Segoe UI';
      const lineWidth = 610;
      const needsTwoLines = ctx.measureText(steps[active].line).width > lineWidth;
      drawCenteredWrappedText(ctx, steps[active].line, 360, needsTwoLines ? 205 : 220, lineWidth, 28);
    }
    ctx.fillStyle = WATER.ink;
    ctx.font = '800 19px Segoe UI';
    ctx.fillText('PBF 的完整因果链', 270, 42);
    canvas.classList.add('is-ready');
  }, [active]);

  return (
    <div>
      <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章模块 ${moduleId}，总结链当前停在 ${steps[active].label}`} />
      <div className="talk-recap-buttons" role="group" aria-label="PBF 核心因果链">
        {steps.map((step, index) => (
          <button key={step.label} type="button" className={active === index ? 'active' : ''} onClick={() => setActive(index)}>{index + 1}. {step.label}</button>
        ))}
      </div>
      <p className="feedback good" aria-live="polite">{steps[active].line}</p>
      <div className="talk-reflections">
        <article><strong>物理目标</strong><span>不可压缩性被表述为每个粒子的密度约束。</span></article>
        <article><strong>数值方法</strong><span>位置投影负责恢复目标密度，补偿项改善运动细节。</span></article>
        <article><strong>工程管线</strong><span>PBF 输出粒子，Houdini 完成连续表面与光学表现。</span></article>
      </div>
    </div>
  );
};
