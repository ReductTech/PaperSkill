import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
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
  BAD,
  INK,
  MUTED,
} from './musicKit';
import type { WidgetProps } from './registry';

// 隐喻：几位乐手依次上台演奏同一段曲子，听众在台下比较完成度。
// 自动循环动画，无控件。

const W = 560;
const H = 140;
const CYCLE = 3300;

const LANE_X0 = 12;
const LANE_DX = 182;
const LANE_W = 168;

const TK_Y = 76;
const TK_H = 26;
const TK_N = 6;
const TKW = LANE_W / TK_N;

const NOTE_Y = 58;
const NOTE_N = 7;

const laneX = (i: number): number => LANE_X0 + i * LANE_DX;
const tkx = (i: number, k: number): number => laneX(i) + k * TKW + (TKW - 2) / 2;

// 每位乐手弹到的位置（未弹到的音不出现，差异一眼可见）
const NOTE_T: number[][] = [
  [0.05, 0.16, 0.3, 0.42, 0, 0, 0],
  [0.05, 0.15, 0.26, 0.38, 0.52, 0.66, 0],
  [0.06, 0.15, 0.24, 0.34, 0.44, 0.54, 0.66],
];
const LANE_COLOR: string[] = [BAD, BAD, OK];
const LANE_ALPHA: number[] = [0.6, 0.78, 1];

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [feedback] = useState({
    text: '同一位乐手、同一段曲子，谁弹得完整、谁中途停下，台下的听众一听便知。',
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
      const tl = t * 3;
      const local2 = clamp(tl - 2, 0, 1);
      const finale = t > 0.92;

      for (let i = 0; i < 3; i++) {
        const local = clamp(tl - i, 0, 1);
        const active = local > 0 && local < 1;
        const dim = local <= 0 ? 0.32 : local >= 1 ? 0.82 : 1;
        const color = LANE_COLOR[i];

        // 台上的追光
        if (active) {
          ctx.globalAlpha = 0.09;
          ctx.fillStyle = GUIDE;
          ctx.fillRect(laneX(i) - 5, 24, LANE_W + 10, 84);
          ctx.globalAlpha = 1;
        }

        ctx.globalAlpha = dim * LANE_ALPHA[i];

        let played = 0;
        for (let k = 0; k < NOTE_N; k++) {
          if (NOTE_T[i][k] > 0 && local >= NOTE_T[i][k]) played += 1;
        }
        const filledBars = Math.round(clamp((played / NOTE_N) * 4, 0, 4));
        drawScore(ctx, laneX(i), 30, LANE_W, 12, 4, filledBars, color);

        const kIdx = clamp(played - 1, 0, TK_N - 1);
        drawKeyboard(ctx, laneX(i), TK_Y, LANE_W, TK_H, TK_N, played > 0 ? [kIdx] : [], color);

        // 已经弹出来的音
        for (let k = 0; k < NOTE_N; k++) {
          if (NOTE_T[i][k] > 0 && local >= NOTE_T[i][k]) {
            drawNote(ctx, laneX(i) + 20 + k * 21, NOTE_Y, 6, color);
          }
        }

        // 弹过的琴键连成的乐句线
        if (played > 0) {
          const pts: number[][] = [];
          for (let k = 0; k <= kIdx; k++) pts.push([tkx(i, k), 68]);
          drawPath(ctx, pts, color, 2.5);
        }

        // 手：落在正在弹的那个键上
        const press = -3 * Math.sin(local * Math.PI * 8);
        drawHand(ctx, tkx(i, kIdx), TK_Y - 8 + press, 0.7, color);

        ctx.globalAlpha = 1;
      }

      // 台下听众：本文方法一上台，听众逐一亮起来
      const bright = finale ? 6 : Math.floor(local2 * 6);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i < bright ? OK : MUTED;
        ctx.beginPath();
        ctx.arc(68 + i * 84, 128, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      drawSceneLabel(ctx, '依次登台', LANE_X0, 20, INK);
      if (finale) drawSceneLabel(ctx, '本文方法更完整', 330, 20, OK);
      drawLegend(
        ctx,
        [
          { color: BAD, text: '基线乐手' },
          { color: OK, text: '本文方法' },
        ],
        LANE_X0,
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

export default Ana6;
