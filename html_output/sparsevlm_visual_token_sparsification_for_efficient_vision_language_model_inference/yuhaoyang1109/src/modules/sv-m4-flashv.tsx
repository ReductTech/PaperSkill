import React, { useState } from 'react';
import { C, Feedback, Seg, Swatch, Tag, XScroll } from './sv-kit';
import type { WidgetProps } from './registry';

// 4.2 附录 B 的特制 V 矩阵：O = A·V，V 的评分员行为 1/n、其余为 0。
// 按字面，O 的第 q 行 = 第 q 个位置对各评分员注意力的平均，而 Eq. (3) 需要的是评分员对各视觉 token 注意力的平均。
// 6 个位置的小矩阵（教学示意，每行和为 1），因果掩码挡住的格子为 0。

const TOKS = [
  { k: 'S1', kind: 'sys' },
  { k: 'S2', kind: 'sys' },
  { k: 'V1', kind: 'vis' },
  { k: 'V2', kind: 'vis' },
  { k: 'R1', kind: 'rater' },
  { k: 'R2', kind: 'rater' },
] as const;
// 因果注意力（行 = query，列 = key），上三角为 0
const A = [
  [1, 0, 0, 0, 0, 0],
  [0.55, 0.45, 0, 0, 0, 0],
  [0.4, 0.25, 0.35, 0, 0, 0],
  [0.3, 0.2, 0.22, 0.28, 0, 0],
  [0.22, 0.1, 0.38, 0.12, 0.18, 0],
  [0.2, 0.08, 0.16, 0.32, 0.1, 0.14],
];
const RATER_IDX = [4, 5];
const VIS_IDX = [2, 3];

type View = 'eq3' | 'appB';

export function SvFlashV(_: WidgetProps) {
  const [view, setView] = useState<View>('eq3');
  const inEq3 = (i: number, j: number) => RATER_IDX.includes(i) && VIS_IDX.includes(j);
  const inAppB = (_i: number, j: number) => RATER_IDX.includes(j);
  const on = (i: number, j: number) => (view === 'eq3' ? inEq3(i, j) : inAppB(i, j));
  const eq3 = VIS_IDX.map((j) => RATER_IDX.reduce((a, i) => a + A[i][j], 0) / RATER_IDX.length);
  const appB = A.map((row) => RATER_IDX.reduce((a, j) => a + row[j], 0) / RATER_IDX.length);
  const color = (kind: string) => (kind === 'vis' ? C.vis : kind === 'rater' ? C.rater : C.sys);

  return (
    <div className="sv-live sv-mod">
      <Seg
        label="读法"
        value={view}
        onChange={setView}
        options={[
          { value: 'eq3', label: 'Eq. (3) 需要的：评分员行 × 视觉列' },
          { value: 'appB', label: '附录 B 字面：O = A·V（V 的评分员行 = 1/n）' },
        ]}
      />
      <div className="lv-split">
        <div className="sv-col">
          <XScroll label="注意力矩阵">
          <table className="sv-fv" aria-label="6 个位置的因果注意力矩阵（行 = query，列 = key）">
            <thead>
              <tr>
                <th scope="col">query ↓ / key →</th>
                {TOKS.map((t) => (
                  <th key={t.k} scope="col" style={{ color: color(t.kind) }}>
                    {t.k}
                  </th>
                ))}
                <th scope="col">{view === 'eq3' ? '' : 'O（本行结果）'}</th>
              </tr>
            </thead>
            <tbody>
              {A.map((row, i) => (
                <tr key={i}>
                  <th scope="row" style={{ color: color(TOKS[i].kind) }}>
                    {TOKS[i].k}
                  </th>
                  {row.map((v, j) => {
                    const masked = j > i;
                    const hl = on(i, j);
                    return (
                      <td key={j} className={`${masked ? 'is-masked' : ''} ${hl ? (masked ? 'is-hl-zero' : 'is-hl') : ''}`}>
                        {masked ? '0' : v.toFixed(2)}
                      </td>
                    );
                  })}
                  <td className="sv-fv-out">{view === 'appB' ? <b className={VIS_IDX.includes(i) ? 'is-zero' : ''}>{appB[i].toFixed(2)}</b> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </XScroll>
        </div>
        <div className="lv-side">
          {view === 'eq3' ? (
            <>
              <div className="sv-reads">
                <Readout2 k="V1 的分数" v={eq3[0]} />
                <Readout2 k="V2 的分数" v={eq3[1]} />
              </div>
              <Feedback tone="ok" k="eq3">
                评分员排在图像之后，“评分员看视觉 token”这一块在因果掩码下有值。对两个评分员求平均，V1 = {eq3[0].toFixed(2)}、V2 = {eq3[1].toFixed(2)}，可以排序。
              </Feedback>
            </>
          ) : (
            <>
              <div className="sv-reads">
                <Readout2 k="O 的 V1 行" v={appB[2]} bad />
                <Readout2 k="O 的 V2 行" v={appB[3]} bad />
              </div>
              <Feedback tone="bad" k="appB">
                按字面相乘，O 的每一行是“这个位置看评分员”的平均。V1、V2 排在评分员之前，看不到它们，所以 O 的视觉部分恒为 0，无法用来排序。附录 B 应当省略了转置或别的细节，原因未知。
              </Feedback>
            </>
          )}
          <div className="sv-legend">
            <span>
              <Swatch color={C.green} />
              被加总的格子
            </span>
            <span>
              <Swatch color={C.red} />
              被加总但被掩码挡住（恒为 0）
            </span>
          </div>
          <p className="sv-small">
            <Tag kind="extrap" /> 本页按附录 B（第 12–13 页）字面推导；<Tag kind="demo" /> 矩阵数值为示意。固定代码没有用这个技巧，而是在剪枝层显式计算完整注意力 <Tag kind="code" />。
          </p>
        </div>
      </div>
    </div>
  );
}

function Readout2({ k, v, bad = false }: { k: string; v: number; bad?: boolean }) {
  return (
    <div className={`sv-read ${bad ? 'is-red' : 'is-green'}`}>
      <span className="sv-read-k">{k}</span>
      <b className="sv-read-v">{v.toFixed(2)}</b>
    </div>
  );
}
