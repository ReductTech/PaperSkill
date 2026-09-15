import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawPrint,
  drawStripes,
  drawEventDots,
  drawLegend,
  drawSceneLabel,
  PAPER,
} from './halftoneKit';
import type { WidgetProps } from './registry';

// 封面右栏：EvTexture++ 的做法。
// 同样的时间轴、同样的扫描位置，但盲时带里排满了事件点，纹理示意区不衰减，
// 反而随着扫描经过多长出一层细线。

const W = 1080;
const H = 280;
const LOOP_MS = 3000;

const FRAME_LX = 64;
const FRAME_RX = 932;
const FRAME_Y = 36;
const FRAME_W = 84;
const FRAME_H = 54;
const BAND_X = 160;
const BAND_W = 760;
const PATCH_X = 64;
const PATCH_Y = 150;
const PATCH_W = 952;
const PATCH_H = 104;
const DOT_COUNT = 260;

// 与左栏完全相同的公式：读同一个 performance.now()，不各自维护相位。
function sharedElapsed(): number {
  return (performance.now() % LOOP_MS) / LOOP_MS;
}

/** 确定性伪随机，保证每帧的点位稳定、不闪。 */
function hash01(n: number): number {
  const r = Math.sin(n * 12.9898) * 43758.5453;
  return r - Math.floor(r);
}

export const HeroNew: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (p: number) => {
      clearScene(ctx, W, H);
      const sweep = clamp(p, 0, 1);
      const bandFront = lerp(BAND_X, BAND_X + BAND_W, sweep);
      const patchFront = lerp(PATCH_X, PATCH_X + PATCH_W, sweep);

      // 时间轴 + 被事件点填满的盲时带
      ctx.save();
      ctx.strokeStyle = PAPER.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(FRAME_LX, FRAME_Y + FRAME_H / 2 + 0.5);
      ctx.lineTo(FRAME_RX + FRAME_W, FRAME_Y + FRAME_H / 2 + 0.5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(104,119,143,0.06)';
      ctx.fillRect(BAND_X, FRAME_Y, BAND_W, FRAME_H);
      ctx.strokeStyle = PAPER.axis;
      ctx.strokeRect(BAND_X + 0.5, FRAME_Y + 0.5, BAND_W - 1, FRAME_H - 1);
      ctx.restore();

      const dots: { x: number; y: number; p: number }[] = [];
      for (let k = 0; k < DOT_COUNT; k++) {
        const x = BAND_X + ((k + 0.5) / DOT_COUNT) * BAND_W;
        if (x > bandFront) break;
        const f = hash01(k);
        dots.push({
          x,
          y: FRAME_Y + 8 + f * (FRAME_H - 16),
          p: hash01(k + 977) > 0.45 ? 1 : -1,
        });
      }
      drawEventDots(ctx, dots, 'polarity');

      drawPrint(ctx, FRAME_LX, FRAME_Y, FRAME_W, FRAME_H);
      drawPrint(ctx, FRAME_RX, FRAME_Y, FRAME_W, FRAME_H);

      // 纹理示意区：不衰减，扫描过后额外长出一层细线
      drawPrint(ctx, PATCH_X, PATCH_Y, PATCH_W, PATCH_H);
      drawStripes(ctx, PATCH_X, PATCH_Y, PATCH_W, PATCH_H, 9, { contrast: 1 });
      ctx.save();
      ctx.beginPath();
      ctx.rect(PATCH_X, PATCH_Y, Math.max(0, patchFront - PATCH_X), PATCH_H);
      ctx.clip();
      ctx.strokeStyle = 'rgba(33,50,74,0.30)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = PATCH_X; x < PATCH_X + PATCH_W; x += 4.5) {
        ctx.moveTo(x + 0.5, PATCH_Y);
        ctx.lineTo(x + 0.5, PATCH_Y + PATCH_H);
      }
      ctx.stroke();
      ctx.restore();

      // 与左栏同一个运动元素：扫描前沿
      ctx.save();
      ctx.strokeStyle = PAPER.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(patchFront, PATCH_Y - 4);
      ctx.lineTo(patchFront, PATCH_Y + PATCH_H + 4);
      ctx.stroke();
      ctx.restore();

      drawSceneLabel(ctx, FRAME_LX, 28, 'LR 帧');
      drawSceneLabel(ctx, 1020, PATCH_Y - 8, '纹理');
      drawLegend(ctx, PATCH_X, 270, [
        { color: PAPER.evOn, label: '变亮' },
        { color: PAPER.evOff, label: '变暗' },
      ]);
    };

    const tick = () => {
      render(sharedElapsed());
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

  return (
    <>
      <canvas
        id="cv-hero-new"
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="本文做法：盲时带被事件点填满，纹理保持清晰并略有增强"
      />
      <div className="feedback good">
        盲时里排满事件点，变亮和变暗都被记下；纹理不糊，反而越来越清楚。
      </div>
    </>
  );
};

export default HeroNew;
