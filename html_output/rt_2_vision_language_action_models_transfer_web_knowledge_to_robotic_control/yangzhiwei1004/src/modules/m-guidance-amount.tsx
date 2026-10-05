import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: hybrid linked views (left kitchen counter + right instruction/token rows).
// m-guidance-amount — active module for chapters 1 and 2 (and the Hero sides).
//   chapterId === 'chap-1' : P1 slider "先看一眼的程度" drives the hand position
//                            and a right-side alignment-error bar. Red→blue→green.
//   chapterId === 'chap-2' : P6 drag the instruction card until it aligns with
//                            the fridge; two token rows merge into one sequence.
//   chapterId === 'hero'   : static-ish demo, chapter-1 behaviour.
// One dominant operation, one shared state model, immediate feedback.
// ============================================================================

const W = 720;
const H = 300;

const C = {
  bg: '#f5f8f0',
  counter: '#e7e3d8',
  counterEdge: '#cfc8b6',
  envLight: '#b8c9a7',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  soft: '#eef3fb',
};

function backdrop(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.envLight;
  ctx.globalAlpha = 0.45;
  ctx.fillRect(0, 0, W, 30);
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.counter;
  ctx.fillRect(0, 210, W, H - 210);
  ctx.strokeStyle = C.counterEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 210);
  ctx.lineTo(W, 210);
  ctx.stroke();
}

