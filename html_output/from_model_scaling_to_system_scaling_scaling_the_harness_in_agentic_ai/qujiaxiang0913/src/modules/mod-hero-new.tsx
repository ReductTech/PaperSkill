import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawSea, drawTower, drawLamp, drawBeam, drawShip, drawBars } from './lighthouseKit';

// Hero 右侧：同样功率的灯，加上透镜与值班流程，光束稳定落在船上；
// 底部 drawBars「有效命中」显著更高。自动循环 3.2 秒。

const W = 1080;
const H = 300;
const LEVEL = 185;
const LAMP_X = 160;
const LAMP_Y = 45;
const SHIP_X = 880;
const SHIP_Y = 250;
const SHIP_ANGLE = Math.atan2(SHIP_Y - LAMP_Y, SHIP_X - LAMP_X);

export const ModHeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0 });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const [feedback] = useState({
    text: '同样功率的灯，加上透镜与值班流程，光束稳定落在船上——有效命中显著提升。',
    cls: 'good',
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

    const render = (s: { t: number }) => {
      const intensity = s.t;
      clearScene(ctx, W, H);
      drawSea(ctx, W, H, LEVEL);
      drawTower(ctx, LAMP_X, LEVEL, 150);
      drawLamp(ctx, LAMP_X, LAMP_Y, intensity);
      const reach = 360 + intensity * 260;
      // 加上透镜，spread 收窄为 0.30 并正对船
      drawBeam(ctx, LAMP_X, LAMP_Y, SHIP_ANGLE, 0.30, reach, C.hit);
      drawShip(ctx, SHIP_X, SHIP_Y, 'safe');
      const hit = clamp(0.2 + 0.75 * intensity, 0, 1);
      drawBars(ctx, 40, 255, 560, [
        { label: '有效命中', value: hit, color: C.hit },
        { label: '船被照到', value: hit, color: C.hit },
      ]);
    };

    const tick = () => {
      const now = performance.now();
      stateRef.current.t = (((now - startRef.current) / 1000) / 3.2) % 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) {
        startRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
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
      <div className="ctrl">
        <span>动画自动循环（系统规模化）</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModHeroNew;
