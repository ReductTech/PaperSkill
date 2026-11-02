import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

export function S9BalancedHead(_props: WidgetProps) {
  const [balanced, setBalanced] = useState(false);
  const [delta, setDelta] = useState(5);

  const tilt = balanced ? 0 : -24;
  const oldCount = balanced ? 8 : 3;
  const newCount = 8;
  const smooth = `${Math.round(((delta - 1) / 9) * 100)}%`;

  return (
    <div className="der-page">
      <div className="der-grid" style={{ gridTemplateColumns: '.92fr 1.08fr', gap: 22 }}>
        <div className="der-col" style={{ justifyContent: 'center' }}>
          <div className="der-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'space-between', padding: '26px 24px' }}>
            <div className="der-row der-spread">
              <span className="der-h">柜台上的药堆</span>
              <button className={`der-chip ${balanced ? 'is-on' : ''}`} onClick={() => setBalanced(b => !b)} aria-pressed={balanced}>
                类别平衡采样
              </button>
            </div>

            <div className="der-col" style={{ gap: 12 }}>
              <div className="der-row" style={{ gap: 12, alignItems: 'flex-start' }}>
                <span className="der-p" style={{ width: 96 }}>旧类</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Array.from({ length: oldCount }, (_, i) => <span key={i} className="der-tag">旧 {i + 1}</span>)}
                </div>
              </div>
              <div className="der-row" style={{ gap: 12, alignItems: 'flex-start' }}>
                <span className="der-p" style={{ width: 96 }}>新类</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Array.from({ length: newCount }, (_, i) => (
                    <span key={i} className="der-tag" style={{ background: '#e7f3e4', borderColor: '#a9c9a3', color: '#2f4a2a' }}>新 {i + 1}</span>
                  ))}
                </div>
              </div>
            </div>

            <p className="der-p" style={{ color: balanced ? '#228d5c' : '#c43f52' }}>
              {balanced
                ? '每类取相同数量重训：药师的偏好被拉回中间。'
                : '新类纸包压倒性多，边界被推向旧类。'}
            </p>
          </div>
        </div>

        <div className="der-col" style={{ justifyContent: 'center', gap: 10 }}>
          <svg viewBox="0 0 690 310" style={{ width: '100%' }} role="img"
            aria-label={`决策边界${balanced ? '回到中间' : '被新类拉向旧类'}（示意）`}>
            <rect x="6" y="6" width="678" height="298" rx="14" fill="#fffdf9" stroke="#e3d8c6" />
            <line x1="60" y1="250" x2="640" y2="250" stroke="#d7deea" strokeWidth="2" />
            <line x1="60" y1="250" x2="60" y2="34" stroke="#d7deea" strokeWidth="2" />

            {[[150, 110], [196, 92], [128, 152], [226, 132], [172, 66]].map(([x, y], i) => (
              <circle key={`o${i}`} cx={x} cy={y} r="11" fill="#27446e" opacity=".85" />
            ))}
            {[[420, 150], [470, 118], [512, 176], [446, 200], [560, 140], [486, 88], [572, 192], [398, 192]].map(([x, y], i) => (
              <circle key={`n${i}`} cx={x} cy={y} r="11" fill="#e08a4c" opacity=".9" />
            ))}

            <g transform={`rotate(${tilt} 320 150)`}>
              <line x1="120" y1="150" x2="580" y2="150" stroke={balanced ? '#228d5c' : '#c43f52'} strokeWidth="3.5" strokeDasharray="12 8" />
            </g>
            <text x="624" y="46" textAnchor="end" fontSize="19" fill={balanced ? '#228d5c' : '#c43f52'}>
              {balanced ? '边界回到中部' : '边界被推向旧类'}
            </text>
            <text x="86" y="54" fontSize="18" fill="#27446e">● 旧类</text>
            <text x="176" y="54" fontSize="18" fill="#b3572b">● 新类</text>
            <text x="350" y="292" textAnchor="middle" fontSize="18" fill="#68778f">示意：只表示判决边界往哪边偏</text>
          </svg>

          <div className="der-panel" style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="der-row der-spread">
              <span className="der-p" style={{ fontWeight: 700 }}>
                温度 <SymbolHint meaning="δ：softmax 温度，越大分布越平滑">δ</SymbolHint> = {delta}
              </span>
              <input className="der-slider" style={{ width: 240 }} type="range" min={1} max={10} step={0.5} value={delta}
                onChange={e => setDelta(Number(e.target.value))} aria-label="温度 δ" aria-valuetext={`温度 ${delta}`} />
            </div>
            <div className="der-row" style={{ gap: 12 }}>
              <span className="der-note-sm" style={{ width: 76 }}>更尖锐</span>
              <div className="der-meter is-orange" style={{ flex: 1 }}><span style={{ width: smooth }} /></div>
              <span className="der-note-sm" style={{ width: 76, textAlign: 'right' }}>更平滑</span>
            </div>
            <p className="der-note-sm">
              δ 越大，softmax 越平滑、类间 margin 越大。论文在 CIFAR-100 取 δ=5，在 ImageNet-100/1000 取 δ=1。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
