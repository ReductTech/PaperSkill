import { useState } from 'react';
import { C, Scene, line, number, Chips, Feedback } from './gd-kit';

const variants = ['完整模型', '去掉编码融合', '静态查询', '去掉文本跨注意力', '词级提示'];
const metrics = ['COCO 零样本', 'COCO 微调', 'LVIS 零样本'];
const values = [[46.7, 56.9, 16.1], [45.8, 56.1, 13.1], [46.3, 56.6, 13.6], [46.1, 56.3, 14.3], [46.4, 56.6, 15.6]];

export function Ablation() {
  const [variant, setVariant] = useState(0), [metric, setMetric] = useState(2);
  const full = values[0][metric], current = values[variant][metric], delta = current - full;
  return <div>
    <Chips label="独立训练的模型设置" items={variants} value={variant} onChange={setVariant} />
    <div style={{ marginTop: 9 }}><Chips label="评测协议" items={metrics} value={metric} onChange={setMetric} /></div>
    <Scene label={`当前比较：完整模型 ${full} AP，${variants[variant]} ${current} AP。横轴固定 0 到 60，越高越好。`} draw={ctx => {
      const x = 110, w = 850;
      for (let t = 0; t <= 60; t += 10) {
        const px = x + t / 60 * w; line(ctx, px, 38, px, 225, C.border, 1); number(ctx, String(t), px - 6, 252, C.muted);
      }
      const rows = [{ label: '完整', y: 70, value: full, color: C.green }, { label: '所选', y: 158, value: current, color: delta < -.001 ? C.red : C.blue }];
      for (const r of rows) {
        ctx.fillStyle = C.text; ctx.font = '600 18px sans-serif'; ctx.fillText(r.label, 38, r.y + 26);
        ctx.fillStyle = r.color; ctx.beginPath(); ctx.roundRect(x, r.y, r.value / 60 * w, 40, 6); ctx.fill();
        number(ctx, r.value.toFixed(1), x + r.value / 60 * w + 40, r.y + 27, r.color);
      }
      line(ctx, x, 225, x + w, 225, C.muted, 2);
    }} />
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
      <span>协议：<strong>{metrics[metric]} AP ↑</strong></span><span>完整模型：<strong>{full.toFixed(1)}</strong></span>
      <span>{variants[variant]}：<strong>{current.toFixed(1)}</strong></span>
      <span style={{ color: delta < -.001 ? C.red : C.blue }}>相对完整：<strong>{delta === 0 ? '0.0' : delta.toFixed(1)} AP</strong></span>
    </div>
    <Feedback tone={variant === 0 ? 'info' : 'bad'}>{variant === 0 ? '完整模型是比较基线。每个选项代表独立训练的消融配置，切换网页不会修改一个现成模型。' : `在 ${metrics[metric]} 协议下，${variants[variant]} 比完整模型低 ${(-delta).toFixed(1)} AP。这个差值仅对应表 7 的训练与评测条件。`}</Feedback>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14, fontSize: 13 }}>
      <caption style={{ textAlign: 'left', marginBottom: 8, fontWeight: 600 }}>Table 7 · Swin-T · O365 预训练 · 三种协议分列（AP ↑）</caption>
      <thead><tr><th style={{ textAlign: 'left', padding: 8 }}>设置</th>{metrics.map(m => <th key={m} style={{ textAlign: 'right', padding: 8 }}>{m}</th>)}</tr></thead>
      <tbody>{variants.map((v, i) => <tr key={v} style={{ background: i === variant ? '#eef3f8' : 'transparent', borderTop: `1px solid ${C.border}` }}>
        <th scope="row" style={{ textAlign: 'left', padding: 8, fontWeight: i === variant ? 700 : 400 }}>{v}</th>
        {values[i].map((n, j) => <td key={j} style={{ textAlign: 'right', padding: 8, fontWeight: j === metric ? 700 : 400 }}>{n.toFixed(1)}</td>)}
      </tr>)}</tbody>
    </table>
    <p style={{ color: C.muted, fontSize: 13, marginBottom: 0 }}>LVIS 的静态查询结果为 13.6，对完整模型 16.1 差 2.5 AP；此处采用表格数值。COCO 微调列另含 COCO 训练步骤，不能与零样本列混为同一协议。</p>
  </div>;
}
