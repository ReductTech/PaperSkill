import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const METHODS = ['iCaRL', 'BiC', 'WA', '本文 DER'];
const R18 = [65.27, 68.80, 69.46, 74.64];
const R32 = [64.04, 66.15, 67.25, 69.41];

export function S10Protocol(_props: WidgetProps) {
  const [pick, setPick] = useState(3);

  const gx = (i: number) => 120 + i * 140;
  const gy = (v: number) => 336 - ((v - 60) / 20) * 268;

  return (
    <div className="der-page">
      <div className="der-grid" style={{ gridTemplateColumns: '1.04fr .96fr', gap: 22 }}>
        <div className="der-col" style={{ justifyContent: 'center' }}>
          <svg viewBox="0 0 660 430" style={{ width: '100%' }} role="img"
            aria-label="CIFAR100-B0 十步：同一方法在 ResNet-18 与改版 ResNet-32 上的平均增量准确率">
            <rect x="6" y="6" width="648" height="418" rx="16" fill="#fffdf9" stroke="#e3d8c6" />
            <text x="24" y="34" fontSize="21" fontWeight="700" fill="#27446e">CIFAR100-B0 · 10 步 · 平均增量准确率（%）</text>

            {[60, 65, 70, 75, 80].map(v => (
              <g key={v}>
                <line x1="86" y1={gy(v)} x2="620" y2={gy(v)} stroke="#ece2d1" strokeWidth="1.2" />
                <text x="78" y={gy(v) + 6} textAnchor="end" fontSize="17" fill="#68778f">{v}</text>
              </g>
            ))}

            {METHODS.map((m, i) => {
              const on = pick === i;
              const x = gx(i);
              return (
                <g key={m} onClick={() => setPick(i)} style={{ cursor: 'pointer' }} opacity={on ? 1 : 0.42}>
                  <rect x={x - 62} y="52" width="124" height="300" fill={on ? '#f3f6fb' : 'transparent'} rx="8" />
                  <rect x={x - 50} y={gy(R18[i])} width="44" height={336 - gy(R18[i])} rx="4" fill="#27446e" />
                  <rect x={x + 6} y={gy(R32[i])} width="44" height={336 - gy(R32[i])} rx="4" fill="#9fb6d4" />
                  <text x={x - 28} y={gy(R18[i]) - 8} textAnchor="middle" fontSize="17" fontWeight="700" fill="#1d2c44">{R18[i].toFixed(2)}</text>
                  <text x={x + 28} y={gy(R32[i]) - 8} textAnchor="middle" fontSize="17" fill="#4a5a72">{R32[i].toFixed(2)}</text>
                  <text x={x} y="372" textAnchor="middle" fontSize="19" fontWeight={m.startsWith('本文') ? 750 : 500}
                    fill={m.startsWith('本文') ? '#1b6b47' : '#3b4a61'}>{m}</text>
                </g>
              );
            })}
            <line x1="86" y1="336" x2="620" y2="336" stroke="#d7deea" strokeWidth="2" />

            <g fontSize="17" fill="#5b6b80">
              <rect x="90" y="396" width="14" height="11" fill="#27446e" /><text x="112" y="406">ResNet-18（11.2M）</text>
              <rect x="286" y="396" width="14" height="11" fill="#9fb6d4" /><text x="308" y="406">改版 ResNet-32（0.46M）</text>
            </g>
          </svg>
        </div>

        <div className="der-col" style={{ justifyContent: 'center', gap: 12 }}>
          <div className="der-panel" style={{ padding: '14px 18px' }}>
            <div className="der-row der-spread">
              <span className="der-p">{METHODS[pick]}</span>
              <span className="der-num" style={{ fontSize: 30, color: '#b3572b' }}>
                −{(R18[pick] - R32[pick]).toFixed(2)}
              </span>
            </div>
            <p className="der-p der-muted">
              ResNet-18 {R18[pick].toFixed(2)} → 改版 ResNet-32 {R32[pick].toFixed(2)}
            </p>
          </div>

          <p className="der-p">主表统一用 ResNet-18：11.2M 参数。</p>
          <p className="der-p">
            多数基线由作者在同一类别顺序上重跑；无代码者按自有实现报告，RPSNet 直接取自原文——它的参数量是 56–61M，其余方法是 11.2M。
          </p>
          <div className="der-eq-block" style={{ borderLeftColor: '#f07e47', fontSize: 26 }}>
            Table 1/2/3 只能在同一协议、同一骨干内比较，不能和各原论文的表格直接横比。
          </div>
        </div>
      </div>
    </div>
  );
}
