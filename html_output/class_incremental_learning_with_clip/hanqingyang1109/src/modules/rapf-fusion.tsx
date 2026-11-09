import React, { useState } from 'react';
import { C, clamp } from './tailorKit';
import './tailor.css';

const BANDS = 8;

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

const SHIRT = 'M-36 -46 L-14 -53 L0 -40 L14 -53 L36 -46 L53 -16 L37 -5 L34 52 L-34 52 L-37 -5 L-53 -16 Z';

/** p9：整体平均 vs 逐格掩码融合。平均只吸取一半改动；掩码按重要性决定每格取多少。 */
export function RapfFusion() {
  const [ratio, setRatio] = useState(0.25);
  const changed = Math.round(ratio * BANDS);
  const keep = BANDS - changed;
  const half = mix(C.red, C.blue, 0.5);

  const tone = changed === 0 ? 'warn' : changed >= BANDS ? 'bad' : 'ok';
  const feedback =
    changed === 0
      ? '没有格子被改动：两种融合都不会改变任何参数，左右两件完全一样。'
      : changed >= BANDS
      ? '改动铺满整件：平均法每格只吸收一半，掩码法每格全取新值。'
      : '同样改了 ' + changed + ' 块：平均法只把这几块拉到新旧中间，掩码法直接取新值。';

  const shirt = (x: number, y: number, s: number, colors: string[], clipId: string) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={SHIRT} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {colors.map((col, i) => (
          <rect key={i} x={-60} y={-56 + i * 13.5} width={120} height={13.9} fill={col} />
        ))}
      </g>
      <path d={SHIRT} fill="none" stroke="#ffffff" strokeWidth={3} strokeLinejoin="round" />
      <path d="M-14 -53 Q0 -33 14 -53" fill="none" stroke="#ffffff" strokeWidth={3} />
    </g>
  );

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label={`改动 ${changed} 格：左侧整体平均，右侧逐格掩码`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x="0" y="430" width="900" height="130" fill={C.light} opacity="0.4" />
          <path d="M0 430 H900" stroke={C.wood} strokeWidth="4" opacity="0.45" />

          <g>
            <rect x={36} y={74} width={388} height={434} rx={18} fill="#ffffff" stroke={C.red} strokeWidth={3} />
            <text x={230} y={112} textAnchor="middle" fontSize={22} fill={C.red} fontWeight={700}>
              直接平均 0.5 旧 + 0.5 新
            </text>
            {shirt(
              230,
              262,
              1.06,
              Array.from({ length: BANDS }, (_, i) => (i < keep ? C.red : half)),
              'clip-avg'
            )}
            <text x={230} y={404} textAnchor="middle" fontSize={20} fill={C.muted}>
              改动处只到新旧中间
            </text>
            <text x={230} y={446} textAnchor="middle" fontSize={21} fill={C.red} fontWeight={700}>
              旧款保留度 {Math.round(100 - 50 * ratio)}%
            </text>
          </g>

          <g>
            <rect x={460} y={74} width={400} height={434} rx={18} fill="#ffffff" stroke={C.green} strokeWidth={3} />
            <text x={660} y={112} textAnchor="middle" fontSize={22} fill={C.green} fontWeight={700}>
              逐格掩码融合
            </text>
            {shirt(
              660,
              262,
              1.06,
              Array.from({ length: BANDS }, (_, i) => (i < keep ? C.red : C.blue)),
              'clip-mask'
            )}
            <text x={660} y={404} textAnchor="middle" fontSize={20} fill={C.muted}>
              {changed} 块全取新值，{keep} 块原样
            </text>
            <text x={660} y={446} textAnchor="middle" fontSize={21} fill={C.green} fontWeight={700}>
              旧款保留度 {Math.round(100 - 100 * ratio)}%
            </text>
          </g>

          <text x={24} y={546} fontSize={20} fill={C.muted}>
            拖动滑块改变“改动格比例”，看两种融合的差别
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>平均只吸取一半的改动</h4>
          <p style={{ margin: 0 }}>
            原文：不同于直接算参数平均，本文的融合更细粒度，并考虑了任务之间的共享知识。
          </p>
        </div>
        <label className="tailor-muted" htmlFor="ratio">
          改动格比例 = {clamp(ratio, 0, 1).toFixed(2)}（{changed}/{BANDS} 格）
        </label>
        <input
          id="ratio"
          className="tailor-slider"
          type="range"
          min={0}
          max={1}
          step={0.125}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
        />
        <div className={`tailor-feedback ${tone}`}>{feedback}</div>
        <div className="tailor-src">
          式 (10)(11)（p.8）；“更细粒度”见 p.3。本页把掩码简化为“全取或全不取”，真实 M 是 0–1 连续权重。
        </div>
      </aside>
    </div>
  );
}
