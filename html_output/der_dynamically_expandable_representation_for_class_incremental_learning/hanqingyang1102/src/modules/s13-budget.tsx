import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STEPS = [5, 10, 20, 50];
const PARAMS = [2.89, 4.96, 7.21, 10.15];

export function S13Budget(_props: WidgetProps) {
  const [si, setSi] = useState(3);
  const t = STEPS[si];
  const params = PARAMS[si];
  const drawn = Math.min(t, 5);
  const extra = t - drawn;

  return (
    <div className="der-page">
      <div className="der-grid" style={{ gridTemplateColumns: '1.04fr .96fr', gap: 22 }}>
        <div className="der-col" style={{ justifyContent: 'center', gap: 10 }}>
          <div className="der-row der-spread">
            <span className="der-h">第 t 步的提取器</span>
            <div className="der-row" style={{ gap: 6 }}>
              {STEPS.map((n, i) => (
                <button key={n} className={`der-chip ${si === i ? 'is-on' : ''}`} onClick={() => setSi(i)} aria-pressed={si === i}
                  style={{ padding: '6px 14px', fontSize: 24 }}>
                  {n} 步
                </button>
              ))}
            </div>
          </div>

          <div className="der-cabinet" style={{ display: 'flex', gap: 10, padding: 12, height: 150 }}>
            {Array.from({ length: drawn }, (_, i) => (
              <div key={i} className={`der-drawer ${i === 0 ? 'is-sealed' : 'is-open'}`} style={{ flex: 1 }}>
                <span className="der-drawer-label">{i === 0 ? 'Φ1' : `F${i + 1}`}</span>
                <div className="der-handle" />
                <span className="der-note-sm" style={{ color: '#3c2a1c' }}>{i === 0 ? '冻结' : '新增'}</span>
              </div>
            ))}
            {extra > 0 && (
              <div className="der-drawer" style={{ flex: .9, background: 'transparent', borderStyle: 'dashed' }}>
                <span className="der-drawer-label">+{extra}</span>
                <span className="der-note-sm" style={{ color: '#3c2a1c' }}>省略</span>
              </div>
            )}
          </div>

          <p className="der-note-sm">
            第 {t} 步共 {t} 个提取器（1 个冻结 + {t - 1} 个新增，剪枝后保留）。
          </p>

          <svg viewBox="0 0 660 200" style={{ width: '100%' }} role="img"
            aria-label={`平均推理参数量随步数增长：${STEPS.map((n, i) => `${n} 步 ${PARAMS[i]}M`).join('，')}`}>
            <line x1="60" y1="150" x2="620" y2="150" stroke="#d7deea" strokeWidth="2" />
            <polyline points={STEPS.map((_, i) => `${90 + i * 150},${150 - (PARAMS[i] / 12) * 100}`).join(' ')}
              fill="none" stroke="#228d5c" strokeWidth="3.5" />
            {STEPS.map((n, i) => (
              <g key={n}>
                <circle cx={90 + i * 150} cy={150 - (PARAMS[i] / 12) * 100} r={si === i ? 10 : 7}
                  fill={si === i ? '#f07e47' : '#228d5c'} stroke="#fff" strokeWidth="2.5" />
                <text x={90 + i * 150} y={150 - (PARAMS[i] / 12) * 100 - 16} textAnchor="middle" fontSize="18"
                  fontWeight={si === i ? 750 : 500} fill={si === i ? '#b3572b' : '#1b6b47'}>{PARAMS[i]}M</text>
                <text x={90 + i * 150} y={172} textAnchor="middle" fontSize="18" fill="#68778f">{n} 步</text>
              </g>
            ))}
            <text x="60" y="24" fontSize="19" fill="#68778f">平均推理参数量（百万，Table 1）</text>
          </svg>
        </div>

        <div className="der-col" style={{ justifyContent: 'center', gap: 10 }}>
          <div className="der-panel" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="der-row der-spread">
              <span className="der-h">平均推理参数量</span>
              <span className="der-num" style={{ color: '#1b6b47' }}>{params} M</span>
            </div>
            <p className="der-note-sm">
              三次运行平均；Table 1 的 #Paras 就是这个口径。
            </p>
          </div>

          <div className="der-panel" style={{ padding: '12px 18px' }}>
            <div className="der-row der-spread">
              <span className="der-p">推理延迟（GTX 1080Ti）</span>
              <span className="der-p"><b>1.07 ms</b> / 图，基线 0.99</span>
            </div>
          </div>

          <div className="der-col" style={{ gap: 4 }}>
            <p className="der-p"><span className="der-bad">推论一</span>：参数量随步数增长；剪枝只作用于当步新增的屉，旧屉不再改动。</p>
            <p className="der-p"><span className="der-bad">推论二</span>：依赖记忆缓冲，缓冲越小越难判新旧。</p>
            <p className="der-p"><span className="der-bad">推论三</span>：top-5 增益小，收益主要在“别忘旧类”。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
