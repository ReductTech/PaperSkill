import { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clamp, W } from './visual-core';

const ORIGIN = { x: 300, y: 220 };
const TEACHER = { x: 770, y: 70 };
const START = { x: 260, y: 40 };

export const ManualAlign: React.FC<WidgetProps> = () => {
  const [point, setPoint] = useState(START);
  const [dragging, setDragging] = useState(false);
  const ax = TEACHER.x - ORIGIN.x, ay = TEACHER.y - ORIGIN.y, dx = point.x - ORIGIN.x, dy = point.y - ORIGIN.y;
  const score = clamp((ax * dx + ay * dy) / (Math.hypot(ax, ay) * Math.max(1, Math.hypot(dx, dy))), -1, 1);
  const nudge = () => { const radius = Math.max(175, Math.hypot(dx, dy)); const current = Math.atan2(dy, dx); const target = Math.atan2(ay, ax); const next = current + (target - current) * 0.24; setPoint({ x: ORIGIN.x + Math.cos(next) * radius, y: ORIGIN.y + Math.sin(next) * radius }); };
  const rotate = (delta: number) => { const radius = Math.max(175, Math.hypot(dx, dy)); const angle = Math.atan2(dy, dx) + delta; setPoint({ x: ORIGIN.x + Math.cos(angle) * radius, y: ORIGIN.y + Math.sin(angle) * radius }); };
  const move = (event: React.PointerEvent<SVGSVGElement>) => { if (!dragging) return; const rect = event.currentTarget.getBoundingClientRect(); setPoint({ x: clamp((event.clientX - rect.left) * W / rect.width, 80, 1000), y: clamp((event.clientY - rect.top) * 300 / rect.height, 25, 275) }); };
  return <div>
    <svg className="ra-svg manual-align-svg" viewBox={`0 0 ${W} 300`} onPointerMove={move} onPointerUp={() => setDragging(false)} onPointerLeave={() => setDragging(false)} role="img" aria-label="拖动 DLM 隐藏向量，使其方向与 AR 教师向量一致">
      <rect width={W} height="300" fill={C.bg} /><circle cx={ORIGIN.x} cy={ORIGIN.y} r="8" fill={C.text} />
      <path d={`M ${ORIGIN.x} ${ORIGIN.y} L ${TEACHER.x} ${TEACHER.y}`} stroke={C.blue} strokeWidth="8" />
      <path d={`M ${ORIGIN.x} ${ORIGIN.y} L ${point.x} ${point.y}`} stroke={score > 0.95 ? C.green : C.orange} strokeWidth="8" />
      <circle cx={TEACHER.x} cy={TEACHER.y} r="16" fill={C.blue} />
      <circle cx={point.x} cy={point.y} r="21" fill={score > 0.95 ? C.green : C.orange} stroke="#fff" strokeWidth="5" role="slider" tabIndex={0} aria-label="DLM 隐藏向量方向" aria-valuemin={-1} aria-valuemax={1} aria-valuenow={Number(score.toFixed(2))} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }} onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); rotate(-0.08); } if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); rotate(0.08); } }} style={{ cursor: dragging ? 'grabbing' : 'grab' }} />
      <text x="70" y="54" fill={C.text} fontSize="20" fontWeight="700">拖动橙色端点，或用方向键旋转</text><text x="70" y="92" fill={score > 0.95 ? C.green : C.text} fontSize="34" fontWeight="700">cos = {score.toFixed(3)}</text><text x="70" y="121" fill={C.muted} fontSize="17">L_align = 1 − cos = {(1 - score).toFixed(3)}</text><text x={TEACHER.x + 24} y={TEACHER.y + 6} fill={C.blue} fontSize="17">AR reference</text><text x={point.x + 25} y={point.y + 6} fill={score > 0.95 ? C.green : C.orange} fontSize="17">DLM</text>
    </svg>
    <div className="chip-row"><button type="button" className="tiny ghost" onClick={() => setPoint(START)}>重新打散</button><button type="button" className="tiny" onClick={nudge}>沿梯度靠近一步</button></div>
    <div className={`feedback ${score > 0.95 ? 'good' : ''}`}>{score > 0.95 ? '对齐成功：方向几乎一致，余弦距离接近 0。向量长度仍可不同。' : '对齐损失优化的是方向几何。实际实现只在被遮蔽且移位有效的位置计算学生与教师表示。'}</div>
  </div>;
};
