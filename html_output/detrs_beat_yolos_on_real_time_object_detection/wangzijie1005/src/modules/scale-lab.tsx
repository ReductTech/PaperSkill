import { useState } from 'react';
import { C, Scene, clear, photo, frame, text, Feedback, Source } from './shared-kit';

const scales = [
  { name: 'S3', stride: 8, side: 80, tokens: 6400, x: 319, y: 165, w: 222, h: 49, view: 88 },
  { name: 'S4', stride: 16, side: 40, tokens: 1600, x: 350, y: 98, w: 164, h: 45, view: 145 },
  { name: 'S5', stride: 32, side: 20, tokens: 400, x: 390, y: 34, w: 84, h: 42, view: 232 },
];
export function ScaleLab() {
  const [selected, setSelected] = useState(0);
  const current = scales[selected];
  return <div onKeyDown={event => event.stopPropagation()}>
    <div className="chip-row" role="group" aria-label="选择特征尺度">{scales.map((scale, index) => <button key={scale.name} className={`chip ${selected === index ? 'active' : ''}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>{scale.name} · {scale.side}×{scale.side}</button>)}</div>
    <Scene label={`当前 ${current.name}，${current.tokens} 个 token。左侧取景框联动右侧尺度层；可以用上方按钮进行相同操作。`} onPointerDown={event => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - bounds.left) * 560 / bounds.width;
      const y = (event.clientY - bounds.top) * 240 / bounds.height;
      const hit = scales.findIndex(scale => x >= scale.x && x <= scale.x + scale.w && y >= scale.y && y <= scale.y + scale.h);
      if (hit >= 0) setSelected(hit);
    }} draw={ctx => {
      clear(ctx, 560, 240); photo(ctx, 22, 33, 269, 181);
      scales.forEach((scale, index) => {
        ctx.fillStyle = selected === index ? C.light : C.quiet; ctx.fillRect(scale.x, scale.y, scale.w, scale.h);
        ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 2;
        for (let i = 1; i < 7; i++) { const x = scale.x + scale.w * i / 7; ctx.beginPath(); ctx.moveTo(x, scale.y); ctx.lineTo(x, scale.y + scale.h); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(scale.x, scale.y + scale.h / 2); ctx.lineTo(scale.x + scale.w, scale.y + scale.h / 2); ctx.stroke(); ctx.restore();
        frame(ctx, scale.x, scale.y, scale.w, scale.h, selected === index ? C.blue : C.line);
        if (selected === index) frame(ctx, scale.x - 3, scale.y - 3, scale.w + 6, scale.h + 6, C.blue);
        text(ctx, scale.name, scale.x + 8, scale.y + 28, selected === index ? C.blue : C.ink);
      });
      frame(ctx, 156 - current.view / 2, 123 - current.view * 0.62 / 2, current.view, current.view * 0.62, C.orange);
    }} />
    <div aria-live="polite" style={{ margin: '10px 0' }}><strong>{current.name} · {current.side} × {current.side} = {current.tokens.toLocaleString()} tokens</strong></div>
    <Feedback>640×640 输入、步长 {current.stride} 的教学尺寸计算：{current.side}×{current.side}={current.tokens} tokens。S3 / S4 仍参与融合；S5 负责 AIFI。</Feedback>
    <p style={{ fontSize: 16 }}>稀疏网格不是完整特征矩阵；左侧取景宽窄是观察尺度类比，不表示网络真实感受野。三个尺度共 8,400 个 token，这个数量本身不能换算成实测耗时。</p>
    <Source page={5} label="原文第 5 页 §4.2 / Eq. (1)；尺寸由官方当前配置的 stride 8 / 16 / 32 推导" />
  </div>;
}
