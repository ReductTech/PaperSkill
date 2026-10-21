import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawHeroDial, DIAL_ASPECT } from '../lib/heroDial';
import type { DialOpts } from '../lib/heroDial';
import type { WidgetProps } from './registry';

// 封面右栏 · 本文方法。
// 同一组指针、同一时序，唯一差别是落点：铺满 -150°…160°（跨度 310°）。
// 三圈概念环完整连续，内→外 = 主题 / 短语 / 上下文。机制示意。

const OPTS: DialOpts = {
  broken: false,
  sweep: 0,
  angles: [-150, -88, -26, 36, 98, 160],
  legend: 'new',
};

const BASE_W = 470;
const BASE_H = Math.round(BASE_W * DIAL_ASPECT);
// 循环节奏与左盘一致：依次弹出 → 保持 → 盘面内容淡出 → 重播。
const PLAY = 2100;
const HOLD = 900;
const FADE = 350;
const CYCLE = PLAY + HOLD + FADE;

export const HeroNewDial: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = canvas.parentElement;
    const W = Math.max(280, Math.round(host ? host.clientWidth : BASE_W));
    const H = Math.round(W * DIAL_ASPECT);
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    let t0 = 0;
    const tick = () => {
      const t = (performance.now() - t0) % CYCLE;
      let p = 1;
      let fade = 1;
      if (t < PLAY) {
        p = t / PLAY;
      } else if (t > PLAY + HOLD) {
        fade = 1 - (t - PLAY - HOLD) / FADE;
      }
      ctx.clearRect(0, 0, W, H);
      drawHeroDial(ctx, W, H, OPTS, p, fade);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf) return;
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);
  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={BASE_W}
      height={BASE_H}
    />
  );
};
