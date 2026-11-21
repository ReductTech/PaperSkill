import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { BirderBadge, C } from './rex-kit';

// F1 (%) at IoU 0.5 / 0.95 / mean over 0.5–0.95. Tables 2 (COCO), 3 (LVIS), 4 (Dense200), 5 (HumanRef).
type Row = { m: string; v: [number, number, number]; type: 'rex' | 'sft' | 'det' | 'open' | 'mllm' };
const DATA: Record<string, Row[]> = {
  COCO: [
    { m: 'DINO-R50', v: [68.8, 21.1, 55.6], type: 'det' }, { m: 'DINO-Swin-L', v: [75.6, 25.4, 62.1], type: 'det' },
    { m: 'Grounding DINO-T', v: [69.8, 23.0, 56.6], type: 'open' }, { m: 'Qwen2.5-VL-7B', v: [64.0, 12.6, 45.7], type: 'mllm' },
    { m: 'SEED1.5-VL', v: [71.3, 14.3, 51.4], type: 'mllm' }, { m: 'Rex-Omni-SFT', v: [68.2, 15.8, 50.4], type: 'sft' }, { m: 'Rex-Omni', v: [72.0, 15.9, 52.9], type: 'rex' },
  ],
  LVIS: [
    { m: 'Grounding DINO-T', v: [47.7, 22.7, 38.8], type: 'open' }, { m: 'Qwen2.5-VL-7B', v: [57.7, 17.6, 40.2], type: 'mllm' },
    { m: 'SEED1.5-VL', v: [65.6, 19.5, 46.7], type: 'mllm' }, { m: 'Rex-Omni-SFT', v: [60.3, 20.7, 44.2], type: 'sft' }, { m: 'Rex-Omni', v: [64.3, 20.7, 46.9], type: 'rex' },
  ],
  Dense200: [
    { m: 'Grounding DINO-T', v: [36.9, 19.7, 33.1], type: 'open' }, { m: 'Qwen2.5-VL-7B', v: [1.1, 0.1, 0.6], type: 'mllm' },
    { m: 'SEED1.5-VL', v: [76.9, 5.3, 53.2], type: 'mllm' }, { m: 'Rex-Omni-SFT', v: [60.2, 10.6, 46.4], type: 'sft' }, { m: 'Rex-Omni', v: [78.4, 10.3, 58.3], type: 'rex' },
  ],
  HumanRef: [
    { m: 'Grounding DINO-T', v: [28.0, 16.5, 25.2], type: 'open' }, { m: 'Qwen2.5-VL-7B', v: [72.9, 42.9, 64.1], type: 'mllm' },
    { m: 'SEED1.5-VL', v: [88.2, 60.0, 81.6], type: 'mllm' }, { m: 'Rex-Omni-SFT', v: [83.3, 64.3, 77.9], type: 'sft' }, { m: 'Rex-Omni', v: [85.4, 65.4, 79.9], type: 'rex' },
  ],
};
const METRICS = ['IoU 0.5', 'IoU 0.95', 'mIoU'];
const COLOR = { rex: C.green, sft: '#a7c4b4', det: '#b9c0cb', open: '#8f9bb0', mllm: '#6f86a8' };
const DESC: Record<string, string> = {
  COCO: '80 类常见物体，5000 张图。检测器在 COCO 上训练过，Rex-Omni 没有（零样本）。',
  LVIS: '1203 类长尾物体，很多类别样本很少，考验语言泛化。',
  Dense200: '作者收集的 200 张密集图，平均每张 91.2 个框，考验小而密的目标。',
  HumanRef: '按描述找人（指代检测），一句描述平均对应 2 个人。',
};

export function S12Results(_: WidgetProps) {
  const [ds, setDs] = useState('COCO');
  const [mi, setMi] = useState(0);
  const rows = [...DATA[ds]].sort((a, b) => b.v[mi] - a.v[mi]);
  const rank = rows.findIndex(r => r.type === 'rex') + 1;
  const top = rows[0];
  const det = DATA[ds].find(r => r.m === 'DINO-R50');
  const rex = DATA[ds].find(r => r.type === 'rex')!;
  const insight = ds === 'COCO' && det
    ? (mi === 0 ? `IoU 0.5：Rex-Omni ${rex.v[0].toFixed(1)} 高于 DINO-R50 ${det.v[0]}，没在 COCO 上训练也追上了它（更大的 DINO-Swin-L 仍有 75.6）。` : `IoU ${mi === 1 ? '0.95' : '均值'}：Rex-Omni ${rex.v[mi].toFixed(1)} 低于 DINO-R50 ${det.v[mi]}，要求框更贴合时仍落后回归检测器。`)
    : rank === 1 ? `Rex-Omni 在这一列排第 1（${rex.v[mi].toFixed(1)}）。` : `Rex-Omni 排第 ${rank}（${rex.v[mi].toFixed(1)}），第 1 是 ${top.m}（${top.v[mi].toFixed(1)}）。`;
  return <div className="rx-page rx-s12">
    <div className="rx-s12-left">
      <div className="rx-row" role="group" aria-label="选择数据集">
        {Object.keys(DATA).map(d => <button key={d} className={`rx-chip ${ds === d ? 'is-on' : ''}`} aria-pressed={ds === d} onClick={() => setDs(d)}>{d}</button>)}
      </div>
      <div className="rx-row" role="group" aria-label="选择 IoU 阈值">
        <span className="rx-text">F1 @</span>
        {METRICS.map((m, i) => <button key={m} className={`rx-chip ${mi === i ? 'is-on' : ''}`} aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>)}
      </div>
      <div className="rx-hbars rx-s12-bars">
        {rows.map(r => <div key={r.m} className={`rx-hbar ${r.type === 'rex' ? 'is-rex' : ''}`}>
          <span className="rx-text">{r.m}</span>
          <span className="rx-hbar-track"><span style={{ width: `${r.v[mi]}%`, background: COLOR[r.type] }} /></span>
          <b className="rx-text">{r.v[mi].toFixed(1)}</b>
        </div>)}
      </div>
    </div>
    <div className="rx-s12-right">
      <p className="rx-h" aria-live="polite">{insight}</p>
      <p className="rx-text">{DESC[ds]}</p>
      <p className="rx-text rx-muted">柱长按 0–100 统一刻度。指标是 F1（越高越好）。MLLM 没有可靠的置信度，所以不用 AP；检测器取最佳置信度阈值下的 F1。</p>
      <div className="rx-row"><BirderBadge size={84} /><p className="rx-text rx-muted">灰色：专用检测器；蓝灰：其他 MLLM；浅绿：只做 SFT；绿：Rex-Omni。</p></div>
    </div>
  </div>;
}
