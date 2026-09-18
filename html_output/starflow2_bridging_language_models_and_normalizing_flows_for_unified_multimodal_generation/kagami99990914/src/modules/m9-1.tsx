import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// m9-1 — 粗线与细线怎么分工（1080×280，P6 滑块）。
// 拖动唯一滑块「浅层占比」：容量在浅层块与深层流之间重新分配，
// 布面轮廓线宽、局部细纹数量、断纹与全局缺口、层数条同步变化。

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

interface M91State {
  alloc: number; // 0–1
}

function feedbackFor(alloc: number): { text: string; cls: string } {
  if (alloc < 0.15) {
    return { text: '局部絮乱全压给深层流，一次 pass 吸收不完，细节糊成一片。', cls: 'bad' };
  }
  if (alloc <= 0.35) {
    return {
      text: '论文的分配：浅层 2 块 × 4 层负责局部、深层 24 层负责全局，一次 pass 就够。',
      cls: 'good',
    };
  }
  return { text: '浅层占得太多，全局结构撑不住，布面出现缺口。', cls: 'bad' };
}

export const M91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<M91State>({ alloc: 0.25 });
  const rafRef = useRef<number | null>(null);
  const [alloc, setAlloc] = useState(0.25);
  const [feedback, setFeedback] = useState(feedbackFor(0.25));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: M91State) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, 0);

      const a = s.alloc;
      const shallowLayers = Math.round(32 * a);
      const deepLayers = 32 - shallowLayers;
      const localError = (0.42 * Math.abs(a - 0.25)) / 0.25 + 0.06;
      const globalBreak = Math.max(0, a - 0.55) * 2.0;

      // ---- 上部：织面视图 ----
      drawInsetFrame(ctx, 30, 24, 1010, 146, '');
      const cx0 = 58;
      const cx1 = 1012;
      const cy = 94;

      // 局部细纹：数量随浅层块层数
      const fine = Math.round((shallowLayers / 32) * 26);
      ctx.strokeStyle = C_CROSS;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < fine; i += 1) {
        const fx = cx0 + 24 + (i * (cx1 - cx0 - 48)) / Math.max(1, fine - 1);
        ctx.beginPath();
        ctx.moveTo(fx, cy - 18);
        ctx.lineTo(fx, cy + 18);
        ctx.stroke();
      }

      // 轮廓：线宽随深层流层数（越少越细弱）
      const outlineW = 2 + (deepLayers / 32) * 9;
      ctx.strokeStyle = C_WEAVE;
      ctx.lineWidth = outlineW;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx0, cy);
      ctx.lineTo(cx1, cy);
      ctx.stroke();

      // 局部断纹：localError 越高越多
      const breaks = Math.round(localError * 9);
      ctx.strokeStyle = C_BAD;
      ctx.lineWidth = 2;
      for (let i = 0; i < breaks; i += 1) {
        const bx = cx0 + 70 + (i * (cx1 - cx0 - 140)) / Math.max(1, breaks - 1 || 1);
        ctx.beginPath();
        ctx.moveTo(bx - 7, cy - 22);
        ctx.lineTo(bx + 7, cy + 22);
        ctx.stroke();
      }

      // 全局缺口：浅层占比过高时轮廓出现缺口
      const gaps = Math.round(globalBreak * 5);
      ctx.strokeStyle = C_INSET;
      ctx.lineWidth = outlineW + 4;
      for (let i = 0; i < gaps; i += 1) {
        const gx = cx0 + 150 + (i * (cx1 - cx0 - 300)) / Math.max(1, gaps - 1 || 1);
        ctx.beginPath();
        ctx.moveTo(gx - 13, cy - outlineW - 2);
        ctx.lineTo(gx + 13, cy + outlineW + 2);
        ctx.stroke();
      }

      drawSceneLabel(ctx, 42, 42, '织面', 'muted');

      // ---- 下部：层数分配条 ----
      drawInsetFrame(ctx, 30, 182, 1010, 84, '');
      const barX = 150;
      const barMax = 700;

      ctx.fillStyle = C_AXIS;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(barX, 204, barMax, 15);
      ctx.fillRect(barX, 232, barMax, 15);
      ctx.globalAlpha = 1;

      ctx.fillStyle = C_CROSS;
      ctx.fillRect(barX, 204, (barMax * shallowLayers) / 32, 15);
      ctx.fillStyle = C_WEAVE;
      ctx.fillRect(barX, 232, (barMax * deepLayers) / 32, 15);

      // 误差条：偏离论文分配越远越长
      const ex = barX + barMax + 40;
      const eH = 56 * clamp(localError / 1.4, 0, 1);
      ctx.fillStyle = C_AXIS;
      ctx.fillRect(ex, 196, 44, 56);
      ctx.fillStyle = C_SHUTTLE;
      ctx.fillRect(ex, 196 + (56 - eH), 44, eH);

      drawSceneLabel(ctx, 42, 198, '层数分配', 'muted');

      // 图例放在上方面板的空白带内，避免压到下方面板的边框线
      drawLegend(ctx, 700, 52, [
        { color: C_CROSS, text: '浅层' },
        { color: C_WEAVE, text: '深层' },
        { color: C_SHUTTLE, text: '误差' },
      ]);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.alloc = v;
    setAlloc(v);
    setFeedback(feedbackFor(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          浅层占比 <span className="val">{Math.round(alloc * 100)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(alloc * 100)}
          onChange={onChange}
        />
        <span className="val" style={{ minWidth: 0, color: '#68778f' }}>
          误差条为教学示意，论文未报告该曲线数值
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M91;
