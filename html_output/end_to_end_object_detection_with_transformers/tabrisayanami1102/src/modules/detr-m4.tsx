import React, { useRef, useState } from 'react';
import { C, Canvas, clear, rect, text, line, person, car, iou, giou, l1, type Box } from './detr-kit';

const TARGET: Box = [.35, .5, .3, .5];
const PHOTO = { x: 40, y: 30, w: 650, h: 240 };
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
function corners(b: Box) {
  return [b[0] - b[2] / 2, b[1] - b[3] / 2, b[0] + b[2] / 2, b[1] + b[3] / 2];
}
function drawBox(ctx: CanvasRenderingContext2D, b: Box, color: string, dashed = false) {
  const [x0, y0] = corners(b);
  rect(ctx, PHOTO.x + x0 * PHOTO.w, PHOTO.y + y0 * PHOTO.h, b[2] * PHOTO.w, b[3] * PHOTO.h, color, false, dashed);
}
function drawPhoto(ctx: CanvasRenderingContext2D) {
  rect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, C.light, true);
  rect(ctx, PHOTO.x, PHOTO.y + PHOTO.h * .74, PHOTO.w, PHOTO.h * .26, C.dark, true);
  person(ctx, PHOTO.x + TARGET[0] * PHOTO.w, PHOTO.y + .75 * PHOTO.h, .5 * PHOTO.h / 110, C.blue);
  person(ctx, PHOTO.x + .64 * PHOTO.w, PHOTO.y + .86 * PHOTO.h, .85, C.dark);
  car(ctx, PHOTO.x + .83 * PHOTO.w, PHOTO.y + .88 * PHOTO.h, .85, C.dark);
}

