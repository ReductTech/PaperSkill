import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  lerpColor,
  easeInOutQuad,
} from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawLegend,
  WOOD,
  WOOD_DARK,
  FIELD,
  INK,
} from './woodKit';
import type { WidgetProps } from './registry';

// Chapter 9 analogy (560x140, automatic 3.2 s loop):
// ONE board, three bands of stock of different character. The same plane crosses
// them left to right and each band gives a visibly different result — it settles
// deep into the soft band (three curls, a thick shaving), barely touches the hard
// one (one curl, a bright freshly-cut face). Board, plane and shavings all come
// from the shared woodKit helpers.

const W = 560;
const H = 140;
const LOOP = 3200;

const BX = 60;
const BW = 440;
const BY = 74;
const BH = 44;
const BAND_W = BW / 3;
const DEPTH = [10, 5, 2];
const SHAV = [3, 2, 1];
const PLANE_LEN = 54;
const PX0 = BX + 22;
const PX1 = BX + BW - 22;

const BAND_COLOR = [WOOD, lerpColor(WOOD, WOOD_DARK, 0.5), WOOD_DARK];
const FRESH = lerpColor(WOOD, FIELD, 0.62);

/**
 * 同一把刨子在 x 处从这块料上刨掉多少（像素）。跨料子边界时平滑过渡，
 * 于是刨子进入软料时会"沉"下去、进入硬料时又浮起来。
 */
function surfaceDepth(x: number, reset: number): number {
  const t = clamp((x - BX) / BAND_W, 0, 3);
  const b = Math.min(2, Math.floor(t));
  const k = clamp((t - b - 0.55) / 0.45, 0, 1);
  const e = k * k * (3 - 2 * k);
  return lerp(DEPTH[b], DEPTH[Math.min(2, b + 1)], e) * reset;
}

export const AnaBench: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (elapsed: number) => {
      const u = (elapsed % LOOP) / LOOP;

      // 时序：落下 0–0.06 → 走刀 0.06–0.78 → 停一下 0.78–0.84 → 抬起回程
      // 0.84–0.97，同时板面平滑复位（0.86–0.97），于是首尾完全衔接。
      const fwd = easeInOutQuad(clamp((u - 0.06) / 0.72, 0, 1));
      const land = clamp(u / 0.06, 0, 1);
      const lift = clamp((u - 0.84) / 0.13, 0, 1);
      const reset = 1 - clamp((u - 0.86) / 0.11, 0, 1);

      const passX = lerp(PX0, PX1, fwd);
      const cutX = u < 0.84 ? passX : PX1;
      const planeX = u < 0.84 ? passX : lerp(PX1, PX0, easeInOutQuad(clamp((u - 0.84) / 0.12, 0, 1)));
      const liftY = BY - 16;
      const planeY = lerp(lerp(liftY, BY + surfaceDepth(planeX, reset), land), liftY, lift);

      clearScene(ctx, W, H);

      // 逐段画板：左半是已经刨过的部分（薄薄一层新刨面 + 更低的木体），
      // 右半是还没刨到的部分。
      for (let b = 0; b < 3; b += 1) {
        const bx0 = BX + b * BAND_W;
        const bx1 = bx0 + BAND_W;
        const cutEnd = clamp(cutX, bx0, bx1);

        if (cutEnd > bx0 + 0.5) {
          const pts: number[][] = [];
          for (let i = 0; i <= 10; i += 1) {
            const x = bx0 + ((cutEnd - bx0) * i) / 10;
            pts.push([x, BY + surfaceDepth(x, reset)]);
          }
          // 新刨出来的那一层（越软刨得越厚，颜色越浅，就是这道"光泽"）
          ctx.beginPath();
          ctx.moveTo(bx0, BY);
          ctx.lineTo(cutEnd, BY);
          for (let i = pts.length - 1; i >= 0; i -= 1) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.closePath();
          ctx.fillStyle = FRESH;
          ctx.fill();
          // 新表面以下的木体
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.lineTo(cutEnd, BY + BH);
          ctx.lineTo(bx0, BY + BH);
          ctx.closePath();
          ctx.fillStyle = BAND_COLOR[b];
          ctx.fill();
          ctx.strokeStyle = WOOD_DARK;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        if (bx1 - cutEnd > 0.5) {
          drawBoard(ctx, cutEnd, BY, bx1 - cutEnd, BH, null, { color: BAND_COLOR[b] });
        }
      }

      // 板面轮廓：刨过的部分更低，没刨到的部分在原始高度，末端竖直相接
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(BX, BY + surfaceDepth(BX, reset));
      for (let i = 1; i <= 24; i += 1) {
        const x = BX + ((cutX - BX) * i) / 24;
        ctx.lineTo(x, BY + surfaceDepth(x, reset));
      }
      ctx.lineTo(cutX, BY);
      ctx.lineTo(BX + BW, BY);
      ctx.stroke();

      if (u > 0.06 && u < 0.8) {
        const band = Math.min(2, Math.floor(clamp((planeX - BX) / BAND_W, 0, 2.99)));
        drawShavings(ctx, planeX - 30, planeY - 4, elapsed / 340, SHAV[band]);
      }
      drawPlane(ctx, planeX, planeY, { length: PLANE_LEN });

      drawLegend(
        ctx,
        [
          { color: BAND_COLOR[0], text: '软料' },
          { color: BAND_COLOR[1], text: '中料' },
          { color: BAND_COLOR[2], text: '硬料' },
        ],
        BX,
        30
      );
    };

    const tick = () => {
      render(performance.now() - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default AnaBench;
