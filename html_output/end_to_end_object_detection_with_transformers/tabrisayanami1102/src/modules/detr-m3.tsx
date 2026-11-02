import React, { useState } from 'react';
import { C, Canvas, clear, street, rect, text, line, l1, type Box } from './detr-kit';

const targets: Box[] = [[.22, .57, .12, .59], [.48, .57, .12, .59]];
function D3Content() {
  const [swapped, setSwapped] = useState(false);
  const predictions = swapped ? [targets[1], targets[0]] : [...targets];
  const fixedCost = predictions.reduce((sum, p, i) => sum + l1(p, targets[i]), 0);
  const sameCost = Math.min(
    l1(predictions[0], targets[0]) + l1(predictions[1], targets[1]),
    l1(predictions[0], targets[1]) + l1(predictions[1], targets[0]),
  );
  const drawPanel = (ctx: CanvasRenderingContext2D, x: number, matching: boolean) => {
    const y = 43, w = 496, h = 185;
    street(ctx, x, y, w, h);
    targets.forEach(([cx, cy, bw, bh]) => {
      ctx.lineWidth = 3;
      rect(ctx, x + (cx - bw / 2) * w, y + (cy - bh / 2) * h, bw * w, bh * h, C.green, false, true);
    });
    predictions.forEach((box, i) => {
      const paired = matching ? (swapped ? 1 - i : i) : i;
      const color = !matching && swapped ? C.red : C.green;
      const px = x + box[0] * w;
      const tx = x + targets[paired][0] * w;
      line(ctx, px, 260, tx, y + targets[paired][1] * h, color, 3);
      rect(ctx, px - 22, 248, 44, 32, '#ffffff', true);
      rect(ctx, px - 22, 248, 44, 32, color);
      text(ctx, String(i + 1), px - 6, 271, 22, color);
    });
    text(ctx, matching ? '最优配对' : '按行配对', x + 200, 25, 19, matching ? C.green : swapped ? C.red : C.blue);
  };
  const draw = (ctx: CanvasRenderingContext2D) => {
    clear(ctx, 1080, 300);
    drawPanel(ctx, 24, false);
    drawPanel(ctx, 560, true);
  };
  return <>
    <Canvas draw={draw} ariaLabel="交换预测记录顺序，比较按行评分和最优配对评分" />
    <div className="chip-row"><button type="button" className="chip selected" onClick={() => setSwapped(value => !value)}>交换答案</button><button type="button" className="chip" disabled={!swapped} onClick={() => setSwapped(false)}>恢复顺序</button></div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={{ textAlign: 'left' }}>当前预测顺序</th><th style={{ textAlign: 'left' }}>按行配对总 L1</th><th style={{ textAlign: 'left' }}>最优配对总 L1</th></tr></thead>
        <tbody><tr><td>{swapped ? '右边的人 → 左边的人' : '左边的人 → 右边的人'}</td><td>{fixedCost.toFixed(3)}</td><td>{sameCost.toFixed(3)}</td></tr></tbody>
      </table>
    </div>
    <div className={`feedback ${swapped ? 'good' : ''}`} role="status">{swapped ? '按行评分把两个正确答案判错：两个中心横坐标各差0.26，总L1变成0.52。重新配对后，两个框仍各自对准同一个人，总代价仍然是0。' : '顺序相同时，两种评分都能把预测对到正确物体。绿色虚线框是标准答案，底部数字是预测记录的编号。'}</div>
  </>;
}

export function D3(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D3Content/></div>;}
