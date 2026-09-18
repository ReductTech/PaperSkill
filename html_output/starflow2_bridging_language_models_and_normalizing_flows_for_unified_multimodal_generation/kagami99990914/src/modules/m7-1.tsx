import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* ------------------------------------------------------------------ */
/* Paper-specific drawing kit — duplicated locally in every widget.    */
/* ------------------------------------------------------------------ */

const C = {
  bg: '#f5f8f0',
  bench: '#d7deea',
  warp: '#b8c9a7',
  warpDeep: '#76906a',
  loom: '#92400e',
  weave: '#27446e',
  cross: '#7c3aed',
  shuttle: '#f07e47',
  done: '#228d5c',
  bad: '#c43f52',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  inset: '#ffffff',
};

function warpXs(w: number): number[] {
  const count = Math.max(6, Math.round((w - 120) / 24));
  const xs: number[] = [];
  for (let i = 0; i <= count; i += 1) xs.push(60 + ((w - 120) / count) * i);
  return xs;
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.bench;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C.warp;
  ctx.lineWidth = 2;
  warpXs(w).forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  });
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: Record<number, 'dim' | 'active'>
) {
  ctx.strokeStyle = C.loom;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(20, 12);
  ctx.lineTo(w - 20, 12);
  ctx.moveTo(20, h - 32);
  ctx.lineTo(w - 20, h - 32);
  ctx.moveTo(26, 12);
  ctx.lineTo(26, h - 32);
  ctx.moveTo(w - 26, 12);
  ctx.lineTo(w - 26, h - 32);
  ctx.stroke();

  const xs = warpXs(w).slice(0, Math.max(1, warpCount));
  xs.forEach((x, i) => {
    const st = warpState ? warpState[i] : undefined;
    ctx.strokeStyle = st === 'active' ? C.cross : st === 'dim' ? '#e4ead9' : C.warp;
    ctx.lineWidth = st === 'active' ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
) {
  const w = 34 * scale;
  const h = 14 * scale;
  const left = x - w / 2;
  const top = y - h / 2;
  const r = h / 2;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(left + w - r, top);
  ctx.quadraticCurveTo(left + w, top, left + w, top + r);
  ctx.quadraticCurveTo(left + w, top + h, left + w - r, top + h);
  ctx.lineTo(left + r, top + h);
  ctx.quadraticCurveTo(left, top + h, left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left - 24 * scale, y);
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  stateColor: string,
  width: number
) {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'row' | 'selvedge' | 'density'
) {
  if (mode === 'selvedge') {
    ctx.fillStyle = C.done;
    ctx.fillRect(x, y - 9, w, 18);
    return;
  }
  ctx.save();
  ctx.strokeStyle = C.done;
  ctx.lineWidth = 2;
  if (mode === 'row') ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'primary' | 'muted' | 'inverse'
) {
  ctx.fillStyle = variant === 'muted' ? C.muted : variant === 'inverse' ? '#ffffff' : C.ink;
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: Array<{ label: string; color: string }>
) {
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 8, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 14 + ctx.measureText(it.label).width + 18;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  color: string,
  width: number,
  dashed: boolean
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.restore();
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string
) {
  ctx.fillStyle = C.inset;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 16);
  }
}

/* ------------------------------------------------------------------ */
/* m7-1 · 预判位置与尺度 — 1080×280                                    */
/* 逐轮推进训练：逐位置高斯从又偏又宽收拢到目标附近，损失曲线同时压平。 */
/* ------------------------------------------------------------------ */

const W = 1080;
const H = 280;

const POS_X0 = 70;
const POS_DX = 580 / 7;
const STRIP_AXIS_Y = 118;

const LOSS_X0 = 752;
const LOSS_X1 = 1022;
const LOSS_YT = 60;
const LOSS_YB = 226;

const nllAt = (e: number) => 1.9 * Math.pow(0.62, e) + 0.35;
const lossY = (v: number) => LOSS_YT + ((2.4 - v) / 2.2) * (LOSS_YB - LOSS_YT);
const lossX = (i: number) => LOSS_X0 + (i * (LOSS_X1 - LOSS_X0)) / 6;

