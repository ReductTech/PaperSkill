import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比动画：一只手握熨斗沿布面从右向左推过一次，推过的区域平滑变平整；
// 熨斗返回右端后褶皱整体缓动复原，首尾无缝，自动循环。
const W = 560;
const H = 140;
const PERIOD = 4200;
const BAND_TOP = 58;
const BAND_H = 46;
const MID = BAND_TOP + BAND_H / 2;
const PRESS_X = [40, 78, 116, 154, 192, 230, 268, 306, 344, 382, 420, 458, 496, 528];

export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const drawStatic = () => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(30, BAND_TOP, W - 60, BAND_H);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(30, BAND_TOP + BAND_H, W - 60, 6);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(30, BAND_TOP, W - 60, BAND_H + 6);
      // 布面纹理：稀疏短划线，极低对比度
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 1;
      for (let x = 52; x <= W - 60; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, BAND_TOP + 9);
        ctx.lineTo(x + 7, BAND_TOP + 9);
        ctx.moveTo(x + 14, BAND_TOP + BAND_H - 10);
        ctx.lineTo(x + 21, BAND_TOP + BAND_H - 10);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawIron = (x: number, yOff: number) => {
      ctx.fillStyle = '#68778f';
      ctx.fillRect(x - 16, 38 + yOff, 32, 12);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(x - 28, 50 + yOff, 56, 26);
      ctx.fillStyle = '#21324a';
      ctx.fillRect(x - 30, 76 + yOff, 60, 5);
    };

    const drawSteam = (x: number, now: number, strength: number) => {
      if (strength <= 0.01) return;
      ctx.save();
      ctx.fillStyle = '#d7deea';
      for (let i = 0; i < 3; i += 1) {
        const prog = (now / 900 + i / 3) % 1;
        ctx.globalAlpha = 0.16 * (1 - prog) * strength;
        ctx.beginPath();
        ctx.arc(x + (i - 1) * 9, 36 - prog * 22, 2 + prog * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const render = (now: number) => {
      drawStatic();
      const t = (now % PERIOD) / PERIOD;
      let ironX: number;
      let pressing = 0;
      if (t < 0.5) {
        ironX = lerp(W - 46, 46, easeInOutQuad(t / 0.5));
        pressing = 1;
      } else if (t < 0.62) {
        ironX = 46;
      } else if (t < 0.78) {
        ironX = lerp(46, W - 46, easeInOutQuad((t - 0.62) / 0.16));
        pressing = 0.4;
      } else {
        ironX = W - 46;
      }
      const restore = t < 0.86 ? 0 : easeInOutQuad((t - 0.86) / 0.14);

      // 褶皱：被熨斗推过的程度连续过渡，末尾整体复原
      for (let i = 0; i < PRESS_X.length; i++) {
        const x = PRESS_X[i];
        if (x > W - 34) continue;
        const level = clamp((x - ironX) / 40, 0, 1) * (1 - restore);
        const amp = lerp(8, 1, level);
        ctx.save();
        ctx.globalAlpha = 0.7 + 0.3 * Math.abs(Math.sin(i * 2.2));
        ctx.strokeStyle = lerpColor('#f07e47', '#228d5c', level);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, MID - amp);
        ctx.lineTo(x + 6, MID + amp);
        ctx.lineTo(x + 12, MID - amp);
        ctx.stroke();
        ctx.restore();
      }

      const bob = pressing > 0 ? 0 : Math.sin(now / 280) * 1.3;
      drawSteam(ironX, now, pressing);
      drawIron(ironX, bob);

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('熨平', 34, 30);
    };

    const tick = (now: number) => {
      render(now);
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
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default Ana9;
