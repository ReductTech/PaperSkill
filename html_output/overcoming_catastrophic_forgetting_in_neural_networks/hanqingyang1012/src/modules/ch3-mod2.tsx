import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P6 拖动 + 2 chips：白色参数空间（#d7deea 坐标轴），灰椭圆「任务A」、米色椭圆「任务B」、蓝点锚点 θ*_A。
// 无约束：点完全跟随指针（进入纯米色区画红环）；EWC：橙色锯齿弹簧拴住，位移按 1/(1+2·k·d) 缩放（k=3）。
const W = 1080;
const H = 280;
const K = 3;
const MAXD = 540; // 距离归一化：d/MAXD 代入 1/(1+2k·d)，方向性示意

const COL = {
  bg: '#f5f8f0',
  rockLight: '#b8c9a7',
  rockDark: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  muted: '#68778f',
};

type Mode = 'free' | 'ewc';

interface Pt {
  x: number;
  y: number;
}

interface Ellipse {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

interface WidgetState {
  mode: Mode;
  pos: Pt;
  dragging: boolean;
}

const ANCHOR: Pt = { x: 330, y: 140 };
const EA: Ellipse = { x: 330, y: 140, rx: 175, ry: 78 };
const EB: Ellipse = { x: 585, y: 140, rx: 175, ry: 78 };

function normDist(p: Pt, e: Ellipse): number {
  const dx = (p.x - e.x) / e.rx;
  const dy = (p.y - e.y) / e.ry;
  return Math.sqrt(dx * dx + dy * dy);
}

function errorOf(p: Pt, e: Ellipse): number {
  return clamp(0.5 * normDist(p, e) * normDist(p, e), 0, 0.95);
}

function renderedPoint(s: WidgetState): Pt {
  if (s.mode === 'free') return s.pos;
  const dx = s.pos.x - ANCHOR.x;
  const dy = s.pos.y - ANCHOR.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.01) return { x: ANCHOR.x, y: ANCHOR.y };
  const scale = 1 / (1 + 2 * K * (d / MAXD));
  return { x: ANCHOR.x + dx * scale, y: ANCHOR.y + dy * scale };
}

function feedbackFor(mode: Mode, p: Pt): { text: string; cls: string } {
  if (mode === 'ewc') {
    return {
      text: '弹簧把参数留在旧解附近：重叠区内两全，即使任务 B 更远也有保障。',
      cls: 'good',
    };
  }
  const inA = normDist(p, EA) <= 1;
  const inB = normDist(p, EB) <= 1;
  if (!inA && inB) {
    return {
      text: '无约束：任务 B 学会了，但已远离任务 A 的低误差区——遗忘。',
      cls: 'bad',
    };
  }
  if (inA && inB) {
    return { text: '两个任务都还行，但纯靠运气停在重叠区。', cls: '' };
  }
  return { text: '把参数点拖进任务 B 的区域试试。', cls: '' };
}

function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const amp = clamp(4 + len * 0.05, 4, 9);
  const segs = 9;
  ctx.strokeStyle = COL.orange;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= segs; i++) {
    const t0 = (i - 1) / segs;
    const t1 = i / segs;
    const off = i % 2 === 1 ? amp : -amp;
    const mx = x1 + ((dx * (t0 + t1)) / 2) + nx * off;
    const my = y1 + ((dy * (t0 + t1)) / 2) + ny * off;
    ctx.lineTo(mx, my);
    ctx.lineTo(x1 + dx * t1, y1 + dy * t1);
  }
  ctx.stroke();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  e: Ellipse,
  fill: string,
  stroke: string,
  label: string
) {
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = stroke;
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, e.x, e.y - e.ry + 26);
  ctx.textAlign = 'left';
}

