import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawHeroDial, DIAL_ASPECT } from '../lib/heroDial';
import type { DialOpts } from '../lib/heroDial';
import type { WidgetProps } from './registry';

// 封面左栏 · 无索引方法。
// 六根指针依次弹出，全部落在 -18°…17°（跨度 35°）的同一段刻度上；
// 三圈概念环是碎的，高亮扇区把「全挤在这里」直接圈出来。机制示意，非实测曲线。

const OPTS: DialOpts = {
  broken: true,
  sweep: 25,
  angles: [-18, -11, -4, 3, 10, 17],
  legend: 'old',
};

const BASE_W = 470;
const BASE_H = Math.round(BASE_W * DIAL_ASPECT);
// 循环节奏：依次弹出 → 保持 → 盘面内容淡出 → 重播。盘底与图例常驻。
const PLAY = 2100;
const HOLD = 900;
const FADE = 350;
const CYCLE = PLAY + HOLD + FADE;

export const HeroOldDial: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
