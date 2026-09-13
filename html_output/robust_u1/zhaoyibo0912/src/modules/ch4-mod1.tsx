import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 4.1 —— P6：沿直线拖动时间点 t（0 = 干净，1 = 纯噪声）。
// 左区：照片噪声随 t 变化；右区：白色内衬中的直线路径 + 可拖圆点 + ε 预测箭头。
const W = 1080;
const H = 280;
const PHOTO = { x: 90, y: 30, w: 260, h: 180 };
const FCX = PHOTO.x + PHOTO.w / 2;
const FCY = PHOTO.y + PHOTO.h / 2;
const FR = 42;
const PANEL = { x: 520, y: 30, w: 500, h: 210 };
const X0 = 580;
const X1 = 960;
const PY = 120;
const ARROW_DX = -0.45;
const ARROW_DY = 0.893;
const ARROW_MAX = 100;

const INITIAL_TEXT = 't = 0.80：噪声很重，模型要预测的 ε 还很多';

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

function feedbackFor(t: number): { text: string; cls: string } {
  const v = t.toFixed(2);
  if (t < 0.05) return { text: `t = ${v}：到达干净端，恢复完成`, cls: 'good' };
  if (t <= 0.33) return { text: `t = ${v}：接近干净潜表示，图像清晰`, cls: 'good' };
  if (t <= 0.66) return { text: `t = ${v}：混合中途，模型持续减去预测的 ε`, cls: '' };
  return { text: `t = ${v}：噪声占主导，恢复还很早`, cls: '' };
}

/* ---------- 组件 ---------- */

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const stateRef = useRef({ t: 0.8 });
  const [t, setT] = useState(0.8);
  const [feedback, setFeedback] = useState({ text: INITIAL_TEXT, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.height = 'auto';
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';

    const render = (tNow: number) => {
      clearScene(ctx, W, H);

      // 左区：照片噪声随 t 变化，人脸清晰度 = 1 − t
      drawPhoto(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, tNow);
      drawFace(ctx, FCX, FCY, FR, 1 - tNow);

      // 右区：白色内衬
      roundRectPath(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 直线路径（左 = 干净端，右 = 噪声端）
      ctx.save();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X0, PY);
      ctx.lineTo(X1, PY);
      ctx.stroke();
      ctx.restore();

      // 两端点：绿色干净潜点 / 灰色噪声点
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.arc(X0, PY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#68778f';
      ctx.beginPath();
      ctx.arc(X1, PY, 9, 0, Math.PI * 2);
      ctx.fill();

      // 当前位置 + ε 预测箭头（指向左下，长度 ∝ 1 − t）
      const px = lerp(X0, X1, tNow);
      const len = (1 - tNow) * ARROW_MAX;
      if (len > 6) {
        const ex = px + len * ARROW_DX;
        const ey = PY + len * ARROW_DY;
        ctx.save();
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, PY);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        const head = lerp(5, 11, easeInOutQuad(clamp(len / ARROW_MAX, 0, 1)));
        const ang = Math.atan2(ARROW_DY, ARROW_DX);
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - head * Math.cos(ang - 0.45), ey - head * Math.sin(ang - 0.45));
        ctx.lineTo(ex - head * Math.cos(ang + 0.45), ey - head * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 可拖圆点
      ctx.save();
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(px, PY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 两个短标签
      ctx.textAlign = 'center';
      drawSceneLabel(ctx, '干净', X0, PY - 24);
      drawSceneLabel(ctx, '噪声', X1, PY - 24);
    };

    const tick = () => {
      render(stateRef.current.t);
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

  const applyT = (raw: number) => {
    const next = clamp(Math.round(clamp(raw, 0, 1) * 100) / 100, 0, 1);
    if (next === stateRef.current.t) return;
    stateRef.current.t = next;
    setT(next);
    setFeedback(feedbackFor(next));
  };

  // CSS 坐标 → Canvas 坐标（画布可能被 max-width 缩放）
  const toCanvas = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width > 0 ? W / rect.width : 1;
    const sy = rect.height > 0 ? H / rect.height : 1;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  };

  const inPanel = (x: number, y: number) =>
    x >= PANEL.x && x <= PANEL.x + PANEL.w && y >= PANEL.y && y <= PANEL.y + PANEL.h;

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvas(e.clientX, e.clientY);
    if (!inPanel(p.x, p.y)) return;
    draggingRef.current = true;
    canvas.style.cursor = 'grabbing';
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* 指针已释放：忽略 */
    }
    applyT((p.x - X0) / (X1 - X0));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvas(e.clientX, e.clientY);
    if (draggingRef.current) {
      applyT((p.x - X0) / (X1 - X0));
      return;
    }
    canvas.style.cursor = inPanel(p.x, p.y) ? 'grab' : 'default';
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !draggingRef.current) return;
    draggingRef.current = false;
    try {
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* 指针已释放：忽略 */
    }
    canvas.style.cursor = 'grab';
  };

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyT(Number(e.target.value) / 100);
  };

  const onPointerLeave = () => {
    const canvas = canvasRef.current;
    if (canvas && !draggingRef.current) canvas.style.cursor = 'default';
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={onPointerLeave}
      />
      <div className="ctrl">
        <label>
          时间步 t <span className="val">{t.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} step={1} value={Math.round(t * 100)} onChange={onSlider} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
