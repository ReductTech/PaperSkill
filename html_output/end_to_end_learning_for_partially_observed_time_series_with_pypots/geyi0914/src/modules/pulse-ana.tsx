import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { SCENE, drawKettle, drawDripper, drawBed, drawCounter } from './pots-kit';

// §7 断流注入：水柱被节奏性地截成小段，一段段落入粉层；壶与计时器位置不变。
const W = 560;
const H = 140;

export const PulseAna: React.FC<WidgetProps> = () => {
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

    const CX = 330;
    const TOP_Y = 52;
    const BOT_Y = 96;

    const render = (time: number) => {
      const t = (time % 2800) / 2800;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = SCENE.bg;
      ctx.fillRect(0, 0, W, H);
      drawCounter(ctx, W, 124);

      drawDripper(ctx, CX, TOP_Y, BOT_Y, 124, 74);
      drawBed(ctx, CX, BOT_Y - 6, 52, (u) => 11 + 4 * Math.max(0, 1 - Math.abs(u - 0.42) * 3));

      // 壶固定
      const tip = drawKettle(ctx, 470, 46, 19, -0.6, SCENE.blue);

      // 分段水流：四小段沿同一条路径依次下落
      const phase = (t * 4) % 1;
      const endX = CX;
      const endY = BOT_Y - 18;
      for (let i = 0; i < 4; i++) {
        const p = ((i + phase) % 4) / 4;
        const sx = tip.tipX + (endX - tip.tipX) * p;
        const sy = tip.tipY + (endY - tip.tipY) * p;
        ctx.strokeStyle = SCENE.green;
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 1.5, sy + 7);
        ctx.stroke();
      }

      // 浸润痕迹：一段一段点亮
      ctx.fillStyle = 'rgba(34,141,92,0.45)';
      for (let i = 0; i < 4; i++) {
        if (((t * 4) % 4) < i) continue;
        ctx.fillRect(CX - 46 + i * 24, BOT_Y - 18, 17, 8);
      }

      // 计时器（静止的表盘 + 走动的指针）
      ctx.strokeStyle = SCENE.dark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(110, 82, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(110, 82);
      ctx.lineTo(110 + Math.cos(t * Math.PI * 2) * 18, 82 + Math.sin(t * Math.PI * 2) * 18);
      ctx.stroke();

      ctx.fillStyle = SCENE.ink;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('一段一段地浇', 20, 24);
    };

    const tick = () => {
      render(performance.now());
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

  return <canvas id="cv-pulse-ana" ref={canvasRef} width={W} height={H} />;
};

export default PulseAna;
