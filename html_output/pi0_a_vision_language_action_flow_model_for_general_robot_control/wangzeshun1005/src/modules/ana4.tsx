import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawInstrument,
  drawHand,
  drawNote,
  drawSceneLabel,
  drawLegend,
  seeded,
  WOOD,
  DARK,
  AUX,
  OK,
  INK,
} from './musicKit';
import type { WidgetProps } from './registry';

// 隐喻动画（自动循环，无控件、无反馈条）：
// 同一只手依次落到钢琴、吉他、鼓上，每一次都能起音——
// 对应同一套权重面对不同机器人构型都能输出动作。
const W = 560;
const H = 140;
const LOOP = 3400;

interface Target {
  x: number;
  y: number;
  kind: string;
  color: string;
}

const TARGETS: Target[] = [
  { x: 130, y: 111, kind: 'piano', color: WOOD },
  { x: 280, y: 104, kind: 'guitar', color: DARK },
  { x: 430, y: 107, kind: 'drum', color: AUX },
];
// 每个循环内的到达时刻（到达后停留、再前往下一个）
const ARRIVE: number[] = [0.372, 0.652, 0.932];

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [, setReady] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const rnd = seeded(23);
    const breathe: number[] = [];
    for (let i = 0; i < 3; i++) breathe.push(rnd());

    const smooth = (t: number): number => {
      const x = clamp(t, 0, 1);
      return x * x * (3 - 2 * x);
    };

    // 依次访问三件乐器：每段前 35% 停留、随后移动、最后 25% 停留
    const xAt = (u: number): number => {
      if (u < 0.12 || u > 0.96) return TARGETS[0].x;
      const seg = [[0.12, 0.4], [0.4, 0.68], [0.68, 0.96]];
      for (let i = 0; i < seg.length; i++) {
        const a = seg[i][0];
        const b = seg[i][1];
        if (u >= a && u <= b) {
          const k = (u - a) / (b - a);
          const move = clamp((k - 0.35) / 0.4, 0, 1);
          return lerp(TARGETS[i].x, TARGETS[i + 1].x, smooth(move));
        }
      }
      return TARGETS[0].x;
    };

    const render = (now: number): void => {
      clearScene(ctx, W, H);
      const u = (now % LOOP) / LOOP;

      // 三件乐器
      for (const t of TARGETS) drawInstrument(ctx, t.x, t.y, 0.55, t.kind, t.color);

      // 手：下落到当前乐器时轻微下沉
      const x = xAt(u);
      let dip = 0;
      for (const a of ARRIVE) {
        dip = Math.max(dip, 1 - clamp(Math.abs(u - a) / 0.09, 0, 1));
      }
      const hy = lerp(64, 86, dip);
      drawHand(ctx, x, hy, 0.7, OK);

      // 起音脉冲
      for (let i = 0; i < ARRIVE.length; i++) {
        const k = (u - ARRIVE[i]) / 0.18;
        if (k > 0 && k < 1) {
          const t = TARGETS[(i + 1) % 3];
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = OK;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y - 34, 8 + k * 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          drawNote(ctx, t.x, t.y - 46 - k * 12, 7, OK);
        }
      }
      // 循环开头停在钢琴上时的收尾音符
      const tail = breathe[0] * 2 + Math.sin(now / 640) * 1.5;
      if (u < 0.12) drawNote(ctx, TARGETS[0].x, 58 + tail, 6, OK);

      drawSceneLabel(ctx, '同一只手', 20, 30, INK);
      drawSceneLabel(ctx, '都能起音', 440, 30, OK);
      drawLegend(
        ctx,
        [
          { color: WOOD, text: '钢琴' },
          { color: DARK, text: '吉他' },
          { color: AUX, text: '鼓' },
        ],
        20,
        136
      );
    };

    const tick = (now: number): void => {
      render(now);
      if (!canvas.classList.contains('is-ready')) {
        canvas.classList.add('is-ready');
        setReady(true);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
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
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana4;
