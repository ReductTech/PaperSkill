import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  inset,
  label,
  drawBox,
  drawArrow,
  drawCropBox,
  drawGrip,
} from './scene';

const W = 1080;
const H = 280;

/* 左区「图像」：3×2 色块，裁剪框在其中滑动 */
const IMG = { x: 64, y: 42, w: 468, h: 192 };
const CROP_W = 200;
const CROP_H = 130;
const CROP_MIN_X = IMG.x;
const CROP_MAX_X = IMG.x + IMG.w - CROP_W;
const CROP_MIN_Y = IMG.y;
const CROP_MAX_Y = IMG.y + IMG.h - CROP_H;

/* 图像主体（画面里的那个「东西」）恒定在偏右的位置 */
const SUBJECT = { x: IMG.x + IMG.w * 0.72, y: IMG.y + IMG.h * 0.44 };

const COLS = 3;
const ROWS = 2;
const CELL_W = IMG.w / COLS;
const CELL_H = IMG.h / ROWS;
const BLOCK_FILL = [C.light, C.dark, C.blue, C.orange, C.green, C.purple].map((c) =>
  lerpColor(c, C.white, 0.32)
);

const NEAR = 28;
const FAR = 90;

type Feedback = { text: string; cls: string };
type Crop = { x: number; y: number };
type Drag = { active: boolean; dx: number; dy: number };
type ViewsState = { crop: Crop; drag: Drag };

/* ------------------------------------------------------------------ *
 * §2 没有标签时，SSL 靠什么校准 —— 拖动裁剪框（直接操纵）
 * ------------------------------------------------------------------ */

const feedbackFor = (crop: Crop): Feedback => {
  const dx = crop.x + CROP_W / 2 - SUBJECT.x;
  const dy = crop.y + CROP_H / 2 - SUBJECT.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d <= NEAR) return { text: '框住同一主体，两个视图被拉近。', cls: 'good' };
  if (d <= FAR) return { text: '还差一点，主体没框全。', cls: '' };
  return { text: '裁掉主体了，两个视图对不上。', cls: 'bad' };
};

export const Ch2Views: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<ViewsState>({
    crop: { x: 180, y: 64 },
    drag: { active: false, dx: 0, dy: 0 },
  });
  const fbKeyRef = useRef('');
  const [cropX, setCropX] = useState(180);
  const [dragging, setDragging] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor({ x: 180, y: 64 }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawBlocks = () => {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const fill = BLOCK_FILL[r * COLS + c];
          drawBox(ctx, IMG.x + c * CELL_W, IMG.y + r * CELL_H, CELL_W, CELL_H, fill, undefined, 0);
        }
      }
    };

    const drawSubject = () => {
      const sx = SUBJECT.x;
      const sy = SUBJECT.y;
      drawBox(ctx, sx - 42, sy - 18, 84, 74, C.ink, undefined, 12);
      ctx.save();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(sx, sy - 36, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawMask = (c: Crop) => {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.fillRect(IMG.x, IMG.y, IMG.w, Math.max(0, c.y - IMG.y));
      ctx.fillRect(IMG.x, c.y + CROP_H, IMG.w, Math.max(0, IMG.y + IMG.h - c.y - CROP_H));
      ctx.fillRect(IMG.x, c.y, Math.max(0, c.x - IMG.x), CROP_H);
      ctx.fillRect(
        c.x + CROP_W,
        c.y,
        Math.max(0, IMG.x + IMG.w - c.x - CROP_W),
        CROP_H
      );
      ctx.restore();
    };

    const render = (s: ViewsState, time: number) => {
      clearScene(ctx, W, H);
      const c = s.crop;

      // 左区：完整图像 + 框外白纱 + 裁剪框
      drawBlocks();
      drawSubject();
      drawMask(c);
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(IMG.x, IMG.y, IMG.w, IMG.h);
      ctx.restore();
      drawCropBox(ctx, c.x, c.y, CROP_W, CROP_H, C.orange, s.drag.active);
      drawGrip(ctx, c.x + CROP_W / 2, c.y + CROP_H / 2, C.orange, 8);

      // 右区：白底 inset —— 按相对位置裁出并放大重绘同一组色块
      inset(ctx, 620, 28, 420, 224);
      const px = 672;
      const py = 40;
      const pw = 316;
      const ph = 164;
      const k = Math.min(pw / CROP_W, ph / CROP_H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
      ctx.translate(px + (pw - CROP_W * k) / 2, py + (ph - CROP_H * k) / 2);
      ctx.scale(k, k);
      ctx.translate(-c.x, -c.y);
      drawBlocks();
      drawSubject();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, pw, ph);
      ctx.restore();

      // 两个视图的表征点：主体越框越正，两点越近
      const dx = c.x + CROP_W / 2 - SUBJECT.x;
      const dy = c.y + CROP_H / 2 - SUBJECT.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const near = d <= NEAR;
      const gap = 14 + clamp(d / 140, 0, 1) * 154;
      const xA = 742;
      const yA = 232;
      const xB = xA + gap;
      drawArrow(ctx, xA, yA, xB, yA, near ? C.green : C.muted, 2, 7);
      ctx.save();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(xA, yA, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = near ? C.green : C.blue;
      ctx.beginPath();
      ctx.arc(xB, yA, 6 * (near ? 1 + Math.sin(time / 320) * 0.12 : 1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      label(ctx, 'z^A', xA - 14, yA, 12, C.muted, 'right');
      label(ctx, 'z^B', xB + 14, yA, 12, near ? C.green : C.muted, 'left');
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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

  const pushFeedback = (f: Feedback) => {
    const key = `${f.cls}|${f.text}`;
    if (fbKeyRef.current === key) return;
    fbKeyRef.current = key;
    setFeedback(f);
  };

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  };

  const moveCropTo = (x: number, y: number) => {
    const next: Crop = {
      x: clamp(x, CROP_MIN_X, CROP_MAX_X),
      y: clamp(y, CROP_MIN_Y, CROP_MAX_Y),
    };
    stateRef.current.crop = next;
    setCropX(next.x);
    pushFeedback(feedbackFor(next));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e);
    const c = stateRef.current.crop;
    if (p.x < c.x || p.x > c.x + CROP_W || p.y < c.y || p.y > c.y + CROP_H) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    stateRef.current.drag = { active: true, dx: p.x - c.x, dy: p.y - c.y };
    setDragging(true);
    pushFeedback(feedbackFor(c));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.drag.active) return;
    const p = toCanvas(e);
    moveCropTo(p.x - s.drag.dx, p.y - s.drag.dy);
  };

  const endDrag = () => {
    const s = stateRef.current;
    if (!s.drag.active) return;
    s.drag = { active: false, dx: 0, dy: 0 };
    setDragging(false);
    pushFeedback(feedbackFor(s.crop));
  };

  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.currentTarget.value);
    const x = CROP_MIN_X + (v / 100) * (CROP_MAX_X - CROP_MIN_X);
    stateRef.current.drag = { active: false, dx: 0, dy: 0 };
    setDragging(false);
    moveCropTo(x, stateRef.current.crop.y);
  };

  const sliderValue = Math.round(((cropX - CROP_MIN_X) / (CROP_MAX_X - CROP_MIN_X)) * 100);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      />
      <div className="ctrl">
        <label htmlFor={`crop-${chapterId}-${moduleId}`}>横向位置</label>
        <input
          id={`crop-${chapterId}-${moduleId}`}
          type="range"
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          onChange={onSlide}
          aria-label="裁剪框横向位置"
          style={{ opacity: 0.7 }}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
