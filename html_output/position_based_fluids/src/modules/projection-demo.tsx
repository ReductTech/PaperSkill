import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle } from './waterKit';

const stages = [
  { title: '① 外力预测', feedback: '外力先更新速度，再得到候选位置 p*；此时还没有处理边界约束。' },
  { title: '② 发现违反约束', feedback: '预测位置穿过不可穿透边界，因此碰撞约束 C_coll(p*) < 0。' },
  { title: '③ 直接投影位置', feedback: 'PBD 不先计算碰撞力，而是把 p* 直接投影到满足 C_coll ≥ 0 的位置。' },
  { title: '④ 由位移回算速度', feedback: '用修正后的位置与旧位置之差回算速度，再提交这一帧的位置。' },
];

export const ProjectionDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => setStage((value) => (value + 1) % stages.length), 1750);
    return () => window.clearInterval(timer);
  }, [auto]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 700, 330);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';

    const draw = () => {
      const floorY = 236;
      const x = 232;
      ctx.clearRect(0, 0, 700, 330);
      ctx.fillStyle = WATER.page;
      ctx.fillRect(0, 0, 700, 330);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = WATER.line;
      ctx.lineWidth = 1.4;
      ctx.fillRect(22, 44, 416, 252);
      ctx.strokeRect(22, 44, 416, 252);
      ctx.fillStyle = WATER.ink;
      ctx.font = '800 16px Segoe UI';
      ctx.fillText('一枚 PBD 粒子的一个时间步', 42, 30);

      ctx.fillStyle = '#d9f1fb';
      ctx.fillRect(54, floorY, 352, 22);
      ctx.fillStyle = WATER.mid;
      ctx.fillRect(54, floorY, 352, 5);
      ctx.fillStyle = WATER.guide;
      ctx.font = '700 13px Segoe UI';
      ctx.fillText('不可穿透边界：C_coll ≥ 0', 133, 278);

      if (stage === 0) {
        drawWaterParticle(ctx, x, 92, 14, WATER.bright);
        drawArrow(ctx, { x, y: 118 }, { x, y: 170 }, WATER.guide, 3.2);
        ctx.fillStyle = WATER.guide;
        ctx.font = '700 13px Segoe UI';
        ctx.fillText('外力（重力等）', 252, 143);
        ctx.fillStyle = WATER.muted;
        ctx.fillText('从 xⁿ 预测候选位置 p*', 132, 199);
      } else if (stage === 1) {
        drawWaterParticle(ctx, x, 92, 14, WATER.bright, 0.24);
        ctx.setLineDash([6, 5]);
        drawArrow(ctx, { x, y: 112 }, { x, y: 267 }, WATER.user, 2.5, true);
        ctx.setLineDash([]);
        drawWaterParticle(ctx, x, 267, 14, WATER.user);
        ctx.fillStyle = WATER.bad;
        ctx.font = '800 14px Segoe UI';
        ctx.fillText('p* 穿过边界：违反约束', 113, 204);
      } else {
        drawWaterParticle(ctx, x, 267, 14, WATER.user, 0.24);
        drawWaterParticle(ctx, x, 219, 14, WATER.mid);
        drawArrow(ctx, { x, y: 261 }, { x, y: 226 }, WATER.good, 3.5);
        ctx.fillStyle = WATER.good;
        ctx.font = '800 14px Segoe UI';
        ctx.fillText(stage === 2 ? '直接投影到合法位置 p_corr' : 'p_corr 已满足边界约束', 103, 186);
        if (stage === 3) {
          drawArrow(ctx, { x: 276, y: 219 }, { x: 346, y: 219 }, WATER.aux, 2.8);
          ctx.fillStyle = WATER.aux;
          ctx.font = '700 12px Segoe UI';
          ctx.fillText('由位置差回算速度', 269, 205);
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = WATER.line;
      ctx.fillRect(464, 44, 214, 252);
      ctx.strokeRect(464, 44, 214, 252);
      ctx.fillStyle = WATER.ink;
      ctx.font = '800 16px Segoe UI';
      ctx.fillText('PBD 的核心循环', 485, 73);
      stages.forEach((item, index) => {
        const y = 95 + index * 42;
        const active = index === stage;
        ctx.fillStyle = active ? '#e7f6ef' : '#f3f7fb';
        ctx.strokeStyle = active ? (index === 1 ? WATER.bad : index >= 2 ? WATER.good : WATER.guide) : WATER.line;
        ctx.lineWidth = active ? 2.4 : 1.1;
        ctx.beginPath();
        ctx.roundRect(482, y, 177, 31, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? ctx.strokeStyle : WATER.muted;
        ctx.font = '700 12px Segoe UI';
        ctx.fillText(item.title, 493, y + 20);
      });
      ctx.fillStyle = stage < 2 ? WATER.guide : WATER.good;
      ctx.font = '700 12px Segoe UI';
      if (stage === 0) {
        ctx.fillText('v* = vⁿ + Δt a_ext', 487, 277);
      } else if (stage === 1) {
        ctx.fillText('C_coll(p*) < 0', 511, 277);
      } else if (stage === 2) {
        ctx.fillText('p_corr = Project(p*)', 493, 277);
      } else {
        ctx.fillText('vⁿ⁺¹ = (p_corr − xⁿ) / Δt', 473, 277);
      }
      canvas.classList.add('is-ready');
    };

    draw();
    return observeCanvas(canvas, draw, () => undefined);
  }, [stage]);

  return (
    <div>
      <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章模块 ${moduleId}：${stages[stage].feedback}`} />
      <div className="ctrl talk-chip-row">
        <button type="button" className="tiny primary" onClick={() => { setAuto(false); setStage((value) => (value + 1) % stages.length); }}>下一步</button>
        <button type="button" className="tiny ghost" onClick={() => setAuto((value) => !value)}>{auto ? '暂停自动演示' : '自动演示'}</button>
        <span className="val">{stages[stage].title}</span>
      </div>
      <p className={`feedback ${stage >= 2 ? 'good' : stage === 1 ? 'bad' : ''}`} aria-live="polite">{stages[stage].feedback}</p>
    </div>
  );
};
