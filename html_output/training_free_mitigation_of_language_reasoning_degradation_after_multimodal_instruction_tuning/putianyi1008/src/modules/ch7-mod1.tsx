import React, { useState } from 'react';
import { C, stage, rack, label, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

type Setting = {
  name: string;
  prompt: string;
  metric: string;
  base: number | null;
  mllm: number;
  vision: boolean;
};

// Paper Appendix A protocol + Table 2 / Table 3 values (base Mistral vs LLaVA-1.6-Mistral alpha=0).
// The eight language tasks are scored with the lm-evaluation-harness, the vision task
// with lmms_eval; the two suites are never mixed into one comparison.
// The paper only says it uses "the corresponding evaluation metrics as implemented
// in the language model evaluation harness" (p.8) and never names a metric per task,
// so the tutorial must not present "accuracy" as the paper's own wording.
const METRIC_NOTE = '各数据集官方指标（论文未逐项给出指标名）';
const VISION_METRIC_NOTE = 'lmms_eval 官方视觉指标（非准确率一项，见说明）';

const SETTINGS: Setting[] = [
  { name: 'ARC-E', prompt: '零样本，无思维链', metric: METRIC_NOTE, base: 0.813, mllm: 0.782, vision: false },
  { name: 'Race-H', prompt: '零样本，无思维链', metric: METRIC_NOTE, base: 0.4612, mllm: 0.4459, vision: false },
  { name: 'OBQA', prompt: '零样本，无思维链', metric: METRIC_NOTE, base: 0.356, mllm: 0.314, vision: false },
  { name: 'GSM8k', prompt: '8 样本 + 思维链', metric: METRIC_NOTE, base: 0.395, mllm: 0.3282, vision: false },
  { name: 'Hella', prompt: '零样本，无思维链', metric: METRIC_NOTE, base: 0.6602, mllm: 0.5971, vision: false },
  { name: 'MMLU', prompt: '零样本，无思维链', metric: METRIC_NOTE, base: 0.5901, mllm: 0.5783, vision: false },
  { name: 'CQA', prompt: '零样本，无思维链', metric: METRIC_NOTE, base: 0.6683, mllm: 0.7215, vision: false },
  { name: 'Wino', prompt: '零样本，无思维链', metric: METRIC_NOTE, base: 0.7371, mllm: 0.712, vision: false },
  { name: 'GQA', prompt: '官方视觉协议', metric: VISION_METRIC_NOTE, base: null, mllm: 0.5514, vision: true },
];

export const Ch7Mod1: React.FC = () => {
  const [ds, setDs] = useState(0);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '同一数据集内，基座与多模态模型用相同提示与官方指标，可以直接比较。',
    c: 'good',
  });
  const s = SETTINGS[ds];

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const cur = SETTINGS[ds];

    // nine-setting column: cell length encodes the value, colour encodes comparability
    for (let i = 0; i < 9; i++) {
      const st = SETTINGS[i];
      const y = 28 + i * 25;
      const active = i === ds;
      rack(ctx, 90, y, 150, 22, active ? C.orange : C.axis, active);
      if (!active) {
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.fillStyle = C.axis;
      ctx.fillRect(260, y, 320, 22);
      ctx.fillStyle = st.vision ? C.red : active ? C.green : C.blue;
      ctx.fillRect(260, y, 320 * st.mllm, 22);
    }

    // comparability bar for the selected setting
    const canCompare = !cur.vision;
    ctx.fillStyle = C.axis;
    ctx.fillRect(700, 96, 320, 30);
    ctx.fillStyle = canCompare ? C.green : C.red;
    ctx.fillRect(700, 96, canCompare ? 320 : 110, 30);

    label(ctx, 90, 262, '评测设置');
    legend(ctx, 700, 56, [
      ['可比', C.green],
      ['不可比', C.red],
      ['当前', C.orange],
    ]);
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setDs(v);
    if (v === 3) {
      setFb({
        t: '注意 GSM8k 用的是 8 样本思维链，和其他零样本项之间不能横向比较。',
        c: '',
      });
    } else if (v === 8) {
      setFb({
        t: '视觉指标没有对应的纯语言基线，不能和语言项的数值放在同一张表里。',
        c: 'bad',
      });
    } else {
      setFb({
        t: '同一数据集内，基座与多模态模型用相同提示与官方指标，可以直接比较。',
        c: 'good',
      });
    }
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          评测设置 <span className="val">{s.name}</span>
        </label>
      </div>
      <div className="ctrl">
        <input type="range" min={0} max={8} step={1} value={ds} onChange={onChange} />
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        当前设置「{s.name}」：提示方式 {s.prompt}；指标 {s.metric}（越高越好）；
        {s.vision
          ? '该视觉任务没有对应的纯语言基线，不能与语言项横向比较。'
          : '与基座 Mistral 的同项数值使用完全相同的协议，可以直接比较。'}
        <br />
        论文只说明「使用 lm-evaluation-harness 中对应的官方指标」，并未逐个任务写出指标名
        （如 acc / acc_norm / exact_match），因此这里的措辞是本教程的统称，不是论文原话。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch7Mod1;
