import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C } from './seesr-cover';

type Key = 'div2k' | 'realsr' | 'drealsr';
const METHODS = ['Real-ESRGAN', 'StableSR', 'DiffBIR', 'PASD', 'SeeSR'];
/* Table 2 (p.6). BSRGAN is omitted here because it is the fidelity-side method on the last page. */
const DATA: Record<Key, { name: string; fid: number[]; clip: number[]; musiq: number[] }> = {
  div2k: {
    name: 'DIV2K-Val',
    fid: [53.46, 36.57, 40.42, 40.77, 31.93],
    clip: [0.5424, 0.6486, 0.6664, 0.6799, 0.6946],
    musiq: [58.64, 62.95, 65.23, 66.85, 68.33],
  },
  realsr: {
    name: 'RealSR',
    fid: [135.18, 128.51, 128.99, 129.76, 125.55],
    clip: [0.4449, 0.6178, 0.6386, 0.659, 0.6612],
    musiq: [60.18, 65.78, 64.85, 68.69, 69.77],
  },
  drealsr: {
    name: 'DrealSR',
    fid: [147.62, 148.98, 166.79, 159.24, 147.39],
    clip: [0.4422, 0.6206, 0.6346, 0.6773, 0.6804],
    musiq: [54.18, 58.42, 61.19, 64.81, 64.93],
  },
};

const PANELS = [
  { key: 'fid' as const, label: 'FID ↓', max: 160, fmt: (v: number) => v.toFixed(2) },
  { key: 'clip' as const, label: 'CLIPIQA ↑', max: 0.75, fmt: (v: number) => v.toFixed(4) },
  { key: 'musiq' as const, label: 'MUSIQ ↑', max: 72, fmt: (v: number) => v.toFixed(2) },
];

const READING: Record<Key, string> = {
  div2k: 'FID 最低、CLIPIQA 与 MUSIQ 最高：三项都是 SeeSR。',
  realsr: 'FID 125.55、MUSIQ 69.77 领先；CLIPIQA 0.6612 仅略高于 PASD 的 0.6590。',
  drealsr: 'CLIPIQA、MUSIQ 最高；FID 147.39 与 Real-ESRGAN 的 147.62 非常接近。',
};

/** S8 — Table 2, three perceptual / no-reference metrics across three benchmarks. */
export function SeesrMetricBars(_props: WidgetProps) {
  const [dataset, setDataset] = useState<Key>('div2k');
  const data = DATA[dataset];

  return (
    <div className="seesr-scene">
      <div className="seesr-panel seesr-plain" style={{ left: 0, top: 0, width: 344, height: 622 }}>
        <div className="seesr-h">测试集</div>
        {(Object.keys(DATA) as Key[]).map((key) => (
          <button key={key} type="button" className={`seesr-chip seesr-dataset ${dataset === key ? 'is-on' : ''}`}
            onClick={() => setDataset(key)} aria-pressed={dataset === key}>
            <b>{DATA[key].name}</b>
          </button>
        ))}
        <p className={`seesr-feedback is-good`} style={{ marginTop: 18 }} aria-live="polite">{READING[dataset]}</p>
        <p className="seesr-muted">同一张表内比较，单次评测，未报告误差棒。</p>
      </div>

      <div className="seesr-charts" style={{ left: 360, top: 0, width: 1112, height: 622 }}>
        {PANELS.map((panel, index) => {
          const values = data[panel.key];
          return (
            <div className="seesr-inset seesr-chartpanel" key={panel.key} style={{ top: index * 206 }}>
              <div className="seesr-chartpanel-title">{panel.label}</div>
              {METHODS.map((method, i) => {
                const value = values[i];
                const isSee = method === 'SeeSR';
                return (
                  <div className={`seesr-barrow ${isSee ? 'is-best' : ''}`} key={method}>
                    <span className="seesr-barrow-name">{method}</span>
                    <span className="seesr-barrow-track">
                      <i style={{ width: `${(value / panel.max) * 100}%`, background: isSee ? C.green : '#b8c9a7' }} />
                    </span>
                    <b style={{ color: isSee ? C.green : C.ink }}>{panel.fmt(value)}</b>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
