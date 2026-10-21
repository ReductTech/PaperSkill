import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { MODELS, keepByRatio, PAPER_OPTS, layerFlop } from '../lib/flops';
import { Feedback, Seg } from '../ui/kit';
import { useTween } from '../lib/hooks';

// 1.2 token 账本：序列构成 + 单层计算量三项占比（按 Eq. (5) 的单层项，+ 号修正式）。
// 文本 / 视觉 token 数来自 tflops.py 的硬编码值（代码事实）；占比为本页计算（公式外推）。

function Pct({ v }: { v: number }) {
  const t = useTween(v, 380);
  return <>{t.toFixed(1)}%</>;
}

export const Ch1Ledger: React.FC<WidgetProps> = () => {
  const [mid, setMid] = useState(MODELS[0].id);
  const model = MODELS.find((m) => m.id === mid)!;
  const [di, setDi] = useState(0);
  const i = Math.min(di, model.datasets.length - 1);
  const N = model.text[i];
  const M = model.visual[i];
  const kept = keepByRatio(model.r)(M);
  const n = N + M;
  const nn = N + kept;
  const { d, m } = model;
  const parts = (len: number) => {
    const a = 4 * len * d * d;
    const b = 2 * len * len * d;
    const c = 2 * len * d * m;
    const tot = a + b + c;
    return { a: (a / tot) * 100, b: (b / tot) * 100, c: (c / tot) * 100, tot };
  };
  const full = parts(n);
  const pr = parts(nn);
  const visShare = (M / n) * 100;
  const layerRatio = (layerFlop(nn, d, m, PAPER_OPTS) / layerFlop(n, d, m, PAPER_OPTS)) * 100;

  return (
    <div className="w">
      <div className="ctl-stack">
        <Seg label="模型" options={MODELS.map((x) => ({ value: x.id, label: x.label }))} value={mid} onChange={(v) => { setMid(v); setDi(0); }} />
        <Seg small label="数据集" options={model.datasets.map((x, k) => ({ value: k, label: x }))} value={i} onChange={setDi} />
      </div>

      <div className="ledger">
        <div className="ledger-row">
          <div className="ledger-k">序列构成</div>
          <div className="stack" role="img" aria-label={`文本 ${N} 个，视觉 ${M} 个`}>
            <span className="stack-seg s-text" style={{ flexGrow: N }} />
            <span className="stack-seg s-vis" style={{ flexGrow: M }} />
          </div>
          <div className="ledger-legend">
            <span><i className="dot s-text" />文本 N = {N}</span>
            <span><i className="dot s-vis" />视觉 M = {M}</span>
            <span className="ledger-strong">视觉占 <Pct v={visShare} /></span>
          </div>
        </div>

        {[
          { k: '单层计算量 · 不剪枝', len: n, p: full },
          { k: `单层计算量 · 保留 ${kept} 个（r = ${model.r}）`, len: nn, p: pr },
        ].map((row) => (
          <div className="ledger-row" key={row.k}>
            <div className="ledger-k">
              {row.k}
              <span className="ledger-sub">μ = {row.len}</span>
            </div>
            <div className="stack" role="img" aria-label={`投影 ${row.p.a.toFixed(1)}%，注意力二次项 ${row.p.b.toFixed(1)}%，前馈 ${row.p.c.toFixed(1)}%`}>
              <span className="stack-seg s-qkvo" style={{ flexGrow: row.p.a }} />
              <span className="stack-seg s-attn" style={{ flexGrow: row.p.b }} />
              <span className="stack-seg s-ffn" style={{ flexGrow: row.p.c }} />
            </div>
            <div className="ledger-legend">
              <span><i className="dot s-qkvo" />4μd² <Pct v={row.p.a} /></span>
              <span><i className="dot s-attn" />2μ²d（二次项）<Pct v={row.p.b} /></span>
              <span><i className="dot s-ffn" />2μdm <Pct v={row.p.c} /></span>
            </div>
          </div>
        ))}
      </div>

      <Feedback tone={full.b > 10 ? 'warn' : 'info'}>
        <b>{model.label} · {model.datasets[i]}：</b>
        视觉 token 占序列的 {visShare.toFixed(1)}%；不剪枝时二次项只占单层计算量的 {full.b.toFixed(1)}%。
        保留 {kept} 个视觉 token 后，单层计算量降到原来的 {layerRatio.toFixed(1)}%——和 token 数之比（{((nn / n) * 100).toFixed(1)}%）非常接近，
        说明在这个尺度上计算量近似线性于 token 数。{full.b > 10 ? '序列更长时（如 LLaVA 1.6），二次项的占比开始变得明显。' : ''}
      </Feedback>
      <p className="w-note">文本与视觉 token 数为官方 tflops.py 中的硬编码平均值；三项占比按 Eq. (5) 单层项（+ 号修正式）计算，属本页外推。</p>
    </div>
  );
};

export default Ch1Ledger;
