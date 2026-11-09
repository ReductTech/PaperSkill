import React, { useState } from 'react';
import { C, fmt } from './tailorKit';
import './tailor.css';

const NEWS = ['泥龟', '新类 A', '新类 B', '新类 C'];
const OLDS = ['箱龟', '旧类 A', '旧类 B', '旧类 C', '旧类 D', '旧类 E'];
const D: number[][] = [
  [0.38, 0.55, 0.92, 0.61, 1.04, 0.88],
  [0.47, 0.33, 0.86, 0.58, 1.02, 0.9],
  [0.94, 0.88, 0.41, 0.71, 0.52, 0.62],
  [1.01, 0.95, 0.66, 0.83, 0.44, 0.36],
];
const ALPHA = 0.65;

/** p4：距离矩阵——哪些配对入选，哪些老类被调整（新类不调整）。 */
export function RapfPairMatrix() {
  const [cell, setCell] = useState<[number, number]>([0, 0]);
  const [row, col] = cell;
  const d = D[row][col];
  const inSet = d < ALPHA;
  const activeCols = OLDS.map((_, c) => D.some((r) => r[c] < ALPHA));
  const pairCount = D.flat().filter((v) => v < ALPHA).length;

  const tone = inSet ? 'ok' : 'plain';
  const feedback = inSet
    ? `这一对会被推开：老类「${OLDS[col]}」因此进入调整集合。`
    : `距离 ${fmt(d)} 超过 α，不推；这一对不占用采样预算。`;

  const cellX = (c: number) => 196 + c * 92;
  const cellY = (r: number) => 176 + r * 66;

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label={`距离矩阵，共 ${pairCount} 对入选`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />

          {OLDS.map((o, c) => (
            <g key={o}>
              <text x={cellX(c) + 46} y={160} textAnchor="middle" fontSize={20} fill={C.ink}>
                {o}
              </text>
              <circle cx={cellX(c) + 46} cy={476} r={7} fill={activeCols[c] ? C.orange : C.line} />
            </g>
          ))}
          <text x={196} y={508} fontSize={20} fill={C.muted}>
            橙点 = 该老类进入调整集合
          </text>

          {NEWS.map((n, r) => (
            <text key={n} x={150} y={cellY(r) + 40} textAnchor="end" fontSize={20} fill={C.ink}>
              {n}
            </text>
          ))}

          {NEWS.map((_, r) =>
            OLDS.map((_, c) => {
              const v = D[r][c];
              const on = v < ALPHA;
              const sel = r === row && c === col;
              const shade = Math.max(0, Math.min(1, (1.15 - v) / 0.85));
              return (
                <g
                  key={`${r}-${c}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`新类 ${NEWS[r]} 与旧类 ${OLDS[c]} 的距离 ${v}`}
                  onClick={() => setCell([r, c])}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCell([r, c]);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={cellX(c)}
                    y={cellY(r)}
                    width={88}
                    height={62}
                    rx={8}
                    fill={on ? `rgba(240,126,71,${0.12 + shade * 0.5})` : '#ffffff'}
                    stroke={sel ? C.blue : on ? C.orange : C.line}
                    strokeWidth={sel ? 4 : 2}
                  />
                  <text x={cellX(c) + 44} y={cellY(r) + 39} textAnchor="middle" fontSize={20} fill={on ? '#8a4318' : C.muted}>
                    {fmt(v)}
                  </text>
                </g>
              );
            })
          )}

          <text x={24} y={546} fontSize={21} fill={C.muted}>
            点格子看是否入选（α = 0.65）；仅箱龟/泥龟出自 Fig.1，其余为占位类别
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>调整集合怎么来</h4>
          <p style={{ margin: 0 }}>
            新类数据充足，不动它的表示；需要调整的只是被选中的老类。
          </p>
        </div>
        <div className="tailor-kv">
          <span>选中</span>
          <b>
            {NEWS[row]} × {OLDS[col]}
          </b>
          <span>距离 D</span>
          <b>{fmt(d)}</b>
          <span>入选对数</span>
          <b>{pairCount} 对</b>
        </div>
        <div className={`tailor-feedback ${tone}`}>{feedback}</div>
        <div className="tailor-src">表内距离为教学示意；论文的真实邻居集合由 CLIP 文本特征在具体数据集上算出。</div>
      </aside>
    </div>
  );
}
