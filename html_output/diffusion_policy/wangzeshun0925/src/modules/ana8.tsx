import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawStraightedge,
  drawSceneLabel,
  drawLegend,
  OK,
  GUIDE,
} from './woodKit';
import type { WidgetProps } from './registry';

// 类比动画（第 9 章）：刨子把板分成三段，每刨完一段就停下，刀口尺移过来量一次，
// 再从新位置刨下一段——「刨一段，停一下，再看」。
// 560×140，自动循环，2.4–3.6 s 的柔和循环。

const W = 560;
const H = 140;
const BX = 36;
const BY = 98;
const BW = 488;
const BH = 20;
const N = 37;
const SEGS = 3;
const SEG_W = BW / SEGS;
const TRAVEL = 0.66;

const BASE: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < N; i += 1) {
    out.push(4 + 3 * Math.sin(i * 0.78) + 1.6 * Math.sin(i * 1.7));
  }
  return out;
})();

const sampleArr = (arr: number[], x: number): number => {
  const fi = clamp(((x - BX) / BW) * (N - 1), 0, N - 1);
  const i0 = Math.floor(fi);
  const i1 = Math.min(N - 1, i0 + 1);
  return lerp(arr[i0], arr[i1], fi - i0);
};

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const lastRef = useRef(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (tl: number) => {
      clearScene(ctx, W, H);

      const cyc = tl % 1;
      const segF = cyc * SEGS;
      const seg = Math.min(SEGS - 1, Math.floor(segF));
      const lt = segF - seg;
      const segStart = BX + seg * SEG_W;
      const u = clamp(lt / TRAVEL, 0, 1);
      const planeX = segStart + u * SEG_W;
      const isCheck = lt > TRAVEL;

      // 已经刨过的地方削到与台面齐平
      const shown = BASE.map((v, i) => {
        const sx = BX + (BW * i) / (N - 1);
        return sx <= planeX ? 0 : v;
      });
      drawBoard(ctx, BX, BY, BW, BH, shown);

      // 已刨平的那一段：一条贴合的绿线
      ctx.strokeStyle = OK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(BX, BY);
      ctx.lineTo(planeX, BY);
      ctx.stroke();

      // 分段刻度：下一次从哪下刀
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 1;
      for (let s = 1; s < SEGS; s += 1) {
        const sx = BX + s * SEG_W;
        ctx.beginPath();
        ctx.moveTo(sx, BY - 4);
        ctx.lineTo(sx, BY + BH);
        ctx.stroke();
      }

      // 刨子：跟着还没刨平的起伏走
      const planeY = BY - sampleArr(BASE, planeX) - 1;
      drawPlane(ctx, planeX, planeY, { length: 54 });
      if (!isCheck) {
        drawShavings(ctx, planeX - 30, planeY - 2, tl * 4, 2);
      }

      // 刀口尺：移过来量刚刨完的这一段
      if (isCheck) {
        const u2 = clamp(((lt - TRAVEL) / (1 - TRAVEL)) * 1.8, 0, 1);
        drawStraightedge(ctx, segStart + 6, BY - (1 - easeOutCubic(u2)) * 26, SEG_W - 36, 0);
      }

      drawSceneLabel(ctx, isCheck ? '检查' : '走刀', BX, 26, isCheck ? OK : GUIDE);
      drawLegend(
        ctx,
        [
          { color: OK, text: '已刨平' },
          { color: GUIDE, text: '刀口尺' },
        ],
        116,
        26
      );
    };

    const tick = (ts: number) => {
      const last = lastRef.current;
      lastRef.current = ts;
      if (last !== 0) elapsedRef.current += Math.min(64, ts - last) / 1000;
      const tl = elapsedRef.current / 3.6;
      render(tl);
      setChecking((tl * SEGS) % 1 > TRAVEL);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
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

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={checking ? '刀口尺移过来检查刚刨完的一段' : '刨子刨完一段就停下'}
      />
    </div>
  );
};

export default Ana8;
