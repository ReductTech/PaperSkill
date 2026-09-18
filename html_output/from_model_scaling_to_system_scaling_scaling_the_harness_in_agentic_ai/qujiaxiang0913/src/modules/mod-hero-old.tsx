import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawSea, drawTower, drawLamp, drawBeam, drawShip, drawBars } from './lighthouseKit';

// Hero 左侧：只升级模型——塔灯功率不断提高、光束依旧散开、船停在暗处；
// 底部 drawBars「已曝光」持续上升、「船被照到」几乎不变。自动循环 3.2 秒。

const W = 1080;
const H = 300;
const LEVEL = 185;
const LAMP_X = 160;
const LAMP_Y = 45;
const SHIP_X = 880;
const SHIP_Y = 250;
const BEAM_ANGLE = 0.95;

export const ModHeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0 });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const [feedback] = useState({
    text: '只看模型规模化：灯越亮，散开的角度没变，船仍停在暗处。',
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

    const render = (s: { t: number }) => {
      const intensity = s.t; // 0..1 锯齿，功率不断提高后重置
      clearScene(ctx, W, H);
      drawSea(ctx, W, H, LEVEL);
      drawTower(ctx, LAMP_X, LEVEL, 150);
      drawLamp(ctx, LAMP_X, LAMP_Y, intensity);
      const reach = 360 + intensity * 260;
      drawBeam(ctx, LAMP_X, LAMP_Y, BEAM_ANGLE, 1.15, reach, C.beam);
      drawShip(ctx, SHIP_X, SHIP_Y, 'dark');
      drawBars(ctx, 40, 255, 560, [
        { label: '已曝光', value: 0.15 + 0.8 * intensity, color: C.beam },
        { label: '船被照到', value: 0.02, color: C.miss },
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
        <span>动画自动循环（模型规模化）</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModHeroOld;
