import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Panel = 'vlm' | 'vwm';

const GROK = [
  { key: 'MMSI', direct: 26.3, transferred: 31.1 },
  { key: 'Spin', direct: 45.6, transferred: 53.3 },
  { key: 'CausalSpatial', direct: 33.4, transferred: 37.5 },
  { key: 'Perception', direct: 21.2, transferred: 30.2 },
  { key: 'SAT', direct: 52.7, transferred: 51.0 },
  { key: '总体', direct: 32.9, transferred: 39.8 },
];

const VWM_ROWS: { key: string; h3: 'up' | 'flat'; ltx: 'up' | 'flat' | 'down' | 'na' }[] = [
  { key: 'MMSI', h3: 'up', ltx: 'up' },
  { key: 'SAT', h3: 'up', ltx: 'na' },
  { key: 'Spin', h3: 'up', ltx: 'up' },
  { key: 'SpatiaLab', h3: 'up', ltx: 'up' },
  { key: 'ERQA', h3: 'up', ltx: 'na' },
  { key: 'CausalSpatial', h3: 'up', ltx: 'down' },
  { key: 'Perception', h3: 'up', ltx: 'na' },
];

const chip = (state: 'up' | 'flat' | 'down' | 'na') => {
  if (state === 'up') return { label: '↑ 提升', cls: 'is-good' };
  if (state === 'down') return { label: '↓ 低于基线', cls: 'is-bad' };
  if (state === 'flat') return { label: '≈ 持平', cls: 'is-neutral' };
  return { label: '未提及', cls: 'is-neutral' };
};

export function S11Boundary(_props: WidgetProps) {
  const [panel, setPanel] = useState<Panel>('vlm');
  const width = 860;
  const max = 60;
  const rowH = 58;
  const scale = (width - 320) / max;
  return (
    <div className="ps-page s11-page">
      <div className="ps-tabs is-row">
        <button className={`ps-seg ${panel === 'vlm' ? 'is-on' : ''}`} onClick={() => setPanel('vlm')}>换 VLM：迁移到 Grok-4.5</button>
        <button className={`ps-seg ${panel === 'vwm' ? 'is-on' : ''}`} onClick={() => setPanel('vwm')}>换 VWM：H3 与 LTX-2.3</button>
      </div>
      {panel === 'vlm' ? (
        <div className="ps-panel-body">
          <svg viewBox={`0 0 ${width} ${GROK.length * rowH + 20}`} role="img" aria-label="Grok-4.5 直接推理与迁移 harness 后的按题加权准确率">
            {GROK.map((row, index) => {
              const delta = row.transferred - row.direct;
              const down = delta < 0;
              return (
                <g key={row.key} transform={`translate(0 ${index * rowH + 8})`}>
                  <text x="150" y="32" textAnchor="end" fontSize="24" fill="#21324a">{row.key}</text>
                  <rect x="170" y="8" width={row.direct * scale} height="20" rx="4" fill="#9aa8bb" />
                  <rect x="170" y="32" width={row.transferred * scale} height="20" rx="4" fill={down ? '#c43f52' : '#228d5c'} />
                  <text x={176 + Math.max(row.direct, row.transferred) * scale} y="34" fontSize="22" fill={down ? '#c43f52' : '#228d5c'}>
                    {row.direct}% → {row.transferred}%（{delta > 0 ? '+' : ''}{delta.toFixed(1)}）
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="ps-feedback is-info" aria-live="polite">迁移后再跑一轮共演化：总体 32.9%→39.8%，SAT 略降 1.7pp。</div>
        </div>
      ) : (
        <div className="ps-panel-body">
          <table className="ps-table">
            <thead>
              <tr><th>基准</th><th>H3 Max Turbo</th><th>LTX-2.3</th></tr>
            </thead>
            <tbody>
              {VWM_ROWS.map(row => {
                const h3 = chip(row.h3);
                const ltx = chip(row.ltx);
                return (
                  <tr key={row.key}>
                    <td>{row.key}</td>
                    <td><span className={`ps-chip ${h3.cls}`}>{h3.label}</span></td>
                    <td><span className={`ps-chip ${ltx.cls}`}>{ltx.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="ps-feedback is-warn" aria-live="polite">同一套 harness 换更强的引擎仍受益；换弱引擎时，因果任务反而低于直接推理。</div>
        </div>
      )}
    </div>
  );
}
