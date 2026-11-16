import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C } from './seesr-cover';

type MetricKey = 'pq' | 'apDet' | 'apIns' | 'miou';
const METHODS = ['GT', 'Zoomed LR', 'Real-ESRGAN', 'StableSR', 'DiffBIR', 'PASD', 'SeeSR'];
const METRICS: Array<{ key: MetricKey; label: string; unit: string; values: number[]; read: string }> = [
  {
    key: 'pq', label: '全景分割 PQ', unit: 'PQ',
    values: [52.5, 9, 16.2, 26.8, 27.2, 23.7, 30.0],
    read: 'SeeSR 30.0，约为 Zoomed LR（9）的 3.3 倍，仍明显低于 GT 的 52.5。',
  },
  {
    key: 'apDet', label: '目标检测 AP', unit: 'AP',
    values: [49.1, 5, 10.5, 18.3, 18.9, 15.5, 21.1],
    read: 'SeeSR 21.1，是 Zoomed LR（5）的 4.2 倍，GT 为 49.1。',
  },
  {
    key: 'apIns', label: '实例分割 AP', unit: 'AP',
    values: [43.8, 4, 9.2, 16.2, 16.5, 13.4, 18.5],
    read: 'SeeSR 18.5，是 Zoomed LR（4）的 4.6 倍，GT 为 43.8。',
  },
  {
    key: 'miou', label: '语义分割 mIoU', unit: 'mIoU',
    values: [62.0, 12, 21.7, 34.5, 37.7, 33.3, 41.3],
    read: 'SeeSR 41.3，约为 Zoomed LR（12）的 3.4 倍，GT 为 62.0。',
  },
];

/** S9 — Table 3: semantic fidelity measured by downstream COCO tasks. */
export function SeesrSemanticTable(_props: WidgetProps) {
  const [metric, setMetric] = useState<MetricKey>('pq');
  const current = METRICS.find((item) => item.key === metric)!;
  const gt = current.values[0];
  const max = 70;

  return (
    <div className="seesr-scene">
      <div className="seesr-panel seesr-plain" style={{ left: 0, top: 0, width: 360, height: 622 }}>
        <div className="seesr-h">下游任务</div>
        {METRICS.map((item) => (
          <button key={item.key} type="button" className={`seesr-chip seesr-dataset ${metric === item.key ? 'is-on' : ''}`}
            onClick={() => setMetric(item.key)} aria-pressed={metric === item.key}>
            <b>{item.label}</b>
          </button>
        ))}
        <p className="seesr-muted">COCO-Val 5K；OpenSeeD 检测/分割；四项指标都是越高越好。</p>
      </div>

      <div className="seesr-inset" style={{ left: 376, top: 0, width: 1096, height: 622 }}>
        <div className="seesr-chartpanel-title">{current.unit}（0–70，越高越好）</div>
        <div className="seesr-lollipop">
          {METHODS.map((method, i) => {
            const value = current.values[i];
            const isSee = method === 'SeeSR';
            const isGt = method === 'GT';
            const isLr = method === 'Zoomed LR';
            const color = isGt ? C.green : isSee ? C.green : isLr ? C.red : C.muted;
            return (
              <div className={`seesr-lollirow ${isSee ? 'is-best' : ''}`} key={method}>
                <span className="seesr-lolliname" style={{ color: isGt || isSee ? C.green : C.ink }}>{method}</span>
                <span className="seesr-lollitrack">
                  <i style={{ width: `${(value / max) * 100}%`, background: color, opacity: isGt ? 0.45 : 1 }} />
                  <u style={{ left: `${(value / max) * 100}%`, borderColor: color }} />
                </span>
                <b style={{ color }}>{value.toFixed(1)}</b>
              </div>
            );
          })}
        </div>
        <div className="seesr-gtline" style={{ left: `calc(170px + ${(gt / max) * 100}% * (890 / 1096))` }} aria-hidden="true" />
        <p className="seesr-feedback is-good" aria-live="polite">{current.read}</p>
        <p className="seesr-muted">GT 行是在真值图像上测得的上限参考，不是参赛方法。</p>
      </div>
    </div>
  );
}
