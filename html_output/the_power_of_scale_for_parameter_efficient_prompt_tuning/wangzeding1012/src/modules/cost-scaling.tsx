import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', line: '#d7deea', white: '#ffffff',
};

type Draw = (ctx: CanvasRenderingContext2D, time: number) => void;

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = C.line, lineWidth = 2) {
  rounded(ctx, x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, size = 22, align: CanvasTextAlign = 'center') {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function clearStudio(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(22, h - 24);
  ctx.lineTo(w - 22, h - 24);
  ctx.stroke();
}

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = C.blue, locked = false) {
  const w = 118 * scale;
  const h = 72 * scale;
  box(ctx, x, y, w, h, C.white, color, 3);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + w * 0.57, y + h * 0.53, 23 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(x + w * 0.57, y + h * 0.53, 12 * scale, 0, Math.PI * 2);
  ctx.fill();
  box(ctx, x + 16 * scale, y - 11 * scale, 36 * scale, 15 * scale, C.white, color, 2);
  if (locked) {
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + w - 24 * scale, y + 11 * scale, 13 * scale, 14 * scale);
    ctx.beginPath();
    ctx.arc(x + w - 17.5 * scale, y + 11 * scale, 6 * scale, Math.PI, 0);
    ctx.stroke();
  }
}

function drawSettingStrip(ctx: CanvasRenderingContext2D, x: number, y: number, cells: number, color = C.green, width = 120) {
  box(ctx, x, y, width, 34, '#ecf8f2', color, 2);
  const visible = Math.max(1, Math.min(cells, 12));
  const gap = 3;
  const cw = (width - 16 - gap * (visible - 1)) / visible;
  for (let i = 0; i < visible; i++) {
    ctx.fillStyle = i % 2 ? color : C.orange;
    ctx.globalAlpha = 0.72;
    ctx.fillRect(x + 8 + i * (cw + gap), y + 8, cw, 18);
  }
  ctx.globalAlpha = 1;
}

function drawFocusFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = C.green) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  const s = 18;
  [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(px, py + sy * s);
    ctx.lineTo(px, py);
    ctx.lineTo(px + sx * s, py);
    ctx.stroke();
  });
}

function CanvasPanel({ draw, deps, width = W, height = H, animate = false, onPointerDown, onPointerMove, onPointerUp }:
  { draw: Draw; deps: React.DependencyList; width?: number; height?: number; animate?: boolean;
    onPointerDown?: React.PointerEventHandler<HTMLCanvasElement>;
    onPointerMove?: React.PointerEventHandler<HTMLCanvasElement>;
    onPointerUp?: React.PointerEventHandler<HTMLCanvasElement> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, width, height); } catch { return; }
    let raf: number | null = null;
    const startAt = performance.now();
    const paint = () => {
      draw(ctx, (performance.now() - startAt) / 1000);
      canvas.classList.add('is-ready');
      if (animate) raf = requestAnimationFrame(paint);
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(paint); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    if (!animate) paint();
    const disconnect = animate ? observeCanvas(canvas, start, stop) : () => undefined;
    return () => { stop(); disconnect(); };
  }, deps);
  return <canvas ref={ref} width={width} height={height} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />;
}

