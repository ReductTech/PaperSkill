import { useState } from 'react';
import { C, Scene, clear, text, Feedback, Source } from './shared-kit';

const variants = [
  { name: 'A', ap: 43.0, params: 31, ms: 7.2, note: '去掉多尺度 Transformer encoder 的基线：快，但 AP 较低。', structure: '无多尺度 Transformer encoder' },
  { name: 'B', ap: 44.9, params: 32, ms: 11.1, note: '相对 A，尺度内交互提升 1.9 AP 点，同时增加 3.9 ms。', structure: '各尺度共享单尺度 Transformer' },
  { name: 'C', ap: 45.6, params: 32, ms: 13.3, note: '相对 B，再引入跨尺度交互，增加 0.7 AP 点，也增加 2.2 ms。', structure: '在 B 上增加多尺度 Transformer' },
  { name: 'D', ap: 46.4, params: 35, ms: 12.2, note: '相对 C，解耦后少 1.1 ms、增加 0.8 AP 点，在这组消融中更快且更准。', structure: '尺度内 attention + PANet 风格融合' },
  { name: 'D_S5', ap: 46.8, params: 35, ms: 7.9, note: '相对 D，尺度内交互仅放在 S5，少 4.3 ms、增加 0.4 AP 点。', structure: 'D 的尺度内交互只作用于 S5' },
  { name: 'E', ap: 47.9, params: 42, ms: 9.3, note: '比 D_S5 增加 1.1 AP 点，也增加 1.4 ms；最终混合编码器不是这组里最快的变体。', structure: '最终 AIFI + CCFF 混合编码器' },
];
export function EncoderLab() {
  const [selected, setSelected] = useState(0);
  const chosen = variants[selected];
  return <div onKeyDown={event => event.stopPropagation()}>
    <div className="chip-row" role="group" aria-label="选择编码器消融变体">{variants.map((variant, index) => <button className={`chip ${selected === index ? 'active' : ''}`} key={variant.name} aria-pressed={selected === index} onClick={() => setSelected(index)}>{variant.name}</button>)}</div>
    <p style={{ fontSize: 16 }}>横轴延迟：越左越好；纵轴 AP：越高越好。连线只比较当前项与表中前一项。</p>
    <Scene label={`编码器消融权衡图：当前 ${chosen.name}，AP ${chosen.ap}、延迟 ${chosen.ms} 毫秒、参数 ${chosen.params} M。全部数据也显示在下方表格。`} draw={ctx => {
      clear(ctx, 560, 240);
      const px = (ms: number) => 58 + (ms - 6) * 58;
      const py = (ap: number) => 202 - (ap - 42) * 27;
      ctx.lineWidth = 2; ctx.strokeStyle = C.line;
      for (let ap = 42; ap <= 48; ap += 2) { ctx.beginPath(); ctx.moveTo(58, py(ap)); ctx.lineTo(522, py(ap)); ctx.stroke(); text(ctx, String(ap), 23, py(ap) + 5, C.ink); }
      for (let ms = 6; ms <= 14; ms += 2) text(ctx, String(ms), px(ms) - 6, 226, C.ink);
      ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(58, 26); ctx.lineTo(58, 203); ctx.lineTo(522, 203); ctx.stroke(); text(ctx, 'AP', 18, 21, C.ink); text(ctx, 'ms', 526, 226, C.ink);
      if (selected > 0) { const prior = variants[selected - 1]; ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(px(prior.ms), py(prior.ap)); ctx.lineTo(px(chosen.ms), py(chosen.ap)); ctx.stroke(); }
      variants.forEach((variant, index) => { ctx.beginPath(); ctx.arc(px(variant.ms), py(variant.ap), index === selected ? 7 : 5, 0, 2 * Math.PI); ctx.fillStyle = index === selected ? C.blue : C.dark; ctx.fill(); text(ctx, variant.name, px(variant.ms) + 10, py(variant.ap) - 8, C.ink); });
      ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.arc(px(chosen.ms), py(chosen.ap), 12, 0, 2 * Math.PI); ctx.stroke();
    }} />
    <Feedback>{chosen.note}</Feedback>
    <p aria-live="polite"><strong>{chosen.name}：</strong>{chosen.structure}；参数量 {chosen.params} M。</p>
    <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}><caption style={{ textAlign: 'left', padding: '8px 0' }}>作者报告 · Table 3 · 1× = 12 epochs</caption><thead><tr>{['变体', 'AP', '参数 (M)', '延迟 (ms)'].map(header => <th key={header} style={{ textAlign: 'left', padding: 7 }}>{header}</th>)}</tr></thead><tbody>{variants.map((variant, index) => <tr key={variant.name} style={{ background: selected === index ? C.light : 'transparent', borderBottom: `1px solid ${C.line}` }}><th scope="row" style={{ textAlign: 'left', padding: 7 }}>{variant.name}{selected === index ? ' ←' : ''}</th><td>{variant.ap.toFixed(1)}</td><td>{variant.params}</td><td>{variant.ms.toFixed(1)}</td></tr>)}</tbody></table></div>
    <p style={{ fontSize: 16 }}>这组受控消融的训练配置与主结果不同，不能把这里的 47.9 AP 与 72 epochs 主表的 53.1 AP 当作只改一个模块的对照。</p>
    <Source page={8} label="原文第 8 页 Table 3；变体结构见 §4.2" />
  </div>;
}
