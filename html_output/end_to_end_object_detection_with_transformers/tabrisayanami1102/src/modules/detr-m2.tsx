import React, { useState } from 'react';
import { C, Canvas, clear, street, rect, text, line } from './detr-kit';

const modes = ['输入像素', '卷积特征', '加上位置'];
function D2Content() {
  const [cell, setCell] = useState(5);
  const [mode, setMode] = useState(0);
  const row = Math.floor(cell / 4), col = cell % 4;
  const values = [0.18 + col * .16, 0.20 + row * .22, .22 + ((cell * 3) % 7) * .08, .12 + ((cell + 3) % 5) * .12];
  const draw = (ctx: CanvasRenderingContext2D) => {
    clear(ctx, 1080, 300);
    const x = 24, y = 26, w = 536, h = 240;
    street(ctx, x, y, w, h);
    for (let i = 0; i < 12; i++) {
      const r = Math.floor(i / 4), c = i % 4;
      ctx.lineWidth = i === cell ? 4 : 1.4;
      rect(ctx, x + c * w / 4, y + r * h / 3, w / 4, h / 3, i === cell ? C.orange : C.border);
      if (i === cell) {
        ctx.fillStyle = '#f07e4724'; ctx.fillRect(x + c * w / 4, y + r * h / 3, w / 4, h / 3);
      }
    }
    const sx = x + (col + .5) * w / 4, sy = y + (row + .5) * h / 3;
    line(ctx, sx, sy, 614, 125, C.orange, 2);
    for (let i = 0; i < 12; i++) {
      const bx = 614 + i * 35;
      ctx.lineWidth = i === cell ? 3 : 1;
      rect(ctx, bx, 42, 29, 34, i === cell ? C.orange : C.border, i === cell);
      text(ctx, String(i + 1), bx + (i < 9 ? 9 : 3), 65, 16, i === cell ? '#ffffff' : C.muted);
    }
    rect(ctx, 614, 104, 414, 163, '#ffffff', true);
    rect(ctx, 614, 104, 414, 163, C.border);
    if (mode === 0) {
      const swatches = ['#b8c9a7', '#76906a', '#27446e', '#f5f8f0'];
      for (let i = 0; i < 4; i++) {
        rect(ctx, 654 + i * 78, 136, 62, 92, swatches[(i + row + col) % 4], true);
      }
    } else {
      values.forEach((v, i) => {
        rect(ctx, 652, 122 + i * 32, 312, 18, '#e9eef3', true);
        rect(ctx, 652, 122 + i * 32, 312 * v, 18, C.blue, true);
      });
      if (mode === 2) {
        ctx.lineWidth = 4;
        rect(ctx, 1000, 119 + row * 39, 17, 28, C.orange, true);
        line(ctx, 646 + col * 92, 256, 677 + col * 92, 256, C.orange, 5);
      }
    }
  };
  const choosePoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 1080;
    const y = (event.clientY - bounds.top) / bounds.height * 300;
    if (x >= 24 && x < 560 && y >= 26 && y < 266) {
      setCell(Math.floor((y - 26) / 80) * 4 + Math.floor((x - 24) / 134));
    }
  };
  return <>
    <Canvas draw={draw} onPointerDown={choosePoint} ariaLabel="选择照片区域并查看序列中对应的格子" />
    <div className="chip-row" aria-label="表示阶段">{modes.map((name, i) => <button type="button" key={name} className={`chip ${mode === i ? 'selected' : ''}`} aria-pressed={mode === i} onClick={() => setMode(i)}>{name}</button>)}</div>
    <div className="chip-row" aria-label="照片格子">{Array.from({ length: 12 }, (_, i) => <button type="button" key={i} className={`chip ${cell === i ? 'selected' : ''}`} aria-label={`第${Math.floor(i / 4) + 1}行第${i % 4 + 1}列`} aria-pressed={cell === i} onClick={() => setCell(i)}>{i + 1}</button>)}</div>
    <div style={{ padding: '8px 0', overflowWrap: 'anywhere' }}>当前选择：第 {row + 1} 行、第 {col + 1} 列 → 序列第 {cell + 1} 项。{mode > 0 && `特征示意：[${values.map(v => v.toFixed(2)).join('，')}]。`}{mode === 2 && `位置中心：（${((col + .5) / 4).toFixed(3)}，${((row + .5) / 3).toFixed(3)}）。`}</div>
    <div className={`feedback ${mode === 2 ? 'good' : ''}`} role="status">{mode === 0 ? `这一格在第${row + 1}行、第${col + 1}列，像素先记录颜色；右侧色块是这一过程的缩小示意。` : mode === 1 ? '卷积网络把附近纹理整理为特征；这里的短条是教学示意。序列里的第几项，和照片里的行列要对应起来。' : '位置向量补上行列信息，排成序列以后仍能区分左右。橙色标记随选中的区域一起改变，内容和位置由此结合。'}</div>
  </>;
}

export function D2(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D2Content/></div>;}
