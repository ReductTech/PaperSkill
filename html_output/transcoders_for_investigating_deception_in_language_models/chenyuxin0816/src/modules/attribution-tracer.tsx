import { useEffect, useRef, useState } from 'react';
import { clamp, dist, observeCanvas, setupCanvas } from '../lib/canvasKit';
import { isPresentationMode } from '../lib/presentation';
import {
  COLORS,
  canvasPoint,
  drawArrow,
  drawFile,
  drawMagnifier,
  drawNode,
  drawSeal,
  drawText,
  roundedRect,
} from './case-file-analogy';
import '../styles/attribution-tracer.css';

type DragState = 'idle' | 'dragging' | 'off-path' | 'snapped';
type Point = { x: number; y: number };

const LEFT_POINTS: Point[] = [
  { x: 46, y: 122 },
  { x: 90, y: 88 },
  { x: 140, y: 150 },
  { x: 182, y: 110 },
];

const RIGHT_POINTS = [
  { x: 278, y: 120, label: '种子 token' },
  { x: 356, y: 82, label: '候选 Feature' },
  { x: 438, y: 142, label: '跨层 Feature' },
  { x: 514, y: 102, label: '输出节点' },
];

function pointToSegmentDistance(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (!lengthSq) return dist(point.x, point.y, a.x, a.y);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  return dist(point.x, point.y, a.x + t * dx, a.y + t * dy);
}

