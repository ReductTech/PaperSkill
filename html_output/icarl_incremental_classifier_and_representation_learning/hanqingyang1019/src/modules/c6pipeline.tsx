import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, rr, arrow, dot, line, type WidgetProps } from './kit';

// Chapter 6.1 — three inference steps, advanced by one button.
const STAGES = ['输入图片', '提取特征 φ(x)', '计算 t 个原型', '取最近的原型'];
const FEEDBACK = [
  '图片进入网络，还没有发生任何分类。',
  '第一步：用当前特征提取器把图片变成 L2 归一化的向量。',
  '第二步：对每个已见类，把该类样本的特征求平均，得到原型 μ_y。',
  '第三步：比较距离，argmin 给出预测；整个过程只做一次前向和 t 次距离计算。',
];

export const C6Pipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    const boxes = [100, 340, 580, 820];
    boxes.forEach((x, i) => {
      const active = step === i + 1;
      const done = step > i + 1;
      const color = active ? C.blue : done ? C.green : C.border;
      rr(ctx, x, 78, 180, 124, 14, active ? 'rgba(39,68,110,0.10)' : done ? 'rgba(34,141,92,0.08)' : 'rgba(255,255,255,0.7)', color, active || done ? 3 : 1);

      if (i === 0) {
        line(ctx, x + 90, 176, x + 90, 128, C.dark, 4);
        line(ctx, x + 90, 150, x + 116, 136, C.dark, 4);
        line(ctx, x + 90, 140, x + 64, 126, C.dark, 4);
      } else if (i === 1) {
        [0, 1, 2, 3, 4].forEach((k) => {
          const h = 22 + ((k * 17) % 52);
          ctx.fillStyle = done || active ? C.blue : C.light;
          ctx.fillRect(x + 48 + k * 18, 176 - h, 10, h);
        });
      } else if (i === 2) {
        [0, 1, 2].forEach((k) => {
          const cx = x + 62 + k * 28;
          dot(ctx, cx, 148, 9, [C.blue, C.purple, C.orange][k], C.white, 2);
        });
        txt(ctx, 't=5', x + 90, 182, done || active ? C.text : C.muted, 15, 'center', '600');
      } else {
        [0, 1, 2].forEach((k) => {
          ctx.beginPath();
          ctx.arc(x + 90, 142, 14 + k * 14, 0, Math.PI * 2);
          ctx.strokeStyle = done || active ? C.green : C.border;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        if (done) dot(ctx, x + 90, 142, 6, C.green);
      }

      if (i < 3) arrow(ctx, x + 182, 140, x + 238, 140, step > i + 1 ? C.green : C.border, 2);
    });

    line(ctx, 100, 236, 1000, 236, 'rgba(118,144,106,0.35)', 2);
    c.classList.add('is-ready');
  }, [step]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip selected" onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={step >= 4}>
          下一步
        </button>
        <button className="chip" onClick={() => setStep(0)}>
          重来
        </button>
        <span className="val">
          {step === 0 ? STAGES[0] : STAGES[step - 1]}（{step}/4）
        </span>
      </div>
      <div className={`feedback ${step >= 4 ? 'good' : ''}`}>{step === 0 ? '点“下一步”开始走一次完整推理。' : FEEDBACK[step - 1]}</div>
    </div>
  );
};

export default C6Pipeline;
