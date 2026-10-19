import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field } from './ov2-analogy';

const W = 1080;
const H = 280;

/* 四个训练决定，数值全部出自 Sec.3.4 / 3.5 */
const DECISIONS = [
  {
    name: '训练 epoch',
    usual: '1–2 个（VLM 常规）',
    chosen: '27 个',
    why: '动作 token 准确率要超过 95%，真实机器人性能才停止上升。',
    cls: 'good',
  },
  {
    name: '学习率',
    usual: '需要 warmup 与衰减',
    chosen: '固定 2e-5',
    why: '扫了多个数量级，2e-5（与 VLM 预训练一致）最好；warmup 没有收益。',
    cls: '',
  },
  {
    name: '输入分辨率',
    usual: '384×384 更强',
    chosen: '224×224',
    why: '本文实验中两者没有性能差异，而 384 训练慢 3 倍。这条结论作者自己说尚未在 VLA 普遍成立。',
    cls: '',
  },
  {
    name: '视觉编码器',
    usual: '冻结（VLM 常见做法）',
    chosen: '一起微调',
    why: '冻结视觉的微调成功率只有 47.0%，全参数是 69.7%，说明位置精度必须为目标场景重新适配。',
    cls: 'good',
  },
];

export const Ov2Ch4Decisions: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(0);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: DECISIONS[0].why, cls: 'good' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const s = stateRef.current;
      field(ctx, W, H);
      DECISIONS.forEach((d, i) => {
        const y = 40 + i * 54;
        const on = i === s;
        ctx.fillStyle = on ? '#eef3fa' : '#ffffff';
        ctx.strokeStyle = on ? V.blue : V.line;
        ctx.lineWidth = on ? 2.4 : 1.3;
        ctx.beginPath();
        ctx.roundRect(60, y, 960, 44, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = on ? V.blue : V.ink;
        ctx.font = '600 16px "Segoe UI", sans-serif';
        ctx.fillText(d.name, 78, y + 28);
        ctx.fillStyle = V.muted;
        ctx.font = '600 14px "Segoe UI", sans-serif';
        ctx.fillText(d.usual, 300, y + 28);
        ctx.fillStyle = on ? V.green : V.muted;
        ctx.font = '700 16px "Segoe UI", sans-serif';
        ctx.fillText(d.chosen, 620, y + 28);
        if (i < s) {
          ctx.strokeStyle = V.green;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(88, y + 22, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    });
  }, []);

  const go = (n: number) => {
    stateRef.current = n;
    setStep(n);
    setFb({ text: DECISIONS[n].why, cls: DECISIONS[n].cls });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
          上一条
        </button>
        <span className="step-label">
          <b>{step + 1}</b> / 4
        </span>
        <button className="tiny" onClick={() => go(Math.min(3, step + 1))} disabled={step === 3}>
          下一条
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ov2Ch4Decisions;
