import React, { useState } from 'react';
import { C, stage, rack, meter, label, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

type Src = 'llm' | 'vlm' | 'merged';

const DATA: Record<Src, { lang: number; vis: number; color: string; slot: number }> = {
  // Illustrative, unitless capability levels: language and vision are separate axes
  // and are deliberately NOT summed into a single score.
  llm: { lang: 1.0, vis: 0.0, color: C.blue, slot: 0 },
  vlm: { lang: 0.92, vis: 0.86, color: C.purple, slot: 1 },
  merged: { lang: 0.99, vis: 0.88, color: C.green, slot: 2 },
};

const FB: Record<Src, { t: string; c: string }> = {
  llm: {
    t: '只读第一段：这是没有任何视觉适配的纯语言能力，作为全部比较的基准。',
    c: '',
  },
  vlm: {
    t: '第二段是视觉适配新写入的偏移——视觉能力从无到有，语言那条却短了一点。',
    c: 'bad',
  },
  merged: {
    t: '把两段按比例合起来：语言回到接近基准，视觉仍然保留。',
    c: 'good',
  },
};

export const Ch2Mod1: React.FC = () => {
  const [src, setSrc] = useState<Src>('llm');
  const [fb, setFb] = useState(FB.llm);

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const d = DATA[src];

    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 130;
      rack(ctx, x, 70, 106, 110, i === d.slot ? d.color : C.axis, i === d.slot);
      if (i !== d.slot) {
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // baseline reference line at the base-LLM language level
    const bx = 470;
    const bw = 520;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.5, 66);
    ctx.lineTo(bx + bw * 0.5, 218);
    ctx.stroke();

    meter(ctx, bx, 96, bw, 26, d.lang, d.color);
    meter(ctx, bx, 160, bw, 26, d.vis, C.green);

    label(ctx, 90, 42, '权重来源');
    legend(ctx, 470, 244, [
      ['基座', C.blue],
      ['视觉适配', C.purple],
      ['合并', C.green],
    ]);
  });

  const pick = (s: Src) => {
    setSrc(s);
    setFb(FB[s]);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className={src === 'llm' ? 'chip active' : 'chip'} onClick={() => pick('llm')}>
          纯语言基座
        </button>
        <button className={src === 'vlm' ? 'chip active' : 'chip'} onClick={() => pick('vlm')}>
          视觉适配后
        </button>
        <button className={src === 'merged' ? 'chip active' : 'chip'} onClick={() => pick('merged')}>
          按比例合并
        </button>
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        两条能力条（语言 / 视觉）是无量纲的机制示意，不是论文测量值；语言与视觉是两条独立的轴，本模块刻意不相加成一个总分。
        论文的真实数字见第 3、7、10 章的表格。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch2Mod1;
