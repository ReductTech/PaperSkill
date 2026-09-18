import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// m2-1 — 连续取样还是分桶取样（1080×280，P6 直接在隐变量网格上拖动取样点）。
// 左侧连续网格与右侧 5×5 分桶网格对照，中间用虚线连接同一个取样坐标。

const W = 1080;
const H = 280;

const SCENE_BG = '#f5f8f0';
const C_WARP = '#b8c9a7';
const C_WARP_DEEP = '#76906a';
const C_LOOM = '#92400e';
const C_WEAVE = '#27446e';
const C_CROSS = '#7c3aed';
const C_SHUTTLE = '#f07e47';
const C_DONE = '#228d5c';
const C_BAD = '#c43f52';
const C_INSET = '#ffffff';
const C_MUTED = '#68778f';
const C_AXIS = '#d7deea';
const C_LABEL = '#21324a';

type XY = [number, number];
type WarpMark = 'normal' | 'dim' | 'broken';
type WarpState = (i: number) => WarpMark;

// 内在坐标系中的区域
const GX = 40;
const GY = 40;
const GW = 460;
const GH = 200;
const BX = 580;
const BY = 40;
const BW = 460;
const BH = 200;
const BINS = 5;

// ── Reusable Canvas drawing kit (defined locally in every widget file) ──────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = SCENE_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C_AXIS;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C_WARP;
  ctx.lineWidth = 1.5;
  for (let x = 60; x <= w - 60; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  }
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: WarpState
): void {
  ctx.strokeStyle = C_LOOM;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 12, w - 28, h - 24);
  if (warpCount <= 0) return;
  const from = 60;
  const to = w - 60;
  const step = warpCount > 1 ? (to - from) / (warpCount - 1) : 0;
  for (let i = 0; i < warpCount; i++) {
    const x = from + i * step;
    const st = warpState ? warpState(i) : 'normal';
    ctx.strokeStyle = st === 'broken' ? C_BAD : st === 'dim' ? C_AXIS : C_WARP;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
    if (st === 'broken') {
      ctx.strokeStyle = C_BAD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, h / 2);
      ctx.lineTo(x + 6, h / 2);
      ctx.stroke();
    }
  }
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string,
  flip = false
): void {
  const bw = 46 * scale;
  const bh = 18 * scale;
  const dir = flip ? -1 : 1;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - dir * bw * 2.4, y);
  ctx.lineTo(x - dir * bw * 0.5, y);
  ctx.stroke();
  roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 6 * scale);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dir * bw * 0.5, y - bh / 2);
  ctx.lineTo(x + dir * (bw * 0.5 + 9 * scale), y);
  ctx.lineTo(x + dir * bw * 0.5, y + bh / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: XY[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'corner' | 'band'
): void {
  ctx.strokeStyle = C_DONE;
  ctx.lineWidth = 2.5;
  if (mode === 'band') {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - w, y - w);
    ctx.lineTo(x, y - w);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'label' | 'muted'
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = variant === 'muted' ? C_MUTED : C_LABEL;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; text: string }[]
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 10, 12, 12);
    ctx.fillStyle = C_MUTED;
    ctx.fillText(it.text, cx + 17, y);
    cx += 17 + ctx.measureText(it.text).width + 22;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: XY,
  to: XY,
  color: string,
  width: number,
  dashed: boolean
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = C_INSET;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C_AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = C_LABEL;
    ctx.fillText(title, x + 10, y + 20);
  }
}

// ── Widget ─────────────────────────────────────────────────────────────────────

interface M21State {
  pickX: number;
  pickY: number;
}

function derived(s: M21State) {
  const contValue = s.pickX * 0.8 + s.pickY * 0.2;
  const binIndexX = Math.min(BINS - 1, Math.floor(s.pickX * BINS));
  const binIndexY = Math.min(BINS - 1, Math.floor(s.pickY * BINS));
  const binValue = (binIndexX + 0.5) / BINS;
  const quantError = Math.abs(contValue - binValue);
  return { contValue, binIndexX, binIndexY, binValue, quantError };
}

