import React, { useState } from 'react';
import { C, stage, rack, label, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

const STEPS = ['TRIM', 'ELECTSIGN', 'MERGE'];

export const Ch8Mod2: React.FC = () => {
  const [vec, setVec] = useState<'multi' | 'single'>('single');
  // Mirrors the canvas condition so the DOM step row can mark the skipped step.
  const skippedRow = vec === 'single';
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '本文只有一个任务向量（基座 LLM），没有第二个向量可以投票，所以论文所用的外部库 Mergekit 里 TIES 的 ELECTSIGN 被跳过，只保留 TRIM 与 MERGE。',
    c: 'good',
  });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const skipped = vec === 'single';

    for (let i = 0; i < 3; i++) {
      const x = 120 + i * 270;
      const off = skipped && i === 1;
      rack(ctx, x, 70, 200, 70, off ? C.axis : C.orange, !off);
      if (off) {
        ctx.setLineDash([7, 6]);
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (i < 2) {
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 200, 105);
        ctx.lineTo(x + 270, 105);
        ctx.stroke();
      }
    }
    // step names (TRIM / ELECTSIGN / MERGE) live in the DOM row below, so the
    // Canvas keeps only one short label.

    // input task vectors
    const n = vec === 'multi' ? 4 : 1;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = C.purple;
      ctx.fillRect(120, 180 + i * 18, 300, 12);
    }

    label(ctx, 120, 46, '融合步骤');
  });

  const pick = (v: 'multi' | 'single') => {
    setVec(v);
    setFb(
      v === 'multi'
        ? { t: '多个任务向量时，TIES 会用符号投票处理参数之间的符号冲突。', c: '' }
        : {
            t: '本文只有一个任务向量（基座 LLM），没有第二个向量可以投票，所以论文所用的外部库 Mergekit 里 TIES 的 ELECTSIGN 被跳过，只保留 TRIM 与 MERGE。',
            c: 'good',
          }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        {STEPS.map((name, i) => (
          <span key={name} className="step-tag">
            {name}
            {skippedRow && i === 1 ? '（跳过）' : ''}
          </span>
        ))}
      </div>
      <div className="ctrl">
        <button className={vec === 'multi' ? 'chip active' : 'chip'} onClick={() => pick('multi')}>
          多个任务向量
        </button>
        <button className={vec === 'single' ? 'chip active' : 'chip'} onClick={() => pick('single')}>
          单个任务向量（本文情形）
        </button>
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch8Mod2;
