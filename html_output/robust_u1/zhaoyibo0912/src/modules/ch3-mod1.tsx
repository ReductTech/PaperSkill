import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 3.1 —— P3 同步新旧对比（两块 540×280 面板共享同一时间轴）：
// 左：文本推理面板（照片永久损坏 → 推理卡逐行浮现 → 红 ✗）；
// 右：自恢复面板（照片在 t 0.2–0.8 间渐清 → 推理卡逐行浮现 → 绿 ✓）。
const PW = 540;
const PH = 280;
const DURATION = 2400;
const LOCK_MS = 3000;
const IDLE_BEAT = 600;

const PHOTO = { x: 30, y: 40, w: 240, h: 170 };
const CARD = { x: 30, y: 212, w: 480, h: 38 };
const FCX = PHOTO.x + PHOTO.w / 2;
const FCY = PHOTO.y + PHOTO.h / 2;
const FR = 40;

type Phase = 'idle' | 'running' | 'done';
type Mark = 'cross' | 'check';

/* ---------- 复用画布工具（签名固定） ---------- */

function roundRectPath(
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
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function rand(i: number): number {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  const top = h - 26;
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, top, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, top + 3);
  ctx.lineTo(w, top + 3);
  ctx.stroke();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
): void {
  const d = clamp(damage, 0, 1);
  roundRectPath(ctx, x, y, w, h, 7);
  ctx.fillStyle = stateColor || '#d7deea';
  ctx.fill();
  const ix = x + 3;
  const iy = y + 3;
  const iw = w - 6;
  const ih = h - 6;
  roundRectPath(ctx, ix, iy, iw, ih, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, ix, iy, iw, ih, 4);
  ctx.clip();

  const n = Math.round(140 * d);
  for (let k = 0; k < n; k++) {
    const sx = ix + rand(k * 3 + 1) * iw;
    const sy = iy + rand(k * 3 + 2) * ih;
    const sr = 1 + rand(k * 3 + 3) * 2;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = k % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const nc = d <= 0 ? 0 : Math.max(1, Math.round(2 + 2 * d));
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < nc; k++) {
    let px = ix + rand(k * 7 + 11) * iw;
    let py = iy + rand(k * 7 + 13) * ih;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let s = 0; s < 3; s++) {
      px += (rand(k * 17 + s * 3 + 19) - 0.5) * 26;
      py += (rand(k * 17 + s * 3 + 23) - 0.5) * 26;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  clarity: number
): void {
  const c = clamp(clarity, 0, 1);
  const a = 0.15 + 0.85 * c;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#21324a';
  ctx.fillStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.35, cy - r * 0.2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.12, r * 0.5, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.restore();
  if (c >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 4, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.save();
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = '#21324a';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 推理卡：三行浅色横条按 t 逐行浮现，末尾在图内画出 ✗ / ✓ 符号（不含文字）。
function drawReasoningCard(ctx: CanvasRenderingContext2D, t: number, mark: Mark): void {
  roundRectPath(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const a = clamp((t - (0.3 + i * 0.2)) / 0.1, 0, 1);
    if (a <= 0) continue;
    const barW = lerp(120, 300, a);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#d7deea';
    roundRectPath(ctx, CARD.x + 14, CARD.y + 9 + i * 10, barW, 5, 2.5);
    ctx.fill();
    ctx.restore();
  }

  if (t >= 0.95) {
    const mx = CARD.x + CARD.w - 30;
    const my = CARD.y + CARD.h / 2;
    ctx.save();
    ctx.strokeStyle = mark === 'cross' ? '#c43f52' : '#228d5c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (mark === 'cross') {
      ctx.moveTo(mx - 8, my - 8);
      ctx.lineTo(mx + 8, my + 8);
      ctx.moveTo(mx + 8, my - 8);
      ctx.lineTo(mx - 8, my + 8);
    } else {
      ctx.moveTo(mx - 9, my);
      ctx.lineTo(mx - 2, my + 8);
      ctx.lineTo(mx + 9, my - 8);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawOldPanel(ctx: CanvasRenderingContext2D, t: number): void {
  clearScene(ctx, PW, PH);
  ctx.textAlign = 'left';
  drawSceneLabel(ctx, '文本推理', 30, 28);
  // 照片全程保持损坏
  drawPhoto(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, 0.55);
  drawFace(ctx, FCX, FCY, FR, 0);
  drawReasoningCard(ctx, t, 'cross');
}

function drawNewPanel(ctx: CanvasRenderingContext2D, t: number): void {
  clearScene(ctx, PW, PH);
  ctx.textAlign = 'left';
  drawSceneLabel(ctx, '自恢复', 30, 28);
  const clr = easeInOutQuad(clamp((t - 0.2) / 0.6, 0, 1));
  drawPhoto(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, 0.55 * (1 - clr));
  drawFace(ctx, FCX, FCY, FR, clr);
  drawReasoningCard(ctx, t, 'check');
}

/* ---------- 组件 ---------- */

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const oldRef = useRef<HTMLCanvasElement>(null);
  const newRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef<{ phase: Phase; start: number; t: number; idleAt: number }>({
    phase: 'idle',
    start: 0,
    t: 0,
    idleAt: 0,
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState({ text: '按下开始对比，观察两边的推理过程', cls: '' });

  useEffect(() => {
    const oldCanvas = oldRef.current;
    const newCanvas = newRef.current;
    if (!oldCanvas || !newCanvas) return;
    let ctxOld: CanvasRenderingContext2D;
    let ctxNew: CanvasRenderingContext2D;
    try {
      ctxOld = setupCanvas(oldCanvas, PW, PH);
      ctxNew = setupCanvas(newCanvas, PW, PH);
    } catch {
      return;
    }
    // 窄屏时按比例缩放（max-width:100% 配合 height:auto），避免画面被横向压扁
    oldCanvas.style.height = 'auto';
    newCanvas.style.height = 'auto';

    const s = stateRef.current;

    const finish = () => {
      s.phase = 'done';
      setPhase('done');
      setFeedback({
        text: '文本推理说不清方向；自恢复让图像先变清晰，答案随之明确',
        cls: 'good',
      });
      setLocked(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setLocked(false), LOCK_MS);
    };

    const tick = () => {
      if (s.phase === 'running') {
        s.t = clamp((performance.now() - s.start) / DURATION, 0, 1);
        if (s.t >= 1) finish();
      } else if (s.phase === 'idle' && s.idleAt > 0) {
        if (performance.now() - s.idleAt >= IDLE_BEAT) {
          s.idleAt = 0;
          s.phase = 'running';
          s.start = performance.now();
          setPhase('running');
          setFeedback({ text: '两边同时推理中…', cls: '' });
        }
      }
      drawOldPanel(ctxOld, s.t);
      drawNewPanel(ctxNew, s.t);
      if (!oldCanvas.classList.contains('is-ready')) oldCanvas.classList.add('is-ready');
      if (!newCanvas.classList.contains('is-ready')) newCanvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    // 两块面板共享同一 rAF：只要有一块在视口内就继续（窄屏下两面板会上下堆叠）。
    let visOld = false;
    let visNew = false;
    const sync = () => {
      if (visOld || visNew) start();
      else stop();
    };
    const dOld = observeCanvas(
      oldCanvas,
      () => {
        visOld = true;
        sync();
      },
      () => {
        visOld = false;
        sync();
      }
    );
    const dNew = observeCanvas(
      newCanvas,
      () => {
        visNew = true;
        sync();
      },
      () => {
        visNew = false;
        sync();
      }
    );
    return () => {
      stop();
      dOld();
      dNew();
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const onStart = () => {
    const s = stateRef.current;
    if (s.phase === 'running') return;
    s.t = 0;
    if (phase === 'done') {
      // 定格 3 s 后允许重新开始：先回到空白对比态，再共享同一时间轴重新起跑。
      s.phase = 'idle';
      s.start = 0;
      s.idleAt = performance.now();
      setPhase('idle');
      setFeedback({ text: '等待开始', cls: '' });
    } else {
      s.phase = 'running';
      s.idleAt = 0;
      s.start = performance.now();
      setPhase('running');
      setFeedback({ text: '两边同时推理中…', cls: '' });
    }
  };

  const disabled = phase === 'running' || (phase === 'done' && locked);

  return (
    <div>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <canvas
            id={`cv-${chapterId}-${moduleId}-old`}
            ref={oldRef}
            width={PW}
            height={PH}
          />
        </div>
        <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <canvas
            id={`cv-${chapterId}-${moduleId}-new`}
            ref={newRef}
            width={PW}
            height={PH}
          />
        </div>
      </div>
      <div className="ctrl">
        <button className="tiny" onClick={onStart} disabled={disabled}>
          {phase === 'idle' ? '开始对比' : '重新对比'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
