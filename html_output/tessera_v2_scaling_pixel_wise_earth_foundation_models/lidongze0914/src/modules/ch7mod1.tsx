import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const REF_X = 200;
const REF_Y = 142;
const PLATE = 150;
const HALF = PLATE / 2;
const TRACK_A = 200;
const TRACK_S = 560;
const LIMIT = 80;
const MATRIX_X = 795;
const MATRIX_Y = 36;
const CELL = 22;
const GAP = 2;
const GRID = 8;
const MATRIX_W = GRID * CELL + (GRID - 1) * GAP;
const ERROR_Y = MATRIX_Y + MATRIX_W + 12;
const BASE_D = 34.409;
const MATCH_DIST = 6;

interface Pt {
  x: number;
  y: number;
}

const PAIRS: Pt[] = [
  { x: -46, y: -30 },
  { x: -30, y: 10 },
  { x: -12, y: -12 },
  { x: 2, y: 30 },
  { x: 18, y: -26 },
  { x: 32, y: 6 },
  { x: 46, y: -6 },
];

const JITTER: Pt[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: -3, y: 0 },
  { x: 0, y: 3 },
  { x: 0, y: -3 },
  { x: 2, y: 2 },
  { x: -2, y: -2 },
];

const SHUFFLE = [3, 0, 6, 2, 5, 1, 4];

const ALIGN_BAD =
  '未对齐：相同星点错开，对角元偏低而非对角元仍高，重复信息没有被压掉。';
const ALIGN_NEAR = '接近对齐：部分相同星点已重合，对角元上升，继续微调另一轴。';
const ALIGN_DONE = '对齐完成：对角元→1、非对角元→0，两片互证一致且冗余被缩减。';
const CONSIST_BAD =
  '线性不一致：混合片的相关偏离凸组合目标，插值未在相关空间保持。';
const CONSIST_NEAR = '接近一致：αmix 移动中，实际相关与凸组合目标的差距正在缩小。';
const CONSIST_DONE =
  '线性一致：混合片相关符合凸组合目标；αmix→0 与 αmix→1 分别回到标准 Barlow Twins 项。';

interface SceneState {
  mode: 'align' | 'consistency';
  dx: number;
  dy: number;
  alphaMix: number;
  reachedLow: boolean;
  reachedHigh: boolean;
  dragged: boolean;
  completed: boolean;
  completedMode: 'align' | 'consistency' | null;
  completedAt: number;
  viewLength: 8 | 16;
}

interface Feedback {
  text: string;
  cls: '' | 'good' | 'bad';
}

interface Derived {
  diag: number;
  off: number;
  matched: number;
  err: number;
}

function scatter(count: number): Pt[] {
  const out: Pt[] = [];
  let s = 97;
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = -54 + (s / 233280) * 108;
    s = (s * 9301 + 49297) % 233280;
    const y = -54 + (s / 233280) * 108;
    out.push({ x, y });
  }
  return out;
}

const EXTRA_8: Pt[] = scatter(0);
const EXTRA_16 = scatter(9);

function pairDistances(dx: number, dy: number): number[] {
  return JITTER.map((j) => Math.hypot(dx + j.x, dy + j.y));
}

function deriveAlign(dx: number, dy: number): { diag: number; off: number; matched: number } {
  const ds = pairDistances(dx, dy);
  const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
  const ratio = mean / BASE_D;
  return {
    diag: clamp(Math.pow(0.21, ratio * ratio), 0, 1),
    off: clamp(0.42 * ratio * ratio, 0, 1),
    matched: ds.filter((d) => d < MATCH_DIST).length,
  };
}

function mixErrorOf(alphaMix: number): number {
  const s = Math.sin(Math.PI * alphaMix);
  return 0.3 * s * s;
}