export const M71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ epoch: 0 });
  const rafRef = useRef<number | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '预判又偏又宽，损失很高：位置错、尺度也没收住。',
    cls: 'bad',
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

    const draw = () => {
      const e = stateRef.current.epoch;
      const spread = 0.34 * Math.pow(0.62, e);
      const bias = 0.22 * Math.pow(0.55, e);
      const nll = nllAt(e);
      const converged = e >= 5;

      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, warpXs(W).length);

      // ---- 隐变量条：8 个位置各一组小样本 ----
      drawInsetFrame(ctx, 30, 36, 650, 140, '');
      const spreadPx = spread * 95;
      const centerShift = bias * 110;
      for (let i = 0; i < 8; i += 1) {
        const xi = POS_X0 + i * POS_DX;
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xi - 28, STRIP_AXIS_Y);
        ctx.lineTo(xi + 28, STRIP_AXIS_Y);
        ctx.stroke();

        drawThread(ctx, [xi, 100], [xi, 136], C.shuttle, 1, true);

        const center = xi + centerShift;
        ctx.strokeStyle = C.weave;
        ctx.lineWidth = 2;
        for (let k = 0; k < 7; k += 1) {
          const off = ((k - 3) / 3) * spreadPx;
          const sx = clamp(center + off, 42, 668);
          ctx.beginPath();
          ctx.moveTo(sx, STRIP_AXIS_Y - 6);
          ctx.lineTo(sx, STRIP_AXIS_Y + 6);
          ctx.stroke();
        }
        ctx.fillStyle = converged ? C.done : C.weave;
        ctx.beginPath();
        ctx.arc(center, STRIP_AXIS_Y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- 损失曲线 ----
      drawInsetFrame(ctx, 716, 36, 334, 214, '');
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LOSS_X0, LOSS_YT);
      ctx.lineTo(LOSS_X0, LOSS_YB);
      ctx.lineTo(LOSS_X1, LOSS_YB);
      ctx.stroke();

      drawThread(ctx, [LOSS_X0, lossY(0.35)], [LOSS_X1, lossY(0.35)], C.done, 2, false);

      const curve = (from: number, to: number, color: string) => {
        if (to <= from) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = from; i <= to; i += 1) {
          const x = lossX(i);
          const y = lossY(nllAt(i));
          if (i === from) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      curve(0, e, C.weave);
      curve(e, 6, C.axis);

      ctx.fillStyle = C.shuttle;
      ctx.beginPath();
      ctx.arc(lossX(e), lossY(nll), 5, 0, Math.PI * 2);
      ctx.fill();

      drawSceneLabel(ctx, 40, 28, '预判', 'muted');
      drawSceneLabel(ctx, 724, 28, '损失', 'muted');
      drawLegend(ctx, 40, 272, [
        { label: '预判', color: C.weave },
        { label: '目标', color: C.shuttle },
        { label: '损失', color: C.done },
      ]);
    };

    const tick = () => {
      draw();
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

  const apply = (next: number) => {
    const e = clamp(Math.round(next), 0, 6);
    stateRef.current.epoch = e;
    setEpoch(e);
    if (e === 0) {
      setFeedback({ text: '预判又偏又宽，损失很高：位置错、尺度也没收住。', cls: 'bad' });
    } else if (e <= 4) {
      setFeedback({ text: `第 ${e + 1} 轮：预判在收拢，位置与尺度同时变准。`, cls: '' });
    } else {
      setFeedback({
        text: '预判中心贴住目标、尺度收窄到稳定区间，损失压平——这就是 NGP 收敛的样子。',
        cls: 'good',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny ghost" onClick={() => apply(epoch - 1)} disabled={epoch === 0}>
          上一轮
        </button>
        <button type="button" className="tiny" onClick={() => apply(epoch + 1)} disabled={epoch === 6}>
          下一轮
        </button>
        <button type="button" className="tiny ghost" onClick={() => apply(0)}>
          重置
        </button>
        <span className="step-label">
          第 <b>{epoch + 1}</b> / 7 轮
        </span>
        <span className="val" style={{ minWidth: 0, color: '#68778f' }}>
          曲线为教学用归一化示意，不是论文报告的损失值
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M71;
