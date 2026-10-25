import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawKeyboard,
  drawHand,
  drawPath,
  drawScore,
  drawSceneLabel,
  drawLegend,
  seeded,
  EMPH,
  OK,
  INK,
  LINE,
} from './musicKit';
import type { WidgetProps } from './registry';

// 隐喻动画（自动循环，无控件、无反馈条）：
// 手从第一个键出发，一次连贯地滑完整小节的琴键，中途不停顿——
// 对应 π0 一次输出一整块连续动作，而不是一个音一个音地犹豫。
const W = 560;
const H = 140;
const LOOP = 3200;
const KEYS = 12;
const KB_X = 70;
const KB_Y = 96;
const KB_W = 420;
const KB_H = 26;
const KW = KB_W / KEYS;

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const rnd = seeded(41);
    const wob: number[] = [];
    for (let i = 0; i <= KEYS; i++) wob.push(rnd() * 2 - 1);

    const smooth = (t: number): number => {
      const x = clamp(t, 0, 1);
      return x * x * (3 - 2 * x);
    };
    const pathY = (u: number): number => {
      const k = clamp(u, 0, 1);
      return KB_Y - 12 * Math.sin(Math.PI * k) + wob[Math.round(k * KEYS)] * 2;
    };

    const render = (now: number): void => {
      clearScene(ctx, W, H);
      const u = (now % LOOP) / LOOP;
      const play = clamp((u - 0.12) / 0.7, 0, 1);
      const done = u > 0.88;

      // 这一小节是否弹完
      drawScore(ctx, 424, 46, 112, 12, 1, done ? 1 : 0, OK);

      // 整条虚线 = 这一小节的完整路线；实线 = 已经走过的部分
      const all: number[][] = [];
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        all.push([lerp(KB_X + KW * 0.5, KB_X + KB_W - KW * 0.5, t), pathY(t)]);
      }
      drawPath(ctx, all, LINE, 2, [7, 7]);
      drawPath(ctx, all.filter((_, i) => i / 64 <= play), EMPH, 3.5);

      // 键盘：弹过的键依次亮起，弹完转为成功色
      const lit: number[] = [];
      const n = Math.round(play * KEYS);
      for (let i = 0; i < n; i++) lit.push(i);
      drawKeyboard(ctx, KB_X, KB_Y, KB_W, KB_H, KEYS, lit, done ? OK : EMPH);

      // 手：一次连贯滑过，不停顿
      const hx = lerp(KB_X + KW * 0.5, KB_X + KB_W - KW * 0.5, smooth(play));
      drawHand(ctx, hx, pathY(play) - 8, 0.68, done ? OK : EMPH);

      drawSceneLabel(ctx, '一口气弹完', 24, 30, INK);
      drawSceneLabel(ctx, '弹完一小节', 424, 30, done ? OK : EMPH);
      drawLegend(
        ctx,
        [
          { color: EMPH, text: '已经弹过' },
          { color: LINE, text: '这一小节的路线' },
          { color: OK, text: '小节完成' },
        ],
        24,
        134
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

export default Ana3;
