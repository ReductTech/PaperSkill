import React, { useState } from 'react';
import { C, stage, fader, label, legend, num, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

const langAt = (a: number) => 0.68 + Math.min(0.075, a * 0.2);
const visAt = (a: number) => {
  const x = a / 100;
  if (x <= 0.1) return 0.86 + x * 2.4;
  return Math.max(0.06, 1.1 - Math.pow((x - 0.1) * 1.55, 1.45));
};

export const Ch4Mod2: React.FC = () => {
  const [a, setA] = useState(0);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '还没混合：语言停在退化后的水平。',
    c: '',
  });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const left = 90;
    const right = 700;
    const top = 44;
    const bottom = 150;

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();

    const px = (v: number) => left + (v / 100) * (right - left);
    const py = (v: number) => bottom - v * (bottom - top - 10);

    for (const [fn, color] of [
      [langAt, C.blue],
      [visAt, C.green],
    ] as Array<[(v: number) => number, string]>) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let v = 0; v <= 100; v += 2) {
        const x = px(v);
        const y = py(fn(v));
        if (v === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // current alpha cursor
    const cx = px(a);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top - 6);
    ctx.lineTo(cx, bottom + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, py(langAt(a)), 6, 0, Math.PI * 2);
    ctx.fillStyle = C.blue;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, py(visAt(a)), 6, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.fill();

    num(ctx, 730, 80, langAt(a), C.blue);
    num(ctx, 730, 120, visAt(a), C.green);
    label(ctx, left, 26, '混合量');

    fader(ctx, 900, 60, 150, a / 100, C.orange);
    legend(ctx, 90, 246, [
      ['语言', C.blue],
      ['视觉', C.green],
      ['当前', C.orange],
    ]);
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setA(v);
    if (v === 0) {
      setFb({ t: '还没混合：语言停在退化后的水平。', c: '' });
    } else if (v <= 20) {
      setFb({
        t: '混合量还小的时候，语言在回升而视觉几乎没受影响——这正是论文推荐的区间方向。',
        c: 'good',
      });
    } else if (v < 50) {
      setFb({ t: '已经开始交换：语言继续靠近基座，视觉在加速下滑。', c: '' });
    } else {
      setFb({
        t: '混合量过大：模型已经偏离它原本的视觉适配状态，视觉能力明显受损。',
        c: 'bad',
      });
    }
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          混合量 α(%) <span className="val">{a}</span>
        </label>
        <input type="range" min={0} max={100} step={1} value={a} onChange={onChange} />
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        两条曲线是按论文第 5 章与 Figure 1(b) 的端点走势画出的机制示意，不是论文数值；纵轴为归一化后的能力水平。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch4Mod2;
