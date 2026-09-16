import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 模块 6.1：一次走完 vs 反复补织（1080×280，一个控件行 + 一个 .feedback）
const W = 1080;
const H = 280;
const DURATION = 2600;

const CLR = {
  field: '#f5f8f0',
  warp: '#b8c9a7',
  warpDeep: '#76906a',
  loom: '#92400e',
  weave: '#27446e',
  cross: '#7c3aed',
  shuttle: '#f07e47',
  done: '#228d5c',
  bad: '#c43f52',
  inset: '#ffffff',
  muted: '#68778f',
  axis: '#d7deea',
  ink: '#21324a',
};

type Pt = { x: number; y: number };

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = CLR.field;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = CLR.axis;
  ctx.fillRect(0, h - 26, w, 8);
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: number[]
): void {
  ctx.lineWidth = 2;
  for (let i = 0; i < warpCount; i++) {
    const x = 24 + (i * (w - 48)) / Math.max(1, warpCount - 1);
    const st = warpState ? warpState[i] ?? 1 : 1;
    ctx.strokeStyle = st < 0.5 ? CLR.axis : st > 0.85 ? CLR.warpDeep : CLR.warp;
    ctx.lineWidth = st > 0.85 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, h - 40);
    ctx.stroke();
  }
}

// 唯一运动主体：梭子
function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
): void {
  const w = 42 * scale;
  const h = 16 * scale;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 26 * scale, y);
  ctx.lineTo(x - w / 2, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.quadraticCurveTo(x, y - h * 0.9, x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.quadraticCurveTo(x, y + h * 0.9, x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = stateColor;
  ctx.fill();
  ctx.strokeStyle = CLR.loom;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: Pt[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: string
): void {
  ctx.save();
  if (mode === 'corner') {
    ctx.fillStyle = CLR.done;
    ctx.fillRect(x, y, 12, 12);
  } else if (mode === 'band') {
    ctx.fillStyle = CLR.done;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y, w, 5);
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = CLR.done;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { label: string; color: string }[]
): void {
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  items.forEach((it, i) => {
    const lx = x + i * 100;
    ctx.fillStyle = it.color;
    ctx.fillRect(lx, y - 9, 12, 9);
    ctx.fillStyle = CLR.muted;
    ctx.fillText(it.label, lx + 18, y);
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  color: string,
  width: number,
  dashed = false
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = CLR.inset;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = CLR.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  if (title) {
    ctx.fillStyle = CLR.muted;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, x + 14, y + 22);
  }
}

// 面板内的小织机：经线 + 织口横线 + 已织布面
function drawPanelLoom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.strokeStyle = CLR.warp;
  ctx.lineWidth = 2;
  for (let k = 0; k < 12; k++) {
    const wx = x + 24 + (k * (w - 48)) / 11;
    ctx.beginPath();
    ctx.moveTo(wx, y + 34);
    ctx.lineTo(wx, y + h - 18);
    ctx.stroke();
  }
  ctx.strokeStyle = CLR.loom;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 108);
  ctx.lineTo(x + w - 16, y + 108);
  ctx.stroke();
  ctx.fillStyle = CLR.weave;
  ctx.fillRect(x + 16, y + 110, w - 32, 14);
}

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ running: false, elapsed: 0, start: 0, reported: -1 });
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '按下按钮，让两条路线从同一起点同时开跑。',
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

    const render = (s: { running: boolean; elapsed: number }) => {
      clearScene(ctx, W, H);

      const singleProgress = s.elapsed;
      const iterProgress = 1 - Math.pow(1 - s.elapsed, 2.2);
      const reencodeCount = Math.round(4 * s.elapsed);
      const cacheHits = Math.round(6 * singleProgress);

      const P = { x: 20, y: 20, w: 500, h: 180 };
      const Q = { x: 560, y: 20, w: 500, h: 180 };

      drawInsetFrame(ctx, P.x, P.y, P.w, P.h, '单次通过');
      drawPanelLoom(ctx, P.x, P.y, P.w, P.h);
      drawInsetFrame(ctx, Q.x, Q.y, Q.w, Q.h, '反复补织');
      drawPanelLoom(ctx, Q.x, Q.y, Q.w, Q.h);

      const rowY = P.y + 96;

      // 单次侧：一遍推进 + 6 个缓存小方格
      const endSingle = P.x + 20 + (P.w - 40) * singleProgress;
      drawThread(ctx, { x: P.x + 20, y: rowY }, { x: endSingle, y: rowY }, CLR.weave, 4, false);
      for (let i = 0; i < 6; i++) {
        const cx = P.x + 20 + (P.w - 40) * ((i + 0.5) / 6) - 5;
        const cy = rowY - 26;
        if (i < cacheHits) {
          ctx.fillStyle = CLR.done;
          ctx.fillRect(cx, cy, 10, 10);
        } else {
          ctx.strokeStyle = CLR.axis;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, 10, 10);
        }
      }
      drawSubject(ctx, endSingle, rowY, 1, CLR.shuttle);
      if (s.elapsed >= 0.999) drawTarget(ctx, P.x + P.w - 30, rowY - 22, 12, 'corner');

      // 迭代侧：先快后慢 + 每 1/4 行程留一条残影
      const endIter = Q.x + 20 + (Q.w - 40) * iterProgress;
      drawThread(ctx, { x: Q.x + 20, y: rowY }, { x: endIter, y: rowY }, CLR.weave, 4, false);
      for (let i = 0; i < 4; i++) {
        if (i < reencodeCount) {
          const gx = Q.x + 20 + (Q.w - 40) * ((i + 1) / 5);
          drawThread(ctx, { x: gx, y: rowY - 14 }, { x: gx, y: rowY + 14 }, CLR.bad, 1.5, true);
        }
      }
      drawSubject(ctx, endIter, rowY, 1, CLR.shuttle);
      if (s.elapsed >= 0.999) {
        ctx.fillStyle = CLR.bad;
        ctx.fillRect(Q.x + Q.w - 120, rowY - 3, 16, 6);
        ctx.fillRect(Q.x + Q.w - 84, rowY - 3, 12, 6);
      }

      // 底部计数条
      drawInsetFrame(ctx, 20, 212, 1040, 56, undefined);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = CLR.bad;
      ctx.fillText(`重编码 ${reencodeCount} 次`, 46, 246);
      ctx.fillStyle = CLR.done;
      ctx.fillText(`KV 缓存 ${cacheHits} 格`, 420, 246);

      drawLegend(ctx, 700, 248, [
        { label: '单次', color: CLR.weave },
        { label: '迭代', color: CLR.shuttle },
        { label: '缓存', color: CLR.done },
      ]);
    };

    const tick = () => {
      const s = stateRef.current;
      if (s.running) {
        const e = clamp((performance.now() - s.start) / DURATION, 0, 1);
        const n = Math.round(4 * e);
        s.elapsed = e;
        if (e >= 1) {
          s.running = false;
          s.reported = n;
          setRunning(false);
          setElapsed(1);
          setFeedback({
            text: `单次模式只需一遍，已生成的部分直接进 KV 缓存、重编码 0 次；反复补织模式需要 ${n} 次重新编码。`,
            cls: 'good',
          });
        } else if (n !== s.reported) {
          s.reported = n;
          setElapsed(e);
          setFeedback({
            text: `同一段时间里，左边一遍通过，右边已经回头补了 ${n} 次。`,
            cls: '',
          });
        }
      }
      render(s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const toggle = () => {
    const s = stateRef.current;
    s.running = true;
    s.elapsed = 0;
    s.start = performance.now();
    s.reported = -1;
    setRunning(true);
    setStarted(true);
    setElapsed(0);
    setFeedback({ text: '同一段时间里，左边一遍通过，右边已经回头补了 0 次。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={toggle}>
          {started ? '重新对照' : '同时开始'}
        </button>
        <label>
          进度 <span className="val">{Math.round(elapsed * 100)}%</span>
        </label>
        <label>
          状态 <span className="val">{running ? '运行中' : started ? '已完成' : '待开始'}</span>
        </label>
        <span style={{ color: 'var(--slate)', fontSize: '12px' }}>
          两侧使用同一时间基准；计数为架构性质的示意，论文未报告实测加速比
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M61;
