import React, { useMemo, useState } from 'react';

const ETA = [0.9, 0.95, 0.99, 0.999, 1];
const R_BAR = [34.0, 42.5, 47.2, 48.5, 6144];
const LAST = [76.5, 80.3, 81.0, 80.9, 80.8];

const RHO2 = Array.from({ length: 24 }, (_, i) => Math.exp(-i / 5.2) + 0.012);

/** 能量阈值：只保留累计相关能量达到 η 的前 r 条方向。 */
export function EnergyCut({ moduleId }: { moduleId: string }) {
  const [k, setK] = useState(2); // 默认 η=0.99
  const eta = ETA[k];
  const total = RHO2.reduce((s, v) => s + v, 0);
  const cum = useMemo(() => RHO2.map((_, i) => RHO2.slice(0, i + 1).reduce((s, v) => s + v, 0) / total), []);
  const r = Math.max(1, cum.findIndex((v) => v >= eta) + 1);

  const bx = (i: number) => 90 + i * 26;
  const by = (v: number) => 470 - (v / 1.05) * 360;

  return (
    <div className="rs">
      <div className="rs-panel" style={{ left: 0, top: 0, width: 900, height: 622 }}>
        <p className="rs-t muted">典型相关能量 ρ²：保留前 r 条，其余丢弃</p>
        <svg viewBox="0 0 860 500" width="100%" height="470" role="img" aria-label="能量阈值与保留方向数">
          <path d="M90 470H820" stroke="#b9c4d4" strokeWidth="2" />
          <path d="M90 60V470" stroke="#b9c4d4" strokeWidth="2" />
          {RHO2.map((v, i) => (
            <rect key={i} x={bx(i) - 8} y={by(v)} width="17" height={470 - by(v)} rx="3"
              fill={i < r ? '#27446e' : '#dfe5ee'} opacity={i < r ? 0.9 : 0.8} />
          ))}
          <path d={cum.map((v, i) => `${i === 0 ? 'M' : 'L'}${bx(i)} ${by(v * 1.0)}`).join(' ')}
            fill="none" stroke="#228d5c" strokeWidth="4" />
          <path d={`M${bx(r - 1)} 60V470`} stroke="#f07e47" strokeWidth="3" strokeDasharray="8 6" />
          <text x={bx(r - 1) + 10} y="86" fontSize="26" fill="#f07e47" fontWeight="700">演示截断 r={r}/24</text>
          <text x="455" y="500" textAnchor="middle" className="rs-tag">典型方向序号（演示 24 条）</text>
          <text x="86" y="52" textAnchor="end" className="rs-tag">ρ²</text>
          <text x="86" y={by(1) + 5} textAnchor="end" className="rs-tag">1.0</text>
          <text x="86" y={by(1) + 5} textAnchor="end" className="rs-tag" opacity="0">1.0</text>
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 924, top: 0, width: 548, height: 622 }}>
        <p className="rs-t muted">能量阈值 η</p>
        <div className="rs-choices" style={{ marginTop: 8 }}>
          {ETA.map((v, i) => (
            <button key={v} className={`rs-choice ${i === k ? 'is-on' : ''}`} onClick={() => setK(i)}>
              {v}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <p className="rs-t muted">平均保留方向数 r̄</p>
          <p className="rs-num">{R_BAR[k] === 6144 ? '6144' : R_BAR[k].toFixed(1)}</p>
          <p className="rs-t muted" style={{ marginTop: 8 }}>CIFAR-100 · Last Acc</p>
          <p className={`rs-num ${k === 2 ? 'rs-green' : ''}`}>{LAST[k].toFixed(1)}%</p>
        </div>

        <div className={`rs-feedback ${k === 2 ? 'good' : k === 4 ? 'warn' : ''}`} style={{ marginTop: 12 }}>
          {k === 0 && '阈值太低，砍掉太多能量，精度只有 76.5%。'}
          {k === 1 && '0.95 已接近饱和，80.3%。'}
          {k === 2 && '0.99 是论文取值：只留 47.2 条方向就够，81.0%。'}
          {k === 3 && '再放宽几乎没收益：80.9%。'}
          {k === 4 && '全保留等于不截断，方向多到 6144，反而引入噪声，80.8%。'}
        </div>
        <p className="rs-t muted" style={{ marginTop: 12 }}>
          数值为论文表 4（无 FTT、RFP 宽度 6144）；左侧 24 条柱为演示，真实 D′=6144。
        </p>
        <p className="rs-t muted" style={{ marginTop: 10 }}>判据：Σρ²ᵢ / Σρ² ≥ η。</p>
      </div>
    </div>
  );
}
