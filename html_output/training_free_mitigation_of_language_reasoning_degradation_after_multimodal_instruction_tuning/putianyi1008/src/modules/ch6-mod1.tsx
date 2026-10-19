import React, { useState } from 'react';
import { C, stage, rack, num, label, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

const STEPS = ['取权重差', '按幅度裁剪', '按比例加回'];

export const Ch6Mod1: React.FC = () => {
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '第一步：把视觉适配后的语言模型减去基座 LLM，得到任务向量 T。',
    c: '',
  });

  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);

    // three step boxes
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 240;
      rack(ctx, x, 44, 190, 62, i === step ? C.blue : C.axis, i === step);
      if (i !== step) {
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (i === step) {
        const pulse = 3 + Math.sin((now % 1200) / 1200 * Math.PI * 2) * 2;
        ctx.beginPath();
        ctx.arc(x + 24, 75, 6 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = C.blue;
        ctx.fill();
      }
      // step names live in the DOM below; the canvas only marks the active box
    }

    // shape bars: inputs -> T -> trimmed T-hat -> M
    const barY = 150;
    const barH = 22;
    ctx.fillStyle = C.blue;
    ctx.fillRect(90, barY, 380, barH);
    ctx.fillStyle = C.purple;
    ctx.fillRect(90, barY + 34, 380, barH);

    const tLen = step === 0 ? 0 : 380;
    if (tLen > 0) {
      ctx.fillStyle = C.red;
      ctx.fillRect(520, barY, tLen * (step === 1 ? 0.34 : step === 2 ? 0.34 : 1), barH);
    }
    if (step === 2) {
      ctx.fillStyle = C.orange;
      ctx.fillRect(520, barY + 34, 120, barH);
      ctx.fillStyle = C.green;
      ctx.fillRect(900, barY, 90, barH + 34);
    }

    num(ctx, 90, 246, step + 1, C.blue);
    label(ctx, 860, 44, '流程');
  });

  const go = (next: number) => {
    const s = Math.max(0, Math.min(2, next));
    setStep(s);
    setFb(
      s === 0
        ? { t: '第一步：把视觉适配后的语言模型减去基座 LLM，得到任务向量 T。', c: '' }
        : s === 1
        ? {
            t: '第二步：只保留 T 里幅度最大的 top-K 项，其余置零，得到 T̂——对应论文所用的外部库 Mergekit 里 TIES 的 TRIM。',
            c: '',
          }
        : {
            t: '第三步：M = α·T̂ + θ_vlm。整条链路只有权重运算，没有一次梯度更新。',
            c: 'good',
          }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        {STEPS.map((name, i) => (
          <span key={name} className={i === step ? 'step-tag step-tag-active' : 'step-tag'}>
            {i + 1}. {name}
          </span>
        ))}
      </div>
      <div className="ctrl">
        <button className="chip" onClick={() => go(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button className="chip" onClick={() => go(step + 1)} disabled={step === 2}>
          {step === 2 ? '已完成' : '下一步'}
        </button>
        <button className="chip" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch6Mod1;
