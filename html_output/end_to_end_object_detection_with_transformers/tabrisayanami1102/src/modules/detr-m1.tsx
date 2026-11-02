import React, { useState } from 'react';
import { C, Canvas, clear, street, rect, text, line } from './detr-kit';

const objects = [
  { name: '左边的人', cls: '人', box: [0.22, 0.57, 0.12, 0.59] },
  { name: '右边的人', cls: '人', box: [0.48, 0.57, 0.12, 0.59] },
  { name: '车', cls: '车', box: [0.74, 0.72, 0.29, 0.29] },
];

function D1Content() {
  const [mode, setMode] = useState(0);
  const draw = (ctx: CanvasRenderingContext2D) => {
    clear(ctx, 1080, 300);
    const x = 24, y = 24, w = 680, h = 250;
    street(ctx, x, y, w, h);
    if (!mode) {
      ctx.lineWidth = 4;
      rect(ctx, x, y, w, h, C.blue);
      line(ctx, 712, 150, 762, 150, C.blue, 3);
      rect(ctx, 772, 84, 274, 126, '#ffffff', true);
      rect(ctx, 772, 84, 274, 126, C.blue);
      text(ctx, '人、车', 840, 160, 28, C.blue);
    } else {
      objects.forEach((item, i) => {
        const [cx, cy, bw, bh] = item.box;
        ctx.lineWidth = 4;
        rect(ctx, x + (cx - bw / 2) * w, y + (cy - bh / 2) * h, bw * w, bh * h, C.green);
        const cardY = 28 + i * 86;
        line(ctx, x + (cx + bw / 2) * w, y + cy * h, 774, cardY + 32, C.blue, 1.5);
        rect(ctx, 774, cardY, 272, 66, '#ffffff', true);
        rect(ctx, 774, cardY, 272, 66, C.green);
        text(ctx, String(i + 1), 796, cardY + 43, 26, C.green);
        rect(ctx, 852, cardY + 14, 50 + bw * 160, 38, C.blue, false);
      });
    }
  };
  return <>
    <Canvas draw={draw} ariaLabel="整图类别与逐个物体记录的比较" />
    <div className="chip-row" aria-label="记录方式">
      {['分类', '检测'].map((name, i) => <button type="button" key={name} className={`chip ${mode === i ? 'selected' : ''}`} aria-pressed={mode === i} onClick={() => setMode(i)}>{name}</button>)}
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={{ textAlign: 'left' }}>记录</th><th style={{ textAlign: 'left' }}>类别</th><th style={{ textAlign: 'left' }}>位置记录</th></tr></thead>
        <tbody>{mode ? objects.map((item, i) => <tr key={item.name}><td>{i + 1} · {item.name}</td><td>{item.cls}</td><td>中心（{item.box[0].toFixed(2)}, {item.box[1].toFixed(2)}），宽 {item.box[2].toFixed(2)}，高 {item.box[3].toFixed(2)}</td></tr>) : <tr><td>整张图</td><td>人、车</td><td>没有逐个记录位置</td></tr>}</tbody>
      </table>
    </div>
    <div className={`feedback ${mode ? 'good' : ''}`} role="status">{mode ? '三条记录分别对应两个人和一辆车，两个同类物体也要分开。表中的位置都用图片宽高的比例表示。' : '先知道图里有什么；换成检测后，每个物体还要有自己的位置。'}</div>
  </>;
}

export function D1(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D1Content/></div>;}
