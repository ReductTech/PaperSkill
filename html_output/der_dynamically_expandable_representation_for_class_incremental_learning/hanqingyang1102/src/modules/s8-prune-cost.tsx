import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STEPS = [5, 10, 20, 50];
const P_WOP = [33.6, 61.6, 117.6, 285.6];
const P_OURS = [2.89, 4.96, 7.21, 10.15];
const A_WOP = [76.80, 75.36, 74.09, 72.41];
const A_OURS = [75.55, 74.64, 73.98, 72.05];

export function S8PruneCost(_props: WidgetProps) {
  const [focus, setFocus] = useState(50);

  const W = 660, H = 400;
  const idx = STEPS.indexOf(focus);
  const cut = Math.round((1 - P_OURS[idx] / P_WOP[idx]) * 100);
  const delta = (A_WOP[idx] - A_OURS[idx]).toFixed(2);
  const ly = (v: number) => 340 - ((Math.log10(v) - Math.log10(2)) / (Math.log10(400) - Math.log10(2))) * 270;
  const ax = (i: number) => 152 + i * 120;
  const ay = (v: number) => 340 - ((v - 70) / 9) * 270;

  return (
    <div className="der-page">
      <div className="der-col" style={{ height: '100%', padding: '16px 28px', boxSizing: 'border-box', gap: 8 }}>
        <div className="der-row der-spread">
          <span className="der-h">CIFAR100-B0：剪枝把参数量压低一个数量级</span>
          <div className="der-row" style={{ gap: 8 }}>
            {STEPS.map(n => (
              <button key={n} className={`der-chip ${focus === n ? 'is-on' : ''}`} onClick={() => setFocus(n)} aria-pressed={focus === n}>
                {n} 步
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} role="img"
            aria-label="参数量对比（对数轴）：未剪枝与剪枝后随步数增长">
            <text x="20" y="24" fontSize="21" fontWeight="700" fill="#27446e">平均推理参数量（百万，对数轴，ResNet-18）</text>
            {[10, 100, 300].map(v => (
              <g key={v}>
                <line x1="100" y1={ly(v)} x2="630" y2={ly(v)} stroke="#ece2d1" strokeWidth="1.4" />
                <text x="92" y={ly(v) + 6} textAnchor="end" fontSize="18" fill="#68778f">{v}</text>
              </g>
            ))}
            {STEPS.map((n, i) => {
              const on = focus === n;
              return (
                <g key={n} opacity={on ? 1 : 0.34}>
                  <rect x={ax(i) - 46} y={ly(P_WOP[i])} width="42" height={340 - ly(P_WOP[i])} rx="6" fill="#c43f52" />
                  <rect x={ax(i) + 4} y={ly(P_OURS[i])} width="42" height={340 - ly(P_OURS[i])} rx="6" fill="#228d5c" />
                  <text x={ax(i) - 25} y={ly(P_WOP[i]) - 10} textAnchor="middle" fontSize="17" fill="#a83c50">{P_WOP[i]}</text>
                  <text x={ax(i) + 25} y={340 + 24} textAnchor="middle" fontSize="20" fill="#4a3a29">{n} 步</text>
                  <text x={ax(i) + 25} y={ly(P_OURS[i]) - 10} textAnchor="middle" fontSize="17" fontWeight="700" fill="#1b6b47">{P_OURS[i]}</text>
                </g>
              );
            })}
            <line x1="100" y1="340" x2="630" y2="340" stroke="#d7deea" strokeWidth="2" />
            <g fontSize="18" fill="#5b6b80">
              <rect x="100" y="372" width="15" height="11" fill="#c43f52" /><text x="123" y="383">不剪枝</text>
              <rect x="225" y="372" width="15" height="11" fill="#228d5c" /><text x="248" y="383">剪枝后（本文）</text>
            </g>
          </svg>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} role="img"
            aria-label="平均增量准确率：剪枝后仅下降不到 1 个点">
            <text x="20" y="24" fontSize="21" fontWeight="700" fill="#27446e">平均增量准确率（%）</text>
            {[72, 74, 76, 78].map(v => (
              <g key={v}>
                <line x1="100" y1={ay(v)} x2="630" y2={ay(v)} stroke="#ece2d1" strokeWidth="1.4" />
                <text x="92" y={ay(v) + 6} textAnchor="end" fontSize="18" fill="#68778f">{v}</text>
              </g>
            ))}
            <polyline points={STEPS.map((n, i) => `${ax(i)},${ay(A_WOP[i])}`).join(' ')} fill="none" stroke="#c43f52" strokeWidth="3" strokeDasharray="9 7" />
            <polyline points={STEPS.map((n, i) => `${ax(i)},${ay(A_OURS[i])}`).join(' ')} fill="none" stroke="#228d5c" strokeWidth="3.5" />
            {STEPS.map((n, i) => {
              const on = focus === n;
              const edge = i === 0 || i === 3;
              return (
                <g key={n} opacity={on ? 1 : 0.34}>
                  <circle cx={ax(i)} cy={ay(A_WOP[i])} r="7" fill="#c43f52" stroke="#fff" strokeWidth="2" />
                  <circle cx={ax(i)} cy={ay(A_OURS[i])} r="8" fill="#228d5c" stroke="#fff" strokeWidth="2.5" />
                  {edge && <text x={ax(i)} y={ay(A_WOP[i]) - 14} textAnchor="middle" fontSize="16" fill="#a83c50">{A_WOP[i].toFixed(1)}</text>}
                  <text x={ax(i)} y={ay(A_OURS[i]) + 30} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1b6b47">{A_OURS[i].toFixed(1)}</text>
                  <text x={ax(i)} y={340 + 24} textAnchor="middle" fontSize="20" fill="#4a3a29">{n} 步</text>
                </g>
              );
            })}
            <line x1="100" y1="340" x2="630" y2="340" stroke="#d7deea" strokeWidth="2" />
          </svg>
        </div>

        <div className="der-row der-spread" style={{ borderTop: '1px solid #ece2d1', paddingTop: 8 }}>
          <span className="der-p">
            {focus} 步：<b>{P_WOP[idx]}M → {P_OURS[idx]}M</b>
            ，平均准确率 <b>{A_WOP[idx].toFixed(2)} → {A_OURS[idx].toFixed(2)}</b>
          </span>
          <span className="der-p" style={{ color: '#1b6b47', fontWeight: 700 }}>
            剪掉 {cut}% 参数，精度代价 −{delta} 个点
          </span>
        </div>
      </div>
    </div>
  );
}
