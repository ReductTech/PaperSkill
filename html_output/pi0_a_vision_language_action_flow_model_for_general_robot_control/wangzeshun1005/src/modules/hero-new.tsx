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
  INK,
  MUTED,
  WOOD,
} from './musicKit';
import type { WidgetProps } from './registry';

// 封面右栏：π0 = 先读谱，再一口气把整小节流畅弹完的乐手。
// 自动循环动画，无控件；与 hero-old 共用 3.2s 时间基与同一套版面，便于左右对照。

const W = 560;
const H = 200;
const CYCLE = 3200;

const SX = 20;
const SY = 44;
const SW = 220;
const SH = 18;

const KX = 20;
const KY = 92;
const KWT = 380;
const KH = 46;
const KN = 8;
const KWW = KWT / KN;
const kx = (i: number): number => KX + i * KWW + (KWW - 2) / 2;

const RX = 478;
const RY = 110;
const RR = 38;

const READ_END = 0.22; // 读谱
const PLAY_END = 0.92; // 整段弹完

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [feedback] = useState('');

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
      const reading = t < READ_END;
      const done = t >= PLAY_END;
      const read = clamp(t / READ_END, 0, 1);
      const play = clamp((t - READ_END) / (PLAY_END - READ_END), 0, 1);
      const kk = clamp((play - 0.14) / 0.86, 0, 1);
      const k = clamp(Math.floor(kk * KN), 0, KN - 1);

      // 谱面：先通读一遍，再边弹边填
      if (reading) {
        drawScore(ctx, SX, SY, SW, SH, 4, Math.ceil(read * 4), GUIDE);
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = GUIDE;
        ctx.fillRect(SX + read * SW - 7, SY - 7, 14, SH + 14);
        ctx.globalAlpha = 1;
      } else {
        drawScore(ctx, SX, SY, SW, SH, 4, Math.min(4, Math.floor(play * 4) + 1), OK);
      }

      // 琴键：弹过的键一路亮起来
      const played: number[] = [];
      if (!reading) {
        for (let i = 0; i <= k; i++) played.push(i);
      }
      drawKeyboard(ctx, KX, KY, KWT, KH, KN, played, OK);

      if (!reading) {
        // 走过的键连成一条不间断的线：整小节流畅弹完
        const pts: number[][] = [];
        for (let i = 0; i <= k; i++) pts.push([kx(i), 72]);
        if (pts.length > 1) drawPath(ctx, pts, OK, 3);

        for (let i = 0; i <= k; i++) {
          ctx.globalAlpha = Math.max(0.3, 1 - (k - i) * 0.16);
          drawNote(ctx, kx(i), 58, 5.5, OK);
        }
        ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.75;
        drawNote(ctx, kx(k), 74 - 16 * ((play * 6) % 1), 7, OK);
        ctx.globalAlpha = 1;
      }

      // 手：停在谱面上读，然后落到琴键上一路走完
      const travel = easeOutCubic(clamp(play / 0.14, 0, 1));
      const fromX = SX + SW - 26;
      const fromY = 30;
      const toY = 78 - 5 * Math.sin(play * Math.PI * 10);
      const hx = reading ? fromX : lerp(fromX, kx(k), travel);
      const hy = reading ? fromY : lerp(fromY, toY, travel);
      drawHand(ctx, hx, hy, 0.9, WOOD);

      // 右下状态圈：谱面 + 收尾的对勾
      ctx.strokeStyle = reading ? GUIDE : OK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(RX, RY, RR, 0, Math.PI * 2);
      ctx.stroke();
      if (!done) {
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(RX - 22, RY + i * 12);
          ctx.lineTo(RX + 22, RY + i * 12);
          ctx.stroke();
        }
      } else {
        drawPath(
          ctx,
          [
            [RX - 18, RY + 2],
            [RX - 5, RY + 15],
            [RX + 20, RY - 14],
          ],
          OK,
          6
        );
      }

      drawSceneLabel(ctx, '先读谱再演奏', SX, 30, INK);
      if (done) drawSceneLabel(ctx, '整小节流畅弹完', 320, 40, OK);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '读谱' },
          { color: OK, text: '演奏' },
        ],
        SX,
        160
      );

      if (done) {
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = OK;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, W - 4, H - 4);
      }
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
    </div>
  );
};

export default HeroNew;
