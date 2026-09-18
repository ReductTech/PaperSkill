import React, { useEffect, useRef, useState } from 'react';
import { clamp, map, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 模块 4.1：位置、尺度与似然（1080×280，一个控件行 + 一个 .feedback）
const W = 1080;
const H = 280;

const MU_MIN = 0;
const MU_MAX = 1;
const SIGMA_MIN = 0.02;
const SIGMA_MAX = 0.4;

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
  ctx.fillStyle = CLR.loom;
  ctx.fillRect(16, 10, w - 32, 6);
  ctx.fillRect(16, 10, 6, 162);
  ctx.fillRect(w - 22, 10, 6, 162);
  ctx.lineWidth = 2;
  for (let i = 0; i < warpCount; i++) {
    const x = 24 + (i * (w - 48)) / Math.max(1, warpCount - 1);
    const st = warpState ? warpState[i] ?? 1 : 1;
    ctx.strokeStyle = st < 0.5 ? CLR.axis : st > 0.85 ? CLR.warpDeep : CLR.warp;
    ctx.lineWidth = st > 0.85 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, 164);
    ctx.stroke();
  }
}

// 唯一运动主体：打纬刀（竖刀身 + 手柄）
function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
): void {
  const bw = 20 * scale;
  const bh = 46 * scale;
  ctx.fillStyle = stateColor;
  ctx.strokeStyle = CLR.loom;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.rect(x - bw / 2, y - bh, bw, bh);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - bh);
  ctx.lineTo(x, y - bh - 16 * scale);
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
    ctx.fillRect(x, y, 9, 9);
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

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant = 'primary'
): void {
  ctx.fillStyle = variant === 'muted' ? CLR.muted : CLR.ink;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
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
    const lx = x + i * 116;
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
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, x + 10, y + 18);
  }
}

