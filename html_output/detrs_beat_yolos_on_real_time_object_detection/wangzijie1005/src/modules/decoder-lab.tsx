import { useState } from 'react';
import { C, Scene, clear, photo, frame, bar, text, Feedback, Source } from './shared-kit';

const decoderRows = [
  { layer: 1, ap: 49.1, ms: 7.0 }, { layer: 2, ap: 51.3, ms: 7.5 },
  { layer: 3, ap: 52.4, ms: 7.9 }, { layer: 4, ap: 52.7, ms: 8.3 },
  { layer: 5, ap: 53.0, ms: 8.8 }, { layer: 6, ap: 53.1, ms: 9.3 },
];

export function DecoderLab() {
  const [layers, setLayers] = useState(6);
  const row = decoderRows[layers - 1];
  const deltaAP = row.ap - 53.1;
  const saved = 9.3 - row.ms;
  return <div onKeyDown={e => { if (e.key.startsWith('Arrow')) e.stopPropagation(); }}>
    <div className="chip-row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <label htmlFor="decoder-layers">推理层数：<strong>{layers}</strong></label>
      <input id="decoder-layers" type="range" min={1} max={6} step={1} value={layers}
        onChange={e => setLayers(Number(e.target.value))} aria-valuetext={`训练固定六层，推理使用前${layers}层并取第${layers}层输出`} />
      <button className="chip" type="button" onClick={() => setLayers(6)}>重置为 6 层</button>
    </div>
    <p style={{ fontSize: 16 }}>训练固定 6 层 · 72 epochs · T4 / TensorRT FP16 · 下表全部取自 Table 5 的 Det6 同一列。</p>
    <Scene height={250} label="教学取景框随所选解码层数靠近参照位置；右边两条分别表示作者报告的AP和延迟。"
      draw={ctx => {
        clear(ctx, 560, 250);
        photo(ctx, 24, 38, 270, 150);
        const offset = (6 - layers) * 8;
        ctx.save(); ctx.setLineDash([5, 5]); frame(ctx, 140, 76, 100, 86, C.blue); ctx.restore();
        frame(ctx, 140 - offset, 76 + offset / 2, 100 + offset / 2, 86, C.orange);
        for (let i = 0; i < 6; i++) {
          ctx.beginPath(); ctx.arc(50 + i * 43, 218, 11, 0, Math.PI * 2);
          ctx.fillStyle = i < layers ? C.green : C.line; ctx.fill();
          text(ctx, String(i + 1), 46 + i * 43, 223, i < layers ? '#ffffff' : C.ink);
        }
        text(ctx, 'AP', 330, 55, C.ink);
        bar(ctx, 330, 65, 204, 24, C.line); bar(ctx, 330, 65, 204 * row.ap / 54, 24, C.green);
        text(ctx, '延迟', 330, 137, C.ink);
        bar(ctx, 330, 148, 204, 24, C.line); bar(ctx, 330, 148, 204 * row.ms / 10, 24, C.orange);
      }} />
    <div className="chip-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <span>作者 AP：<strong>{row.ap.toFixed(1)}</strong>（上条 0–54）</span>
      <span>作者延迟：<strong>{row.ms.toFixed(1)} ms</strong>（下条 0–10）</span>
    </div>
    <Feedback tone="neutral">
      使用前 {layers} 层并取第 {layers} 层输出：相对 6 层，AP 变化 {deltaAP === 0 ? '0.0' : deltaAP.toFixed(1)} 个点，节省 {saved.toFixed(1)} ms。
      {layers === 5 ? ' 五层只少 0.1 AP 点，但是否值得还取决于部署预算。' : ' 减层不是无代价加速。'}
      这不能保证任意删除中间层也无需重训或保持性能。表格比较验证集整体 AP，不能保证每张图、每个框都随层数增加而单调改善。取景框仅为迭代细化的教学示意，不是真实预测。
    </Feedback>
    <table style={{ width: '100%', fontSize: 16, borderCollapse: 'collapse' }}>
      <caption style={{ textAlign: 'left', padding: '8px 0' }}>Table 5 · 训练 6 层模型的完整数据</caption>
      <thead><tr><th scope="col">推理层数</th><th scope="col">AP</th><th scope="col">延迟 / ms</th></tr></thead>
      <tbody>{decoderRows.map(r => <tr key={r.layer} style={{ background: r.layer === layers ? '#eaf3e6' : 'transparent' }}>
        <th scope="row">{r.layer}{r.layer === layers ? ' ← 当前' : ''}</th><td style={{ textAlign: 'center' }}>{r.ap.toFixed(1)}</td><td style={{ textAlign: 'center' }}>{r.ms.toFixed(1)}</td>
      </tr>)}</tbody>
    </table>
    <Source page={8} label="原文 P8 · Table 5：固定 Det6 列，避免混入重新训练的其他模型" />
  </div>;
}
