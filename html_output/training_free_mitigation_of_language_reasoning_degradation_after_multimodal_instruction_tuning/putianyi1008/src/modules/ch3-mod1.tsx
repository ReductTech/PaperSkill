import React, { useState } from 'react';
import { C, stage, arrow, num, label, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// Paper Table 2 / Figure 1(a): base Mistral-7B vs LLaVA-1.6-Mistral (alpha = 0).
const TASKS: Array<{ key: string; base: number; mllm: number }> = [
  { key: 'ARC-E', base: 0.813, mllm: 0.782 },
  { key: 'Race-H', base: 0.4612, mllm: 0.4459 },
  { key: 'OBQA', base: 0.356, mllm: 0.314 },
  { key: 'GSM8k', base: 0.395, mllm: 0.3282 },
  { key: 'Hella', base: 0.6602, mllm: 0.5971 },
  { key: 'MMLU', base: 0.5901, mllm: 0.5783 },
  { key: 'CQA', base: 0.6683, mllm: 0.7215 },
  { key: 'Wino', base: 0.7371, mllm: 0.712 },
];

const Y0 = 0.1;
const Y1 = 0.8;

export const Ch3Mod1: React.FC = () => {
  const [task, setTask] = useState(0);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '这一项也在退化，但幅度小于 GSM8k——退化不是均匀的。',
    c: 'bad',
  });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const left = 90;
    const right = 940;
    const top = 40;
    const bottom = 214;
    const scale = (v: number) => bottom - ((v - Y0) / (Y1 - Y0)) * (bottom - top);

    // axes
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(left - 22, top);
    ctx.lineTo(left - 22, bottom);
    ctx.lineTo(right + 40, bottom);
    ctx.stroke();
    for (let g = 0; g <= 4; g++) {
      const v = Y0 + ((Y1 - Y0) * g) / 4;
      const y = scale(v);
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(left - 22, y);
      ctx.lineTo(right + 40, y);
      ctx.stroke();
    }

    const slot = (right - left) / 8;
    for (let i = 0; i < 8; i++) {
      const cx = left + slot * i + 6;
      const bh = bottom - scale(TASKS[i].base);
      const mh = bottom - scale(TASKS[i].mllm);
      ctx.fillStyle = C.blue;
      ctx.fillRect(cx, scale(TASKS[i].base), 22, bh);
      ctx.fillStyle = C.red;
      ctx.fillRect(cx + 26, scale(TASKS[i].mllm), 22, mh);

      if (i === task) {
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cx - 8, top - 6, 62, bottom - top + 12);
      }
    }

    // degradation gap arrow for the selected task
    const t = TASKS[task];
    const cx = left + slot * task + 6;
    const yb = scale(t.base);
    const ym = scale(t.mllm);
    arrow(ctx, cx + 44, Math.min(yb, ym), cx + 44, Math.max(yb, ym), t.mllm >= t.base ? C.green : C.red);

    num(ctx, left + slot * task + 17, 240, t.base, C.blue);
    num(ctx, left + slot * task + 43, 240, t.mllm, C.red);

    label(ctx, left - 22, 24, '语言任务');
    legend(ctx, 560, 252, [
      ['基座', C.blue],
      ['多模态', C.red],
      ['落差', C.orange],
    ]);
  });

  const pick = (i: number) => {
    setTask(i);
    if (i === 3) {
      setFb({ t: '这一项掉得最多：数学推理是三个模型共同退化的地方。', c: 'bad' });
    } else if (i === 6) {
      setFb({ t: '唯一反超的一项：视觉训练反而让常识问答变好了。', c: 'good' });
    } else {
      setFb({ t: '这一项也在退化，但幅度小于 GSM8k——退化不是均匀的。', c: 'bad' });
    }
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        {TASKS.map((t, i) => (
          <button key={t.key} className={i === task ? 'chip active' : 'chip'} onClick={() => pick(i)}>
            {t.key}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch3Mod1;