function drawTracer(canvas: HTMLCanvasElement, traceIndex: number, toolPosition: Point, dragState: DragState) {
  const ctx = setupCanvas(canvas, 560, 240);
  canvas.style.width = '100%';
  canvas.style.maxWidth = '560px';
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = '7 / 3';
  ctx.clearRect(0, 0, 560, 240);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, 560, 240);

  roundedRect(ctx, 16, 18, 188, 204, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.stroke();
  drawFile(ctx, 28, 34, 164, 170, '桌面线索');
  drawText(ctx, 'hidden', 32, 187, { size: 10, color: COLORS.blue, weight: 700 });
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  LEFT_POINTS.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
  ctx.stroke();
  for (let index = 0; index < traceIndex; index += 1) {
    ctx.strokeStyle = traceIndex === 3 ? COLORS.green : COLORS.blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LEFT_POINTS[index].x, LEFT_POINTS[index].y);
    ctx.lineTo(LEFT_POINTS[index + 1].x, LEFT_POINTS[index + 1].y);
    ctx.stroke();
  }
  if (traceIndex < 3) {
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(LEFT_POINTS[traceIndex].x, LEFT_POINTS[traceIndex].y);
    ctx.lineTo(LEFT_POINTS[traceIndex + 1].x, LEFT_POINTS[traceIndex + 1].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  LEFT_POINTS.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = index <= traceIndex ? (traceIndex === 3 ? COLORS.green : COLORS.blue) : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = index <= traceIndex ? (traceIndex === 3 ? COLORS.green : COLORS.blue) : COLORS.border;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  drawMagnifier(ctx, toolPosition.x, toolPosition.y, dragState === 'off-path' ? COLORS.orange : traceIndex === 3 ? COLORS.green : COLORS.blue);

  drawArrow(ctx, 214, 120, 236, 120, COLORS.muted, 2);
  drawText(ctx, '同步', 225, 101, { size: 9, align: 'center', color: COLORS.muted });

  roundedRect(ctx, 248, 18, 296, 204, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = traceIndex === 3 ? COLORS.green : COLORS.border;
  ctx.lineWidth = traceIndex === 3 ? 2.5 : 1.5;
  ctx.stroke();
  const bands = [
    { x: 258, label: 'token' },
    { x: 330, label: '较早层' },
    { x: 414, label: '较晚层' },
    { x: 490, label: '输出' },
  ];
  bands.forEach((band) => {
    ctx.fillStyle = '#f5f7fb';
    ctx.fillRect(band.x, 38, 55, 150);
    drawText(ctx, band.label, band.x + 27, 48, { size: 9, align: 'center', color: COLORS.muted });
  });
  for (let index = 0; index < RIGHT_POINTS.length - 1; index += 1) {
    const a = RIGHT_POINTS[index];
    const b = RIGHT_POINTS[index + 1];
    drawArrow(
      ctx,
      a.x + 12,
      a.y,
      b.x - 13,
      b.y,
      index < traceIndex ? (traceIndex === 3 ? COLORS.green : COLORS.blue) : COLORS.border,
      index < traceIndex ? 3 : 1.5,
      index === traceIndex
    );
  }
  RIGHT_POINTS.forEach((node, index) => drawNode(ctx, node.x, node.y, node.label, index <= traceIndex, traceIndex === 3, 11));
  drawSeal(ctx, 520, 197, traceIndex === 3, '到达');
  drawText(ctx, '教学示意：只表达追踪规则，不代表一条实测路径', 396, 210, {
    size: 9,
    align: 'center',
    color: COLORS.orange,
  });
  canvas.classList.add('is-ready');
}

export function AttributionTracer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presentationStart = isPresentationMode() ? 2 : 0;
  const [traceIndex, setTraceIndex] = useState(presentationStart);
  const [toolPosition, setToolPosition] = useState<Point>(LEFT_POINTS[presentationStart]);
  const [dragState, setDragState] = useState<DragState>(
    presentationStart > 0 ? 'snapped' : 'idle'
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawTracer(canvas, traceIndex, toolPosition, dragState);
    draw();
    return observeCanvas(canvas, draw, () => {});
  }, [dragState, toolPosition, traceIndex]);

  const goTo = (next: number) => {
    const bounded = clamp(next, 0, 3);
    setTraceIndex(bounded);
    setToolPosition(LEFT_POINTS[bounded]);
    setDragState('snapped');
  };

  const handlePointerDown = (clientX: number, clientY: number, pointerId: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = canvasPoint(canvas, clientX, clientY, 560, 240);
    if (dist(point.x, point.y, toolPosition.x, toolPosition.y) <= 27) {
      canvas.setPointerCapture(pointerId);
      setDragState('dragging');
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (dragState !== 'dragging' && dragState !== 'off-path') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = canvasPoint(canvas, clientX, clientY, 560, 240);
    const bounded = { x: clamp(point.x, 28, 192), y: clamp(point.y, 40, 196) };
    if (traceIndex >= 3) {
      setToolPosition(LEFT_POINTS[3]);
      return;
    }
    const current = LEFT_POINTS[traceIndex];
    const next = LEFT_POINTS[traceIndex + 1];
    if (dist(bounded.x, bounded.y, next.x, next.y) <= 22) {
      goTo(traceIndex + 1);
      return;
    }
    const onPath = pointToSegmentDistance(bounded, current, next) <= 18;
    setToolPosition(bounded);
    setDragState(onPath ? 'dragging' : 'off-path');
  };

  const handlePointerUp = () => {
    if (dragState === 'off-path') setToolPosition(LEFT_POINTS[traceIndex]);
    setDragState('idle');
  };

  const feedback =
    dragState === 'off-path'
      ? { color: COLORS.orange, text: '请沿已开放的有向边继续；未连接位置不能作为下一步。' }
      : [
          { color: COLORS.blue, text: '从论文列出的种子词 hidden 出发；种子词只是追踪入口。' },
          { color: COLORS.blue, text: '沿有向边进入候选 Feature。Feature 是固定的稀疏潜在单元，不是文本中的一个词。' },
          { color: COLORS.blue, text: '继续沿特征间依赖向输出方向追踪，跨层路径正在形成。' },
          { color: COLORS.green, text: '已到达最终输出：归因图把 token、跨层特征和输出连成可检查的有向路径。' },
        ][traceIndex];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="trace-controls">
        <button className="tiny ghost" type="button" onClick={() => goTo(traceIndex - 1)} disabled={traceIndex === 0}>
          上一个节点
        </button>
        <button className="tiny" type="button" onClick={() => goTo(traceIndex + 1)} disabled={traceIndex === 3}>
          {traceIndex === 3 ? '已到达输出' : '下一个节点'}
        </button>
        <button className="tiny ghost" type="button" onClick={() => goTo(0)} disabled={traceIndex === 0 && dragState !== 'off-path'}>
          重新追踪
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        role="img"
        aria-label="拖动放大镜沿 token、跨层特征到输出的归因路径"
        onPointerDown={(event) => handlePointerDown(event.clientX, event.clientY, event.pointerId)}
        onPointerMove={(event) => handlePointerMove(event.clientX, event.clientY)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 560,
          height: 'auto',
          margin: '0 auto',
          cursor: dragState === 'dragging' ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      />
      <div className={`trace-feature-card ${traceIndex >= 1 ? 'visible' : ''}`} aria-live="polite">
        <div>
          <span className="trace-feature-eyebrow">论文中的高频 Feature 示例</span>
          <strong>L23 / Feature #119106</strong>
          <span>解释标签：Obscuring information</span>
        </div>
        <div className="trace-feature-frequency">
          <strong>95/100</strong>
          <span>提示归因图中出现</span>
        </div>
        <small>用于解释 Feature 身份；右侧路径是追踪规则示意，不声称复刻这条具体实测边。</small>
      </div>
      <div
        className="feedback"
        aria-live="polite"
        style={{ borderLeft: `4px solid ${feedback.color}`, background: `${feedback.color}12`, padding: '10px 12px' }}
      >
        {feedback.text}
      </div>
    </div>
  );
}