function hand(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#e8c39a';
  ctx.strokeStyle = '#c9a075';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 11, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#e8c39a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 4);
  ctx.lineTo(x + 40, y + 14);
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

export const MGuidanceAmount: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const isCh2 = chapterId === 'chap-2';
  const isHero = chapterId === 'hero';

  // shared state
  const guidance = useRef(0); // 0..100 (ch1) or align 0..100 (ch2)
  const applied = useRef(false);
  const dragging = useRef(false);
  const [value, setValue] = useState(0);
  const [fb, setFb] = useState({ text: '拖动滑块，先建立「看一眼再动手」的手感。', cls: '' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    backdrop(ctx);
    const v = guidance.current;

    if (!isCh2) {
      // ---- chapter 1 / hero: pan + plate + error bar ----
      ctx.fillStyle = '#8b9099';
      ctx.beginPath();
      ctx.ellipse(210, 218, 84, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3f444b';
      ctx.lineWidth = 2;
      ctx.stroke();
      // plate
      ctx.strokeStyle = applied.current && v >= 70 ? C.green : '#b6bcc6';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(330, 236, 30, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (applied.current && v >= 70) {
        ctx.fillStyle = 'rgba(34,141,92,0.14)';
        ctx.fill();
      }
      // hand position: v high -> closer to plate centre
      const hx = lerp(150, 330, clamp(v / 100, 0, 1));
      const hy = lerp(150, 200, clamp(v / 100, 0, 1));
      hand(ctx, hx, hy);
      // right error bar
      const ex = 470;
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(ex, 60, 34, 170);
      const err = 1 - clamp(v / 100, 0, 1);
      const barH = 170 * err;
      ctx.fillStyle = v >= 70 ? C.green : v >= 40 ? C.blue : C.red;
      ctx.fillRect(ex, 60 + (170 - barH), 34, barH);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ex - 8, 60 + 170 * 0.3);
      ctx.lineTo(ex + 42, 60 + 170 * 0.3);
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, ex - 6, 50, '对齐误差', C.muted);
    } else {
      // ---- chapter 2: fridge + draggable card + two token rows ----
      // fridge
      ctx.fillStyle = '#eef1f5';
      ctx.strokeStyle = C.counterEdge;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(126, 90, 110, 110, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c3c9d3';
      ctx.fillRect(222, 140, 5, 36);
      label(ctx, 140, 84, '冰箱', C.muted);
      // card
      const cardX = lerp(20, 130, clamp(v / 100, 0, 1));
      ctx.fillStyle = '#fffdf6';
      ctx.strokeStyle = v > 84 ? C.blue : C.muted;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(cardX, 150, 60, 42, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.axis;
      ctx.fillRect(cardX + 9, 164, 42, 3);
      ctx.fillRect(cardX + 9, 174, 30, 3);
      label(ctx, cardX + 2, 142, '口味卡', C.muted);
      hand(ctx, cardX + 52, 122);
      // token rows
      const merged = v > 84;
      const rx = 400;
      label(ctx, rx, 76, merged ? '一条序列' : '指令行', merged ? C.blue : C.muted);
      label(ctx, rx, 168, merged ? '' : '图像行', C.muted);
      const yA = merged ? 118 : 96;
      const yB = merged ? 118 : 150;
      for (let i = 0; i < 9; i++) {
        const on = i / 9 < clamp(v / 100, 0, 1);
        ctx.fillStyle = merged ? (on ? C.blue : '#c3c9d3') : on ? C.blue : '#c3c9d3';
        ctx.beginPath();
        ctx.roundRect(rx + i * 30, yA, 22, 16, 3);
        ctx.fill();
        if (!merged) {
          ctx.fillStyle = on ? C.purple : '#d5dae2';
          ctx.beginPath();
          ctx.roundRect(rx + i * 30, yB, 22, 16, 3);
          ctx.fill();
        }
      }
      if (!merged) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx + 2, 138);
        ctx.lineTo(rx + 268, 138);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');

    const tick = () => {
      render();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- interactions ----
  const setVal = (v: number) => {
    guidance.current = clamp(v, 0, 100);
    setValue(Math.round(guidance.current));
    if (!isCh2) {
      const g = guidance.current;
      setFb(
        g >= 70
          ? { text: '先看清要求，动作才落得准。', cls: 'good' }
          : g >= 40
          ? { text: '方向对了，但还不稳。', cls: '' }
          : { text: '手落在锅边，这一勺没进盘。', cls: 'bad' }
      );
    } else {
      const a = guidance.current;
      setFb(
        a >= 85
          ? { text: '指令与画面接成一条序列，模型才能读懂。', cls: 'good' }
          : a >= 50
          ? { text: '快对上了，但顺序还不稳。', cls: '' }
          : { text: '指令和画面错开了，模型读到的是一堆散乱的字。', cls: 'bad' }
      );
    }
  };

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => setVal(Number(e.target.value));

  const apply = () => {
    applied.current = true;
    // force one re-render frame
    window.requestAnimationFrame(render);
    setFb((f) =>
      !isCh2
        ? guidance.current >= 70
          ? { text: '先看清要求，动作才落得准。', cls: 'good' }
          : { text: '还是没先看清要求，这一勺又偏了。', cls: 'bad' }
        : f
    );
  };

  // pointer drag (chapter 2)
  const toLocal = (clientX: number) => {
    const box = boxRef.current;
    if (!box) return 0;
    const rect = box.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  };
  const onDown = (e: React.PointerEvent) => {
    if (!isCh2) return;
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    setVal(((toLocal(e.clientX) - 50) / 130) * 100);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!isCh2 || !dragging.current) return;
    setVal(((toLocal(e.clientX) - 50) / 130) * 100);
  };
  const onUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const nudge = (d: number) => setVal(guidance.current + d);

  return (
    <div ref={boxRef}>
      <canvas
        id={`cv-${chapterId}-m-guidance-amount`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={isCh2 ? '把口味卡拖到冰箱前对齐' : '先看一眼的程度如何影响动作'}
        style={{ touchAction: isCh2 ? 'none' : 'auto', cursor: isCh2 ? 'grab' : 'default' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <div className="ctrl">
        {isCh2 ? (
          <>
            <label>
              口味卡位置 <span className="val">{value}%</span>
            </label>
            <button type="button" className="chip" onClick={() => nudge(-5)} aria-label="向左微调">← 微调</button>
            <button type="button" className="chip" onClick={() => nudge(5)} aria-label="向右微调">微调 →</button>
          </>
        ) : (
          <>
            <label>
              先看一眼的程度 <span className="val">{value}</span>
            </label>
            <input type="range" min={0} max={100} value={value} onChange={onSlider} aria-label="先看一眼的程度" />
            <button type="button" className="chip" onClick={apply}>
              {value === 0 ? '直接下锅' : '应用到动作'}
            </button>
          </>
        )}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MGuidanceAmount;
