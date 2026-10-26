import { useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, fmt, Feedback } from './aqKit';

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

function Step({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const set = (d: number) => onChange(round1(clamp(value + d, -2, 2)));
  const dominant = Math.abs(value) >= 0.5;
  return (
    <div className="aq-cell" style={{ width: 140, height: 112, flexDirection: 'column', gap: 8, borderColor: dominant ? 'var(--green)' : 'var(--line)', background: dominant ? 'var(--green-soft)' : '#fbfcfe' }}>
      <span style={{ fontSize: 'var(--ppt-body-emphasis)', fontFamily: 'var(--ui-font-mono)', fontWeight: 800, color: dominant ? 'var(--green)' : '#33415a' }}>{fmt(value, 1)}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="aq-btn" onClick={() => set(0.1)} aria-label="增加 0.1">+</button>
        <button type="button" className="aq-btn" onClick={() => set(-0.1)} aria-label="减少 0.1">−</button>
      </div>
    </div>
  );
}

export function DiagDominant(_props: WidgetProps) {
  const [a11, setA11] = useState(1);
  const [a12, setA12] = useState(0);
  const [a21, setA21] = useState(0);
  const [a22, setA22] = useState(1);

  const d1 = Math.abs(a11) - Math.abs(a12);
  const d2 = Math.abs(a22) - Math.abs(a21);
  const strictlyDominant = d1 > 0 && d2 > 0;
  const det = a11 * a22 - a12 * a21;
  const nearSingular = Math.abs(det) < 0.05;

  const tone = strictlyDominant ? 'green' : nearSingular ? 'red' : 'orange';
  const feedback = strictlyDominant
    ? '严格对角支配，矩阵必可逆（Lévy–Desplanques 定理）'
    : nearSingular
      ? '行列式接近 0，矩阵接近奇异，可逆性已破坏'
      : '不满足对角支配，可逆性无保证';

  const domRow = (d: number) => (
    <div style={{ width: 140, height: 10, borderRadius: 999, background: '#eef2f7', overflow: 'hidden' }}>
      <div style={{ width: `${clamp(Math.abs(d) * 100, 0, 100)}%`, height: '100%', background: d > 0 ? '#228d5c' : '#c43f52', borderRadius: 999, transition: 'width 160ms ease' }} />
    </div>
  );

  return (
    <div className="aq-layout aq-two">
      <div className="aq-panel grow" style={{ alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 140px', gap: 14 }}>
          <Step value={a11} onChange={setA11} />
          <Step value={a12} onChange={setA12} />
          <Step value={a21} onChange={setA21} />
          <Step value={a22} onChange={setA22} />
        </div>
        <div className="aq-body">用 + / − 改 2×2 矩阵元素</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 28px', alignItems: 'center' }}>
          <span className="aq-body">第 1 行支配（|a₁₁|−|a₁₂|）</span>{domRow(d1)}<span className="aq-body muted">{fmt(d1, 2)}</span>
          <span className="aq-body">第 2 行支配（|a₂₂|−|a₂₁|）</span>{domRow(d2)}<span className="aq-body muted">{fmt(d2, 2)}</span>
        </div>
        <div className="aq-emphasis">det(A) = {fmt(det, 2)}</div>
        <div className="aq-legend">
          <span><i className="aq-dot" style={{ background: strictlyDominant ? '#228d5c' : nearSingular ? '#c43f52' : '#f07e47' }} />{strictlyDominant ? '可逆（有保证）' : nearSingular ? '接近奇异' : '可逆未知'}</span>
        </div>
      </div>
      <div className="aq-panel">
        <div className="aq-heading">Lévy–Desplanques 定理</div>
        <p className="aq-body"><b>严格对角支配</b>：每一行 |对角元| 都严格大于该行其余 |非对角元| 之和，则矩阵必可逆。</p>
        <p className="aq-body muted">这是<b>充分非必要</b>条件——满足就保证可逆，但可逆矩阵不必都对角支配。</p>
        <p className="aq-note">论文用它兜底：<b>初始化只设对角</b>，训练中用渐进掩码维持对角支配，避免 A 在优化中变奇异。</p>
        <Feedback tone={tone}>{feedback}</Feedback>
      </div>
    </div>
  );
}