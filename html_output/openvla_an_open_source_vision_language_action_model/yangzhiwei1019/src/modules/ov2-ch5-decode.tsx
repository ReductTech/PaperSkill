import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench, plank, ink, plane } from './ov2-analogy';

const W = 1080;
const H = 280;
const DIMS = ['Δx', 'Δy', 'Δz', 'Δroll', 'Δpitch', 'Δyaw', '夹爪'];
const BINS = [212, 96, 128, 148, 110, 122, 240];
const START = { x: 130, y: 194 };
const END = { x: 336, y: 166 };

export const Ov2Ch5Decode: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点「下一个 token」，看一次控制量怎么一位一位凑齐。', cls: '' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const s = stateRef.current;
      field(ctx, W, H);
      bench(ctx, W, H, 244);
      plank(ctx, 60, 148, 360, 86);
      ink(ctx, 60, 420, END.y, V.orange);
      const p = s.step / 7;
      const x = START.x + (END.x - START.x) * p;
      const y = START.y + (END.y - START.y) * p;
      if (s.step > 0) {
        ctx.strokeStyle = V.blue;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(START.x, START.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      plane(ctx, x, y + 16, 0.75, 0, V.blue);
      const x0 = 500;
      const gap = 76;
      DIMS.forEach((d, i) => {
        const bx = x0 + i * gap;
        const on = i < s.step;
        ctx.fillStyle = on ? V.green : '#ffffff';
        ctx.strokeStyle = on ? V.green : V.line;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx, 70, 58, 52, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = on ? '#ffffff' : V.muted;
        ctx.font = '700 16px "Segoe UI", sans-serif';
        ctx.fillText(on ? String(BINS[i]) : '—', bx + 12, 102);
        ctx.fillStyle = V.ink;
        ctx.font = '600 13px "Segoe UI", sans-serif';
        ctx.fillText(d, bx + 6, 140);
      });
      const tx0 = 500;
      const tw = 520;
      ctx.strokeStyle = V.line;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(tx0, 212);
      ctx.lineTo(tx0 + tw, 212);
      ctx.stroke();
      ctx.strokeStyle = V.blue;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(tx0, 212);
      ctx.lineTo(tx0 + tw * (s.step / 7), 212);
      ctx.stroke();
      ctx.fillStyle = V.muted;
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('167ms', tx0 + tw - 44, 238);
      ctx.fillText(Math.round((167 * s.step) / 7) + 'ms', tx0, 238);
    });
  }, []);

  const go = (n: number) => {
    stateRef.current.step = n;
    setStep(n);
    if (n === 0) setFb({ text: '重置到一刨之前：七个槽全是空的。', cls: '' });
    else if (n <= 3) setFb({ text: `第 ${n} 位出来了：先定平移（Δx/Δy/Δz），这时还不能动。`, cls: '' });
    else if (n <= 6) setFb({ text: `第 ${n} 位：轮到姿态。末端朝向一点点掰过去，仍然不能动。`, cls: '' });
    else setFb({ text: '第 7 位夹爪到位，七维凑齐才真正下发；一个周期约 167ms，对应约 6Hz。', cls: 'good' });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => go(0)}>
          重置
        </button>
        <button className="tiny" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
          上一个
        </button>
        <span className="step-label">
          <b>{step}</b> / 7
        </span>
        <button className="tiny" onClick={() => go(Math.min(7, step + 1))} disabled={step === 7}>
          下一个 token
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ov2Ch5Decode;
