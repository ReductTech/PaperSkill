import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Controls, Feedback, Seg, Slider, EvChip, Btn } from '../ui/kit';
import { computeFlops, type FlopsConfig } from '../lib/flops';
import { useTween } from '../lib/hooks';

// 5.2 层号口径对照：同一个 K，Eq.(5)/图 2 与 表 1/官方代码给出的“带视觉 token 的层数”差一层。
// 下方用 Eq.(1) 复算两种口径的 TFLOPs 比例（公式外推），并与表 2 对照。

const CFG = {
  '7b': { N: 32, s: 641.4, model: 'l15-7b', paperK: 16, paper: 55.19 },
  '13b': { N: 40, s: 642.2, model: 'l15-13b', paperK: 20, paper: 55.15 },
} as const;
type MK = keyof typeof CFG;

export const M5Layers: React.FC<WidgetProps> = () => {
  const [mk, setMk] = useState<MK>('7b');
  const [K, setK] = useState<number>(16);
  const c = CFG[mk];
  const base: FlopsConfig = { model: c.model, s: c.s, V: 576, method: 'vtw', K, R: 0.5, conv: 'code', scope: 'all' };
  const rCode = computeFlops(base).ratio;
  const rEq = computeFlops({ ...base, conv: 'eq5' }).ratio;
  const tCode = useTween(rCode);
  const tEq = useTween(rEq);
  const isPaperK = K === c.paperK;

  const rows = [
    { id: 'eq', label: 'Eq. (5) 字面 · 图 2', full: K - 1, ev: 'eq5', note: `D₁:K−1 → 前 ${K - 1} 层带视觉 token` },
    { id: 'code', label: '表 1 描述 · 官方代码', full: K, ev: 'cDrop', note: `layer_idx 0…${K - 1}（0 起计）→ 前 ${K} 层带视觉 token` },
  ];

  return (
    <div className="mod-stack">
      <Controls>
        <Seg
          small
          label="模型"
          value={mk}
          onChange={(m) => {
            setMk(m);
            // 切换模型时在同一次更新里约束 K 的上限，并回到该模型在表 2 中的 K
            setK(CFG[m].paperK);
          }}
          options={[
            { value: '7b', label: 'LLaVA-1.5-7B（32 层）' },
            { value: '13b', label: 'LLaVA-1.5-13B（40 层）' },
          ]}
        />
        <Slider label="K" value={K} min={2} max={c.N - 1} onChange={setK} display={`K = ${K}`} />
        <Btn onClick={() => setK(c.paperK)} disabled={isPaperK}>
          恢复表 2 的 K = {c.paperK}
        </Btn>
      </Controls>
      <div className="lstrips">
        {rows.map((r) => (
          <div className="lstrip" key={r.id}>
            <div className="lstrip-head">
              <b>{r.label}</b>
              <EvChip id={r.ev} />
              <span className="lstrip-note">{r.note}</span>
            </div>
            <div className="lstrip-cells" style={{ gridTemplateColumns: `repeat(${c.N}, 1fr)` }} aria-hidden="true">
              {Array.from({ length: c.N }, (_, i) => (
                <span key={i} className={i < r.full ? 'is-full' : ''} style={{ transitionDelay: `${Math.abs(i - r.full) * 14}ms` }}>
                  {i + 1 === 1 || i + 1 === c.N || i + 1 === r.full || i + 1 === r.full + 1 ? i + 1 : ''}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="lstrip-legend">
          <span>
            <i className="lc lc-vis" /> 带视觉 token 的层
          </span>
          <span>
            <i className="lc lc-ins" /> 只剩文字 token 的层
          </span>
          <span>格子中的数字为 1 起计的层号</span>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-v">{tEq.toFixed(2)}%</div>
          <div className="kpi-l">按 Eq. (5) 字面复算</div>
        </div>
        <div className="kpi">
          <div className="kpi-v">{tCode.toFixed(2)}%</div>
          <div className="kpi-l">按代码口径复算</div>
        </div>
        <div className="kpi">
          <div className="kpi-v">{isPaperK ? `${c.paper}%` : '—'}</div>
          <div className="kpi-l">{isPaperK ? '表 2 报告值' : `表 2 只报告 K = ${c.paperK}`}</div>
        </div>
      </div>
      <Feedback
        tone={isPaperK ? 'warn' : 'info'}
        k={`${mk}-${K}`}
        lead={
          isPaperK ? (
            <>
              表 2 的 {c.paper}% 离代码口径（{rCode.toFixed(2)}%）只差 {(c.paper - rCode).toFixed(2)} 个百分点，离 Eq. (5) 字面（{rEq.toFixed(2)}%）差 {(c.paper - rEq).toFixed(2)} 个——表格更像是按“前 K 层带视觉”算的。
            </>
          ) : (
            <>同一个 K，两种口径相差一整层：带视觉 token 的层数分别是 {K - 1} 和 {K}，比例相差约 {(rCode - rEq).toFixed(2)} 个百分点。</>
          )
        }
        more={
          <p>
            比例按 Eq. (1) × 2 计算，s 由表 2 原模型的 TFLOPs 反推（7B ≈ 641.4，13B ≈ 642.2），属于公式外推；即使按代码口径，与表 2 仍有 0.1–0.2 个百分点的差距，原因未知。复现时以代码为准：命令行的 <code>--k 16</code> 表示前 16 层完整计算，从第 17 层（1 起计）开始只剩文字 token。
          </p>
        }
      />
    </div>
  );
};
