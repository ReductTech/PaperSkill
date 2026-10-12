import { useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { C, Scene, Chips, Panel, Feedback, point, arrow, line, dot, text } from './nusa-kit';

const categories = [
  { name: '猫', angle: 0, color: C.blue },
  { name: '狗', angle: 60, color: C.purple },
  { name: '车', angle: 150, color: C.dark },
];
const rad = Math.PI / 180;
function normalizedAngle(a: number) { return ((a + 180) % 360 + 360) % 360 - 180; }

export function NusaAlignment() {
  const [angle, setAngle] = useState(25);
  const dragging = useRef(false);
  const cosines = categories.map(c => Math.cos((angle - c.angle) * rad));
  const logits = cosines.map(c => 5 * c);
  const high = Math.max(...logits), values = logits.map(s => Math.exp(s - high));
  const total = values.reduce((a, b) => a + b, 0), probabilities = values.map(v => v / total);
  const prediction = probabilities.indexOf(Math.max(...probabilities));
  const updateFromPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const p = point(event, 1080, 280), dx = p.x - 270, dy = 140 - p.y;
    if (Math.hypot(dx, dy) > 4) setAngle(normalizedAngle(Math.atan2(dy, dx) / rad));
  };
  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const p = point(event, 1080, 280);
    if (Math.hypot(p.x - 270, p.y - 140) > 125) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true; updateFromPointer(event);
  };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => { if (dragging.current) updateFromPointer(event); };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    setAngle(a => event.key === 'Home' ? 25 : normalizedAngle(a + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? 5 : -5)));
  };
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <Chips label="对准文本方向" value={categories.find(c => Math.abs(c.angle - angle) < .001)?.name || ''} options={categories.map(c => ({ value: c.name, label: c.name }))} onChange={v => setAngle(categories.find(c => c.name === v)!.angle)} />
    <p>拖动橙色端点转动图像向量。画布获得焦点后，方向键每次转动 5°；Home 恢复 25°。</p>
    <Scene label={`图像方向 ${angle.toFixed(1)} 度，当前预测${categories[prediction].name}。可拖动或用方向键旋转。`} tabIndex={0} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onKeyDown={onKeyDown} draw={ctx => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
      text(ctx, '图文方向', 80, 28, 18, C.text);
      text(ctx, '类别概率', 614, 28, 18, C.text);
      line(ctx, 155, 140, 388, 140, C.axis); line(ctx, 270, 27, 270, 255, C.axis);
      ctx.strokeStyle = C.axis; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(270, 140, 100, 0, Math.PI * 2); ctx.stroke();
      categories.forEach((c, i) => {
        const a = c.angle * rad, x = 270 + Math.cos(a) * 100, y = 140 - Math.sin(a) * 100;
        arrow(ctx, 270, 140, x, y, c.color);
        text(ctx, String(i + 1), 270 + Math.cos(a) * 119 - 5, 145 - Math.sin(a) * 119, 16, c.color);
      });
      const x = 270 + Math.cos(angle * rad) * 100, y = 140 - Math.sin(angle * rad) * 100;
      ctx.strokeStyle = C.orange; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(270, 140); ctx.lineTo(x, y); ctx.stroke();
      dot(ctx, x, y, 13, '#fff'); dot(ctx, x, y, 9, C.orange); dot(ctx, 270, 140, 4, C.text);
      line(ctx, 530, 44, 530, 242, C.axis);
      categories.forEach((c, i) => {
        const y0 = 68 + i * 62;
        text(ctx, String(i + 1), 585, y0 + 23, 18, c.color);
        ctx.fillStyle = C.axis; ctx.fillRect(616, y0, 316, 30);
        ctx.fillStyle = c.color; ctx.fillRect(616, y0, 316 * probabilities[i], 30);
        text(ctx, `${(probabilities[i] * 100).toFixed(1)}%`, 950, y0 + 23, 18, c.color);
      });
    }} />
    <Panel><div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', width: '100%' }}>
      <div>图像角度 <strong style={{ color: C.orange }}>{angle.toFixed(1)}°</strong></div>
      {categories.map((c, i) => <div key={c.name} style={{ color: c.color }}><strong>{i + 1} · {c.name}</strong>　余弦 {cosines[i].toFixed(3)}　概率 {(100 * probabilities[i]).toFixed(2)}%</div>)}
    </div></Panel>
    <Feedback tone={prediction === 0 ? 'good' : ''}>{prediction === 0 ? `当前图像方向更接近猫，猫的概率为 ${(probabilities[0] * 100).toFixed(2)}%。` : `当前预测为${categories[prediction].name}，猫的相似度为 ${cosines[0].toFixed(3)}，猫的概率为 ${(probabilities[0] * 100).toFixed(2)}%。`} 三个文本方向保持固定，改变图像方向会同时改变全部类别分数。</Feedback>
    <details><summary>从方向到零样本分类</summary><p>CLIP 对图像编码 zᵢ 与类别文本编码 zⱼ分别做 ℓ₂ 归一化，以内积计算余弦相似度。类别文本为分类提供语义方向；已学任务的更新若改变图像、文本之间的相对方向，也会改变原有分类分布。</p><p>教学二维示例：类别角度为 0°、60°、150°，缩放 s = 5；实际 CLIP 使用高维嵌入及 exp(logit_scale)。训练时图像和文本两侧均有 NuSA 分支，机制见第 8 章。</p></details>
    <div className="ctrl"><button type="button" className="tiny ghost" style={{ minHeight: 44 }} onClick={() => { dragging.current = false; setAngle(25); }}>重置图像方向</button><span style={{ color: C.muted, fontSize: 14 }}>依据：CLIP 归一化相似度与 NuSA-CL 官方训练实现。</span></div>
  </div>;
}
