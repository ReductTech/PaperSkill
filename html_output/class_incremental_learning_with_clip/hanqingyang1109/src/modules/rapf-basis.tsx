import React, { useState } from 'react';
import { C, fmt } from './tailorKit';
import './tailor.css';

const COLS = 8;
const ROWS = 6;
const CELL = 54;
const GX = 48;
const GY = 116;

const rold = (r: number, c: number) => 0.15 + 0.55 * (((c * 3 + r * 5) % 7) / 6);
const delta = (r: number, c: number) =>
  0.06 + 0.82 * Math.exp(-(((c - 5.2) ** 2) / 3.2 + ((r - 2) ** 2) / 2.4));

/** p7：同一张方格打版纸（共享正交基 B）上，两套纸样的坐标才可比。 */
export function RapfBasis() {
  const [cell, setCell] = useState<[number, number]>([2, 5]);
  const [r, c] = cell;
  const oldV = rold(r, c);
  const dV = delta(r, c);
  const newV = Math.min(1, oldV + dV);

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label="方格打版纸上的旧纸样与新纸样坐标">
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />

          <text x={GX} y={92} fontSize={22} fill={C.ink} fontWeight={700}>
            同一张方格打版纸 B
          </text>
          <text x={GX + 250} y={92} fontSize={20} fill={C.muted}>
            格内深色 = 新学到的改动
          </text>

          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const d = delta(r, c);
              const sel = r === cell[0] && c === cell[1];
              return (
                <g key={`${r}-${c}`} role="button" tabIndex={0} aria-label={`第 ${r + 1} 行第 ${c + 1} 列`}
                  onClick={() => setCell([r, c])}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCell([r, c]);
                    }
                  }}
                  style={{ cursor: 'pointer' }}>
                  <rect x={GX + c * CELL} y={GY + r * CELL} width={CELL - 4} height={CELL - 4} rx={6}
                    fill={`rgba(240,126,71,${0.08 + d * 0.82})`}
                    stroke={sel ? C.blue : C.line} strokeWidth={sel ? 4 : 1.5} />
                  <text x={GX + c * CELL + CELL / 2 - 2} y={GY + r * CELL + CELL / 2 + 6} textAnchor="middle"
                    fontSize={16} fill={d > 0.45 ? '#5a2a0c' : C.muted}>
                    {fmt(d, 1)}
                  </text>
                </g>
              );
            })
          )}

          {/* 两种比较方式 */}
          <g>
            <rect x={520} y={110} width={340} height={120} rx={14} fill="#fdecee" stroke={C.red} strokeWidth={2} />
            <text x={540} y={144} fontSize={21} fill={C.red} fontWeight={700}>
              直接比较整块 W
            </text>
            <text x={540} y={182} fontSize={20} fill="#8d2b3b">
              差异混在整块矩阵里
            </text>
            <text x={540} y={214} fontSize={20} fill="#8d2b3b">
              分不清共享与任务特定
            </text>
          </g>
          <g>
            <rect x={520} y={250} width={340} height={120} rx={14} fill="#eaf5ee" stroke={C.green} strokeWidth={2} />
            <text x={540} y={284} fontSize={21} fill={C.green} fontWeight={700}>
              投影到同一基 B
            </text>
            <text x={540} y={322} fontSize={20} fill="#1b6b47">
              B ＝ 共享知识空间
            </text>
            <text x={540} y={354} fontSize={20} fill="#1b6b47">
              R ＝ 任务特定坐标
            </text>
          </g>

          <g>
            <rect x={48} y={452} width={812} height={72} rx={14} fill="#fffdf7" stroke={C.line} strokeWidth={2} />
            <text x={68} y={482} fontSize={20} fill={C.muted}>
              选中格：
            </text>
            <text x={68} y={512} fontSize={21} fill={C.ink}>
              R_old = {fmt(oldV)} ｜ R_new = {fmt(newV)} ｜ |Δ| = {fmt(newV - oldV)}
            </text>
          </g>

          <text x={24} y={548} fontSize={20} fill={C.muted}>
            点格子读取旧、新坐标；格内数值为示意
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>B 与 R 的分工</h4>
          <p style={{ margin: 0 }}>
            SVD 把旧参数拆成正交基 B 与坐标 R_old，再把新参数投影到同一个 B。
          </p>
        </div>
        <div className="tailor-feedback plain">
          B 不是用来降维的，是用来让两套纸样落在同一张纸上，坐标才能逐格相减。
        </div>
        <div className="tailor-src">式 (8)(9)（p.7–8）：“compare under the same standard”。</div>
      </aside>
    </div>
  );
}