function feedbackFor(sigma: number): { text: string; cls: string } {
  const atEdge = sigma <= SIGMA_MIN + 0.0005 || sigma >= SIGMA_MAX - 0.0005;
  let base = '';
  let cls = '';
  if (sigma < 0.08) {
    base = '尺度太小，分布几乎塌成一点，雅可比体积项崩掉了似然。';
    cls = 'bad';
  } else if (sigma <= 0.26) {
    base = '位置合适、尺度稳定，织面密度可信，似然处在高位。';
    cls = 'good';
  } else {
    base = '尺度太大，织面被摊散，位置信息被稀释。';
    cls = 'bad';
  }
  return { text: atEdge ? base + '已到取值范围边界。' : base, cls };
}

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mu: 0.5, sigma: 0.18 });
  const rafRef = useRef<number | null>(null);
  const dragging = useRef(false);
  const [mu, setMu] = useState(0.5);
  const [sigma, setSigma] = useState(0.18);
  const [feedback, setFeedback] = useState({
    text: '拖动织口上的橙色打纬点：横向改落点，纵向改尺度。',
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

    const render = (s: { mu: number; sigma: number }) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, 40);

      const alpha = clamp(s.sigma / 0.18, 0.4, 1);
      const wx = map(s.mu, MU_MIN, MU_MAX, 140, 940);

      // 织口横线与已织织面
      drawPathOrSupport(ctx, [{ x: 60, y: 150 }, { x: 1020, y: 150 }], CLR.loom, 1.5);
      ctx.fillStyle = CLR.weave;
      ctx.fillRect(60, 152, 960, 14);
      ctx.strokeStyle = CLR.field;
      ctx.lineWidth = 1;
      const step = 4 + (1 - alpha) * 9;
      for (let x = 64; x < 1020; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 153);
        ctx.lineTo(x, 165);
        ctx.stroke();
      }
      if (alpha < 0.9) {
        ctx.strokeStyle = CLR.bad;
        ctx.lineWidth = 1.5;
        const n = Math.round((1 - alpha) * 12);
        for (let i = 0; i < n; i++) {
          const x = 80 + i * 78;
          ctx.beginPath();
          ctx.moveTo(x, 143);
          ctx.lineTo(x + 8, 166);
          ctx.stroke();
        }
      }

      // 新引入的纬线（横位置由 mu 决定）
      drawThread(ctx, { x: wx - 50, y: 132 }, { x: wx + 50, y: 132 }, CLR.shuttle, 3, false);

      // 唯一运动主体：打纬刀
      drawSubject(ctx, wx, 132, 1, CLR.shuttle);

      // 左下：高斯密度与落点
      const gx = 30;
      const gy = 180;
      const gw = 560;
      const gh = 88;
      drawInsetFrame(ctx, gx, gy, gw, gh, '密度与落点');
      const baseY = gy + gh - 22;
      const cx = gx + map(s.mu, MU_MIN, MU_MAX, 24, gw - 24);
      const sd = map(s.sigma, SIGMA_MIN, SIGMA_MAX, 10, 90);
      drawThread(ctx, { x: gx + 12, y: baseY }, { x: gx + gw - 12, y: baseY }, CLR.axis, 1, false);
      drawThread(
        ctx,
        { x: gx + map(0.5, 0, 1, 24, gw - 24), y: gy + 26 },
        { x: gx + map(0.5, 0, 1, 24, gw - 24), y: baseY },
        CLR.shuttle,
        2,
        true
      );
      ctx.strokeStyle = CLR.weave;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = gx + 8; px <= gx + gw - 8; px += 2) {
        const d = px - cx;
        const yy = baseY - 52 * Math.exp(-(d * d) / (2 * sd * sd));
        if (px === gx + 8) ctx.moveTo(px, yy);
        else ctx.lineTo(px, yy);
      }
      ctx.stroke();

      // 右下：雅可比体积条与似然条
      const rx = 620;
      const ry = 180;
      const rw = 400;
      const rh = 88;
      drawInsetFrame(ctx, rx, ry, rw, rh, '体积项与似然');
      const barBase = ry + rh - 22;
      const logJac = Math.log(s.sigma);
      const logMin = Math.log(SIGMA_MIN);
      const logMax = Math.log(SIGMA_MAX);
      const volNorm = clamp((logJac - logMin) / (logMax - logMin), 0, 1);
      const volH = 6 + volNorm * 52;
      ctx.fillStyle = CLR.cross;
      ctx.fillRect(rx + 90, barBase - volH, 46, volH);
      ctx.fillStyle = CLR.axis;
      ctx.fillRect(rx + 90, barBase, 46, 1);

      const z = (0.5 - s.mu) / s.sigma;
      const negLogLik = 0.5 * z * z + Math.log(s.sigma) + 0.9189;
      const nllNorm = clamp((negLogLik + 4) / 13, 0, 1);
      const nllH = 6 + (1 - nllNorm) * 52;
      const good = s.sigma >= 0.08 && s.sigma <= 0.26;
      ctx.fillStyle = good ? CLR.done : CLR.bad;
      ctx.fillRect(rx + 230, barBase - nllH, 46, nllH);
      ctx.fillStyle = CLR.axis;
      ctx.fillRect(rx + 230, barBase, 46, 1);

      drawLegend(ctx, 700, 32, [
        { label: '密度', color: CLR.weave },
        { label: '体积项', color: CLR.cross },
        { label: '似然', color: good ? CLR.done : CLR.bad },
      ]);

      // 标签放在打纬刀手柄上方，避免压在刀身上
      drawSceneLabel(ctx, wx - 14, 62, '落点', 'muted');
      drawSceneLabel(ctx, 64, 146, '织面', 'muted');
    };

    const tick = () => {
      render(stateRef.current);
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

  const commit = (nextMu: number, nextSigma: number) => {
    const m = clamp(nextMu, MU_MIN, MU_MAX);
    const s = clamp(Math.round(nextSigma * 1000) / 1000, SIGMA_MIN, SIGMA_MAX);
    stateRef.current.mu = m;
    stateRef.current.sigma = s;
    setMu(m);
    setSigma(s);
    setFeedback(feedbackFor(s));
  };

  const applyPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    commit(mx / W, map(my, 16, 168, SIGMA_MAX, SIGMA_MIN));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    applyPointer(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging.current) applyPointer(e);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer 已释放 */
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (e.key === 'ArrowLeft') commit(s.mu - 0.02, s.sigma);
    else if (e.key === 'ArrowRight') commit(s.mu + 0.02, s.sigma);
    else if (e.key === 'ArrowUp') commit(s.mu, s.sigma + 0.01);
    else if (e.key === 'ArrowDown') commit(s.mu, s.sigma - 0.01);
    else return;
    e.preventDefault();
  };

  const reset = () => commit(0.5, 0.18);

  const z = (0.5 - mu) / sigma;
  const negLogLik = 0.5 * z * z + Math.log(sigma) + 0.9189;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl">
        <label>
          落点 μ <span className="val">{mu.toFixed(2)}</span>
        </label>
        <label>
          尺度 σ <span className="val">{sigma.toFixed(2)}</span>
        </label>
        <label>
          似然 <span className="val">{negLogLik.toFixed(2)}</span>
        </label>
        <span style={{ color: 'var(--slate)', fontSize: '12px' }}>似然为教学用归一化读数</span>
        <button type="button" className="tiny" onClick={reset}>
          回到推荐值
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41;
