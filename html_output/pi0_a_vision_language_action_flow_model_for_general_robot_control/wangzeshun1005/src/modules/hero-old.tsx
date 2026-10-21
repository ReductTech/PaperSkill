import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
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
  BAD,
  EMPH,
  INK,
  MUTED,
  LINE,
  WOOD,
} from './musicKit';
import type { WidgetProps } from './registry';

// 封面左栏：单任务策略 = 只会按一个键的乐手。曲子一换，手就卡住或按错，画面收在红色。
// 自动循环动画，无控件；与 hero-new 共用 3.2s 时间基，便于左右对照。

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

const SWITCH_T = 0.4; // 换曲子
const FAIL_T = 0.84; // 失手定格

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const changed = t >= SWITCH_T;
      const failed = t >= FAIL_T;
      const bw = SW / 4;

      // 谱面：一开始只有它熟的那一首，换曲后要求第 3、4 小节
      if (!changed) {
        drawScore(ctx, SX, SY, SW, SH, 4, 1, GUIDE);
      } else {
        drawScore(ctx, SX, SY, SW, SH, 4, 0, BAD);
        ctx.globalAlpha = 0.45 + 0.25 * Math.abs(Math.sin(ts / 240));
        ctx.fillStyle = EMPH;
        ctx.fillRect(SX + 2 * bw + 2, SY, bw - 6, SH);
        ctx.fillRect(SX + 3 * bw + 2, SY, bw - 6, SH);
        ctx.globalAlpha = 1;
        if (failed) drawPath(ctx, [[SX + 2 * bw, SY - 10], [SX + 4 * bw, SY + SH + 10]], BAD, 3);
      }

      // 琴键：永远只亮第 3 个键
      drawKeyboard(ctx, KX, KY, KWT, KH, KN, [2], failed ? MUTED : GUIDE);
      if (changed && !failed) {
        // 新曲子要用的两个键，它不认识
        ctx.globalAlpha = 0.24 + 0.18 * Math.abs(Math.sin(ts / 240));
        ctx.fillStyle = EMPH;
        ctx.fillRect(KX + 4 * KWW, KY, KWW - 2, KH);
        ctx.fillRect(KX + 5 * KWW, KY, KWW - 2, KH);
        ctx.globalAlpha = 1;
      }
      if (failed) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = BAD;
        ctx.fillRect(KX + 3 * KWW, KY, KWW - 2, KH);
        ctx.globalAlpha = 1;
      }

      // 手：稳定按同一个键 -> 卡住 -> 想换却按错
      const win = (a: number, b: number): number => {
        if (t < a || t > b) return 0;
        return Math.sin(((t - a) / (b - a)) * Math.PI);
      };
      let hx = kx(2);
      let hy = 78;
      let press = 0;
      if (t < SWITCH_T) {
        press = Math.max(win(0.05, 0.17), win(0.24, 0.36));
      } else if (t < 0.7) {
        hx = kx(2) + 2.5 * Math.sin(ts / 70);
        hy = 78 + 1.5 * Math.sin(ts / 110);
      } else if (!failed) {
        const mp = easeInOutQuad(clamp((t - 0.7) / 0.14, 0, 1));
        hx = lerp(kx(2), kx(3), mp);
        press = win(0.7, 0.84);
      } else {
        hx = kx(3);
        hy = 80;
      }
      hy += press * 10;

      if (t >= 0.7 && !failed) {
        // 想去按新曲子要的键，结果落偏了
        drawPath(ctx, [[kx(2), 70], [kx(4), 70]], EMPH, 2, [5, 5]);
      }
      if (t >= 0.44 && t < 0.7) {
        for (let i = 0; i < 3; i++) {
          const a = ts / 300 + i * 2.1;
          ctx.fillStyle = MUTED;
          ctx.beginPath();
          ctx.arc(kx(2) + 15 * Math.cos(a), 64 + 6 * Math.sin(a), 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      drawHand(ctx, hx, hy, 0.9, failed ? BAD : WOOD);

      // 弹出的音
      if (t < SWITCH_T) {
        for (const a of [0.05, 0.24]) {
          const d = t - a;
          if (d >= 0 && d < 0.3) {
            ctx.globalAlpha = 1 - d / 0.3;
            drawNote(ctx, kx(2), 68 - 34 * (d / 0.3), 7, GUIDE);
            ctx.globalAlpha = 1;
          }
        }
      }
      if (failed) {
        drawNote(ctx, kx(3), 60, 7.5, BAD);
        drawPath(ctx, [[kx(3) - 11, 68], [kx(3) + 11, 46]], BAD, 3);
      }

      // 右下状态圈：圈里永远只有那一个键
      const shake = t >= 0.44 && !failed ? 1.6 * Math.sin(ts / 60) : 0;
      ctx.strokeStyle = failed ? BAD : t >= 0.44 ? MUTED : GUIDE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(RX + shake, RY, RR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(RX - 30 + shake, RY - 16, 60, 32);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(RX - 30 + shake, RY - 16, 60, 32);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = failed ? MUTED : GUIDE;
      ctx.fillRect(RX - 28 + shake, RY - 14, 26, 28);
      ctx.globalAlpha = 1;
      if (failed) {
        drawPath(ctx, [[RX + shake - 20, RY - 20], [RX + shake + 20, RY + 20]], BAD, 5);
        drawPath(ctx, [[RX + shake - 20, RY + 20], [RX + shake + 20, RY - 20]], BAD, 5);
      }

      drawSceneLabel(ctx, '只会一首曲子', SX, 30, INK);
      if (failed) drawSceneLabel(ctx, '换曲子就失手', 320, 40, BAD);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '只认一个键' },
          { color: BAD, text: '换曲失手' },
        ],
        SX,
        160
      );

      if (failed) {
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = BAD;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = BAD;
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

export default HeroOld;
