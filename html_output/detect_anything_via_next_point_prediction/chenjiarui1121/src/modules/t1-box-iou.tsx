import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { SymbolHint } from '../components/SymbolHint';
import { C, clamp, svgPoint } from './rex-kit';

// IoU worked on a cell grid: every number on this page is a count of cells.
const CW = 9, CH = 7, S = 72;
type B = [number, number, number, number]; // x0, y0, x1, y1 in cells
const GT: B = [2, 1, 6, 5];
const area = (b: B) => (b[2] - b[0]) * (b[3] - b[1]);
const inter = (a: B, b: B) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
type Drag = { mode: 'move' | 'size'; sx: number; sy: number; o: B } | null;

export function T1BoxIou(_: WidgetProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [pred, setPred] = useState<B>([3, 1, 7, 5]);
  const [drag, setDrag] = useState<Drag>(null);
  const ov = inter(pred, GT), un = area(pred) + area(GT) - ov, v = ov / un;
  const cell = (e: React.PointerEvent) => { const p = svgPoint(svg.current!, e.clientX, e.clientY); return { x: p.x / S, y: p.y / S }; };
  const start = (e: React.PointerEvent, mode: 'move' | 'size') => {
    e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = cell(e); setDrag({ mode, sx: p.x, sy: p.y, o: pred });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = cell(e), dx = Math.round(p.x - drag.sx), dy = Math.round(p.y - drag.sy), o = drag.o;
    if (drag.mode === 'size') { setPred([o[0], o[1], clamp(o[2] + dx, o[0] + 1, CW), clamp(o[3] + dy, o[1] + 1, CH)]); return; }
    const mx = clamp(dx, -o[0], CW - o[2]), my = clamp(dy, -o[1], CH - o[3]);
    setPred([o[0] + mx, o[1] + my, o[2] + mx, o[3] + my]);
  };
  const key = (e: React.KeyboardEvent) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return; e.preventDefault();
    setPred(b => { const mx = clamp(d[0], -b[0], CW - b[2]), my = clamp(d[1], -b[1], CH - b[3]); return [b[0] + mx, b[1] + my, b[2] + mx, b[3] + my]; });
  };
  const ox0 = Math.max(pred[0], GT[0]), oy0 = Math.max(pred[1], GT[1]), ox1 = Math.min(pred[2], GT[2]), oy1 = Math.min(pred[3], GT[3]);
  const fb = v === 1 ? '两个框完全重合，IoU = 1。' : v >= .95 ? '达到严格门槛 0.95。' : v >= .5
    ? `IoU ${v.toFixed(2)}：过了宽松门槛 0.5，没过严格门槛 0.95。论文同时报告这两个门槛下的成绩。`
    : ov === 0 ? '两个框没有重叠，IoU = 0。' : `IoU ${v.toFixed(2)}：低于 0.5，这个框不算检测到。`;
  return <div className="rx-page rx-t1">
    <svg ref={svg} viewBox={`0 0 ${CW * S} ${CH * S}`} width={CW * S} height={CH * S} role="group" aria-label="拖动蓝色预测框，右下角手柄改变大小"
      onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
      <rect width={CW * S} height={CH * S} fill="#f6f8fc" />
      {Array.from({ length: CW + 1 }, (_, i) => <line key={'v' + i} x1={i * S} x2={i * S} y1={0} y2={CH * S} stroke={C.line} strokeWidth={i === 0 || i === CW ? 3 : 1.5} />)}
      {Array.from({ length: CH + 1 }, (_, i) => <line key={'h' + i} y1={i * S} y2={i * S} x1={0} x2={CW * S} stroke={C.line} strokeWidth={i === 0 || i === CH ? 3 : 1.5} />)}
      {ox1 > ox0 && oy1 > oy0 && <rect x={ox0 * S} y={oy0 * S} width={(ox1 - ox0) * S} height={(oy1 - oy0) * S} fill={C.orange} opacity=".3" />}
      <rect x={GT[0] * S} y={GT[1] * S} width={(GT[2] - GT[0]) * S} height={(GT[3] - GT[1]) * S} fill="none" stroke={C.green} strokeWidth="6" />
      <g className="rx-drag" tabIndex={0} role="button" data-slide-keys="" aria-label={`预测框，IoU ${v.toFixed(2)}，方向键移动`} onKeyDown={key}>
        <rect x={pred[0] * S} y={pred[1] * S} width={(pred[2] - pred[0]) * S} height={(pred[3] - pred[1]) * S} fill={C.blue} fillOpacity=".08" stroke={C.blue} strokeWidth="6" strokeDasharray="14 9" onPointerDown={e => start(e, 'move')} />
        <rect x={pred[2] * S - 15} y={pred[3] * S - 15} width="30" height="30" fill="#fff" stroke={C.blue} strokeWidth="4" style={{ cursor: 'nwse-resize' }} onPointerDown={e => start(e, 'size')} />
      </g>
    </svg>
    <div className="rx-t1-side">
      <p className="rx-text">一个框只需要四个数：左上角和右下角的坐标。</p>
      <p className="rx-text"><b className="rx-green">真值框</b> [{GT.join(', ')}]<br /><b className="rx-blue">预测框</b> [{pred.join(', ')}]</p>
      <div className="rx-metrics">
        <div><span className="rx-text">重叠</span><b className="rx-em">{ov} 格</b></div>
        <div><span className="rx-text">合并</span><b className="rx-em">{un} 格</b></div>
        <div><span className="rx-text">IoU</span><b className={`rx-em ${v >= .5 ? 'rx-green' : 'rx-red'}`}>{v.toFixed(2)}</b></div>
      </div>
      <p className="rx-formula rx-h"><SymbolHint meaning="IoU：Intersection over Union，交并比。完全重合为 1，不重叠为 0。">IoU</SymbolHint> = 重叠面积 / 合并面积</p>
      <p className="rx-text" aria-live="polite">{fb}</p>
    </div>
  </div>;
}