export const Ch3Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<WidgetState>({
    mode: 'free',
    pos: { x: ANCHOR.x, y: ANCHOR.y },
    dragging: false,
  });
  const [mode, setMode] = useState<Mode>('free');
  const [feedback, setFeedback] = useState({
    text: '把参数点拖进任务 B 的区域试试。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: WidgetState, tSec: number) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      // 边框 + 坐标轴
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);
      ctx.strokeStyle = 'rgba(215, 222, 234, 0.9)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 140);
      ctx.lineTo(W, 140);
      ctx.moveTo(540, 0);
      ctx.lineTo(540, H);
      ctx.stroke();
      ctx.setLineDash([]);

      drawEllipse(ctx, EA, 'rgba(104, 119, 143, 0.18)', '#68778f', '任务A');
      drawEllipse(ctx, EB, 'rgba(214, 166, 99, 0.26)', '#c9a05f', '任务B');

      const p = renderedPoint(s);
      const inA = normDist(p, EA) <= 1;
      const inB = normDist(p, EB) <= 1;

      if (s.mode === 'ewc') {
        // 指针方向（虚线圈外）→ 实际落点
        ctx.strokeStyle = 'rgba(240, 126, 71, 0.45)';
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(s.pos.x, s.pos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // 橙色锯齿弹簧
        drawSpring(ctx, ANCHOR.x, ANCHOR.y, p.x, p.y);
      }

      // 锚点（蓝点，轻脉冲）
      const pulse = 0.55 + 0.45 * Math.sin(tSec * 2.4);
      ctx.fillStyle = COL.blue;
      ctx.beginPath();
      ctx.arc(ANCHOR.x, ANCHOR.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(39, 68, 110, ${pulse.toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ANCHOR.x, ANCHOR.y, 12, 0, Math.PI * 2);
      ctx.stroke();

      // 参数点 + 状态环（红：纯米色区；绿：重叠区）
      const ring =
        s.mode === 'free' && !inA && inB
          ? COL.red
          : s.mode === 'ewc' && inA && inB
            ? COL.green
            : null;
      if (ring) {
        ctx.strokeStyle = ring;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = s.mode === 'free' ? COL.blue : COL.orange;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 裸数字：任务A误差 / 任务B误差（颜色对应椭圆）
      const errA = errorOf(p, EA);
      const errB = errorOf(p, EB);
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#68778f';
      ctx.beginPath();
      ctx.arc(EA.x - 34, 36, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(errA.toFixed(2), EA.x, 36);
      ctx.fillStyle = '#c9a05f';
      ctx.beginPath();
      ctx.arc(EB.x - 34, 36, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(errB.toFixed(2), EB.x, 36);

      // 图例（≤3 项）：θ*_A 锚点 / 弹簧
      ctx.textAlign = 'left';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = COL.blue;
      ctx.beginPath();
      ctx.arc(742, 30, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COL.muted;
      ctx.fillText('θ*_A 锚点', 754, 30);
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(742, 56);
      ctx.lineTo(770, 56);
      ctx.stroke();
      ctx.fillStyle = COL.muted;
      ctx.fillText('弹簧', 778, 56);
    };

    const tick = (now: number) => {
      render(stateRef.current, now / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const syncFeedback = (s: WidgetState) => {
    setFeedback(feedbackFor(s.mode, renderedPoint(s)));
  };

  const toCanvas = (canvas: HTMLCanvasElement, clientX: number, clientY: number): Pt => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) * W) / rect.width, 8, W - 8),
      y: clamp(((clientY - rect.top) * H) / rect.height, 8, H - 8),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    const s = stateRef.current;
    s.dragging = true;
    s.pos = toCanvas(canvas, e.clientX, e.clientY);
    syncFeedback(s);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.pos = toCanvas(e.currentTarget, e.clientX, e.clientY);
    syncFeedback(s);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    stateRef.current.dragging = false;
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -4;
    else if (e.key === 'ArrowRight') dx = 4;
    else if (e.key === 'ArrowUp') dy = -4;
    else if (e.key === 'ArrowDown') dy = 4;
    else return;
    e.preventDefault();
    s.pos = { x: clamp(s.pos.x + dx, 8, W - 8), y: clamp(s.pos.y + dy, 8, H - 8) };
    syncFeedback(s);
  };

  const selectMode = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    syncFeedback(stateRef.current);
  };

  return (
    <div>
      <div tabIndex={0} onKeyDown={onKeyDown} style={{ outline: 'none' }}>
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          width={W}
          height={H}
          style={{ cursor: 'grab', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
      <div className="chip-row">
        <button
          className={`chip${mode === 'free' ? ' selected' : ''}`}
          onClick={() => selectMode('free')}
        >
          无约束
        </button>
        <button
          className={`chip${mode === 'ewc' ? ' selected' : ''}`}
          onClick={() => selectMode('ewc')}
        >
          EWC
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod2;