function D4Content() {
  const [box, setBox] = useState<Box>([.62, .5, .3, .5]);
  const dragging = useRef(false);
  const offset = useRef<[number, number]>([0, 0]);
  const overlap = iou(TARGET, box);
  const generalized = giou(TARGET, box);
  const coordinateError = l1(TARGET, box);
  const boxLoss = 5 * coordinateError + 2 * (1 - generalized);
  const exact = coordinateError < .00001;
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) * 1080 / r.width - PHOTO.x) / PHOTO.w,
      ((e.clientY - r.top) * 300 / r.height - PHOTO.y) / PHOTO.h];
  };
  const move = (cx: number, cy: number) => setBox(prev => [
    clamp(cx, Math.max(.15, prev[2] / 2), Math.min(.85, 1 - prev[2] / 2)),
    clamp(cy, .25, .75), prev[2], prev[3],
  ]);
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = point(e);
    if (Math.abs(x - box[0]) > box[2] / 2 + .035 || Math.abs(y - box[1]) > box[3] / 2 + .035) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true; offset.current = [x - box[0], y - box[1]];
  };
  const drag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const [x, y] = point(e); move(x - offset.current[0], y - offset.current[1]);
  };
  const release = () => { dragging.current = false; };
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta: Record<string, [number, number]> = { ArrowLeft: [-.01, 0], ArrowRight: [.01, 0], ArrowUp: [0, -.01], ArrowDown: [0, .01] };
    if (!delta[e.key] || e.target !== e.currentTarget) return;
    e.preventDefault(); move(box[0] + delta[e.key][0], box[1] + delta[e.key][1]);
  };
  const feedback = exact
    ? '中心和宽高都对齐了，L1为0，IoU为1，框损失为0。'
    : overlap < 1e-9
      ? `两个框完全分离，IoU为0；GIoU为${generalized.toFixed(3)}，仍会根据包围范围反映距离。`
      : `两个框已经重叠，但中心或宽高还有偏差。当前交并比为${overlap.toFixed(3)}，框损失为${boxLoss.toFixed(3)}。`;
  return <>
    <div tabIndex={0} onKeyDown={onKey} aria-label="可拖动的预测框，方向键移动中心" style={{ touchAction: 'none', borderRadius: 12 }}>
      <Canvas ariaLabel="绿色虚线为标准框，橙色实线为可移动预测框" style={{ touchAction: 'none', cursor: 'grab' }} onPointerDown={down} onPointerMove={drag} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
        draw={ctx => {
          clear(ctx); drawPhoto(ctx);
          const a = corners(TARGET), b = corners(box);
          const x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]);
          const x1 = Math.max(a[2], b[2]), y1 = Math.max(a[3], b[3]);
          rect(ctx, PHOTO.x + x0 * PHOTO.w, PHOTO.y + y0 * PHOTO.h, (x1 - x0) * PHOTO.w, (y1 - y0) * PHOTO.h, C.border, false, true);
          const ix0 = Math.max(a[0], b[0]), iy0 = Math.max(a[1], b[1]);
          const ix1 = Math.min(a[2], b[2]), iy1 = Math.min(a[3], b[3]);
          if (ix1 > ix0 && iy1 > iy0) {
            ctx.save(); ctx.globalAlpha = .28;
            rect(ctx, PHOTO.x + ix0 * PHOTO.w, PHOTO.y + iy0 * PHOTO.h, (ix1 - ix0) * PHOTO.w, (iy1 - iy0) * PHOTO.h, C.blue, true); ctx.restore();
          }
          drawBox(ctx, TARGET, C.green, true); drawBox(ctx, box, exact ? C.green : C.orange);
          const px = PHOTO.x + box[0] * PHOTO.w, py = PHOTO.y + box[1] * PHOTO.h;
          ctx.fillStyle = exact ? C.green : C.orange; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
          text(ctx, 'IoU', 755, 51, 20, C.ink);
          rect(ctx, 755, 69, 270, 22, C.border, true); rect(ctx, 755, 69, 270 * overlap, 22, C.blue, true);
          text(ctx, overlap.toFixed(3), 755, 121, 24, C.ink);
          text(ctx, 'GIoU', 755, 166, 20, C.ink);
          line(ctx, 755, 205, 1025, 205, C.border, 18); line(ctx, 890, 189, 890, 221, C.muted, 2);
          if (generalized >= 0) rect(ctx, 890, 196, 135 * generalized, 18, C.green, true);
          else rect(ctx, 890 + 135 * generalized, 196, -135 * generalized, 18, C.red, true);
          text(ctx, generalized.toFixed(3), 755, 263, 24, C.ink);
        }} />
    </div>
    <div className="chip-row" style={{ alignItems: 'center' }}>
      <button type="button" className="chip" onClick={() => setBox([...TARGET])}>居中</button>
      <button type="button" className="chip" onClick={() => setBox([.8, .5, .3, .5])}>分离</button>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>预测框宽度 {box[2].toFixed(2)}
        <input aria-label="预测框宽度" type="range" min=".12" max=".42" step=".01" value={box[2]}
          onChange={e => { const width = Number(e.target.value); setBox(p => [clamp(p[0], width / 2, 1 - width / 2), p[1], width, p[3]]); }} />
      </label>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead><tr><th>记录</th><th>中心 x</th><th>中心 y</th><th>宽度</th><th>高度</th></tr></thead>
        <tbody><tr><th style={{ color: C.green }}>标准框</th>{TARGET.map((v, i) => <td key={i}>{v.toFixed(2)}</td>)}</tr>
          <tr><th style={{ color: C.orange }}>预测框</th>{box.map((v, i) => <td key={i}>{v.toFixed(2)}</td>)}</tr></tbody>
      </table>
    </div>
    <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
      <div className="metric"><div className="l">L1 坐标误差 ↓</div><div className="v">{coordinateError.toFixed(3)}</div></div>
      <div className="metric"><div className="l">IoU 重叠比例 ↑</div><div className="v">{overlap.toFixed(3)}</div></div>
      <div className="metric"><div className="l">GIoU ↑</div><div className="v">{generalized.toFixed(3)}</div></div>
      <div className="metric"><div className="l">5 × L1 + 2 × (1 − GIoU) ↓</div><div className="v">{boxLoss.toFixed(3)}</div></div>
    </div>
    <div className={`feedback${exact ? ' good' : overlap < 1e-9 ? ' bad' : ''}`} aria-live="polite">{feedback}</div>
  </>;
}

export function D4(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D4Content/></div>;}
