import React, { useState } from 'react';
import { C, clamp, fmt } from './tailorKit';
import './tailor.css';

const COLS = 8;
const ROWS = 6;
const CELL = 44;
const rold = (r: number, c: number) => 0.15 + 0.55 * (((c * 3 + r * 5) % 7) / 6);
const delta = (r: number, c: number) =>
  0.06 + 0.82 * Math.exp(-(((c - 5.2) ** 2) / 3.2 + ((r - 2) ** 2) / 2.4));
const MAXD = 0.88;

/** p8：软掩码按“改动大小”决定每格用新坐标还是旧坐标，b 是总闸门。 */
export function RapfSoftMask() {
  const [b, setB] = useState(0.05);
  const mask = (r: number, c: number) => clamp(delta(r, c) / MAXD + b, 0, 1);
  const avgM =
    Array.from({ length: ROWS * COLS }, (_, i) => mask(Math.floor(i / COLS), i % COLS)).reduce((a, v) => a + v, 0) /
    (ROWS * COLS);

  const tone = b < -0.05 ? 'warn' : b > 0.25 ? 'bad' : 'ok';
  const feedback =
    b < -0.05
      ? '闸门压得太狠：新学的几乎进不来，新任务学不动（塑性不足）。'
      : b > 0.25
      ? '闸门开太大：大片坐标被换成新的，旧款版型被改坏（稳定性崩）。'
      : '闸门适中：改动大的格子取新坐标，没动的格子保留旧坐标。';

  const gx = (i: number) => 44 + i * (COLS * CELL + 56);

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label={`偏置 b = ${b.toFixed(2)}，平均融合权重 ${avgM.toFixed(2)}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />

          <text x={gx(0)} y={96} fontSize={21} fill={C.ink} fontWeight={700}>
            软掩码 M（每格一个 0–1）
          </text>
          <text x={gx(1)} y={96} fontSize={21} fill={C.ink} fontWeight={700}>
            融合后坐标 R
          </text>

          {[0, 1].map((panel) =>
            Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const m = mask(r, c);
                const oldV = rold(r, c);
                const newV = Math.min(1, oldV + delta(r, c));
                const fused = (1 - m) * oldV + m * newV;
                const x = gx(panel) + c * CELL;
                const y = 118 + r * CELL;
                if (panel === 0) {
                  return (
                    <g key={`m${r}-${c}`}>
                      <rect x={x} y={y} width={CELL - 3} height={CELL - 3} rx={5}
                        fill={`rgba(240,126,71,${0.06 + m * 0.9})`} stroke={C.line} strokeWidth={1} />
                      <text x={x + CELL / 2 - 1} y={y + CELL / 2 + 5} textAnchor="middle" fontSize={13} fill={m > 0.5 ? '#5a2a0c' : C.muted}>
                        {fmt(m, 1)}
                      </text>
                    </g>
                  );
                }
                return (
                  <g key={`f${r}-${c}`}>
                    <rect x={x} y={y} width={CELL - 3} height={CELL - 3} rx={5}
                      fill={`rgba(34,141,92,${0.05 + fused * 0.75})`} stroke={C.line} strokeWidth={1} />
                    <text x={x + CELL / 2 - 1} y={y + CELL / 2 + 5} textAnchor="middle" fontSize={13} fill={fused > 0.5 ? '#0f4a30' : C.muted}>
                      {fmt(fused, 1)}
                    </text>
                  </g>
                );
              })
            )
          )}

          <text x={gx(0)} y={412} fontSize={20} fill={C.muted}>
            M = min(1, |Δ| / max|Δ| + b)
          </text>
          <text x={gx(1)} y={412} fontSize={20} fill={C.muted}>
            R = (J − M) ⊙ R_old + M ⊙ R_new
          </text>

          <g>
            <rect x={44} y={438} width={812} height={72} rx={14} fill="#fffdf7" stroke={C.line} strokeWidth={2} />
            <text x={64} y={468} fontSize={20} fill={C.muted}>
              偏置 b =
            </text>
            <text x={64} y={500} fontSize={22} fill={C.ink} fontWeight={700}>
              {fmt(b)} ｜ 全格平均融合权重 {fmt(avgM)}
            </text>
          </g>

          <text x={24} y={544} fontSize={20} fill={C.muted}>
            拖动滑块改变 b；格内数值为示意
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>b 是稳与塑的总闸门</h4>
          <p style={{ margin: 0 }}>改动越大表示越是新学的，融合时越该保留新的。</p>
        </div>
        <label className="tailor-muted" htmlFor="bias">
          偏置 b = {fmt(b)}
        </label>
        <input id="bias" className="tailor-slider" type="range" min={-0.2} max={0.4} step={0.02} value={b}
          onChange={(e) => setB(Number(e.target.value))} />
        <div className={`tailor-feedback ${tone}`}>{feedback}</div>
        <div className="tailor-src">式 (7)(10)（p.7–8）。论文把 b 记为常数偏置，未在正文给出取值。</div>
      </aside>
    </div>
  );
}
