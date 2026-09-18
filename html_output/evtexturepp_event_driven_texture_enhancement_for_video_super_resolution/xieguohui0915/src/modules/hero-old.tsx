import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawPrint,
  drawStripes,
  drawLegend,
  drawSceneLabel,
  PAPER,
} from './halftoneKit';
import type { WidgetProps } from './registry';

// 封面左栏：只用 RGB 的传统做法。
// 两条相隔很远的 LR 帧之间是一整条空白「盲时」带；下方的纹理示意区随共享计时
// 从左到右逐级衰减成均匀灰，走完整个循环后回到起点重来。

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
const FLAT_GREY = '#8d9198';

// 右栏用的是同一条公式、同一个时间基：直接对 performance.now() 取模，
// 两侧都不保存自己的起始相位，因此永远同相。
function sharedElapsed(): number {
  return (performance.now() % LOOP_MS) / LOOP_MS;
}

export const HeroOld: React.FC<WidgetProps> = () => {
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

      // 时间轴 + 两帧之间那段空白的盲时带
      ctx.save();
      ctx.strokeStyle = PAPER.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(FRAME_LX, FRAME_Y + FRAME_H / 2 + 0.5);
      ctx.lineTo(FRAME_RX + FRAME_W, FRAME_Y + FRAME_H / 2 + 0.5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(104,119,143,0.08)';
      ctx.fillRect(BAND_X, FRAME_Y, BAND_W, FRAME_H);
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = PAPER.axis;
      ctx.strokeRect(BAND_X + 0.5, FRAME_Y + 0.5, BAND_W - 1, FRAME_H - 1);
      ctx.setLineDash([]);
      ctx.restore();

      drawPrint(ctx, FRAME_LX, FRAME_Y, FRAME_W, FRAME_H);
      drawPrint(ctx, FRAME_RX, FRAME_Y, FRAME_W, FRAME_H);

      // 纹理示意区：清晰 → 逐级衰减成均匀灰
      const front = lerp(PATCH_X, PATCH_X + PATCH_W, sweep);
      drawPrint(ctx, PATCH_X, PATCH_Y, PATCH_W, PATCH_H);
      drawStripes(ctx, PATCH_X, PATCH_Y, PATCH_W, PATCH_H, 9, { contrast: 1 });
      ctx.save();
      ctx.beginPath();
      ctx.rect(PATCH_X, PATCH_Y, Math.max(0, front - PATCH_X), PATCH_H);
      ctx.clip();
      ctx.fillStyle = FLAT_GREY;
      ctx.fillRect(PATCH_X, PATCH_Y, PATCH_W, PATCH_H);
      ctx.restore();

      // 唯一的运动元素：那道扫过去的灰化前沿
      ctx.save();
      ctx.strokeStyle = PAPER.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(front, PATCH_Y - 4);
      ctx.lineTo(front, PATCH_Y + PATCH_H + 4);
      ctx.stroke();
      ctx.restore();

      drawSceneLabel(ctx, FRAME_LX, 28, 'LR 帧');
      drawSceneLabel(ctx, 1020, PATCH_Y - 8, '纹理');
      drawLegend(ctx, PATCH_X, 270, [{ color: PAPER.orange, label: '衰减' }]);
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
        id="cv-hero-old"
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="传统做法：两帧之间是空白的盲时带，纹理一路衰减成均匀灰"
      />
      <div className="feedback info">
        盲时：两帧之间什么都没记到，运动信息是空的，纹理只能一路糊下去。
      </div>
    </>
  );
};

export default HeroOld;
