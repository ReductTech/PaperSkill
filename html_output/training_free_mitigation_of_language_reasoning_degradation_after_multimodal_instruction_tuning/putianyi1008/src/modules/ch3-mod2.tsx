import React, { useState } from 'react';
import { C, stage, label, legend, num, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// All values are the paper's own accuracy numbers (Table 2, page 9).
const COLS = ['Hella', 'MMLU', 'CQA', 'Wino', 'ARC-E', 'Race-H', 'OBQA', 'GSM8k'];
// Base-LLM comparison: two different base language models of comparable size.
const BASE_MISTRAL = [0.6602, 0.5901, 0.6683, 0.7371, 0.813, 0.4612, 0.356, 0.395];
const BASE_VICUNA = [0.5648, 0.4862, 0.5986, 0.7, 0.7554, 0.4162, 0.33, 0.201];
// Dataset comparison: one base LLM, two different visual instruction datasets.
const VLM_15_VICUNA = [0.5628, 0.4936, 0.6832, 0.705, 0.7622, 0.428, 0.36, 0.1667];
const VLM_16_VICUNA = [0.5599, 0.5187, 0.6961, 0.704, 0.769, 0.4325, 0.348, 0.1683];

type Cmp = 'base' | 'data';

const SERIES: Record<Cmp, { a: string; b: string; av: number[]; bv: number[]; colorA: string; colorB: string }> = {
  base: {
    a: 'Mistral',
    b: 'Vicuna',
    av: BASE_MISTRAL,
    bv: BASE_VICUNA,
    colorA: C.blue,
    colorB: C.purple,
  },
  data: {
    a: '数据集 A',
    b: '数据集 B',
    av: VLM_15_VICUNA,
    bv: VLM_16_VICUNA,
    colorA: C.blue,
    colorB: C.green,
  },
};

export const Ch3Mod2: React.FC = () => {
  const [cmp, setCmp] = useState<Cmp>('base');
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '换基座后同一组任务上的两条折线明显分叉（GSM8k 0.395 对 0.201）——论文据此说基座选择比数据集差异更重要。',
    c: '',
  });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const s = SERIES[cmp];
    const left = 110;
    const right = 760;
    const top = 48;
    const bottom = 216;
    const ymin = 0.15;
    const ymax = 0.85;

    const px = (i: number) => left + (i / (COLS.length - 1)) * (right - left);
    const py = (v: number) => bottom - ((v - ymin) / (ymax - ymin)) * (bottom - top);

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();
    for (let g = 0; g <= 4; g++) {
      const y = py(ymin + ((ymax - ymin) * g) / 4);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    const draw = (vals: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      vals.forEach((v, i) => {
        if (i === 0) ctx.moveTo(px(i), py(v));
        else ctx.lineTo(px(i), py(v));
      });
      ctx.stroke();
      vals.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(px(i), py(v), 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    };
    draw(s.av, s.colorA);
    draw(s.bv, s.colorB);

    // per-column gap in the selected comparison
    s.av.forEach((v, i) => {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(px(i), py(v));
      ctx.lineTo(px(i), py(s.bv[i]));
      ctx.stroke();
    });

    const meanGap =
      s.av.reduce((acc, v, i) => acc + Math.abs(v - s.bv[i]), 0) / s.av.length;
    num(ctx, 820, 96, meanGap, C.orange);

    label(ctx, left, 28, '准确率');
    label(ctx, 820, 62, '平均差', C.muted, 'left');
    legend(ctx, 820, 150, [
      [s.a, s.colorA],
      [s.b, s.colorB],
      ['逐项差', C.orange],
    ]);
  });

  const pick = (c: Cmp) => {
    setCmp(c);
    setFb(
      c === 'base'
        ? {
            t: '换基座后同一组任务上的两条折线明显分叉（GSM8k 0.395 对 0.201）——论文据此说基座选择比数据集差异更重要。',
            c: '',
          }
        : {
            t: '换视觉指令数据集后两条折线几乎贴合（平均差不到 0.02），说明数据集差异的影响明显更小。',
            c: '',
          }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className={cmp === 'base' ? 'chip active' : 'chip'} onClick={() => pick('base')}>
          换基座（Mistral vs Vicuna）
        </button>
        <button className={cmp === 'data' ? 'chip active' : 'chip'} onClick={() => pick('data')}>
          换视觉数据集（1.5 vs 1.6）
        </button>
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        折线为论文 Table 2（第 9 页）的原始准确率数值，越高越好。8 项语言任务由 lm-evaluation-harness 评测，
        零样本无思维链，仅 GSM8K 为 8 样本 + 思维链。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch3Mod2;