function mixColor(c1: string, c2: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = p(c1);
  const [r2, g2, b2] = p(c2);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(
    lerp(b1, b2, t)
  )})`;
}

function noiseAt(i: number, j: number): number {
  const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function alignFeedback(s: SceneState, d: { diag: number; off: number; matched: number }): Feedback {
  if (s.completed && s.completedMode === 'align') return { text: ALIGN_DONE, cls: 'good' };
  if (d.matched > 0 || d.diag >= 0.65) return { text: ALIGN_NEAR, cls: '' };
  return { text: ALIGN_BAD, cls: 'bad' };
}

function consistFeedback(s: SceneState): Feedback {
  if (s.completed && s.completedMode === 'consistency') {
    return { text: CONSIST_DONE, cls: 'good' };
  }
  if (mixErrorOf(s.alphaMix) <= 0.2) return { text: CONSIST_NEAR, cls: '' };
  return { text: CONSIST_BAD, cls: 'bad' };
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 34, W, 34);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 34);
  ctx.lineTo(W, H - 34);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D, count: number): void {
  let s = 13;
  ctx.fillStyle = '#68778f';
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = 20 + (s / 233280) * (W - 40);
    s = (s * 9301 + 49297) % 233280;
    const y = 12 + (s / 233280) * 100;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  const half = size / 2;
  ctx.fillStyle = 'rgba(215,222,234,0.25)';
  ctx.fillRect(x - half, y - half, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - half, y - half, size, size);
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  width: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign
): void {
  ctx.fillStyle = '#21324a';
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  items.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(cx, y - 10, 14, 10);
    ctx.fillStyle = '#21324a';
    ctx.fillText(item.label, cx + 20, y);
    cx += 44 + ctx.measureText(item.label).width;
  });
}

function drawErrorBar(ctx: CanvasRenderingContext2D, value: number): void {
  ctx.fillStyle = '#d7deea';
  ctx.fillRect(MATRIX_X, ERROR_Y, MATRIX_W, 8);
  const color = value < 0.05 ? '#228d5c' : value <= 0.2 ? '#27446e' : '#c43f52';
  ctx.fillStyle = color;
  ctx.fillRect(MATRIX_X, ERROR_Y, map(clamp(value, 0, 1), 0, 1, 0, MATRIX_W), 8);
}

function drawMatrix(ctx: CanvasRenderingContext2D, s: SceneState, diag: number, off: number): void {
  const errValue = s.mode === 'align' ? off : mixErrorOf(s.alphaMix);
  for (let i = 0; i < GRID; i += 1) {
    for (let j = 0; j < GRID; j += 1) {
      const x = MATRIX_X + j * (CELL + GAP);
      const y = MATRIX_Y + i * (CELL + GAP);
      const n = noiseAt(i, j);
      if (s.mode === 'align') {
        if (i === j) {
          ctx.fillStyle = mixColor('#c43f52', '#228d5c', diag);
          ctx.fillRect(x, y, CELL, CELL);
        } else {
          const cij = clamp(off * (0.5 + 0.85 * n), 0, 1);
          ctx.globalAlpha = clamp(cij * cij * 2.2, 0, 0.85);
          ctx.fillStyle = '#c43f52';
          ctx.fillRect(x, y, CELL, CELL);
          ctx.globalAlpha = 1;
        }
      } else {
        const ta = i === j ? 0.95 : 0.1 + 0.14 * n;
        const ts = i === j ? 0.86 : 0.06 + 0.12 * n;
        const target = clamp(s.alphaMix * ta + (1 - s.alphaMix) * ts, 0, 1);
        const dev = i === j ? 0 : mixErrorOf(s.alphaMix) * 0.55 * (n > 0.5 ? 1 : -1);
        const actual = clamp(target + dev, 0, 1);
        ctx.globalAlpha = clamp(actual * 0.8, 0, 0.85);
        ctx.fillStyle = '#228d5c';
        ctx.fillRect(x, y, CELL, CELL);
        ctx.globalAlpha = 0.2 + 0.8 * clamp(Math.abs(actual - target) / 0.2, 0, 1);
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.globalAlpha = 1;
      }
    }
  }
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.strokeRect(MATRIX_X - 3, MATRIX_Y - 3, MATRIX_W + 6, MATRIX_W + 6);
  drawErrorBar(ctx, errValue);
  drawLegend(
    ctx,
    [
      { label: '对角·一致', color: '#228d5c' },
      { label: '非对角·冗余', color: '#c43f52' },
    ],
    MATRIX_X,
    266
  );
}

function renderAlign(ctx: CanvasRenderingContext2D, s: SceneState): void {
  const d = deriveAlign(s.dx, s.dy);
  const ds = pairDistances(s.dx, s.dy);
  const px = REF_X + s.dx;
  const py = REF_Y + s.dy;
  const done = s.completed && s.completedMode === 'align';

  drawPlate(ctx, REF_X, REF_Y, PLATE, done ? '#228d5c' : '#27446e');
  PAIRS.forEach((p) => drawDot(ctx, REF_X + p.x, REF_Y + p.y, 3.4, '#27446e'));

  drawPlate(ctx, px, py, PLATE, s.dragged || done ? '#228d5c' : '#27446e');
  PAIRS.forEach((p, i) => {
    drawDot(
      ctx,
      px + p.x + JITTER[i].x,
      py + p.y + JITTER[i].y,
      3.4,
      ds[i] < MATCH_DIST ? '#228d5c' : '#27446e'
    );
  });
  const extras = s.viewLength === 8 ? EXTRA_8 : EXTRA_16;
  extras.forEach((p) => drawDot(ctx, px + p.x, py + p.y, 2.2, '#68778f'));

  ds.forEach((dist, i) => {
    if (dist < MATCH_DIST) {
      const r = 4 + 2 * (1 - dist / MATCH_DIST);
      ring(ctx, px + PAIRS[i].x + JITTER[i].x, py + PAIRS[i].y + JITTER[i].y, r + 1, '#228d5c', 2.5);
    }
  });

  drawBeam(ctx, px + HALF - 14, py - HALF + 14, MATRIX_X - 16, MATRIX_Y + 30, '#68778f');
  drawMatrix(ctx, s, d.diag, d.off);
  drawSceneLabel(ctx, '参考片', REF_X, 44, 'center');
  drawSceneLabel(ctx, '第二片', px + HALF + 10, py + 4, 'left');
}

function renderConsistency(ctx: CanvasRenderingContext2D, s: SceneState): void {
  const a = s.alphaMix;
  const mixX = lerp(TRACK_A, TRACK_S, a);

  drawBeam(ctx, TRACK_A, REF_Y + HALF + 4, TRACK_S, REF_Y + HALF + 4, '#d7deea');
  drawPlate(ctx, TRACK_A, REF_Y, PLATE, '#27446e');
  PAIRS.forEach((p) => drawDot(ctx, TRACK_A + p.x, REF_Y + p.y, 3.4, '#27446e'));

  drawPlate(ctx, TRACK_S, REF_Y, PLATE, '#7c3aed');
  SHUFFLE.forEach((idx) => {
    const q = PAIRS[idx];
    drawDot(ctx, TRACK_S + q.x, REF_Y + q.y, 3.4, '#7c3aed');
  });

  drawPlate(ctx, mixX, REF_Y, PLATE, '#228d5c');
  ctx.globalAlpha = a;
  ctx.fillStyle = '#27446e';
  PAIRS.forEach((p) => drawDot(ctx, mixX + p.x, REF_Y + p.y, 3.4, '#27446e'));
  ctx.globalAlpha = 1 - a;
  ctx.fillStyle = '#7c3aed';
  SHUFFLE.forEach((idx) => {
    const q = PAIRS[idx];
    drawDot(ctx, mixX + q.x, REF_Y + q.y, 3.4, '#7c3aed');
  });
  ctx.globalAlpha = 1;

  drawBeam(ctx, mixX + HALF - 14, REF_Y - HALF + 14, MATRIX_X - 16, MATRIX_Y + 30, '#68778f');
  drawMatrix(ctx, s, 0, 0);
  drawSceneLabel(ctx, '参考片', TRACK_A, 44, 'center');
  drawSceneLabel(ctx, '第二片', mixX + HALF + 10, REF_Y + 4, 'left');
}

function renderScene(ctx: CanvasRenderingContext2D, s: SceneState, now: number): void {
  clearScene(ctx);
  drawSky(ctx, 12);
  if (s.mode === 'align') renderAlign(ctx, s);
  else renderConsistency(ctx, s);

  if (s.completed && now - s.completedAt < 900) {
    const t = easeOutCubic(clamp((now - s.completedAt) / 900, 0, 1));
    const grow = 10 + t * 12;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      MATRIX_X - grow,
      MATRIX_Y - grow,
      MATRIX_W + grow * 2,
      MATRIX_W + grow * 2
    );
    ctx.restore();
  }
}

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef({ sx: 0, sy: 0, dx: 28, dy: 20 });
  const stateRef = useRef<SceneState>({
    mode: 'align',
    dx: 28,
    dy: 20,
    alphaMix: 0.5,
    reachedLow: false,
    reachedHigh: false,
    dragged: false,
    completed: false,
    completedMode: null,
    completedAt: 0,
    viewLength: 8,
  });
  const [mode, setMode] = useState<'align' | 'consistency'>('align');
  const [alphaMix, setAlphaMix] = useState(0.5);
  const [viewLength, setViewLength] = useState<8 | 16>(8);
  const [derived, setDerived] = useState<Derived>(() => {
    const d = deriveAlign(28, 20);
    return { diag: d.diag, off: d.off, matched: d.matched, err: mixErrorOf(0.5) };
  });
  const [feedback, setFeedback] = useState<Feedback>({ text: ALIGN_BAD, cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = () => {
      renderScene(ctx, stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  const syncAlign = (s: SceneState) => {
    const d = deriveAlign(s.dx, s.dy);
    if (!s.completed && d.diag >= 0.95 && d.off <= 0.05) {
      s.completed = true;
      s.completedMode = 'align';
      s.completedAt = performance.now();
    }
    setDerived({ diag: d.diag, off: d.off, matched: d.matched, err: mixErrorOf(s.alphaMix) });
    setFeedback(alignFeedback(s, d));
  };

  const syncMix = (s: SceneState) => {
    if (s.alphaMix < 0.05) s.reachedLow = true;
    if (s.alphaMix > 0.95) s.reachedHigh = true;
    const err = mixErrorOf(s.alphaMix);
    if (!s.completed && s.reachedLow && s.reachedHigh && err <= 0.05) {
      s.completed = true;
      s.completedMode = 'consistency';
      s.completedAt = performance.now();
    }
    const d = deriveAlign(s.dx, s.dy);
    setAlphaMix(s.alphaMix);
    setDerived({ diag: d.diag, off: d.off, matched: d.matched, err });
    setFeedback(consistFeedback(s));
  };

  const localPos = (e: React.PointerEvent<HTMLCanvasElement>): Pt | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const p = localPos(e);
    if (!p) return;
    const cx = s.mode === 'align' ? REF_X + s.dx : lerp(TRACK_A, TRACK_S, s.alphaMix);
    const cy = s.mode === 'align' ? REF_Y + s.dy : REF_Y;
    if (Math.abs(p.x - cx) > HALF + 12 || Math.abs(p.y - cy) > HALF + 12) return;
    s.dragged = true;
    dragRef.current = { sx: p.x, sy: p.y, dx: s.dx, dy: s.dy };
    e.currentTarget.style.cursor = 'grabbing';
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragged) return;
    const p = localPos(e);
    if (!p) return;
    if (s.mode === 'align') {
      s.dx = clamp(dragRef.current.dx + (p.x - dragRef.current.sx), -LIMIT, LIMIT);
      s.dy = clamp(dragRef.current.dy + (p.y - dragRef.current.sy), -LIMIT, LIMIT);
      syncAlign(s);
    } else {
      s.alphaMix = clamp((p.x - TRACK_A) / (TRACK_S - TRACK_A), 0, 1);
      syncMix(s);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragged) return;
    s.dragged = false;
    e.currentTarget.style.cursor = 'grab';
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (s.mode === 'align') syncAlign(s);
    else syncMix(s);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.mode === 'align') {
      const step = e.shiftKey ? 12 : 4;
      let handled = true;
      if (e.key === 'ArrowLeft') s.dx = clamp(s.dx - step, -LIMIT, LIMIT);
      else if (e.key === 'ArrowRight') s.dx = clamp(s.dx + step, -LIMIT, LIMIT);
      else if (e.key === 'ArrowUp') s.dy = clamp(s.dy - step, -LIMIT, LIMIT);
      else if (e.key === 'ArrowDown') s.dy = clamp(s.dy + step, -LIMIT, LIMIT);
      else handled = false;
      if (handled) {
        e.preventDefault();
        syncAlign(s);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      s.alphaMix = clamp(s.alphaMix + (e.key === 'ArrowLeft' ? -0.01 : 0.01), 0, 1);
      syncMix(s);
    }
  };

  const switchMode = (m: 'align' | 'consistency') => {
    const s = stateRef.current;
    if (s.mode === m) return;
    s.mode = m;
    s.dragged = false;
    setMode(m);
    if (s.completed && s.completedMode === m) {
      setFeedback({ text: m === 'align' ? ALIGN_DONE : CONSIST_DONE, cls: 'good' });
    } else if (m === 'align') {
      setFeedback(alignFeedback(s, deriveAlign(s.dx, s.dy)));
    } else {
      setFeedback(consistFeedback(s));
    }
  };

  const onAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = stateRef.current;
    s.alphaMix = clamp(Number(e.target.value), 0, 1);
    syncMix(s);
  };

  const onReset = () => {
    const s = stateRef.current;
    s.dx = 28;
    s.dy = 20;
    s.alphaMix = 0.5;
    s.reachedLow = false;
    s.reachedHigh = false;
    s.dragged = false;
    s.completed = false;
    s.completedMode = null;
    s.completedAt = 0;
    s.viewLength = s.viewLength === 8 ? 16 : 8;
    setAlphaMix(0.5);
    setViewLength(s.viewLength);
    const d = deriveAlign(s.dx, s.dy);
    setDerived({ diag: d.diag, off: d.off, matched: d.matched, err: mixErrorOf(s.alphaMix) });
    setFeedback(
      s.mode === 'align' ? { text: ALIGN_BAD, cls: 'bad' } : { text: CONSIST_BAD, cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        aria-label="双片对齐：拖动第二张底片或使用方向键，右侧互相关矩阵实时更新"
      />
      <div className="chip-row">
        <button
          type="button"
          className={`chip${mode === 'align' ? ' selected' : ''}`}
          onClick={() => switchMode('align')}
        >
          对齐模式
        </button>
        <button
          type="button"
          className={`chip${mode === 'consistency' ? ' selected' : ''}`}
          onClick={() => switchMode('consistency')}
        >
          线性一致性
        </button>
      </div>
      {mode === 'consistency' ? (
        <div className="ctrl">
          <label>
            混合系数 αmix <span className="val">{alphaMix.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={alphaMix}
            onChange={onAlphaChange}
          />
        </div>
      ) : null}
      <div className="ctrl">
        <span className="val">λBT = 5×10⁻³</span>
        <span className="val">λmix = 1.0</span>
        <span className="val">本步 L = {viewLength}</span>
        <span className="val">模态丢弃 小概率</span>
        <button type="button" onClick={onReset}>
          重置
        </button>
      </div>
      <div className="ctrl">
        {mode === 'align' ? (
          <>
            <span className="val">对角元 {derived.diag.toFixed(2)}</span>
            <span className="val">非对角元 {derived.off.toFixed(2)}</span>
            <span className="val">重合 {derived.matched}/7</span>
          </>
        ) : (
          <>
            <span className="val">αmix {alphaMix.toFixed(2)}</span>
            <span className="val">误差 {derived.err.toFixed(2)}</span>
          </>
        )}
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch7Mod1;