function feedbackFor(quantError: number): { text: string; cls: string } {
  if (quantError < 0.05) return { text: '正好落在桶中心，两种表示暂时等价。', cls: 'good' };
  if (quantError < 0.1) return { text: '点还在桶边，分桶已经开始和连续值错开。', cls: '' };
  return { text: '同一个桶里的连续值被压成同一个符号，差值就是量化损失。', cls: 'bad' };
}

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const stateRef = useRef<M21State>({ pickX: 0.5, pickY: 0.5 });
  const rafRef = useRef<number | null>(null);
  const [pick, setPick] = useState<M21State>({ pickX: 0.5, pickY: 0.5 });
  const [feedback, setFeedback] = useState(feedbackFor(0));

  const qErr = derived(pick).quantError;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: M21State) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, 0);

      const d = derived(s);

      // 左：连续网格
      drawInsetFrame(ctx, GX, GY, GW, GH);
      const stepC = 46;
      for (let x = GX; x < GX + GW; x += stepC) {
        for (let y = GY; y < GY + GH; y += stepC) {
          const u = clamp((x + stepC / 2 - GX) / GW, 0, 1);
          const v = clamp((y + stepC / 2 - GY) / GH, 0, 1);
          const val = u * 0.8 + v * 0.2;
          ctx.fillStyle = C_WEAVE;
          ctx.globalAlpha = 0.06 + 0.5 * val;
          ctx.fillRect(x + 1, y + 1, stepC - 2, stepC - 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C_AXIS;
      ctx.lineWidth = 1;
      for (let x = GX; x <= GX + GW; x += stepC) {
        ctx.beginPath();
        ctx.moveTo(x, GY);
        ctx.lineTo(x, GY + GH);
        ctx.stroke();
      }
      for (let y = GY; y <= GY + GH; y += stepC) {
        ctx.beginPath();
        ctx.moveTo(GX, y);
        ctx.lineTo(GX + GW, y);
        ctx.stroke();
      }

      // 右：5×5 分桶网格
      drawInsetFrame(ctx, BX, BY, BW, BH);
      const cw = BW / BINS;
      const chh = BH / BINS;
      for (let i = 0; i < BINS; i++) {
        for (let j = 0; j < BINS; j++) {
          const selected = i === d.binIndexX && j === d.binIndexY;
          ctx.fillStyle = selected ? C_BAD : C_WARP;
          ctx.globalAlpha = selected ? 0.85 : 0.5;
          ctx.fillRect(BX + i * cw + 1, BY + j * chh + 1, cw - 2, chh - 2);
        }
      }
      ctx.globalAlpha = 1;

      // 两个取样点
      const contCx = GX + s.pickX * GW;
      const contCy = GY + s.pickY * GH;
      const binCx = BX + (d.binIndexX + 0.5) * cw;
      const binCy = BY + (d.binIndexY + 0.5) * chh;

      // 中间链接虚线
      drawThread(ctx, [contCx, contCy], [binCx, binCy], C_MUTED, 2, true);

      // 连续侧的取样点
      ctx.fillStyle = C_SHUTTLE;
      ctx.beginPath();
      ctx.arc(contCx, contCy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 分桶侧被吸附的取样点
      ctx.fillStyle = C_SHUTTLE;
      ctx.beginPath();
      ctx.arc(binCx, binCy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 分桶窗格下方的量化误差条
      ctx.fillStyle = C_BAD;
      ctx.fillRect(BX, BY + BH + 6, Math.max(2, d.quantError * BW), 6);

      // 图例与 ≤2 个短标签
      drawLegend(ctx, GX, 272, [
        { color: C_WEAVE, text: '连续' },
        { color: C_WARP, text: '分桶' },
        { color: C_BAD, text: '误差' },
      ]);
      drawSceneLabel(ctx, GX, GY - 8, '连续取样', 'label');
      drawSceneLabel(ctx, BX, BY - 8, '分桶取样', 'label');
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

  const commit = (pickX: number, pickY: number) => {
    const next = { pickX: clamp(pickX, 0, 1), pickY: clamp(pickY, 0, 1) };
    stateRef.current = next;
    setPick(next);
    setFeedback(feedbackFor(derived(next).quantError));
  };

  const toInternal = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height),
    };
  };

  const applyPointer = (clientX: number, clientY: number) => {
    const p = toInternal(clientX, clientY);
    if (!p) return;
    if (p.x >= GX && p.x <= GX + GW && p.y >= GY && p.y <= GY + GH) {
      commit((p.x - GX) / GW, (p.y - GY) / GH);
    } else if (p.x >= BX && p.x <= BX + BW && p.y >= BY && p.y <= BY + BH) {
      commit((p.x - BX) / BW, (p.y - BY) / BH);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    applyPointer(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    applyPointer(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const stepK = 0.02;
    if (e.key === 'ArrowLeft') commit(pick.pickX - stepK, pick.pickY);
    else if (e.key === 'ArrowRight') commit(pick.pickX + stepK, pick.pickY);
    else if (e.key === 'ArrowUp') commit(pick.pickX, pick.pickY - stepK);
    else if (e.key === 'ArrowDown') commit(pick.pickX, pick.pickY + stepK);
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        style={{ touchAction: 'none', cursor: 'crosshair' }}
      />
      <div className="ctrl">
        <button className="chip" onClick={() => commit(0.5, 0.5)}>
          回到中心
        </button>
        <span>量化误差</span>
        <span className="val">{qErr.toFixed(2)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M21;
