import React, { useState } from 'react';
import { C, FONT, T, S, fmt, clamp, dragHandle, Verdict } from './ewcKit';
import type { Vec } from './ewcMath';

const W = 640, H = 384;
const BASE = 300, MAXH = 236, GAP = 96, LEFT = 66;
const RAW_A: Vec = [0.9, 0.6, 0.3, 0, 0, 0];
const SEPARATE: Vec = [0, 0, 0, 0.3, 0.6, 0.9];

const normalise = (v: Vec) => { const s = v.reduce((a, b) => a + b, 0); return s > 0 ? v.map(x => x / s) : v.map(() => 0); };
/** Appendix 4.3 with diagonal Fishers: overlap = 1 − d² = Σ_i sqrt(f̂1_i · f̂2_i) after unit-trace normalisation. */
const overlapOf = (a: Vec, b: Vec) => { const na = normalise(a), nb = normalise(b); return na.reduce((s, x, i) => s + Math.sqrt(x * nb[i]), 0); };

export function EwcOverlap() {
  const [rawB, setRawB] = useState<Vec>(SEPARATE);
  const ov = overlapOf(RAW_A, rawB);
  const setBar = (i: number, y: number) => setRawB(b => b.map((x, j) => (j === i ? clamp((BASE - y) / MAXH, 0, 1) : x)));
  const nudge = (i: number, d: number) => setRawB(b => b.map((x, j) => (j === i ? clamp(x + d, 0, 1) : x)));
  let verdict: React.ReactNode;
  if (ov > 0.85) verdict = <Verdict tone="good">两首歌几乎用同一批推子：共享表示。</Verdict>;
  else if (ov < 0.2) verdict = <Verdict tone="bad">两首歌用互不相交的推子：网络被分割。</Verdict>;
  else verdict = <Verdict tone="info">部分共用、部分独占。</Verdict>;
  return <div className="ewc-page">
    <div className="ewc-side" style={{ flex: '0 0 640px' }}>
      <div className="ewc-scene" style={{ width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="任务 A（蓝，固定）与任务 B（绿，可拖动）在六个权重上的 Fisher 重要性">
          <rect x="22" y="14" width="30" height="14" rx="3" fill={C.blue} />
          <text x="62" y="30" fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>任务 A</text>
          <rect x="190" y="14" width="30" height="14" rx="3" fill={C.green} />
          <text x="230" y="30" fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>任务 B（拖动绿柱）</text>
          <line x1="30" x2={W - 20} y1={BASE} y2={BASE} stroke={C.muted} strokeWidth="3" />
          {RAW_A.map((a, i) => {
            const cx = LEFT + GAP * i;
            const hb = rawB[i] * MAXH;
            return <g key={i}>
              <rect x={cx - 36} y={BASE - a * MAXH} width="34" height={a * MAXH} rx="5" fill={C.blue} />
              <rect x={cx + 2} y={BASE - hb} width="34" height={hb} rx="5" fill={C.green} />
              <rect x={cx - 2} y={BASE - MAXH - 16} width="46" height={MAXH + 40} fill="transparent" role="slider" aria-label={`任务 B 在权重 ${i + 1} 上的重要性`}
                aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(rawB[i].toFixed(2))}
                {...dragHandle(p => setBar(i, p.y), (k, sh) => { const s = sh ? 0.2 : 0.05; if (k === 'ArrowUp' || k === 'ArrowRight') nudge(i, s); if (k === 'ArrowDown' || k === 'ArrowLeft') nudge(i, -s); })} />
              <text x={cx} y={BASE + 42} textAnchor="middle" fontSize={T.body} fill={C.muted} fontFamily={FONT}>权重{i + 1}</text>
            </g>;
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span className="ewc-big" style={{ color: ov > 0.85 ? C.green : ov < 0.2 ? C.red : C.blue }}>重叠 {fmt(ov)}</span>
        <span className="ewc-muted">= Σ √(f̂ᴀ f̂ʙ)</span>
      </div>
      <div className="ewc-btns">
        <button className="ewc-btn" onClick={() => setRawB(RAW_A.slice())}>与 A 相同</button>
        <button className="ewc-btn" onClick={() => setRawB(SEPARATE)}>完全分开</button>
      </div>
    </div>
    <div className="ewc-side">
      <figure className="ewc-fig" style={{ height: 462 }}>
        <img src="./images/fig2c.png" alt="原论文 Figure 2C：两种排列幅度下 Fisher 重叠随网络深度的变化" style={{ maxHeight: 440 }} />
      </figure>
      <div className="ewc-formula" style={{ fontSize: 'var(--ppt-body-text)' }}>
        重叠 = 1 − <S m="d²：两任务单位迹 Fisher 之间的 Fréchet 距离的平方，取值在 0 到 1。">d</S>²，d² = ½‖F̂₁<sup>½</sup> − F̂₂<sup>½</sup>‖²<sub>F</sub>
      </div>
      {verdict}
    </div>
  </div>;
}
