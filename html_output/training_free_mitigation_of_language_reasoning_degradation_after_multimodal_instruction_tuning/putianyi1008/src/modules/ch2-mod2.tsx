import React, { useRef, useState } from 'react';
import { C, stage, label, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// Fixed, hard-coded illustrative magnitude profiles (not paper measurements):
// BASE stands for the base LLM weights, DELTA for the offset written by visual
// instruction tuning, i.e. the task vector T = theta_vlm - theta_llm.
const BASE = [
  0.18, 0.62, 0.34, 0.88, 0.25, 0.71, 0.44, 0.93, 0.12, 0.55, 0.79, 0.31,
  0.67, 0.22, 0.85, 0.49, 0.16, 0.73, 0.38, 0.91, 0.27, 0.6, 0.42, 0.8,
];
const DELTA = [
  0.09, -0.4, 0.12, -0.66, 0.06, -0.45, 0.18, -0.72, 0.03, -0.3, -0.55, 0.11,
  -0.42, 0.07, -0.61, 0.2, 0.05, -0.48, 0.1, -0.68, 0.13, -0.35, 0.16, -0.52,
];

const CELL = 32;
const X0 = 120;
const ZERO = 210;

export const Ch2Mod2: React.FC = () => {
  const [diffOn, setDiffOn] = useState(false);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '两组权重分别可读，但差在哪里还看不出来。',
    c: '',
  });
  // One-shot reveal: the difference row grows in once and then holds its final
  // state, so an ambient loop never resets what the learner just revealed.
  const shownAt = useRef(0);

  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);

    // zero line shared by both rows
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(X0 - 20, ZERO);
    ctx.lineTo(X0 + 24 * CELL + 20, ZERO);
    ctx.stroke();

    // row 1: base LLM weights, always upward from the zero line
    for (let i = 0; i < 24; i++) {
      const h = BASE[i] * 130;
      ctx.fillStyle = C.blue;
      ctx.fillRect(X0 + i * CELL, ZERO - h, CELL - 8, h);
    }

    // row 2: |T| = |theta_vlm - theta_llm|, revealed once when toggled on
    if (diffOn) {
      if (shownAt.current === 0) shownAt.current = now;
      const p = Math.min(1, (now - shownAt.current) / 600);
      const shown = Math.max(1, Math.round(24 * p));
      for (let i = 0; i < shown; i++) {
        const h = Math.abs(DELTA[i]) * 130;
        ctx.fillStyle = C.red;
        ctx.fillRect(X0 + i * CELL + 16, ZERO - h, CELL - 26, h);
      }
    }

    label(ctx, X0, 34, '基座权重');
    label(ctx, X0 + 470, 34, '偏移 T');
    legend(ctx, 760, 254, [
      ['基座', C.blue],
      ['偏移 T', C.red],
    ]);
  });

  const toggle = () => {
    const next = !diffOn;
    if (next) shownAt.current = 0;
    setDiffOn(next);
    setFb(
      next
        ? {
            t: '第二条就是视觉适配写入的偏移（任务向量 T 的幅度）：幅度大的格子，正是后面裁剪时要优先保留的候选。',
            c: 'bad',
          }
        : { t: '两组权重分别可读，但差在哪里还看不出来。', c: '' }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={toggle}>
          {diffOn ? '隐藏差值' : '显示差值'}
        </button>
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        下图中两行的横坐标是同一组参数位置；本图为机制示意，纵条高度不是论文测量的权重值。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch2Mod2;
