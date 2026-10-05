import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawKeyboard,
  drawHand,
  drawPath,
  drawScore,
  drawNote,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  EMPH,
  INK,
  WOOD,
} from './musicKit';
import type { WidgetProps } from './registry';

// 隐喻：乐手先广泛练各种曲子（预训练），再为某一场演出反复排练某一段（后训练）。
// 自动循环动画，无控件。

const W = 560;
const H = 140;
const CYCLE = 3200;

const CARD_X = 24;
const CARD_W = 120;
const CARD_H = 12;
const CARD_Y: number[] = [40, 56, 72, 88];

const KB_X = 312;
const KB_Y = 68;
const KB_W = 212;
const KB_H = 30;
const KB_N = 8;
const KW = KB_W / KB_N;
const keyX = (i: number): number => KB_X + i * KW + (KW - 2) / 2;

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [feedback] = useState({
    text: '左边先广泛练各种曲子打底，右边再为一场演出反复排练某一段：这正是预训练与后训练的分工。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ts: number) => {
      clearScene(ctx, W, H);
      const t = (ts % CYCLE) / CYCLE;
      const read = clamp(t / 0.42, 0, 1);
      const move = easeOutCubic(clamp((t - 0.42) / 0.14, 0, 1));
      const play = clamp((t - 0.56) / 0.44, 0, 1);

      // 左：广泛涉猎的多种曲子，逐首被练起来
      for (let i = 0; i < CARD_Y.length; i++) {
        const gate = clamp((read - i * 0.24) / 0.24, 0, 1);
        const filled = Math.round(gate * 4);
        drawScore(ctx, CARD_X, CARD_Y[i], CARD_W, CARD_H, 4, filled, gate > 0 && gate < 1 ? EMPH : OK);
      }

      // 右：为这一场演出反复打磨的那一段
      const filledR = play >= 1 ? 4 : Math.ceil(play * 4);
      drawScore(ctx, KB_X, 36, KB_W, 12, 4, filledR, EMPH);

      const k = clamp(Math.floor(play * KB_N), 0, KB_N - 1);
      drawKeyboard(ctx, KB_X, KB_Y, KB_W, KB_H, KB_N, play > 0 ? [k] : [], EMPH);

      // 已经弹过的键连成一条线：一次连贯的小节
      if (play > 0.04) {
        const pts: number[][] = [];
        for (let i = 0; i <= k; i++) pts.push([keyX(i), 58]);
        drawPath(ctx, pts, OK, 2.5);
      }

      // 手：先在左侧谱堆上练，再落到右侧琴键
      const leftX = CARD_X + CARD_W - 26;
      const leftY = 30 + read * 56;
      const rightX = keyX(k);
      const rightY = 54 - 5 * Math.sin(play * Math.PI * 8);
      const hx = lerp(leftX, rightX, move);
      const hy = lerp(leftY, rightY, move);
      if (move > 0.02 && move < 0.98) {
        drawPath(
          ctx,
          [[leftX, leftY + 10], [lerp(leftX, rightX, 0.5), leftY + 36], [hx, hy + 10]],
          GUIDE,
          2,
          [6, 6]
        );
      }
      drawHand(ctx, hx, hy, 0.85, WOOD);

      // 排练中飘出的音符
      if (play > 0.02) {
        const frac = (play * 4) % 1;
        ctx.globalAlpha = 0.85;
        drawNote(ctx, rightX, 62 - 22 * frac, 6, EMPH);
        ctx.globalAlpha = 1;
      }

      drawSceneLabel(ctx, '广泛练曲', CARD_X, 28, INK);
      drawSceneLabel(ctx, '专门排练', KB_X, 28, INK);
      drawLegend(
        ctx,
        [
          { color: OK, text: '预训练' },
          { color: EMPH, text: '后训练' },
        ],
        24,
        112
      );
    };

    const tick = (ts: number) => {
      render(ts);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default Ana5;
