import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, dot, label, metric } from './yolo-shared';

const W = 720;
const H = 330;
const stages = [
  { name: '全部空间点', count: 36 },
  { name: '几何候选', count: 14 },
  { name: 'TAL 首轮 top-k = 7', count: 7 },
  { name: '第二轮 top-k = 1', count: 1 },
];

export const AssignmentSteps: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clear(ctx, W, H);
    label(ctx, '全部空间点 → 几何候选 → 首轮 7 个 → 唯一正样本', 28, 30, C.text, 15, 700);
    stages.forEach((stage, index) => {
      const x = 40 + index * 155;
      ctx.strokeStyle = index <= step ? C.blue : C.border;
      ctx.lineWidth = index <= step ? 4 : 2;
      if (index < 3) {
        ctx.beginPath();
        ctx.moveTo(x + 48, 78);
        ctx.lineTo(x + 142, 78);
        ctx.stroke();
      }
      ctx.fillStyle = index < step ? C.green : index === step ? C.orange : '#fff';
      ctx.beginPath();
      ctx.arc(x + 30, 78, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = index <= step ? C.blue : C.border;
      ctx.lineWidth = 2;
      ctx.stroke();
      label(ctx, String(index + 1), x + 25, 78, index <= step ? '#fff' : C.muted, 12, 700);
      label(ctx, stage.name, x, 111, index === step ? C.blue : C.muted, 11, 600);
    });

    ctx.fillStyle = '#fff';
    ctx.fillRect(28, 145, 465, 145);
    const count = stages[step].count;
    for (let index = 0; index < 36; index += 1) {
      const x = 52 + (index % 9) * 45;
      const y = 166 + Math.floor(index / 9) * 29;
      dot(ctx, x, y, index < count ? (step === 3 ? C.green : C.blue) : C.border, index < count ? 4 : 2.5);
    }
    metric(ctx, 520, 160, 170, '当前候选数', String(count), step === 3 ? C.green : C.blue);
    metric(ctx, 520, 226, 170, '当前阶段', `${step + 1} / 4`, C.orange);
    canvas.classList.add('is-ready');
  }, [step]);

  const feedback = step === 3
    ? '第二轮 top-k=1 只留下一个正样本，形成 one to one 分配。'
    : `当前是“${stages[step].name}”：候选集合继续缩减。`;

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="one to one 正样本筛选步骤" />
      <div className="ctrl">
        <button onClick={() => setStep(value => Math.max(0, value - 1))} disabled={step === 0}>上一步</button>
        <button onClick={() => setStep(value => Math.min(3, value + 1))} disabled={step === 3}>下一步</button>
        <button onClick={() => setStep(0)}>重置</button>
        <span className="val">{step + 1} / 4</span>
      </div>
      <div className={`feedback ${step === 3 ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};
