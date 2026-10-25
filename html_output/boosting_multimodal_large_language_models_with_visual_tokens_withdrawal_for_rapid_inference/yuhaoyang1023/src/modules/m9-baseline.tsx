import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Seg, EvChip, Tag, ScrollX } from '../ui/kit';
import { computeFlops } from '../lib/flops';
import { DIVPRUNE_VTW, TABLE2 } from '../data/tables';

// 9.2 基线论文里的 VTW ≠ VTW 原文推荐配置。
// 左：VTW 原文（表 2：K 手动设为 16 / 20 / 16）；右：DivPrune 把 VTW 当基线（关闭校准，K = 4 / 4 / 3）。
// 两篇论文的 TFLOP 公式、数据集与 MME 口径都不同；只对照配置，不直接比较数字大小。

const MAP = [
  { id: '7b', name: 'LLaVA-1.5-7B', N: 32, vtwK: 16, dp: DIVPRUNE_VTW[0], t2: TABLE2[0], model: 'l15-7b', s: 641.4, V: 576 },
  { id: '13b', name: 'LLaVA-1.5-13B', N: 40, vtwK: 20, dp: DIVPRUNE_VTW[1], t2: TABLE2[1], model: 'l15-13b', s: 642.2, V: 576 },
  { id: 'next', name: 'LLaVA-1.6 / NeXT-7B', N: 32, vtwK: 16, dp: DIVPRUNE_VTW[2], t2: TABLE2[2], model: 'next-7b', s: 2057.5, V: 1990.2 },
] as const;
type Id = (typeof MAP)[number]['id'];

function Strip({ N, K, label }: { N: number; K: number; label: string }) {
  return (
    <div className="lstrip">
      <div className="lstrip-head">
        <b>{label}</b>
        <span className="lstrip-note">前 {K} 层带视觉 token，之后 {N - K} 层只剩文字</span>
      </div>
      <div className="lstrip-cells" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: N }, (_, i) => (
          <span key={i} className={i < K ? 'is-full' : ''} style={{ transitionDelay: `${Math.abs(i - K) * 12}ms` }} />
        ))}
      </div>
    </div>
  );
}

export const M9Baseline: React.FC<WidgetProps> = () => {
  const [id, setId] = useState<Id>('7b');
  const m = MAP.find((x) => x.id === id)!;
  const ours = (K: number) => computeFlops({ model: m.model, s: m.s, V: m.V, method: 'vtw', K, R: 0.5, conv: 'code', scope: 'all' }).ratio;
  const vtwRow = m.t2.rows.find((r) => r.key === 'vtw')!;
  const baseRow = m.t2.rows.find((r) => r.key === 'base')!;

  return (
    <div className="mod-stack">
      <Seg small label="模型" value={id} onChange={setId} options={MAP.map((x) => ({ value: x.id, label: x.name }))} />
      <div className="lstrips" key={id}>
        <Strip N={m.N} K={m.vtwK} label={`VTW 原文（表 2）· K = ${m.vtwK}`} />
        <Strip N={m.N} K={m.dp.K} label={`DivPrune 中的 VTW · K = ${m.dp.K}`} />
      </div>
      <ScrollX label="配置对照表，可横向滚动">
        <table className="tbl tbl-compact">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">VTW 原文</th>
              <th scope="col">DivPrune 里的 VTW</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">如何选 K</th>
              <td>论文默认 KL 校准；表 2 为对齐 FastV 的 FLOPs 手动设 K</td>
              <td>关闭校准，按 FLOP 目标选层 <EvChip id="dp41" /></td>
            </tr>
            <tr>
              <th scope="row">K</th>
              <td>{m.vtwK}</td>
              <td>
                {m.dp.K} <EvChip id="dpSupp" />
              </td>
            </tr>
            <tr>
              <th scope="row">报告的计算比例</th>
              <td>{vtwRow.tflops.replace(/^.*\(/, '').replace(')', '')}（VTW 的口径）</td>
              <td>{m.dp.ratio}（DivPrune 的口径）</td>
            </tr>
            <tr>
              <th scope="row">本页按 VTW 口径估算</th>
              <td>{ours(m.vtwK).toFixed(1)}%</td>
              <td>
                {ours(m.dp.K).toFixed(1)}% <Tag kind="extrap" />
              </td>
            </tr>
            <tr>
              <th scope="row">MME</th>
              <td>
                总分 {vtwRow.values[5].toFixed(2)}（原模型 {baseRow.values[5].toFixed(2)}）
              </td>
              <td>
                感知分 {m.dp.mmeP}（原模型 {m.dp.mmeOrig}）<EvChip id="dpT1" />
              </td>
            </tr>
            <tr>
              <th scope="row">POPE</th>
              <td>
                {vtwRow.values[4].toFixed(2)}（原模型 {baseRow.values[4].toFixed(2)}；指标原文未说明）
              </td>
              <td>
                F1 {m.dp.pope}（原模型 {m.dp.popeOrig}）
              </td>
            </tr>
          </tbody>
        </table>
      </ScrollX>
      <Feedback
        tone="warn"
        k={id}
        lead={
          <>
            DivPrune 里的 VTW 在第 {m.dp.K} 层就撤出（原文用 {m.vtwK}），只保留约 {ours(m.dp.K).toFixed(0)}% 的计算——那里的“VTW 崩溃”评价的是极端配置，不是 VTW 原文推荐的用法。
          </>
        }
        more={
          <>
            <p>
              两篇论文的 TFLOP 公式、数据集与 MME 口径都不同（DivPrune 报 MME 感知分，VTW 报 14 个子任务总分），所以表中两列的数字不能直接比大小。第 7 章的 KL 曲线（示意）与图 8(a) 都显示，K 太小时输出会明显偏离原模型。
            </p>
            <p>
              另外，DivPrune §4.5 解释基线端到端更慢是因为“剪枝计算要在每个解码步重复” <EvChip id="dp45" />。这与 VTW 官方代码不符：VTW 只在预填充时撤出一次，解码步不再做任何选择 <EvChip id="cDrop" />。DivPrune 用的是否为官方实现，原文未说明。
            </p>
            <p>
              FastV 论文（2024 年 3 月）早于 VTW，全文没有出现 VTW <EvChip id="fastv" />。
            </p>
          </>
        }
      />
    </div>
  );
};
