import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 Module 2.1 — 在时间格上拖拽，按出观察点；右侧同步显示已观测 / 人工缺失 / 天然缺失三态。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const BORDER = '#d7deea';

const COLS = 48;
const ROWS = 37;
const GX = 470;
const GY = 56;
const GW = 400;
const GH = 178;

type Trio = { observed: number; artificial: number; natural: number };

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintedRef = useRef<Set<number>>(new Set());
  const artRef = useRef<Set<number>>(new Set());
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [ratio, setRatio] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '还没有观测点：这是一份完全缺失的输入。',
    cls: 'bad',
  });

  const total = COLS * ROWS;

  const counts = (): Trio => {
    const painted = paintedRef.current;
    const art = artRef.current;
    let observed = 0;
    let artificial = 0;
    painted.forEach((k) => {
      if (art.has(k)) artificial += 1;
      else observed += 1;
    });
    return { observed, artificial, natural: total - painted.size };
  };

  const refresh = () => {
    const c = counts();
    const r = c.observed / total;
    setRatio(r);
    if (c.observed === 0)
      setFeedback({ text: '还没有观测点：这是一份完全缺失的输入。', cls: 'bad' });
    else if (r < 0.4)
      setFeedback({
        text: `观测太少：已观测 ${Math.round(r * 100)}%，NaN 占了大多数，任何下游任务都很难工作。`,
        cls: 'bad',
      });
    else if (r < 0.9)
      setFeedback({
        text: `观测过半：已观测 ${Math.round(r * 100)}%，这就是部分观测输入的样子，NaN 仍然是合法输入。`,
        cls: '',
      });
    else
      setFeedback({
        text: `几乎全部观测：已观测 ${Math.round(r * 100)}%，此时才接近"完整数据"的假设——真实系统很少这么幸运。`,
        cls: 'good',
      });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 236, W, 26);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 236);
      ctx.lineTo(W, 236);
      ctx.stroke();

      // ---------------- left: the life view (a hand over a grid sheet) ----------------
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(60, 70, 330, 130);
      ctx.strokeRect(60, 70, 330, 130);
      for (let c = 1; c < 11; c++) {
        ctx.beginPath();
        ctx.moveTo(60 + c * 30, 70);
        ctx.lineTo(60 + c * 30, 200);
        ctx.stroke();
      }
      for (let r = 1; r < 5; r++) {
        ctx.beginPath();
        ctx.moveTo(60, 70 + r * 32.5);
        ctx.lineTo(390, 70 + r * 32.5);
        ctx.stroke();
      }
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(196, 34);
      ctx.lineTo(238, 58);
      ctx.lineTo(262, 96);
      ctx.stroke();

      // grinds hint under the hand so the life view stays inside the coffee theme
      ctx.fillStyle = '#6f4a2f';
      ctx.beginPath();
      ctx.ellipse(300, 148, 52, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // ---------------- middle/right: the observation grid ----------------
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(GX, GY, GW, GH);
      const cw = GW / COLS;
      const chh = GH / ROWS;
      const painted = paintedRef.current;
      const art = artRef.current;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const k = r * COLS + c;
          const x = GX + c * cw + 0.6;
          const y = GY + r * chh + 0.6;
          const w = Math.max(1, cw - 1.2);
          const h = Math.max(1, chh - 1.2);
          if (art.has(k)) {
            ctx.fillStyle = ORANGE;
            ctx.fillRect(x, y, w, h);
          } else if (painted.has(k)) {
            ctx.fillStyle = BLUE;
            ctx.fillRect(x, y, w, h);
          } else {
            ctx.strokeStyle = BORDER;
            ctx.strokeRect(x, y, w, h);
          }
        }
      }
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(GX, GY, GW, GH);

      // three-state bar
      const c = counts();
      const barY = 246;
      const barX = 470;
      const barW = 400;
      const segs: { n: number; color: string }[] = [
        { n: c.observed, color: BLUE },
        { n: c.artificial, color: ORANGE },
      ];
      let cx = barX;
      segs.forEach((s) => {
        const w = (s.n / total) * barW;
        ctx.fillStyle = s.color;
        ctx.fillRect(cx, barY, w, 10);
        cx += w;
      });
      ctx.strokeStyle = BORDER;
      ctx.strokeRect(barX, barY, barW, 10);

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('已观测比例', 60, 42);
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      const c2 = counts();
      ctx.fillText(`${Math.round((c2.observed / total) * 100)}%`, 200, 42);
    };

    const tick = () => {
      render();
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

  const hit = (e: React.PointerEvent<HTMLCanvasElement>): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (x < GX || x > GX + GW || y < GY || y > GY + GH) return null;
    const c = clamp(Math.floor(((x - GX) / GW) * COLS), 0, COLS - 1);
    const r = clamp(Math.floor(((y - GY) / GH) * ROWS), 0, ROWS - 1);
    return r * COLS + c;
  };

  const paintAt = (k: number | null) => {
    if (k === null) return;
    paintedRef.current.add(k);
    refresh();
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture is best-effort */
    }
    paintAt(hit(e));
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    paintAt(hit(e));
  };
  const onUp = () => {
    draggingRef.current = false;
  };

  const fillAll = () => {
    paintedRef.current = new Set<number>();
    for (let i = 0; i < total; i++) paintedRef.current.add(i);
    refresh();
  };
  const reset = () => {
    paintedRef.current = new Set<number>();
    artRef.current = new Set<number>();
    refresh();
  };
  const injectArtificial = () => {
    const art = new Set<number>();
    let i = 0;
    paintedRef.current.forEach((k) => {
      if (i % 9 === 0) art.add(k);
      i += 1;
    });
    artRef.current = art;
    refresh();
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      <div className="ctrl">
        <label>已观测比例 <span className="val">{Math.round(ratio * 100)}%</span></label>
        <button className="tiny" type="button" onClick={fillAll}>
          全部观测
        </button>
        <button className="tiny" type="button" onClick={injectArtificial}>
          注入人工缺失
        </button>
        <button className="tiny" type="button" onClick={reset}>
          清空
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
