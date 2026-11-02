import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const OLD_CLOUD = [
  [0.18, 0.22], [0.34, 0.1], [0.1, 0.36], [0.42, 0.3], [0.24, 0.46],
  [0.5, 0.16], [0.06, 0.18], [0.38, 0.48],
];
const NEW_CLOUD = [
  [0.2, 0.2], [0.36, 0.34], [0.12, 0.4], [0.44, 0.12], [0.3, 0.5],
  [0.08, 0.28], [0.5, 0.36], [0.26, 0.08],
];

type Row = { label: string; value: number };
const TABLE6: Row[] = [
  { label: '0.1', value: 74.12 },
  { label: '0.5', value: 74.41 },
  { label: '1', value: 74.64 },
  { label: '5', value: 74.52 },
  { label: '10', value: 73.54 },
];

export function S5AuxLoss(_props: WidgetProps) {
  const [lam, setLam] = useState(1);
  const pull = Math.min(1, lam / 6);
  const oldProb = 0.30 + 0.42 * Math.min(1, lam / 4);

  const cx = 280, cy = 260;
  const nx = 360 + pull * 170;
  const ny = 345 - pull * 150;

  const feedback = lam < 0.5
    ? { text: 'λa 接近 0：辅助项几乎不起作用，新旧边界最模糊。', tone: '#c43f52' }
    : lam <= 5
      ? { text: 'λa=1 在平台区：主任务几乎不掉点。', tone: '#228d5c' }
      : { text: 'λa 继续加大收益很小：λa=10 时 73.54，仅比 λa=1 低 1.10 个点。', tone: '#b3572b' };

  const nearest = TABLE6.reduce((best, row, i) =>
    Math.abs(Math.log(Number(row.label)) - Math.log(Math.max(lam, 0.05))) <
    Math.abs(Math.log(Number(TABLE6[best].label)) - Math.log(Math.max(lam, 0.05))) ? i : best, 0);

  const bx = (i: number) => 46 + i * 100;
  const by = (v: number) => 128 - ((v - 70) / 6) * 96;

  return (
    <div className="der-page">
      <div className="der-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div className="der-col" style={{ justifyContent: 'center' }}>
          <svg viewBox="0 0 700 540" style={{ width: '100%', height: '100%' }} role="img"
            aria-label={`特征投影：新旧两簇的分离度随 λa 增大而变大，当前 λa 为 ${lam}`}>
            <rect x="6" y="6" width="688" height="528" rx="16" fill="#fffdf9" stroke="#e3d8c6" />
            <line x1="80" y1="470" x2="660" y2="470" stroke="#d7deea" strokeWidth="2" />
            <line x1="80" y1="470" x2="80" y2="60" stroke="#d7deea" strokeWidth="2" />

            <ellipse cx={cx} cy={cy} rx="108" ry="94" fill="#27446e" opacity=".08" />
            {OLD_CLOUD.map(([dx, dy], i) => (
              <circle key={`o${i}`} cx={cx + (dx - 0.25) * 280} cy={cy + (dy - 0.25) * 270} r="11" fill="#27446e" opacity=".85" />
            ))}
            <ellipse cx={nx} cy={ny} rx="92" ry="80" fill="#228d5c" opacity=".08" />
            {NEW_CLOUD.map(([dx, dy], i) => (
              <circle key={`n${i}`} cx={nx + (dx - 0.25) * 250} cy={ny + (dy - 0.25) * 250} r="11" fill="#e08a4c" opacity=".9" />
            ))}

            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#68778f" strokeWidth="2" strokeDasharray="7 6" />
            <text x={cx - 4} y={cy - 112} textAnchor="middle" fontSize="20" fill="#27446e">旧类（合并为一类）</text>
            <text x={nx + 10} y={ny - 108} textAnchor="middle" fontSize="20" fill="#b3572b">新类 Y(t)</text>
            <text x="370" y="514" textAnchor="middle" fontSize="19" fill="#68778f">新提取器输出的二维投影（示意）</text>
          </svg>
        </div>

        <div className="der-col" style={{ justifyContent: 'center', gap: 10 }}>
          <div className="der-col" style={{ gap: 2 }}>
            <div className="der-row der-spread">
              <label className="der-p" htmlFor="der-lam">
                <SymbolHint meaning="辅助损失的权重 λa，论文所有实验取 1">λa</SymbolHint>
              </label>
              <span className="der-num" style={{ fontSize: 30, color: feedback.tone }}>{lam.toFixed(1)}</span>
            </div>
            <input id="der-lam" className="der-slider" type="range" min={0} max={10} step={0.1}
              value={lam} onChange={e => setLam(Number(e.target.value))}
              aria-valuetext={`λa = ${lam}`} />
            <p className="der-p" style={{ color: feedback.tone, minHeight: 42 }}>{feedback.text}</p>
          </div>

          <div className="der-panel" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="der-p" style={{ fontWeight: 700 }}>辅助头输出（|Y(t)|+1 类，示意）</span>
            {[
              { label: '新类 1 / 2 / 3（各）', p: (1 - oldProb) / 3, tone: 'is-orange' },
              { label: '旧类（全部合并）', p: oldProb, tone: 'is-blue' },
            ].map(row => (
              <div key={row.label} className="der-row" style={{ gap: 10 }}>
                <span className="der-p" style={{ width: 250 }}>{row.label}</span>
                <div className={`der-meter ${row.tone}`} style={{ flex: 1 }}>
                  <span style={{ width: `${row.p * 100}%` }} />
                </div>
                <span className="der-p" style={{ width: 72, textAlign: 'right' }}>{(row.p * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          <div className="der-panel" style={{ padding: '10px 16px' }}>
            <div className="der-row der-spread">
              <span className="der-p" style={{ fontWeight: 700 }}>λa 敏感性</span>
              <span className="der-note-sm">CIFAR100-B0 · 10 步 · Table 6</span>
            </div>
            <svg viewBox="0 0 560 150" style={{ width: '100%', height: 150 }} role="img"
              aria-label="Table 6：λa 从 0.1 到 10 时平均准确率在 73.54 到 74.64 之间，仅波动约 1.1 个点">
              <line x1="30" y1="128" x2="540" y2="128" stroke="#d7deea" strokeWidth="2" />
              <text x="30" y="142" fontSize="15" fill="#93a0b4">70</text>
              <text x="30" y="26" fontSize="15" fill="#93a0b4">76</text>
              {TABLE6.map((row, i) => {
                const on = i === nearest;
                const h = 128 - by(row.value);
                return (
                  <g key={row.label}>
                    <rect x={bx(i)} y={by(row.value)} width="64" height={h} rx="4"
                      fill={on ? '#f07e47' : '#9fb6d4'} opacity={on ? 1 : .8} />
                    <text x={bx(i) + 32} y={by(row.value) - 8} textAnchor="middle" fontSize="16"
                      fontWeight={on ? 750 : 500} fill={on ? '#b3572b' : '#3b4a61'}>{row.value.toFixed(2)}</text>
                    <text x={bx(i) + 32} y={146} textAnchor="middle" fontSize="16" fill="#68778f">{row.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
