import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero contrast. The Hero renders TWO sides that both reference this widget:
//   moduleId="old" -> ASR-only single-layer frontend (thin, red, loses detail)
//   moduleId="new" -> MOSS-Audio multi-layer + time markers (rich, blue/green)
const W = 520;
const H = 150;

export const HeroCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const isOld = moduleId === 'old';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const start = performance.now();

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const phase = ((t - start) % 3000) / 3000;
      const p = easeInOutQuad(Math.min(1, phase * 1.4));

      if (isOld) {
        // single thin layer that loses detail (red)
        ctx.fillStyle = '#c43f52';
        ctx.fillRect(40, 70, 200, 10);
        // fading specks = lost detail
        for (let i = 0; i < 8; i++) {
          ctx.globalAlpha = 0.25 * (1 - p);
          ctx.fillStyle = '#76906a';
          ctx.fillRect(250 + i * 28, 62, 8, 26);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('单层前端', 40, 50);
      } else {
        // multiple stacked layers (blue + purple)
        for (let i = 0; i < 4; i++) {
          ctx.globalAlpha = 0.35 + 0.55 * (p - i * 0.15 > 0 ? Math.min(1, p - i * 0.15) : 0);
          ctx.fillStyle = i === 0 ? '#27446e' : '#7c3aed';
          ctx.fillRect(40, 52 + i * 15, 200, 9);
        }
        ctx.globalAlpha = 1;
        // orange time markers every 2s
        for (let k = 1; k <= 4; k++) {
          ctx.fillStyle = '#f07e47';
          ctx.fillRect(40 + (200 / 5) * k, 118, 3, 16);
        }
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('多层 + 时间标记', 40, 44);
      }
    };

    const tick = () => {
      draw(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startFn = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startFn, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [isOld]);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroCompare;
