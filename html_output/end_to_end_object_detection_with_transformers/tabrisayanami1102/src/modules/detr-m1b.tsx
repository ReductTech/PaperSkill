import React, { useState } from 'react';
import { C, Canvas, clear, street, rect, text } from './detr-kit';

function D1BContent() {
  const [mode, setMode] = useState(0);
  const drawPanel = (ctx: CanvasRenderingContext2D, x: number, repaired: boolean) => {
    const y = 40, w = 496, h = 210;
    street(ctx, x, y, w, h);
    const boxes = repaired
      ? [[.22, .57, .12, .59], [.48, .57, .12, .59], [.74, .72, .29, .29]]
      : [[.22, .57, .12, .59], [.245, .59, .14, .60], [.74, .72, .29, .29]];
    boxes.forEach(([cx, cy, bw, bh], i) => {
      ctx.lineWidth = 3.5;
      const color = !repaired && i < 2 ? C.red : C.green;
      rect(ctx, x + (cx - bw / 2) * w, y + (cy - bh / 2) * h, bw * w, bh * h, color);
      text(ctx, String(i + 1), x + cx * w - 7, y + (cy - bh / 2) * h - 5, 17, color);
    });
    for (let i = 0; i < 4; i++) {
      const color = i === 3 ? C.border : repaired ? C.green : i < 2 ? C.red : C.blue;
      rect(ctx, x + 114 + i * 65, 265, 44, 24, color, i < 3);
      if (i === 3) {
        ctx.beginPath(); ctx.moveTo(x + 128 + i * 65, 269); ctx.lineTo(x + 145 + i * 65, 285); ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  };
  const draw = (ctx: CanvasRenderingContext2D) => {
    clear(ctx, 1080, 300);
    drawPanel(ctx, 24, false);
    drawPanel(ctx, 560, !!mode);
    text(ctx, '重复与遗漏', 205, 24, 19, C.red);
    text(ctx, mode ? '一一监督' : '相同起点', 751, 24, 19, mode ? C.green : C.blue);
  };
  return <>
    <Canvas draw={draw} ariaLabel="左边重复框与右边一一配对训练目标的示意比较" />
    <div className="chip-row" aria-label="训练目标示意">
      {['独立重复预测', '一一配对训练'].map((name, i) => <button type="button" key={name} className={`chip ${mode === i ? 'selected' : ''}`} aria-pressed={mode === i} onClick={() => setMode(i)}>{name}</button>)}
    </div>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '8px 0' }}>
      <span>预测位置：4 个</span><span>真实物体：3 个</span><span>{mode ? '右图：3 个各自负责，1 个学习空类别' : '当前：左边的人重复 2 次，右边的人遗漏'}</span>
    </div>
    <div className={`feedback ${mode ? 'good' : 'bad'}`} role="status">{mode ? '训练时每个真实物体只配一个预测，剩余预测学习空类别。右图画的是这份学习目标：每件物体有自己的记录，留出的第4格为空。' : '两个预测都盯住左边的人，右边的人还没人负责。仅仅增加预测数量，还没有解决“重复”和“遗漏”这两个问题。'}</div>
  </>;
}

export function D1B(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D1BContent/></div>;}