export function StudioScene({ chapterId, moduleId }: WidgetProps) {
  const draw: Draw = (ctx, time) => {
    const w = 560;
    const h = 140;
    clearStudio(ctx, w, h);
    const phase = (Math.sin(time * 2) + 1) / 2;
    if (chapterId === 'hero') {
      if (moduleId === 'old') {
        drawCamera(ctx, 50, 56, 0.58, C.red);
        drawCamera(ctx, 164, 56, 0.58, C.red);
        drawCamera(ctx, 330 + phase * 90, 56, 0.58, C.red);
        box(ctx, 274, 18, 126, 26, C.white, C.red);
        label(ctx, '完整副本', 337, 31, C.red, 17);
      } else {
        drawCamera(ctx, 78, 54, 0.72, C.blue, true);
        drawSettingStrip(ctx, 270 + phase * 82, 70, 5, C.green, 110);
        box(ctx, 218, 18, 180, 26, C.white, C.green);
        label(ctx, '共享 + 软提示', 308, 31, C.green, 17);
      }
      return;
    }
    const chapter = Number(chapterId.replace('chap-', '')) || 1;
    if (chapter === 1) {
      drawCamera(ctx, 78 + phase * 250, 55, 0.65, C.red);
      box(ctx, 430, 48, 72, 62, C.white, C.red);
    } else if (chapter === 2) {
      drawSettingStrip(ctx, 42 + phase * 180, 70, 6);
      box(ctx, 270, 58, 100, 58, '#eef3fa', C.blue);
      drawCamera(ctx, 420, 55, 0.62, C.blue, true);
    } else if (chapter === 3) {
      ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(70, 82); ctx.lineTo(485, 82); ctx.stroke();
      [130, 280, 430].forEach((x) => { ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(x, 82, 7, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(90 + phase * 370, 82, 11, 0, Math.PI * 2); ctx.fill();
      drawFocusFrame(ctx, 430, 52, 64, 60);
    } else if (chapter === 4) {
      drawCamera(ctx, 85 + phase * 18, 50 - phase * 12, 0.55 + phase * 0.28, C.blue, true);
      drawFocusFrame(ctx, 390, 45, 92, 72, phase > 0.65 ? C.green : C.orange);
    } else if (chapter === 5) {
      drawSettingStrip(ctx, 65, 70, Math.round(1 + phase * 11), C.green, 300);
      drawCamera(ctx, 420, 55, 0.62, C.blue, true);
    } else if (chapter === 6) {
      ctx.save(); ctx.translate(245, 82); ctx.rotate((1 - phase) * 0.65); box(ctx, -54, -28, 108, 56, C.white, C.purple); ctx.restore();
      ctx.strokeStyle = C.green; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(340, 45); ctx.lineTo(340, 115); ctx.stroke();
    } else if (chapter === 7) {
      drawCamera(ctx, 80, 52, 0.72, C.blue, true);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(380, 83, 34, -Math.PI * 0.9, -Math.PI * 0.9 + phase * Math.PI * 1.6); ctx.stroke();
      drawFocusFrame(ctx, 440, 52, 66, 62, phase > 0.72 ? C.green : C.orange);
    } else if (chapter === 8) {
      drawCamera(ctx, 225, 48, 0.8, C.blue, true);
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(55 + phase * 450, 88, 9, 0, Math.PI * 2); ctx.fill();
    } else if (chapter === 9) {
      drawCamera(ctx, 205 + phase * 90, 54, 0.68, C.blue, true);
      ctx.fillStyle = '#fff0da'; ctx.fillRect(30, 28, 120, 92);
      ctx.fillStyle = '#e8f1ff'; ctx.fillRect(410, 28, 120, 92);
    } else {
      drawCamera(ctx, 74, 54, 0.68, C.blue, true);
      box(ctx, 270 + phase * 155, 52, 98, 68, C.white, phase > 0.72 ? C.green : C.orange, 3);
      drawFocusFrame(ctx, 435, 45, 82, 80, C.green);
    }
  };
  return <CanvasPanel draw={draw} deps={[chapterId, moduleId]} width={560} height={140} animate />;
}

export function CostScaling() {
  const [taskCount, setTaskCount] = useState(4);
  const [method, setMethod] = useState<'full' | 'prompt'>('full');
  const draw: Draw = (ctx) => {
    clearStudio(ctx, W, H);
    drawCamera(ctx, 70, 92, 1.2, C.blue, method === 'prompt');
    const visible = Math.min(taskCount, 20);
    const gap = 10;
    const barW = Math.max(13, Math.min(34, (560 - gap * (visible - 1)) / visible));
    for (let i = 0; i < visible; i++) {
      const bh = method === 'full' ? 112 : 32 + (i % 3) * 6;
      box(ctx, 330 + i * (barW + gap), 225 - bh, barW, bh, method === 'full' ? '#fff1f2' : '#ecf8f2', method === 'full' ? C.red : C.green);
    }
    label(ctx, `${taskCount} 个任务`, 820, 46, C.text, 23);
    label(ctx, method === 'full' ? `11B × ${taskCount}` : `20,480 × ${taskCount}`, 820, 260, method === 'full' ? C.red : C.green, 24);
  };
  const feedback = method === 'full'
    ? (taskCount === 1 ? '单任务时差异尚未累积，多任务部署才会放大成本。' : '完整模型副本随任务数线性增加。')
    : '基础模型只保存一次，每个任务只增加小型提示。';
  return <div>
    <CanvasPanel draw={draw} deps={[taskCount, method]} />
    <div className="ctrl"><label>任务数量 <span className="val">{taskCount}</span></label><input aria-label="任务数量" type="range" min={1} max={20} step={1} value={taskCount} onChange={(e) => setTaskCount(Number(e.target.value))} /></div>
    <div className="chip-row" role="group" aria-label="调优方式">
      <button className={`chip ${method === 'full' ? 'selected' : ''}`} onClick={() => setMethod('full')}>全量调优</button>
      <button className={`chip ${method === 'prompt' ? 'selected' : ''}`} onClick={() => setMethod('prompt')}>提示调优</button>
    </div>
    <div className={`feedback ${method === 'prompt' ? 'good' : taskCount > 1 ? 'bad' : ''}`}>{feedback}</div>
  </div>;
}

export function PromptPlacement() {
  const nodes = [
    { id: 'prompt', name: '软提示 Pe', value: 'p × e', feedback: 'Pe 是唯一可训练的输入前缀。' },
    { id: 'input', name: '输入 Xe', value: 'n × e', feedback: 'Xe 来自真实输入 token。' },
    { id: 'concat', name: '拼接', value: '(p+n) × e', feedback: '拼接只增加序列长度，不改变嵌入宽度 e。' },
    { id: 'model', name: '冻结模型', value: 'θ fixed', feedback: '主模型 θ 接收完整序列但保持冻结。' },
  ] as const;
  const [active, setActive] = useState<(typeof nodes)[number]['id']>('prompt');
  const index = nodes.findIndex((n) => n.id === active);
  const draw: Draw = (ctx) => {
    clearStudio(ctx, W, H);
    const xs = [115, 365, 615, 865];
    ctx.lineWidth = 5;
    ctx.strokeStyle = C.line;
    ctx.beginPath(); ctx.moveTo(xs[0], 142); ctx.lineTo(xs[3], 142); ctx.stroke();
    ctx.strokeStyle = C.blue;
    ctx.beginPath(); ctx.moveTo(xs[0], 142); ctx.lineTo(xs[index], 142); ctx.stroke();
    xs.forEach((x, i) => {
      const selected = i === index;
      const color = i === 0 ? C.green : C.blue;
      box(ctx, x - 72, 92, 144, 100, selected ? (i === 0 ? '#ecf8f2' : '#eef3fa') : C.white, color, selected ? 5 : 2);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, 142, selected ? 18 : 12, 0, Math.PI * 2); ctx.fill();
    });
    label(ctx, nodes[index].value, 540, 242, index === 0 ? C.green : C.blue, 27);
  };
  return <div>
    <CanvasPanel draw={draw} deps={[active]} />
    <div className="chip-row" role="group" aria-label="数据流位置">{nodes.map((node) => <button key={node.id} className={`chip ${active === node.id ? 'selected' : ''}`} onClick={() => setActive(node.id)}>{node.name}</button>)}</div>
    <div className="feedback good">{nodes[index].feedback}</div>
  </div>;
}

export function ContinuousSpace() {
  const anchors = [{ x: 610, y: 92 }, { x: 760, y: 72 }, { x: 900, y: 112 }, { x: 675, y: 215 }, { x: 845, y: 220 }];
  const target = { x: 795, y: 150 };
  const [mode, setMode] = useState<'discrete' | 'soft'>('discrete');
  const [point, setPoint] = useState({ x: 760, y: 72 });
  const [dragging, setDragging] = useState(false);
  const distance = Math.hypot(point.x - target.x, point.y - target.y);
  const updatePoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let x = clamp((event.clientX - rect.left) * W / rect.width, 585, 965);
    let y = clamp((event.clientY - rect.top) * H / rect.height, 48, 246);
    if (mode === 'discrete') {
      const nearest = anchors.reduce((best, a) => Math.hypot(a.x - x, a.y - y) < Math.hypot(best.x - x, best.y - y) ? a : best, anchors[0]);
      x = nearest.x; y = nearest.y;
    }
    setPoint({ x, y });
  };
  const draw: Draw = (ctx) => {
    clearStudio(ctx, W, H);
    box(ctx, 60, 60, 390, 178, C.white, C.line);
    const sharp = clamp(1 - distance / 220, 0, 1);
    ctx.strokeStyle = C.line; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(120, 150); ctx.lineTo(390, 150); ctx.stroke();
    ctx.strokeStyle = sharp > 0.72 ? C.green : C.orange; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(120, 150); ctx.lineTo(120 + 270 * sharp, 150); ctx.stroke();
    drawFocusFrame(ctx, 210, 91, 90, 118, sharp > 0.72 ? C.green : C.orange);
    box(ctx, 555, 38, 440, 224, C.white, C.line);
    anchors.forEach((a) => { ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(a.x, a.y, 9, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(target.x, target.y, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = distance < 24 ? C.green : C.orange; ctx.beginPath(); ctx.arc(point.x, point.y, 13, 0, Math.PI * 2); ctx.fill();
    label(ctx, mode === 'discrete' ? '离散' : '连续', 775, 275, mode === 'soft' ? C.green : C.blue, 22);
  };
  const feedback = mode === 'discrete'
    ? '词表锚点只能跳跃选择，未必恰好落在任务需要的位置。'
    : distance < 24 ? '独立参数可以通过梯度移动到任务需要的位置。' : '软提示正在连续空间中靠近合适表示。';
  const nudge = (dx: number, dy: number) => setPoint((p) => ({ x: clamp(p.x + dx, 585, 965), y: clamp(p.y + dy, 48, 246) }));
  return <div>
    <CanvasPanel draw={draw} deps={[mode, point]} onPointerDown={(e) => { setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); updatePoint(e); }} onPointerMove={(e) => { if (dragging) updatePoint(e); }} onPointerUp={(e) => { setDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }} />
    <div className="chip-row" role="group" aria-label="提示空间">
      <button className={`chip ${mode === 'discrete' ? 'selected' : ''}`} onClick={() => { setMode('discrete'); setPoint(anchors[1]); }}>离散提示</button>
      <button className={`chip ${mode === 'soft' ? 'selected' : ''}`} onClick={() => setMode('soft')}>软提示</button>
      <button className="chip" onClick={() => nudge(-12, 0)} aria-label="向左移动">←</button>
      <button className="chip" onClick={() => nudge(12, 0)} aria-label="向右移动">→</button>
      <button className="chip" onClick={() => nudge(0, -12)} aria-label="向上移动">↑</button>
      <button className="chip" onClick={() => nudge(0, 12)} aria-label="向下移动">↓</button>
    </div>
    <div className={`feedback ${mode === 'soft' && distance < 24 ? 'good' : mode === 'discrete' ? 'bad' : ''}`}>{feedback}</div>
  </div>;
}
