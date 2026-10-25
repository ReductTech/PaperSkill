import { useState } from 'react';
import { C, Scene, bird, branch, parkBackdrop, frame, line, number, Button, Feedback } from './gd-kit';

export function TrainingBox() {
  const [center, setCenter] = useState({ x: .62, y: .5 });
  const truth = { x: .42, y: .5 }, bw = .28, bh = .4;
  const clamp = (x: number, y: number) => ({ x: Math.max(.15, Math.min(.85, x)), y: Math.max(.2, Math.min(.8, y)) });
  const move = (dx: number, dy: number) => setCenter(p => clamp(p.x + dx, p.y + dy));
  const interW = Math.max(0, bw - Math.abs(center.x - truth.x));
  const interH = Math.max(0, bh - Math.abs(center.y - truth.y));
  const intersection = interW * interH;
  const iou = intersection / (2 * bw * bh - intersection);
  const l1 = 2 * Math.abs(center.x - truth.x) + 2 * Math.abs(center.y - truth.y);
  const onDrag = (x: number, y: number) => {
    if (x >= 20 && x <= 670 && y >= 20 && y <= 260) setCenter(clamp((x - 20) / 650, (y - 20) / 240));
  };
  return <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      <Button onClick={() => move(-.04, 0)}>← 左移</Button><Button onClick={() => move(.04, 0)}>右移 →</Button>
      <Button onClick={() => move(0, -.04)}>↑ 上移</Button><Button onClick={() => move(0, .04)}>下移 ↓</Button>
      <Button onClick={() => setCenter({ x: .42, y: .5 })}>对齐参考</Button><Button onClick={() => setCenter({ x: .62, y: .5 })}>复位</Button>
    </div>
    <Scene label="拖动橙色框，或用上方按钮移动。绿色双线为参考框。" onDrag={onDrag} draw={ctx => {
      ctx.save(); ctx.beginPath(); ctx.roundRect(20, 20, 650, 240, 12); ctx.clip();
      parkBackdrop(ctx,20,20,650,240);
      const bx = 20 + truth.x * 650, by = 20 + truth.y * 240;
      branch(ctx,80,by+35,550,by+31,7);
      bird(ctx,bx,by,32,C.red);
      ctx.restore();
      const tx = 20 + (truth.x - bw / 2) * 650, ty = 20 + (truth.y - bh / 2) * 240;
      const px = 20 + (center.x - bw / 2) * 650, py = 20 + (center.y - bh / 2) * 240;
      const ix = Math.max(tx, px), iy = Math.max(ty, py);
      ctx.fillStyle = 'rgba(34,141,92,.2)'; ctx.fillRect(ix, iy, interW * 650, interH * 240);
      frame(ctx, tx, ty, bw * 650, bh * 240, C.green);
      frame(ctx, tx - 4, ty - 4, bw * 650 + 8, bh * 240 + 8, C.green);
      frame(ctx, px, py, bw * 650, bh * 240, C.orange);
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(20 + center.x * 650, 20 + center.y * 240, 5, 0, Math.PI * 2); ctx.fill();
      const bars = [{ title: 'IoU', y: 92, width: iou, value: iou, color: C.green }, { title: 'L1', y: 186, width: l1 / 2, value: l1, color: C.orange }];
      for (const b of bars) {
        ctx.fillStyle = C.text; ctx.font = '600 18px sans-serif'; ctx.fillText(b.title, 718, b.y - 20);
        ctx.fillStyle = C.border; ctx.fillRect(718, b.y, 270, 22); ctx.fillStyle = b.color; ctx.fillRect(718, b.y, 270 * b.width, 22);
        number(ctx, b.value.toFixed(3), 1030, b.y + 11, b.color);
      }
      line(ctx, 690, 32, 690, 250, C.border, 1);
    }} />
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '10px 0', fontSize: 14 }}>
      <span><strong style={{ color: C.green }}>绿色双线</strong> 真值框</span><span><strong style={{ color: C.orange }}>橙色单线</strong> 已匹配预测框</span>
      <span>IoU ↑ <strong>{iou.toFixed(3)}</strong></span><span>归一化角点 L1 ↓ <strong>{l1.toFixed(3)}</strong></span>
      <span>预测中心 ({center.x.toFixed(2)}, {center.y.toFixed(2)})</span>
    </div>
    <Feedback tone={iou > .999 ? 'good' : iou === 0 ? 'bad' : 'info'}>
      {iou > .999 ? '两框完全重合：IoU = 1，几何 L1 = 0。词语是否对齐，还要由 token 分类监督检查。' : iou === 0 ? '两框不重叠时，IoU 都是 0，不能区分还差多远。实际训练同时使用 L1 和 GIoU。' : '移动预测框改变几何误差。这里只有一个已匹配示例，尚未演示多查询匹配，也没有运行模型训练。'}
    </Feedback>
    <p style={{ fontSize: 13, color: C.muted, marginBottom: 0 }}>IoU = 交集面积 / 并集面积；L1 是归一化四个角点坐标的绝对误差之和，条形范围 0–2。页面的 IoU 不是 GIoU 损失。</p>
  </div>;
}
