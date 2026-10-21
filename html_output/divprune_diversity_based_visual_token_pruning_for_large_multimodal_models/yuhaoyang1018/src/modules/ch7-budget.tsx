import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { approach, useCanvasBox, useStageLoop, useTween } from '../lib/hooks';
import { C, FONT_SANS } from '../lib/palette';
import { Feedback, Seg } from '../ui/kit';
import { computeFlops, getModel, subsetModel } from '../lib/flops';
import { TABLE3 } from '../data/tutorial';

// 7.1 Table 3 的层位置消融：固定预算下，第 K 层剪枝能保留的 token 数（按 Eq. (5) 反推，本页外推）。

const KEPT_BUDGET = [56, 39, 21, 2];
const SUB = [3, 5, 8, 9]; // MMB、MMMU、POPE、SQA

export const Ch7Budget: React.FC<WidgetProps> = () => {
  const [K, setK] = useState(0);
  const [equal, setEqual] = useState(false);
  const model = useMemo(() => subsetModel(getModel('l15-7b'), SUB), []);
  const kept = equal ? 56 : KEPT_BUDGET[K];
  const res = useMemo(() => computeFlops(model, { K, kept: () => kept }), [model, K, kept]);
  const ratioT = useTween(res.ratio, 380);
  const keptT = useTween(kept, 380);
  const row = TABLE3[K];
  const N = Math.round(model.text.reduce((a, b) => a + b, 0) / model.text.length);
  const T = model.T;

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => (W < 520 ? 190 : 220));

  // 动画：切换剪枝层时，每根柱子带一点逐层延迟地升降到新高度，剪枝竖线滑到新位置。
  const animRef = useRef<{ hv: Float32Array; px: number; since: number; key: string; init: boolean }>({
    hv: new Float32Array(T),
    px: 0,
    since: 0,
    key: '',
    init: false,
  });
  useStageLoop(canvasRef, w, h, (ctx, t, dt) => {
    const a = animRef.current;
    const key = K + ':' + kept;
    if (a.key !== key) {
      a.key = key;
      a.since = 0;
    }
    a.since += dt;
    const final = t > 900 || !a.init;
    ctx.clearRect(0, 0, w, h);
    const top = 22;
    const base = h - 26;
    const full = N + 576;
    const unit = (base - top) / full;
    const colW = (w - 4) / T;
    for (let l = 0; l < T; l++) {
      const x = 2 + l * colW;
      const vis = l < K ? 576 : kept;
      const target = vis * unit;
      a.hv[l] = final ? target : a.since > l * 0.012 ? approach(a.hv[l], target, dt, 11) : a.hv[l];
      const hv = a.hv[l];
      const ht = N * unit;
      // 文本部分
      ctx.fillStyle = C.ink2;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x + 0.5, base - ht, colW - 1.5, ht);
      ctx.globalAlpha = 1;
      // 视觉部分
      ctx.save();
      ctx.shadowColor = l < K ? C.cobalt : C.verm;
      ctx.shadowBlur = 8;
      ctx.fillStyle = l < K ? C.cobalt : C.verm;
      ctx.globalAlpha = l < K ? 0.7 : 0.9;
      ctx.fillRect(x + 0.5, base - ht - hv, colW - 1.5, Math.max(hv, vis > 0 ? 1.5 : 0));
      ctx.restore();
    }
    // 剪枝位置（滑动到新位置）
    const pxT = 2 + K * colW;
    a.px = final ? pxT : approach(a.px, pxT, dt, 10);
    a.init = true;
    const px = a.px;
    ctx.strokeStyle = C.vermD;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px, top - 10);
    ctx.lineTo(px, base + 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `600 12px ${FONT_SANS}`;
    ctx.fillStyle = C.vermD;
    ctx.fillText(K === 0 ? '剪枝：第 1 层之前' : `剪枝：第 ${K} 层之后`, Math.min(px + 6, w - 120), top - 6);
    ctx.fillStyle = C.muted;
    ctx.fillText('解码层 1 → 32（柱高 = 该层处理的 token 数）', 2, h - 6);
  }, [K, kept, N, T]);

  const fb = equal
    ? `如果每一层都保留 56 个（与 Layer 0 相同），在第 ${K} 层之后剪枝的 TFLOP 比例会是 ${res.ratio.toFixed(2)}%${K === 0 ? '' : `，比 Layer 0 多出 ${(res.ratio - 19.61).toFixed(2)} 个百分点`}。论文没有测过这种“保留数相同”的设置，因此无法从 Table 3 判断“越早剪越好”。`
    : K === 0
      ? `Layer 0：32 层都只处理 56 个视觉 token，TFLOP 比例 ${res.ratio.toFixed(2)}%，与 Table 3 的 19.61% 一致。平均分 ${row.avg}。`
      : `Layer ${K}：前 ${K} 层要处理全部 576 个视觉 token，为了把 TFLOP 比例压在 ${row.ratio}%，之后只能保留 ${kept} 个（本页反推，复算得 ${res.ratio.toFixed(2)}%）。平均分 ${row.avg}，比 Layer 0 低 ${(62.34 - row.avg).toFixed(2)} 分——这同时是“层位置”和“保留数 ${kept} vs 56”两个因素的结果。`;

  return (
    <div className="w">
      <div className="ctl-row">
        <Seg label="剪枝层" options={[0, 1, 2, 3].map((k) => ({ value: k, label: `Layer ${k}` }))} value={K} onChange={setK} />
        <label className="sw">
          <input type="checkbox" checked={equal} onChange={(e) => setEqual(e.target.checked)} />
          <span className="sw-track" aria-hidden="true" />
          <span>保留数相同（都保留 56 个）</span>
        </label>
      </div>
      <div ref={wrapRef} className="cv">
        <canvas ref={canvasRef} role="img" aria-label={`第 ${K} 层剪枝，之后保留 ${kept} 个视觉 token，TFLOP 比例 ${res.ratio.toFixed(2)}%`} />
      </div>
      <div className="cv-legend">
        <span><i className="dot" style={{ background: C.cobalt }} />剪枝前：576 个视觉 token</span>
        <span><i className="dot" style={{ background: C.verm }} />剪枝后保留的视觉 token</span>
        <span><i className="dot" style={{ background: C.ink2, opacity: 0.55 }} />文本 token（4 个数据集平均约 {N} 个）</span>
      </div>
      <div className="readouts">
        <div className="ro ro-verm"><span>之后保留的视觉 token{equal ? '' : '（本页反推）'}</span><b>{Math.round(keptT)}</b></div>
        <div className="ro ro-cobalt"><span>TFLOP 比例（Eq. (5) 复算）</span><b>{ratioT.toFixed(2)}%</b></div>
        <div className="ro"><span>Table 3 报告的比例</span><b>{equal && K > 0 ? '未测' : `${row.ratio.toFixed(2)}%`}</b></div>
      </div>
      <div className="mini-table-wrap">
        <table className="mini-table">
          <caption>Table 3（论文实测，LLaVA 1.5-7B）</caption>
          <thead>
            <tr>
              <th scope="col">剪枝层</th>
              <th scope="col">TFLOP %</th>
              <th scope="col">本页反推保留数</th>
              <th scope="col">MMB</th>
              <th scope="col">MMMU</th>
              <th scope="col">POPE</th>
              <th scope="col">SQA</th>
              <th scope="col">Avg</th>
            </tr>
          </thead>
          <tbody>
            {TABLE3.map((r) => (
              <tr key={r.layer} className={r.layer === K && !equal ? 'is-on' : ''}>
                <th scope="row">Layer {r.layer}{r.layer === 0 ? '（默认）' : ''}</th>
                <td>{r.ratio.toFixed(2)}</td>
                <td>{KEPT_BUDGET[r.layer]}</td>
                <td>{r.mmb}</td>
                <td>{r.mmmu}</td>
                <td>{r.pope}</td>
                <td>{r.sqa}</td>
                <td><b>{r.avg}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Feedback tone={equal ? 'warn' : K === 0 ? 'good' : 'warn'}>{fb}</Feedback>
    </div>
  );
};

export default Ch7Budget;
